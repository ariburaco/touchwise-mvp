# CLAUDE.md

## ⚠️ CRITICAL RULES
- **NO `any` type** - Always use proper TypeScript types, never cast to `any`
- **NO console.log in production code** - Remove all debug logs before committing
- **NO hardcoded strings** - Use translations for UI text
- **NO direct database access** - Always use authed helpers in Convex

This file provides comprehensive guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a production-ready SaaS template built with Next.js, Convex, and Better Auth. It provides a complete foundation for building multi-tenant SaaS applications with authentication, subscriptions, usage tracking, and billing integration.

## Architecture

### Monorepo Structure

```
/
├── apps/
│   ├── web/                 # Next.js 15 web application (port 3000)
│   └── native/              # React Native mobile app with Expo
├── packages/
│   ├── backend/             # Convex backend-as-a-service
│   ├── translations/        # Typed translation keys
│   └── shared/             # Shared utilities and types
```

### Tech Stack

- **Package Manager:** Bun (v1.2.18)
- **Build System:** Turborepo
- **Frontend:** TypeScript, Next.js 15 (App Router), React 19
- **Styling:** TailwindCSS v4 (web), TailwindCSS v3 + NativeWind (native)
- **UI Components:** shadcn/ui, Radix UI primitives
- **Backend:** Convex (reactive backend platform)
- **Authentication:** Better Auth with Convex adapter
- **Payments:** Polar.sh integration
- **State Management:** React Context + Convex real-time queries
- **Forms:** Controlled components (no form library currently)
- **Notifications:** Sonner for toasts
- **Data Tables:** @tanstack/react-table

## Essential Commands

```bash
# Initial setup (required before first run)
bun install
bun dev:setup        # Configure Convex backend

# Development
bun dev              # Start all apps (web, native, backend)
bun dev:web          # Start web app only
bun dev:server       # Start Convex backend only

# Build & Type Checking
bun build            # Build all apps
bun typecheck        # TypeScript type checking across all packages

# Utilities
bun lint             # Run Next.js linting (web only)
bun translate:fix    # Fix translations for TR locale
```

## Coding Conventions

### TypeScript Guidelines

```typescript
// ✅ GOOD - Proper types
interface UserProfile {
  id: Id<'users'>;
  name: string;
  email: string;
  tier: 'free' | 'pro' | 'team' | 'enterprise' | 'lifetime';
}

// ❌ BAD - Using any
const user: any = await getUser();
```

### File & Folder Structure

```
/apps/web/src/
├── app/                     # Next.js App Router pages
│   ├── (public)/           # Public routes
│   ├── dashboard/          # Protected dashboard routes
│   └── api/                # API routes (auth, webhooks)
├── components/             
│   ├── ui/                 # shadcn/ui components
│   ├── [feature]/          # Feature-specific components
│   └── *.tsx               # Shared components
├── contexts/               # React Context providers
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities and configurations
└── types/                  # TypeScript type definitions
```

### Naming Conventions

- **Files:** `kebab-case.ts` (e.g., `user-profile.tsx`)
- **Components:** `PascalCase` (e.g., `UserProfile`)
- **Hooks:** `camelCase` with `use` prefix (e.g., `useUserProfile`)
- **Convex functions:** `camelCase` (e.g., `getUserProfile`)
- **Constants:** `UPPER_SNAKE_CASE` (e.g., `MAX_FILE_SIZE`)

## Backend Conventions (Convex)

### Authentication Patterns

```typescript
// Always use authed helpers for protected endpoints
import { authedQuery, authedMutation } from '../helpers/queryHelpers';

// ✅ GOOD - Protected query
export const getProfile = authedQuery({
  args: {},
  handler: async (ctx) => {
    // ctx.userId is guaranteed to exist
    // ctx.user contains full user document
    // ctx.userSubscription contains subscription data
    return await ctx.db.get(ctx.userId);
  },
});

// ❌ BAD - Manual auth check
export const getProfile = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');
    // ... rest of logic
  },
});
```

### Error Handling

```typescript
import { ConvexError } from 'convex/values';

// ✅ GOOD - Using ConvexError
throw new ConvexError('User not found');

// ❌ BAD - Using generic Error
throw new Error('User not found');
```

### Schema Organization

```typescript
// packages/backend/convex/schemas/[entity].schema.ts
import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const users = defineTable({
  // Required fields
  email: v.string(),
  name: v.string(),
  
  // Optional fields
  bio: v.optional(v.string()),
  
  // Relationships
  organizationId: v.optional(v.id('organizations')),
  
  // Metadata
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_email', ['email'])
  .index('by_organization', ['organizationId']);
```

### Database Indexes

Always create indexes for fields you query by:
```typescript
.index('by_email', ['email'])
.index('by_user_status', ['userId', 'status'])
.index('by_created', ['createdAt'])
```

## Frontend Conventions

### Component Structure

