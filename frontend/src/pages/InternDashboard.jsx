import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { taskAPI, internAPI, UPLOADS_BASE } from '../services/api';
import TeamTasks from './TeamTasks';
import logo from '../assets/logo.png';

function InternDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [documents, setDocuments] = useState(null);
  const [error, setError] = useState('');
  const [selectedTeamTask, setSelectedTeamTask] = useState(null);
  const [teamMessage, setTeamMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    const userRole = localStorage.getItem('userRole');

    if (!token || !userData || userRole !== 'intern') {
      navigate('/');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'intern') {
      navigate('/');
      return;
    }

    setUser(parsedUser);
    fetchTasks();
  }, [navigate]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await taskAPI.getInternTasks();
      console.log('Fetched tasks:', response.data.tasks);
      console.log('Team tasks:', response.data.tasks.filter(t => t.isTeamTask));
      console.log('Individual tasks:', response.data.tasks.filter(t => !t.isTeamTask));
      setTasks(response.data.tasks);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProgressUpdate = async (taskId, newProgress) => {
    try {
      await taskAPI.updateTaskProgress(taskId, newProgress);
      setTasks(tasks.map(task => {
        if (task._id === taskId) {
          let newStatus = task.status;
          if (newProgress === 0) newStatus = 'Assigned';
          else if (newProgress > 0 && newProgress < 100) newStatus = 'In Progress';
          else if (newProgress === 100) newStatus = 'Pending Approval';
          
          return { ...task, progress: newProgress, status: newStatus };
        }
        return task;
      }));
    } catch (err) {
      setError('Failed to update progress');
      console.error(err);
      setTimeout(() => setError(''), 4000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Assigned': return '#94a3b8';
      case 'In Progress': return '#3b82f6';
      case 'Pending Approval': return '#f59e0b';
      case 'Completed': return '#10b981';
      default: return '#64748b';
    }
  };

  const formatDeadline = (deadline) => {
    return new Date(deadline).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  const isOverdue = (deadline) => {
    return new Date(deadline) < new Date();
  };

  const getTaskStats = () => {
    const individualTasks = tasks.filter(t => !t.isTeamTask);
    const teamTasks = tasks.filter(t => t.isTeamTask);
    
    return {
      total: tasks.length,
      individual: individualTasks.length,
      team: teamTasks.length,
      assigned: tasks.filter(t => t.status === 'Assigned').length,
      inProgress: tasks.filter(t => t.status === 'In Progress').length,
      pendingApproval: tasks.filter(t => t.status === 'Pending Approval').length,
      completed: tasks.filter(t => t.status === 'Completed').length
    };
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard">
      {/* Mobile Menu Button */}
      <button 
        className="mobile-menu-btn" 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle Menu"
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo-container">
            <img src={logo} alt="Progrentures" className="sidebar-logo" />
          </div>
          <h2>PROGRENTURES</h2>
          <p>Intern Portal</p>
        </div>

        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '5px' }}>Welcome,</div>
          <div style={{ fontSize: '16px', fontWeight: 600 }}>{user.name}</div>
          <div style={{ fontSize: '13px', opacity: 0.7, marginTop: '5px' }}>{user.internId}</div>
        </div>

        <ul className="sidebar-menu">
          <li 
            className={activeSection === 'dashboard' ? 'active' : ''}
            onClick={() => { setActiveSection('dashboard'); setSidebarOpen(false); }}
            style={{ cursor: 'pointer' }}
          >
            Dashboard
          </li>
          <li 
            className={activeSection === 'tasks' ? 'active' : ''}
            onClick={() => { setActiveSection('tasks'); setSidebarOpen(false); }}
            style={{ cursor: 'pointer' }}
          >
            My Tasks
          </li>
          <li 
            className={activeSection === 'team-tasks' ? 'active' : ''}
            onClick={() => { setActiveSection('team-tasks'); setSidebarOpen(false); }}
            style={{ cursor: 'pointer' }}
          >
            Team Tasks
          </li>
          <li
            className={activeSection === 'certificates' ? 'active' : ''}
            onClick={async () => {
              setActiveSection('certificates');
              setSidebarOpen(false);
              // fetch documents when opening certificates
              try {
                const resp = await internAPI.getMyDocuments();
                if (resp.data && resp.data.success) {
                  setDocuments(resp.data.documents || null);
                }
              } catch (err) {
                console.error('Failed to fetch documents:', err);
                setDocuments(null);
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            Certificates
          </li>
        </ul>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main className="main-content">
        {activeSection === 'dashboard' && (
          <>
            <div className="content-header">
              <h1>Intern Dashboard</h1>
              <p>Welcome to your internship portal</p>
            </div>

            {/* Intern Details Card */}
            <div className="card" style={{ marginBottom: '30px' }}>
              <h2 style={{ marginBottom: '20px', fontSize: '20px', color: '#0f172a' }}>
                My Profile
              </h2>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px'
              }}>
                <div style={{ 
                  padding: '15px',
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                  borderRadius: '12px',
                  color: 'white'
                }}>
                  <div style={{ fontSize: '13px', opacity: 0.8, marginBottom: '5px' }}>Name</div>
                  <div style={{ fontSize: '18px', fontWeight: 600 }}>{user.name}</div>
                </div>
                <div style={{ 
                  padding: '15px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  borderRadius: '12px',
                  color: 'white'
                }}>
                  <div style={{ fontSize: '13px', opacity: 0.8, marginBottom: '5px' }}>🆔 Intern ID</div>
                  <div style={{ fontSize: '18px', fontWeight: 600 }}>{user.internId}</div>
                </div>
                <div style={{ 
                  padding: '15px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  borderRadius: '12px',
                  color: 'white'
                }}>
                  <div style={{ fontSize: '13px', opacity: 0.8, marginBottom: '5px' }}>Email</div>
                  <div style={{ fontSize: '18px', fontWeight: 600, wordBreak: 'break-all' }}>{user.email}</div>
                </div>
                <div style={{ 
                  padding: '15px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  borderRadius: '12px',
                  color: 'white'
                }}>
                  <div style={{ fontSize: '13px', opacity: 0.8, marginBottom: '5px' }}>Status</div>
                  <div style={{ fontSize: '18px', fontWeight: 600 }}>{user.status || 'Active'}</div>
                </div>
              </div>
            </div>

            {/* Task Statistics */}
            <div className="content-header">
              <h2 style={{ fontSize: '20px' }}>Task Overview</h2>
            </div>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon"></div>
                <div className="stat-value">{getTaskStats().total}</div>
                <div className="stat-label">Total Tasks</div>
              </div>
              <div className="stat-card" style={{ borderLeft: '4px solid #94a3b8' }}>
                <div className="stat-icon"></div>
                <div className="stat-value">{getTaskStats().assigned}</div>
                <div className="stat-label">Assigned</div>
              </div>
              <div className="stat-card" style={{ borderLeft: '4px solid #3b82f6' }}>
                <div className="stat-icon"></div>
                <div className="stat-value">{getTaskStats().inProgress}</div>
                <div className="stat-label">In Progress</div>
              </div>
              <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                <div className="stat-icon"></div>
                <div className="stat-value">{getTaskStats().pendingApproval}</div>
                <div className="stat-label">Pending Approval</div>
              </div>
              <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
                <div className="stat-icon"></div>
                <div className="stat-value">{getTaskStats().completed}</div>
                <div className="stat-label">Completed</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card" style={{ marginTop: '30px' }}>
              <h3 style={{ marginBottom: '15px', color: '#0f172a' }}>Quick Actions</h3>
              <button 
                onClick={() => setActiveSection('tasks')}
                className="btn-primary"
                style={{ width: '100%', maxWidth: '300px' }}
              >
                View My Tasks
              </button>
            </div>
          </>
        )}
        {activeSection === 'certificates' && (
          <>
            <div className="content-header">
              <h1>Certificates / Documents</h1>
              <p>All documents uploaded by the admin will appear here.</p>
            </div>

            <div className="card">
              <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600', color: '#0f172a' }}>My Documents</h3>
              {!documents ? (
                <p style={{ color: '#6b7280', fontSize: '14px' }}>No documents available yet.</p>
              ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                  {/* Offer Letter */}
                  {documents.offerLetter && documents.offerLetter.filename && (
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px',
                      background: '#f9fafb',
                      borderRadius: '10px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <strong style={{ color: '#374151', fontSize: '15px' }}>📄 Offer Letter</strong>
                        <span style={{ color: '#6b7280', fontSize: '13px' }}>Your official offer letter</span>
                      </div>
                      <a 
                        href={UPLOADS_BASE + '/uploads/students/' + documents.offerLetter.filename} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{
                          padding: '8px 16px',
                          background: '#10b981',
                          color: 'white',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          fontSize: '14px',
                          fontWeight: '500',
                          transition: 'all 0.2s'
                        }}
                      >View PDF</a>
                    </div>
                  )}

                  {/* Welcome Letter */}
                  {documents.welcomeLetter && documents.welcomeLetter.filename && (
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px',
                      background: '#f9fafb',
                      borderRadius: '10px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <strong style={{ color: '#374151', fontSize: '15px' }}>👋 Welcome Letter</strong>
                        <span style={{ color: '#6b7280', fontSize: '13px' }}>Welcome to the organization</span>
                      </div>
                      <a 
                        href={UPLOADS_BASE + '/uploads/students/' + documents.welcomeLetter.filename} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{
                          padding: '8px 16px',
                          background: '#10b981',
                          color: 'white',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          fontSize: '14px',
                          fontWeight: '500',
                          transition: 'all 0.2s'
                        }}
                      >View PDF</a>
                    </div>
                  )}

                  {/* Payment Receipt */}
                  {documents.paymentReceipt && documents.paymentReceipt.filename && (
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px',
                      background: '#f9fafb',
                      borderRadius: '10px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <strong style={{ color: '#374151', fontSize: '15px' }}>💳 Payment Receipt</strong>
                        <span style={{ color: '#6b7280', fontSize: '13px' }}>Payment confirmation document</span>
                      </div>
                      <a 
                        href={UPLOADS_BASE + '/uploads/students/' + documents.paymentReceipt.filename} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{
                          padding: '8px 16px',
                          background: '#10b981',
                          color: 'white',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          fontSize: '14px',
                          fontWeight: '500',
                          transition: 'all 0.2s'
                        }}
                      >View PDF</a>
                    </div>
                  )}

                  {/* Completion Certificate */}
                  {documents.completionCertificate && documents.completionCertificate.filename && (
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px',
                      background: '#f9fafb',
                      borderRadius: '10px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <strong style={{ color: '#374151', fontSize: '15px' }}>🎓 Completion Certificate</strong>
                        <span style={{ color: '#6b7280', fontSize: '13px' }}>Program completion certificate</span>
                      </div>
                      <a 
                        href={UPLOADS_BASE + '/uploads/students/' + documents.completionCertificate.filename} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{
                          padding: '8px 16px',
                          background: '#10b981',
                          color: 'white',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          fontSize: '14px',
                          fontWeight: '500',
                          transition: 'all 0.2s'
                        }}
                      >View PDF</a>
                    </div>
                  )}

                  {/* Experience Letter */}
                  {documents.experienceLetter && documents.experienceLetter.filename && (
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px',
                      background: '#f9fafb',
                      borderRadius: '10px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <strong style={{ color: '#374151', fontSize: '15px' }}>📜 Experience Letter</strong>
                        <span style={{ color: '#6b7280', fontSize: '13px' }}>Work experience certificate</span>
                      </div>
                      <a 
                        href={UPLOADS_BASE + '/uploads/students/' + documents.experienceLetter.filename} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{
                          padding: '8px 16px',
                          background: '#10b981',
                          color: 'white',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          fontSize: '14px',
                          fontWeight: '500',
                          transition: 'all 0.2s'
                        }}
                      >View PDF</a>
                    </div>
                  )}

                  {/* Other Certificates */}
                  {documents.otherCertificates && documents.otherCertificates.length > 0 && (
                    <div style={{ 
                      padding: '16px',
                      background: '#f9fafb',
                      borderRadius: '10px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ marginBottom: '12px' }}>
                        <strong style={{ color: '#374151', fontSize: '15px' }}>📎 Other Certificates</strong>
                        <span style={{ color: '#6b7280', fontSize: '13px', marginLeft: '8px' }}>({documents.otherCertificates.length})</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {documents.otherCertificates.map((cert, idx) => (
                          <a 
                            key={idx}
                            href={UPLOADS_BASE + '/uploads/students/' + cert.filename} 
                            target="_blank" 
                            rel="noreferrer"
                            style={{
                              padding: '12px 14px',
                              background: 'white',
                              borderRadius: '6px',
                              textDecoration: 'none',
                              color: '#4f46e5',
                              fontSize: '14px',
                              border: '1px solid #e5e7eb',
                              transition: 'all 0.2s',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                          >
                            <span>📄</span>
                            <span>{cert.name || cert.filename}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No certificates message */}
                  {!documents.offerLetter?.filename && 
                   !documents.welcomeLetter?.filename && 
                   !documents.paymentReceipt?.filename && 
                   !documents.completionCertificate?.filename && 
                   !documents.experienceLetter?.filename && 
                   (!documents.otherCertificates || documents.otherCertificates.length === 0) && (
                    <div style={{ 
                      padding: '32px',
                      textAlign: 'center',
                      color: '#6b7280',
                      background: '#f9fafb',
                      borderRadius: '10px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <p style={{ margin: 0, fontSize: '14px' }}>No certificates have been uploaded yet.</p>
                      <p style={{ margin: '8px 0 0 0', fontSize: '13px' }}>Your certificates will appear here once uploaded by admin.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
        
        {/* Team Tasks Section */}
        {activeSection === 'team-tasks' && (
          <>
            <div className="content-header">
              <h1>Team Tasks</h1>
              <p>Collaborate with your team members on assigned tasks</p>
            </div>
            <TeamTasks 
              user={user}
              tasks={tasks}
              loading={loading}
              error={error}
              onProgressUpdate={handleProgressUpdate}
            />
          </>
        )}
        
        {activeSection === 'tasks' && (
          <>
            <div className="content-header">
              <h1>My Tasks (Individual)</h1>
              <p>View and update your individual assigned tasks</p>
            </div>

            {error && (
              <div style={{
                padding: '12px',
                marginBottom: '20px',
                backgroundColor: '#fee2e2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#dc2626',
                fontSize: '14px',
                fontWeight: 500
              }}>
                {error}
              </div>
            )}

            {loading ? (
              <div className="card">
                <p>Loading tasks...</p>
              </div>
            ) : tasks.filter(t => !t.isTeamTask).length === 0 ? (
              <div className="card">
                <div className="empty-state">
                  <p>No individual tasks assigned yet. Your tasks will appear here once assigned by admin.</p>
                </div>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="desktop-only">
                  <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Task Title</th>
                          <th>Description</th>
                          <th>Deadline</th>
                          <th>Progress</th>
                          <th>Status</th>
                          <th>Document</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tasks.filter(t => !t.isTeamTask).map((task) => (
                          <>
                            <tr key={task._id}>
                              <td style={{ fontWeight: 600, color: '#0f172a' }}>
                                {task.title}
                                {task.hasUnreadFeedback && (
                                  <span style={{
                                    marginLeft: '8px',
                                    display: 'inline-block',
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: '#ef4444',
                                    animation: 'pulse 2s infinite'
                                  }}></span>
                                )}
                              </td>
                              <td style={{ maxWidth: '300px' }}>
                                {task.description.length > 80 
                                  ? task.description.substring(0, 80) + '...' 
                                  : task.description}
                              </td>
                              <td style={{ 
                                color: isOverdue(task.deadline) && task.status !== 'Completed' ? '#dc2626' : '#0f172a',
                                fontWeight: isOverdue(task.deadline) && task.status !== 'Completed' ? 600 : 400
                              }}>
                                {isOverdue(task.deadline) && task.status !== 'Completed' && ''}
                                {formatDeadline(task.deadline)}
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <div className="progress-bar-container" style={{ flex: 1, minWidth: '100px' }}>
                                    <div 
                                      className="progress-bar-fill"
                                      style={{ width: `${task.progress}%` }}
                                    ></div>
                                  </div>
                                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#3b82f6', minWidth: '40px' }}>
                                    {task.progress}%
                                  </span>
                                </div>
                              </td>
                              <td>
                                <span 
                                  className="status-badge"
                                  style={{
                                    backgroundColor: `${getStatusColor(task.status)}20`,
                                    color: getStatusColor(task.status)
                                  }}
                                >
                                  {task.status}
                                </span>
                              </td>
                              <td>
                                {task.taskDocument ? (
                                  <a 
                                    href={`http://localhost:5000/${task.taskDocument.filepath.replace(/\\/g, '/')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      color: '#3b82f6',
                                      textDecoration: 'none',
                                      fontWeight: 600,
                                      fontSize: '13px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px'
                                    }}
                                  >
                                    📄 View PDF
                                  </a>
                                ) : (
                                  <span style={{ color: '#94a3b8', fontSize: '13px' }}>No document</span>
                                )}
                              </td>
                              <td>
                                {task.status !== 'Completed' ? (
                                  <select
                                    value={task.progress}
                                    onChange={(e) => handleProgressUpdate(task._id, parseInt(e.target.value))}
                                    className="progress-select"
                                    disabled={task.status === 'Pending Approval'}
                                    style={{ 
                                      padding: '8px 12px',
                                      fontSize: '13px',
                                      minWidth: '180px'
                                    }}
                                  >
                                    <option value={0}>0% - Not Started</option>
                                    <option value={25}>25% - Started</option>
                                    <option value={50}>50% - Half Done</option>
                                    <option value={75}>75% - Almost Done</option>
                                    <option value={100}>100% - Submit</option>
                                  </select>
                                ) : (
                                  <span style={{ color: '#10b981', fontWeight: 600, fontSize: '13px' }}>
                                    Approved
                                  </span>
                                )}
                              </td>
                            </tr>
                            {/* Feedback Row for Desktop View */}
                            {task.hasUnreadFeedback && task.comments && task.comments.length > 0 && (
                              <tr key={`${task._id}-feedback`}>
                                <td colSpan="6" style={{ padding: '0', border: 'none' }}>
                                  <div style={{
                                    margin: '0 16px 16px 16px',
                                    padding: '12px',
                                    background: '#fee2e2',
                                    borderLeft: '4px solid #ef4444',
                                    borderRadius: '8px'
                                  }}>
                                    <div style={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      gap: '8px', 
                                      marginBottom: '8px',
                                      color: '#991b1b',
                                      fontWeight: 600,
                                      fontSize: '14px'
                                    }}>
                                      <span>Admin Feedback - Changes Requested</span>
                                    </div>
                                    {task.comments
                                      .filter(comment => comment.sentBy === 'admin')
                                      .map((comment, index) => (
                                        <div key={index} style={{
                                          marginTop: index > 0 ? '10px' : '0',
                                          padding: '10px',
                                          background: 'white',
                                          borderRadius: '6px'
                                        }}>
                                          <div style={{ fontSize: '13px', color: '#dc2626', marginBottom: '4px' }}>
                                            {comment.message}
                                          </div>
                                          <div style={{ fontSize: '11px', color: '#991b1b', opacity: 0.7 }}>
                                            {new Date(comment.sentAt).toLocaleString()}
                                          </div>
                                        </div>
                                      ))
                                    }
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile Card View */}
                <div className="mobile-only">
                  <div className="tasks-grid">
                    {tasks.filter(t => !t.isTeamTask).map((task) => (
                      <div key={task._id} className="task-card">
                        <div className="task-header">
                          <h3>{task.title}</h3>
                          <span 
                            className="task-status-badge"
                            style={{
                              backgroundColor: `${getStatusColor(task.status)}20`,
                              color: getStatusColor(task.status)
                            }}
                          >
                            {task.status}
                          </span>
                        </div>

                        <p className="task-description">{task.description}</p>

                        {/* Admin Feedback Section */}
                        {task.hasUnreadFeedback && task.comments && task.comments.length > 0 && (
                          <div style={{
                            marginTop: '15px',
                            padding: '12px',
                            background: '#fee2e2',
                            borderLeft: '4px solid #ef4444',
                            borderRadius: '8px'
                          }}>
                                    <div style={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      gap: '8px', 
                                      marginBottom: '8px',
                                      color: '#991b1b',
                                      fontWeight: 600,
                                      fontSize: '14px'
                                    }}>
                                      <span>Admin Feedback - Changes Requested</span>
                                    </div>
                            {task.comments
                              .filter(comment => comment.sentBy === 'admin')
                              .map((comment, index) => (
                                <div key={index} style={{
                                  marginTop: index > 0 ? '10px' : '0',
                                  padding: '10px',
                                  background: 'white',
                                  borderRadius: '6px'
                                }}>
                                  <div style={{ fontSize: '13px', color: '#dc2626', marginBottom: '4px' }}>
                                    {comment.message}
                                  </div>
                                  <div style={{ fontSize: '11px', color: '#991b1b', opacity: 0.7 }}>
                                    {new Date(comment.sentAt).toLocaleString()}
                                  </div>
                                </div>
                              ))
                            }
                          </div>
                        )}

                        <div className="task-deadline">
                          <span style={{ opacity: 0.7 }}>Deadline:</span>
                          <span style={{ 
                            fontWeight: 600,
                            color: isOverdue(task.deadline) && task.status !== 'Completed' ? '#dc2626' : '#0f172a'
                          }}>
                            {isOverdue(task.deadline) && task.status !== 'Completed' && ''}
                            {formatDeadline(task.deadline)}
                          </span>
                        </div>

                        <div className="task-progress">
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 600 }}>Progress</span>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#3b82f6' }}>
                              {task.progress}%
                            </span>
                          </div>
                          <div className="progress-bar-container">
                            <div 
                              className="progress-bar-fill"
                              style={{ width: `${task.progress}%` }}
                            ></div>
                          </div>
                        </div>

                        {task.taskDocument && (
                          <div style={{
                            marginTop: '15px',
                            padding: '12px',
                            background: '#dbeafe',
                            borderRadius: '8px'
                          }}>
                            <a 
                              href={`http://localhost:5000/${task.taskDocument.filepath.replace(/\\/g, '/')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: '#1e40af',
                                textDecoration: 'none',
                                fontWeight: 600,
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}
                            >
                              📄 View Task Document (PDF)
                            </a>
                          </div>
                        )}

                        {task.status !== 'Completed' && (
                          <div className="task-actions">
                            <label style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', display: 'block' }}>
                              Update Progress:
                            </label>
                            <select
                              value={task.progress}
                              onChange={(e) => handleProgressUpdate(task._id, parseInt(e.target.value))}
                              className="progress-select"
                              disabled={task.status === 'Pending Approval'}
                            >
                              <option value={0}>0% - Not Started</option>
                              <option value={25}>25% - Started</option>
                              <option value={50}>50% - Half Done</option>
                              <option value={75}>75% - Almost Done</option>
                              <option value={100}>100% - Submit for Approval</option>
                            </select>
                            {task.status === 'Pending Approval' && (
                              <div style={{ 
                                marginTop: '10px', 
                                padding: '10px', 
                                background: '#fef3c7', 
                                borderRadius: '8px',
                                fontSize: '13px',
                                color: '#92400e'
                              }}>
                                Waiting for admin approval
                              </div>
                            )}
                          </div>
                        )}

                        {task.status === 'Completed' && (
                          <div style={{
                            marginTop: '15px',
                            padding: '12px',
                            background: '#d1fae5',
                            borderRadius: '8px',
                            fontSize: '14px',
                            color: '#065f46',
                            fontWeight: 600,
                            textAlign: 'center'
                          }}>
                            Task Completed & Approved
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default InternDashboard;

