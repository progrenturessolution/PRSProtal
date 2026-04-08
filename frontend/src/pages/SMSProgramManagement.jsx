import { useState, useEffect, Fragment } from 'react';
import { adminAPI, UPLOADS_BASE } from '../services/api';

function SMSProgramManagement() {
  const [students, setStudents] = useState([]);
  const [uploadState, setUploadState] = useState({}); // { [studentId]: { uploading, success, filenames: [] } }
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [openDocs, setOpenDocs] = useState({});
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [documentModalStudent, setDocumentModalStudent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    mobile: '',
    currentDesignation: '',
    paymentDoneBy: '',
    transactionId: '',
    paymentAmount: '',
    completedFees: '',
    pendingFees: '',
    dateOfPayment: '',
    lastPaymentDate: '',
    status: ''
  });

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
  const [searchQuery, setSearchQuery] = useState('');

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
    let filtered = students;

    // Apply status filter
    if (filter === 'active') {
      filtered = filtered.filter(student => student.status?.toLowerCase() === 'active');
    }
    if (filter === 'completed') {
      filtered = filtered.filter(student => student.status?.toLowerCase() === 'completed');
    }

    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(student => 
        student.name.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query) ||
        student.internId.toLowerCase().includes(query) ||
        (student.addedByRepresentative?.name && student.addedByRepresentative.name.toLowerCase().includes(query)) ||
        (!student.addedByRepresentative && 'admin'.includes(query)) ||
        (student.currentDesignation && student.currentDesignation.toLowerCase().includes(query)) ||
        (student.paymentDoneBy && student.paymentDoneBy.toLowerCase().includes(query)) ||
        (student.transactionId && student.transactionId.toLowerCase().includes(query))
      );
    }

    return filtered;
  };

  const handleEditClick = () => {
    setEditForm({
      name: selectedStudent.name || '',
      email: selectedStudent.email || '',
      mobile: selectedStudent.mobile || '',
      currentDesignation: selectedStudent.currentDesignation || '',
      paymentDoneBy: selectedStudent.paymentDoneBy || '',
      transactionId: selectedStudent.transactionId || '',
      paymentAmount: selectedStudent.paymentAmount || '',
      completedFees: selectedStudent.completedFees || '',
      pendingFees: selectedStudent.pendingFees || '',
      dateOfPayment: selectedStudent.dateOfPayment ? selectedStudent.dateOfPayment.split('T')[0] : '',
      lastPaymentDate: selectedStudent.lastPaymentDate ? selectedStudent.lastPaymentDate.split('T')[0] : '',
      status: selectedStudent.status || 'active'
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({
      name: '',
      email: '',
      mobile: '',
      currentDesignation: '',
      paymentDoneBy: '',
      transactionId: '',
      paymentAmount: '',
      completedFees: '',
      pendingFees: '',
      dateOfPayment: '',
      lastPaymentDate: '',
      status: ''
    });
  };

  const handleUpdateStudent = async () => {
    try {
      const response = await adminAPI.updateIntern(selectedStudent._id, editForm);
      if (response.data.success) {
        setStudents(prev => prev.map(s => 
          s._id === selectedStudent._id ? { ...s, ...editForm } : s
        ));
        setSelectedStudent({ ...selectedStudent, ...editForm });
        setIsEditing(false);
        alert('Student updated successfully!');
      }
    } catch (err) {
      console.error('Update error:', err);
      alert('Failed to update student.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
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
        {/* Search Bar */}
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="🔍 Search by name, email, ID, designation, payment info..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '2px solid #e5e7eb',
              fontSize: '14px',
              fontWeight: '500',
              color: '#1f2937',
              transition: 'all 0.3s ease',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#3b82f6';
              e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e5e7eb';
              e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilter('all')}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              cursor: 'pointer',
              border: 'none',
              fontWeight: 700,
              fontSize: '14px',
              background: filter === 'all' ? '#324158' : '#f8fafc',
              color: filter === 'all' ? 'white' : '#0f172a',
              boxShadow: filter === 'all' ? '0 8px 20px rgba(50,65,88,0.25)' : 'none'
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
              background: filter === 'active' ? '#324158' : '#f8fafc',
              color: filter === 'active' ? 'white' : '#0f172a',
              boxShadow: filter === 'active' ? '0 8px 20px rgba(50,65,88,0.25)' : 'none'
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
              background: filter === 'completed' ? '#324158' : '#f8fafc',
              color: filter === 'completed' ? 'white' : '#0f172a',
              boxShadow: filter === 'completed' ? '0 8px 20px rgba(50,65,88,0.25)' : 'none'
            }}
          >
            Completed ({students.filter(s => s.status?.toLowerCase() === 'completed').length})
          </button>
        </div>

        {/* Students Table */}
        {loading ? (
          <p>Loading...</p>
        ) : filteredStudents.length === 0 ? (
          <p>{searchQuery ? `No students found matching "${searchQuery}". Try another search.` : 'No SMS program students found.'}</p>
        ) : (
          <div className="table-container">
            <table className="data-table sms-students-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Mobile</th>
                  <th>Status</th>
                  <th>Added By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <Fragment key={student._id}>
                    <tr>
                      <td>{student.internId}</td>
                      <td>{student.name}</td>
                      <td>{student.email}</td>
                      <td>{student.mobile || 'N/A'}</td>
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
                        <span
                          style={{
                            padding: '4px 10px',
                            background: student.addedByRepresentative ? '#fef3c7' : '#dbeafe',
                            color: student.addedByRepresentative ? '#b45309' : '#1e40af',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '600',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {student.addedByRepresentative
                            ? `Added by ${student.addedByRepresentative.name}`
                            : 'Added by Admin'}
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
                                color: '#132a5d',
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
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Document Management Modal */}
      {showDocumentModal && documentModalStudent && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 11000
        }} onClick={() => setShowDocumentModal(false)}>
          <div style={{ 
            background: 'white', 
            borderRadius: '16px', 
            minWidth: '500px', 
            maxWidth: '700px',
            width: '90%',
            maxHeight: '85vh',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }} onClick={(e) => e.stopPropagation()}>
            {/* Header with Gradient */}
            <div style={{ 
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              padding: '24px',
              color: 'white',
              position: 'relative'
            }}>
              <button 
                onClick={() => setShowDocumentModal(false)} 
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
              <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '600' }}>Document Management</h2>
              <div style={{ fontSize: '14px', opacity: 0.95 }}>
                <span>{documentModalStudent.name} - {documentModalStudent.internId}</span>
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: '24px', maxHeight: 'calc(85vh - 100px)', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gap: 16 }}>
                {/* Offer Letter */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  background: '#f9fafb',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                    <strong style={{ color: '#374151', fontSize: '15px' }}>Offer Letter</strong>
                    {documentModalStudent.documents?.offerLetter ? (
                      <a 
                        href={UPLOADS_BASE + '/uploads/students/' + documentModalStudent.documents.offerLetter.filename} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{
                          padding: '8px 14px',
                          background: '#10b981',
                          color: 'white',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          fontSize: '13px',
                          fontWeight: '500',
                          width: 'fit-content'
                        }}
                      >View PDF</a>
                    ) : <span style={{ color: '#9ca3af', fontSize: '13px' }}>Not uploaded</span>}
                  </div>
                  <input id={`modal-upload-offerLetter`} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={(e) => handleSingleDocUpload(e, documentModalStudent._id, 'offerLetter')} />
                  <button 
                    onClick={() => document.getElementById(`modal-upload-offerLetter`).click()} 
                    style={{ 
                      padding: '10px 18px',
                      background: documentModalStudent.documents?.offerLetter ? '#f59e0b' : '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.target.style.opacity = '1'}
                  >{documentModalStudent.documents?.offerLetter ? 'Replace' : 'Upload'}</button>
                </div>

                {/* Welcome Letter */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  background: '#f9fafb',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                    <strong style={{ color: '#374151', fontSize: '15px' }}>Welcome Letter</strong>
                    {documentModalStudent.documents?.welcomeLetter ? (
                      <a 
                        href={UPLOADS_BASE + '/uploads/students/' + documentModalStudent.documents.welcomeLetter.filename} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{
                          padding: '8px 14px',
                          background: '#10b981',
                          color: 'white',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          fontSize: '13px',
                          fontWeight: '500',
                          width: 'fit-content'
                        }}
                      >View PDF</a>
                    ) : <span style={{ color: '#9ca3af', fontSize: '13px' }}>Not uploaded</span>}
                  </div>
                  <input id={`modal-upload-welcomeLetter`} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={(e) => handleSingleDocUpload(e, documentModalStudent._id, 'welcomeLetter')} />
                  <button 
                    onClick={() => document.getElementById(`modal-upload-welcomeLetter`).click()} 
                    style={{ 
                      padding: '10px 18px',
                      background: documentModalStudent.documents?.welcomeLetter ? '#f59e0b' : '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.target.style.opacity = '1'}
                  >{documentModalStudent.documents?.welcomeLetter ? 'Replace' : 'Upload'}</button>
                </div>

                {/* Payment Receipt */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  background: '#f9fafb',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                    <strong style={{ color: '#374151', fontSize: '15px' }}>Payment Receipt</strong>
                    {documentModalStudent.documents?.paymentReceipt ? (
                      <a 
                        href={UPLOADS_BASE + '/uploads/students/' + documentModalStudent.documents.paymentReceipt.filename} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{
                          padding: '8px 14px',
                          background: '#10b981',
                          color: 'white',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          fontSize: '13px',
                          fontWeight: '500',
                          width: 'fit-content'
                        }}
                      >View PDF</a>
                    ) : <span style={{ color: '#9ca3af', fontSize: '13px' }}>Not uploaded</span>}
                  </div>
                  <input id={`modal-upload-paymentReceipt`} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={(e) => handleSingleDocUpload(e, documentModalStudent._id, 'paymentReceipt')} />
                  <button 
                    onClick={() => document.getElementById(`modal-upload-paymentReceipt`).click()} 
                    style={{ 
                      padding: '10px 18px',
                      background: documentModalStudent.documents?.paymentReceipt ? '#f59e0b' : '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.target.style.opacity = '1'}
                  >{documentModalStudent.documents?.paymentReceipt ? 'Replace' : 'Upload'}</button>
                </div>

                {/* Other Certificates */}
                <div style={{ 
                  padding: '16px',
                  background: '#f9fafb',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <strong style={{ color: '#374151', fontSize: '15px' }}>Other Certificates</strong>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {documentModalStudent.documents?.otherCertificates && documentModalStudent.documents.otherCertificates.length > 0 && (
                        <span style={{ color: '#6b7280', fontSize: '13px' }}>{documentModalStudent.documents.otherCertificates.length} file(s)</span>
                      )}
                      <input id={`modal-upload-otherCertificates`} type="file" accept="application/pdf" multiple style={{ display: 'none' }} onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length === 0) return;
                        for (const f of files) {
                          const fd = new FormData();
                          fd.append('file', f);
                          fd.append('documentType', f.name);
                          try {
                            const resp = await adminAPI.uploadStudentDocument(documentModalStudent._id, fd);
                            if (resp.data && resp.data.success) {
                              setStudents(prev => prev.map(s => {
                                if (s._id === documentModalStudent._id) {
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
                              setDocumentModalStudent(prev => ({
                                ...prev,
                                documents: {
                                  ...(prev.documents || {}),
                                  otherCertificates: [ ...(prev.documents?.otherCertificates || []), resp.data.document ]
                                }
                              }));
                            }
                          } catch (err) {
                            console.error('Other certificate upload error', err);
                          }
                        }
                        e.target.value = '';
                      }} />
                      <button 
                        onClick={() => document.getElementById(`modal-upload-otherCertificates`).click()} 
                        style={{ 
                          padding: '10px 18px',
                          background: '#8b5cf6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                        onMouseLeave={(e) => e.target.style.opacity = '1'}
                      >Add Certificate</button>
                    </div>
                  </div>
                  {documentModalStudent.documents?.otherCertificates && documentModalStudent.documents.otherCertificates.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                      {documentModalStudent.documents.otherCertificates.map((c, idx) => (
                        <a 
                          key={idx}
                          href={UPLOADS_BASE + '/uploads/students/' + c.filename} 
                          target="_blank" 
                          rel="noreferrer"
                          style={{
                            padding: '10px 14px',
                            background: 'white',
                            borderRadius: '6px',
                            textDecoration: 'none',
                            color: '#4f46e5',
                            fontSize: '13px',
                            border: '1px solid #e5e7eb',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.background = '#e0e7ff'}
                          onMouseLeave={(e) => e.target.style.background = 'white'}
                        >
                          {c.name || c.filename}
                        </a>
                      ))}
                    </div>
                  ) : <span style={{ color: '#9ca3af', fontSize: '13px' }}>No additional certificates</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Details Modal for SMS */}
      {selectedStudent && (
        <div
          className="profile-modal-overlay"
          onClick={() => {
            setSelectedStudent(null);
            setIsEditing(false);
          }}
        >
          <div className="profile-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="profile-header" style={{ background: '#324158' }}>
              <button
                className="profile-close-btn"
                onClick={() => {
                  setSelectedStudent(null);
                  setIsEditing(false);
                }}
              >
                ×
              </button>

              <div className="profile-avatar">
                {String(selectedStudent.name || 'S')
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join('')
                  .toUpperCase()}
              </div>
              <h2 className="profile-name">{selectedStudent.name}</h2>
              <div className="profile-badges">
                <span className="profile-badge">PIID: {selectedStudent.internId || '-'}</span>
                <span className="profile-badge">{selectedStudent.studentType || 'SMS Program'}</span>
                <span
                  className={`profile-badge ${selectedStudent.status?.toLowerCase() === 'active' ? 'status-active' : 'status-inactive'}`}
                >
                  {selectedStudent.status || 'Active'}
                </span>
              </div>
            </div>

            <div className="profile-body">
              <div className="profile-section">
                <h3 className="profile-section-title">
                  <span className="profile-section-bar" />
                  Contact Information
                </h3>
                {!isEditing ? (
                  <div className="profile-info-grid">
                    <div className="profile-field"><label>Name</label><div className="field-value">{selectedStudent.name || '-'}</div></div>
                    <div className="profile-field"><label>Email</label><div className="field-value">{selectedStudent.email || '-'}</div></div>
                    <div className="profile-field"><label>Mobile</label><div className="field-value">{selectedStudent.mobile || '-'}</div></div>
                    <div className="profile-field"><label>Current Designation</label><div className="field-value">{selectedStudent.currentDesignation || 'N/A'}</div></div>
                    <div className="profile-field"><label>Added By</label><div className="field-value">{selectedStudent.addedByRepresentative ? selectedStudent.addedByRepresentative.name : 'Admin'}</div></div>
                  </div>
                ) : (
                  <div className="profile-info-grid">
                    <div className="profile-field"><label>Name</label><input type="text" name="name" value={editForm.name} onChange={handleInputChange} /></div>
                    <div className="profile-field"><label>Email</label><input type="email" name="email" value={editForm.email} onChange={handleInputChange} /></div>
                    <div className="profile-field"><label>Mobile</label><input type="tel" name="mobile" value={editForm.mobile} onChange={handleInputChange} /></div>
                    <div className="profile-field"><label>Current Designation</label><input type="text" name="currentDesignation" value={editForm.currentDesignation} onChange={handleInputChange} /></div>
                  </div>
                )}
              </div>

              <div className="profile-section">
                <h3 className="profile-section-title">
                  <span className="profile-section-bar" />
                  Payment Details
                </h3>
                {!isEditing ? (
                  <div className="profile-info-grid">
                    <div className="profile-field"><label>Payment By</label><div className="field-value">{selectedStudent.paymentDoneBy || 'N/A'}</div></div>
                    <div className="profile-field"><label>Transaction ID</label><div className="field-value">{selectedStudent.transactionId || 'N/A'}</div></div>
                    <div className="profile-field"><label>Payment Amount</label><div className="field-value">{selectedStudent.paymentAmount ? `Rs. ${selectedStudent.paymentAmount}` : 'N/A'}</div></div>
                    <div className="profile-field"><label>Completed Fees</label><div className="field-value">Rs. {selectedStudent.completedFees || 0}</div></div>
                    <div className="profile-field"><label>Pending Fees</label><div className="field-value">Rs. {selectedStudent.pendingFees || 0}</div></div>
                    <div className="profile-field"><label>Payment Date</label><div className="field-value">{selectedStudent.dateOfPayment ? new Date(selectedStudent.dateOfPayment).toLocaleDateString('en-IN') : 'N/A'}</div></div>
                    <div className="profile-field"><label>Last Payment Date</label><div className="field-value">{selectedStudent.lastPaymentDate ? new Date(selectedStudent.lastPaymentDate).toLocaleDateString('en-IN') : 'N/A'}</div></div>
                    <div className="profile-field"><label>Status</label><div className="field-value">{selectedStudent.status || 'Active'}</div></div>
                  </div>
                ) : (
                  <div className="profile-info-grid">
                    <div className="profile-field"><label>Payment By</label><input type="text" name="paymentDoneBy" value={editForm.paymentDoneBy} onChange={handleInputChange} /></div>
                    <div className="profile-field"><label>Transaction ID</label><input type="text" name="transactionId" value={editForm.transactionId} onChange={handleInputChange} /></div>
                    <div className="profile-field"><label>Payment Amount</label><input type="number" name="paymentAmount" value={editForm.paymentAmount} onChange={handleInputChange} /></div>
                    <div className="profile-field"><label>Completed Fees</label><input type="number" name="completedFees" value={editForm.completedFees} onChange={handleInputChange} /></div>
                    <div className="profile-field"><label>Pending Fees</label><input type="number" name="pendingFees" value={editForm.pendingFees} onChange={handleInputChange} /></div>
                    <div className="profile-field"><label>Payment Date</label><input type="date" name="dateOfPayment" value={editForm.dateOfPayment} onChange={handleInputChange} /></div>
                    <div className="profile-field"><label>Last Payment Date</label><input type="date" name="lastPaymentDate" value={editForm.lastPaymentDate} onChange={handleInputChange} /></div>
                    <div className="profile-field">
                      <label>Status</label>
                      <select name="status" value={editForm.status} onChange={handleInputChange}>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="profile-actions">
                {!isEditing ? (
                  <button
                    onClick={handleEditClick}
                    className="profile-btn profile-btn-primary"
                    style={{ background: '#324158', borderColor: '#324158' }}
                  >
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button onClick={handleCancelEdit} className="profile-btn profile-btn-ghost">Cancel</button>
                    <button onClick={handleUpdateStudent} className="profile-btn profile-btn-primary">Save Changes</button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SMSProgramManagement;
