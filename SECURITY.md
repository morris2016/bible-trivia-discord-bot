# Faith Defenders - Security Documentation

## 🔒 Security Improvements Implemented

### 1. **Removed Hardcoded Credentials**
- ✅ **Removed all hardcoded admin emails and passwords from source code**
- ✅ **Moved sensitive configuration to environment variables**
- ✅ **No sensitive data will be exposed in GitHub repository**

### 2. **Environment Variables Configuration**

#### Local Development (.dev.vars)
```env
# Admin Configuration (CHANGE THESE VALUES!)
ADMIN_EMAIL=your-admin-email@example.com
ADMIN_NAME=Your Admin Name
ADMIN_PASSWORD=YourSecurePassword123!

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
FROM_EMAIL=Your Project <your-email@gmail.com>
FROM_NAME=Your Project Name

# Google OAuth (if using)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email Testing (set to true for console logging during development)
USE_ETHEREAL_EMAIL=false
```

#### Production Deployment (Cloudflare Workers)
Set these environment variables using `wrangler secret put`:

```bash
# Admin Configuration
npx wrangler secret put ADMIN_EMAIL
npx wrangler secret put ADMIN_NAME  
npx wrangler secret put ADMIN_PASSWORD

# Email Configuration
npx wrangler secret put SMTP_HOST
npx wrangler secret put SMTP_PORT
npx wrangler secret put SMTP_USER
npx wrangler secret put SMTP_PASS
npx wrangler secret put FROM_EMAIL
npx wrangler secret put FROM_NAME

# Google OAuth
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET

# Email Mode (set to false for production)
npx wrangler secret put USE_ETHEREAL_EMAIL
```

### 3. **Password Reset & Recovery System**

#### Features Implemented:
- ✅ **Forgot Password Flow**: Users can request password reset via email
- ✅ **6-digit OTP System**: Secure one-time passwords with 15-minute expiration
- ✅ **Email Templates**: Professional password reset emails with security warnings
- ✅ **Security Measures**: Attempt limits, IP logging, expiration times
- ✅ **OAuth Protection**: Google OAuth users are protected (password managed by Google)

#### Endpoints:
- `POST /api/auth/request-password-reset` - Request password reset code
- `POST /api/auth/reset-password` - Reset password with OTP code
- `POST /api/auth/change-password` - Change password for logged-in users

#### Frontend Pages:
- `/forgot-password` - Request password reset form
- `/reset-password?userId=X` - Enter OTP and new password
- `/dashboard` (Settings tab) - Change password for logged-in users

### 4. **Email Security Features**

#### Gmail Integration:
- ✅ **App Password Authentication**: Using Gmail App Passwords for secure SMTP
- ✅ **Professional Templates**: Branded email templates with security warnings
- ✅ **Test Mode**: Console logging for development/testing

#### Email Templates Include:
- **Verification emails** for new user registration
- **Password reset emails** with security warnings
- **Welcome emails** after successful verification

### 5. **Database Security**

#### Admin User Management:
- ✅ **Environment-based Admin Creation**: Admin user created from environment variables
- ✅ **Secure Password Hashing**: bcrypt hashing for all passwords
- ✅ **No Hardcoded Credentials**: All admin details configurable via environment

#### User Data Protection:
- ✅ **Email Verification Required**: Unverified users blocked from sensitive actions
- ✅ **Password Strength Requirements**: Minimum 6 characters for passwords
- ✅ **Secure Session Management**: JWT tokens with HTTP-only cookies

## 🚀 Deployment Security Checklist

### Before Pushing to GitHub:
- [ ] Ensure `.dev.vars` is in `.gitignore`
- [ ] Verify no hardcoded credentials in source code
- [ ] Change default admin credentials in environment variables
- [ ] Test that admin functions work with environment variables

### Before Production Deployment:
- [ ] Set all environment variables using `wrangler secret put`
- [ ] Change admin email and password to production values
- [ ] Configure Gmail App Password for production email account
- [ ] Test email delivery in production environment
- [ ] Verify password reset flow works end-to-end

### Recommended Security Practices:
- [ ] Use strong, unique passwords for admin accounts
- [ ] Regularly rotate Gmail App Passwords
- [ ] Monitor failed login attempts
- [ ] Keep Cloudflare Workers runtime updated
- [ ] Regular security audits of user accounts

## 🔧 Environment Setup Guide

### 1. **Set Up Gmail App Password**
1. Enable 2-Factor Authentication on Gmail account
2. Go to Google Account → Security → App passwords
3. Generate app password for "Faith Defenders Web App"
4. Update `SMTP_PASS` in environment variables

### 2. **Configure Admin Account**
1. Choose secure admin email and password
2. Update `ADMIN_EMAIL`, `ADMIN_NAME`, `ADMIN_PASSWORD` in `.dev.vars`
3. For production, set these using `wrangler secret put`

### 3. **Test Security Features**
1. Test password reset flow: `/forgot-password`
2. Test email delivery with test account
3. Verify unverified users are blocked from commenting
4. Test password change in dashboard settings

## 📧 Email System Status

- ✅ **Gmail SMTP**: Configured and working
- ✅ **Professional Templates**: Faith Defenders branding
- ✅ **Security Features**: OTP codes, expiration, attempt limits
- ✅ **Test Mode**: Available for development
- ✅ **Production Ready**: Real email delivery working

## 🛡️ Security Notes

### What's Protected:
- Admin credentials moved to environment variables
- No sensitive data in GitHub repository
- Secure password reset with email verification
- Password change functionality for users
- Email verification blocks unverified users

### Current Admin Access:
- Admin email: Set via `ADMIN_EMAIL` environment variable
- Admin password: Set via `ADMIN_PASSWORD` environment variable
- Default fallbacks: `admin@faithdefenders.com` / `ChangeMe123!`

