import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

function SMSProgramManagement() {
  const [students, setStudents] = useState([]);
  const [uploadState, setUploadState] = useState({}); // { [studentId]: { uploading, success, filenames: [] } }
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
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <button
                              className="action-btn"
                              onClick={() => console.log('View details for:', student._id)}
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

                            {/* Hidden file input to pick three files */}
                            <input
                              id={`upload-${student._id}`}
                              type="file"
                              accept="application/pdf"
                              multiple
                              style={{ display: 'none' }}
                              onChange={async (e) => {
                                const files = Array.from(e.target.files || []);
                                if (files.length === 0) return;

                                // Expecting three files: welcomeLetter, offerLetter, paymentReceipt
                                // Allow uploaded files in any order by filename hints, otherwise require exactly 3
                                const studentKey = student._id;
                                setUploadState(s => ({ ...s, [studentKey]: { uploading: true, success: false, filenames: [] } }));

                                try {
                                  // Map files to documentType by checking common keywords in name
                                  const mapFileToType = (file) => {
                                    const name = file.name.toLowerCase();
                                    if (name.includes('welcome')) return 'welcomeLetter';
                                    if (name.includes('offer')) return 'offerLetter';
                                    if (name.includes('receipt') || name.includes('payment')) return 'paymentReceipt';
                                    return null;
                                  };

                                  const uploads = [];
                                  for (const file of files) {
                                    const docType = mapFileToType(file) || null;
                                    // If unknown, skip (we upload only known types)
                                    if (!docType) continue;

                                    const fd = new FormData();
                                    fd.append('file', file);
                                    fd.append('documentType', docType);

                                    uploads.push({ fd, file, docType });
                                  }

                                  // If nothing matched, try to upload up to first 3 files in order
                                  if (uploads.length === 0) {
                                    const types = ['welcomeLetter', 'offerLetter', 'paymentReceipt'];
                                    for (let i = 0; i < Math.min(files.length, 3); i++) {
                                      const fd = new FormData();
                                      fd.append('file', files[i]);
                                      fd.append('documentType', types[i]);
                                      uploads.push({ fd, file: files[i], docType: types[i] });
                                    }
                                  }

                                  // Perform uploads sequentially
                                  const uploadedNames = [];
                                  for (const up of uploads) {
                                    const resp = await adminAPI.uploadStudentDocument(student._id, up.fd);
                                    if (resp.data && resp.data.success) {
                                      uploadedNames.push(up.file.name);
                                    }
                                  }

                                  setUploadState(s => ({ ...s, [studentKey]: { uploading: false, success: uploadedNames.length > 0, filenames: uploadedNames } }));
                                } catch (err) {
                                  console.error('Upload error:', err);
                                  setUploadState(s => ({ ...s, [student._id]: { uploading: false, success: false, filenames: [] } }));
                                } finally {
                                  // clear input
                                  e.target.value = '';
                                }
                              }}
                            />

                            <label htmlFor={`upload-${student._id}`} style={{ margin: 0 }}>
                              <button
                                type="button"
                                style={{
                                  padding: '6px 12px',
                                  background: uploadState[student._id]?.success ? '#10b981' : '#0ea5e9',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px'
                                }}
                              >
                                {uploadState[student._id]?.uploading ? (
                                  'Uploading...'
                                ) : uploadState[student._id]?.success ? (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontWeight: 700 }}>✓</span>
                                    <span style={{ fontSize: 13 }}>Uploaded</span>
                                  </span>
                                ) : (
                                  'Upload Docs'
                                )}
                              </button>
                            </label>

                            {/* Show uploaded filenames when available */}
                            {uploadState[student._id]?.filenames?.length > 0 && (
                              <div style={{ fontSize: 12, color: '#0f172a' }}>
                                {uploadState[student._id].filenames.map((n, i) => (
                                  <div key={i} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>{n}</div>
                                ))}
                              </div>
                            )}
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
  );
}

export default SMSProgramManagement;
