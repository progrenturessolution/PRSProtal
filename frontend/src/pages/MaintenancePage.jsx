import logo from '../assets/logo.png';
import './MaintenancePage.css';

function MaintenancePage() {
  return (
    <main className="maintenance-page" role="main" aria-label="Website under maintenance">
      <section className="maintenance-shell">
        <div className="maintenance-hero">
          <div className="maintenance-brand-row">
            <div className="maintenance-brand-icon" aria-hidden="true">
              <img src={logo} alt="Progrentures Logo" className="maintenance-brand-logo" />
            </div>
            <div className="maintenance-brand-copy">
              <p className="maintenance-company">Progrentures Solution Pvt. Ltd.</p>
              <h1>PRS Portal</h1>
            </div>
          </div>

          <div className="maintenance-heading-block">
            <span className="maintenance-badge">Under Maintenance</span>
            <h2>We are improving the platform for a better experience.</h2>
            <p>
              The website is currently undergoing updates and enhancements. Our team is
              working on performance, design, and new features to make the portal faster,
              cleaner, and easier to use.
            </p>
          </div>

          <div className="maintenance-points" aria-hidden="true">
            <div className="maintenance-point">
              <span className="maintenance-dot" />
              UI and workflow improvements are in progress
            </div>
            <div className="maintenance-point">
              <span className="maintenance-dot" />
              Services will be restored as soon as updates are complete
            </div>
            <div className="maintenance-point">
              <span className="maintenance-dot" />
              Thank you for your patience and support
            </div>
          </div>
        </div>

        <aside className="maintenance-card" aria-label="Maintenance status">
          <div className="maintenance-card-top">
            <span className="maintenance-status-pill">Work in progress</span>
            <span className="maintenance-status-time">Temporary downtime</span>
          </div>

          <div className="maintenance-card-body">
            <h3>Site update in progress</h3>
            <p>
              We are currently making changes to improve the overall experience.
              Please check back shortly.
            </p>
          </div>

          <div className="maintenance-metrics">
            <div className="maintenance-metric">
              <span className="maintenance-metric-label">Status</span>
              <strong>Maintenance</strong>
            </div>
            <div className="maintenance-metric">
              <span className="maintenance-metric-label">Access</span>
              <strong>Temporarily paused</strong>
            </div>
            <div className="maintenance-metric">
              <span className="maintenance-metric-label">Update</span>
              <strong>Ongoing</strong>
            </div>
          </div>

          <div className="maintenance-progress" aria-hidden="true">
            <div className="maintenance-progress-bar" />
          </div>
        </aside>
      </section>
    </main>
  );
}

export default MaintenancePage;
