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
      {/* Modern Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo-container">
            <img src={logo} alt="Progrentures" className="sidebar-logo" />
          </div>
          <h2>PROGRENTURES</h2>
          <p>Trainer Panel</p>
        </div>

        <ul className="sidebar-menu">
          <li className="menu-section-header">MAIN MENU</li>
          
          <li 
            className={activeTab === 'overview' ? 'active' : ''}
            onClick={() => setActiveTab('overview')}
          >
            Dashboard Overview
          </li>
          
          <li 
            className={activeTab === 'students' ? 'active' : ''}
            onClick={() => setActiveTab('students')}
          >
            Assigned Students
          </li>
          
          <li 
            className={activeTab === 'analytics' ? 'active' : ''}
            onClick={() => setActiveTab('analytics')}
          >
            Performance Analytics
          </li>

          <li className="menu-section-header">COMMUNICATION</li>
          
          <li 
            className={activeTab === 'notifications' ? 'active' : ''}
            onClick={() => setActiveTab('notifications')}
          >
            Notifications
          </li>

          <li className="menu-section-header">ACCOUNT</li>
          
          <li 
            className={activeTab === 'profile' ? 'active' : ''}
            onClick={() => setActiveTab('profile')}
          >
            Profile Settings
          </li>
        </ul>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <div className="content-header" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '32px',
          borderRadius: '16px',
          marginBottom: '24px',
          boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '700' }}>
                Welcome back, {user?.name}!
              </h1>
              <p style={{ margin: '8px 0 0 0', fontSize: '16px', opacity: 0.95 }}>
                Manage your students and track their progress
              </p>
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '16px 24px',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '4px' }}>
                Your Role
              </div>
              <div style={{ fontSize: '20px', fontWeight: '700', textTransform: 'capitalize' }}>
                {user?.role || 'Trainer'}
              </div>
            </div>
          </div>
        </div>

        {/* Content based on active tab */}
        <div className="dashboard-content">
          {activeTab === 'overview' && (
            <>
              {/* Stats Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px',
                marginBottom: '24px'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '16px',
                  padding: '24px',
                  color: 'white',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
                }}>
                  <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>
                    Assigned Students
                  </div>
                  <div style={{ fontSize: '40px', fontWeight: '700', marginBottom: '8px' }}>
                    {students.length}
                  </div>
                  <div style={{ fontSize: '13px', opacity: 0.8 }}>
                    Total students under your guidance
                  </div>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  borderRadius: '16px',
                  padding: '24px',
                  color: 'white',
                  boxShadow: '0 4px 15px rgba(240, 147, 251, 0.3)'
                }}>
                  <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>
                    Active Sessions
                  </div>
                  <div style={{ fontSize: '40px', fontWeight: '700', marginBottom: '8px' }}>
                    {students.filter(s => s.status === 'Active').length}
                  </div>
                  <div style={{ fontSize: '13px', opacity: 0.8 }}>
                    Currently active training sessions
                  </div>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  borderRadius: '16px',
                  padding: '24px',
                  color: 'white',
                  boxShadow: '0 4px 15px rgba(79, 172, 254, 0.3)'
                }}>
                  <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>
                    Completed Training
                  </div>
                  <div style={{ fontSize: '40px', fontWeight: '700', marginBottom: '8px' }}>
                    {students.filter(s => s.status === 'Completed').length}
                  </div>
                  <div style={{ fontSize: '13px', opacity: 0.8 }}>
                    Students who completed training
                  </div>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                  borderRadius: '16px',
                  padding: '24px',
                  color: 'white',
                  boxShadow: '0 4px 15px rgba(67, 233, 123, 0.3)'
                }}>
                  <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>
                    Pending Reviews
                  </div>
                  <div style={{ fontSize: '40px', fontWeight: '700', marginBottom: '8px' }}>
                    0
                  </div>
                  <div style={{ fontSize: '13px', opacity: 0.8 }}>
                    Assessments awaiting review
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="card" style={{ marginBottom: '24px' }}>
                <h3 style={{ marginBottom: '20px', fontSize: '20px', color: '#1f2937' }}>
                  Quick Actions
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px'
                }}>
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
                <h3 style={{ marginBottom: '20px', fontSize: '20px', color: '#1f2937' }}>
                  Recent Activity
                </h3>
                <div style={{
                  background: '#f9fafb',
                  padding: '40px',
                  borderRadius: '12px',
                  textAlign: 'center'
                }}>
                  <p style={{ color: '#6b7280', fontSize: '16px', margin: 0 }}>
                    No recent activity to display
                  </p>
                  <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '8px' }}>
                    Your recent activities will appear here
                  </p>
                </div>
              </div>
            </>
          )}

          {activeTab === 'students' && (
            <>
              <div className="content-header">
                <h1>Assigned Students</h1>
                <p>Manage and evaluate your assigned students</p>
              </div>

              <div className="card">
                {students.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    background: '#f9fafb',
                    borderRadius: '12px'
                  }}>
                    <h3 style={{ color: '#6b7280', marginBottom: '8px', fontSize: '20px' }}>
                      No Students Assigned Yet
                    </h3>
                    <p style={{ color: '#9ca3af', fontSize: '15px' }}>
                      Students assigned to you will appear here
                    </p>
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
                                  style={{
                                    padding: '6px 12px',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                >
                                  Interviews
                                </button>
                                <button
                                  onClick={() => navigate(`/trainer/student/${student._id}/aptitude`)}
                                  style={{
                                    padding: '6px 12px',
                                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                >
                                  Aptitude
                                </button>
                                <button
                                  onClick={() => navigate(`/trainer/student/${student._id}/assessments`)}
                                  style={{
                                    padding: '6px 12px',
                                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                >
                                  Assessments
                                </button>
                                <button
                                  onClick={() => navigate(`/trainer/student/${student._id}/training`)}
                                  style={{
                                    padding: '6px 12px',
                                    background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
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
              <div className="content-header">
                <h1>Performance Analytics</h1>
                <p>Track student performance and training progress</p>
              </div>

              <div className="card">
                <div style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  background: '#f9fafb',
                  borderRadius: '12px'
                }}>
                  <h3 style={{ color: '#6b7280', marginBottom: '8px', fontSize: '20px' }}>
                    Analytics Dashboard Coming Soon
                  </h3>
                  <p style={{ color: '#9ca3af', fontSize: '15px' }}>
                    Detailed performance metrics and insights will be available here
                  </p>
                </div>
              </div>
            </>
          )}

          {activeTab === 'notifications' && (
            <>
              <div className="content-header">
                <h1>Notifications</h1>
                <p>Stay updated with important alerts and messages</p>
              </div>

              <div className="card">
                <div style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  background: '#f9fafb',
                  borderRadius: '12px'
                }}>
                  <h3 style={{ color: '#6b7280', marginBottom: '8px', fontSize: '20px' }}>
                    No Notifications
                  </h3>
                  <p style={{ color: '#9ca3af', fontSize: '15px' }}>
                    You're all caught up! No new notifications at this time
                  </p>
                </div>
              </div>
            </>
          )}

          {activeTab === 'profile' && (
            <>
              <div className="content-header">
                <h1>Profile Settings</h1>
                <p>Manage your account information and preferences</p>
              </div>

              <div className="card">
                <h3 style={{ marginBottom: '24px', fontSize: '20px', color: '#1f2937' }}>
                  Personal Information
                </h3>
                
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
