import { Hono } from 'hono'
import { renderer } from './renderer'

const app = new Hono()

app.use(renderer)

app.get('/', (c) => {
  return c.render(
    <div className="min-h-screen">
      {/* Navigation Header */}
      <nav className="nav-header">
        <div className="nav-container">
          <div className="nav-brand">
            <h1>Faith Defenders</h1>
          </div>
          <div className="nav-menu">
            <a href="/" className="nav-link active">Home</a>
            <a href="/articles" className="nav-link">Articles</a>
            <a href="/resources" className="nav-link">resources</a>
            <a href="/about" className="nav-link">About</a>
            <a href="/login" className="nav-link">login</a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        <div className="content-container">
          <h1 className="page-title">Empty Page</h1>
          <p className="page-subtitle">Create a beautiful page by adding and combining sections.</p>
        </div>
      </main>
    </div>
  )
})

// Additional routes for navigation
app.get('/articles', (c) => {
  return c.render(
    <div className="min-h-screen">
      <nav className="nav-header">
        <div className="nav-container">
          <div className="nav-brand">
            <h1>Faith Defenders</h1>
          </div>
          <div className="nav-menu">
            <a href="/" className="nav-link">Home</a>
            <a href="/articles" className="nav-link active">Articles</a>
            <a href="/resources" className="nav-link">resources</a>
            <a href="/about" className="nav-link">About</a>
            <a href="/login" className="nav-link">login</a>
          </div>
        </div>
      </nav>
      <main className="main-content">
        <div className="content-container">
          <h1 className="page-title">Articles</h1>
          <p className="page-subtitle">Browse our collection of faith-based articles and insights.</p>
        </div>
      </main>
    </div>
  )
})

app.get('/resources', (c) => {
  return c.render(
    <div className="min-h-screen">
      <nav className="nav-header">
        <div className="nav-container">
          <div className="nav-brand">
            <h1>Faith Defenders</h1>
          </div>
          <div className="nav-menu">
            <a href="/" className="nav-link">Home</a>
            <a href="/articles" className="nav-link">Articles</a>
            <a href="/resources" className="nav-link active">resources</a>
            <a href="/about" className="nav-link">About</a>
            <a href="/login" className="nav-link">login</a>
          </div>
        </div>
      </nav>
      <main className="main-content">
        <div className="content-container">
          <h1 className="page-title">Resources</h1>
          <p className="page-subtitle">Discover helpful resources to strengthen your faith journey.</p>
        </div>
      </main>
    </div>
  )
})

app.get('/about', (c) => {
  return c.render(
    <div className="min-h-screen">
      <nav className="nav-header">
        <div className="nav-container">
          <div className="nav-brand">
            <h1>Faith Defenders</h1>
          </div>
          <div className="nav-menu">
            <a href="/" className="nav-link">Home</a>
            <a href="/articles" className="nav-link">Articles</a>
            <a href="/resources" className="nav-link">resources</a>
            <a href="/about" className="nav-link active">About</a>
            <a href="/login" className="nav-link">login</a>
          </div>
        </div>
      </nav>
      <main className="main-content">
        <div className="content-container">
          <h1 className="page-title">About Faith Defenders</h1>
          <p className="page-subtitle">Learn more about our mission to defend and share the Christian faith.</p>
        </div>
      </main>
    </div>
  )
})

app.get('/login', (c) => {
  return c.render(
    <div className="min-h-screen">
      <nav className="nav-header">
        <div className="nav-container">
          <div className="nav-brand">
            <h1>Faith Defenders</h1>
          </div>
          <div className="nav-menu">
            <a href="/" className="nav-link">Home</a>
            <a href="/articles" className="nav-link">Articles</a>
            <a href="/resources" className="nav-link">resources</a>
            <a href="/about" className="nav-link">About</a>
            <a href="/login" className="nav-link active">login</a>
          </div>
        </div>
      </nav>
      <main className="main-content">
        <div className="content-container">
          <h1 className="page-title">Login</h1>
          <p className="page-subtitle">Sign in to access your Faith Defenders account.</p>
        </div>
      </main>
    </div>
  )
})

export default app
