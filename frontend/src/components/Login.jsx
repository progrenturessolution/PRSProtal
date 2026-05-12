import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, representativeAPI } from '../services/api';
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

  const getErrorMessage = (err) =>
    err.code === 'ECONNABORTED'
      ? 'Login request timed out. Please try again.'
      :
    err.response?.data?.message ||
    (err.response
      ? 'Login failed. Please try again.'
      : 'Unable to reach the backend. Check the API URL and deployment status.');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError('');

    try {
      let response;
      
      if (activeTab === 'admin') {
        response = await authAPI.adminLogin({
          email: formData.email.trim(),
          password: formData.password
        });
      } else if (activeTab === 'intern') {
        response = await authAPI.internLogin({
          internId: formData.internId,
          password: formData.password
        });
      } else if (activeTab === 'trainer') {
        response = await authAPI.trainerLogin({
          email: formData.email.trim(),
          password: formData.password
        });
      } else if (activeTab === 'representative') {
        response = await representativeAPI.login({
          email: formData.email.trim(),
          password: formData.password
        });
      }

      if (response?.data.success) {
        // Store only auth keys to avoid wiping unrelated app state.
        const token = response.data.token;
        const user = JSON.stringify(response.data.user);
        const dashboardRouteMap = {
          admin: '/admin-dashboard',
          intern: '/intern-dashboard',
          trainer: '/trainer-dashboard',
          representative: '/representative-dashboard'
        };

        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        localStorage.setItem('token', token);
        localStorage.setItem('user', user);
        localStorage.setItem('userRole', activeTab);

        navigate(dashboardRouteMap[activeTab] || '/', { replace: true });
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="login-left-content">
          <div className="login-brand-row">
            <div className="login-brand-icon" aria-hidden="true">
              <img src={logo} alt="Progrentures Logo" className="login-brand-logo" />
            </div>
            <div className="login-brand-copy">
              <h2>Progrentures Solution Pvt. Ltd.</h2>
              <p>Enterprise Platform</p>
            </div>
          </div>

          <div className="login-hero-copy">
            <h1>Progrentures PRS Portal</h1>
            <p>
              A modern student development platform designed to streamline internships,
              training programs, assessments, certifications, and placement preparation
              through one integrated system.
            </p>
          </div>

          <div className="login-feature-list">
            <div className="login-feature-item">Internship &amp; Training Program Management</div>
            <div className="login-feature-item">Assignments, Assessments &amp; Activity Tracking</div>
            <div className="login-feature-item">Skill Development &amp; Performance Monitoring</div>
            <div className="login-feature-item">Certificates, Reports &amp; Learning Resources Access</div>
            <div className="login-feature-item">Interview Preparation &amp; Placement Support</div>
          </div>

          <div className="login-footer-copy">
            <p>
              Created to provide a structured, practical, and career-focused learning
              experience for students and institutions.
            </p>
            <div className="login-footer-brand">Progrentures PRS Portal</div>
            <div className="login-footer-rights">c 2026 all rights reserved</div>
          </div>
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
              title="Admin Access"
            >
              <svg className="tab-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              <span>Admin</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'intern' ? 'active' : ''}`}
              onClick={() => setActiveTab('intern')}
              title="Aspirants Access"
            >
              <svg className="tab-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              <span>Aspirants</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'trainer' ? 'active' : ''}`}
              onClick={() => setActiveTab('trainer')}
              title="Employee Access"
            >
              <svg className="tab-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
              </svg>
              <span>Employee</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'representative' ? 'active' : ''}`}
              onClick={() => setActiveTab('representative')}
              title="PIGR Access"
            >
              <svg className="tab-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
              </svg>
              <span>PIGR</span>
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
                  <label>Aspirant ID</label>
                  <input
                    type="text"
                    name="internId"
                    value={formData.internId}
                    onChange={handleChange}
                    placeholder="Enter your aspirant ID"
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

            {activeTab === 'representative' && (
              <>
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="representative@example.com"
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
              {loading ? (
                <>
                  <svg className="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <svg className="arrow-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
