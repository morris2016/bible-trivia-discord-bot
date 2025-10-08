import nodemailer from 'nodemailer'

// Email service configuration
export interface EmailConfig {
  host: string
  port: number
  secure?: boolean
  auth: {
    user: string
    pass: string
  }
}

// Get email configuration from environment variables
function getEmailConfig(): EmailConfig {
  return {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || ''
    }
  }
}

// Create reusable transporter
async function createTransporter(env?: any) {
  // Use env from Cloudflare context or fallback to process.env
  const USE_ETHEREAL_EMAIL = env?.USE_ETHEREAL_EMAIL || process.env.USE_ETHEREAL_EMAIL
  const SMTP_HOST = env?.SMTP_HOST || process.env.SMTP_HOST
  const SMTP_PORT = env?.SMTP_PORT || process.env.SMTP_PORT
  const SMTP_USER = env?.SMTP_USER || process.env.SMTP_USER
  const SMTP_PASS = env?.SMTP_PASS || process.env.SMTP_PASS
  
  const useEthereal = USE_ETHEREAL_EMAIL === 'true'
  
  console.log('Email service debug:', {
    USE_ETHEREAL_EMAIL,
    SMTP_USER,
    useEthereal,
    envKeys: env ? Object.keys(env) : 'no env provided'
  })
  
  if (useEthereal) {
    console.log('Using test mode - emails will be logged to console instead of sent')
    // Return a mock transporter that logs instead of sending
    return {
      sendMail: async (mailOptions: any) => {
        console.log('📧 TEST EMAIL WOULD BE SENT:')
        console.log('To:', mailOptions.to)
        console.log('Subject:', mailOptions.subject)
        console.log('Content:', mailOptions.text || 'HTML content available')
        return { messageId: 'test-' + Date.now() }
      },
      verify: async () => true
    }
  }
  
  const config = {
    host: SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(SMTP_PORT || '587'),
    secure: SMTP_PORT === '465',
    auth: {
      user: SMTP_USER || '',
      pass: SMTP_PASS || ''
    }
  }
  
  if (!config.auth.user || !config.auth.pass || 
      config.auth.user === 'your-email@gmail.com' || 
      config.auth.pass === 'your-app-password' ||
      config.auth.pass === 'your-gmail-app-password') {
    console.warn('Gmail credentials not configured. Please set up Gmail App Password for hakunamatataministry@gmail.com')
    return null
  }
  
  return nodemailer.createTransport(config)
}

