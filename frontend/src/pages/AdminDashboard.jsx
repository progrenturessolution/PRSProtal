import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AddIntern from './AddIntern';
import ViewInterns from './ViewInterns';
import CreateTask from './CreateTask';
import ManageTasks from './ManageTasks';
import PendingApprovals from './PendingApprovals';
import CompletedTasks from './CompletedTasks';
import { adminAPI, taskAPI } from '../services/api';
import logo from '../assets/logo.png';

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalInterns: 0,
    activeInterns: 0,
    completedInterns: 0,
    thisMonthInterns: 0
  });
  const [taskStats, setTaskStats] = useState({
    totalTasks: 0,
    assignedTasks: 0,
    inProgressTasks: 0,
    pendingApprovalTasks: 0,
    completedTasks: 0
  });

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    const userRole = localStorage.getItem('userRole');

    if (!token || !userData || userRole !== 'admin') {
      navigate('/admin-login');
      return;
    }

    setUser(JSON.parse(userData));
  }, [navigate]);

  // Fetch stats on mount and when activeMenu changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching stats...');
        const statsResponse = await adminAPI.getStats();
        console.log('Stats response:', statsResponse.data);
        if (statsResponse.data.success) {
          setStats(statsResponse.data.stats);
        }

        console.log('Fetching task stats...');
        const taskStatsResponse = await taskAPI.getTaskStats();
        console.log('Task stats response:', taskStatsResponse.data);
        if (taskStatsResponse.data.success) {
          setTaskStats(taskStatsResponse.data.stats);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user, activeMenu]);

  const fetchStats = async () => {
    try {
      const response = await adminAPI.getStats();
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchTaskStats = async () => {
    try {
      const response = await taskAPI.getTaskStats();
      if (response.data.success) {
        setTaskStats(response.data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch task stats:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return (
          <>
            <div className="content-header">
              <h1>Admin Dashboard</h1>
              <p>Welcome back, {user?.email}</p>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <h3>Total Interns</h3>
                  <p>{stats.totalInterns}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✓</div>
                <div className="stat-info">
                  <h3>Active Interns</h3>
                  <p>{stats.activeInterns}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🎓</div>
                <div className="stat-info">
                  <h3>Completed</h3>
                  <p>{stats.completedInterns}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📅</div>
                <div className="stat-info">
                  <h3>This Month</h3>
                  <p>{stats.thisMonthInterns}</p>
                </div>
              </div>
            </div>

            <div className="content-header" style={{ marginTop: '30px' }}>
              <h2>Task Statistics</h2>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📋</div>
                <div className="stat-info">
                  <h3>Total Tasks</h3>
                  <p>{taskStats.totalTasks}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🔔</div>
                <div className="stat-info">
                  <h3>Assigned</h3>
                  <p>{taskStats.assignedTasks}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⚡</div>
                <div className="stat-info">
                  <h3>In Progress</h3>
                  <p>{taskStats.inProgressTasks}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⏳</div>
                <div className="stat-info">
                  <h3>Pending Approval</h3>
                  <p>{taskStats.pendingApprovalTasks}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-info">
                  <h3>Completed</h3>
                  <p>{taskStats.completedTasks}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <h3>Quick Actions</h3>
              <p className="mt-20">
                Use the sidebar to navigate through different sections.
              </p>
            </div>
          </>
        );
      
      case 'add-intern':
        return <AddIntern key="add-intern" onInternAdded={fetchStats} />;
      
      case 'view-interns':
        return <ViewInterns key="view-interns" onInternDeleted={fetchStats} />;
      
      case 'create-task':
        return <CreateTask key="create-task" onTaskCreated={fetchTaskStats} />;
      
      case 'manage-tasks':
        return <ManageTasks key="manage-tasks" onTaskApproved={fetchTaskStats} />;
      
      case 'pending-approvals':
        return <PendingApprovals key="pending-approvals" onTaskApproved={fetchTaskStats} />;
      
      case 'completed-tasks':
        return <CompletedTasks key="completed-tasks" />;
      
      default:
        return (
          <div className="content-header">
            <h1>Coming Soon</h1>
            <p>This feature is under development</p>
          </div>
        );
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo-container">
            <img src={logo} alt="Progrentures" className="sidebar-logo" />
          </div>
          <h2>PROGRENTURES</h2>
          <p>Admin Panel</p>
        </div>

        <ul className="sidebar-menu">
          <li 
            className={activeMenu === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveMenu('dashboard')}
          >
            📊 Dashboard
          </li>
          <li 
            className={activeMenu === 'add-intern' ? 'active' : ''}
            onClick={() => setActiveMenu('add-intern')}
          >
            ➕ Add Intern
          </li>
          <li 
            className={activeMenu === 'view-interns' ? 'active' : ''}
            onClick={() => setActiveMenu('view-interns')}
          >
            � View Interns
          </li>
          <li 
            className={activeMenu === 'create-task' ? 'active' : ''}
            onClick={() => setActiveMenu('create-task')}
          >
            ➕ Create Task
          </li>
          <li 
            className={activeMenu === 'manage-tasks' ? 'active' : ''}
            onClick={() => setActiveMenu('manage-tasks')}
          >
            📋 Manage Tasks
          </li>
          <li 
            className={activeMenu === 'pending-approvals' ? 'active' : ''}
            onClick={() => setActiveMenu('pending-approvals')}
          >
            ⏳ Pending Approvals
            {taskStats.pendingApprovalTasks > 0 && (
              <span style={{
                marginLeft: '8px',
                background: '#f59e0b',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 700
              }}>
                {taskStats.pendingApprovalTasks}
              </span>
            )}
          </li>
          <li 
            className={activeMenu === 'completed-tasks' ? 'active' : ''}
            onClick={() => setActiveMenu('completed-tasks')}
          >
            ✓ Completed Tasks
          </li>
          <li className="disabled">
            ➕ Add SMS (Coming Soon)
          </li>
        </ul>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}

export default AdminDashboard;
