import { Doc, Id } from '../_generated/dataModel';
import { MutationCtx, QueryCtx } from '../_generated/server';

// Allocate credits to a user
export async function allocateCredits(
  ctx: MutationCtx,
  params: {
    userId: Id<'users'>;
    creditType: string;
    amount: number;
    source: Doc<'usageCredits'>['source'];
    sourceReference?: string;
    expiresInDays?: number;
    canRollover?: boolean;
    notes?: string;
  }
): Promise<Id<'usageCredits'>> {
  const now = Date.now();
  const expiresAt = params.expiresInDays
    ? now + params.expiresInDays * 24 * 60 * 60 * 1000
    : undefined;

  return await ctx.db.insert('usageCredits', {
    userId: params.userId,
    creditType: params.creditType,
    availableCredits: params.amount,
    usedCredits: 0,
    totalAllocated: params.amount,
    periodStart: now,
    periodEnd: expiresAt || now + 30 * 24 * 60 * 60 * 1000, // Default 30 days
    expiresAt,
    source: params.source,
    sourceReference: params.sourceReference,
    canRollover: params.canRollover ?? false,
    isActive: true,
    notes: params.notes,
    createdAt: now,
    updatedAt: now,
  });
}

// Allocate subscription credits (called when subscription is created/renewed)
export async function allocateSubscriptionCredits(
  ctx: MutationCtx,
  userId: Id<'users'>,
  subscriptionId: string,
  tier: string
): Promise<void> {
  // Get rules for this tier that include credits
  const rules = await ctx.db
    .query('usageRules')
    .withIndex('by_tier', (q) =>
      q
        .eq(
          'tierLevel',
          tier as 'free' | 'pro' | 'team' | 'enterprise' | 'lifetime' | 'custom'
        )
        .eq('isActive', true)
    )
    .filter((q) => q.gt(q.field('includesCredits'), 0))
    .collect();

  for (const rule of rules) {
    if (!rule.includesCredits) continue;

    // Calculate period boundaries based on refresh period
    let periodEnd: number;
    let expiresAt: number | undefined;

    const now = Date.now();
    switch (rule.creditRefreshPeriod) {
      case 'daily':
        periodEnd = now + 24 * 60 * 60 * 1000;
        expiresAt = periodEnd;
        break;
      case 'weekly':
        periodEnd = now + 7 * 24 * 60 * 60 * 1000;
        expiresAt = periodEnd;
        break;
      case 'monthly':
        periodEnd = now + 30 * 24 * 60 * 60 * 1000;
        expiresAt = rule.rolloverCredits ? undefined : periodEnd;
        break;
      case 'yearly':
        periodEnd = now + 365 * 24 * 60 * 60 * 1000;
        expiresAt = rule.rolloverCredits ? undefined : periodEnd;
        break;
      case 'never':
        periodEnd = now + 100 * 365 * 24 * 60 * 60 * 1000; // 100 years
        expiresAt = undefined;
        break;
      default:
        periodEnd = now + 30 * 24 * 60 * 60 * 1000;
        expiresAt = periodEnd;
    }

    // Check for existing subscription credits to avoid duplicates
    const existingCredit = await ctx.db
      .query('usageCredits')
      .withIndex('by_source', (q) =>
        q.eq('source', 'subscription').eq('sourceReference', subscriptionId)
      )
      .filter((q) =>
        q.and(
          q.eq(q.field('creditType'), rule.metricType),
          q.eq(q.field('isActive'), true),
          q.gt(q.field('periodEnd'), now)
        )
      )
      .first();

    if (!existingCredit) {
      await allocateCredits(ctx, {
        userId,
        creditType: rule.metricType,
        amount: rule.includesCredits,
        source: 'subscription',
        sourceReference: subscriptionId,
        expiresInDays: expiresAt
          ? Math.ceil((expiresAt - now) / (24 * 60 * 60 * 1000))
          : undefined,
        canRollover: rule.rolloverCredits,
        notes: `${tier} subscription credits for ${rule.name}`,
      });
    }
  }
}

