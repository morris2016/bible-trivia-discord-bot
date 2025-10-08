// Security middleware with real database integration
import { Context, Next } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';

// Import security database functions
import {
  logSecurityEvent as logSecurityEventDb,
  logThreatAttack,
  logRateLimitEvent,
  isIPBlocked,
  createSession,
  updateSessionActivity,
  removeSession,
  getActiveSessions
} from './security-db';

// Rate limiting storage (in production, use Redis or similar)
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Dynamic Security Configuration (loaded from environment variables)
function getSecurityConfig() {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';

  return {
    RATE_LIMIT: {
      WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes default
      MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'), // 1000 requests default
      STRICT_ENDPOINTS: {
        '/api/auth/login': {
          max: parseInt(process.env.RATE_LIMIT_LOGIN_MAX || '50'),
          window: parseInt(process.env.RATE_LIMIT_LOGIN_WINDOW || '900000') // 15 min default
        },
        '/api/auth/register': {
          max: parseInt(process.env.RATE_LIMIT_REGISTER_MAX || '10'),
          window: parseInt(process.env.RATE_LIMIT_REGISTER_WINDOW || '3600000') // 1 hour default
        },
        '/api/auth/request-password-reset': {
          max: parseInt(process.env.RATE_LIMIT_RESET_REQUEST_MAX || '10'),
          window: parseInt(process.env.RATE_LIMIT_RESET_REQUEST_WINDOW || '3600000') // 1 hour default
        },
        '/api/auth/reset-password': {
          max: parseInt(process.env.RATE_LIMIT_RESET_PASSWORD_MAX || '20'),
          window: parseInt(process.env.RATE_LIMIT_RESET_PASSWORD_WINDOW || '900000') // 15 min default
        }
      } as Record<string, { max: number; window: number }>
    },
    CSP: {
      DEFAULT_SRC: ["'self'"],
      SCRIPT_SRC: [
        "'self'",
        ...(isDevelopment ? ["'unsafe-inline'", "'unsafe-eval'"] : []),
        process.env.CSP_TINYMCE_URL || "https://cdn.tiny.cloud",
        process.env.CSP_CDN_URL || "https://unpkg.com",
        "https://pagead2.googlesyndication.com",
        "https://cdnjs.cloudflare.com"
      ].filter(Boolean),
      STYLE_SRC: [
        "'self'",
        ...(isDevelopment ? ["'unsafe-inline'"] : []),
        process.env.CSP_TINYMCE_URL || "https://cdn.tiny.cloud",
        "https://fonts.googleapis.com"
      ].filter(Boolean),
      IMG_SRC: [
        "'self'",
        "data:",
        "blob:",
        ...(process.env.CSP_ALLOW_HTTP_IMG_SRC === 'true' ? ["http:"] : []),
        "https:"
      ].filter(Boolean),
      CONNECT_SRC: [
        "'self'",
        process.env.CSP_RESEND_API_URL || "https://api.resend.com",
        process.env.CSP_ANALYTICS_URL || "https://*.cloudflareinsights.com",
        "https://pagead2.googlesyndication.com",
        "https://googleads.g.doubleclick.net",
        "https://ep1.adtrafficquality.google"
      ].filter(Boolean),
      FONT_SRC: [
        "'self'",
        "https://fonts.gstatic.com"
      ],
      OBJECT_SRC: ["'none'"],
      MEDIA_SRC: ["'self'", "blob:", "data:"],
      FRAME_SRC: ["*"],
      WORKER_SRC: ["'self'", "blob:"]
    },
    CSRF: {
      TOKEN_LENGTH: parseInt(process.env.CSRF_TOKEN_LENGTH || '32'),
      COOKIE_NAME: process.env.CSRF_COOKIE_NAME || 'csrf-token',
      HEADER_NAME: process.env.CSRF_HEADER_NAME || 'x-csrf-token'
    },
    FILE_UPLOAD: {
      MAX_SIZE: parseInt(process.env.FILE_UPLOAD_MAX_SIZE || '10485760'), // 10MB default
      ALLOWED_TYPES: process.env.FILE_UPLOAD_ALLOWED_TYPES?.split(',') || [
        'application/pdf',
        'audio/mpeg',
        'audio/mp3',
        'audio/wav',
        'audio/ogg',
        'image/jpeg',
        'image/png',
        'image/gif',
        'text/plain'
      ]
    },
    SESSION: {
      MAX_AGE: parseInt(process.env.SESSION_MAX_AGE || '7200000'), // 2 hours default
      IDLE_TIMEOUT: parseInt(process.env.SESSION_IDLE_TIMEOUT || '1800000'), // 30 minutes default
    },
    MONITORING: {
      UPTIME_TRACKING: process.env.UPTIME_TRACKING_ENABLED === 'true',
      UPTIME_CALCULATION_WINDOW: parseInt(process.env.UPTIME_CALCULATION_WINDOW || '86400000'), // 24 hours default
    }
  };
}

