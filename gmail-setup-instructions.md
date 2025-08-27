# Gmail App Password Setup for Faith Defenders

## 📧 Email Account: hakunamatataministry@gmail.com

### Step 1: Enable 2-Factor Authentication (if not already enabled)
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Sign in with `hakunamatataministry@gmail.com`
3. Under "Signing in to Google" → Click **2-Step Verification**
4. Follow the setup process if not already enabled

### Step 2: Generate Gmail App Password
1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select **Mail** as the app type
3. Select **Other (Custom name)** as the device
4. Enter: **Faith Defenders Website**
5. Click **Generate**
6. Copy the 16-character password (format: `xxxx xxxx xxxx xxxx`)

### Step 3: Update .dev.vars File
Replace `your-gmail-app-password` in `/home/user/webapp/.dev.vars` with the generated app password:

```env
SMTP_PASS=your-generated-app-password-here
```

### Step 4: Test Email Configuration
After updating the app password:

```bash
# Rebuild the project
cd /home/user/webapp && npm run build && pm2 restart faith-defenders

# Test email sending
curl -X POST http://localhost:3000/api/auth/test-email -H "Content-Type: application/json"
```

### Step 5: Test Registration Flow
1. Register a new user
2. Check Gmail inbox for verification email
3. Use OTP code to verify account

## 🔧 Current Configuration

- **SMTP Host**: smtp.gmail.com
- **SMTP Port**: 587
- **Email**: hakunamatataministry@gmail.com
- **From Name**: Faith Defenders
- **Test Mode**: Disabled (will use real Gmail)

## 📧 Email Templates

The system sends two types of emails:

1. **Verification Email**: 6-digit OTP code with Faith Defenders branding
2. **Welcome Email**: Confirmation after successful verification

Both emails will be sent from `hakunamatataministry@gmail.com` with proper Faith Defenders branding.

## 🚨 Security Notes

- Never share the Gmail app password
- App passwords are specific to applications
- You can revoke and regenerate app passwords anytime
- App passwords work even if you change your Gmail password

## 📞 Support

If you encounter issues:
- Contact: hakunamatataministry@gmail.com
- Check PM2 logs: `pm2 logs faith-defenders --lines 20`