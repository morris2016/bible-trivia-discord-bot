import { Context } from 'hono'

interface ResetPasswordProps {
  c: Context
  userId?: string
}

// Reset Password Component
export async function ResetPassword({ c, userId }: ResetPasswordProps) {
  const user = await getLoggedInUser(c)

  if (user) {
    // Redirect logic would be handled in the route
    return null
  }

  const settings = c.get('settings') || {}

  return (
    <div className="min-h-screen">
      <nav className="nav-header">
        <div className="nav-container">
          <div className="nav-brand">
            <h1>{settings.site_name || 'Faith Defenders'}</h1>
          </div>
          <div className="nav-menu">
            <a href="/" className="nav-link">Home</a>
            <a href="/articles" className="nav-link">Articles</a>
            <a href="/resources" className="nav-link">Resources</a>
            <a href="/about" className="nav-link">About</a>
            <a href="/login" className="nav-link">Login</a>
          </div>
        </div>
      </nav>

      <main className="auth-content">
        <div className="auth-container">
          <div className="auth-card">
            <h1 className="auth-title">Enter Reset Code</h1>
            <p className="auth-subtitle">Enter the 6-digit code sent to your email and your new password</p>

            <form id="reset-password-form" className="auth-form">
              <input type="hidden" id="user-id" value={userId} />

              <div className="form-group">
                <label htmlFor="otp-code">6-Digit Reset Code</label>
                <input
                  type="text"
                  id="otp-code"
                  name="otpCode"
                  placeholder="000000"
                  maxLength="6"
                  pattern="[0-9]{6}"
                  required
                />
                <small className="form-help">Enter the code sent to your email</small>
              </div>

              <div className="form-group">
                <label htmlFor="new-password">New Password</label>
                <input type="password" id="new-password" name="newPassword" minLength="6" required />
                <small className="form-help">At least 6 characters</small>
              </div>

              <div className="form-group">
                <label htmlFor="confirm-password">Confirm New Password</label>
                <input type="password" id="confirm-password" name="confirmPassword" minLength="6" required />
              </div>

              <button type="submit" className="btn-primary">Reset Password</button>
            </form>

            <div className="auth-links">
              <a href="/forgot-password" className="auth-link">← Request New Code</a>
              <a href="/login" className="auth-link">Back to Sign In</a>
            </div>

            <div id="reset-password-message" className="auth-message"></div>
          </div>
        </div>
      </main>

      <script src="/static/password-reset.js"></script>
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

export default ResetPassword
