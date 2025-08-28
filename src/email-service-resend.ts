// Resend email service - Cloudflare Workers compatible
import { Resend } from 'resend';

// Initialize Resend with API key from environment
function getResend(env?: any): Resend | null {
  const apiKey = env?.RESEND_API_KEY || process.env.RESEND_API_KEY;
  
  console.log('Resend API Key Debug:', {
    hasEnv: !!env,
    envKeys: env ? Object.keys(env) : [],
    hasApiKeyInEnv: !!env?.RESEND_API_KEY,
    hasApiKeyInProcess: !!process.env.RESEND_API_KEY,
    apiKeyLength: apiKey ? apiKey.length : 0,
    apiKeyPrefix: apiKey ? apiKey.substring(0, 8) + '...' : 'none'
  });
  
  if (!apiKey) {
    console.warn('RESEND_API_KEY not found. Please configure Resend API key for email functionality.');
    return null;
  }
  
  return new Resend(apiKey);
}

// Email templates (keeping the same beautiful templates)
export const EmailTemplates = {
  verification: (name: string, otpCode: string) => ({
    subject: '🔐 Verify Your Gospel Ways Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #c8a2c8 0%, #dda0dd 25%, #e6c3e6 50%, #f0d0f0 75%, #c8a2c8 100%); padding: 20px; border-radius: 10px;">
        <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2d1b2d; margin: 0; font-size: 28px;">Gospel Ways</h1>
            <p style="color: #666; margin: 5px 0;">Defending and sharing the Christian faith</p>
          </div>
          
          <h2 style="color: #2d1b2d; margin-bottom: 20px;">Welcome, ${name}!</h2>
          
          <p style="color: #333; line-height: 1.6; margin-bottom: 25px;">
            Thank you for joining Gospel Ways! To complete your registration and verify your email address, 
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
              If you didn't create an account with Gospel Ways, you can safely ignore this email.
            </p>
            <p style="color: #666; font-size: 14px; margin: 10px 0 0 0;">
              Need help? Contact us at hakunamatataministry@gmail.com
            </p>
          </div>
        </div>
      </div>
    `,
    text: `
      Welcome to Gospel Ways, ${name}!
      
      Thank you for joining our community. To verify your email address, please use this code:
      
      ${otpCode}
      
      This code expires in 15 minutes. Enter it on the verification page to complete your registration.
      
      If you didn't create an account with Gospel Ways, you can safely ignore this email.
      
      Need help? Contact us at hakunamatataministry@gmail.com
    `
  }),
  
  welcomeVerified: (name: string) => ({
    subject: '🎉 Welcome to Gospel Ways - Account Verified!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 20px; border-radius: 10px;">
        <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2d1b2d; margin: 0; font-size: 28px;">🎉 Account Verified!</h1>
          </div>
          
          <h2 style="color: #2d1b2d; margin-bottom: 20px;">Welcome to Gospel Ways, ${name}!</h2>
          
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
      Welcome to Gospel Ways, ${name}!
      
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
    subject: '🔒 Password Reset Request - Gospel Ways',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #dc2626 0%, #ef4444 25%, #f87171 50%, #fca5a5 75%, #dc2626 100%); padding: 20px; border-radius: 10px;">
        <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2d1b2d; margin: 0; font-size: 28px;">Gospel Ways</h1>
            <p style="color: #666; margin: 5px 0;">Password Reset Request</p>
          </div>
          
          <h2 style="color: #2d1b2d; margin-bottom: 20px;">Hello ${name},</h2>
          
          <p style="color: #333; line-height: 1.6; margin-bottom: 25px;">
            We received a request to reset your password for your Gospel Ways account. 
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
      Password Reset Request - Gospel Ways
      
      Hello ${name},
      
      We received a request to reset your password for your Gospel Ways account.
      
      Your password reset code: ${otpCode}
      
      This code expires in 15 minutes. Enter it on the password reset page to create a new password.
      
      If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
      
      Need help? Contact us at hakunamatataministry@gmail.com
    `
  })
};

