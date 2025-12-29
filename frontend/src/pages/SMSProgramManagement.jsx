import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

function SMSProgramManagement() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, completed

  useEffect(() => {
    fetchSMSStudents();
  }, []);

  const fetchSMSStudents = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllInterns();
      if (response.data.success) {
        // Filter only SMS Program type students
        const smsStudents = response.data.interns.filter(
          intern => intern.studentType === 'SMS Program'
        );
        setStudents(smsStudents);
      }
    } catch (error) {
      console.error('Failed to fetch SMS students:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredStudents = () => {
    if (filter === 'all') return students;
    if (filter === 'active') {
      return students.filter(student => student.status?.toLowerCase() === 'active');
    }
    if (filter === 'completed') {
      return students.filter(student => student.status?.toLowerCase() === 'completed');
    }
    return students;
  };

  const filteredStudents = getFilteredStudents();

  return (
    <>
      <div className="content-header">
        <h1>SMS Program Management</h1>
        <p>Manage SMS program students and activities</p>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
         
          <div className="stat-info">
            <h3>Total SMS Students</h3>
            <p>{students.length}</p>
          </div>
        </div>
        <div className="stat-card">
        
          <div className="stat-info">
            <h3>Active</h3>
            <p>{students.filter(s => s.status?.toLowerCase() === 'active').length}</p>
          </div>
        </div>
        <div className="stat-card">
         
          <div className="stat-info">
            <h3>Completed</h3>
            <p>{students.filter(s => s.status?.toLowerCase() === 'completed').length}</p>
          </div>
        </div>
        <div className="stat-card">
          
          <div className="stat-info">
            <h3>Payment Done</h3>
            <p>{students.filter(s => s.transactionId).length}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button
            onClick={() => setFilter('all')}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              cursor: 'pointer',
              border: 'none',
              fontWeight: 700,
              fontSize: '14px',
              background: filter === 'all' ? 'linear-gradient(90deg,#06b6d4,#3b82f6)' : '#f8fafc',
              color: filter === 'all' ? 'white' : '#0f172a',
              boxShadow: filter === 'all' ? '0 8px 20px rgba(59,130,246,0.12)' : 'none'
            }}
          >
            All ({students.length})
          </button>

          <button
            onClick={() => setFilter('active')}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              cursor: 'pointer',
              border: 'none',
              fontWeight: 700,
              fontSize: '14px',
              background: filter === 'active' ? 'linear-gradient(90deg,#10b981,#059669)' : '#f8fafc',
              color: filter === 'active' ? 'white' : '#0f172a',
              boxShadow: filter === 'active' ? '0 8px 20px rgba(5,150,105,0.12)' : 'none'
            }}
          >
            Active ({students.filter(s => s.status?.toLowerCase() === 'active').length})
          </button>

          <button
            onClick={() => setFilter('completed')}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              cursor: 'pointer',
              border: 'none',
              fontWeight: 700,
              fontSize: '14px',
              background: filter === 'completed' ? 'linear-gradient(90deg,#f59e0b,#f97316)' : '#f8fafc',
              color: filter === 'completed' ? 'white' : '#0f172a',
              boxShadow: filter === 'completed' ? '0 8px 20px rgba(249,115,22,0.12)' : 'none'
            }}
          >
            Completed ({students.filter(s => s.status?.toLowerCase() === 'completed').length})
          </button>
        </div>

        {/* Students Table */}
        {loading ? (
          <p>Loading...</p>
        ) : filteredStudents.length === 0 ? (
          <p>No SMS program students found.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Gender</th>
                  <th>Current Designation</th>
                  <th>Payment By</th>
                  <th>Payment Date</th>
                  <th>Transaction ID</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student._id}>
                    <td>{student.internId}</td>
                    <td>{student.name}</td>
                    <td>{student.email}</td>
                    <td>{student.gender || 'N/A'}</td>
                    <td>{student.currentDesignation || 'N/A'}</td>
                    <td>{student.paymentDoneBy || 'N/A'}</td>
                    <td>
                      {student.dateOfPayment
                        ? new Date(student.dateOfPayment).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td>{student.transactionId || 'N/A'}</td>
                    <td>
                      <span
                        className={`status-badge ${
                          student.status?.toLowerCase() === 'active'
                            ? 'status-active'
                            : student.status?.toLowerCase() === 'completed'
                            ? 'status-completed'
                            : 'status-inactive'
                        }`}
                      >
                        {student.status ? student.status.charAt(0).toUpperCase() + student.status.slice(1) : 'N/A'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="action-btn"
                        onClick={() => {
                          // View details logic
                          console.log('View details for:', student._id);
                        }}
                        style={{
                          padding: '6px 12px',
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

export default SMSProgramManagement;
