import { Hono } from 'hono'
import { googleAuth } from '@hono/oauth-providers/google'
import { createUser, getUserByEmail, logActivity, linkUserOAuthAccount, setGlobalEnv, getSiteSettings } from './database-neon'
import { generateToken, setAuthCookie } from './auth'

const googleAuthApp = new Hono()

// Test route
googleAuthApp.get('/test', (c) => {
  return c.text('Google auth routes are working!')
})

// Google OAuth configuration
const getGoogleAuthConfig = (c: any) => {
  // Determine the correct base URL based on environment
  let baseUrl;
  
  if (c.env?.ENVIRONMENT === 'production') {
    baseUrl = 'https://gospelways.com';
  } else {
    // For development, check if we're accessing via public sandbox URL
    const currentUrl = new URL(c.req.url);
    const host = currentUrl.host;
    
    // If accessing via e2b.dev (public sandbox URL), use that
    if (host.includes('e2b.dev')) {
      baseUrl = `https://${host}`;
    } else {
      // Otherwise use localhost (for direct local access)
      baseUrl = 'https://3000-inazuof9eohwqpew3aev9.e2b.dev';
    }
  }
    
  console.log(`OAuth redirect URI: ${baseUrl}/auth/google/callback`);
    
  return {
    client_id: c.env?.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '',
    client_secret: c.env?.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || '',
    redirect_uri: `${baseUrl}/auth/google/callback`,
    scope: ['openid', 'email', 'profile']
  }
}

// Initiate Google OAuth login
googleAuthApp.get('/google/login', async (c) => {
  // Set global environment for database functions
  setGlobalEnv(c.env);
  
  const config = getGoogleAuthConfig(c)
  const isSignup = c.req.query('signup') === 'true'
  
  // Pass signup parameter in state for callback handling
  const state = isSignup ? 'signup=true' : ''
  
  const authUrl = `https://accounts.google.com/o/oauth2/auth?` +
    `client_id=${config.client_id}&` +
    `redirect_uri=${encodeURIComponent(config.redirect_uri)}&` +
    `scope=${encodeURIComponent(config.scope.join(' '))}&` +
    `response_type=code&` +
    `access_type=offline&` +
    `prompt=consent` +
    (state ? `&state=${encodeURIComponent(state)}` : '')
  
  console.log(`Google OAuth initiated: ${isSignup ? 'Sign-up' : 'Sign-in'} flow`)
  return c.redirect(authUrl)
})

// Google OAuth callback
googleAuthApp.get('/google/callback', async (c) => {
  try {
    // Set global environment for database functions
    setGlobalEnv(c.env);
    
    const code = c.req.query('code')
    const error = c.req.query('error')
    
    if (error) {
      console.error('Google OAuth error:', error)
      return c.redirect('/login?error=oauth_error')
    }
    
    if (!code) {
      return c.redirect('/login?error=missing_code')
    }
    
    const config = getGoogleAuthConfig(c)
    
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: config.client_id,
        client_secret: config.client_secret,
        redirect_uri: config.redirect_uri,
        grant_type: 'authorization_code'
      })
    })
    
    if (!tokenResponse.ok) {
      console.error('Failed to get tokens:', await tokenResponse.text())
      return c.redirect('/login?error=token_error')
    }
    
    const tokens = await tokenResponse.json()
    
    // Get user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`
      }
    })
    
    if (!userResponse.ok) {
      console.error('Failed to get user info:', await userResponse.text())
      return c.redirect('/login?error=user_info_error')
    }
    
    const googleUser = await userResponse.json()
    const state = c.req.query('state') || ''
    const isSignupFlow = state.includes('signup=true')
    
    console.log(`Google OAuth callback - User: ${googleUser.email}, Flow: ${isSignupFlow ? 'Sign-up' : 'Sign-in'}`)

    // Check if user exists in our database
    let user = await getUserByEmail(googleUser.email)

    // Check registration status for new users
    if (!user && isSignupFlow) {
      const settings = await getSiteSettings();
      const registrationStatus = settings.registration_status || 'open';

      if (registrationStatus === 'closed') {
        return c.redirect('/login?error=registration_closed');
      }
    }
    
    if (!user) {
      // Create new user from Google profile
      try {
        // Get default user role from settings
        const settings = await getSiteSettings();
        const defaultRole = settings.default_user_role || 'user';

        user = await createUser(
          googleUser.email,
          googleUser.name,
          null, // No password for OAuth users
          defaultRole, // Use setting-based default role
          {
            google_id: googleUser.id,
            avatar_url: googleUser.picture,
            auth_provider: 'google',
            email_verified: googleUser.verified_email || true
          }
        )
        
        console.log(`New user created via Google OAuth: ${user.name} (${user.email})`)
        
        // Log registration activity
        await logActivity(
          user.id,
          'user_registration',
          `New user registered via Google: ${user.name}`,
          'user',
          user.id
        )
      } catch (error) {
        console.error('Failed to create user:', error)
        return c.redirect('/login?error=user_creation_failed')
      }
    } else {
      // User already exists
      if (isSignupFlow) {
        // User tried to sign up but account already exists
        console.log(`Sign-up attempted for existing user: ${user.email}`)
        return c.redirect('/login?error=user_already_exists&message=Account already exists, please sign in instead')
      }
      
      // Update existing user with Google info if needed
      if (!user.google_id) {
        // Link Google account to existing user
        try {
          user = await linkUserOAuthAccount(user.id, {
            google_id: googleUser.id,
            avatar_url: googleUser.picture,
            auth_provider: 'google',
            email_verified: googleUser.verified_email || true
          })
          console.log('Successfully linked Google account to existing user:', user.email)
        } catch (error) {
          console.error('Failed to link Google account:', error)
        }
      }
      
      // Log login activity
      await logActivity(
        user.id,
        'user_login',
        `User logged in via Google: ${user.name}`,
        'user',
        user.id
      )
    }
    
    // Generate JWT token
    const token = await generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    })
    
    // Set HTTP-only cookie
    setAuthCookie(c, token)
    
    // Redirect based on whether this was a new user or existing user
    let redirectTo = '/';

    if (isSignupFlow && !user.id) {
      // This was a sign-up flow for a new user
      redirectTo = '/?welcome=true';
    } else if (!isSignupFlow) {
      // Regular sign-in flow
      redirectTo = '/';
    }
    
    console.log(`Redirecting user ${user.email} to: ${redirectTo}`)
    return c.redirect(redirectTo)
    
  } catch (error) {
    console.error('Google OAuth callback error:', error)
    return c.redirect('/login?error=oauth_callback_error')
  }
})

export default googleAuthApp