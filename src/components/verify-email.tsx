import { Context } from 'hono'

interface VerifyEmailProps {
  c: Context
  userId?: string
}

// Verify Email Component
export async function VerifyEmail({ c, userId }: VerifyEmailProps) {
  const user = await getLoggedInUser(c)

  if (user && user.email_verified) {
    // Redirect logic would be handled in the route
    return null
  }

  return (
    <div className="min-h-screen">
      <nav className="nav-header">
        <div className="nav-container">
          <div className="nav-brand">
            <h1>Faith Defenders</h1>
          </div>
          <div className="nav-menu">
            <a href="/" className="nav-link">Home</a>
            <a href="/articles" className="nav-link">Articles</a>
            <a href="/resources" className="nav-link">Resources</a>
            <a href="/tools" className="nav-link">Tools</a>
            <a href="/podcasts" className="nav-link">Podcasts</a>
            <a href="/about" className="nav-link">About</a>
            <a href="/login" className="nav-link">Login</a>
          </div>
        </div>
      </nav>

      <main className="auth-content">
        <div className="auth-container">
          <div className="auth-card">
            <h1 className="auth-title">Verify Your Email</h1>
            <p className="auth-subtitle">Please check your email for a verification code</p>

            <div className="verification-info">
              <div className="verification-icon">
                📧
              </div>
              <p>We've sent a 6-digit verification code to your email address. Enter the code below to verify your account and complete your registration.</p>
            </div>

            <form id="verify-form" className="auth-form">
              <input type="hidden" id="user-id" value={userId || ''} />
              <div className="form-group">
                <label htmlFor="otp-code">Verification Code</label>
                <input
                  type="text"
                  id="otp-code"
                  name="otpCode"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  required
                  autoComplete="one-time-code"
                />
              </div>
              <button type="submit" className="btn-primary">Verify Email</button>

              <div className="verification-actions">
                <button type="button" id="resend-btn" className="btn-link">
                  Didn't receive the code? Resend
                </button>
                <a href="/login" className="btn-link">
                  Back to Login
                </a>
              </div>
            </form>

            <div id="verification-message" className="auth-message"></div>
          </div>
        </div>
      </main>

      <script src="/static/verification.js"></script>
    </div>
  )
}

async function getLoggedInUser(c: Context) {
  try {
    const { getLoggedInUser } = await import('../auth')
    return await getLoggedInUser(c)
  } catch (error) {
    console.error('Error getting logged in user:', error)
    return null
  }
}

export default VerifyEmail
