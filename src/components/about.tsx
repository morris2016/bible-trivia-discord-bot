import { Context } from 'hono'
import { Footer } from './footer'
import { Navigation } from './navigation'

interface AboutProps {
  c: Context
}

// About Page Component
export function About({ c }: AboutProps) {
  const user = c.get('user')
  const settings = c.get('settings') || {}

  return (
    <div className="min-h-screen">
      <Navigation c={c} user={user} />
      <main className="main-content">
        <div className="content-container">
          <div className="about-hero" style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            textAlign: 'center',
            padding: '4rem 2rem',
            borderRadius: '0 0 2rem 2rem',
            marginBottom: '3rem',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1 }}>
              <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none">
                <defs>
                  <pattern id="cross-pattern" patternUnits="userSpaceOnUse" width="20" height="20">
                    <path d="M8 2 L8 18 M2 10 L14 10" stroke="white" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#cross-pattern)"/>
              </svg>
            </div>
            <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', margin: '0 auto' }}>
              <h1 className="page-title" style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
                About {settings.site_name || 'Faith Defenders'}
              </h1>
              <p className="page-subtitle" style={{ fontSize: '1.3rem', marginBottom: '2rem', opacity: 0.95 }}>
                {settings.site_description || 'Defending and sharing the Christian faith through articles, resources, and community.'}
              </p>
              <div style={{
                background: 'rgba(255,255,255,0.15)',
                padding: '2rem',
                borderRadius: '1rem',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <blockquote style={{ fontSize: '1.1rem', fontStyle: 'italic', margin: '0 0 1rem 0', lineHeight: 1.6 }}>
                  "Always be prepared to give an answer to everyone who asks you to give the reason for the hope that you have. But do this with gentleness and respect."
                </blockquote>
                <footer style={{ fontSize: '0.9rem', fontWeight: '500' }}>— 1 Peter 3:15</footer>
              </div>
            </div>
          </div>

          <div className="about-content" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>

          {/* About Page Professional Styles with Mobile Responsiveness */}
          <style dangerouslySetInnerHTML={{
            __html: `
              /* Professional Base Styles */
              .about-content {
                padding: 0 3rem !important;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif !important;
              }

              .about-section {
                margin-bottom: 5rem !important;
                position: relative !important;
              }

              .section-title {
                font-size: 2.75rem !important;
                font-weight: 800 !important;
                margin-bottom: 3.5rem !important;
                color: #0f172a !important;
                letter-spacing: -0.025em !important;
                line-height: 1.1 !important;
                position: relative !important;
              }

              .section-title::after {
                content: '' !important;
                position: absolute !important;
                bottom: -1rem !important;
                left: 0 !important;
                width: 80px !important;
                height: 4px !important;
                background: linear-gradient(135deg, #3b82f6, #1d4ed8) !important;
                border-radius: 2px !important;
              }

              /* Introduction Section - Professional */
              .intro-section {
                padding: 4rem 3rem !important;
                background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%) !important;
                border-radius: 1.5rem !important;
                border: 1px solid rgba(59, 130, 246, 0.08) !important;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05) !important;
                position: relative !important;
                overflow: hidden !important;
                margin-bottom: 5rem !important;
              }

              .intro-section::before {
                content: '' !important;
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                height: 4px !important;
                background: linear-gradient(90deg, #3b82f6, #1d4ed8, #3b82f6) !important;
                background-size: 200% 100% !important;
                animation: gradientShift 4s ease infinite !important;
              }

              @keyframes gradientShift {
                0% { background-position: 0% 50% !important; }
                50% { background-position: 100% 50% !important; }
                100% { background-position: 0% 50% !important; }
              }

              .intro-section h2 {
                font-size: 2.75rem !important;
                font-weight: 800 !important;
                color: #0f172a !important;
                margin-bottom: 2rem !important;
                letter-spacing: -0.025em !important;
              }

              .intro-section p {
                font-size: 1.25rem !important;
                line-height: 1.8 !important;
                color: #475569 !important;
                max-width: 900px !important;
                margin: 0 auto !important;
              }

              /* Mission Cards - Professional */
              .mission-cards {
                display: grid !important;
                grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)) !important;
                gap: 2.5rem !important;
                margin-bottom: 4rem !important;
              }

              .mission-card {
                background: white !important;
                padding: 2.5rem !important;
                border-radius: 1.25rem !important;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08) !important;
                border: 1px solid rgba(59, 130, 246, 0.08) !important;
                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
                position: relative !important;
                overflow: hidden !important;
              }

              .mission-card::before {
                content: '' !important;
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                height: 4px !important;
                background: linear-gradient(90deg, #3b82f6, #1d4ed8) !important;
                transform: scaleX(0) !important;
                transition: transform 0.4s ease !important;
              }

              .mission-card:hover {
                transform: translateY(-8px) !important;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12) !important;
                border-color: rgba(59, 130, 246, 0.15) !important;
              }

              .mission-card:hover::before {
                transform: scaleX(1) !important;
              }

              .mission-icon {
                width: 80px !important;
                height: 80px !important;
                border-radius: 50% !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                font-size: 2rem !important;
                margin-bottom: 2rem !important;
                position: relative !important;
              }

              .mission-card-primary .mission-icon {
                background: linear-gradient(135deg, #eff6ff, #dbeafe) !important;
                color: #2563eb !important;
                box-shadow: 0 8px 24px rgba(37, 99, 235, 0.2) !important;
              }

              .mission-card-secondary .mission-icon {
                background: linear-gradient(135deg, #f0fdf4, #dcfce7) !important;
                color: #059669 !important;
                box-shadow: 0 8px 24px rgba(16, 185, 105, 0.2) !important;
              }

              .mission-card h3 {
                font-size: 1.5rem !important;
                font-weight: 700 !important;
                color: #0f172a !important;
                margin-bottom: 1rem !important;
                letter-spacing: -0.025em !important;
              }

              .mission-card p {
                color: #64748b !important;
                line-height: 1.7 !important;
                font-size: 1.05rem !important;
              }

              /* Doctrine Items - Professional */
              .doctrine-list {
                display: grid !important;
                gap: 3rem !important;
                grid-template-columns: repeat(auto-fit, minmax(450px, 1fr)) !important;
              }

              .doctrine-item {
                background: white !important;
                padding: 3rem !important;
                border-radius: 1.5rem !important;
                box-shadow: 0 12px 40px rgba(0, 0, 0, 0.06) !important;
                border: 1px solid rgba(59, 130, 246, 0.06) !important;
                position: relative !important;
                overflow: hidden !important;
                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
              }

              .doctrine-item:hover {
                transform: translateY(-4px) !important;
                box-shadow: 0 24px 80px rgba(0, 0, 0, 0.1) !important;
                border-color: rgba(59, 130, 246, 0.12) !important;
              }

              .doctrine-item h4 {
                font-size: 1.35rem !important;
                font-weight: 700 !important;
                color: #0f172a !important;
                margin-bottom: 1.5rem !important;
                display: flex !important;
                align-items: center !important;
                gap: 1rem !important;
                letter-spacing: -0.025em !important;
              }

              .doctrine-item p {
                color: #64748b !important;
                font-size: 1.1rem !important;
                line-height: 1.8 !important;
                margin-bottom: 2rem !important;
              }

              /* Values Grid - Professional */
              .values-grid {
                display: grid !important;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)) !important;
                gap: 2.5rem !important;
              }

              .value-item {
                text-align: center !important;
                padding: 2.5rem 1.5rem !important;
                background: white !important;
                border-radius: 1.25rem !important;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06) !important;
                border: 1px solid rgba(139, 92, 246, 0.08) !important;
                transition: all 0.3s ease !important;
                position: relative !important;
                overflow: hidden !important;
              }

              .value-item::before {
                content: '' !important;
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                height: 3px !important;
                background: linear-gradient(90deg, #8b5cf6, #7c3aed) !important;
                transform: scaleX(0) !important;
                transition: transform 0.3s ease !important;
              }

              .value-item:hover {
                transform: translateY(-6px) !important;
                box-shadow: 0 16px 48px rgba(0, 0, 0, 0.1) !important;
              }

              .value-item:hover::before {
                transform: scaleX(1) !important;
              }

              .value-icon {
                font-size: 3rem !important;
                margin-bottom: 1.5rem !important;
                display: block !important;
              }

              .value-item h3 {
                font-size: 1.35rem !important;
                font-weight: 700 !important;
                color: #0f172a !important;
                margin-bottom: 1rem !important;
                letter-spacing: -0.025em !important;
              }

              .value-item p {
                color: #64748b !important;
                line-height: 1.7 !important;
                font-size: 1rem !important;
              }

              /* Get Involved - Professional */
              .get-involved-card {
                background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%) !important;
                padding: 4rem 3rem !important;
                border-radius: 1.5rem !important;
                text-align: center !important;
                border: 1px solid rgba(139, 92, 246, 0.08) !important;
                box-shadow: 0 12px 48px rgba(0, 0, 0, 0.06) !important;
                position: relative !important;
                overflow: hidden !important;
              }

              .get-involved-icon {
                font-size: 4rem !important;
                margin-bottom: 2rem !important;
                display: block !important;
                opacity: 0.8 !important;
              }

              .get-involved-card h3 {
                font-size: 2rem !important;
                font-weight: 800 !important;
                color: #0f172a !important;
                margin-bottom: 1.5rem !important;
                letter-spacing: -0.025em !important;
              }

              .get-involved-card p {
                font-size: 1.15rem !important;
                color: #64748b !important;
                line-height: 1.7 !important;
                margin-bottom: 2.5rem !important;
                max-width: 600px !important;
                margin-left: auto !important;
                margin-right: auto !important;
              }

              /* Contact Section - Professional */
              .contact-info {
                display: grid !important;
                gap: 2rem !important;
                max-width: 800px !important;
                margin: 0 auto !important;
              }

              .contact-item {
                background: white !important;
                padding: 2.5rem !important;
                border-radius: 1.25rem !important;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.06) !important;
                border: 1px solid rgba(59, 130, 246, 0.06) !important;
                transition: all 0.3s ease !important;
                position: relative !important;
                overflow: hidden !important;
              }

              .contact-item:hover {
                transform: translateY(-4px) !important;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1) !important;
                border-color: rgba(59, 130, 246, 0.12) !important;
              }

              /* Responsive Design - Professional */
              @media (max-width: 1200px) {
                .about-content {
                  padding: 0 2rem !important;
                }

                .doctrine-list {
                  grid-template-columns: 1fr !important;
                }
              }

              @media (max-width: 1024px) {
                .about-content {
                  padding: 0 1.5rem !important;
                }

                .intro-section {
                  padding: 3rem 2rem !important;
                }

                .mission-cards {
                  grid-template-columns: 1fr !important;
                  gap: 2rem !important;
                }

                .values-grid {
                  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)) !important;
                }
              }

              @media (max-width: 768px) {
                .about-content {
                  padding: 0 0.1rem !important; /* Minimal mobile margins */
                }

                .about-section {
                  margin-bottom: 3rem !important;
                }

                .section-title {
                  font-size: 2.25rem !important;
                  margin-bottom: 2.5rem !important;
                }

                .intro-section {
                  padding: 2.5rem 1.5rem !important;
                  margin-bottom: 3rem !important;
                }

                .intro-section h2 {
                  font-size: 2.25rem !important;
                }

                .intro-section p {
                  font-size: 1.1rem !important;
                }

                .mission-card {
                  padding: 2rem !important;
                }

                .doctrine-item {
                  padding: 2rem !important;
                }

                .doctrine-item h4 {
                  font-size: 1.25rem !important;
                }

                .values-grid {
                  grid-template-columns: 1fr !important;
                  gap: 2rem !important;
                }

                .value-item {
                  padding: 2rem 1.5rem !important;
                }

                .get-involved-card {
                  padding: 2.5rem 1.5rem !important;
                }

                .get-involved-card h3 {
                  font-size: 1.75rem !important;
                }

                .contact-info {
                  gap: 1.5rem !important;
                }

                .contact-item {
                  padding: 2rem !important;
                }
              }

              @media (max-width: 480px) {
                .about-content {
                  padding: 0 0.05rem !important; /* Ultra minimal margins */
                }

                .section-title {
                  font-size: 1.875rem !important;
                  margin-bottom: 2rem !important;
                }

                .intro-section {
                  padding: 2rem 1rem !important;
                }

                .intro-section h2 {
                  font-size: 1.875rem !important;
                }

                .intro-section p {
                  font-size: 1rem !important;
                }

                .mission-card {
                  padding: 1.75rem !important;
                }

                .doctrine-item {
                  padding: 1.75rem !important;
                }

                .value-item {
                  padding: 1.75rem 1rem !important;
                }

                .get-involved-card {
                  padding: 2rem 1rem !important;
                }

                .get-involved-card h3 {
                  font-size: 1.5rem !important;
                }

                .contact-item {
                  padding: 1.5rem !important;
                }
              }

              /* Animation and Interaction Enhancements */
              .mission-card, .doctrine-item, .value-item, .contact-item {
                animation: fadeInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) !important;
              }

              .mission-card:nth-child(2) { animation-delay: 0.1s !important; }
              .doctrine-item:nth-child(2) { animation-delay: 0.1s !important; }
              .doctrine-item:nth-child(3) { animation-delay: 0.2s !important; }
              .doctrine-item:nth-child(4) { animation-delay: 0.3s !important; }
              .doctrine-item:nth-child(5) { animation-delay: 0.4s !important; }
              .doctrine-item:nth-child(6) { animation-delay: 0.5s !important; }

              @keyframes fadeInUp {
                from {
                  opacity: 0 !important;
                  transform: translateY(40px) scale(0.95) !important;
                }
                to {
                  opacity: 1 !important;
                  transform: translateY(0) scale(1) !important;
                }
              }

              /* Focus states for accessibility */
              .mission-card:focus-within,
              .doctrine-item:focus-within,
              .value-item:focus-within,
              .contact-item:focus-within {
                outline: 2px solid rgba(59, 130, 246, 0.5) !important;
                outline-offset: 2px !important;
              }

              /* Dark mode support */
              @media (prefers-color-scheme: dark) {
                .mission-card,
                .doctrine-item,
                .value-item,
                .contact-item {
                  background: #1e293b !important;
                  border-color: rgba(59, 130, 246, 0.15) !important;
                }

                .intro-section {
                  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%) !important;
                }

                .section-title,
                .intro-section h2,
                .mission-card h3,
                .doctrine-item h4,
                .value-item h3,
                .get-involved-card h3 {
                  color: #f1f5f9 !important;
                }

                .intro-section p,
                .mission-card p,
                .doctrine-item p,
                .value-item p {
                  color: #cbd5e1 !important;
                }
              }
            `
          }} />
            {/* Introduction Section */}
            <section className="about-section intro-section" style={{
              textAlign: 'center',
              marginBottom: '5rem',
              padding: '4rem 3rem',
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              borderRadius: '1.5rem',
              border: '1px solid rgba(99, 102, 241, 0.08)',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.05)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <h2 style={{
                fontSize: '2.75rem',
                fontWeight: '800',
                color: '#0f172a',
                marginBottom: '2rem',
                letterSpacing: '-0.025em',
                lineHeight: '1.1'
              }}>Welcome to Faith Defenders</h2>
              <p style={{
                fontSize: '1.25rem',
                lineHeight: '1.8',
                color: '#475569',
                maxWidth: '900px',
                margin: '0 auto',
                fontWeight: '400'
              }}>
                Faith Defenders is a vibrant Christian community dedicated to equipping believers with sound biblical knowledge,
                fostering meaningful fellowship, and providing practical resources for spiritual growth. We believe in the power
                of Scripture to transform lives and the importance of defending our faith with both truth and love.
              </p>
            </section>

            <section className="about-section mission-section" style={{ marginBottom: '4rem' }}>
              <h2 className="section-title mission-title" style={{
                fontSize: '2.75rem',
                fontWeight: '800',
                textAlign: 'center',
                color: '#0f172a',
                marginBottom: '3.5rem',
                letterSpacing: '-0.025em',
                lineHeight: '1.1',
                position: 'relative'
              }}>
                ✨ Our Mission & Vision
              </h2>
              <div className="mission-cards">
                <div className="mission-card mission-card-primary" style={{
                  background: 'white',
                  padding: '2.5rem',
                  borderRadius: '1.25rem',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.08)',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div className="mission-icon" style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    marginBottom: '2rem',
                    background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                    color: '#2563eb',
                    boxShadow: '0 8px 24px rgba(37, 99, 235, 0.2)'
                  }}>
                    <i className="fas fa-cross"></i>
                  </div>
                  <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: '#0f172a',
                    marginBottom: '1rem',
                    letterSpacing: '-0.025em'
                  }}>Defending & Sharing</h3>
                  <p style={{
                    color: '#64748b',
                    lineHeight: '1.7',
                    fontSize: '1.05rem'
                  }}>The Christian faith through thoughtful articles, valuable resources, and a supportive community.</p>
                </div>
                <div className="mission-card mission-card-secondary" style={{
                  background: 'white',
                  padding: '2.5rem',
                  borderRadius: '1.25rem',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                  border: '1px solid rgba(16, 185, 105, 0.08)',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div className="mission-icon" style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    marginBottom: '2rem',
                    background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                    color: '#059669',
                    boxShadow: '0 8px 24px rgba(16, 185, 105, 0.2)'
                  }}>
                    <i className="fas fa-users"></i>
                  </div>
                  <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: '#0f172a',
                    marginBottom: '1rem',
                    letterSpacing: '-0.025em'
                  }}>Transforming Lives</h3>
                  <p style={{
                    color: '#64748b',
                    lineHeight: '1.7',
                    fontSize: '1.05rem'
                  }}>Through truth, love, and fellowship to strengthen believers in their walk with Christ.</p>
                </div>
              </div>
              <div className="mission-verse">
                <div className="verse-background"></div>
                <div className="verse-content">
                  <div className="verse-icon">📖</div>
                  <blockquote>
                    "Therefore go and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit, and teaching them to obey everything I have commanded you."
                  </blockquote>
                  <footer>
                    — Matthew 28:19-20
                  </footer>
                </div>
              </div>
            </section>


            <section className="about-section beliefs-section">
              <h2 className="section-title beliefs-title" style={{
                fontSize: '2.75rem',
                fontWeight: '800',
                color: '#0f172a',
                marginBottom: '3.5rem',
                letterSpacing: '-0.025em',
                lineHeight: '1.1',
                position: 'relative'
              }}>✝️ What We Believe</h2>
              <div className="beliefs-content">
                <p>
                  Our faith is grounded in the <strong>core doctrines</strong> of biblical Christianity. These fundamental beliefs guide our ministry and content:
                </p>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #fefefe 0%, #f8fafc 100%)', padding: '3rem', borderRadius: '20px', border: '1px solid rgba(124, 58, 237, 0.1)', boxShadow: '0 20px 40px rgba(124, 58, 237, 0.1)', marginBottom: '3rem' }}>
                <div className="doctrine-list" style={{ display: 'grid', gap: '3rem' }}>
                  <div className="doctrine-item" style={{ background: 'white', padding: '2.5rem', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.1)', boxShadow: '0 8px 24px rgba(59, 130, 246, 0.08)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)' }}></div>
                    <h4 style={{ color: '#1f2937', fontWeight: 700, fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: 'white', width: '2rem', height: '2rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 700 }}> leyendoible 1</span>
                      📖 The Authority of Scripture
                    </h4>
                    <p style={{ color: '#4b5563', lineHeight: 1.7, margin: '0 0 1.5rem 0', fontSize: '1.1rem' }}>
                      We believe the Bible is the <strong style={{ color: '#3b82f6' }}>inspired, infallible, and authoritative Word of God</strong>, completely trustworthy for faith and practice.
                    </p>
                    <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', padding: '2rem', borderRadius: '12px', borderLeft: '4px solid #3b82f6', position: 'relative' }}>
                      <div style={{ position: 'absolute', top: '1rem', left: '1rem', fontSize: '2rem', opacity: 0.3 }}>❝</div>
                      <blockquote style={{ color: '#1e40af', fontSize: '1.1rem', fontStyle: 'italic', margin: 0, lineHeight: 1.6, fontWeight: 400, position: 'relative', zIndex: 1 }}>
                        "All Scripture is God-breathed and is useful for teaching, rebuking, correcting and training in righteousness."
                      </blockquote>
                      <footer style={{ marginTop: '1rem', fontWeight: 600, color: '#1e40af', fontSize: '0.95rem', textAlign: 'right' }}>
                        — 2 Timothy 3:16
                      </footer>
                    </div>
                  </div>

                  <div className="doctrine-item" style={{ background: 'white', padding: '2.5rem', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.1)', boxShadow: '0 8px 24px rgba(16, 185, 129, 0.08)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #10b981, #059669)' }}></div>
                    <h4 style={{ color: '#1f2937', fontWeight: 700, fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', width: '2rem', height: '2rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 700 }}>2</span>
                      ✝️ The Trinity
                    </h4>
                    <p style={{ color: '#4b5563', lineHeight: 1.7, margin: '0 0 1.5rem 0', fontSize: '1.1rem' }}>
                      We believe in <strong style={{ color: '#10b981' }}>one God</strong> who exists eternally in three persons: Father, Son, and Holy Spirit - co-equal and co-eternal.
                    </p>
                    <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', padding: '2rem', borderRadius: '12px', borderLeft: '4px solid #10b981', position: 'relative' }}>
                      <div style={{ position: 'absolute', top: '1rem', left: '1rem', fontSize: '2rem', opacity: 0.3 }}>❝</div>
                      <blockquote style={{ color: '#065f46', fontSize: '1.1rem', fontStyle: 'italic', margin: 0, lineHeight: 1.6, fontWeight: 400, position: 'relative', zIndex: 1 }}>
                        "Therefore go and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit."
                      </blockquote>
                      <footer style={{ marginTop: '1rem', fontWeight: 600, color: '#065f46', fontSize: '0.95rem', textAlign: 'right' }}>
                        — Matthew 28:19
                      </footer>
                    </div>
                  </div>

                  <div className="doctrine-item" style={{ background: 'white', padding: '2.5rem', borderRadius: '16px', border: '1px solid rgba(139, 92, 246, 0.1)', boxShadow: '0 8px 24px rgba(139, 92, 246, 0.08)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #8b5cf6, #7c3aed)' }}></div>
                    <h4 style={{ color: '#1f2937', fontWeight: 700, fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white', width: '2rem', height: '2rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 700 }}>3</span>
                      💝 Salvation by Grace Through Faith
                    </h4>
                    <p style={{ color: '#4b5563', lineHeight: 1.7, margin: '0 0 1.5rem 0', fontSize: '1.1rem' }}>
                      We believe salvation is a <strong style={{ color: '#8b5cf6' }}>gift from God</strong>, received by faith alone in Christ alone, not by works or human effort.
                    </p>
                    <div style={{ background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)', padding: '2rem', borderRadius: '12px', borderLeft: '4px solid #8b5cf6', position: 'relative' }}>
                      <div style={{ position: 'absolute', top: '1rem', left: '1rem', fontSize: '2rem', opacity: 0.3 }}>❝</div>
                      <blockquote style={{ color: '#6b21a8', fontSize: '1.1rem', fontStyle: 'italic', margin: 0, lineHeight: 1.6, fontWeight: 400, position: 'relative', zIndex: 1 }}>
                        "For it is by grace you have been saved, through faith—and this is not from yourselves, it is the gift of God."
                      </blockquote>
                      <footer style={{ marginTop: '1rem', fontWeight: 600, color: '#6b21a8', fontSize: '0.95rem', textAlign: 'right' }}>
                        — Ephesians 2:8
                      </footer>
                    </div>
                  </div>

                  <div className="doctrine-item" style={{ background: 'white', padding: '2.5rem', borderRadius: '16px', border: '1px solid rgba(245, 158, 11, 0.1)', boxShadow: '0 8px 24px rgba(245, 158, 11, 0.08)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #f59e0b, #d97706)' }}></div>
                    <h4 style={{ color: '#1f2937', fontWeight: 700, fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', width: '2rem', height: '2rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 700 }}>4</span>
                      👑 Jesus Christ - God Incarnate
                    </h4>
                    <p style={{ color: '#4b5563', lineHeight: 1.7, margin: '0 0 1.5rem 0', fontSize: '1.1rem' }}>
                      We believe Jesus Christ is <strong style={{ color: '#f59e0b' }}>fully God and fully man</strong>, who died for our sins and rose again for our justification.
                    </p>
                    <div style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', padding: '2rem', borderRadius: '12px', borderLeft: '4px solid #f59e0b', position: 'relative' }}>
                      <div style={{ position: 'absolute', top: '1rem', left: '1rem', fontSize: '2rem', opacity: 0.3 }}>❝</div>
                      <blockquote style={{ color: '#92400e', fontSize: '1.1rem', fontStyle: 'italic', margin: 0, lineHeight: 1.6, fontWeight: 400, position: 'relative', zIndex: 1 }}>
                        "In the beginning was the Word, and the Word was with God, and the Word was God... The Word became flesh and made his dwelling among us."
                      </blockquote>
                      <footer style={{ marginTop: '1rem', fontWeight: 600, color: '#92400e', fontSize: '0.95rem', textAlign: 'right' }}>
                        — John 1:1,14
                      </footer>
                    </div>
                  </div>

                  <div className="doctrine-item" style={{ background: 'white', padding: '2.5rem', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.1)', boxShadow: '0 8px 24px rgba(239, 68, 68, 0.08)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #ef4444, #dc2626)' }}></div>
                    <h4 style={{ color: '#1f2937', fontWeight: 700, fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', width: '2rem', height: '2rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 700 }}>5</span>
                      🌅 The Resurrection and Second Coming
                    </h4>
                    <p style={{ color: '#4b5563', lineHeight: 1.7, margin: '0 0 1.5rem 0', fontSize: '1.1rem' }}>
                      We believe in Christ's <strong style={{ color: '#ef4444' }}>bodily resurrection</strong>, His ascension to heaven, and His promised return to judge the living and the dead.
                    </p>
                    <div style={{ background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', padding: '2rem', borderRadius: '12px', borderLeft: '4px solid #ef4444', position: 'relative' }}>
                      <div style={{ position: 'absolute', top: '1rem', left: '1rem', fontSize: '2rem', opacity: 0.3 }}>❝</div>
                      <blockquote style={{ color: '#991b1b', fontSize: '1.1rem', fontStyle: 'italic', margin: 0, lineHeight: 1.6, fontWeight: 400, position: 'relative', zIndex: 1 }}>
                        "He is not here; he has risen, just as he said."
                      </blockquote>
                      <footer style={{ marginTop: '1rem', fontWeight: 600, color: '#991b1b', fontSize: '0.95rem', textAlign: 'right' }}>
                        — Matthew 28:6
                      </footer>
                    </div>
                  </div>

                  <div className="doctrine-item" style={{ background: 'white', padding: '2.5rem', borderRadius: '16px', border: '1px solid rgba(99, 102, 241, 0.1)', boxShadow: '0 8px 24px rgba(99, 102, 241, 0.08)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #6366f1, #4f46e5)' }}></div>
                    <h4 style={{ color: '#1f2937', fontWeight: 700, fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', width: '2rem', height: '2rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 700 }}>6</span>
                      ✨ Eternal Life and Judgment
                    </h4>
                    <p style={{ color: '#4b5563', lineHeight: 1.7, margin: '0 0 1.5rem 0', fontSize: '1.1rem' }}>
                      We believe in <strong style={{ color: '#6366f1' }}>eternal life</strong> for those who trust in Christ and eternal separation from God for those who reject Him.
                    </p>
                    <div style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)', padding: '2rem', borderRadius: '12px', borderLeft: '4px solid #6366f1', position: 'relative' }}>
                      <div style={{ position: 'absolute', top: '1rem', left: '1rem', fontSize: '2rem', opacity: 0.3 }}>❝</div>
                      <blockquote style={{ color: '#3730a3', fontSize: '1.1rem', fontStyle: 'italic', margin: 0, lineHeight: 1.6, fontWeight: 400, position: 'relative', zIndex: 1 }}>
                        "Whoever believes in the Son has eternal life, but whoever rejects the Son will not see life, for God's wrath remains on them."
                      </blockquote>
                      <footer style={{ marginTop: '1rem', fontWeight: 600, color: '#3730a3', fontSize: '0.95rem', textAlign: 'right' }}>
                        — John 3:36
                      </footer>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="about-section values-section">
              <h2 className="section-title values-title" style={{
                fontSize: '2.75rem',
                fontWeight: '800',
                color: '#0f172a',
                marginBottom: '3.5rem',
                letterSpacing: '-0.025em',
                lineHeight: '1.1',
                position: 'relative'
              }}>💎 Our Values</h2>
              <div className="values-grid">
                <div className="value-item">
                  <div className="value-icon">📖</div>
                  <h3>Biblical Truth</h3>
                  <p>We are committed to upholding the <strong>authority and truth of Scripture</strong> as the foundation for all our content.</p>
                </div>
                <div className="value-item">
                  <div className="value-icon">❤️</div>
                  <h3>Love and Grace</h3>
                  <p>We approach all discussions and interactions with <strong>Christ's love</strong>, showing grace while standing firm on truth.</p>
                </div>
                <div className="value-item">
                  <div className="value-icon">🤝</div>
                  <h3>Community</h3>
                  <p>We believe in the importance of <strong>Christian fellowship</strong> and supporting one another in our faith journey.</p>
                </div>
                <div className="value-item">
                  <div className="value-icon">🌱</div>
                  <h3>Growth</h3>
                  <p>We encourage <strong>continuous learning</strong>, spiritual growth, and deepening understanding of God's Word.</p>
                </div>
              </div>
            </section>

            <section className="about-section get-involved-section">
              <h2 className="section-title get-involved-title" style={{
                fontSize: '2.75rem',
                fontWeight: '800',
                color: '#0f172a',
                marginBottom: '3.5rem',
                letterSpacing: '-0.025em',
                lineHeight: '1.1',
                position: 'relative'
              }}>🚀 Get Involved</h2>
              <div className="get-involved-card" style={{
                background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                padding: '4rem 3rem',
                borderRadius: '1.5rem',
                textAlign: 'center',
                border: '1px solid rgba(139, 92, 246, 0.08)',
                boxShadow: '0 12px 48px rgba(0, 0, 0, 0.06)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div className="get-involved-content">
                  <div className="get-involved-icon" style={{
                    fontSize: '4rem',
                    marginBottom: '2rem',
                    opacity: '0.8'
                  }}>🌟</div>
                  <h3 style={{
                    fontSize: '2rem',
                    fontWeight: '800',
                    color: '#0f172a',
                    marginBottom: '1.5rem',
                    letterSpacing: '-0.025em'
                  }}>Join Our Faith Community</h3>
                  <p style={{
                    fontSize: '1.15rem',
                    color: '#64748b',
                    lineHeight: '1.7',
                    marginBottom: '2.5rem',
                    maxWidth: '600px',
                    marginLeft: 'auto',
                    marginRight: 'auto'
                  }}>
                    Whether you're a <strong>seasoned theologian</strong>, a <strong>new believer</strong>, or someone seeking answers, you're welcome here. Create an account to engage with our content, share your insights, and connect with fellow believers.
                  </p>
                  <div className="get-involved-actions">
                    <a href="/login" className="btn-primary" style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '1rem 2rem',
                      background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '0.75rem',
                      fontWeight: '600',
                      fontSize: '1rem',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)',
                      border: 'none',
                      cursor: 'pointer'
                    }}>
                      <i className="fas fa-user-plus"></i>
                      Sign Up Today
                    </a>
                    <a href="/articles" className="btn-secondary" style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '1rem 2rem',
                      background: 'transparent',
                      color: '#64748b',
                      textDecoration: 'none',
                      border: '2px solid #e2e8f0',
                      borderRadius: '0.75rem',
                      fontWeight: '600',
                      fontSize: '1rem',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      marginLeft: '1rem'
                    }}>
                      <i className="fas fa-book-open"></i>
                      Browse Articles
                    </a>
                  </div>
                </div>
              </div>
            </section>

            <section className="about-section">
              <h2 className="section-title" style={{
                fontSize: '2.75rem',
                fontWeight: '800',
                color: '#0f172a',
                marginBottom: '3.5rem',
                letterSpacing: '-0.025em',
                lineHeight: '1.1',
                position: 'relative'
              }}>📬 Contact Us</h2>
              <div style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', padding: '3rem', borderRadius: '20px', border: '1px solid rgba(99, 102, 241, 0.1)', boxShadow: '0 20px 40px rgba(99, 102, 241, 0.1)', marginTop: '2rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💌</div>
                  <p style={{ color: '#475569', fontSize: '1.25rem', lineHeight: 1.7, margin: 0, maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
                    We'd love to hear from you! Whether you have <strong style={{ color: '#6366f1' }}>questions</strong>, <strong style={{ color: '#6366f1' }}>suggestions</strong>, prayer requests, or would like to contribute content, please don't hesitate to reach out.
                  </p>
                </div>
                <div className="contact-info" style={{ display: 'grid', gap: '1.5rem', maxWidth: '700px', margin: '0 auto' }}>
                  <div className="contact-item" style={{ background: 'white', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.1)', boxShadow: '0 8px 24px rgba(59, 130, 246, 0.08)', position: 'relative', overflow: 'hidden', transition: 'all 0.3s ease' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)' }}></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <div style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: 'white', width: '4rem', height: '4rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.5rem', boxShadow: '0 8px 16px rgba(59, 130, 246, 0.3)' }}>📧</div>
                      <div style={{ flex: 1 }}>
                        <strong style={{ color: '#1e293b', fontSize: '1.1rem', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>General Information</strong>
                        <a href={`mailto:${settings.contact_email || 'contact@faithdefenders.com'}`} style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '1.05rem', fontWeight: 500, transition: 'all 0.3s ease' }}>{settings.contact_email || 'contact@faithdefenders.com'}</a>
                      </div>
                    </div>
                  </div>

                  <div className="contact-item" style={{ background: 'white', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(5, 150, 105, 0.1)', boxShadow: '0 8px 24px rgba(5, 150, 105, 0.08)', position: 'relative', overflow: 'hidden', transition: 'all 0.3s ease' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #059669, #047857)' }}></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <div style={{ background: 'linear-gradient(135deg, #059669, #047857)', color: 'white', width: '4rem', height: '4rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.5rem', boxShadow: '0 8px 16px rgba(5, 150, 105, 0.3)' }}>👨‍💼</div>
                      <div style={{ flex: 1 }}>
                        <strong style={{ color: '#1e293b', fontSize: '1.1rem', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>Administration</strong>
                        <a href={`mailto:${settings.admin_email || 'admin@faithdefenders.com'}`} style={{ color: '#059669', textDecoration: 'none', fontSize: '1.05rem', fontWeight: 500, transition: 'all 0.3s ease' }}>{settings.admin_email || 'admin@faithdefenders.com'}</a>
                      </div>
                    </div>
                  </div>

                  <div className="contact-item" style={{ background: 'white', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(124, 58, 237, 0.1)', boxShadow: '0 8px 24px rgba(124, 58, 237, 0.08)', position: 'relative', overflow: 'hidden', transition: 'all 0.3s ease' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #7c3aed, #6d28d9)' }}></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <div style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white', width: '4rem', height: '4rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.5rem', boxShadow: '0 8px 16px rgba(124, 58, 237, 0.3)' }}>📧</div>
                      <div style={{ flex: 1 }}>
                        <strong style={{ color: '#1e293b', fontSize: '1.1rem', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>Ministry Contact</strong>
                        <a href={`mailto:${settings.admin_email || 'admin@faithdefenders.com'}`} style={{ color: '#7c3aed', textDecoration: 'none', fontSize: '1.05rem', fontWeight: 500, transition: 'all 0.3s ease' }}>{settings.admin_email || 'admin@faithdefenders.com'}</a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer c={c} />
    </div>
  )
}

export default About
