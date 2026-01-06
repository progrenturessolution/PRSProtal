import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

function ViewInterns({ onInternDeleted }) {
  const [interns, setInterns] = useState([]);
  const [filteredInterns, setFilteredInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [certificateFile, setCertificateFile] = useState(null);
  const [certificateType, setCertificateType] = useState('offerLetter');
  const [uploadingCert, setUploadingCert] = useState(false);

  useEffect(() => {
    fetchInterns();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [interns, searchQuery, filterType, filterStatus]);

  const fetchInterns = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminAPI.getAllInterns();
      console.log('Interns response:', response.data);
      
      if (response.data.success && response.data.interns) {
        setInterns(response.data.interns);
      } else {
        setInterns([]);
      }
    } catch (err) {
      console.error('Error fetching interns:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to fetch interns. Please check if you are logged in.');
      setInterns([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...interns];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(intern =>
        intern.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        intern.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        intern.internId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        intern.mobile?.includes(searchQuery)
      );
    }

    // Type filter
    if (filterType !== 'All') {
      filtered = filtered.filter(intern => intern.studentType === filterType);
    }

    // Status filter
    if (filterStatus !== 'All') {
      filtered = filtered.filter(intern => 
        (intern.status || '').toLowerCase() === filterStatus.toLowerCase()
      );
    }

    setFilteredInterns(filtered);
  };

  const handleDelete = async (id, name) => {
    try {
      await adminAPI.deleteIntern(id);
      setInterns(interns.filter(intern => intern._id !== id));
      setInfoMessage('Intern deleted successfully');
      setTimeout(() => setInfoMessage(''), 4000);
      if (onInternDeleted) onInternDeleted();
    } catch (err) {
      setError('Failed to delete intern');
      console.error(err);
      setTimeout(() => setError(''), 4000);
    }
  };

  const handleStatusToggle = async (student) => {
    const current = (student.status || '').toLowerCase();
    const newStatus = current === 'active' ? 'inactive' : 'active';

    try {
      // Send normalized lower-case status to backend
      await adminAPI.updateInternStatus(student._id, newStatus);
      // Update UI with capitalized label for readability
      const label = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
      setInterns(interns.map(intern => 
        intern._id === student._id ? { ...intern, status: label } : intern
      ));
      setOpenMenuId(null);
      // Show inline info message instead of alert
      setInfoMessage(`Student ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
      setTimeout(() => setInfoMessage(''), 4000);
    } catch (err) {
      setError('Failed to update status');
      console.error(err);
    }
  };

  const handleViewProfile = (student) => {
    setSelectedStudent(student);
    setShowProfileModal(true);
    setOpenMenuId(null);
  };

  const handleEdit = (student) => {
    setSelectedStudent(student);
    // initialize edit form with allowed fields
    setEditForm({
      name: student.name || '',
      email: student.email || '',
      mobile: student.mobile || '',
      studentType: student.studentType || '',
      currentDesignation: student.currentDesignation || '',
      domain: student.domain || '',
      duration: student.duration || '',
      joiningDate: student.joiningDate ? new Date(student.joiningDate).toISOString().slice(0,10) : '',
      endingDate: student.endingDate ? new Date(student.endingDate).toISOString().slice(0,10) : '',
      paymentDoneBy: student.paymentDoneBy || '',
      transactionId: student.transactionId || ''
    });
    setShowEditModal(true);
    setOpenMenuId(null);
  };

  const handleEditChange = (key, value) => {
    setEditForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveEdit = async () => {
    if (!selectedStudent || !editForm) return;
    try {
      const response = await adminAPI.updateIntern(selectedStudent._id, editForm);
      if (response.data && response.data.success) {
        const updated = response.data.intern;
        setInterns(interns.map(i => i._id === updated._id ? updated : i));
        setSelectedStudent(updated);
        setShowEditModal(false);
        setInfoMessage('Student updated successfully');
        setTimeout(() => setInfoMessage(''), 4000);
      } else {
        setError('Failed to update student');
      }
    } catch (err) {
      console.error('Save edit error:', err);
      setError(err.response?.data?.message || 'Failed to update student');
    }
  };

  const handleViewCertificates = (student) => {
    setSelectedStudent(student);
    setShowCertificateModal(true);
    setCertificateType('offerLetter');
    setCertificateFile(null);
    setOpenMenuId(null);
  };

  const handleCertificateUpload = async () => {
    if (!certificateFile) {
      setError('Please select a file to upload');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (certificateFile.type !== 'application/pdf') {
      setError('Only PDF files are allowed');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setUploadingCert(true);
    try {
      const formData = new FormData();
      formData.append('file', certificateFile);
      formData.append('documentType', certificateType);

      const response = await adminAPI.uploadStudentDocument(selectedStudent._id, formData);
      
      if (response.data && response.data.success) {
        // Update local state
        setInterns(interns.map(intern => {
          if (intern._id === selectedStudent._id) {
            return {
              ...intern,
              documents: {
                ...(intern.documents || {}),
                [certificateType]: response.data.document
              }
            };
          }
          return intern;
        }));

        // Update selected student
        setSelectedStudent(prev => ({
          ...prev,
          documents: {
            ...(prev.documents || {}),
            [certificateType]: response.data.document
          }
        }));

        setInfoMessage('Certificate uploaded successfully');
        setTimeout(() => setInfoMessage(''), 4000);
        setCertificateFile(null);
      } else {
        setError('Failed to upload certificate');
        setTimeout(() => setError(''), 4000);
      }
    } catch (err) {
      console.error('Certificate upload error:', err);
      setError(err.response?.data?.message || 'Failed to upload certificate');
      setTimeout(() => setError(''), 4000);
    } finally {
      setUploadingCert(false);
    }
  };

  const toggleMenu = (id) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      // If no menu is open, nothing to do
      if (!openMenuId) return;
      // If click happened inside an open menu or its toggle button, ignore
      if (e.target.closest('[data-menu]') || e.target.closest('[data-menu-toggle]')) return;
      setOpenMenuId(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  if (loading) {
    return (
      <div className="content-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="spinner"></div>
          <h1>Loading Students...</h1>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="content-header">
        <div>
          <h1>All Students</h1>
          <p>Manage and view all registered students - {filteredInterns.length} of {interns.length} students</p>
        </div>
      </div>

      {error && (
        <div className="error-message" style={{ marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {infoMessage && (
        <div className="success-message" style={{ marginBottom: '20px' }}>
          {infoMessage}
        </div>
      )}

      {/* Filters and Search Bar */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          alignItems: 'end'
        }}>
          {/* Search */}
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#0f172a'
            }}>
              Search Students
            </label>
            <input
              type="text"
              placeholder="Search by name, email, ID, or mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '15px',
                transition: 'all 0.2s',
                background: '#f8fafc'
              }}
            />
          </div>

          {/* Student Type Filter */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#0f172a'
            }}>
              Student Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '15px',
                background: '#f8fafc',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              <option value="All">All Types</option>
              <option value="Internship">Internship</option>
              <option value="SMS Program">SMS Program</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#0f172a'
            }}>
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '15px',
                background: '#f8fafc',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              <option value="All">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Display */}
      {filteredInterns.length === 0 ? (
        <div className="card">
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#64748b'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}></div>
            <h3 style={{ color: '#0f172a', marginBottom: '8px' }}>No Students Found</h3>
            <p>Try adjusting your filters or search query</p>
          </div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '20px'
        }}>
          {filteredInterns.map((student) => (
            <div
              key={student._id}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                border: '1px solid #e2e8f0',
                transition: 'all 0.3s',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                <div>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    background: student.studentType === 'Internship' ? '#eff6ff' : '#f0fdf4',
                    color: student.studentType === 'Internship' ? '#1e40af' : '#15803d',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '700',
                    marginBottom: '8px'
                  }}>
                    {student.internId}
                  </span>
                  <span style={{
                    display: 'inline-block',
                    marginLeft: '8px',
                    padding: '4px 10px',
                    background: (student.status || '').toLowerCase() === 'active' ? '#d1fae5' : '#fee2e2',
                    color: (student.status || '').toLowerCase() === 'active' ? '#065f46' : '#dc2626',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '700'
                  }}>
                    {student.status || 'Active'}
                  </span>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMenu(student._id);
                  }}
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
              </div>

              {/* Student Info */}
              <h3 style={{
                margin: '0 0 12px 0',
                fontSize: '18px',
                fontWeight: '700',
                color: '#0f172a'
              }}>
                {student.name}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#64748b' }}>
                  <span>Email:</span>
                  <span style={{ wordBreak: 'break-all' }}>{student.email}</span>
                </div>
                
                {student.mobile && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#64748b' }}>
                    <span>Mobile:</span>
                    <span>{student.mobile}</span>
                  </div>
                )}

                {(student.domain || student.currentDesignation) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#64748b' }}>
                    <span>Role:</span>
                    <span>{student.domain || student.currentDesignation}</span>
                  </div>
                )}

                {student.duration && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#64748b' }}>
                    <span>Duration:</span>
                    <span>{student.duration}</span>
                  </div>
                )}
              </div>

              {/* Dropdown Menu */}
              {openMenuId === student._id && (
                <div
                  data-menu
                  style={{
                    position: 'absolute',
                    right: '20px',
                    top: '60px',
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                    zIndex: 1000,
                    minWidth: '180px',
                    overflow: 'hidden'
                  }}
                >
                  <button
                    onClick={() => handleViewProfile(student)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
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
                    View Profile
                  </button>

                  <button
                    onClick={() => handleEdit(student)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'white',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#0f172a',
                      transition: 'background 0.2s',
                      borderTop: '1px solid #f3f4f6'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
                    onMouseLeave={(e) => e.target.style.background = 'white'}
                  >
                    Edit Details
                  </button>

                  <button
                    onClick={() => handleViewCertificates(student)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'white',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#0f172a',
                      transition: 'background 0.2s',
                      borderTop: '1px solid #f3f4f6'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
                    onMouseLeave={(e) => e.target.style.background = 'white'}
                  >
                    Certificates
                  </button>

                  <button
                    onClick={() => handleStatusToggle(student)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'white',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: (student.status || '').toLowerCase() === 'active' ? '#dc2626' : '#059669',
                      transition: 'background 0.2s',
                      borderTop: '1px solid #f3f4f6'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
                    onMouseLeave={(e) => e.target.style.background = 'white'}
                  >
                    {(student.status || '').toLowerCase() === 'active' ? 'Mark Inactive' : 'Mark Active'}
                  </button>

                  <button
                    onClick={() => handleDelete(student._id, student.name)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'white',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#dc2626',
                      transition: 'background 0.2s',
                      borderTop: '1px solid #f3f4f6'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#fef2f2'}
                    onMouseLeave={(e) => e.target.style.background = 'white'}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* View Profile Modal - Enhanced */}
      {showProfileModal && selectedStudent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
              background: 'white',
              borderRadius: '16px',
              maxWidth: '1000px',
              width: '95%',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}>
            
            {/* Header with Gradient Background */}
            <div style={{
              background: selectedStudent.studentType === 'Internship' 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              padding: '32px',
              borderRadius: '16px 16px 0 0',
              position: 'relative'
            }}>
              <button
                onClick={() => setShowProfileModal(false)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
              >
                ×
              </button>

              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '20px',
                color: 'white'
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '36px',
                  fontWeight: 700,
                  border: '3px solid rgba(255, 255, 255, 0.3)'
                }}>
                  {selectedStudent.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ 
                    margin: '0 0 8px 0', 
                    fontSize: '28px',
                    fontWeight: 700
                  }}>
                    {selectedStudent.name}
                  </h2>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{
                      padding: '6px 14px',
                      background: 'rgba(255, 255, 255, 0.25)',
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: 600,
                      backdropFilter: 'blur(10px)'
                    }}>
                      {selectedStudent.internId}
                    </span>
                    <span style={{
                      padding: '6px 14px',
                      background: (selectedStudent.status || '').toLowerCase() === 'active' 
                        ? 'rgba(16, 185, 129, 0.9)' 
                        : 'rgba(239, 68, 68, 0.9)',
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: 700
                    }}>
                      {selectedStudent.status || 'Active'}
                    </span>
                    <span style={{
                      padding: '6px 14px',
                      background: 'rgba(255, 255, 255, 0.25)',
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: 600,
                      backdropFilter: 'blur(10px)'
                    }}>
                      {selectedStudent.studentType}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Body */}
            <div style={{ padding: '32px' }}>
              
              {/* Contact Information Section */}
              <div style={{ marginBottom: '28px' }}>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: 700, 
                  color: '#0f172a',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{
                    width: '4px',
                    height: '20px',
                    background: 'linear-gradient(to bottom, #667eea, #764ba2)',
                    borderRadius: '2px'
                  }}></span>
                  Contact Information
                </h3>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '16px'
                }}>
                  <div style={{
                    padding: '16px',
                    background: '#f8fafc',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>
                      Email Address
                    </div>
                    <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: 500, wordBreak: 'break-all' }}>
                      {selectedStudent.email}
                    </div>
                  </div>
                  <div style={{
                    padding: '16px',
                    background: '#f8fafc',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>
                      Mobile Number
                    </div>
                    <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: 500 }}>
                      {selectedStudent.mobile || 'Not provided'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Internship Details (if applicable) */}
              {selectedStudent.studentType === 'Internship' && (
                <div style={{ marginBottom: '28px' }}>
                  <h3 style={{ 
                    fontSize: '18px', 
                    fontWeight: 700, 
                    color: '#0f172a',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{
                      width: '4px',
                      height: '20px',
                      background: 'linear-gradient(to bottom, #667eea, #764ba2)',
                      borderRadius: '2px'
                    }}></span>
                    Internship Details
                  </h3>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '16px'
                  }}>
                    <div style={{
                      padding: '16px',
                      background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
                      borderRadius: '10px',
                      border: '1px solid #667eea30'
                    }}>
                      <div style={{ fontSize: '12px', color: '#667eea', fontWeight: 700, marginBottom: '6px' }}>
                        Domain
                      </div>
                      <div style={{ fontSize: '16px', color: '#0f172a', fontWeight: 600 }}>
                        {selectedStudent.domain || 'Not specified'}
                      </div>
                    </div>
                    <div style={{
                      padding: '16px',
                      background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
                      borderRadius: '10px',
                      border: '1px solid #667eea30'
                    }}>
                      <div style={{ fontSize: '12px', color: '#667eea', fontWeight: 700, marginBottom: '6px' }}>
                        Duration
                      </div>
                      <div style={{ fontSize: '16px', color: '#0f172a', fontWeight: 600 }}>
                        {selectedStudent.duration || 'Not specified'}
                      </div>
                    </div>
                    <div style={{
                      padding: '16px',
                      background: 'linear-gradient(135deg, #10b98115 0%, #059e6915 100%)',
                      borderRadius: '10px',
                      border: '1px solid #10b98130'
                    }}>
                      <div style={{ fontSize: '12px', color: '#059669', fontWeight: 700, marginBottom: '6px' }}>
                        Joining Date
                      </div>
                      <div style={{ fontSize: '16px', color: '#0f172a', fontWeight: 600 }}>
                        {selectedStudent.joiningDate ? new Date(selectedStudent.joiningDate).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        }) : 'Not set'}
                      </div>
                    </div>
                    <div style={{
                      padding: '16px',
                      background: 'linear-gradient(135deg, #f59e0b15 0%, #d9770615 100%)',
                      borderRadius: '10px',
                      border: '1px solid #f59e0b30'
                    }}>
                      <div style={{ fontSize: '12px', color: '#d97706', fontWeight: 700, marginBottom: '6px' }}>
                        Ending Date
                      </div>
                      <div style={{ fontSize: '16px', color: '#0f172a', fontWeight: 600 }}>
                        {selectedStudent.endingDate ? new Date(selectedStudent.endingDate).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        }) : 'Not set'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SMS Program Details (if applicable) */}
              {selectedStudent.studentType === 'SMS Program' && (
                <div style={{ marginBottom: '28px' }}>
                  <h3 style={{ 
                    fontSize: '18px', 
                    fontWeight: 700, 
                    color: '#0f172a',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{
                      width: '4px',
                      height: '20px',
                      background: 'linear-gradient(to bottom, #f093fb, #f5576c)',
                      borderRadius: '2px'
                    }}></span>
                    SMS Program Details
                  </h3>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '16px'
                  }}>
                    <div style={{
                      padding: '16px',
                      background: 'linear-gradient(135deg, #f093fb15 0%, #f5576c15 100%)',
                      borderRadius: '10px',
                      border: '1px solid #f093fb30'
                    }}>
                      <div style={{ fontSize: '12px', color: '#ec4899', fontWeight: 700, marginBottom: '6px' }}>
                        Gender
                      </div>
                      <div style={{ fontSize: '16px', color: '#0f172a', fontWeight: 600 }}>
                        {selectedStudent.gender || 'Not specified'}
                      </div>
                    </div>
                    <div style={{
                      padding: '16px',
                      background: 'linear-gradient(135deg, #f093fb15 0%, #f5576c15 100%)',
                      borderRadius: '10px',
                      border: '1px solid #f093fb30'
                    }}>
                      <div style={{ fontSize: '12px', color: '#ec4899', fontWeight: 700, marginBottom: '6px' }}>
                        Current Designation
                      </div>
                      <div style={{ fontSize: '16px', color: '#0f172a', fontWeight: 600 }}>
                        {selectedStudent.currentDesignation || 'Not specified'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Payment Information */}
                  {(selectedStudent.paymentDoneBy || selectedStudent.transactionId) && (
                    <div style={{ marginTop: '16px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#64748b', marginBottom: '12px' }}>
                        Payment Information
                      </h4>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                        gap: '16px'
                      }}>
                        <div style={{
                          padding: '14px',
                          background: '#f8fafc',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0'
                        }}>
                          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>
                            Payment Done By
                          </div>
                          <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: 500 }}>
                            {selectedStudent.paymentDoneBy || 'Not specified'}
                          </div>
                        </div>
                        <div style={{
                          padding: '14px',
                          background: '#f8fafc',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0'
                        }}>
                          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>
                            Transaction ID
                          </div>
                          <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: 500, fontFamily: 'monospace' }}>
                            {selectedStudent.transactionId || 'Not provided'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Quick Actions */}
              <div style={{
                display: 'flex',
                gap: '12px',
                marginTop: '32px',
                paddingTop: '24px',
                borderTop: '2px solid #f1f5f9'
              }}>
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    handleEdit(selectedStudent);
                  }}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 700,
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                  }}
                >
                  Edit Profile
                </button>
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    handleViewCertificates(selectedStudent);
                  }}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    background: 'white',
                    color: '#667eea',
                    border: '2px solid #667eea',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 700,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#667eea';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.color = '#667eea';
                  }}
                >
                  View Certificates
                </button>
                <button
                  onClick={() => setShowProfileModal(false)}
                  style={{
                    padding: '12px 24px',
                    background: '#f1f5f9',
                    color: '#64748b',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 700,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e2e8f0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f1f5f9';
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedStudent && editForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            maxWidth: '600px',
            width: '95%'
          }}>
            <h2 style={{ marginTop: 0 }}>Edit Student</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>Full Name</label>
                <input value={editForm.name} onChange={(e) => handleEditChange('name', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e5e7eb' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>Email</label>
                <input value={editForm.email} onChange={(e) => handleEditChange('email', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e5e7eb' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>Mobile</label>
                <input value={editForm.mobile} onChange={(e) => handleEditChange('mobile', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e5e7eb' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>Current Designation</label>
                <input value={editForm.currentDesignation} onChange={(e) => handleEditChange('currentDesignation', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e5e7eb' }} />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>Student Type</label>
                <input value={editForm.studentType} disabled style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#f8fafc' }} />
              </div>

              {editForm.studentType === 'Internship' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>Domain</label>
                    <input value={editForm.domain} onChange={(e) => handleEditChange('domain', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e5e7eb' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>Duration</label>
                    <input value={editForm.duration} onChange={(e) => handleEditChange('duration', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e5e7eb' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>Joining Date</label>
                    <input type="date" value={editForm.joiningDate} onChange={(e) => handleEditChange('joiningDate', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e5e7eb' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>Ending Date</label>
                    <input type="date" value={editForm.endingDate} onChange={(e) => handleEditChange('endingDate', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e5e7eb' }} />
                  </div>
                </>
              )}

              {editForm.studentType === 'SMS Program' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>Payment Done By</label>
                    <input value={editForm.paymentDoneBy} onChange={(e) => handleEditChange('paymentDoneBy', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e5e7eb' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>Transaction ID</label>
                    <input value={editForm.transactionId} onChange={(e) => handleEditChange('transactionId', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e5e7eb' }} />
                  </div>
                </>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
              <button onClick={handleSaveEdit} style={{ flex: 1, padding: '10px 16px', background : '#10b981' , color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>Save</button>
              <button onClick={() => setShowEditModal(false)} style={{ flex: 1, padding: '10px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Management Modal */}
      {showCertificateModal && selectedStudent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '700px',
            width: '95%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>Manage Certificates - {selectedStudent.name}</h2>
              <button
                onClick={() => setShowCertificateModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '0',
                  width: '30px',
                  height: '30px',
                  color: '#64748b'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '24px', padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>Student Information</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>{selectedStudent.internId} • {selectedStudent.studentType}</div>
            </div>

            {/* Upload Section */}
            <div style={{
              padding: '20px',
              background: '#eff6ff',
              borderRadius: '10px',
              marginBottom: '24px',
              border: '2px dashed #3b82f6'
            }}>
              <h3 style={{ marginTop: 0, fontSize: '16px', color: '#1e40af' }}>Upload New Certificate</h3>
              
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#0f172a' }}>
                  Certificate Type
                </label>
                <select
                  value={certificateType}
                  onChange={(e) => setCertificateType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px'
                  }}
                >
                  <option value="offerLetter">Offer Letter</option>
                  <option value="welcomeLetter">Welcome Letter</option>
                  <option value="paymentReceipt">Payment Receipt</option>
                  <option value="completionCertificate">Completion Certificate</option>
                  <option value="experienceLetter">Experience Letter</option>
                  <option value="other">Other Certificate</option>
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#0f172a' }}>
                  Select PDF File
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setCertificateFile(e.target.files[0])}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: 'white'
                  }}
                />
                {certificateFile && (
                  <div style={{ marginTop: '8px', fontSize: '13px', color: '#059669', fontWeight: 500 }}>
                    Selected: {certificateFile.name}
                  </div>
                )}
              </div>

              <button
                onClick={handleCertificateUpload}
                disabled={uploadingCert || !certificateFile}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: uploadingCert || !certificateFile ? '#cbd5e1' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: uploadingCert || !certificateFile ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 600
                }}
              >
                {uploadingCert ? 'Uploading...' : 'Upload Certificate'}
              </button>
            </div>

            {/* Existing Certificates */}
            <div>
              <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#0f172a' }}>Existing Certificates</h3>
              
              <div style={{ display: 'grid', gap: '12px' }}>
                {/* Offer Letter */}
                <div style={{
                  padding: '12px',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>Offer Letter</div>
                    {selectedStudent.documents?.offerLetter && (
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                        Uploaded: {new Date(selectedStudent.documents.offerLetter.uploadedAt || Date.now()).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div>
                    {selectedStudent.documents?.offerLetter ? (
                      <a
                        href={`http://localhost:5000/uploads/students/${selectedStudent.documents.offerLetter.filename}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: '8px 16px',
                          background: '#10b981',
                          color: 'white',
                          textDecoration: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: 600
                        }}
                      >
                        View
                      </a>
                    ) : (
                      <span style={{ fontSize: '13px', color: '#94a3b8' }}>Not uploaded</span>
                    )}
                  </div>
                </div>

                {/* Welcome Letter */}
                <div style={{
                  padding: '12px',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>Welcome Letter</div>
                    {selectedStudent.documents?.welcomeLetter && (
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                        Uploaded: {new Date(selectedStudent.documents.welcomeLetter.uploadedAt || Date.now()).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div>
                    {selectedStudent.documents?.welcomeLetter ? (
                      <a
                        href={`http://localhost:5000/uploads/students/${selectedStudent.documents.welcomeLetter.filename}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: '8px 16px',
                          background: '#10b981',
                          color: 'white',
                          textDecoration: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: 600
                        }}
                      >
                        View
                      </a>
                    ) : (
                      <span style={{ fontSize: '13px', color: '#94a3b8' }}>Not uploaded</span>
                    )}
                  </div>
                </div>

                {/* Payment Receipt */}
                <div style={{
                  padding: '12px',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>Payment Receipt</div>
                    {selectedStudent.documents?.paymentReceipt && (
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                        Uploaded: {new Date(selectedStudent.documents.paymentReceipt.uploadedAt || Date.now()).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div>
                    {selectedStudent.documents?.paymentReceipt ? (
                      <a
                        href={`http://localhost:5000/uploads/students/${selectedStudent.documents.paymentReceipt.filename}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: '8px 16px',
                          background: '#10b981',
                          color: 'white',
                          textDecoration: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: 600
                        }}
                      >
                        View
                      </a>
                    ) : (
                      <span style={{ fontSize: '13px', color: '#94a3b8' }}>Not uploaded</span>
                    )}
                  </div>
                </div>

                {/* Other Certificates */}
                {selectedStudent.documents?.otherCertificates && selectedStudent.documents.otherCertificates.length > 0 && (
                  <div style={{
                    padding: '12px',
                    background: '#f8fafc',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>Other Certificates</div>
                    {selectedStudent.documents.otherCertificates.map((cert, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 0',
                        borderTop: index > 0 ? '1px solid #e2e8f0' : 'none'
                      }}>
                        <span style={{ fontSize: '13px', color: '#475569' }}>{cert.name || cert.filename}</span>
                        <a
                          href={`http://localhost:5000/uploads/students/${cert.filename}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: '6px 12px',
                            background: '#10b981',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600
                          }}
                        >
                          View
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowCertificateModal(false)}
              style={{
                marginTop: '20px',
                padding: '10px 20px',
                background: '#64748b',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                width: '100%'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default ViewInterns;
