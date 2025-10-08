# Cloudflare R2 File Storage Setup Guide

## Issue Summary
The PDF upload functionality is working (text extraction succeeds), but the original PDF files are not being stored properly for download. The download links are pointing to incorrect URLs.

## Root Cause
The application is using a hardcoded R2 public bucket URL that doesn't match your actual R2 bucket configuration.

## Solution Steps

### 1. Configure Your R2 Bucket
1. Go to your Cloudflare Dashboard
2. Navigate to R2 → Create bucket (or use existing)
3. Set bucket name to `faith-defenders-files`
4. Make the bucket public by creating a custom domain or using the default public URL

### 2. Get Your Public Bucket URL
Your public bucket URL will be in one of these formats:
- `https://YOUR_BUCKET_NAME.YOUR_ACCOUNT_ID.r2.cloudflarestorage.com`
- `https://pub-YOUR_BUCKET_ID.r2.dev` (if you set up a custom domain)
- Or your custom domain if configured

### 3. Update Environment Variables
Add these to your `.env` file or Cloudflare Pages environment:

```env
# R2 Configuration
CF_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_PUBLIC_BUCKET_URL=https://your-actual-public-bucket-url.com
FILES_BUCKET_NAME=faith-defenders-files
```

### 4. Update Wrangler Configuration
Your `wrangler.toml` should include:

```toml
# R2 Bucket for file storage
[[r2_buckets]]
binding = "FILES_BUCKET"
bucket_name = "faith-defenders-files"
preview_bucket_name = "faith-defenders-files"

# Environment variables
[vars]
R2_PUBLIC_BUCKET_URL = "https://your-actual-public-bucket-url.com"
```

### 5. Test the Configuration
1. Upload a PDF file through the admin panel
2. Check that the download URL is correct
3. Verify that clicking download actually downloads the original PDF

## Current Status
- ✅ File upload to R2: Working
- ✅ Text extraction from PDFs: Working
- ❌ Download URLs: Using incorrect hardcoded URL
- ❌ R2 bucket public access: Needs verification

## Quick Fix
If you want to test immediately, you can temporarily update the hardcoded URL in `src/file-storage.ts` line 70:

```typescript
// Change this line:
const url = `https://pub-0c59aab122ea42978848de95fffb0d86.r2.dev/${key}`;

// To your actual public bucket URL:
const url = `https://YOUR_ACTUAL_BUCKET_URL/${key}`;
```

## Next Steps
1. Set up your R2 bucket with public access
2. Configure the correct public URL in environment variables
3. Test file upload and download functionality
4. Deploy to production with proper R2 configuration