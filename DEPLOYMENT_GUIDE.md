# Faith Defenders - Cloudflare Deployment Guide

## ✅ **WORKING LOCALLY**
- **Live URL**: https://3000-iwmjaxyq3yzhu28hvbg7o.e2b.dev/
- **Articles Test**: https://3000-iwmjaxyq3yzhu28hvbg7o.e2b.dev/articles/9
- **API Test**: https://3000-iwmjaxyq3yzhu28hvbg7o.e2b.dev/api/categories

## 🔑 **EXACT WORKING ENVIRONMENT VARIABLES**

These are the **exact variables** that make the local server work:

```bash
DATABASE_URL=postgres://neondb_owner:npg_[TOKEN]@ep-weathered-mode-adqdxv9w-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
GOOGLE_CLIENT_ID=576536938340-[CLIENT_ID].apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-[SECRET]
ENVIRONMENT=production
```

## 🚀 **DEPLOYMENT COMMANDS**

### After setting up Cloudflare API key in Deploy tab:

```bash
cd /home/user/webapp

# Deploy to existing gospelways project
npx wrangler pages deploy dist --project-name gospelways

# Or create new deployment with environment
npx wrangler pages deploy dist --project-name gospelways --env production
```

### Set Production Environment Variables:
```bash
# Add each environment variable (use the working values from .dev.vars)
npx wrangler pages secret put DATABASE_URL --project-name gospelways
npx wrangler pages secret put GOOGLE_CLIENT_ID --project-name gospelways  
npx wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name gospelways
npx wrangler pages secret put ENVIRONMENT --project-name gospelways
```

## 📂 **PROJECT STATUS**
- ✅ **Built**: `dist/_worker.js` (711.74 kB)
- ✅ **Tested**: All APIs, database, frontend working
- ✅ **Config**: wrangler.jsonc updated for `gospelways`
- ✅ **Variables**: .dev.vars created with working values

## 🎯 **NEXT STEPS**
1. **Set up Cloudflare API key** in the Deploy tab
2. **Run deployment command** above
3. **Add environment variables** using the exact values that work locally
4. **Test production deployment**

Your local server proves everything works with these exact configurations!