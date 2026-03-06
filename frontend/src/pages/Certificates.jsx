import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

function Certificates() {
  const [students, setStudents] = useState([]);
  const [category, setCategory] = useState('All');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [fileRows, setFileRows] = useState([{ id: 1, name: '', file: null }]);
  const [submitting, setSubmitting] = useState(false);
  const [certs, setCerts] = useState([]);
  const [loadingCerts, setLoadingCerts] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStudents();
    fetchCerts();
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

  const getTimeRemaining = (expiresAt) => {
    const diff = new Date(expiresAt) - new Date();
    if (diff <= 0) return { text: 'Expired', color: '#dc2626', bg: '#fee2e2' };
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const color = days >= 3 ? '#059669' : days >= 1 ? '#d97706' : '#dc2626';
    const bg = days >= 3 ? '#d1fae5' : days >= 1 ? '#fef3c7' : '#fee2e2';
    return { text: `${days}d ${hours}h left`, color, bg };
  };

  const filteredStudents = students.filter(s => category === 'All' || s.studentType === category);

  return (
    <>
      <div className="content-header">
        <h1>Certificates</h1>
        <p>Assign certificates to students â€” available for download for 5 days, then auto-deleted</p>
      </div>

      {/* â”€â”€ Assign Form â”€â”€ */}
      <div className="card">
        <h3 style={{ marginBottom: '20px', color: '#0f172a', fontSize: '18px' }}>Assign Certificates to Student</h3>

        {error && <div className="error-message" style={{ marginBottom: '16px' }}>{error}</div>}
        {message && <div className="success-message" style={{ marginBottom: '16px' }}>{message}</div>}

        <form onSubmit={handleAssign}>
          {/* Category + Student row */}
          <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px', color: '#0f172a' }}>
                Category
              </label>
              <select
                value={category}
                onChange={e => { setCategory(e.target.value); setSelectedStudent(''); }}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '2px solid #e2e8f0', fontSize: '14px', background: '#f8fafc' }}
              >
                <option value="All">All</option>
                <option value="Internship">Internship</option>
                <option value="SMS Program">SMS Program</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px', color: '#0f172a' }}>
                Select Student *
              </label>
              <select
                value={selectedStudent}
                onChange={e => setSelectedStudent(e.target.value)}
                required
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '2px solid #e2e8f0', fontSize: '14px', background: '#f8fafc' }}
              >
                <option value="">Choose a student...</option>
                {filteredStudents.map(s => (
                  <option key={s._id} value={s._id}>
                    {s.internId} â€” {s.name} ({s.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* File rows */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', fontSize: '14px', color: '#0f172a' }}>
              Certificates to Assign
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
                      Ã—
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
              background: submitting ? '#94a3b8' : 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
              color: 'white', border: 'none', borderRadius: '9px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontSize: '15px', fontWeight: '700',
              boxShadow: submitting ? 'none' : '0 4px 12px rgba(37,99,235,0.25)'
            }}
          >
            {submitting ? 'Assigning...' : 'Assign Certificates'}
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
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student</th>
                  <th>Certificate Name</th>
                  <th>Assigned On</th>
                  <th>Expires On</th>
                  <th>Time Remaining</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {certs.map((cert, index) => {
                  const tr = getTimeRemaining(cert.expiresAt);
                  return (
                    <tr key={cert._id}>
                      <td style={{ color: '#94a3b8', fontSize: '13px' }}>{index + 1}</td>
                      <td>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>{cert.studentId?.name || 'â€”'}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                          {cert.studentId?.internId} Â· {cert.studentId?.studentType}
                        </div>
                      </td>
                      <td style={{ fontWeight: '500', color: '#0f172a' }}>{cert.name}</td>
                      <td style={{ fontSize: '13px', color: '#475569', whiteSpace: 'nowrap' }}>
                        {new Date(cert.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ fontSize: '13px', color: '#475569', whiteSpace: 'nowrap' }}>
                        {new Date(cert.expiresAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td>
                        <span style={{
                          padding: '4px 10px', borderRadius: '6px',
                          fontSize: '12px', fontWeight: '700',
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
