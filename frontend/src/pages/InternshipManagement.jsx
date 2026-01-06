import { useState, useEffect } from 'react';
import { adminAPI, UPLOADS_BASE } from '../services/api';

function InternshipManagement() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, completed
  const [infoMessage, setInfoMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  

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
      setErrorMessage('Only PDF files are allowed for offer letters.');
      setTimeout(() => setErrorMessage(''), 3000);
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
        // If modal is open for this student, update it too so the View Details reflects the new document
        setSelectedStudent(prev => {
          if (prev && prev._id === studentId) {
            return {
              ...prev,
              documents: {
                ...(prev.documents || {}),
                offerLetter: resp.data.document
              }
            };
          }
          return prev;
        });
        setInfoMessage('Offer letter uploaded and synced.');
        setTimeout(() => setInfoMessage(''), 4000);
      } else {
        setErrorMessage('Upload failed.');
        setTimeout(() => setErrorMessage(''), 4000);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setErrorMessage('Upload failed.');
      setTimeout(() => setErrorMessage(''), 4000);
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
        {errorMessage && (
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
            {errorMessage}
          </div>
        )}

        {infoMessage && (
          <div style={{
            padding: '12px',
            marginBottom: '20px',
            backgroundColor: '#ecfccb',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            color: '#166534',
            fontSize: '14px',
            fontWeight: 500
          }}>
            {infoMessage}
          </div>
        )}
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
                              href={UPLOADS_BASE + '/uploads/students/' + student.documents.offerLetter.filename}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#0b5cff' }}
                            >
                              View
                            </a>
                            <button
                              onClick={() => document.getElementById(`file-input-${student._id}`).click()}
                              style={{ background: 'transparent', border: 'none', color: '#0b5cff', cursor: 'pointer' }}
                            >
                              Replace
                            </button>
                            <input
                              id={`file-input-${student._id}`}
                              type="file"
                              accept="application/pdf"
                              style={{ display: 'none' }}
                              onChange={(e) => handleDocumentUpload(e, student._id)}
                            />
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => document.getElementById(`file-input-${student._id}`).click()}
                              style={{ background: 'transparent', border: 'none', color: '#0b5cff', cursor: 'pointer' }}
                            >
                              Upload
                            </button>
                            <input
                              id={`file-input-${student._id}`}
                              type="file"
                              accept="application/pdf"
                              style={{ display: 'none' }}
                              onChange={(e) => handleDocumentUpload(e, student._id)}
                            />
                          </>
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
                    <td style={{ position: 'relative' }}>
                      <button
                        onClick={() => setOpenMenuId(openMenuId === student._id ? null : student._id)}
                        style={{
                          background: '#f8fafc',
                          border: 'none',
                          borderRadius: '8px',
                          width: '36px',
                          height: '36px',
                          cursor: 'pointer',
                          fontSize: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#f8fafc'}
                      >
                        ⋮
                      </button>
                      
                      {openMenuId === student._id && (
                        <div
                          style={{
                            position: 'absolute',
                            right: '40px',
                            top: '0',
                            background: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                            zIndex: 1000,
                            minWidth: '160px',
                            overflow: 'hidden'
                          }}
                        >
                          <button
                            onClick={() => {
                              setSelectedStudent(student);
                              setOpenMenuId(null);
                            }}
                            style={{
                              width: '100%',
                              padding: '10px 14px',
                              background: 'white',
                              border: 'none',
                              textAlign: 'left',
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: '500',
                              color: '#0f172a',
                              transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
                            onMouseLeave={(e) => e.target.style.background = 'white'}
                          >
                            View Details
                          </button>
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

      {/* Student Details Modal */}
      {selectedStudent && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100
        }} onClick={() => setSelectedStudent(null)}>
          <div style={{ 
            background: 'white', 
            borderRadius: '16px', 
            minWidth: '400px', 
            maxWidth: '650px',
            width: '90%',
            maxHeight: '85vh',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }} onClick={(e) => e.stopPropagation()}>
            {/* Header with Gradient */}
            <div style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '24px',
              color: 'white',
              position: 'relative'
            }}>
              <button 
                onClick={() => setSelectedStudent(null)} 
                style={{ 
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  border: 'none', 
                  background: 'rgba(255,255,255,0.2)', 
                  color: 'white',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer', 
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
              >✕</button>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '600' }}>{selectedStudent.name}</h2>
              <div style={{ display: 'flex', gap: '16px', fontSize: '14px', opacity: 0.95 }}>
                <span>ID: {selectedStudent.internId}</span>
                <span>•</span>
                <span>Type: {selectedStudent.studentType}</span>
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: '24px', maxHeight: 'calc(85vh - 120px)', overflowY: 'auto' }}>
              {/* Contact Information */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ 
                  fontSize: '16px', 
                  fontWeight: '600', 
                  color: '#1f2937',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>📧 Contact Information</h3>
                <div style={{ 
                  background: '#f9fafb',
                  padding: '16px',
                  borderRadius: '8px',
                  display: 'grid',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Email</span>
                    <span style={{ fontWeight: '500', fontSize: '14px', color: '#111827' }}>{selectedStudent.email}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Mobile</span>
                    <span style={{ fontWeight: '500', fontSize: '14px', color: '#111827' }}>{selectedStudent.mobile}</span>
                  </div>
                </div>
              </div>

              {/* Documents Section */}
              <div>
                <h3 style={{ 
                  fontSize: '16px', 
                  fontWeight: '600', 
                  color: '#1f2937',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>📄 Documents</h3>
                <div style={{ 
                  background: '#f9fafb',
                  padding: '16px',
                  borderRadius: '8px',
                  display: 'grid',
                  gap: '12px'
                }}>
                  {/* Offer Letter */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '10px',
                    background: 'white',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Offer Letter</span>
                    {selectedStudent.documents?.offerLetter ? (
                      <a 
                        href={UPLOADS_BASE + '/uploads/students/' + selectedStudent.documents.offerLetter.filename} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{
                          padding: '6px 14px',
                          background: '#10b981',
                          color: 'white',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          fontSize: '13px',
                          fontWeight: '500',
                          transition: 'all 0.2s'
                        }}
                      >View PDF</a>
                    ) : <span style={{ color: '#9ca3af', fontSize: '13px' }}>Not uploaded</span>}
                  </div>

                  {/* Welcome Letter */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '10px',
                    background: 'white',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Welcome Letter</span>
                    {selectedStudent.documents?.welcomeLetter ? (
                      <a 
                        href={UPLOADS_BASE + '/uploads/students/' + selectedStudent.documents.welcomeLetter.filename} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{
                          padding: '6px 14px',
                          background: '#10b981',
                          color: 'white',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          fontSize: '13px',
                          fontWeight: '500',
                          transition: 'all 0.2s'
                        }}
                      >View PDF</a>
                    ) : <span style={{ color: '#9ca3af', fontSize: '13px' }}>Not uploaded</span>}
                  </div>

                  {/* Payment Receipt */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '10px',
                    background: 'white',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Payment Receipt</span>
                    {selectedStudent.documents?.paymentReceipt ? (
                      <a 
                        href={UPLOADS_BASE + '/uploads/students/' + selectedStudent.documents.paymentReceipt.filename} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{
                          padding: '6px 14px',
                          background: '#10b981',
                          color: 'white',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          fontSize: '13px',
                          fontWeight: '500',
                          transition: 'all 0.2s'
                        }}
                      >View PDF</a>
                    ) : <span style={{ color: '#9ca3af', fontSize: '13px' }}>Not uploaded</span>}
                  </div>

                  {/* Other Certificates */}
                  <div style={{ 
                    padding: '10px',
                    background: 'white',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Other Certificates</div>
                    {selectedStudent.documents?.otherCertificates && selectedStudent.documents.otherCertificates.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                        {selectedStudent.documents.otherCertificates.map((c, idx) => (
                          <a 
                            key={idx}
                            href={UPLOADS_BASE + '/uploads/students/' + c.filename} 
                            target="_blank" 
                            rel="noreferrer"
                            style={{
                              padding: '8px 12px',
                              background: '#f3f4f6',
                              borderRadius: '4px',
                              textDecoration: 'none',
                              color: '#4f46e5',
                              fontSize: '13px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.background = '#e0e7ff'}
                            onMouseLeave={(e) => e.target.style.background = '#f3f4f6'}
                          >
                            📎 {c.name || c.filename}
                          </a>
                        ))}
                      </div>
                    ) : <span style={{ color: '#9ca3af', fontSize: '13px' }}>None</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  );
}

export default InternshipManagement;
