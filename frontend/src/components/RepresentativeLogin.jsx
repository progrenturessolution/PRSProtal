import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { representativeAPI, systemAPI } from '../services/api';
import LoadingSpinner from './LoadingSpinner';

function RepresentativeLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    systemAPI.healthCheck().catch(() => {});
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await representativeAPI.login(formData);
      if (response.data.success) {
        localStorage.clear();
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('userRole', 'representative');
        setSuccess('Login successful! Redirecting...');
        navigate('/representative-dashboard');
      }
    } catch (err) {
      setError(
        err.code === 'ECONNABORTED'
          ? 'Login timed out. Please try again.'
          : err.response?.data?.message || 'Unable to reach backend. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="logo">PROGRENTURES</div>
        <p className="tagline">Representative Portal</p>
      </div>

      <div className="login-right">
        <form className="form-container" onSubmit={handleSubmit}>
          <h2>Representative Login</h2>

          {error && (
            <div style={{
              padding: '12px 16px', marginBottom: '20px', backgroundColor: '#fee2e2',
              border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626',
              fontSize: '14px', fontWeight: 500
            }}>
              Error: {error}
            </div>
          )}

          {success && (
            <div style={{
              padding: '12px 16px', marginBottom: '20px', backgroundColor: '#d1fae5',
              border: '1px solid #a7f3d0', borderRadius: '8px', color: '#059669',
              fontSize: '14px', fontWeight: 500
            }}>
              {success}
            </div>
          )}

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email" name="email" value={formData.email}
              onChange={handleChange} placeholder="Enter your email" required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password" name="password" value={formData.password}
              onChange={handleChange} placeholder="Enter your password" required
            />
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? (
              <LoadingSpinner text="Logging in..." inline size="sm" />
            ) : (
              'Login'
            )}
          </button>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <Link to="/" style={{ color: '#667eea', fontSize: '14px' }}>
              ← Back to main login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RepresentativeLogin;
