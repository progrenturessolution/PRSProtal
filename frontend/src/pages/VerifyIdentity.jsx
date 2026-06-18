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
    <div className="login-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', padding: '20px' }}>
      <div className="login-card" style={{ maxWidth: '580px', width: '100%', padding: '32px', borderRadius: '16px', background: '#ffffff', boxShadow: '0 20px 48px rgba(0, 0, 0, 0.25)', border: '1px solid #e2e8f0' }}>
        
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '30px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
          <img src={logo} alt="Progrentures Logo" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Progrentures Solution Pvt. Ltd.</h2>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Public Verification Portal</p>
          </div>
        </div>

        <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>Verify Candidate Identity</h3>
        <p style={{ fontSize: '14px', color: '#475569', marginBottom: '24px', lineHeight: '1.5' }}>
          Verify whether an aspirant/candidate is or has been a verified member of our organization.
        </p>

        {/* Verification Form */}
        <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '20px' }}>
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Aspirant ID (Intern ID / SMS ID)</label>
            <input
              type="text"
              name="internId"
              value={formData.internId}
              onChange={handleChange}
              placeholder="e.g. PSMS260123"
              style={{ padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', width: '100%' }}
              required
            />
          </div>

          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Mobile Number</label>
            <input
              type="tel"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              placeholder="Registered mobile number"
              style={{ padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', width: '100%' }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px',
              borderRadius: '10px',
              border: 'none',
              background: '#17233A',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(23, 35, 58, 0.25)',
              transition: 'transform 0.15s ease, filter 0.15s ease'
            }}
            onMouseEnter={(e) => e.target.style.filter = 'brightness(1.05)'}
            onMouseLeave={(e) => e.target.style.filter = 'brightness(1)'}
          >
            {loading ? 'Verifying Credentials...' : 'Verify Candidate'}
          </button>
        </form>

        {/* Verification Result Area */}
        {result === 'success' && studentData && (
          <div style={{ marginTop: '24px', padding: '20px', borderRadius: '12px', background: '#ecfdf5', border: '1px solid #a7f3d0', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#10b981', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>✓</div>
              <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#065f46', margin: 0 }}>Verified Candidate</h4>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', fontSize: '13px', color: '#065f46' }}>
              <div>
                <strong style={{ display: 'block', color: '#047857', fontWeight: '700' }}>Candidate Name</strong>
                <span>{studentData.name}</span>
              </div>
              <div>
                <strong style={{ display: 'block', color: '#047857', fontWeight: '700' }}>Email Address</strong>
                <span style={{ wordBreak: 'break-all' }}>{studentData.email}</span>
              </div>
              <div>
                <strong style={{ display: 'block', color: '#047857', fontWeight: '700' }}>Aspirant ID</strong>
                <span>{studentData.internId}</span>
              </div>
              <div>
                <strong style={{ display: 'block', color: '#047857', fontWeight: '700' }}>Mobile Number</strong>
                <span>{studentData.mobile}</span>
              </div>
              <div>
                <strong style={{ display: 'block', color: '#047857', fontWeight: '700' }}>Program Type</strong>
                <span>{studentData.studentType}</span>
              </div>
              <div>
                <strong style={{ display: 'block', color: '#047857', fontWeight: '700' }}>Domain / Stream</strong>
                <span>{studentData.domain}</span>
              </div>
              <div>
                <strong style={{ display: 'block', color: '#047857', fontWeight: '700' }}>Joining Batch</strong>
                <span>{studentData.joiningDate}</span>
              </div>
              <div>
                <strong style={{ display: 'block', color: '#047857', fontWeight: '700' }}>Duration</strong>
                <span>{studentData.duration}</span>
              </div>
              <div>
                <strong style={{ display: 'block', color: '#047857', fontWeight: '700' }}>College / Institution</strong>
                <span>{studentData.collegeName}</span>
              </div>
              <div>
                <strong style={{ display: 'block', color: '#047857', fontWeight: '700' }}>Status</strong>
                <span style={{ 
                  display: 'inline-block',
                  padding: '2px 8px', 
                  borderRadius: '999px', 
                  fontSize: '11px', 
                  fontWeight: '700',
                  background: studentData.status?.toLowerCase() === 'active' ? '#d1fae5' : studentData.status?.toLowerCase() === 'completed' ? '#dbeafe' : '#f3f4f6', 
                  color: studentData.status?.toLowerCase() === 'active' ? '#065f46' : studentData.status?.toLowerCase() === 'completed' ? '#1e40af' : '#374151',
                  border: studentData.status?.toLowerCase() === 'active' ? '1px solid #a7f3d0' : studentData.status?.toLowerCase() === 'completed' ? '#bfdbfe' : '#e5e7eb',
                  marginTop: '4px'
                }}>
                  {studentData.status}
                </span>
              </div>
            </div>

            <div style={{ marginTop: '16px', borderTop: '1px solid #a7f3d0', paddingTop: '12px', fontSize: '12px', color: '#047857', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Verified Organization: <strong>{studentData.companyName}</strong></span>
            </div>
          </div>
        )}

        {result === 'fail' && (
          <div style={{ marginTop: '24px', padding: '20px', borderRadius: '12px', background: '#fef2f2', border: '1px solid #fca5a5', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#dc2626', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>!</div>
              <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#991b1b', margin: 0 }}>Not Found / Unverified</h4>
            </div>
            <p style={{ fontSize: '13px', color: '#7f1d1d', margin: '0 0 12px 0', lineHeight: '1.5' }}>
              {errorMessage}
            </p>
            <div style={{ fontSize: '11px', color: '#991b1b', borderTop: '1px solid #fee2e2', paddingTop: '8px' }}>
              Organization: <strong>Progrentures Solution Pvt. Ltd.</strong>
            </div>
          </div>
        )}

        {/* Back Link */}
        <div style={{ marginTop: '24px', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '18px' }}>
          <button
            type="button"
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              border: 'none',
              color: '#475569',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            ← Back to Sign In
          </button>
        </div>

      </div>
    </div>
  );
}