```typescript
// ✅ GOOD - Server Component by default
// app/dashboard/page.tsx
export default async function DashboardPage() {
  return <Dashboard />;
}

// ✅ GOOD - Client Component when needed
// components/interactive-chart.tsx
'use client';

import { useState } from 'react';

export function InteractiveChart() {
  const [selected, setSelected] = useState(null);
  // ... interactive logic
}
```

### Data Fetching

```typescript
// Use custom hooks for Convex queries
import { useAuthQuery, useAuthMutation } from '@/hooks/useConvexQuery';
import { api } from '@invoice-tracker/backend/convex/_generated/api';

function Profile() {
  // ✅ GOOD - Using auth-aware hooks
  const { data: profile, isPending } = useAuthQuery(
    api.user.profile.get,
    {}
  );
  
  const updateProfile = useAuthMutation(api.user.profile.update);
  
  // ❌ BAD - Using regular Convex hooks
  const profile = useQuery(api.user.profile.get);
}
```

### Toast Notifications

```typescript
import { toast } from 'sonner';

// Success
toast.success('Profile updated successfully');

// Error
toast.error('Failed to update profile');

// Custom with icon
toast('Custom message', {
  icon: '🎉',
  className: 'text-blue-600'
});
```

### Forms

```typescript
// Currently using controlled components
// No form library (react-hook-form, etc.) integrated yet

function ProfileForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validation and submission logic
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <Input 
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
    </form>
  );
}
```

## Authentication & Authorization

### Session Structure

The session is extended with additional data:
```typescript
{
  user: {
    id: string;
    email: string;
    name: string;
    // ... Better Auth user fields
  },
  dbUser: {
    _id: Id<'users'>;
    subscriptionTier: 'free' | 'pro' | 'team' | 'enterprise' | 'lifetime';
    // ... Convex user document fields
  },
  subscription: {
    status: 'active' | 'trialing' | 'canceled';
    productName: string;
    // ... subscription details
  }
}
```

### Using Auth Context

```typescript
import { useAuth } from '@/lib/auth-context';

function Component() {
  const { session, isLoading, signOut } = useAuth();
  
  // Access user data
  const tier = session?.dbUser?.subscriptionTier || 'free';
  const subscription = session?.subscription;
}
```

### Using Subscription Context

```typescript
import { useSubscription } from '@/contexts/SubscriptionContext';

function Component() {
  const { 
    tier,           // Current subscription tier
    limits,         // Tier limits (projects, storage, etc.)
    canAccess,      // Check feature access
    isPro,          // Quick tier checks
    isTeam,
  } = useSubscription();
  
  // Check feature access
  if (!canAccess('advanced_analytics')) {
    return <UpgradePrompt />;
  }
}
```

## Usage Tracking & Credits

### Tracking Usage Events

```typescript
// Backend - Record usage
await recordUsage(ctx, userId, {
  eventType: 'api_call',
  metricType: 'api_calls',
  amount: 1,
  feature: 'ai_generation',
  endpoint: '/api/generate',
});

// Frontend - Check usage
const canUse = await checkUsageAvailable({
  metricType: 'ai_tokens',
  amount: 1000,
});
```

### Credit Management

```typescript
// Allocate credits
await grantPromotionalCredits(ctx, {
  userId,
  creditType: 'ai_tokens',
  amount: 10000,
  reason: 'New user bonus',
  expiresInDays: 30,
});
```

## Common Patterns

### CRUD Operations

```typescript
// packages/backend/convex/[entity]/[entity].ts
import { authedQuery, authedMutation } from '../helpers/queryHelpers';
import { v } from 'convex/values';

// List with pagination
export const list = authedQuery({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    return await ctx.db
      .query('entities')
      .withIndex('by_user', q => q.eq('userId', ctx.userId))
      .order('desc')
      .take(limit);
  },
});

// Get single item
export const get = authedQuery({
  args: { id: v.id('entities') },
  handler: async (ctx, { id }) => {
    const entity = await ctx.db.get(id);
    
    // Verify ownership
    if (entity?.userId !== ctx.userId) {
      throw new ConvexError('Not authorized');
    }
    
    return entity;
  },
});

// Create
export const create = authedMutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert('entities', {
      ...args,
      userId: ctx.userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return id;
  },
});

// Update
export const update = authedMutation({
  args: {
    id: v.id('entities'),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...updates }) => {
    const entity = await ctx.db.get(id);
    
    if (entity?.userId !== ctx.userId) {
      throw new ConvexError('Not authorized');
    }
    
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
    
    return await ctx.db.get(id);
  },
});

// Delete
export const remove = authedMutation({
  args: { id: v.id('entities') },
  handler: async (ctx, { id }) => {
    const entity = await ctx.db.get(id);
    
    if (entity?.userId !== ctx.userId) {
      throw new ConvexError('Not authorized');
    }
    
    await ctx.db.delete(id);
    return { success: true };
  },
});
```

### File Upload

