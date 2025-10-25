import { z } from 'zod';

// =============================================================================
// ENVIRONMENT SCHEMAS
// =============================================================================

const envSchema = z.object({
  // Convex Configuration
  CONVEX_URL: z.string().url().optional(),
  CONVEX_SITE_URL: z.string().url().optional(),
  
  // API Keys
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1, 'Google AI API key is required'),
  
  // Better Auth Configuration
  BETTER_AUTH_URL: z.string().url().optional(),
  BETTER_AUTH_SECRET: z.string().min(32, 'Auth secret must be at least 32 characters').optional(),
  JWT_PRIVATE_KEY: z.string().optional(),
  
  // Environment
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  
  // App Configuration
  APP_NAME: z.string().default('Invoice Tracker'),
  APP_VERSION: z.string().default('1.0.0'),
});

// =============================================================================
// ENVIRONMENT VALIDATION
// =============================================================================

export const validateEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment variables:', error);
    throw new Error('Environment validation failed');
  }
};

// =============================================================================
// APP CONSTANTS
// =============================================================================

export const APP_CONFIG = {
  NAME: 'Invoice Tracker',
  VERSION: '1.0.0',
  DESCRIPTION: 'Smart receipt scanning and expense tracking app with AI-powered parsing',
  KEYWORDS: ['invoice', 'receipt', 'expense', 'tracking', 'scan', 'business'],
  
  // Bundle/Package identifiers
  BUNDLE_ID: 'com.invoicetracker.app',
  PACKAGE_NAME: 'com.invoicetracker.app',
  SCHEME: 'invoice-tracker',
  
  // Colors
  PRIMARY_COLOR: '#2563eb',
  BACKGROUND_COLOR: '#ffffff',
  
  // Permissions
  PERMISSIONS: {
    CAMERA: 'We need camera access to scan receipt documents',
    PHOTO_LIBRARY: 'We need photo library access to select receipt images',
    STORAGE: 'We need storage access to save receipt images',
  },
} as const;

// =============================================================================
// API CONFIGURATION
// =============================================================================

export const API_CONFIG = {
  // Convex
  CONVEX: {
    DEFAULT_CLOUD_URL: 'https://avid-narwhal-394.convex.cloud',
    DEFAULT_SITE_URL: 'https://avid-narwhal-394.convex.site',
  },
  
  // Google AI
  GOOGLE_AI: {
    MODEL: 'gemini-2.5-flash',
    BASE_URL: 'https://generativelanguage.googleapis.com/v1',
    MAX_TOKENS: 8192,
    TEMPERATURE: 0.1,
  },
  
  // File Upload
  FILE_UPLOAD: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/jpg'],
    COMPRESSION_QUALITY: 0.8,
  },
  
  // Export
  EXPORT: {
    MAX_RECEIPTS_PER_BATCH: 1000,
    PDF_OPTIONS: {
      WIDTH: 612, // A4 width in points
      HEIGHT: 792, // A4 height in points
      MARGINS: 24,
    },
  },
} as const;

// =============================================================================
// DATABASE CONSTANTS
// =============================================================================

export const DB_CONSTANTS = {
  COLLECTIONS: {
    RECEIPTS: 'receipts',
    USERS: 'users',
    SESSIONS: 'sessions',
    WORKPOOL_JOBS: 'workpool_jobs',
  },
  
  RECEIPT_STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    PROCESSED: 'processed',
    FAILED: 'failed',
  },
  
  CONFIDENCE_THRESHOLDS: {
    LOW: 0.5,
    MEDIUM: 0.7,
    HIGH: 0.9,
  },
} as const;

// =============================================================================
// FEATURE FLAGS
// =============================================================================

export const FEATURE_FLAGS = {
  ENABLE_AI_PARSING: true,
  ENABLE_BATCH_PROCESSING: true,
  ENABLE_OFFLINE_MODE: false,
  ENABLE_ANALYTICS: false,
  ENABLE_PUSH_NOTIFICATIONS: false,
  ENABLE_BACKUP_SYNC: false,
  ENABLE_MULTI_CURRENCY: true,
  ENABLE_EXPORT_FEATURES: true,
  ENABLE_RECEIPT_SHARING: true,
} as const;

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