// Export the configuration function - this makes it dynamic
export const SECURITY_CONFIG = getSecurityConfig();

// Get client IP address
function getClientIP(c: Context): string {
  return c.req.header('cf-connecting-ip') ||
         c.req.header('x-forwarded-for') ||
         c.req.header('x-real-ip') ||
         '127.0.0.1';
}

// Rate limiting middleware with user-based differentiation
export function rateLimitMiddleware(options?: {
  maxRequests?: number;
  windowMs?: number;
  skipSuccessfulRequests?: boolean;
  skipForAdmins?: boolean;
}) {
  return async (c: Context, next: Next) => {
    const ip = getClientIP(c);
    const path = new URL(c.req.url).pathname;

    // Check if user is authenticated and is admin
    let isAdmin = false;
    try {
      const authToken = getCookie(c, 'auth-token');
      if (authToken) {
        // Decode JWT to check user role (simplified check)
        const payload = JSON.parse(Buffer.from(authToken.split('.')[1], 'base64').toString());
        isAdmin = payload.role === 'admin';
      }
    } catch (error) {
      // If token parsing fails, treat as non-admin
      isAdmin = false;
    }

    // Skip rate limiting for admin users if configured
    if (isAdmin && (options?.skipForAdmins !== false)) {
      // Still add rate limit headers for monitoring, but don't enforce limits
      c.header('X-RateLimit-Limit', 'unlimited');
      c.header('X-RateLimit-Remaining', 'unlimited');
      c.header('X-RateLimit-Reset', '0');
      c.header('X-RateLimit-User-Type', 'admin');
      await next();
      return;
    }

    // For non-admin users, apply rate limiting
    const key = `${ip}:${path}`;

    // Check for endpoint-specific limits
    const strictLimit = SECURITY_CONFIG.RATE_LIMIT.STRICT_ENDPOINTS[path];
    const maxRequests = strictLimit?.max || options?.maxRequests || SECURITY_CONFIG.RATE_LIMIT.MAX_REQUESTS;
    const windowMs = strictLimit?.window || options?.windowMs || SECURITY_CONFIG.RATE_LIMIT.WINDOW_MS;

    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
      // New window or expired entry
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
    } else {
      // Existing window
      if (entry.count >= maxRequests) {
        const retryAfter = Math.ceil((entry.resetTime - now) / 1000);

        // Log suspicious activity with enhanced threat detection
        await logSecurityEvent(c, 'RATE_LIMIT_EXCEEDED', {
          count: entry.count,
          maxRequests,
          userType: isAdmin ? 'admin' : 'regular',
          blocked: true,
          multiple: entry.count > maxRequests * 2, // Flag as multiple violations
          suspicious: true
        });

        return c.json({
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
          retryAfter
        }, 429, {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.ceil(entry.resetTime / 1000).toString(),
          'X-RateLimit-User-Type': 'regular'
        });
      }

      entry.count++;
      rateLimitStore.set(key, entry);
    }

    // Add rate limit headers
    const remaining = Math.max(0, maxRequests - (rateLimitStore.get(key)?.count || 0));
    c.header('X-RateLimit-Limit', maxRequests.toString());
    c.header('X-RateLimit-Remaining', remaining.toString());
    c.header('X-RateLimit-Reset', Math.ceil((rateLimitStore.get(key)?.resetTime || now) / 1000).toString());
    c.header('X-RateLimit-User-Type', 'regular');

    await next();
  };
}

// Security headers middleware
export function securityHeadersMiddleware() {
  return async (c: Context, next: Next) => {
    await next();

    // Set security headers (without CSP)
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('X-Frame-Options', 'SAMEORIGIN');
    c.header('X-XSS-Protection', '1; mode=block');
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    c.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    // HSTS for HTTPS
    if (c.req.url.startsWith('https://')) {
      c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }

    // Remove server information
    c.header('Server', '');
  };
}

