import { useState, useEffect, useRef } from 'react';
import { adminAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

function Certificates() {
  const [students, setStudents] = useState([]);
  const [category, setCategory] = useState('All');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);
  const [fileRows, setFileRows] = useState([{ id: 1, name: '', file: null }]);
  const [submitting, setSubmitting] = useState(false);
  const [certs, setCerts] = useState([]);
  const [loadingCerts, setLoadingCerts] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const searchInputRef = useRef(null);

  useEffect(() => {
    fetchStudents();
    fetchCerts();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('[data-student-dropdown]')) {
        setIsStudentDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await adminAPI.getAllInterns();
      if (res.data.success) setStudents(res.data.interns);
    } catch (e) {
      console.error('Failed to fetch students:', e);
    }
  };

  const fetchCerts = async () => {
    try {
      setLoadingCerts(true);
      const res = await adminAPI.getCertificates();
      if (res.data.success) setCerts(res.data.certificates);
    } catch (e) {
      console.error('Failed to fetch certificates:', e);
    } finally {
      setLoadingCerts(false);
    }
  };

  const addRow = () => {
    setFileRows(prev => [...prev, { id: Date.now(), name: '', file: null }]);
  };

  const removeRow = (id) => {
    setFileRows(prev => prev.filter(r => r.id !== id));
  };

  const updateRow = (id, key, value) => {
    setFileRows(prev => prev.map(r => r.id === id ? { ...r, [key]: value } : r));
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!selectedStudent) {
      setError('Please select a student.');
      return;
    }

    const validRows = fileRows.filter(r => r.file);
    if (validRows.length === 0) {
      setError('Please add at least one certificate file.');
      return;
    }

    const fd = new FormData();
    fd.append('studentId', selectedStudent);
    const names = validRows.map(r => r.name || r.file.name.replace(/\.[^.]+$/, ''));
    fd.append('names', JSON.stringify(names));
    validRows.forEach(r => fd.append('certificates', r.file));

    setSubmitting(true);
    try {
      const res = await adminAPI.assignCertificates(fd);
      if (res.data.success) {
        setMessage(`âœ… ${res.data.certificates.length} certificate(s) assigned. Student has 5 days to download.`);
        setSelectedStudent('');
        setFileRows([{ id: 1, name: '', file: null }]);
        fetchCerts();
        setTimeout(() => setMessage(''), 6000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign certificates. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (id) => {
    if (!window.confirm('Revoke and permanently delete this certificate?')) return;
    try {
      await adminAPI.deleteCertificate(id);
      setCerts(prev => prev.filter(c => c._id !== id));
    } catch (e) {
      console.error('Revoke error:', e);
    }
  };

  const filterStudentsBySearch = (query) => {
    let filtered = students;
    if (category !== 'All') {
      filtered = filtered.filter(s => s.studentType === category);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      filtered = filtered.filter(s =>
        s.name?.toLowerCase().includes(q) ||
        s.internId?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.studentType?.toLowerCase().includes(q)
      );
    }
    return filtered;
  };

  const getTimeRemaining = (expiresAt) => {
    const diff = new Date(expiresAt) - new Date();
    if (diff <= 0) return { text: 'Expired', color: '#dc2626', bg: '#fee2e2' };
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const color = days >= 3 ? '#059669' : days >= 1 ? '#d97706' : '#dc2626';
    const bg = days >= 3 ? '#d1fae5' : days >= 1 ? '#fef3c7' : '#fee2e2';
    return { text: `${days}d ${hours}h left`, color, bg };
  };

  const tableCellStyle = {
    fontSize: '14px',
    fontWeight: '500',
    color: '#475569',
    fontFamily: 'inherit',
  };

  const tableSubTextStyle = {
    fontSize: '13px',
    fontWeight: '500',
    color: '#64748b',
    marginTop: '2px',
    fontFamily: 'inherit',
  };

  const selectedStudentObj = students.find((s) => s._id === selectedStudent);

  return (
    <>
      <div className="content-header">
        <h1>Documents</h1>
        <p>Assign certificates to students - available for download for 5 days, then auto-deleted</p>
      </div>

      {/* â”€â”€ Assign Form â”€â”€ */}
      <div className="card">
        <h3 style={{ marginBottom: '20px', color: '#0f172a', fontSize: '18px' }}>Assign Document to Student</h3>

        {error && <div className="error-message" style={{ marginBottom: '16px' }}>{error}</div>}
        {message && <div className="success-message" style={{ marginBottom: '16px' }}>{message}</div>}

        <form onSubmit={handleAssign}>
          {/* Student selection */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#0f172a' }}>
                Category
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['All', 'Internship', 'SMS Program'].map((cat) => {
                  const isActive = category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setCategory(cat);
                        setSelectedStudent('');
                        setStudentSearch('');
                      }}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '999px',
                        border: isActive ? '1px solid #1d4ed8' : '1px solid #cbd5e1',
                        background: isActive ? '#dbeafe' : '#f8fafc',
                        color: isActive ? '#1e40af' : '#475569',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer',
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', fontSize: '14px', color: '#0f172a' }}>
                Select Student *
              </label>
              
              <div data-student-dropdown style={{ position: 'relative' }}>
                {/* Dropdown Trigger */}
                <div
                  onClick={() => setIsStudentDropdownOpen(!isStudentDropdownOpen)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: `2px solid ${isStudentDropdownOpen ? '#3b82f6' : '#e2e8f0'}`,
                    background: '#f8fafc',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s',
                    color: selectedStudent ? '#0f172a' : '#94a3b8'
                  }}
                >
                  <span>
                    {selectedStudent 
                      ? `${students.find(s => s._id === selectedStudent)?.internId} - ${students.find(s => s._id === selectedStudent)?.name}`
                      : 'Search & Select Student...'}
                  </span>
                  <span style={{ fontSize: '12px', transition: 'transform 0.2s', transform: isStudentDropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }}>
                    ▼
                  </span>
                </div>

                {/* Dropdown List */}
                {isStudentDropdownOpen && (
                  <div
                    data-student-dropdown
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '8px',
                      background: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                      zIndex: 1000,
                      overflow: 'hidden'
                    }}
                  >
                    {/* Search Input */}
                    <div style={{ padding: '12px', borderBottom: '1px solid #f1f5f9' }}>
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        placeholder="Search by ID, name, email..."
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          fontSize: '13px',
                          background: '#f8fafc',
                          outline: 'none'
                        }}
                        autoFocus
                      />
                    </div>

                    {/* Student List */}
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {filterStudentsBySearch(studentSearch).length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                          No students match your search
                        </div>
                      ) : (
                        filterStudentsBySearch(studentSearch).map((s) => {
                          const isSelected = selectedStudent === s._id;
                          const initials = s.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                          return (
                            <div
                              key={s._id}
                              data-student-dropdown
                              onClick={() => {
                                setSelectedStudent(s._id);
                                setIsStudentDropdownOpen(false);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px 14px',
                                borderBottom: '1px solid #f1f5f9',
                                cursor: 'pointer',
                                background: isSelected ? '#eff6ff' : 'transparent',
                                transition: 'all 0.2s',
                                borderLeft: isSelected ? '4px solid #3b82f6' : '4px solid transparent',
                                paddingLeft: isSelected ? '10px' : '14px'
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) e.currentTarget.style.background = '#f8fafc';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = isSelected ? '#eff6ff' : 'transparent';
                              }}
                            >
                              {/* Avatar */}
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '8px',
                                  background: isSelected ? '#dbeafe' : '#e2e8f0',
                                  color: isSelected ? '#1e40af' : '#475569',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  flexShrink: 0
                                }}
                              >
                                {initials}
                              </div>

                              {/* Student Info */}
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                                  {s.internId} - {s.name}
                                </div>
                                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                  {s.email}
                                </div>
                              </div>

                              {/* Type Badge */}
                              <span
                                style={{
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  background: s.studentType === 'Internship' ? '#dbeafe' : '#fef3c7',
                                  color: s.studentType === 'Internship' ? '#1e40af' : '#92400e',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {s.studentType}
                              </span>

                              {/* Checkmark */}
                              {isSelected && (
                                <span style={{ fontSize: '18px', color: '#10b981' }}>✓</span>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Selected Summary */}
              {selectedStudent && (
                <div
                  style={{
                    marginTop: '12px',
                    padding: '10px 12px',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#1e40af'
                  }}
                >
                  ✓ Student selected and ready to assign documents
                </div>
              )}
            </div>
          </div>

          {/* File rows */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', fontSize: '14px', color: '#0f172a' }}>
              Documents to Assign
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {fileRows.map((row) => (
                <div
                  key={row.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr auto',
                    gap: '10px',
                    alignItems: 'center',
                    padding: '12px 14px',
                    background: '#f8fafc',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <input
                    type="text"
                    placeholder="Certificate label (e.g. Completion Certificate)"
                    value={row.name}
                    onChange={e => updateRow(row.id, 'name', e.target.value)}
                    style={{ padding: '9px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '14px', background: 'white' }}
                  />
                  <div style={{ position: 'relative' }}>
                    <input
                      type="file"
                      id={`file-input-${row.id}`}
                      accept=".pdf"
                      onChange={e => updateRow(row.id, 'file', e.target.files[0] || null)}
                      style={{ display: 'none' }}
                    />
                    <label
                      htmlFor={`file-input-${row.id}`}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        gap: '8px', padding: '9px 12px', borderRadius: '7px', cursor: 'pointer',
                        border: row.file ? '2px solid #22c55e' : '2px dashed #94a3b8',
                        background: row.file ? '#f0fdf4' : '#f8fafc',
                        fontSize: '13px', color: row.file ? '#15803d' : '#64748b',
                        transition: 'all 0.2s', whiteSpace: 'nowrap', overflow: 'hidden'
                      }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                        {row.file ? row.file.name : '📎 Choose PDF...'}
                      </span>
                      {row.file && (
                        <span style={{
                          flexShrink: 0, width: '22px', height: '22px',
                          background: '#22c55e', color: 'white', borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '13px', fontWeight: '900', lineHeight: '1'
                        }}>
                          ✓
                        </span>
                      )}
                    </label>
                  </div>
                  {fileRows.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      style={{
                        width: '34px', height: '34px', padding: '0',
                        background: '#fee2e2', color: '#dc2626',
                        border: 'none', borderRadius: '7px',
                        cursor: 'pointer', fontWeight: '700', fontSize: '18px', lineHeight: '1'
                      }}
                    >
                      X
                    </button>
                  ) : (
                    <div style={{ width: '34px' }} />
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addRow}
              style={{
                marginTop: '10px', padding: '8px 18px',
                background: '#eff6ff', color: '#2563eb',
                border: '1px dashed #93c5fd', borderRadius: '8px',
                cursor: 'pointer', fontSize: '14px', fontWeight: '600'
              }}
            >
              + Add Another Certificate
            </button>
          </div>

          {/* 5-day notice */}
          <div style={{
            padding: '12px 16px', background: '#fffbeb',
            borderRadius: '8px', border: '1px solid #fde68a',
            marginBottom: '20px', fontSize: '13px', color: '#92400e',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            â° <span><strong>5-day download window:</strong> The student has exactly 5 days to download. Certificates are permanently deleted after that.</span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '12px 32px',
              background: submitting ? '#94a3b8' : '#344158',
              color: 'white', border: 'none', borderRadius: '9px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontSize: '15px', fontWeight: '700',
              boxShadow: submitting ? 'none' : '0 4px 12px rgba(50,65,88,0.25)'
            }}
          >
            {submitting ? (
              <LoadingSpinner text="Assigning..." inline size="sm" />
            ) : (
              'Assign Document'
            )}
          </button>
        </form>
      </div>

      {/* â”€â”€ Assigned Certificates Table â”€â”€ */}
      <div className="card" style={{ marginTop: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ color: '#0f172a', fontSize: '18px', margin: 0 }}>
            Active Assigned Certificates
            {certs.length > 0 && (
              <span style={{ marginLeft: '10px', padding: '2px 10px', background: '#eff6ff', color: '#2563eb', borderRadius: '12px', fontSize: '13px', fontWeight: '700' }}>
                {certs.length}
              </span>
            )}
          </h3>
          <button
            onClick={fetchCerts}
            style={{
              padding: '7px 16px', background: '#f1f5f9', color: '#475569',
              border: '1px solid #e2e8f0', borderRadius: '7px',
              cursor: 'pointer', fontSize: '13px', fontWeight: '600'
            }}
          >
            â†» Refresh
          </button>
        </div>

        {loadingCerts ? (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '30px' }}>Loading certificates...</p>
        ) : certs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b' }}>
            <div style={{ fontSize: '44px', marginBottom: '12px' }}>ðŸ“„</div>
            <p style={{ fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>No active certificates</p>
            <p style={{ fontSize: '13px' }}>Assign certificates above and they will appear here.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table certificates-table">
              <thead>
                <tr style={{ background: '#344158' }}>
                  <th style={{ background: '#344158', color: '#ffffff' }}>#</th>
                  <th style={{ background: '#344158', color: '#ffffff' }}>Student</th>
                  <th style={{ background: '#344158', color: '#ffffff' }}>Certificate Name</th>
                  <th style={{ background: '#344158', color: '#ffffff' }}>Assigned On</th>
                  <th style={{ background: '#344158', color: '#ffffff' }}>Expires On</th>
                  <th style={{ background: '#344158', color: '#ffffff' }}>Time Remaining</th>
                  <th style={{ background: '#344158', color: '#ffffff' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {certs.map((cert, index) => {
                  const tr = getTimeRemaining(cert.expiresAt);
                  return (
                    <tr key={cert._id}>
                      <td style={tableCellStyle}>{index + 1}</td>
                      <td>
                        <div style={tableCellStyle}>{cert.studentId?.name || '-'}</div>
                        <div style={tableSubTextStyle}>
                          {cert.studentId?.internId} | {cert.studentId?.studentType}
                        </div>
                      </td>
                      <td style={tableCellStyle}>{cert.name}</td>
                      <td style={{ ...tableCellStyle, whiteSpace: 'nowrap' }}>
                        {new Date(cert.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ ...tableCellStyle, whiteSpace: 'nowrap' }}>
                        {new Date(cert.expiresAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td>
                        <span style={{
                          padding: '4px 10px', borderRadius: '6px',
                          fontSize: '14px', fontWeight: '500',
                          background: tr.bg, color: tr.color, whiteSpace: 'nowrap'
                        }}>
                          {tr.text}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleRevoke(cert._id)}
                          style={{
                            padding: '6px 14px', background: '#fee2e2', color: '#dc2626',
                            border: 'none', borderRadius: '6px',
                            cursor: 'pointer', fontSize: '13px', fontWeight: '600'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fecaca'}
                          onMouseLeave={e => e.currentTarget.style.background = '#fee2e2'}
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

export default Certificates;
