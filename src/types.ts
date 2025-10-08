// Type definitions for Cloudflare Workers environment
export interface CloudflareEnv {
  // Database
  DATABASE_URL?: string;

  // Google OAuth
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;

  // Email service
  RESEND_API_KEY?: string;
  FROM_EMAIL?: string;

  // JWT
  JWT_SECRET?: string;

  // Admin credentials
  ADMIN_EMAIL?: string;
  ADMIN_NAME?: string;
  ADMIN_PASSWORD?: string;

  // Environment
  ENVIRONMENT?: string;
  CF_PAGES?: boolean;

  // Cloudflare R2
  FILES_BUCKET?: any; // R2Bucket type from Cloudflare Workers
  CF_ACCOUNT_ID?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
}

// Extend Hono context to include our environment
declare module 'hono' {
  interface ContextVariableMap {
    user?: any;
  }
}