// Send verification email using Resend
export async function sendVerificationEmail(
  email: string,
  name: string,
  otpCode: string,
  env?: any
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const resend = getResend(env);
    
    if (!resend) {
      // Fallback to console logging if no API key (development mode)
      console.log('📧 VERIFICATION EMAIL (Development Mode):');
      console.log('To:', email);
      console.log('Name:', name);
      console.log('OTP Code:', otpCode);
      console.log('Subject:', EmailTemplates.verification(name, otpCode).subject);
      
      return { 
        success: true, 
        messageId: `dev-${Date.now()}`,
        error: 'Development mode - email logged to console' 
      };
    }
    
    const template = EmailTemplates.verification(name, otpCode);
    const fromEmail = env?.FROM_EMAIL || process.env.FROM_EMAIL || 'Gospel Ways <info@gospelways.com>';
    
    console.log('Attempting to send email via Resend:', {
      from: fromEmail,
      to: email,
      subject: template.subject
    });

    const result = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: template.subject,
      text: template.text,
      html: template.html
    });
    
    console.log('Resend API result:', result);
    
    if (result.error) {
      console.error('Resend API error:', result.error);
      return { 
        success: false, 
        error: `Email service error: ${result.error.message || JSON.stringify(result.error)}` 
      };
    }
    
    console.log('Verification email sent successfully via Resend:', result.data?.id);
    return { success: true, messageId: result.data?.id };
    
  } catch (error) {
    console.error('Error sending verification email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown email error' 
    };
  }
}

// Send welcome email after verification using Resend
export async function sendWelcomeEmail(
  email: string,
  name: string,
  env?: any
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const resend = getResend(env);
    
    if (!resend) {
      console.log('📧 WELCOME EMAIL (Development Mode):');
      console.log('To:', email);
      console.log('Name:', name);
      console.log('Subject:', EmailTemplates.welcomeVerified(name).subject);
      
      return { 
        success: true, 
        messageId: `dev-${Date.now()}`,
        error: 'Development mode - email logged to console' 
      };
    }
    
    const template = EmailTemplates.welcomeVerified(name);
    const fromEmail = env?.FROM_EMAIL || process.env.FROM_EMAIL || 'Gospel Ways <info@gospelways.com>';
    
    console.log('Attempting to send email via Resend:', {
      from: fromEmail,
      to: email,
      subject: template.subject
    });

    const result = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: template.subject,
      text: template.text,
      html: template.html
    });
    
    console.log('Resend API result:', result);
    
    if (result.error) {
      console.error('Resend API error:', result.error);
      return { 
        success: false, 
        error: `Email service error: ${result.error.message || JSON.stringify(result.error)}` 
      };
    }
    
    console.log('Welcome email sent successfully via Resend:', result.data?.id);
    return { success: true, messageId: result.data?.id };
    
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown email error' 
    };
  }
}

// Send password reset email using Resend
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  otpCode: string,
  env?: any
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const resend = getResend(env);
    
    if (!resend) {
      console.log('📧 PASSWORD RESET EMAIL (Development Mode):');
      console.log('To:', email);
      console.log('Name:', name);
      console.log('OTP Code:', otpCode);
      console.log('Subject:', EmailTemplates.passwordReset(name, otpCode).subject);
      
      return { 
        success: true, 
        messageId: `dev-${Date.now()}`,
        error: 'Development mode - email logged to console' 
      };
    }
    
    const template = EmailTemplates.passwordReset(name, otpCode);
    const fromEmail = env?.FROM_EMAIL || process.env.FROM_EMAIL || 'Gospel Ways <info@gospelways.com>';
    
    console.log('Attempting to send email via Resend:', {
      from: fromEmail,
      to: email,
      subject: template.subject
    });

    const result = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: template.subject,
      text: template.text,
      html: template.html
    });
    
    console.log('Resend API result:', result);
    
    if (result.error) {
      console.error('Resend API error:', result.error);
      return { 
        success: false, 
        error: `Email service error: ${result.error.message || JSON.stringify(result.error)}` 
      };
    }
    
    console.log('Password reset email sent successfully via Resend:', result.data?.id);
    return { success: true, messageId: result.data?.id };
    
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown email error' 
    };
  }
}

// Test email configuration
export async function testEmailConfig(env?: any): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = getResend(env);
    
    if (!resend) {
      return { 
        success: false, 
        error: 'RESEND_API_KEY not configured. Please add Resend API key to environment variables.' 
      };
    }
    
    console.log('Resend email service is configured and ready');
    return { success: true };
    
  } catch (error) {
    console.error('Email configuration test failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown configuration error' 
    };
  }
}