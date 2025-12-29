import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

function InternshipManagement() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, completed

  useEffect(() => {
    fetchInternshipStudents();
  }, []);

  const fetchInternshipStudents = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllInterns();
      console.log('All interns:', response.data.interns);
      if (response.data.success) {
        // Filter only Internship type students
        const internshipStudents = response.data.interns.filter(
          intern => intern.studentType === 'Internship'
        );
        console.log('Internship students:', internshipStudents);
        setStudents(internshipStudents);
      }
    } catch (error) {
      console.error('Failed to fetch internship students:', error);
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

  const handleDocumentUpload = async (e, studentId) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('Only PDF files are allowed for offer letters.');
      return;
    }

    const fd = new FormData();
    fd.append('file', file);
    fd.append('documentType', 'offerLetter');

    try {
      const resp = await adminAPI.uploadStudentDocument(studentId, fd);
      if (resp.data && resp.data.success) {
        // Update local state for that student
        setStudents(prev => prev.map(s => {
          if (s._id === studentId) {
            return {
              ...s,
              documents: {
                ...(s.documents || {}),
                offerLetter: resp.data.document
              }
            };
          }
          return s;
        }));
        alert('Offer letter uploaded and synced.');
      } else {
        alert('Upload failed.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Upload failed.');
    }
  };

  const filteredStudents = getFilteredStudents();

  return (
    <>
      <div className="content-header">
        <h1>Internship Management</h1>
        <p>Manage all internship programs and students</p>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-info">
            <h3>Total Interns</h3>
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
      </div>

      {/* Filters */}
      <div className="card">
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          {/** Helper inline styles for clearer active/inactive states */}
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
          <p>No internship students found.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Domain</th>
                  <th>Documents</th>
                  <th>Joining Date</th>
                  <th>End Date</th>
                  <th>Duration</th>
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
                    <td>{student.domain || 'N/A'}</td>
                    <td>
                      {/* Offer letter view/upload */}
                      {student.documents && student.documents.offerLetter ? (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <a
                            href={window.location.origin + '/uploads/students/' + student.documents.offerLetter.filename}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#0b5cff' }}
                          >
                            View
                          </a>
                          <label style={{ cursor: 'pointer', color: '#0b5cff' }}>
                            Replace
                            <input
                              type="file"
                              accept="application/pdf"
                              style={{ display: 'none' }}
                              onChange={(e) => handleDocumentUpload(e, student._id)}
                            />
                          </label>
                        </div>
                      ) : (
                        <label style={{ cursor: 'pointer', color: '#0b5cff' }}>
                          Upload
                          <input
                            type="file"
                            accept="application/pdf"
                            style={{ display: 'none' }}
                            onChange={(e) => handleDocumentUpload(e, student._id)}
                          />
                        </label>
                      )}
                    </td>
                    <td>
                      {student.joiningDate
                        ? new Date(student.joiningDate).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td>
                      {student.endingDate
                        ? new Date(student.endingDate).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td>{student.duration || 'N/A'}</td>
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

export default InternshipManagement;
