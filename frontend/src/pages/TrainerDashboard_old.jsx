import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { trainerAPI } from '../services/api';
import logo from '../assets/logo.png';

function TrainerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const userRole = localStorage.getItem('userRole');
    
    if (!storedUser || userRole !== 'trainer') {
      navigate('/');
      return;
    }
    
    setUser(JSON.parse(storedUser));
    fetchAssignedStudents();
  }, [navigate]);

  const fetchAssignedStudents = async () => {
    try {
      const response = await trainerAPI.getAssignedStudents();
      if (response.data.success) {
        setStudents(response.data.students);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      {/* Modern Professional Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo-container">
            <img src={logo} alt="Progrentures" className="sidebar-logo" />
          </div>
          <h2>PROGRENTURES</h2>
          <p>Trainer Portal</p>
        </div>

        <div className="trainer-profile-mini">
          <div className="profile-avatar">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="profile-info">
            <p className="profile-name">{user?.name}</p>
            <p className="profile-role">Trainer</p>
          </div>
        </div>

        <ul className="sidebar-menu">
          <li className="menu-section-header">MAIN MENU</li>
          
          <li 
            className={activeTab === 'overview' ? 'active' : ''}
            onClick={() => setActiveTab('overview')}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
            </svg>
            Dashboard
          </li>
          
          <li 
            className={activeTab === 'students' ? 'active' : ''}
            onClick={() => setActiveTab('students')}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            My Students
          </li>
          
          <li 
            className={activeTab === 'analytics' ? 'active' : ''}
            onClick={() => setActiveTab('analytics')}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Analytics
          </li>

          <li className="menu-section-header">COMMUNICATION</li>
          
          <li 
            className={activeTab === 'notifications' ? 'active' : ''}
            onClick={() => setActiveTab('notifications')}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Notifications
          </li>

          <li className="menu-section-header">SETTINGS</li>
          
          <li 
            className={activeTab === 'profile' ? 'active' : ''}
            onClick={() => setActiveTab('profile')}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            My Profile
          </li>
        </ul>

        <button className="logout-btn" onClick={handleLogout}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Professional Header */}
        <div className="dashboard-header">
          <div className="header-content">
            <div className="header-text">
              <h1>Trainer Dashboard</h1>
              <p className="welcome-text">Welcome back, <strong>{user?.name}</strong></p>
              <p className="subtitle-text">Manage your students and track their training progress</p>
            </div>
            <div className="header-actions">
              <div className="date-display">
                <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content based on active tab */}
        <div className="dashboard-content">
          {activeTab === 'overview' && (
            <>
              <div className="section-header">
                <h2>Student Performance Overview</h2>
                <p>Monitor your students' training and performance metrics</p>
              </div>

              {/* Professional Stats Cards */}
              <div className="stats-grid stats-grid-large">
                <div className="stat-card modern gradient-blue">
                  <div className="stat-card-content">
                    <div className="stat-icon-large">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div className="stat-details">
                      <h3>Total Students</h3>
                      <p className="stat-number-large">{students.length}</p>
                      <span className="stat-label-large">Assigned to you</span>
                    </div>
                  </div>
                </div>

                <div className="stat-card modern gradient-green">
                  <div className="stat-card-content">
                    <div className="stat-icon-large">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="stat-details">
                      <h3>Active Training</h3>
                      <p className="stat-number-large">{students.filter(s => s.status === 'Active').length}</p>
                      <span className="stat-label-large">Currently enrolled</span>
                    </div>
                  </div>
                </div>

                <div className="stat-card modern gradient-purple">
                  <div className="stat-card-content">
                    <div className="stat-icon-large">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    <div className="stat-details">
                      <h3>Completed</h3>
                      <p className="stat-number-large">{students.filter(s => s.status === 'Completed').length}</p>
                      <span className="stat-label-large">Training finished</span>
                    </div>
                  </div>
                </div>

                <div className="stat-card modern gradient-orange">
                  <div className="stat-card-content">
                    <div className="stat-icon-large">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="stat-details">
                      <h3>Pending Reviews</h3>
                      <p className="stat-number-large">0</p>
                      <span className="stat-label-large">Awaiting feedback</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="quick-actions-card">
                <div className="quick-actions-header">
                  <h3>Quick Actions</h3>
                  <p>Frequently used operations</p>
                </div>
                <div className="quick-actions-grid">
                  <button
                    onClick={() => setActiveTab('students')}
                    style={{
                      padding: '16px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '15px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    View All Students
                  </button>

                  <button
                    style={{
                      padding: '16px',
                      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '15px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      boxShadow: '0 4px 12px rgba(240, 147, 251, 0.3)'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    Add Assessment
                  </button>

                  <button
                    style={{
                      padding: '16px',
                      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '15px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      boxShadow: '0 4px 12px rgba(79, 172, 254, 0.3)'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    Schedule Training
                  </button>

                  <button
                    onClick={() => setActiveTab('analytics')}
                    style={{
                      padding: '16px',
                      background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '15px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      boxShadow: '0 4px 12px rgba(67, 233, 123, 0.3)'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    View Analytics
                  </button>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="card">
                <h3 className="card-title">Recent Activity</h3>
                <div className="empty-state">
                  <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="empty-title">No recent activity to display</p>
                  <p className="empty-subtitle">Your recent activities will appear here</p>
                </div>
              </div>
            </>
          )}

          {activeTab === 'students' && (
            <>
              <div className="page-header-compact">
                <h1>My Students</h1>
              </div>

              <div className="enterprise-card">
                {students.length === 0 ? (
                  <div className="empty-state">
                    <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <p className="empty-title">No Students Assigned Yet</p>
                    <p className="empty-subtitle">Students assigned to you will appear here</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Student ID</th>
                          <th>Student Name</th>
                          <th>Email</th>
                          <th>Program Type</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student, index) => (
                          <tr key={student._id}>
                            <td style={{ fontWeight: '600', color: '#6b7280' }}>
                              {index + 1}
                            </td>
                            <td>
                              <span style={{
                                fontFamily: 'monospace',
                                fontSize: '13px',
                                fontWeight: '600',
                                color: '#3b82f6'
                              }}>
                                {student.internId}
                              </span>
                            </td>
                            <td>
                              <div style={{ fontWeight: '600', color: '#0f172a' }}>
                                {student.name}
                              </div>
                            </td>
                            <td>
                              <div style={{
                                fontSize: '13px',
                                color: '#6b7280'
                              }}>
                                {student.email}
                              </div>
                            </td>
                            <td>
                              <span style={{
                                display: 'inline-block',
                                padding: '4px 12px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: '600',
                                background: student.studentType === 'SMS Program' ? '#fef3c7' : '#dbeafe',
                                color: student.studentType === 'SMS Program' ? '#92400e' : '#1e40af'
                              }}>
                                {student.studentType || 'Internship'}
                              </span>
                            </td>
                            <td>
                              <span className={`status-badge ${
                                student.status === 'Active' ? 'status-active' : 
                                student.status === 'Completed' ? 'status-completed' : 
                                'status-inactive'
                              }`}>
                                {student.status || 'Active'}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                <button
                                  onClick={() => navigate(`/trainer/student/${student._id}/interviews`)}
                                  className="table-action-btn blue"
                                >
                                  Interviews
                                </button>
                                <button
                                  onClick={() => navigate(`/trainer/student/${student._id}/aptitude`)}
                                  className="table-action-btn purple"
                                >
                                  Aptitude
                                </button>
                                <button
                                  onClick={() => navigate(`/trainer/student/${student._id}/assessments`)}
                                  className="table-action-btn green"
                                >
                                  Assessments
                                </button>
                                <button
                                  onClick={() => navigate(`/trainer/student/${student._id}/training`)}
                                  className="table-action-btn orange"
                                >
                                  Training
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'analytics' && (
            <>
              <div className="page-header-compact">
                <h1>Analytics</h1>
              </div>

              <div className="enterprise-card">
                <div className="enterprise-empty-state">
                  <p className="empty-text">Analytics Dashboard Coming Soon</p>
                  <p className="empty-subtext">Detailed performance metrics and insights will be available here</p>
                </div>
              </div>
            </>
          )}

          {activeTab === 'notifications' && (
            <>
              <div className="page-header-compact">
                <h1>Notifications</h1>
              </div>

              <div className="enterprise-card">
                <div className="enterprise-empty-state">
                  <p className="empty-text">No Notifications</p>
                  <p className="empty-subtext">You're all caught up</p>
                </div>
              </div>
            </>
          )}

          {activeTab === 'profile' && (
            <>
              <div className="page-header-compact">
                <h1>My Profile</h1>
              </div>

              <div className="enterprise-card">
                <div className="card-header">
                  <h2>Personal Information</h2>
                </div>
                
                <div style={{
                  background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                  borderRadius: '12px',
                  padding: '24px',
                  marginBottom: '24px'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#075985', marginBottom: '6px' }}>
                        Full Name
                      </label>
                      <div style={{ fontSize: '16px', color: '#0c4a6e', fontWeight: '600' }}>
                        {user?.name}
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#075985', marginBottom: '6px' }}>
                        Email Address
                      </label>
                      <div style={{ fontSize: '15px', color: '#0369a1', fontFamily: 'monospace' }}>
                        {user?.email}
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#075985', marginBottom: '6px' }}>
                        Mobile Number
                      </label>
                      <div style={{ fontSize: '15px', color: '#0c4a6e', fontFamily: 'monospace' }}>
                        {user?.mobile || 'Not available'}
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#075985', marginBottom: '6px' }}>
                        Role
                      </label>
                      <div>
                        <span style={{
                          display: 'inline-block',
                          padding: '6px 14px',
                          borderRadius: '12px',
                          fontSize: '14px',
                          fontWeight: '600',
                          textTransform: 'capitalize',
                          background: '#e0e7ff',
                          color: '#3730a3'
                        }}>
                          {user?.role || 'Trainer'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{
                  background: '#fef3c7',
                  border: '1px solid #fbbf24',
                  borderRadius: '8px',
                  padding: '16px'
                }}>
                  <div>
                    <strong style={{ color: '#92400e', display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                      Need to Update Your Information?
                    </strong>
                    <p style={{ margin: 0, color: '#78350f', fontSize: '13px' }}>
                      Please contact your administrator to update your profile information.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default TrainerDashboard;
