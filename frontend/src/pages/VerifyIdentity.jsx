import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import logo from '../assets/logo.png';

export default function VerifyIdentity() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    internId: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // 'success' or 'fail'
  const [studentData, setStudentData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [focusedField, setFocusedField] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setErrorMessage('');
  };

  const handleReset = () => {
    setFormData({
      internId: '',
      email: ''
    });
    setResult(null);
    setStudentData(null);
    setErrorMessage('');
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setErrorMessage('');
    setResult(null);
    setStudentData(null);

    try {
      const response = await authAPI.verifyIdentity({
        internId: formData.internId.trim(),
        email: formData.email.trim()
      });

      if (response?.data?.success) {
        setStudentData(response.data.student);
        setResult('success');
      }
    } catch (err) {
      setResult('fail');
      setErrorMessage(
        err.response?.data?.message || 'Verification failed. Please check the credentials and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verify-container">
      {/* CSS Styling */}
      <style>{`
        /* Reset and Base Customizations */
        .verify-container {
          display: flex;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          background: #f8fafc;
          box-sizing: border-box;
        }

        .verify-container * {
          box-sizing: border-box;
        }

        /* Left Branding Panel */
        .verify-left {
          flex: 4;
          background: linear-gradient(135deg, #0e1b33 0%, #17233b 100%);
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px;
          color: white;
        }

        /* Ambient glowing circles and pattern overlay */
        .verify-left::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: 
            radial-gradient(circle at 80% 20%, rgba(14, 165, 183, 0.15) 0%, transparent 50%),
            linear-gradient(135deg, rgba(255, 255, 255, 0.02) 25%, transparent 25%),
            linear-gradient(225deg, rgba(255, 255, 255, 0.02) 25%, transparent 25%),
            linear-gradient(45deg, rgba(255, 255, 255, 0.02) 25%, transparent 25%),
            linear-gradient(315deg, rgba(255, 255, 255, 0.02) 25%, transparent 25%);
          background-position: 0 0, 30px 0, 30px 0, 0 0, 0 0;
          background-size: 100% 100%, 60px 60px, 60px 60px, 60px 60px, 60px 60px;
          opacity: 0.85;
          pointer-events: none;
        }

        .verify-left-content {
          width: 100%;
          max-width: 460px;
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .verify-brand-row {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .verify-brand-logo-container {
          width: 72px;
          height: 72px;
          border-radius: 16px;
          background: white;
          padding: 6px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.28);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .verify-brand-logo {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .verify-brand-copy h2 {
          font-size: 18px;
          font-weight: 800;
          color: #f8fafc;
          margin: 0;
          letter-spacing: -0.01em;
          line-height: 1.2;
        }

        .verify-brand-copy p {
          font-size: 11px;
          color: #0ea5b7;
          margin: 4px 0 0 0;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: 700;
        }

        .verify-hero h1 {
          font-size: 32px;
          font-weight: 800;
          line-height: 1.2;
          color: #ffffff;
          margin: 0 0 16px 0;
          letter-spacing: -0.03em;
        }

        .verify-hero p {
          font-size: 15px;
          line-height: 1.6;
          color: #cbd5e1;
          margin: 0;
        }

        .verify-why-section h3 {
          font-size: 15px;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 16px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .verify-features-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .verify-feature-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .verify-feature-icon-new {
          font-size: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .verify-feature-text-new {
          font-size: 14px;
          color: #cbd5e1;
          line-height: 1.4;
          font-weight: 500;
        }

        .verify-secure-section {
          background: rgba(14, 165, 183, 0.05);
          border: 1px solid rgba(14, 165, 183, 0.15);
          border-radius: 12px;
          padding: 16px;
        }

        .verify-secure-section h3 {
          font-size: 14.5px;
          font-weight: 700;
          color: #0ea5b7;
          margin: 0 0 8px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .verify-secure-section p {
          font-size: 13px;
          color: #cbd5e1;
          margin: 0;
          line-height: 1.5;
        }

        .verify-left-footer {
          font-size: 11px;
          color: #64748b;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 24px;
          line-height: 1.5;
        }

        .verify-left-footer strong {
          color: #94a3b8;
        }

        /* Right Content Panel */
        .verify-right {
          flex: 6;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px;
          overflow-y: auto;
          position: relative;
        }

        .verify-right-container {
          width: 100%;
          max-width: 580px;
        }

        /* Form styling inherited from login page classes */

        /* Success Affiliation Certificate Card */
        .verify-results-panel {
          background: white;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.05);
          padding: 36px;
          display: flex;
          flex-direction: column;
          animation: slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .verify-results-header {
          display: flex;
          align-items: center;
          gap: 16px;
          border-bottom: 1.5px solid #f1f5f9;
          padding-bottom: 20px;
          margin-bottom: 24px;
        }

        .verify-badge-success-icon {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          background: #10b981;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 800;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
          flex-shrink: 0;
        }

        .verify-badge-title h4 {
          font-size: 18px;
          font-weight: 800;
          color: #065f46;
          margin: 0;
          letter-spacing: -0.01em;
        }

        .verify-badge-title p {
          margin: 3px 0 0 0;
          font-size: 12px;
          color: #047857;
          font-weight: 600;
        }

        .verify-results-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 18px 24px;
          margin-bottom: 24px;
        }

        .grid-span-full {
          grid-column: span 2;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .detail-label {
          font-size: 11px;
          font-weight: 800;
          color: #047857;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .detail-value {
          font-size: 14.5px;
          font-weight: 700;
          color: #0f172a;
        }

        .detail-status-pill {
          display: inline-flex;
          align-items: center;
          width: fit-content;
          padding: 4px 10px;
          border-radius: 99px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          margin-top: 2px;
        }

        .status-active {
          background: #ecfdf5;
          color: #047857;
          border: 1px solid #a7f3d0;
        }

        .status-completed {
          background: #eff6ff;
          color: #1d4ed8;
          border: 1px solid #bfdbfe;
        }

        .status-other {
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #cbd5e1;
        }

        .verify-results-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1.5px solid #f1f5f9;
          padding-top: 18px;
          margin-top: 6px;
        }

        .verify-company-tag {
          font-size: 12px;
          color: #64748b;
        }

        .verify-company-tag strong {
          color: #334155;
        }

        /* Failure state styling */
        .verify-failed-panel {
          background: white;
          border-radius: 20px;
          border: 1px solid #fca5a5;
          box-shadow: 0 20px 40px rgba(220, 38, 38, 0.05);
          padding: 36px;
          display: flex;
          flex-direction: column;
          animation: slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .verify-failed-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 18px;
        }

        .verify-badge-failed-icon {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          background: #dc2626;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 800;
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);
          flex-shrink: 0;
        }

        .verify-badge-failed-title h4 {
          font-size: 18px;
          font-weight: 800;
          color: #991b1b;
          margin: 0;
          letter-spacing: -0.01em;
        }

        .verify-badge-failed-title p {
          margin: 3px 0 0 0;
          font-size: 12px;
          color: #b91c1c;
          font-weight: 600;
        }

        .verify-failed-msg {
          font-size: 14px;
          color: #7f1d1d;
          line-height: 1.6;
          margin: 0 0 24px 0;
        }

        .verify-failed-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1.5px solid #fecaca;
          padding-top: 18px;
        }

        .authority-text {
          font-size: 11px;
          color: #b91c1c;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          font-weight: 700;
        }

        /* Action Buttons Area */
        .verify-actions-row {
          display: flex;
          gap: 14px;
          margin-top: 24px;
          justify-content: center;
        }

        .action-btn-primary {
          flex: 1;
          padding: 13px;
          border-radius: 10px;
          border: none;
          background: #17233a;
          color: white;
          font-size: 14.5px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .action-btn-primary:hover {
          background: #1e304f;
        }

        .action-btn-secondary {
          flex: 1;
          padding: 13px;
          border-radius: 10px;
          border: 1.5px solid #cbd5e1;
          background: transparent;
          color: #475569;
          font-size: 14.5px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .action-btn-secondary:hover {
          border-color: #94a3b8;
          color: #0f172a;
          background: #f1f5f9;
        }

        .back-to-signin-container {
          margin-top: 28px;
          text-align: center;
        }

        .back-to-signin-btn {
          background: none;
          border: none;
          color: #64748b;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: color 0.2s;
          padding: 0;
        }

        .back-to-signin-btn:hover {
          color: #0f172a;
        }

        .spin {
          animation: spin-kf 1s linear infinite;
        }

        @keyframes spin-kf {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Responsive Breakpoints */
        @media (max-width: 968px) {
          .verify-container {
            flex-direction: column;
            overflow-y: auto;
            height: auto;
            min-height: 100vh;
          }

          .verify-left {
            padding: 40px 24px;
            min-height: auto;
          }

          .verify-left-content {
            max-width: 100%;
            gap: 28px;
          }

          .verify-right {
            padding: 40px 24px;
            height: auto;
            overflow-y: visible;
          }

          .verify-right-container {
            max-width: 100%;
          }

          .verify-results-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .grid-span-full {
            grid-column: span 1;
          }
        }
      `}</style>

      {/* Left Panel */}
      <div className="verify-left">
        <div className="verify-left-content">
          <div className="verify-brand-row">
            <div className="verify-brand-logo-container">
              <img src={logo} alt="Progrentures Logo" className="verify-brand-logo" />
            </div>
            <div className="verify-brand-copy">
              <h2>Progrentures Solution Pvt. Ltd.</h2>
              <p>Credentials Registry</p>
            </div>
          </div>

          <div className="verify-hero">
            <h1>Validate Your Affiliation</h1>
            <p style={{ marginBottom: '16px' }}>
              Verify your enrollment and confirm that your registration details are officially recorded with Progrentures Solution Pvt. Ltd.
            </p>
            <p>
              Enter your registered credentials to instantly check your candidate profile, enrollment status, and program information.
            </p>
          </div>

          <div className="verify-why-section">
            <h3>Why Verify Your Profile?</h3>
            <div className="verify-features-list">
              <div className="verify-feature-item">
                <span className="verify-feature-icon-new">✔️</span>
                <span className="verify-feature-text-new">Confirm your official enrollment status</span>
              </div>
              <div className="verify-feature-item">
                <span className="verify-feature-icon-new">✔️</span>
                <span className="verify-feature-text-new">Ensure your registered information is accurate</span>
              </div>
              <div className="verify-feature-item">
                <span className="verify-feature-icon-new">✔️</span>
                <span className="verify-feature-text-new">Access your verified candidate profile</span>
              </div>
              <div className="verify-feature-item">
                <span className="verify-feature-icon-new">✔️</span>
                <span className="verify-feature-text-new">Validate your program affiliation anytime</span>
              </div>
            </div>
          </div>

          <div className="verify-secure-section">
            <h3>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Secure & Instant Verification
            </h3>
            <p>
              Your information is protected using secure verification protocols. Only registered candidates can access their verification details.
            </p>
          </div>

          <div className="verify-left-footer">
            <strong>Official Candidate Verification Portal</strong><br />
            Progrentures Solution Pvt. Ltd.
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="verify-right">
        <div className="verify-right-container">
          
          {/* 1. Form State */}
          {result === null && (
            <div className="login-card">
              <div className="login-header">
                <h2>Verify Candidate</h2>
                <p>Please enter the candidate's registered Aspirant ID and Email address below to verify enrollment records.</p>
              </div>

              <form onSubmit={handleVerify} className="login-form">
                <div className="form-group">
                  <label htmlFor="internId">Aspirant ID (Intern ID / SMS ID)</label>
                  <input
                    id="internId"
                    type="text"
                    name="internId"
                    value={formData.internId}
                    onChange={handleChange}
                    placeholder="Enter candidate's Aspirant ID"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter candidate's email"
                    required
                  />
                </div>

                <button type="submit" disabled={loading} className="login-submit-btn">
                  {loading ? (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="spin" style={{ marginRight: '4px' }}>
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                      <span>Checking Registry...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify Affiliation Records</span>
                    </>
                  )}
                </button>
              </form>

              <div className="back-to-signin-container">
                <button type="button" onClick={() => navigate('/')} className="back-to-signin-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                  Back to Sign In
                </button>
              </div>
            </div>
          )}

          {/* 2. Success Result Panel */}
          {result === 'success' && studentData && (
            <div>
              <div className="verify-results-panel">
                <div className="verify-results-header">
                  <div className="verify-badge-success-icon">✓</div>
                  <div className="verify-badge-title">
                    <h4>Registry Check Passed</h4>
                    <p>Candidate records match verified database profile.</p>
                  </div>
                </div>

                <div className="verify-results-grid">
                  <div className="detail-item">
                    <span className="detail-label">Aspirant Name</span>
                    <span className="detail-value">{studentData.name}</span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Aspirant ID</span>
                    <span className="detail-value">{studentData.internId}</span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Email Address</span>
                    <span className="detail-value" style={{ wordBreak: 'break-all' }}>{studentData.email}</span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Mobile Number</span>
                    <span className="detail-value">{studentData.mobile}</span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Program Type</span>
                    <span className="detail-value">{studentData.studentType}</span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Assigned Domain</span>
                    <span className="detail-value-highlight">{studentData.domain}</span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Batch Start</span>
                    <span className="detail-value">{studentData.joiningDate}</span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Duration</span>
                    <span className="detail-value">{studentData.duration}</span>
                  </div>

                  <div className="detail-item grid-span-full">
                    <span className="detail-label">College / Institution</span>
                    <span className="detail-value">{studentData.collegeName}</span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Status Badge</span>
                    <span className={`detail-status-pill ${
                      studentData.status?.toLowerCase() === 'active' ? 'status-active' :
                      studentData.status?.toLowerCase() === 'completed' ? 'status-completed' : 'status-other'
                    }`}>
                      {studentData.status}
                    </span>
                  </div>
                </div>

                <div className="verify-results-footer">
                  <div className="verify-company-tag">
                    Verified Company: <strong>{studentData.companyName || 'Progrentures Solution'}</strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="verify-actions-row">
                <button type="button" onClick={handleReset} className="action-btn-primary">
                  Verify Another
                </button>
                <button type="button" onClick={() => navigate('/')} className="action-btn-secondary">
                  Back to Sign In
                </button>
              </div>
            </div>
          )}

          {/* 3. Fail Result Panel */}
          {result === 'fail' && (
            <div>
              <div className="verify-failed-panel">
                <div className="verify-failed-header">
                  <div className="verify-badge-failed-icon">!</div>
                  <div className="verify-badge-failed-title">
                    <h4>Registry Check Failed</h4>
                    <p>No matching candidate records found.</p>
                  </div>
                </div>

                <p className="verify-failed-msg">{errorMessage}</p>

                <div className="verify-failed-footer">
                  <span className="authority-text">Progrentures Credentials Registry</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="verify-actions-row">
                <button type="button" onClick={handleReset} className="action-btn-primary">
                  Try Again
                </button>
                <button type="button" onClick={() => navigate('/')} className="action-btn-secondary">
                  Back to Sign In
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

