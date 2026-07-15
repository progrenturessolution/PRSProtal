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

  const getDisplayValue = (value, fallback = '—') => {
    if (value === undefined || value === null) return fallback;
    const normalizedValue = String(value).trim();
    return normalizedValue || fallback;
  };

  const getStatusClass = (statusValue) => {
    const normalizedStatus = String(statusValue || '').toLowerCase();
    if (normalizedStatus === 'active') return 'status-active';
    if (normalizedStatus === 'completed') return 'status-completed';
    return 'status-other';
  };

  const verificationSections = studentData
    ? (studentData.studentType === 'SMS Program'
        ? [{
            title: 'SMS Student Verification',
            chipLabel: 'SMS Program',
            fields: [
              { label: 'Name', value: studentData.smsStudentVerification?.name },
              { label: 'Email', value: studentData.smsStudentVerification?.email, wrap: true },
              { label: 'PSMS ID', value: studentData.smsStudentVerification?.psmsId },
              { label: 'Mobile Number', value: studentData.smsStudentVerification?.mobile },
              { label: 'Domain', value: studentData.smsStudentVerification?.domain },
              { label: 'Duration', value: studentData.smsStudentVerification?.duration },
              { label: 'Start Month', value: studentData.smsStudentVerification?.startMonth },
              { label: 'Designation', value: studentData.smsStudentVerification?.designation },
              { label: 'Status', value: studentData.smsStudentVerification?.status, isStatus: true }
            ]
          }]
        : [{
            title: 'Intern Verification',
            chipLabel: 'Internship',
            fields: [
              { label: 'Name', value: studentData.internshipVerification?.name },
              { label: 'Email', value: studentData.internshipVerification?.email, wrap: true },
              { label: 'PIID', value: studentData.internshipVerification?.piid },
              { label: 'Mobile Number', value: studentData.internshipVerification?.mobile },
              { label: 'Domain of Internship', value: studentData.internshipVerification?.domainOfInternship },
              { label: 'Duration', value: studentData.internshipVerification?.duration },
              { label: 'Internship Start Month', value: studentData.internshipVerification?.internshipStartMonth },
              { label: 'Internship Type', value: studentData.internshipVerification?.internshipType },
              { label: 'Status', value: studentData.internshipVerification?.status, isStatus: true }
            ]
          }])
    : [];

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

        /* Left Branding Panel styles now completely inherited from global .login-left in index.css */

        /* Right Content Panel */
        .verify-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px;
          overflow-y: auto;
          position: relative;
          min-height: 100vh;
        }

        .verify-right-container {
          width: 100%;
          max-width: 580px;
        }

        .verify-right-container .login-card {
          margin: 0 auto;
        }

        /* Form styling inherited from login page classes */

        /* Success Affiliation Certificate Card */
        .verify-results-panel {
          background: white;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.05);
          padding: 24px;
          display: flex;
          flex-direction: column;
          animation: slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .verify-results-header {
          display: flex;
          align-items: center;
          gap: 16px;
          border-bottom: 1.5px solid #f1f5f9;
          padding-bottom: 12px;
          margin-bottom: 16px;
        }

        .verify-badge-success-icon {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          background: #344158;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(52, 65, 88, 0.15);
          flex-shrink: 0;
        }

        .verify-badge-title h4 {
          font-size: 18px;
          font-weight: 600;
          color: #344158;
          margin: 0;
          letter-spacing: -0.01em;
        }

        .verify-badge-title p {
          margin: 3px 0 0 0;
          font-size: 12px;
          color: #64748b;
          font-weight: 400;
        }

        .verify-results-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px 20px;
        }

        .verification-section {
          padding: 18px 0;
          border-top: 1px solid #f1f5f9;
        }

        .verification-section:first-of-type {
          border-top: none;
          padding-top: 0;
        }

        .verification-section:last-of-type {
          padding-bottom: 0;
        }

        .verification-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 14px;
        }

        .verification-section-header h5 {
          margin: 0;
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.01em;
        }

        .verify-section-chip {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 999px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #475569;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .grid-span-full {
          grid-column: span 2;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .detail-label {
          font-size: 11px;
          font-weight: 700;
          color: #0f172a;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .detail-value {
          font-size: 14px;
          font-weight: 500;
          color: #64748b;
        }

        .detail-status-pill {
          display: inline-flex;
          align-items: center;
          width: fit-content;
          padding: 4px 10px;
          border-radius: 99px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          margin-top: 2px;
        }

        .status-active {
          background: #f1f5f9;
          color: #334155;
          border: 1px solid #cbd5e1;
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
          padding: 24px;
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
          background: #344158;
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
          background: #344158;
        }

        .action-btn-secondary {
          flex: 1;
          padding: 13px;
          border-radius: 10px;
          border: none;
          background: #344158;
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

        .action-btn-secondary:hover {
          background: #344158;
          color: white;
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

          /* Left panel on mobile */
          .verify-container .login-left {
            min-height: auto;
            padding: 24px 16px;
            box-shadow: none;
          }

          .verify-container .login-left-content {
            min-height: auto;
            padding: 0;
            gap: 12px;
            align-items: flex-start;
            text-align: left;
            justify-content: center;
            width: 100%;
          }

          .verify-container .login-brand-row {
            flex-direction: row;
            align-items: center;
            justify-content: flex-start;
            gap: 12px;
            margin-top: 0;
          }

          .verify-container .login-brand-icon {
            width: 48px;
            height: 48px;
            border-radius: 10px;
            padding: 4px;
          }

          .verify-container .login-brand-copy {
            align-items: flex-start;
            text-align: left;
          }

          .verify-container .login-brand-copy h2 {
            font-size: 15px;
          }

          .verify-container .login-brand-copy p {
            font-size: 10px;
          }

          .verify-container .login-hero-copy {
            text-align: left;
            max-width: 100%;
            margin: 0;
          }

          .verify-container .login-hero-copy h1 {
            font-size: 20px;
            white-space: normal;
            margin: 0;
          }

          .verify-container .login-hero-copy p {
            display: block;
            font-size: 13px;
            color: rgba(226, 232, 240, 0.92);
            margin-top: 8px;
          }

          .verify-container .login-feature-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-top: 12px;
          }

          .verify-container .login-feature-item {
            font-size: 13px;
            padding-left: 16px;
          }

          .verify-container .login-feature-item::before {
            width: 6px;
            height: 6px;
          }

          .verify-container .login-footer-copy {
            display: block;
            margin-top: 16px;
            padding-top: 12px;
          }

          .verify-container .login-footer-copy p {
            font-size: 11px;
          }

          .verify-container .login-footer-brand {
            font-size: 12px;
          }

          .verify-container .login-footer-rights {
            font-size: 10px;
          }

          /* Right panel */
          .verify-right {
            padding: 24px 16px;
            height: auto;
            overflow-y: visible;
            min-height: auto;
          }

          .verify-right-container {
            max-width: 100%;
          }

          .verify-results-panel {
            padding: 20px 16px;
            border-radius: 16px;
          }

          .verify-results-grid {
            grid-template-columns: 1fr;
            gap: 14px;
          }

          .grid-span-full {
            grid-column: span 1;
          }

          .verify-actions-row {
            flex-direction: column;
            gap: 10px;
          }
        }
      `}</style>

      {/* Left Panel */}
      <div className="login-left">
        <div className="login-left-content">
          <div className="login-brand-row">
            <div className="login-brand-icon" aria-hidden="true">
              <img src={logo} alt="Progrentures Logo" className="login-brand-logo" />
            </div>
            <div className="login-brand-copy">
              <h2>Progrentures Solution Pvt. Ltd.</h2>
              <p>Credentials Registry</p>
            </div>
          </div>

          <div className="login-hero-copy">
            <h1>Validate Your Affiliation</h1>
            <p>
              The Progrentures Credentials Registry allows candidates to securely verify their official enrollment, program details, certification records, and registered profile information through the Progrentures official verification portal.
            </p>
          </div>

          <div className="login-feature-list" aria-hidden="true">
            <div className="login-feature-item">Confirm your official enrollment status</div>
            <div className="login-feature-item">Ensure your registered information is accurate</div>
            <div className="login-feature-item">Access your verified candidate profile</div>
            <div className="login-feature-item">Validate your program affiliation anytime</div>
          </div>

          <div className="login-footer-copy">
            <p>
              Only registered candidates with valid credentials can access their verification details.
            </p>
            <div className="login-footer-brand">Progrentures Verification Portal</div>
            <div className="login-footer-rights">Progrentures Solution Pvt. Ltd.</div>
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
                  <label htmlFor="internId">Aspirant ID (PIID / PSMS ID)</label>
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

                {verificationSections.map((section) => (
                  <div className="verification-section" key={section.title}>
                    <div className="verification-section-header">
                      <h5>{section.title}</h5>
                      <span className="verify-section-chip">{section.chipLabel}</span>
                    </div>

                    <div className="verify-results-grid">
                      {section.fields.map((field) => (
                        <div className="detail-item" key={`${section.title}-${field.label}`}>
                          <span className="detail-label">{field.label}</span>
                          {field.isStatus ? (
                            <span className={`detail-status-pill ${getStatusClass(field.value)}`}>
                              {getDisplayValue(field.value)}
                            </span>
                          ) : (
                            <span
                              className="detail-value"
                              style={field.wrap ? { wordBreak: 'break-all' } : undefined}
                            >
                              {getDisplayValue(field.value)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="verify-results-footer">
                  <div className="verify-company-tag">
                    Verified By: <strong>{studentData.companyName || 'Progrentures Solution'}</strong>
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