// Input validation and sanitization middleware
export function inputValidationMiddleware(options?: { excludePaths?: string[] }) {
  return async (c: Context, next: Next) => {
    const path = new URL(c.req.url).pathname;
    const excludePaths = options?.excludePaths || ['/api/auth/login', '/api/auth/register'];

    // Skip input validation for certain paths (like authentication)
    if (excludePaths.some(excludePath => path.startsWith(excludePath))) {
      await next();
      return;
    }

    try {
      const contentType = c.req.header('content-type');

      if (contentType?.includes('application/json')) {
        // Check if request body is empty before parsing
        const rawBody = await c.req.text();

        if (rawBody.trim()) {
          try {
            const body = JSON.parse(rawBody);

            // Validate and sanitize input
            const sanitized = sanitizeObject(body);

            // Store sanitized data in context for access by route handlers
            c.set('sanitizedBody', sanitized);
          } catch (parseError) {
            console.error('JSON parse error in input validation:', parseError);

            // Log potential malicious input
            await logSecurityEvent(c, 'MALICIOUS_INPUT_DETECTED', {
              error: parseError instanceof Error ? parseError.message : 'JSON parse error',
              blocked: true,
              suspicious: true,
              payload: 'Invalid JSON payload'
            });

            return c.json({
              error: 'Invalid JSON data',
              message: 'Request contains invalid JSON content'
            }, 400);
          }
        } else {
          // Empty body is valid for some endpoints (like join game)
          c.set('sanitizedBody', {});
        }
      }

      await next();
    } catch (error) {
      console.error('Input validation error:', error);

      // Log potential XSS/SQL injection attempt
      await logSecurityEvent(c, 'MALICIOUS_INPUT_DETECTED', {
        error: error instanceof Error ? error.message : 'Unknown validation error',
        blocked: true,
        suspicious: true,
        payload: c.req.header('content-type')?.includes('application/json') ? 'JSON payload' : 'Unknown payload'
      });

      return c.json({
        error: 'Invalid request data',
        message: 'Request contains invalid or malicious content'
      }, 400);
    }
  };
}

// Sanitize object recursively
function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = sanitizeString(key);
      sanitized[sanitizedKey] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
}