```typescript
// Backend
export const generateUploadUrl = authedMutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveFile = authedMutation({
  args: {
    storageId: v.id('_storage'),
    filename: v.string(),
  },
  handler: async (ctx, args) => {
    const url = await ctx.storage.getUrl(args.storageId);
    
    await ctx.db.insert('files', {
      storageId: args.storageId,
      filename: args.filename,
      url,
      userId: ctx.userId,
      uploadedAt: Date.now(),
    });
    
    return { url };
  },
});

// Frontend
async function uploadFile(file: File) {
  // Get upload URL
  const uploadUrl = await generateUploadUrl();
  
  // Upload to Convex storage
  const result = await fetch(uploadUrl, {
    method: 'POST',
    body: file,
  });
  const { storageId } = await result.json();
  
  // Save file reference
  await saveFile({ storageId, filename: file.name });
}
```

### Real-time Updates

```typescript
// Convex queries are reactive by default
function LiveDashboard() {
  // This will auto-update when data changes
  const { data: metrics } = useAuthQuery(
    api.dashboard.getMetrics,
    {}
  );
  
  return <MetricsDisplay metrics={metrics} />;
}
```

## Environment Variables

### Required Variables

```bash
# Convex (auto-generated)
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=

# Authentication
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_NAME=Your App Name

# OAuth Providers (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Polar.sh (payment integration)
POLAR_ACCESS_TOKEN=
POLAR_WEBHOOK_SECRET=
POLAR_PRODUCT_ID_PRO=
POLAR_PRODUCT_ID_TEAM=
POLAR_PRODUCT_ID_LIFETIME=
POLAR_SERVER=sandbox # or 'production'

# AI Integration (optional)
GOOGLE_GENERATIVE_AI_API_KEY=
```

## Testing & Quality

### Type Checking
```bash
bun typecheck       # Check all packages
cd apps/web && bun typecheck  # Check web only
```

### Common Type Issues

```typescript
// Issue: Type 'undefined' is not assignable to type 'string'
// Solution: Use optional chaining and nullish coalescing
const name = user?.name ?? 'Anonymous';

// Issue: Property doesn't exist on type
// Solution: Properly type your data
interface UserData extends Doc<'users'> {
  customField?: string;
}
```

## Translations

### Adding New Translations

1. Always add English translation first:
```typescript
// packages/translations/en.ts
export const en = {
  dashboard: {
    title: 'Dashboard',
    welcome: 'Welcome back, {{name}}!',
  },
};
```

2. Use translations in components:
```typescript
import { useTranslation } from '@/hooks/useTranslation';

function Dashboard() {
  const t = useTranslation();
  
  return <h1>{t('dashboard.title')}</h1>;
}
```

3. Fix missing translations:
```bash
bun translate:fix
```

## Debugging

### Debug Helpers

```typescript
// Backend - Use ctx.logger in development
if (process.env.NODE_ENV === 'development') {
  console.log('Debug:', data);
}

// Frontend - Remove before commit
console.log('🚀 ~ Component ~ data:', data); // ❌ Remove this
```

### Common Issues & Solutions

1. **"Not authenticated" error**
   - Check if using `authedQuery/authedMutation`
   - Verify session is loaded before making queries
   - Check `isConvexReady` in auth context

2. **Type errors with Convex IDs**
   ```typescript
   // Cast to proper ID type
   const userId = identity.subject as Id<'users'>;
   ```

3. **Subscription tier not updating**
   - Session data is cached, may need refresh
   - Check if `subscriptionTier` is set in user document

4. **Toast not showing**
   - Ensure `<Toaster />` is in root layout
   - Import from 'sonner', not other packages

## Performance Optimization

### Query Optimization
```typescript
// ✅ GOOD - Use indexes
.withIndex('by_user', q => q.eq('userId', ctx.userId))

// ❌ BAD - Full table scan
.filter(q => q.eq(q.field('userId'), ctx.userId))
```

### Component Optimization
```typescript
// Use React.memo for expensive components
export const ExpensiveChart = React.memo(({ data }) => {
  // ... complex rendering
});

// Use useMemo for expensive calculations
const processedData = useMemo(() => 
  processComplexData(rawData), 
  [rawData]
);
```

## Security Best Practices

1. **Never expose sensitive data in client components**
2. **Always validate ownership in mutations**
3. **Use environment variables for secrets**
4. **Implement rate limiting for expensive operations**
5. **Sanitize user input before storage**
6. **Use ConvexError for controlled error messages**

## Deployment Checklist

- [ ] Remove all console.log statements
- [ ] Set proper environment variables
- [ ] Run `bun typecheck`
- [ ] Test authentication flow
- [ ] Verify subscription tiers work
- [ ] Check usage tracking
- [ ] Test payment integration
- [ ] Verify email sending
- [ ] Check error handling
- [ ] Review security measures

## Additional Resources

- [Convex Documentation](https://docs.convex.dev)
- [Next.js App Router](https://nextjs.org/docs/app)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Better Auth](https://better-auth.com)
- [Polar.sh Docs](https://docs.polar.sh)