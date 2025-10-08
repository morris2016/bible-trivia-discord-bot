import { Context } from 'hono'
import { Footer } from './footer'
import { Navigation } from './navigation'
import { getLoggedInUser } from '../auth'

interface ToolsProps {
  c: Context
}

// Tools Page Component
export async function Tools({ c }: ToolsProps) {
  const user = await getLoggedInUser(c)

  return (
    <div className="min-h-screen">
      <Navigation c={c} user={user} />
      <main className="homepage-main">
        <div className="homepage-container">
          <div className="page-header">
            <h1 className="page-title">Tools</h1>
            <p className="page-subtitle">Helpful tools for your faith journey</p>
          </div>

          <div className="tools-section">
            <div className="tools-grid">
              {/* HTML Preview Tool */}
              <div className="tool-card">
                <div className="tool-header">
                  <div className="tool-icon">
                    <i className="fas fa-code"></i>
                  </div>
                  <h3 className="tool-title">HTML Preview Tool</h3>
                </div>
                <div className="tool-content">
                  <p className="tool-description">Test and preview HTML content in real-time. Perfect for checking how your HTML will render before publishing.</p>
                </div>
                <div className="tool-actions">
                  <a href="/static/html-preview-tool.html" className="btn-primary" target="_blank">
                    <i className="fas fa-external-link-alt"></i>
                    Open Tool
                  </a>
                </div>
              </div>

              {/* Bible Trivia Tool */}
              <div className="tool-card">
                <div className="tool-header">
                  <div className="tool-icon">
                    <i className="fas fa-question-circle"></i>
                  </div>
                  <h3 className="tool-title">Bible Trivia 1</h3>
                </div>
                <div className="tool-content">
                  <p className="tool-description">Test version of our Bible trivia game with all routes configured. Perfect for testing new features and functionality before deployment.</p>
                </div>
                <div className="tool-actions">
                  <a href="/tools/bible-trivia1.html" className="btn-primary" target="_blank">
                    <i className="fas fa-external-link-alt"></i>
                    Test Trivia 1
                  </a>
                </div>
              </div>

              <div className="tool-card">
                <div className="tool-header">
                  <div className="tool-icon">
                    <i className="fas fa-chalkboard-teacher"></i>
                  </div>
                  <h3 className="tool-title">Quantum Chalkboard</h3>
                </div>
                <div className="tool-content">
                  <p className="tool-description">Advanced AI-powered mathematics chalkboard with handwriting recognition. Perfect for teaching complex mathematical and biblical concepts.</p>
                </div>
                <div className="tool-actions">
                  <a href="/static/quantum-chalkboard.html" className="btn-primary" target="_blank">
                    <i className="fas fa-external-link-alt"></i>
                    Open Chalkboard
                  </a>
                </div>
              </div>
            </div>

            {/* Call to Action Section */}
            <div className="tools-cta">
              <div className="cta-content">
                <h3>Have a Tool Suggestion?</h3>
                <p>We'd love to hear your ideas for new tools that would help strengthen your faith journey.</p>
                <a href="/about" className="btn-secondary">
                  <i className="fas fa-envelope"></i>
                  Contact Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer c={c} />

      {/* Tools Page Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .tools-section {
            padding: 2rem 0;
          }

          .tools-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 2rem;
            margin-bottom: 3rem;
          }

          .tool-card {
            background: white;
            border-radius: 16px;
            padding: 2rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            border: 1px solid rgba(59, 130, 246, 0.1);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          }

          .tool-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 25px rgba(0, 0, 0, 0.1);
            border-color: rgba(59, 130, 246, 0.2);
          }

          .tool-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1.5rem;
          }

          .tool-icon {
            width: 60px;
            height: 60px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            color: white;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
          }

          .tool-title {
            font-size: 1.25rem;
            font-weight: 600;
            color: #1f293b;
            margin: 0;
          }

          .tool-content {
            margin-bottom: 2rem;
          }

          .tool-description {
            color: #6b7280;
            line-height: 1.6;
            margin-bottom: 1rem;
            font-size: 0.95rem;
          }

          .tool-actions {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .tools-cta {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            border-radius: 16px;
            padding: 3rem 2rem;
            text-align: center;
            border: 1px solid rgba(59, 130, 246, 0.1);
          }

          .cta-content h3 {
            font-size: 1.5rem;
            color: #1f293b;
            margin-bottom: 1rem;
            font-weight: 600;
          }

          .cta-content p {
            color: #6b7280;
            font-size: 1.1rem;
            line-height: 1.6;
            margin-bottom: 2rem;
            max-width: 500px;
            margin-left: auto;
            margin-right: auto;
          }

          /* Responsive Design */
          @media (max-width: 768px) {
            .tools-grid {
              grid-template-columns: 1fr;
              gap: 1.5rem;
            }

            .tool-card {
              padding: 1.5rem;
            }

            .tool-header {
              margin-bottom: 1rem;
            }

            .tool-icon {
              width: 50px;
              height: 50px;
              font-size: 1.25rem;
            }

            .tools-cta {
              padding: 2rem 1.5rem;
            }

            .cta-content h3 {
              font-size: 1.25rem;
            }

            .cta-content p {
              font-size: 1rem;
            }
          }
        `
      }} />
    </div>
  )
}

export default Tools