// Basic string sanitization
function sanitizeString(str: string): string {
  if (typeof str !== 'string') return str;
  
  // Remove potential XSS patterns
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

// CSRF protection middleware
export function csrfProtectionMiddleware() {
  return async (c: Context, next: Next) => {
    const method = c.req.method.toLowerCase();
    
    // Only protect state-changing methods
    if (['post', 'put', 'delete', 'patch'].includes(method)) {
      const token = c.req.header(SECURITY_CONFIG.CSRF.HEADER_NAME);
      const cookieToken = getCookie(c, SECURITY_CONFIG.CSRF.COOKIE_NAME);
      
      if (!token || !cookieToken || token !== cookieToken) {
        // Log CSRF attack attempt
        await logSecurityEvent(c, 'CSRF_TOKEN_MISMATCH', {
          providedToken: token ? 'present' : 'missing',
          cookieToken: cookieToken ? 'present' : 'missing',
          blocked: true,
          suspicious: true
        });

        return c.json({
          error: 'CSRF token mismatch',
          message: 'Invalid or missing CSRF token'
        }, 403);
      }
    }
    
    await next();
  };
}

// Generate CSRF token
export function generateCSRFToken(c: Context): string {
  // Use Web Crypto API (compatible with Cloudflare Workers)
  const array = new Uint8Array(SECURITY_CONFIG.CSRF.TOKEN_LENGTH);
  crypto.getRandomValues(array);
  const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  
  setCookie(c, SECURITY_CONFIG.CSRF.COOKIE_NAME, token, {
    httpOnly: true,
    secure: c.req.url.startsWith('https://'),
    sameSite: 'Strict',
    maxAge: 24 * 60 * 60 // 24 hours
  });
  
  return token;
}

// File upload security validation
export function validateFileUpload(file: File, allowedTypes: string[] = [], maxSize?: number) {
  const errors: string[] = [];

  // Use dynamic configuration
  const config = getSecurityConfig();
  const defaultMaxSize = config.FILE_UPLOAD.MAX_SIZE;
  const defaultAllowedTypes = config.FILE_UPLOAD.ALLOWED_TYPES;

  // Determine which values to use
  const effectiveMaxSize = maxSize || defaultMaxSize;
  const effectiveAllowedTypes = allowedTypes.length > 0 ? allowedTypes : defaultAllowedTypes;

  // Check file size
  if (file.size > effectiveMaxSize) {
    errors.push(`File size exceeds maximum allowed size of ${Math.round(effectiveMaxSize / 1024 / 1024)}MB`);
  }

  // Check file type
  if (effectiveAllowedTypes.length > 0 && !effectiveAllowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed. Allowed types: ${effectiveAllowedTypes.join(', ')}`);
  }

  // Check for potentially dangerous file extensions (also configurable via env)
  const dangerousExtensions = process.env.BLOCKED_FILE_EXTENSIONS?.split(',') || ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.jar', '.class'];
  const fileName = file.name.toLowerCase();
  const isDangerous = dangerousExtensions.some(ext => fileName.endsWith(ext));

  if (isDangerous) {
    errors.push('File type is potentially dangerous and not allowed');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Security logging utility
export async function logSecurityEvent(c: Context, event: string, details: any = {}) {
  const securityLog = {
    timestamp: new Date().toISOString(),
    event,
    ip: getClientIP(c),
    userAgent: c.req.header('user-agent') || 'unknown',
    url: c.req.url,
    method: c.req.method,
    ...details
  };

  // Log to console for immediate visibility
  console.warn('[SECURITY]', JSON.stringify(securityLog));

  // Determine event level and threat type
  const { level, threatType } = getEventClassification(event, details);

  // Store in database for dashboard monitoring
  try {
    await logSecurityEventDb(
      event,
      level,
      event, // Use event as message for now
      {
        userId: details.userId,
        userName: details.userName,
        ipAddress: securityLog.ip,
        userAgent: securityLog.userAgent,
        url: securityLog.url,
        method: securityLog.method,
        requestData: details,
        headers: details.headers
      }
    );

    // Also log as threat attack if it's a security threat
    if (threatType) {
      await logThreatAttack(threatType, securityLog.ip, {
        userAgent: securityLog.userAgent,
        url: securityLog.url,
        method: securityLog.method,
        payload: details.payload || details.requestData,
        blocked: details.blocked !== false, // Default to true unless explicitly false
        userId: details.userId,
        riskScore: calculateRiskScore(event, details)
      });
    }
  } catch (error) {
    console.error('Failed to log security event to database:', error);
  }
}

// Classify security events and determine threat types
function getEventClassification(event: string, details: any): { level: 'info' | 'warning' | 'error' | 'critical', threatType?: string } {
  const eventLower = event.toLowerCase();

  // Critical threats
  if (eventLower.includes('sql_injection') || eventLower.includes('command_injection') ||
      eventLower.includes('remote_code_execution')) {
    return { level: 'critical', threatType: 'sql_injection' };
  }

  // High-risk threats
  if (eventLower.includes('brute_force') || eventLower.includes('multiple_failed_login') ||
      eventLower.includes('account_lockout')) {
    return { level: 'error', threatType: 'brute_force' };
  }

  // Medium-risk threats
  if (eventLower.includes('csrf') || eventLower.includes('xss') ||
      eventLower.includes('rate_limit_exceeded')) {
    return { level: 'warning', threatType: eventLower.includes('csrf') ? 'csrf' : 'xss' };
  }

  // Suspicious activity
  if (eventLower.includes('suspicious_ip') || eventLower.includes('blocked_ip') ||
      eventLower.includes('dev_tools')) {
    return { level: 'warning', threatType: 'suspicious_ip' };
  }

  // File upload security
  if (eventLower.includes('file_upload') || eventLower.includes('malicious_file')) {
    return { level: 'warning', threatType: 'malicious_file' };
  }

  // Authentication failures
  if (eventLower.includes('invalid_login') || eventLower.includes('authentication_failure')) {
    return { level: 'warning', threatType: 'brute_force' };
  }

  // Default classification
  return { level: 'info' };
}

// Calculate risk score for threat attacks
function calculateRiskScore(event: string, details: any): number {
  let score = 1; // Base score

  const eventLower = event.toLowerCase();

  // Score based on threat type
  if (eventLower.includes('sql_injection') || eventLower.includes('command_injection')) score += 9;
  else if (eventLower.includes('brute_force')) score += 7;
  else if (eventLower.includes('xss') || eventLower.includes('csrf')) score += 6;
  else if (eventLower.includes('suspicious_ip')) score += 5;
  else if (eventLower.includes('rate_limit')) score += 3;
  else if (eventLower.includes('dev_tools')) score += 1;

  // Score based on additional factors
  if (details.multiple) score += 2;
  if (details.repeated) score += 2;
  if (details.suspicious) score += 1;
  if (details.blocked) score += 1;

  return Math.min(score, 10); // Cap at 10
}

// API key validation middleware (for sensitive admin endpoints)
export function apiKeyValidationMiddleware(requiredRole: 'admin' | 'moderator' = 'admin') {
  return async (c: Context, next: Next) => {
    const apiKey = c.req.header('x-api-key');
    const expectedKey = c.env?.API_KEY || process.env.API_KEY;
    
    if (!expectedKey) {
      console.warn('API_KEY not configured in environment variables');
      return c.json({ error: 'API key validation not configured' }, 500);
    }
    
    if (!apiKey || apiKey !== expectedKey) {
      await logSecurityEvent(c, 'INVALID_API_KEY', {
        providedKey: apiKey ? 'present' : 'missing',
        blocked: true,
        suspicious: true
      });
      return c.json({ error: 'Invalid or missing API key' }, 401);
    }
    
    await next();
  };
}

// Cleanup expired rate limit entries (call periodically)
export function cleanupRateLimit() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Note: Periodic cleanup would need to be implemented differently in Cloudflare Workers
// Consider using Cloudflare Cron Triggers or cleaning up entries on each request