// Handle credit rollover (called by scheduler)
export async function processRollovers(ctx: MutationCtx): Promise<void> {
  const now = Date.now();

  // Find credits that have expired but can rollover
  const expiredCredits = await ctx.db
    .query('usageCredits')
    .withIndex('by_expiry', (q) => q.lt('expiresAt', now))
    .filter((q) => q.and(
      q.eq(q.field('isActive'), true),
      q.eq(q.field('canRollover'), true)
    ))
    .collect();

  for (const credit of expiredCredits) {
    const remaining = credit.availableCredits - credit.usedCredits;

    if (remaining > 0) {
      // Get the rule to check max rollover
      const rules = await ctx.db
        .query('usageRules')
        .filter((q) =>
          q.and(
            q.eq(q.field('metricType'), credit.creditType),
            q.eq(q.field('isActive'), true)
          )
        )
        .first();

      const maxRollover = rules?.maxRollover || remaining;
      const rolloverAmount = Math.min(remaining, maxRollover);

      // Create new credit record for rollover
      await allocateCredits(ctx, {
        userId: credit.userId,
        creditType: credit.creditType,
        amount: rolloverAmount,
        source: 'rollover',
        sourceReference: credit._id,
        expiresInDays: 30, // Rollover credits expire in 30 days by default
        canRollover: false, // Rollover credits don't roll over again
        notes: `Rolled over ${rolloverAmount} credits from ${credit.sourceReference}`,
      });
    }

    // Mark original credit as inactive
    await ctx.db.patch(credit._id, {
      isActive: false,
      updatedAt: now,
    });
  }
}

// Purchase credits (one-time)
export async function purchaseCredits(
  ctx: MutationCtx,
  params: {
    userId: Id<'users'>;
    creditType: string;
    amount: number;
    orderId: string;
    expiresInDays?: number;
  }
): Promise<Id<'usageCredits'>> {
  return await allocateCredits(ctx, {
    userId: params.userId,
    creditType: params.creditType,
    amount: params.amount,
    source: 'purchase',
    sourceReference: params.orderId,
    expiresInDays: params.expiresInDays || 365, // Default 1 year expiry
    canRollover: false,
    notes: `Purchased ${params.amount} ${params.creditType} credits`,
  });
}

// Grant promotional credits
export async function grantPromotionalCredits(
  ctx: MutationCtx,
  params: {
    userId: Id<'users'>;
    creditType: string;
    amount: number;
    reason: string;
    expiresInDays?: number;
  }
): Promise<Id<'usageCredits'>> {
  return await allocateCredits(ctx, {
    userId: params.userId,
    creditType: params.creditType,
    amount: params.amount,
    source: 'promotion',
    sourceReference: `promo_${Date.now()}`,
    expiresInDays: params.expiresInDays || 30, // Default 30 days for promos
    canRollover: false,
    notes: params.reason,
  });
}

