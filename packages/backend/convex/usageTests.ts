import { v } from 'convex/values';
import { authedMutation } from './helpers/queryHelpers';
import { usageManager } from './services/usageManager';
import { creditManager } from './services/creditManager';
import type { Id } from './_generated/dataModel';

// Test mutation for API calls
export const testApiCalls = authedMutation({
  args: {
    count: v.number(),
  },
  handler: async (ctx, args) => {

    const results = [];
    for (let i = 0; i < args.count; i++) {
      const result = await usageManager.trackUsage(
        ctx,
        ctx.userId as Id<'users'>,
        'api_calls',
        1,
        {
          feature: 'test_api',
          metadata: { testRun: true, iteration: i + 1 }
        }
      );
      results.push(result);
    }

    return {
      success: true,
      message: `Tracked ${args.count} API calls`,
      results,
      summary: {
        total: args.count,
        allowed: results.filter(r => r.allowed).length,
        blocked: results.filter(r => !r.allowed).length,
        warnings: results.filter(r => r.warning).length,
      }
    };
  },
});

// Test mutation for AI tokens
export const testAiTokens = authedMutation({
  args: {
    tokens: v.number(),
  },
  handler: async (ctx, args) => {

    const result = await usageManager.trackUsage(
      ctx,
      ctx.userId as Id<'users'>,
      'ai_tokens',
      args.tokens,
      {
        feature: 'test_ai_generation',
        metadata: { 
          testRun: true,
          model: 'gpt-4',
          prompt: 'Test prompt for usage tracking'
        }
      }
    );

    return {
      success: true,
      message: `Tracked ${args.tokens} AI tokens`,
      result,
      creditsUsed: result.creditsUsed,
      remaining: result.remaining,
    };
  },
});

// Test mutation for storage
export const testStorage = authedMutation({
  args: {
    sizeMB: v.number(),
  },
  handler: async (ctx, args) => {

    // Convert MB to bytes for tracking
    const bytes = args.sizeMB * 1024 * 1024;

    const result = await usageManager.trackUsage(
      ctx,
      ctx.userId as Id<'users'>,
      'storage',
      bytes,
      {
        feature: 'test_file_upload',
        metadata: { 
          testRun: true,
          fileType: 'test',
          sizeMB: args.sizeMB
        }
      }
    );

    return {
      success: true,
      message: `Tracked ${args.sizeMB}MB storage usage`,
      result,
      bytesTracked: bytes,
    };
  },
});

// Test mutation for emails
export const testEmails = authedMutation({
  args: {
    count: v.number(),
  },
  handler: async (ctx, args) => {

    const results = [];
    for (let i = 0; i < args.count; i++) {
      const result = await usageManager.trackUsage(
        ctx,
        ctx.userId as Id<'users'>,
        'email_sends',
        1,
        {
          feature: 'test_email_notification',
          metadata: { 
            testRun: true,
            emailType: 'notification',
            recipient: `test${i + 1}@example.com`
          }
        }
      );
      results.push(result);

      // Add small delay to simulate real email sending
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return {
      success: true,
      message: `Tracked ${args.count} email sends`,
      results,
      summary: {
        total: args.count,
        sent: results.filter(r => r.allowed).length,
        blocked: results.filter(r => !r.allowed).length,
      }
    };
  },
});

// Test mutation for batch processing
export const testBatchProcess = authedMutation({
  args: {
    batchSize: v.number(),
  },
  handler: async (ctx, args) => {

    // Simulate a batch process with multiple operations
    const operations = [
      { type: 'database_operations', amount: args.batchSize * 2 },
      { type: 'api_calls', amount: args.batchSize },
      { type: 'ai_tokens', amount: args.batchSize * 10 },
    ];

    const results = [];
    for (const op of operations) {
      const result = await usageManager.trackUsage(
        ctx,
        ctx.userId as Id<'users'>,
        op.type as any,
        op.amount,
        {
          feature: 'test_batch_processing',
          metadata: { 
            testRun: true,
            batchId: `batch-${Date.now()}`,
            batchSize: args.batchSize
          }
        }
      );
      results.push({ ...result, operation: op.type });
    }

    return {
      success: true,
      message: `Processed batch of ${args.batchSize} items`,
      results,
      summary: {
        batchSize: args.batchSize,
        operationsRun: operations.length,
        totalUsage: operations.reduce((sum, op) => sum + op.amount, 0),
      }
    };
  },
});

// Credit test mutations - exported as separate functions
export const allocateTestCredits = authedMutation({
  args: {
    amount: v.number(),
    expiresInDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {

    const expiresAt = args.expiresInDays 
      ? Date.now() + (args.expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const credit = await creditManager.allocateCredits(
      ctx,
      ctx.userId as Id<'users'>,
      args.amount,
      'bonus',
      {
        expiresAt,
        canRollover: true,
        metadata: { 
          testRun: true,
          allocatedAt: new Date().toISOString()
        }
      }
    );

    return {
      success: true,
      message: `Allocated ${args.amount} test credits`,
      credit,
    };
  },
});

export const consumeTestCredits = authedMutation({
  args: {
    amount: v.number(),
    metricType: v.string(),
  },
  handler: async (ctx, args) => {

    const result = await creditManager.consumeCredits(
      ctx,
      ctx.userId as Id<'users'>,
      args.amount,
      args.metricType
    );

    return {
      success: true,
      message: `Consumed ${args.amount} credits for ${args.metricType}`,
      result,
    };
  },
});

export const transferTestCredits = authedMutation({
  args: {
    amount: v.number(),
    toUserId: v.string(),
  },
  handler: async (ctx, args) => {

    // In a real app, you'd validate the target user exists
    // For testing, we'll just create a mock transfer
    const result = await creditManager.transferCredits(
      ctx,
      ctx.userId as Id<'users'>,
      args.toUserId as Id<'users'>,
      args.amount
    );

    return {
      success: true,
      message: `Transferred ${args.amount} credits to user ${args.toUserId}`,
      result,
    };
  },
});