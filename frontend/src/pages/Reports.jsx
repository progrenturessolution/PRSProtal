import { useState, useEffect } from 'react';
import { adminAPI, taskAPI } from '../services/api';

function Reports() {
  const [reportType, setReportType] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalInterns: 0,
    activeInterns: 0,
    completedInterns: 0,
    internshipStudents: 0,
    smsStudents: 0
  });
  const [taskStats, setTaskStats] = useState({
    totalTasks: 0,
    assignedTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0
  });
  const [students, setStudents] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchReportsData();
  }, []);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      
      // Fetch student stats
      const statsResponse = await adminAPI.getStats();
      if (statsResponse.data.success) {
        setStats(statsResponse.data.stats);
      }

      // Fetch task stats
      const taskStatsResponse = await taskAPI.getTaskStats();
      if (taskStatsResponse.data.success) {
        setTaskStats(taskStatsResponse.data.stats);
      }

      // Fetch all students
      const studentsResponse = await adminAPI.getAllInterns();
      if (studentsResponse.data.success) {
        setStudents(studentsResponse.data.interns);
      }
    } catch (error) {
      console.error('Failed to fetch reports data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format) => {
    alert(`Export functionality for ${format} format will be implemented soon!`);
  };

  const renderOverviewReport = () => (
    <>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"></div>
          <div className="stat-info">
            <h3>Total Students</h3>
            <p>{stats.totalInterns}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"></div>
          <div className="stat-info">
            <h3>Active</h3>
            <p>{stats.activeInterns}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"></div>
          <div className="stat-info">
            <h3>Completed</h3>
            <p>{stats.completedInterns}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"></div>
          <div className="stat-info">
            <h3>This Month</h3>
            <p>{stats.thisMonthInterns}</p>
          </div>
        </div>
      </div>

      <div className="stats-grid" style={{ marginTop: '20px' }}>
        <div className="stat-card">
          <div className="stat-icon"></div>
          <div className="stat-info">
            <h3>Internship Students</h3>
            <p>{students.filter(s => s.studentType === 'Internship').length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"></div>
          <div className="stat-info">
            <h3>SMS Program</h3>
            <p>{students.filter(s => s.studentType === 'SMS Program').length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"></div>
          <div className="stat-info">
            <h3>Total Tasks</h3>
            <p>{taskStats.totalTasks}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"></div>
          <div className="stat-info">
            <h3>Completed Tasks</h3>
            <p>{taskStats.completedTasks}</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <h3>Task Progress Overview</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '20px' }}>
          <div style={{ padding: '15px', background: '#eff6ff', borderRadius: '8px' }}>
            <p style={{ color: '#1e40af', fontWeight: 600, fontSize: '14px' }}>Assigned</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: '#1e40af', marginTop: '5px' }}>
              {taskStats.assignedTasks}
            </p>
          </div>
          <div style={{ padding: '15px', background: '#fef3c7', borderRadius: '8px' }}>
            <p style={{ color: '#92400e', fontWeight: 600, fontSize: '14px' }}>In Progress</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: '#92400e', marginTop: '5px' }}>
              {taskStats.inProgressTasks}
            </p>
          </div>
          <div style={{ padding: '15px', background: '#d1fae5', borderRadius: '8px' }}>
            <p style={{ color: '#065f46', fontWeight: 600, fontSize: '14px' }}>Completed</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: '#065f46', marginTop: '5px' }}>
              {taskStats.completedTasks}
            </p>
          </div>
        </div>
      </div>
    </>
  );

  const renderStudentReport = () => (
    <div className="card">
      <h3>Student Performance Report</h3>
      <div style={{ overflowX: 'auto', marginTop: '20px' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Type</th>
              <th>Email</th>
              <th>Status</th>
              <th>Join Date</th>
            </tr>
          </thead>
          <tbody>
            {students.slice(0, 20).map((student) => (
              <tr key={student._id}>
                <td>{student.internId}</td>
                <td>{student.name}</td>
                <td>{student.studentType}</td>
                <td>{student.email}</td>
                <td>
                  <span
                    className={`status-badge ${
                      student.status === 'Active'
                        ? 'status-active'
                        : student.status === 'Completed'
                        ? 'status-completed'
                        : 'status-inactive'
                    }`}
                  >
                    {student.status}
                  </span>
                </td>
                <td>
                  {student.joiningDate
                    ? new Date(student.joiningDate).toLocaleDateString()
                    : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {students.length > 20 && (
          <p style={{ textAlign: 'center', marginTop: '15px', color: '#6b7280' }}>
            Showing first 20 of {students.length} students
          </p>
        )}
      </div>
    </div>
  );

  const renderTaskReport = () => (
    <div className="card">
      <h3>Task Completion Report</h3>
      <div style={{ marginTop: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          <div style={{ padding: '20px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Total Tasks Created</p>
            <p style={{ fontSize: '32px', fontWeight: 700, color: '#111827' }}>{taskStats.totalTasks}</p>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '5px' }}>All time</p>
          </div>
          
          <div style={{ padding: '20px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
            <p style={{ fontSize: '14px', color: '#1e40af', marginBottom: '8px' }}>Tasks Assigned</p>
            <p style={{ fontSize: '32px', fontWeight: 700, color: '#1e3a8a' }}>{taskStats.assignedTasks}</p>
            <p style={{ fontSize: '12px', color: '#60a5fa', marginTop: '5px' }}>Waiting to start</p>
          </div>
          
          <div style={{ padding: '20px', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fde68a' }}>
            <p style={{ fontSize: '14px', color: '#92400e', marginBottom: '8px' }}>In Progress</p>
            <p style={{ fontSize: '32px', fontWeight: 700, color: '#78350f' }}>{taskStats.inProgressTasks}</p>
            <p style={{ fontSize: '12px', color: '#f59e0b', marginTop: '5px' }}>Currently working</p>
          </div>
          
          <div style={{ padding: '20px', background: '#d1fae5', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
            <p style={{ fontSize: '14px', color: '#065f46', marginBottom: '8px' }}>Completed</p>
            <p style={{ fontSize: '32px', fontWeight: 700, color: '#064e3b' }}>{taskStats.completedTasks}</p>
            <p style={{ fontSize: '12px', color: '#10b981', marginTop: '5px' }}>
              {taskStats.totalTasks > 0 ? ((taskStats.completedTasks / taskStats.totalTasks) * 100).toFixed(1) : 0}% completion rate
            </p>
          </div>
        </div>

        <div style={{ marginTop: '30px', padding: '20px', background: '#f9fafb', borderRadius: '8px' }}>
          <h4 style={{ marginBottom: '15px' }}>Task Distribution</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>Completed</span>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>
                  {taskStats.completedTasks} / {taskStats.totalTasks}
                </span>
              </div>
              <div style={{ width: '100%', height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${taskStats.totalTasks > 0 ? (taskStats.completedTasks / taskStats.totalTasks) * 100 : 0}%`,
                    height: '100%',
                    background: '#10b981',
                    borderRadius: '4px'
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>In Progress</span>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>
                  {taskStats.inProgressTasks} / {taskStats.totalTasks}
                </span>
              </div>
              <div style={{ width: '100%', height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${taskStats.totalTasks > 0 ? (taskStats.inProgressTasks / taskStats.totalTasks) * 100 : 0}%`,
                    height: '100%',
                    background: '#f59e0b',
                    borderRadius: '4px'
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>Assigned</span>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>
                  {taskStats.assignedTasks} / {taskStats.totalTasks}
                </span>
              </div>
              <div style={{ width: '100%', height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${taskStats.totalTasks > 0 ? (taskStats.assignedTasks / taskStats.totalTasks) * 100 : 0}%`,
                    height: '100%',
                    background: '#3b82f6',
                    borderRadius: '4px'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCustomReport = () => (
    <div className="card">
      <h3>Custom Report Generator</h3>
      <p style={{ color: '#6b7280', marginTop: '10px' }}>
        Generate custom reports based on date ranges and specific criteria
      </p>

      <div style={{ marginTop: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div className="form-group">
            <label>Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontSize: '14px'
              }}
            />
          </div>

          <div className="form-group">
            <label>End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        <button
          style={{
            marginTop: '15px',
            padding: '12px 24px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600
          }}
        >
          Generate Report
        </button>
      </div>

        <div style={{ marginTop: '30px', padding: '20px', background: '#f9fafb', borderRadius: '8px', textAlign: 'center' }}>
        <p style={{ color: '#6b7280' }}>
          Custom report generation features coming soon!
        </p>
      </div>
    </div>
  );

  return (
    <>
      <div className="content-header">
        <h1>Reports & Analytics</h1>
        <p>View comprehensive reports and analytics</p>
      </div>

      {/* Export Options */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={() => handleExport('PDF')}
          style={{
            padding: '10px 20px',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600
          }}
        >
          Export as PDF
        </button>
        <button
          onClick={() => handleExport('Excel')}
          style={{
            padding: '10px 20px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600
          }}
        >
          📊 Export as Excel
        </button>
      </div>

      {/* Report Type Tabs */}
      <div className="card">
        <div style={{ display: 'flex', gap: '10px', borderBottom: '2px solid #e5e7eb', paddingBottom: '10px' }}>
          <button
            onClick={() => setReportType('overview')}
            style={{
              padding: '10px 20px',
              background: reportType === 'overview' ? '#3b82f6' : 'transparent',
              color: reportType === 'overview' ? 'white' : '#6b7280',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600
            }}
          >
            Overview
          </button>
          <button
            onClick={() => setReportType('students')}
            style={{
              padding: '10px 20px',
              background: reportType === 'students' ? '#3b82f6' : 'transparent',
              color: reportType === 'students' ? 'white' : '#6b7280',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600
            }}
          >
            Students
          </button>
          <button
            onClick={() => setReportType('tasks')}
            style={{
              padding: '10px 20px',
              background: reportType === 'tasks' ? '#3b82f6' : 'transparent',
              color: reportType === 'tasks' ? 'white' : '#6b7280',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600
            }}
          >
            Tasks
          </button>
          <button
            onClick={() => setReportType('custom')}
            style={{
              padding: '10px 20px',
              background: reportType === 'custom' ? '#3b82f6' : 'transparent',
              color: reportType === 'custom' ? 'white' : '#6b7280',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600
            }}
          >
            Custom
          </button>
        </div>
      </div>

      {/* Report Content */}
      {loading ? (
        <div className="card">
          <p>Loading reports...</p>
        </div>
      ) : (
        <>
          {reportType === 'overview' && renderOverviewReport()}
          {reportType === 'students' && renderStudentReport()}
          {reportType === 'tasks' && renderTaskReport()}
          {reportType === 'custom' && renderCustomReport()}
        </>
      )}
    </>
  );
}

export default Reports;
