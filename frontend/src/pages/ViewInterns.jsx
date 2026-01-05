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
  const [editForm, setEditForm] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

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
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
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
                  <span>📧</span>
                  <span style={{ wordBreak: 'break-all' }}>{student.email}</span>
                </div>
                
                {student.mobile && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#64748b' }}>
                    <span>📱</span>
                    <span>{student.mobile}</span>
                  </div>
                )}

                {(student.domain || student.currentDesignation) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#64748b' }}>
                    <span>💼</span>
                    <span>{student.domain || student.currentDesignation}</span>
                  </div>
                )}

                {student.duration && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#64748b' }}>
                    <span>⏱️</span>
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
                    👤 View Profile
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
                    ✏️ Edit Details
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
                    {(student.status || '').toLowerCase() === 'active' ? '🔴 Mark Inactive' : '🟢 Mark Active'}
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
                    🗑️ Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* View Profile Modal */}
      {showProfileModal && selectedStudent && (
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
              padding: '36px',
              maxWidth: '900px',
              width: '95%',
              maxHeight: '92vh',
              overflowY: 'auto'
            }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>Student Profile</h2>
              <button
                onClick={() => setShowProfileModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '0',
                  width: '30px',
                  height: '30px'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'grid', gap: '15px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: '5px' }}>Student ID</label>
                <p style={{ margin: 0, fontWeight: 600, color: '#1e40af' }}>{selectedStudent.internId}</p>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: '5px' }}>Full Name</label>
                <p style={{ margin: 0 }}>{selectedStudent.name}</p>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: '5px' }}>Email</label>
                <p style={{ margin: 0 }}>{selectedStudent.email}</p>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: '5px' }}>Mobile Number</label>
                <p style={{ margin: 0 }}>{selectedStudent.mobile || 'N/A'}</p>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: '5px' }}>Student Type</label>
                <p style={{ margin: 0 }}>{selectedStudent.studentType}</p>
              </div>

              {selectedStudent.studentType === 'Internship' && (
                <>
                  <div>
                    <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: '5px' }}>Domain</label>
                    <p style={{ margin: 0 }}>{selectedStudent.domain || 'N/A'}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: '5px' }}>Duration</label>
                    <p style={{ margin: 0 }}>{selectedStudent.duration || 'N/A'}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: '5px' }}>Joining Date</label>
                    <p style={{ margin: 0 }}>{selectedStudent.joiningDate ? new Date(selectedStudent.joiningDate).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: '5px' }}>Ending Date</label>
                    <p style={{ margin: 0 }}>{selectedStudent.endingDate ? new Date(selectedStudent.endingDate).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </>
              )}

              {selectedStudent.studentType === 'SMS Program' && (
                <>
                  <div>
                    <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: '5px' }}>Gender</label>
                    <p style={{ margin: 0 }}>{selectedStudent.gender || 'N/A'}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: '5px' }}>Current Designation</label>
                    <p style={{ margin: 0 }}>{selectedStudent.currentDesignation || 'N/A'}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: '5px' }}>Payment Done By</label>
                    <p style={{ margin: 0 }}>{selectedStudent.paymentDoneBy || 'N/A'}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: '5px' }}>Transaction ID</label>
                    <p style={{ margin: 0 }}>{selectedStudent.transactionId || 'N/A'}</p>
                  </div>
                </>
              )}

              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: '5px' }}>Status</label>
                <span style={{
                  padding: '4px 12px',
                  background: selectedStudent.status === 'Active' ? '#d1fae5' : '#fee2e2',
                  color: selectedStudent.status === 'Active' ? '#065f46' : '#dc2626',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontWeight: 600
                }}>
                  {selectedStudent.status}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowProfileModal(false)}
              style={{
                marginTop: '20px',
                padding: '10px 20px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
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
    </>
  );
}

export default ViewInterns;
