import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import logo from '../assets/logo.png';

export default function VerifyIdentity() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    internId: '',
    mobile: ''
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
        mobile: formData.mobile.trim()
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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 10% 20%, #1e293b 0%, #0f172a 90%)',
      padding: '24px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Dynamic Keyframes & Reset Classes */}
      <style>{`
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
        .verified-card-animate {
          animation: slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .input-wrapper-focus {
          border-color: #17233A !important;
          box-shadow: 0 0 0 4px rgba(23, 35, 58, 0.08) !important;
        }
        .verify-btn-active:active {
          transform: scale(0.98);
        }
      `}</style>

      <div style={{
        maxWidth: '620px',
        width: '100%',
        padding: '40px',
        borderRadius: '20px',
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        border: '1px solid rgba(255, 255, 255, 0.8)',
        boxSizing: 'border-box'
      }}>
        
        {/* Brand Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '32px',
          borderBottom: '1.5px solid #f1f5f9',
          paddingBottom: '20px'
        }}>
          <img src={logo} alt="Progrentures Logo" style={{ width: '52px', height: '52px', objectFit: 'contain' }} />
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>Progrentures Solution Pvt. Ltd.</h2>
            <p style={{ fontSize: '11px', color: '#64748b', margin: '3px 0 0 0', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700' }}>Public Credentials Registry</p>
          </div>
        </div>

        <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginBottom: '8px', letterSpacing: '-0.02em' }}>Verify Student Affiliation</h3>
        <p style={{ fontSize: '14px', color: '#475569', marginBottom: '28px', lineHeight: '1.6' }}>
          Securely verify the enrollment and program completion records of candidates by inputting their registered credentials.
        </p>

        {/* Verification Form */}
        <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
          
          {/* Aspirant ID Field */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>Aspirant ID (Intern ID / SMS ID)</label>
            <div 
              className={focusedField === 'internId' ? 'input-wrapper-focus' : ''}
              style={{
                display: 'flex',
                alignItems: 'center',
                background: '#ffffff',
                border: '1.5px solid #cbd5e1',
                borderRadius: '12px',
                padding: '0 16px',
                transition: 'all 0.2s ease-in-out'
              }}
            >
              {/* User SVG Icon */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" style={{ marginRight: '12px' }}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <input
                type="text"
                name="internId"
                value={formData.internId}
                onChange={handleChange}
                onFocus={() => setFocusedField('internId')}
                onBlur={() => setFocusedField(null)}
                placeholder="e.g., PSMS/MAR26001/ANI"
                style={{
                  border: 'none',
                  outline: 'none',
                  width: '100%',
                  padding: '14px 0',
                  fontSize: '15px',
                  color: '#0f172a',
                  background: 'transparent'
                }}
                required
              />
            </div>
          </div>

          {/* Mobile Field */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>Mobile Number</label>
            <div 
              className={focusedField === 'mobile' ? 'input-wrapper-focus' : ''}
              style={{
                display: 'flex',
                alignItems: 'center',
                background: '#ffffff',
                border: '1.5px solid #cbd5e1',
                borderRadius: '12px',
                padding: '0 16px',
                transition: 'all 0.2s ease-in-out'
              }}
            >
              {/* Phone SVG Icon */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" style={{ marginRight: '12px' }}>
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                onFocus={() => setFocusedField('mobile')}
                onBlur={() => setFocusedField(null)}
                placeholder="Registered mobile number"
                style={{
                  border: 'none',
                  outline: 'none',
                  width: '100%',
                  padding: '14px 0',
                  fontSize: '15px',
                  color: '#0f172a',
                  background: 'transparent'
                }}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="verify-btn-active"
            style={{
              marginTop: '8px',
              padding: '15px',
              borderRadius: '12px',
              border: 'none',
              background: '#17233A',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 4px 12px rgba(23, 35, 58, 0.2)',
              transition: 'all 0.2s ease-in-out'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#1e304f';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#17233A';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {loading ? (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ animation: 'spin 1s linear infinite', marginRight: '6px' }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                <span>Checking Registry...</span>
              </>
            ) : (
              <span>Verify Candidate Registry</span>
            )}
          </button>
        </form>

        {/* Verification Result Area */}
        {result === 'success' && studentData && (
          <div className="verified-card-animate" style={{ padding: '24px', borderRadius: '16px', background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#10b981',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: '800'
              }}>✓</div>
              <div>
                <h4 style={{ fontSize: '17px', fontWeight: '800', color: '#065f46', margin: 0, letterSpacing: '-0.01em' }}>Registry Check Passed</h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#047857', fontWeight: '500' }}>Credential matching succeeded.</p>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              padding: '16px 0',
              borderTop: '1px solid rgba(16, 185, 129, 0.2)',
              borderBottom: '1px solid rgba(16, 185, 129, 0.2)'
            }}>
              <div>
                <span style={{ display: 'block', fontSize: '11px', color: '#047857', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Aspirant Name</span>
                <strong style={{ fontSize: '14px', color: '#065f46', fontWeight: '700' }}>{studentData.name}</strong>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '11px', color: '#047857', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Email Address</span>
                <strong style={{ fontSize: '14px', color: '#065f46', fontWeight: '700', wordBreak: 'break-all' }}>{studentData.email}</strong>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '11px', color: '#047857', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Aspirant ID</span>
                <strong style={{ fontSize: '14px', color: '#065f46', fontWeight: '700' }}>{studentData.internId}</strong>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '11px', color: '#047857', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Mobile Number</span>
                <strong style={{ fontSize: '14px', color: '#065f46', fontWeight: '700' }}>{studentData.mobile}</strong>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '11px', color: '#047857', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Program Type</span>
                <strong style={{ fontSize: '14px', color: '#065f46', fontWeight: '700' }}>{studentData.studentType}</strong>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '11px', color: '#047857', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Assigned Domain</span>
                <strong style={{ fontSize: '14px', color: '#065f46', fontWeight: '700' }}>{studentData.domain}</strong>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '11px', color: '#047857', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Batch Start</span>
                <strong style={{ fontSize: '14px', color: '#065f46', fontWeight: '700' }}>{studentData.joiningDate}</strong>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '11px', color: '#047857', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Duration</span>
                <strong style={{ fontSize: '14px', color: '#065f46', fontWeight: '700' }}>{studentData.duration}</strong>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ display: 'block', fontSize: '11px', color: '#047857', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>College / Institution</span>
                <strong style={{ fontSize: '14px', color: '#065f46', fontWeight: '700' }}>{studentData.collegeName}</strong>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '11px', color: '#047857', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status Badge</span>
                <span style={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '4px 10px', 
                  borderRadius: '999px', 
                  fontSize: '11px', 
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  background: studentData.status?.toLowerCase() === 'active' ? '#ecfdf5' : studentData.status?.toLowerCase() === 'completed' ? '#eff6ff' : '#f1f5f9', 
                  color: studentData.status?.toLowerCase() === 'active' ? '#047857' : studentData.status?.toLowerCase() === 'completed' ? '#1d4ed8' : '#475569',
                  border: studentData.status?.toLowerCase() === 'active' ? '1px solid #a7f3d0' : studentData.status?.toLowerCase() === 'completed' ? '#bfdbfe' : '#cbd5e1',
                  marginTop: '6px'
                }}>
                  {studentData.status}
                </span>
              </div>
            </div>

            <div style={{ marginTop: '16px', fontSize: '12px', color: '#047857', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Verified Institution: <strong>{studentData.companyName}</strong></span>
            </div>
          </div>
        )}

        {result === 'fail' && (
          <div className="verified-card-animate" style={{ padding: '24px', borderRadius: '16px', background: '#fef2f2', border: '1px solid #fca5a5' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#dc2626',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: '800'
              }}>!</div>
              <div>
                <h4 style={{ fontSize: '17px', fontWeight: '800', color: '#991b1b', margin: 0, letterSpacing: '-0.01em' }}>Identity Verification Failed</h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#b91c1c', fontWeight: '500' }}>No matching registry records found.</p>
              </div>
            </div>
            <p style={{ fontSize: '13.5px', color: '#7f1d1d', margin: '0 0 16px 0', lineHeight: '1.6' }}>
              {errorMessage}
            </p>
            <div style={{ fontSize: '11px', color: '#991b1b', borderTop: '1px solid rgba(220, 38, 38, 0.15)', paddingTop: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: '700' }}>
              Authority: <strong>Progrentures Solution Pvt. Ltd.</strong>
            </div>
          </div>
        )}

        {/* Back Link */}
        <div style={{ marginTop: '28px', textAlign: 'center', borderTop: '1.5px solid #f1f5f9', paddingTop: '22px' }}>
          <button
            type="button"
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#0f172a'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transition: 'transform 0.2s' }}>
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back to Sign In
          </button>
        </div>

      </div>
    </div>
  );
}