// Get credit balance for a user
export async function getCreditBalance(
  ctx: QueryCtx,
  userId: Id<'users'>,
  creditType?: string
): Promise<{
  credits: Array<{
    type: string;
    available: number;
    used: number;
    total: number;
    expiresAt?: number;
    source: string;
  }>;
  totalAvailable: number;
}> {
  const query = ctx.db
    .query('usageCredits')
    .withIndex('by_user_active', (q) =>
      q.eq('userId', userId).eq('isActive', true)
    );

  let credits = await query.collect();

  // Filter by credit type if specified
  if (creditType) {
    credits = credits.filter((c) => c.creditType === creditType);
  }

  // Filter out expired credits
  const now = Date.now();
  credits = credits.filter((c) => !c.expiresAt || c.expiresAt > now);

  // Group by type
  const creditsByType: Record<string, typeof credits> = {};
  for (const credit of credits) {
    if (!creditsByType[credit.creditType]) {
      creditsByType[credit.creditType] = [];
    }
    creditsByType[credit.creditType].push(credit);
  }

  const result = Object.entries(creditsByType).map(([type, typeCredits]) => {
    const available = typeCredits.reduce(
      (sum, c) => sum + (c.availableCredits - c.usedCredits),
      0
    );
    const used = typeCredits.reduce((sum, c) => sum + c.usedCredits, 0);
    const total = typeCredits.reduce((sum, c) => sum + c.totalAllocated, 0);
    const earliestExpiry = typeCredits
      .filter((c) => c.expiresAt)
      .map((c) => c.expiresAt!)
      .sort()[0];

    // Get most common source
    const sourceCounts: Record<string, number> = {};
    for (const c of typeCredits) {
      sourceCounts[c.source] = (sourceCounts[c.source] || 0) + 1;
    }
    const primarySource =
      Object.entries(sourceCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ||
      'unknown';

    return {
      type,
      available,
      used,
      total,
      expiresAt: earliestExpiry,
      source: primarySource,
    };
  });

  const totalAvailable = result.reduce((sum, c) => sum + c.available, 0);

  return {
    credits: result,
    totalAvailable,
  };
}

// Expire old credits (called by scheduler)
export async function expireOldCredits(ctx: MutationCtx): Promise<void> {
  const now = Date.now();

  // Find and deactivate expired credits
  const expiredCredits = await ctx.db
    .query('usageCredits')
    .withIndex('by_expiry', (q) => q.lt('expiresAt', now))
    .filter((q) => q.and(
      q.eq(q.field('isActive'), true),
      q.eq(q.field('canRollover'), false)
    ))
    .collect();

  for (const credit of expiredCredits) {
    await ctx.db.patch(credit._id, {
      isActive: false,
      updatedAt: now,
    });
  }
}

// Transfer credits between users (for team/org features)
export async function transferCredits(
  ctx: MutationCtx,
  params: {
    fromUserId: Id<'users'>;
    toUserId: Id<'users'>;
    creditType: string;
    amount: number;
    reason?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  // Check if sender has enough credits
  const senderBalance = await getCreditBalance(
    ctx,
    params.fromUserId,
    params.creditType
  );
  const availableCredits =
    senderBalance.credits.find((c) => c.type === params.creditType)
      ?.available || 0;

  if (availableCredits < params.amount) {
    return {
      success: false,
      error: `Insufficient credits. Available: ${availableCredits}, Requested: ${params.amount}`,
    };
  }

  // Deduct from sender (consume credits)
  const senderCredits = await ctx.db
    .query('usageCredits')
    .withIndex('by_user', (q) =>
      q
        .eq('userId', params.fromUserId)
        .eq('creditType', params.creditType)
        .eq('isActive', true)
    )
    .collect();

  let remaining = params.amount;
  for (const credit of senderCredits) {
    if (remaining <= 0) break;

    const available = credit.availableCredits - credit.usedCredits;
    const toDeduct = Math.min(available, remaining);

    await ctx.db.patch(credit._id, {
      usedCredits: credit.usedCredits + toDeduct,
      updatedAt: Date.now(),
    });

    remaining -= toDeduct;
  }

  // Add to receiver
  await allocateCredits(ctx, {
    userId: params.toUserId,
    creditType: params.creditType,
    amount: params.amount,
    source: 'bonus',
    sourceReference: `transfer_from_${params.fromUserId}`,
    expiresInDays: 90, // Transfer credits expire in 90 days
    notes: params.reason || `Transferred from another user`,
  });

  return { success: true };
}

// Export as object for easier importing
export const creditManager = {
  allocateCredits: async (
    ctx: MutationCtx,
    userId: Id<'users'>,
    amount: number,
    source: 'subscription' | 'purchase' | 'promotion' | 'bonus' | 'rollover' | 'compensation',
    options?: {
      expiresAt?: number | null;
      canRollover?: boolean;
      metadata?: Record<string, any>;
    }
  ) => {
    return allocateCredits(ctx, {
      userId,
      creditType: 'general',
      amount,
      source,
      sourceReference: source,
      expiresInDays: options?.expiresAt ? Math.ceil((options.expiresAt - Date.now()) / (1000 * 60 * 60 * 24)) : undefined,
      notes: JSON.stringify(options?.metadata || {}),
    });
  },
  consumeCredits: async (
    ctx: MutationCtx,
    userId: Id<'users'>,
    amount: number,
    metricType: string
  ) => {
    // Get available credits
    const balance = await getCreditBalance(ctx as any, userId, 'general');

    if (balance.totalAvailable < amount) {
      throw new Error(`Insufficient credits: ${balance.totalAvailable} available, ${amount} required`);
    }

    // Deduct credits from oldest first
    const credits = await ctx.db
      .query('usageCredits')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => 
        q.and(
          q.eq(q.field('creditType'), 'general'),
          q.gt(q.field('availableCredits'), q.field('usedCredits'))
        )
      )
      .order('asc')
      .collect();

    let remaining = amount;
    for (const credit of credits) {
      if (remaining <= 0) break;
      
      const available = credit.availableCredits - credit.usedCredits;
      const toDeduct = Math.min(available, remaining);
      
      await ctx.db.patch(credit._id, {
        usedCredits: credit.usedCredits + toDeduct,
        updatedAt: Date.now(),
      });
      
      remaining -= toDeduct;
    }

    return {
      success: true,
      consumed: amount,
      remaining: balance.totalAvailable - amount,
    };
  },
  transferCredits: async (
    ctx: MutationCtx,
    fromUserId: Id<'users'>,
    toUserId: Id<'users'>,
    amount: number
  ) => {
    return transferCredits(ctx, {
      fromUserId,
      toUserId,
      creditType: 'general',
      amount,
      reason: 'Transfer between users',
    });
  },
  getCreditBalance: async (ctx: QueryCtx | MutationCtx, userId: Id<'users'>) => {
    return getCreditBalance(ctx as any, userId, 'general');
  },
};
