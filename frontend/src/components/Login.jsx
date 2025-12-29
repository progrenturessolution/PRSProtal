import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import logo from '../assets/logo.png';

function Login() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('admin');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    internId: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let response;
      
      if (activeTab === 'admin') {
        response = await authAPI.adminLogin({
          email: formData.email,
          password: formData.password
        });
      } else if (activeTab === 'intern') {
        response = await authAPI.internLogin({
          internId: formData.internId,
          password: formData.password
        });
      } else if (activeTab === 'trainer') {
        response = await authAPI.trainerLogin({
          email: formData.email,
          password: formData.password
        });
      }

      if (response?.data.success) {
        // Store token and user info (clear and set atomically)
        const token = response.data.token;
        const user = JSON.stringify(response.data.user);
        const role = activeTab; // 'admin', 'intern', or 'trainer'
        
        localStorage.clear();
        localStorage.setItem('token', token);
        localStorage.setItem('user', user);
        localStorage.setItem('userRole', role);
        
        // Small delay to ensure localStorage is committed
        setTimeout(() => {
          if (activeTab === 'admin') {
            navigate('/admin-dashboard');
          } else if (activeTab === 'intern') {
            navigate('/intern-dashboard');
          } else if (activeTab === 'trainer') {
            navigate('/trainer-dashboard');
          }
        }, 100);
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
        <div className="brand-section">
          <div className="logo-container">
            <img src={logo} alt="Progrentures Logo" className="company-logo" />
          </div>
          <h1 className="company-name">Progrentures</h1>
          <p className="company-subtitle">Internship Management System</p>
        </div>
      </div>

      <div className="login-right">
        <div className="login-card">
          <div className="login-header">
            <h2>Sign In</h2>
            <p>Access your account</p>
          </div>

          <div className="login-tabs">
            <button
              className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              Admin
            </button>
            <button
              className={`tab-btn ${activeTab === 'intern' ? 'active' : ''}`}
              onClick={() => setActiveTab('intern')}
            >
              Intern
            </button>
            <button
              className={`tab-btn ${activeTab === 'trainer' ? 'active' : ''}`}
              onClick={() => setActiveTab('trainer')}
            >
              Trainer / HR
            </button>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && <div className="error-message">{error}</div>}

            {activeTab === 'admin' && (
              <>
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
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
              </>
            )}

            {activeTab === 'intern' && (
              <>
                <div className="form-group">
                  <label>Intern ID</label>
                  <input
                    type="text"
                    name="internId"
                    value={formData.internId}
                    onChange={handleChange}
                    placeholder="Enter your intern ID"
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
              </>
            )}

            {activeTab === 'trainer' && (
              <>
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
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
              </>
            )}

            <button 
              type="submit" 
              className="login-submit-btn"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
