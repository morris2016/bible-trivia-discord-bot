import { Context } from 'hono'

interface ForgotPasswordProps {
  c: Context
}

// Forgot Password Component
export async function ForgotPassword({ c }: ForgotPasswordProps) {
  const user = await getLoggedInUser(c)

  if (user) {
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
            <h1 className="auth-title">Reset Your Password</h1>
            <p className="auth-subtitle">Enter your email address and we'll send you a reset code</p>

            <form id="forgot-password-form" className="auth-form">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input type="email" id="email" name="email" required />
              </div>
              <button type="submit" className="btn-primary">Send Reset Code</button>
            </form>

            <div className="auth-links">
              <a href="/login" className="auth-link">← Back to Sign In</a>
            </div>

            <div id="forgot-password-message" className="auth-message"></div>
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

export default ForgotPassword
