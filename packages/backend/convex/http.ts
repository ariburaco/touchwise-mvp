// import "./polyfills";
// import { httpRouter } from "convex/server";
// import { betterAuthComponent, createAuth } from "./auth";

// const http = httpRouter();

// betterAuthComponent.registerRoutes(http, createAuth);

// export default http;

import './polyfills';
import { HonoWithConvex, HttpRouterWithHono } from 'convex-helpers/server/hono';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { internal } from './_generated/api';
import { ActionCtx } from './_generated/server';
import { createAuth } from './auth';
import { scraperPool } from './workpool';

const app: HonoWithConvex<ActionCtx> = new Hono();

// Register workpool HTTP endpoint
app.use(scraperPool);

app.use(
  '/api/auth/*',
  cors({
    origin: [
      'http://localhost:8081',
      'http://localhost',
      'http://localhost:3000', // Next.js web app
      'http://localhost:3001', // Alternative port for web app
    ],
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true, // Enable credentials for web app cookies
  })
);

// Handle null origin specifically for React Native
app.use('/api/auth/*', async (c, next) => {
  const origin = c.req.header('origin');
  if (!origin || origin === 'null') {
    c.header('Access-Control-Allow-Origin', '*');
    c.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    c.header('Access-Control-Expose-Headers', 'Content-Length');
    c.header('Access-Control-Allow-Credentials', 'true');
  }
  await next();
});

// Public image endpoint for receipt images (used in Excel exports)
app.get('/api/images/:storageId', async (c) => {
  try {
    const storageId = c.req.param('storageId');

    if (!storageId) {
      return c.json({ error: 'Storage ID is required' }, 400);
    }

    // Get the image URL using internal query (no auth required)
    const imageUrl = await c.env.runQuery(
      internal.storage.getImageUrlInternal,
      {
        storageId: storageId as any,
      }
    );

    if (!imageUrl) {
      return c.json({ error: 'Image not found' }, 404);
    }

    // Redirect to the actual Convex storage URL
    return c.redirect(imageUrl);
  } catch (error) {
    console.error('Error serving image:', error);
    return c.json({ error: 'Failed to serve image' }, 500);
  }
});

// Redirect root well-known to api well-known
app.get('/.well-known/openid-configuration', async (c) => {
  return c.redirect('/api/auth/convex/.well-known/openid-configuration');
});

app.on(['POST', 'GET'], '/api/auth/*', async (c) => {
  const auth = createAuth(c.env);
  const result = await auth.handler(c.req.raw);
  return result;
});

const http = new HttpRouterWithHono(app);

export default http;