// Email templates
export const EmailTemplates = {
  verification: (name: string, otpCode: string) => ({
    subject: '🔐 Verify Your Faith Defenders Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #c8a2c8 0%, #dda0dd 25%, #e6c3e6 50%, #f0d0f0 75%, #c8a2c8 100%); padding: 20px; border-radius: 10px;">
        <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2d1b2d; margin: 0; font-size: 28px;">Faith Defenders</h1>
            <p style="color: #666; margin: 5px 0;">Defending and sharing the Christian faith</p>
          </div>
          
          <h2 style="color: #2d1b2d; margin-bottom: 20px;">Welcome, ${name}!</h2>
          
          <p style="color: #333; line-height: 1.6; margin-bottom: 25px;">
            Thank you for joining Faith Defenders! To complete your registration and verify your email address, 
            please use the verification code below:
          </p>
          
          <div style="background: #f8f9fa; border: 2px dashed #dee2e6; border-radius: 8px; padding: 25px; text-align: center; margin: 30px 0;">
            <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Your verification code:</p>
            <div style="font-size: 36px; font-weight: bold; color: #2d1b2d; letter-spacing: 5px; font-family: monospace;">
              ${otpCode}
            </div>
            <p style="margin: 10px 0 0 0; color: #666; font-size: 12px;">This code expires in 15 minutes</p>
          </div>
          
          <p style="color: #333; line-height: 1.6; margin-bottom: 25px;">
            Enter this code on the verification page to activate your account. Once verified, you'll be able to:
          </p>
          
          <ul style="color: #333; line-height: 1.8; margin-bottom: 25px; padding-left: 20px;">
            <li>📝 Write and publish articles</li>
            <li>📚 Share Christian resources</li>
            <li>💬 Engage with our community</li>
            <li>🎯 Access exclusive content</li>
          </ul>
          
          <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              If you didn't create an account with Faith Defenders, you can safely ignore this email.
            </p>
            <p style="color: #666; font-size: 14px; margin: 10px 0 0 0;">
              Need help? Contact us at hakunamatataministry@gmail.com
            </p>
          </div>
        </div>
      </div>
    `,
    text: `
      Welcome to Faith Defenders, ${name}!
      
      Thank you for joining our community. To verify your email address, please use this code:
      
      ${otpCode}
      
      This code expires in 15 minutes. Enter it on the verification page to complete your registration.
      
      If you didn't create an account with Faith Defenders, you can safely ignore this email.
      
      Need help? Contact us at hakunamatataministry@gmail.com
    `
  }),
  
  welcomeVerified: (name: string) => ({
    subject: '🎉 Welcome to Faith Defenders - Account Verified!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 20px; border-radius: 10px;">
        <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2d1b2d; margin: 0; font-size: 28px;">🎉 Account Verified!</h1>
          </div>
          
          <h2 style="color: #2d1b2d; margin-bottom: 20px;">Welcome to Faith Defenders, ${name}!</h2>
          
          <p style="color: #333; line-height: 1.6; margin-bottom: 25px;">
            Your email address has been successfully verified and your account is now active! 
            You're ready to start defending and sharing the Christian faith with our community.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="/dashboard" style="background: #16a34a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Go to Your Dashboard
            </a>
          </div>
          
          <p style="color: #333; line-height: 1.6; margin-bottom: 25px;">
            Here's what you can do now:
          </p>
          
          <ul style="color: #333; line-height: 1.8; margin-bottom: 25px; padding-left: 20px;">
            <li>📝 Write your first article</li>
            <li>📚 Share valuable Christian resources</li>
            <li>💬 Comment and engage with other believers</li>
            <li>🔍 Explore our library of apologetics content</li>
          </ul>
          
          <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              Thank you for joining our mission to defend and share the Christian faith!
            </p>
          </div>
        </div>
      </div>
    `,
    text: `
      Welcome to Faith Defenders, ${name}!
      
      Your account has been successfully verified and is now active!
      
      You can now:
      - Write and publish articles
      - Share Christian resources  
      - Engage with our community
      - Access all our content
      
      Visit your dashboard to get started: /dashboard
      
      Thank you for joining our mission!
    `
  }),
  
  passwordReset: (name: string, otpCode: string) => ({
    subject: '🔒 Password Reset Request - Faith Defenders',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #dc2626 0%, #ef4444 25%, #f87171 50%, #fca5a5 75%, #dc2626 100%); padding: 20px; border-radius: 10px;">
        <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2d1b2d; margin: 0; font-size: 28px;">Faith Defenders</h1>
            <p style="color: #666; margin: 5px 0;">Password Reset Request</p>
          </div>

          <h2 style="color: #2d1b2d; margin-bottom: 20px;">Hello ${name},</h2>

          <p style="color: #333; line-height: 1.6; margin-bottom: 25px;">
            We received a request to reset your password for your Faith Defenders account.
            If you made this request, please use the verification code below:
          </p>

          <div style="background: #f8f9fa; border: 2px dashed #dee2e6; border-radius: 8px; padding: 25px; text-align: center; margin: 30px 0;">
            <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Your password reset code:</p>
            <div style="font-size: 36px; font-weight: bold; color: #dc2626; letter-spacing: 5px; font-family: monospace;">
              ${otpCode}
            </div>
            <p style="margin: 10px 0 0 0; color: #666; font-size: 12px;">This code expires in 15 minutes</p>
          </div>

          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 15px; margin: 25px 0;">
            <p style="color: #991b1b; margin: 0; font-size: 14px;">
              <strong>⚠️ Important:</strong> If you didn't request this password reset, please ignore this email.
              Your password will remain unchanged.
            </p>
          </div>

          <p style="color: #333; line-height: 1.6; margin-bottom: 25px;">
            For your security, this code will expire in 15 minutes. If you need to request a new code,
            please visit the password reset page again.
          </p>

          <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              Need help? Contact us at hakunamatataministry@gmail.com
            </p>
          </div>
        </div>
      </div>
    `,
    text: `
      Password Reset Request - Faith Defenders

      Hello ${name},

      We received a request to reset your password for your Faith Defenders account.

      Your password reset code: ${otpCode}

      This code expires in 15 minutes. Enter it on the password reset page to create a new password.

      If you didn't request this password reset, please ignore this email. Your password will remain unchanged.

      Need help? Contact us at hakunamatataministry@gmail.com
    `
  }),

  adminVerification: (adminName: string, targetUserName: string, newRole: string, verificationToken: string) => ({
    subject: '🛡️ Admin Role Change Verification - Faith Defenders',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 25%, #a78bfa 50%, #c4b5fd 75%, #7c3aed 100%); padding: 20px; border-radius: 10px;">
        <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2d1b2d; margin: 0; font-size: 28px;">🛡️ Faith Defenders</h1>
            <p style="color: #666; margin: 5px 0;">Admin Role Change Verification</p>
          </div>

          <h2 style="color: #2d1b2d; margin-bottom: 20px;">Hello ${adminName},</h2>

          <p style="color: #333; line-height: 1.6; margin-bottom: 25px;">
            You have requested to change the role of user <strong>${targetUserName}</strong> to <strong>${newRole}</strong>.
            This is a critical security action that requires your verification.
          </p>

          <div style="background: #f8f9fa; border: 2px dashed #dee2e6; border-radius: 8px; padding: 25px; text-align: center; margin: 30px 0;">
            <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Your verification token:</p>
            <div style="font-size: 32px; font-weight: bold; color: #7c3aed; letter-spacing: 3px; font-family: monospace; word-break: break-all;">
              ${verificationToken}
            </div>
            <p style="margin: 10px 0 0 0; color: #666; font-size: 12px;">This token expires in 15 minutes</p>
          </div>

          <div style="background: #fefce8; border: 1px solid #fde047; border-radius: 6px; padding: 15px; margin: 25px 0;">
            <p style="color: #92400e; margin: 0; font-size: 14px;">
              <strong>⚠️ Security Notice:</strong> This action will ${newRole === 'admin' ? 'grant administrative privileges' : newRole === 'moderator' ? 'grant moderation privileges' : 'revoke elevated privileges'} for user ${targetUserName}.
              Please ensure this change is authorized and necessary.
            </p>
          </div>

          <p style="color: #333; line-height: 1.6; margin-bottom: 25px;">
            To complete this role change, please enter the verification token above in the admin panel.
            If you did not request this change, please contact security immediately.
          </p>

          <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              This is an automated security notification from Faith Defenders.
            </p>
            <p style="color: #666; font-size: 14px; margin: 10px 0 0 0;">
              Need help? Contact security at hakunamatataministry@gmail.com
            </p>
          </div>
        </div>
      </div>
    `,
    text: `
      Admin Role Change Verification - Faith Defenders

      Hello ${adminName},

      You have requested to change the role of user ${targetUserName} to ${newRole}.
      This is a critical security action that requires your verification.

      Your verification token: ${verificationToken}

      This token expires in 15 minutes.

      SECURITY NOTICE: This action will ${newRole === 'admin' ? 'grant administrative privileges' : newRole === 'moderator' ? 'grant moderation privileges' : 'revoke elevated privileges'} for user ${targetUserName}.

      To complete this role change, please enter the verification token above in the admin panel.
      If you did not request this change, please contact security immediately.

      This is an automated security notification from Faith Defenders.
      Need help? Contact security at hakunamatataministry@gmail.com
    `
  })
}