### For Production:
- **MUST** change admin credentials from defaults
- **MUST** set all environment variables using Cloudflare secrets
- **SHOULD** use strong passwords and enable account monitoring

## 🔒 Enhanced Security Features (Latest Update)

### 1. **Rate Limiting & Request Protection**
- ✅ **Global Rate Limiting**: 1000 requests per 15-minute window (professional-grade limits)
- ✅ **Endpoint-Specific Limits**: Reasonable limits on authentication endpoints
  - Login: 20 attempts per 15 minutes
  - Registration: 10 attempts per hour
  - Password Reset: 10 attempts per hour
- ✅ **Admin API Rate Limiting**: 1000 requests per 15 minutes for admin endpoints
- ✅ **Rate Limit Headers**: X-RateLimit-* headers for client awareness

### 2. **Content Security Policy (CSP)**
- ✅ **Strict CSP Headers**: Prevents XSS and injection attacks
- ✅ **Whitelisted Sources**: Only trusted domains for scripts, styles, and resources
- ✅ **Self-Contained Resources**: Minimizes external dependencies
- ✅ **No Unsafe Inline**: Prevents inline script execution (where possible)

### 3. **Input Validation & Sanitization**
- ✅ **Automatic Sanitization**: All JSON inputs sanitized recursively
- ✅ **XSS Prevention**: Removes script tags and dangerous patterns
- ✅ **File Upload Validation**:
  - File type validation with allowlist
  - File size limits (50MB public, 100MB admin)
  - Magic number validation
  - Dangerous file extension blocking

### 4. **CSRF Protection**
- ✅ **Token-Based CSRF**: Secure tokens for state-changing operations
- ✅ **HTTP-Only Cookies**: CSRF tokens stored securely
- ✅ **Automatic Validation**: All POST/PUT/DELETE requests validated
- ✅ **Token Endpoint**: `/csrf-token` for client-side token retrieval

### 5. **Security Headers**
- ✅ **Complete Security Header Suite**:
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - X-XSS-Protection: 1; mode=block
  - Referrer-Policy: strict-origin-when-cross-origin
  - Strict-Transport-Security (HTTPS only)
- ✅ **Permissions Policy**: Restricts dangerous browser features

### 6. **Security Logging & Monitoring**
- ✅ **Comprehensive Audit Logging**: All security events logged
- ✅ **Failed Attempt Tracking**: Login failures, validation failures
- ✅ **File Upload Monitoring**: Upload attempts and validations
- ✅ **Admin Action Logging**: Enhanced logging for admin operations
- ✅ **IP Address Logging**: Client IP tracking for security analysis

### 7. **API Key Protection**
- ✅ **Admin Endpoint Protection**: API key validation for sensitive operations
- ✅ **Environment Variable Configuration**: Secure API key storage
- ✅ **Request Origin Validation**: Additional verification for admin actions

### 8. **Enhanced File Security**
- ✅ **Multi-Layer Validation**: File type, size, and content validation
- ✅ **Security Event Logging**: All file operations logged
- ✅ **Dangerous File Blocking**: Executable files automatically rejected
- ✅ **Upload Monitoring**: Real-time security monitoring

## 🛡️ Security Configuration

### Environment Variables for Security:
```bash
# Security API Key
API_KEY=your-secret-api-key-for-admin-endpoints

# Rate Limiting Configuration
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

# Security Features Toggle
ENABLE_CSRF_PROTECTION=true
ENABLE_RATE_LIMITING=true
ENABLE_SECURITY_HEADERS=true

# Security Reporting
CSP_REPORT_URI=https://your-domain.com/api/security/csp-report
```

### Security Middleware Stack:
1. **Rate Limiting** → Prevents abuse
2. **Security Headers** → Browser-level protection
3. **Input Validation** → Data sanitization
4. **CSRF Protection** → State-changing operation protection
5. **Authentication** → User verification
6. **Authorization** → Permission validation

## 📊 Security Monitoring

### Logged Security Events:
- `USER_REGISTRATION_ATTEMPT` / `USER_REGISTRATION_SUCCESS` / `USER_REGISTRATION_FAILED`
- `LOGIN_ATTEMPT` / `LOGIN_SUCCESS` / `LOGIN_FAILED`
- `FILE_UPLOAD_VALIDATION_FAILED` / `FILE_UPLOAD_VALIDATED`
- `ADMIN_FILE_UPLOAD_STARTED` / `ADMIN_FILE_UPLOAD_SUCCESS` / `ADMIN_FILE_UPLOAD_FAILED`
- `INVALID_API_KEY` / `CSRF_TOKEN_MISMATCH`
- Rate limit violations and suspicious activities

### Security Response Procedures:
1. **Rate Limit Exceeded**: 429 status with retry-after header
2. **CSRF Validation Failed**: 403 status with clear error message
3. **File Validation Failed**: 400 status with detailed validation errors
4. **Authentication Failed**: 401 status with generic error message
5. **Authorization Failed**: 403 status with permission details

## 🚨 Security Incident Response

### Monitoring Recommendations:
- Set up alerts for repeated security event patterns
- Monitor for unusual file upload activities
- Track failed authentication attempts by IP
- Alert on admin privilege escalation attempts
- Monitor for CSRF token mismatches

### Production Security Checklist:
- [ ] Configure strong API keys in production
- [ ] Set up security event monitoring and alerting
- [ ] Enable all security features in production environment
- [ ] Configure CSP reporting endpoint
- [ ] Set up rate limiting monitoring
- [ ] Configure file upload size limits appropriately
- [ ] Test CSRF protection on all forms
- [ ] Verify security headers are applied
- [ ] Test rate limiting thresholds
- [ ] Validate input sanitization is working