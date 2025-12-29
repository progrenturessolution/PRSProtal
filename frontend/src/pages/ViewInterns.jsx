import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

function ViewInterns({ onInternDeleted }) {
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchInterns();
  }, []);

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

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) {
      return;
    }

    try {
      await adminAPI.deleteIntern(id);
      setInterns(interns.filter(intern => intern._id !== id));
      alert('Intern deleted successfully');
      
      // Notify parent to refresh stats
      if (onInternDeleted) {
        onInternDeleted();
      }
    } catch (err) {
      alert('Failed to delete intern');
      console.error(err);
    }
  };

  const handleStatusToggle = async (student) => {
    const newStatus = student.status === 'Active' ? 'Inactive' : 'Active';
    
    try {
      await adminAPI.updateInternStatus(student._id, newStatus);
      setInterns(interns.map(intern => 
        intern._id === student._id ? { ...intern, status: newStatus } : intern
      ));
      setOpenMenuId(null);
      alert(`Student ${newStatus === 'Active' ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      alert('Failed to update status');
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
    setShowEditModal(true);
    setOpenMenuId(null);
  };

  const toggleMenu = (id) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (openMenuId) setOpenMenuId(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  if (loading) {
    return (
      <div className="content-header">
        <h1>Loading...</h1>
      </div>
    );
  }

  return (
    <>
      <div className="content-header">
        <h1>All Interns</h1>
        <p>Manage and view all registered interns</p>
      </div>

      {error && (
        <div style={{
          padding: '16px',
          marginBottom: '20px',
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          color: '#dc2626',
          fontSize: '14px',
          fontWeight: 500
        }}>
          ❌ {error}
        </div>
      )}

      <div className="card">
        {interns.length === 0 ? (
          <div className="empty-state">
            <p>No students found. Add your first student to get started.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Full Name</th>
                  <th>Mobile Number</th>
                  <th>Email</th>
                  <th>Current Designation</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {interns.map((student) => (
                  <tr key={student._id}>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        background: '#eff6ff',
                        color: '#1e40af',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontWeight: 600
                      }}>
                        {student.internId}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{student.name}</td>
                    <td>{student.mobile || 'N/A'}</td>
                    <td>{student.email}</td>
                    <td>{student.currentDesignation || student.domain || 'N/A'}</td>
                    <td style={{ textAlign: 'center', position: 'relative' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMenu(student._id);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '20px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                      >
                        ⋮
                      </button>

                      {openMenuId === student._id && (
                        <div style={{
                          position: 'absolute',
                          right: '10px',
                          top: '35px',
                          background: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                          zIndex: 1000,
                          minWidth: '180px',
                          overflow: 'hidden'
                        }}>
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
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
                            onMouseLeave={(e) => e.target.style.background = 'white'}
                          >
                            <span>👤</span>
                            <span>View Profile</span>
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
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
                            onMouseLeave={(e) => e.target.style.background = 'white'}
                          >
                            <span>✏️</span>
                            <span>Edit</span>
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
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              transition: 'background 0.2s',
                              color: '#dc2626'
                            }}
                            onMouseEnter={(e) => e.target.style.background = '#fef2f2'}
                            onMouseLeave={(e) => e.target.style.background = 'white'}
                          >
                            <span>🗑️</span>
                            <span>Delete</span>
                          </button>

                          <div style={{
                            height: '1px',
                            background: '#e5e7eb',
                            margin: '4px 0'
                          }} />

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
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              transition: 'background 0.2s',
                              color: student.status === 'Active' ? '#f59e0b' : '#10b981'
                            }}
                            onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
                            onMouseLeave={(e) => e.target.style.background = 'white'}
                          >
                            <span>{student.status === 'Active' ? '⏸️' : '✓'}</span>
                            <span>{student.status === 'Active' ? 'Deactivate' : 'Activate'}</span>
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
            padding: '30px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
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

      {/* Edit Modal Placeholder */}
      {showEditModal && selectedStudent && (
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
            padding: '30px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h2>Edit Student</h2>
            <p style={{ color: '#6b7280', marginTop: '10px' }}>
              Edit functionality will be implemented here.
            </p>
            <button
              onClick={() => setShowEditModal(false)}
              style={{
                marginTop: '20px',
                padding: '10px 20px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600
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