// Send verification email
export async function sendVerificationEmail(
  email: string,
  name: string,
  otpCode: string,
  env?: any
): Promise<{ success: boolean; messageId?: string; error?: string; previewUrl?: string }> {
  try {
    const transporter = await createTransporter(env)
    
    if (!transporter) {
      return { success: false, error: 'Email service not configured' }
    }
    
    const template = EmailTemplates.verification(name, otpCode)
    const fromEmail = env?.FROM_EMAIL || process.env.FROM_EMAIL || 'Faith Defenders <noreply@faithdefenders.com>'
    
    const info = await transporter.sendMail({
      from: fromEmail,
      to: email,
      subject: template.subject,
      text: template.text,
      html: template.html
    })
    
    console.log('Verification email sent successfully:', info.messageId)
    
    // If using Ethereal Email, provide preview URL
    const useEthereal = env?.USE_ETHEREAL_EMAIL === 'true' || process.env.USE_ETHEREAL_EMAIL === 'true'
    const previewUrl = useEthereal 
      ? nodemailer.getTestMessageUrl(info) 
      : undefined
    
    if (useEthereal) {
      console.log('📧 Email sent in test mode - check console output above')
    }
    
    return { success: true, messageId: info.messageId, previewUrl }
    
  } catch (error) {
    console.error('Error sending verification email:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown email error' 
    }
  }
}

