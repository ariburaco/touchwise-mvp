import { v } from 'convex/values';
import { authedMutation } from '../helpers/queryHelpers';
import { 
  checkUsageLimit, 
  recordUsage, 
  estimateTokens,
  mutationWithUsage 
} from '../helpers/usageHelpers';
import { ConvexError } from 'convex/values';

/**
 * Example 1: API Call with Rate Limiting
 * Demonstrates basic API call tracking with rate limits
 */
export const apiCallExample = authedMutation({
  args: {
    endpoint: v.string(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    // Check if user can make API call
    const canProceed = await checkUsageLimit(
      ctx,
      ctx.userId,
      'api_calls',
      1, // 1 API call
      'external_api'
    );

    if (!canProceed.allowed) {
      throw new ConvexError(`API limit exceeded: ${canProceed.reason}`);
    }

    // Track the API call
    await recordUsage(ctx, ctx.userId, {
      eventType: 'api_call',
      metricType: 'api_calls',
      amount: 1,
      feature: 'external_api',
      endpoint: args.endpoint,
      metadata: {
        timestamp: Date.now(),
        dataSize: JSON.stringify(args.data).length,
      }
    });

    // Perform the actual API operation
    // ... your API logic here ...

    return { 
      success: true, 
      remaining: canProceed.remaining 
    };
  },
});

/**
 * Example 2: AI Token Usage
 * Demonstrates AI token tracking with estimation and actual consumption
 */
export const aiGenerationExample = authedMutation({
  args: {
    prompt: v.string(),
    model: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const model = args.model || 'gpt-3.5-turbo';
    
    // Estimate tokens before making the request
    const estimatedTokens = estimateTokens(args.prompt);
    
    // Add buffer for response tokens (typically 2x input)
    const totalEstimated = estimatedTokens * 2;

    // Check if user has enough tokens
    const canProceed = await checkUsageLimit(
      ctx,
      ctx.userId,
      'ai_tokens',
      totalEstimated,
      'ai_generation'
    );

    if (!canProceed.allowed) {
      throw new ConvexError(
        `Insufficient AI tokens. Required: ${totalEstimated}, Available: ${canProceed.remaining || 0}`
      );
    }

    // Make the AI request (placeholder)
    const response = await generateAIResponse(args.prompt, model);
    const actualTokensUsed = response.tokensUsed;

    // Track actual usage
    // In a real implementation, you would call the internal mutation
    // For now, we'll note that this should be tracked
    console.log('Track AI usage:', {
      userId: ctx.userId,
      tokensUsed: actualTokensUsed,
      model,
      prompt: args.prompt.substring(0, 100),
    });

    return {
      response: response.text,
      tokensUsed: actualTokensUsed,
      creditsRemaining: (canProceed.remaining ?? 0) - actualTokensUsed,
    };
  },
});

/**
 * Example 3: File Upload with Storage Tracking
 * Demonstrates storage quota management
 */
export const fileUploadExample = authedMutation({
  args: {
    fileName: v.string(),
    fileSize: v.number(), // in bytes
    fileType: v.string(),
  },
  handler: async (ctx, args) => {
    // Check storage limit
    const canProceed = await checkUsageLimit(
      ctx,
      ctx.userId,
      'storage',
      args.fileSize,
      'file_upload'
    );

    if (!canProceed.allowed) {
      const remainingMB = (canProceed.remaining || 0) / (1024 * 1024);
      throw new ConvexError(
        `Storage limit exceeded. You have ${remainingMB.toFixed(2)} MB remaining.`
      );
    }

    // Track storage usage
    await recordUsage(ctx, ctx.userId, {
      eventType: 'file_upload',
      metricType: 'storage',
      amount: args.fileSize,
      feature: 'file_upload',
      metadata: {
        fileName: args.fileName,
        fileType: args.fileType,
        fileSizeBytes: args.fileSize,
        fileSizeMB: (args.fileSize / (1024 * 1024)).toFixed(2),
      }
    });

    // Perform actual file upload
    // ... your upload logic here ...

    return {
      success: true,
      fileName: args.fileName,
      size: args.fileSize,
      storageRemaining: canProceed.remaining,
    };
  },
});

/**
 * Example 4: Using mutationWithUsage helper
 * Note: The metricType, amount, and feature args are used by the helper
 * and removed from the handler args
 */
export const simplifiedExample = mutationWithUsage({
  args: {
    metricType: v.string(), // Will be 'database_operations' when called
    amount: v.number(),     // Will be 1 when called  
    feature: v.optional(v.string()), // Will be 'data_query' when called
    // Your actual args
    query: v.string(),
  },
  handler: async (ctx, args) => {
    // The usage has already been checked by mutationWithUsage
    // ctx includes userId and usage helpers
    // Note: metricType, amount, and feature are removed from args here
    
    // Track the usage (already checked by the helper)
    await ctx.trackUsage({
      eventType: 'database_query',
      metricType: 'database_operations',
      amount: 1,
      feature: 'data_query',
      metadata: {
        query: args.query,
      }
    });

    // Perform your operation
    // ... database query logic ...

    return { success: true };
  },
});

/**
 * Example 5: Batch Operations with Credit Consumption
 * Demonstrates processing multiple items with credit checks
 */
export const batchProcessExample = authedMutation({
  args: {
    items: v.array(v.object({
      id: v.string(),
      type: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const itemCount = args.items.length;
    const creditsPerItem = 10;
    const totalCreditsNeeded = itemCount * creditsPerItem;

    // Check if user has enough credits
    const canProceed = await checkUsageLimit(
      ctx,
      ctx.userId,
      'processing_credits',
      totalCreditsNeeded,
      'batch_process'
    );

    if (!canProceed.allowed) {
      throw new ConvexError(
        `Insufficient credits for batch processing. ` +
        `Need ${totalCreditsNeeded}, have ${canProceed.remaining ?? 0}`
      );
    }

    const results = [];
    let processedCount = 0;

    try {
      for (const item of args.items) {
        // Process each item
        const result = await processItem(item);
        results.push(result);
        processedCount++;
      }

      // Track successful processing
      await recordUsage(ctx, ctx.userId, {
        eventType: 'batch_process',
        metricType: 'processing_credits',
        amount: processedCount * creditsPerItem,
        feature: 'batch_process',
        metadata: {
          itemCount: processedCount,
          creditsUsed: processedCount * creditsPerItem,
        }
      });

      return {
        success: true,
        processed: processedCount,
        results,
        creditsUsed: processedCount * creditsPerItem,
        creditsRemaining: (canProceed.remaining ?? 0) - (processedCount * creditsPerItem),
      };
    } catch (error) {
      // Track partial usage if some items were processed
      if (processedCount > 0) {
        await recordUsage(ctx, ctx.userId, {
          eventType: 'batch_process_partial',
          metricType: 'processing_credits',
          amount: processedCount * creditsPerItem,
          feature: 'batch_process',
          metadata: {
            itemCount: processedCount,
            totalItems: itemCount,
            error: (error as Error).message,
          }
        });
      }
      throw error;
    }
  },
});

/**
 * Example 6: Email Sending with Daily Limits
 * Demonstrates daily quota enforcement
 */
export const sendEmailExample = authedMutation({
  args: {
    to: v.array(v.string()),
    subject: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const recipientCount = args.to.length;

    // Check daily email limit
    const canProceed = await checkUsageLimit(
      ctx,
      ctx.userId,
      'email_sends',
      recipientCount,
      'email_campaign'
    );

    if (!canProceed.allowed) {
      throw new ConvexError(
        `Daily email limit exceeded. You can send ${canProceed.remaining || 0} more emails today.`
      );
    }

    // Send emails
    const sent = [];
    const failed = [];

    for (const recipient of args.to) {
      try {
        await sendEmail(recipient, args.subject, args.body);
        sent.push(recipient);
      } catch (error) {
        failed.push({ recipient, error: (error as Error).message });
      }
    }

    // Track email usage
    await recordUsage(ctx, ctx.userId, {
      eventType: 'email_send',
      metricType: 'email_sends',
      amount: sent.length,
      feature: 'email_campaign',
      metadata: {
        totalRecipients: recipientCount,
        sent: sent.length,
        failed: failed.length,
        subject: args.subject,
      }
    });

    return {
      success: true,
      sent: sent.length,
      failed: failed.length,
      failedDetails: failed,
      dailyLimitRemaining: (canProceed.remaining ?? 0) - sent.length,
    };
  },
});

// Helper functions (placeholders for actual implementations)
async function generateAIResponse(prompt: string, _model: string) {
  // Placeholder for actual AI API call
  return {
    text: `AI response to: ${prompt}`,
    tokensUsed: estimateTokens(prompt) * 2,
  };
}

async function processItem(item: any) {
  // Placeholder for item processing
  return { id: item.id, processed: true };
}

async function sendEmail(to: string, subject: string, _body: string) {
  // Placeholder for email sending
  console.log(`Sending email to ${to}: ${subject}`);
  return true;
}

// Internal mutations for action usage
import { internalMutation, internalQuery } from '../_generated/server';

export const checkTokenUsage = internalQuery({
  args: {
    userId: v.id('users'),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const result = await checkUsageLimit(
      ctx,
      args.userId,
      'ai_tokens',
      args.amount,
      'ai_generation'
    );
    
    // Also check credits
    const credits = await ctx.db
      .query('usageCredits')
      .withIndex('by_user', (q) =>
        q.eq('userId', args.userId)
          .eq('creditType', 'ai_tokens')
          .eq('isActive', true)
      )
      .collect();
    
    const availableCredits = credits.reduce(
      (sum, c) => sum + (c.availableCredits - c.usedCredits),
      0
    );
    
    return {
      allowed: result.allowed || availableCredits >= args.amount,
      available: availableCredits,
      limit: result.remaining,
    };
  },
});

export const trackAIUsage = internalMutation({
  args: {
    userId: v.id('users'),
    tokensUsed: v.number(),
    model: v.string(),
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    await recordUsage(ctx, args.userId, {
      eventType: 'ai_generation',
      metricType: 'ai_tokens',
      amount: args.tokensUsed,
      feature: 'ai_generation',
      metadata: {
        model: args.model,
        promptPreview: args.prompt,
        tokensUsed: args.tokensUsed,
      }
    });
  },
});