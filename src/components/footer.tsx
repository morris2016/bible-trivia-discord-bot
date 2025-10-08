import { Context } from 'hono'

interface FooterProps {
  c: Context
  className?: string
}

// Footer Component - Shared across all pages
export function Footer({ c, className = 'site-footer' }: FooterProps) {
  const settings = c.get('settings') || {}

  const footerText = settings.footer_text || '© 2024 Faith Defenders. All rights reserved.'
  const contactEmail = settings.contact_email || 'contact@faithdefenders.com'
  const phoneNumber = settings.phone_number
  const address = settings.address
  const facebookUrl = settings.facebook_url
  const twitterUrl = settings.twitter_url
  const instagramUrl = settings.instagram_url
  const youtubeUrl = settings.youtube_url

  return (
    <footer className={className}>
      <div className="footer-container">
        <div className="footer-content">

          {/* Social Media Links */}
          {(facebookUrl || twitterUrl || instagramUrl || youtubeUrl) && (
            <div className="footer-social">
              <h4>Follow Us</h4>
              <div className="social-links">
                {facebookUrl && (
                  <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="social-link facebook" title="Follow us on Facebook">
                    <i className="fab fa-facebook-f"></i>
                  </a>
                )}
                {twitterUrl && (
                  <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className="social-link twitter" title="Follow us on Twitter">
                    <i className="fab fa-twitter"></i>
                  </a>
                )}
                {instagramUrl && (
                  <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="social-link instagram" title="Follow us on Instagram">
                    <i className="fab fa-instagram"></i>
                  </a>
                )}
                {youtubeUrl && (
                  <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className="social-link youtube" title="Subscribe to our YouTube channel">
                    <i className="fab fa-youtube"></i>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Contact Information - Always show on homepage */}
          <div className="footer-contact">
            <h4>Get In Touch</h4>
            <div className="contact-info">
              <div className="contact-item">
                <i className="fas fa-envelope"></i>
                <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
              </div>
              {phoneNumber && (
                <div className="contact-item">
                  <i className="fas fa-phone"></i>
                  <span>{phoneNumber}</span>
                </div>
              )}
              {address && (
                <div className="contact-item">
                  <i className="fas fa-map-marker-alt"></i>
                  <span>{address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer Text */}
          <div className="footer-text">
            <p>{footerText}</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
