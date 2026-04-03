import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import LoadingSpinner from './LoadingSpinner';

function AdminLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
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
      const response = await authAPI.adminLogin(formData);
      
      if (response.data.success) {
        // Clear any existing data first
        localStorage.clear();
        
        // Store token and user info
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('userRole', 'admin');
        
        // Show success message
        setSuccess('Login successful! Redirecting...');
        
        // Navigate to dashboard after short delay
        setTimeout(() => {
          navigate('/admin-dashboard');
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
        <p className="tagline">Admin Portal</p>
      </div>

      <div className="login-right">
        <form className="form-container" onSubmit={handleSubmit}>
          <h2>Admin Login</h2>

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
              Error: {error}
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
              {success}
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="admin@progrentures.com"
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
            {loading ? (
              <LoadingSpinner text="Logging in..." inline size="sm" />
            ) : (
              'Login'
            )}
          </button>

          <Link to="/" className="back-btn">
            ← Back to Login Options
          </Link>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;
