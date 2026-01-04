import { useState, useEffect } from 'react';
import { adminAPI, UPLOADS_BASE } from '../services/api';

function SMSProgramManagement() {
  const [students, setStudents] = useState([]);
  const [uploadState, setUploadState] = useState({}); // { [studentId]: { uploading, success, filenames: [] } }
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [openDocs, setOpenDocs] = useState({});

  const toggleDocs = (studentId) => {
    setOpenDocs(prev => ({ ...prev, [studentId]: !prev[studentId] }));
  };

  const handleSingleDocUpload = async (e, studentId, documentType) => {
    const file = Array.from(e.target.files || [])[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setUploadState(s => ({ ...s, [studentId]: { ...(s[studentId] || {}), error: 'Only PDF allowed' } }));
      setTimeout(() => setUploadState(s => ({ ...s, [studentId]: { ...(s[studentId] || {}), error: undefined } })), 3000);
      e.target.value = '';
      return;
    }

    setUploadState(s => ({ ...s, [studentId]: { ...(s[studentId] || {}), uploading: true } }));

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('documentType', documentType);

      const resp = await adminAPI.uploadStudentDocument(studentId, fd);
      if (resp.data && resp.data.success) {
        // update students list
        setStudents(prev => prev.map(s => {
          if (s._id === studentId) {
            return {
              ...s,
              documents: {
                ...(s.documents || {}),
                [documentType]: resp.data.document
              }
            };
          }
          return s;
        }));

        // update modal if open
        setSelectedStudent(prev => {
          if (prev && prev._id === studentId) {
            return {
              ...prev,
              documents: {
                ...(prev.documents || {}),
                [documentType]: resp.data.document
              }
            };
          }
          return prev;
        });

        setUploadState(s => ({ ...s, [studentId]: { ...(s[studentId] || {}), uploading: false, success: true, filenames: [(resp.data.document && resp.data.document.filename) || file.name] } }));
      } else {
        setUploadState(s => ({ ...s, [studentId]: { ...(s[studentId] || {}), uploading: false, success: false } }));
      }
    } catch (err) {
      console.error('Upload error:', err);
      setUploadState(s => ({ ...s, [studentId]: { ...(s[studentId] || {}), uploading: false, success: false } }));
    } finally {
      e.target.value = '';
    }
  };
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
                          onClick={() => setSelectedStudent(student)}
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

                        <button
                          className="action-btn"
                          onClick={() => toggleDocs(student._id)}
                          style={{
                            padding: '6px 12px',
                            background: openDocs[student._id] ? '#f3f4f6' : '#e2e8f0',
                            color: '#0f172a',
                            border: '1px solid #cbd5e1',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          {openDocs[student._id] ? 'Hide Docs' : 'Docs'}
                        </button>
                      </div>

                      {openDocs[student._id] && (
                        <div style={{ marginTop: 8, display: 'grid', gap: 6 }}>
                          {/* Offer Letter */}
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <strong style={{ minWidth: 100 }}>Offer Letter</strong>
                            {student.documents?.offerLetter ? (
                              <a href={UPLOADS_BASE + '/uploads/students/' + student.documents.offerLetter.filename} target="_blank" rel="noreferrer">View</a>
                            ) : <span style={{ color: '#6b7280' }}>Not uploaded</span>}
                            <input id={`upload-${student._id}-offerLetter`} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={(e) => handleSingleDocUpload(e, student._id, 'offerLetter')} />
                            <button onClick={() => document.getElementById(`upload-${student._id}-offerLetter`).click()} style={{ padding: '6px 10px', borderRadius: 6 }}>{student.documents?.offerLetter ? 'Replace' : 'Upload'}</button>
                          </div>

                          {/* Welcome Letter */}
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <strong style={{ minWidth: 100 }}>Welcome Letter</strong>
                            {student.documents?.welcomeLetter ? (
                              <a href={UPLOADS_BASE + '/uploads/students/' + student.documents.welcomeLetter.filename} target="_blank" rel="noreferrer">View</a>
                            ) : <span style={{ color: '#6b7280' }}>Not uploaded</span>}
                            <input id={`upload-${student._id}-welcomeLetter`} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={(e) => handleSingleDocUpload(e, student._id, 'welcomeLetter')} />
                            <button onClick={() => document.getElementById(`upload-${student._id}-welcomeLetter`).click()} style={{ padding: '6px 10px', borderRadius: 6 }}>{student.documents?.welcomeLetter ? 'Replace' : 'Upload'}</button>
                          </div>

                          {/* Payment Receipt */}
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <strong style={{ minWidth: 100 }}>Payment Receipt</strong>
                            {student.documents?.paymentReceipt ? (
                              <a href={UPLOADS_BASE + '/uploads/students/' + student.documents.paymentReceipt.filename} target="_blank" rel="noreferrer">View</a>
                            ) : <span style={{ color: '#6b7280' }}>Not uploaded</span>}
                            <input id={`upload-${student._id}-paymentReceipt`} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={(e) => handleSingleDocUpload(e, student._id, 'paymentReceipt')} />
                            <button onClick={() => document.getElementById(`upload-${student._id}-paymentReceipt`).click()} style={{ padding: '6px 10px', borderRadius: 6 }}>{student.documents?.paymentReceipt ? 'Replace' : 'Upload'}</button>
                          </div>

                          {/* Other Certificates (add new) */}
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <strong style={{ minWidth: 100 }}>Other Certificates</strong>
                            {student.documents?.otherCertificates && student.documents.otherCertificates.length > 0 ? (
                              <span style={{ color: '#0b172a' }}>{student.documents.otherCertificates.length} file(s)</span>
                            ) : <span style={{ color: '#6b7280' }}>None</span>}
                            <input id={`upload-${student._id}-otherCertificates`} type="file" accept="application/pdf" multiple style={{ display: 'none' }} onChange={async (e) => {
                              const files = Array.from(e.target.files || []);
                              if (files.length === 0) return;
                              for (const f of files) {
                                // use file name as documentType so backend stores name
                                const fd = new FormData();
                                fd.append('file', f);
                                fd.append('documentType', f.name);
                                try {
                                  const resp = await adminAPI.uploadStudentDocument(student._id, fd);
                                  if (resp.data && resp.data.success) {
                                    setStudents(prev => prev.map(s => {
                                      if (s._id === student._id) {
                                        return {
                                          ...s,
                                          documents: {
                                            ...(s.documents || {}),
                                            otherCertificates: [ ...(s.documents?.otherCertificates || []), resp.data.document ]
                                          }
                                        };
                                      }
                                      return s;
                                    }));
                                    setSelectedStudent(prev => {
                                      if (prev && prev._id === student._id) {
                                        return {
                                          ...prev,
                                          documents: {
                                            ...(prev.documents || {}),
                                            otherCertificates: [ ...(prev.documents?.otherCertificates || []), resp.data.document ]
                                          }
                                        };
                                      }
                                      return prev;
                                    });
                                  }
                                } catch (err) {
                                  console.error('Other certificate upload error', err);
                                }
                              }
                              e.target.value = '';
                            }} />
                            <button onClick={() => document.getElementById(`upload-${student._id}-otherCertificates`).click()} style={{ padding: '6px 10px', borderRadius: 6 }}>Add</button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Student Details Modal for SMS */}
      {selectedStudent && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100
        }} onClick={() => setSelectedStudent(null)}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', minWidth: '320px', maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0 }}>{selectedStudent.name} — {selectedStudent.internId}</h3>
              <button onClick={() => setSelectedStudent(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '18px' }}>✕</button>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <div><strong>Email:</strong> {selectedStudent.email}</div>
              <div><strong>Mobile:</strong> {selectedStudent.mobile}</div>
              <div><strong>Payment By:</strong> {selectedStudent.paymentDoneBy || 'N/A'}</div>
              <div><strong>Transaction ID:</strong> {selectedStudent.transactionId || 'N/A'}</div>
            </div>
            <div>
              <h4>Documents</h4>
              <div style={{ display: 'grid', gap: '8px' }}>
                <div>
                  <strong>Offer Letter:</strong>{' '}
                  {selectedStudent.documents?.offerLetter ? (
                    <a href={UPLOADS_BASE + '/uploads/students/' + selectedStudent.documents.offerLetter.filename} target="_blank" rel="noreferrer">View</a>
                  ) : <span style={{ color: '#6b7280' }}>Not uploaded</span>}
                </div>
                <div>
                  <strong>Welcome Letter:</strong>{' '}
                  {selectedStudent.documents?.welcomeLetter ? (
                    <a href={UPLOADS_BASE + '/uploads/students/' + selectedStudent.documents.welcomeLetter.filename} target="_blank" rel="noreferrer">View</a>
                  ) : <span style={{ color: '#6b7280' }}>Not uploaded</span>}
                </div>
                <div>
                  <strong>Payment Receipt:</strong>{' '}
                  {selectedStudent.documents?.paymentReceipt ? (
                    <a href={UPLOADS_BASE + '/uploads/students/' + selectedStudent.documents.paymentReceipt.filename} target="_blank" rel="noreferrer">View</a>
                  ) : <span style={{ color: '#6b7280' }}>Not uploaded</span>}
                </div>
                <div>
                  <strong>Other Certificates:</strong>
                  {selectedStudent.documents?.otherCertificates && selectedStudent.documents.otherCertificates.length > 0 ? (
                    <ul>
                      {selectedStudent.documents.otherCertificates.map((c, idx) => (
                        <li key={idx}><a href={UPLOADS_BASE + '/uploads/students/' + c.filename} target="_blank" rel="noreferrer">{c.name || c.filename}</a></li>
                      ))}
                    </ul>
                  ) : <span style={{ color: '#6b7280', marginLeft: '8px' }}>None</span>}
                </div>
              </div>
            </div>
            <div style={{ marginTop: '16px', textAlign: 'right' }}>
              <button onClick={() => setSelectedStudent(null)} style={{ padding: '8px 12px', borderRadius: '8px' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SMSProgramManagement;
