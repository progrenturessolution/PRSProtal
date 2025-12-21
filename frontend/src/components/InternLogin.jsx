import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';

function InternLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    internId: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await authAPI.internLogin(formData);
      
      if (response.data.success) {
        // Clear any existing data first
        localStorage.clear();
        
        // Store token and user info
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('userRole', 'intern');
        
        // Show success message
        setSuccess('Login successful! Redirecting...');
        
        // Navigate to intern dashboard after short delay
        setTimeout(() => {
          navigate('/intern-dashboard');
        }, 1000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="logo">PROGRENTURES</div>
        <p className="tagline">Intern Portal</p>
      </div>

      <div className="login-right">
        <form className="form-container" onSubmit={handleSubmit}>
          <h2>Intern Login</h2>

          {error && (
            <div style={{
              padding: '12px 16px',
              marginBottom: '20px',
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#dc2626',
              fontSize: '14px',
              fontWeight: 500
            }}>
              ❌ {error}
            </div>
          )}

          {success && (
            <div style={{
              padding: '12px 16px',
              marginBottom: '20px',
              backgroundColor: '#d1fae5',
              border: '1px solid #a7f3d0',
              borderRadius: '8px',
              color: '#059669',
              fontSize: '14px',
              fontWeight: 500
            }}>
              ✓ {success}
            </div>
          )}

          <div className="form-group">
            <label>Intern ID</label>
            <input
              type="text"
              name="internId"
              value={formData.internId}
              onChange={handleChange}
              placeholder="PRG20240001"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </div>

          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <Link to="/" className="back-btn">
            ← Back to Login Options
          </Link>
        </form>
      </div>
    </div>
  );
}

export default InternLogin;
