import { defineApp } from 'convex/server';
import betterAuth from '@convex-dev/better-auth/convex.config';
import workpool from '@convex-dev/workpool/convex.config';

const app = defineApp();
app.use(betterAuth);

// User scan workpool - for user-initiated receipt scans
// app.use(workpool, { name: 'userScanPool' });

export default app;
