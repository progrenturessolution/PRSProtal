import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { trainerAPI } from '../services/api';

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
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Progrentures</h2>
          <p className="sidebar-role">Trainer Panel</p>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Dashboard Overview
          </button>
          <button 
            className={`nav-item ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => setActiveTab('students')}
          >
            👥 Assigned Students
          </button>
          <button 
            className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            🔔 Notifications
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <p className="user-name">{user?.name}</p>
            <p className="user-email">{user?.email}</p>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-header">
          <h1>Trainer Dashboard</h1>
          <p>Welcome back, {user?.name}!</p>
        </div>

        <div className="dashboard-content">
          {activeTab === 'overview' && (
            <div className="overview-section">
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Assigned Students</h3>
                  <p className="stat-number">{students.length}</p>
                </div>
                <div className="stat-card">
                  <h3>Active Sessions</h3>
                  <p className="stat-number">0</p>
                </div>
                <div className="stat-card">
                  <h3>Pending Reviews</h3>
                  <p className="stat-number">0</p>
                </div>
              </div>

              <div className="card" style={{ marginTop: '20px' }}>
                <h2>Recent Activity</h2>
                <p>No recent activity to display</p>
              </div>
            </div>
          )}

          {activeTab === 'students' && (
            <div className="students-section">
              <div className="content-header">
                <h2>Assigned Students</h2>
                <p>Manage and evaluate your assigned students</p>
              </div>

              <div className="card">
                {students.length === 0 ? (
                  <p>No students assigned yet</p>
                ) : (
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Student ID</th>
                          <th>Student Name</th>
                          <th>Email</th>
                          <th>Student Type</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student) => (
                          <tr key={student._id}>
                            <td>{student.internId}</td>
                            <td>{student.name}</td>
                            <td>{student.email}</td>
                            <td>{student.studentType || 'Internship'}</td>
                            <td>
                              <div className="action-buttons">
                                <button 
                                  className="btn-small btn-primary"
                                  onClick={() => navigate(`/trainer/student/${student._id}/interviews`)}
                                >
                                  Interviews
                                </button>
                                <button 
                                  className="btn-small btn-secondary"
                                  onClick={() => navigate(`/trainer/student/${student._id}/aptitude`)}
                                >
                                  Aptitude
                                </button>
                                <button 
                                  className="btn-small btn-secondary"
                                  onClick={() => navigate(`/trainer/student/${student._id}/assessments`)}
                                >
                                  Assessments
                                </button>
                                <button 
                                  className="btn-small btn-secondary"
                                  onClick={() => navigate(`/trainer/student/${student._id}/training`)}
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
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="notifications-section">
              <div className="content-header">
                <h2>Notifications</h2>
              </div>
              <div className="card">
                <p>No notifications at this time</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default TrainerDashboard;