export const VALIDATION_SCHEMAS = {
  EMAIL: z.string().email('Invalid email address'),
  PASSWORD: z.string().min(6, 'Password must be at least 6 characters'),
  RECEIPT_AMOUNT: z.number().min(0, 'Amount must be positive'),
  CURRENCY: z.enum(['USD', 'EUR', 'GBP', 'TRY', 'JPY']),
  LANGUAGE: z.enum(['en', 'tr']),
  CATEGORY: z.string().min(1, 'Category is required'),
  MERCHANT_NAME: z.string().min(1, 'Merchant name is required'),
} as const;

// =============================================================================
// CORS CONFIGURATION
// =============================================================================

export const CORS_CONFIG = {
  ALLOWED_ORIGINS: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:8081',
    'exp://localhost:8081',
    'exp://192.168.1.100:8081',
    'capacitor://localhost',
  ],
  ALLOWED_HEADERS: ['Content-Type', 'Authorization'],
  ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  EXPOSE_HEADERS: ['Content-Length'],
  MAX_AGE: 600,
  CREDENTIALS: false,
} as const;

// =============================================================================
// RUNTIME CONFIGURATION
// =============================================================================

export const getRuntimeConfig = () => {
  const env = validateEnv();
  
  return {
    env,
    isProduction: env.NODE_ENV === 'production',
    isDevelopment: env.NODE_ENV === 'development',
    isStaging: env.NODE_ENV === 'staging',
    
    // API URLs
    convexUrl: env.CONVEX_URL || API_CONFIG.CONVEX.DEFAULT_CLOUD_URL,
    convexSiteUrl: env.CONVEX_SITE_URL || API_CONFIG.CONVEX.DEFAULT_SITE_URL,
    authUrl: env.BETTER_AUTH_URL || 'http://localhost:3000',
    
    // API Keys
    googleAiKey: env.GOOGLE_GENERATIVE_AI_API_KEY,
    
    // Feature flags (can be overridden by env vars)
    features: {
      ...FEATURE_FLAGS,
      ENABLE_AI_PARSING: process.env.FEATURE_AI_PARSING !== 'false',
      ENABLE_ANALYTICS: process.env.FEATURE_ANALYTICS === 'true',
    },
  };
};

// =============================================================================
// TYPES
// =============================================================================

export type Environment = z.infer<typeof envSchema>;
export type RuntimeConfig = ReturnType<typeof getRuntimeConfig>;
export type ReceiptStatus = typeof DB_CONSTANTS.RECEIPT_STATUS[keyof typeof DB_CONSTANTS.RECEIPT_STATUS];
export type SupportedCurrency = z.infer<typeof VALIDATION_SCHEMAS.CURRENCY>;
export type SupportedLanguage = z.infer<typeof VALIDATION_SCHEMAS.LANGUAGE>;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export const getEnvironmentInfo = () => {
  const config = getRuntimeConfig();
  return {
    appName: APP_CONFIG.NAME,
    version: APP_CONFIG.VERSION,
    environment: config.env.NODE_ENV,
    isProduction: config.isProduction,
    timestamp: new Date().toISOString(),
  };
};

export const validateApiKey = (key: string, service: string) => {
  if (!key) {
    throw new Error(`${service} API key is required`);
  }
  
  // Basic validation for Google AI API keys
  if (service === 'Google AI' && !key.startsWith('AIza')) {
    throw new Error(`${service} API key appears to be invalid`);
  }
  
  return true;
};

export const getPublicConfig = () => {
  return {
    appName: APP_CONFIG.NAME,
    version: APP_CONFIG.VERSION,
    description: APP_CONFIG.DESCRIPTION,
    primaryColor: APP_CONFIG.PRIMARY_COLOR,
    supportedLanguages: ['en', 'tr'],
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'TRY', 'JPY'],
    maxFileSize: API_CONFIG.FILE_UPLOAD.MAX_SIZE,
    allowedFileTypes: API_CONFIG.FILE_UPLOAD.ALLOWED_TYPES,
  };
}; 