// Send welcome email after verification
export async function sendWelcomeEmail(
  email: string,
  name: string,
  env?: any
): Promise<{ success: boolean; messageId?: string; error?: string; previewUrl?: string }> {
  try {
    const transporter = await createTransporter(env)
    
    if (!transporter) {
      return { success: false, error: 'Email service not configured' }
    }
    
    const template = EmailTemplates.welcomeVerified(name)
    const fromEmail = env?.FROM_EMAIL || process.env.FROM_EMAIL || 'Faith Defenders <noreply@faithdefenders.com>'
    
    const info = await transporter.sendMail({
      from: fromEmail,
      to: email,
      subject: template.subject,
      text: template.text,
      html: template.html
    })
    
    console.log('Welcome email sent successfully:', info.messageId)
    
    // If using Ethereal Email, provide preview URL
    const useEthereal = env?.USE_ETHEREAL_EMAIL === 'true' || process.env.USE_ETHEREAL_EMAIL === 'true'
    const previewUrl = useEthereal 
      ? nodemailer.getTestMessageUrl(info) 
      : undefined
    
    if (previewUrl) {
      console.log('📧 Welcome email preview URL:', previewUrl)
    }
    
    return { success: true, messageId: info.messageId, previewUrl }
    
  } catch (error) {
    console.error('Error sending welcome email:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown email error' 
    }
  }
}

// Send password reset email
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  otpCode: string,
  env?: any
): Promise<{ success: boolean; messageId?: string; error?: string; previewUrl?: string }> {
  try {
    const transporter = await createTransporter(env)

    if (!transporter) {
      return { success: false, error: 'Email service not configured' }
    }

    const template = EmailTemplates.passwordReset(name, otpCode)
    const fromEmail = env?.FROM_EMAIL || process.env.FROM_EMAIL || 'Faith Defenders <noreply@faithdefenders.com>'

    const info = await transporter.sendMail({
      from: fromEmail,
      to: email,
      subject: template.subject,
      text: template.text,
      html: template.html
    })

    console.log('Password reset email sent successfully:', info.messageId)

    // If using Ethereal Email, provide preview URL
    const useEthereal = env?.USE_ETHEREAL_EMAIL === 'true' || process.env.USE_ETHEREAL_EMAIL === 'true'
    const previewUrl = useEthereal
      ? nodemailer.getTestMessageUrl(info)
      : undefined

    if (previewUrl) {
      console.log('📧 Password reset email preview URL:', previewUrl)
    }

    return { success: true, messageId: info.messageId, previewUrl }

  } catch (error) {
    console.error('Error sending password reset email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown email error'
    }
  }
}

// Send admin verification email
export async function sendAdminVerificationEmail(
  adminEmail: string,
  adminName: string,
  targetUserName: string,
  newRole: string,
  verificationToken: string,
  env?: any
): Promise<{ success: boolean; messageId?: string; error?: string; previewUrl?: string }> {
  try {
    const transporter = await createTransporter(env)

    if (!transporter) {
      return { success: false, error: 'Email service not configured' }
    }

    const template = EmailTemplates.adminVerification(adminName, targetUserName, newRole, verificationToken)
    const fromEmail = env?.FROM_EMAIL || process.env.FROM_EMAIL || 'Faith Defenders <security@faithdefenders.com>'

    const info = await transporter.sendMail({
      from: fromEmail,
      to: adminEmail,
      subject: template.subject,
      text: template.text,
      html: template.html
    })

    console.log('Admin verification email sent successfully:', info.messageId)

    // If using Ethereal Email, provide preview URL
    const useEthereal = env?.USE_ETHEREAL_EMAIL === 'true' || process.env.USE_ETHEREAL_EMAIL === 'true'
    const previewUrl = useEthereal
      ? nodemailer.getTestMessageUrl(info)
      : undefined

    if (previewUrl) {
      console.log('📧 Admin verification email preview URL:', previewUrl)
    }

    return { success: true, messageId: info.messageId, previewUrl }

  } catch (error) {
    console.error('Error sending admin verification email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown email error'
    }
  }
}

// Test email configuration
export async function testEmailConfig(env?: any): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = await createTransporter(env)
    
    if (!transporter) {
      return { success: false, error: 'Email service not configured' }
    }
    
    // Skip verify() for test mode
    const useTestMode = env?.USE_ETHEREAL_EMAIL === 'true' || process.env.USE_ETHEREAL_EMAIL === 'true'
    if (!useTestMode) {
      await transporter.verify()
    }
    
    console.log('Email configuration is valid')
    return { success: true }
    
  } catch (error) {
    console.error('Email configuration test failed:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown configuration error' 
    }
  }
}