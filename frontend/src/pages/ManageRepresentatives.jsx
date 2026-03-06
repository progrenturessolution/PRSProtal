import { useState, useEffect } from 'react';
import { adminRepAPI } from '../services/api';

function ManageRepresentatives() {
  const [activeTab, setActiveTab] = useState('list');
  const [representatives, setRepresentatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    mobile: '',
    college: '',
    course: '',
    department: '',
    year: '',
    designation: 'Campus Representative',
    sheetLinks: '',
    upiId: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchRepresentatives();
  }, []);

  const fetchRepresentatives = async () => {
    try {
      setLoading(true);
      const res = await adminRepAPI.getAllRepresentatives();
      if (res.data.success) setRepresentatives(res.data.representatives);
    } catch (err) {
      console.error('Fetch reps error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!formData.name || !formData.email || !formData.password) {
      setError('Name, email and password are required.');
      return;
    }
    try {
      setSubmitting(true);
      const res = await adminRepAPI.addRepresentative(formData);
      if (res.data.success) {
        setSuccess('Representative added successfully!');
        setFormData({
          name: '', email: '', password: '', mobile: '',
          college: '', course: '', department: '', year: '',
          designation: 'Campus Representative', sheetLinks: '', upiId: ''
        });
        fetchRepresentatives();
        setTimeout(() => { setSuccess(''); setActiveTab('list'); }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add representative');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete representative "${name}"? This cannot be undone.`)) return;
    try {
      await adminRepAPI.deleteRepresentative(id);
      setRepresentatives(prev => prev.filter(r => r._id !== id));
      setSuccess('Representative deleted.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete representative');
      setTimeout(() => setError(''), 3000);
    }
  };

  const totalReps = representatives.length;
  const activeReps = representatives.filter(r => r.status === 'active').length;

  return (
    <div>
      <div className="premium-page-header">
        <div className="header-left">
          <h1>Representative Management</h1>
          <p className="header-subtitle">Add and manage campus representatives</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="premium-stats-grid" style={{ marginBottom: '24px' }}>
        <div className="premium-stat-card accent-blue">
          <div className="stat-icon-wrapper">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M16 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Representatives</div>
            <div className="stat-value">{totalReps}</div>
            <div className="stat-meta">All registered</div>
          </div>
        </div>
        <div className="premium-stat-card accent-teal">
          <div className="stat-icon-wrapper">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">Active</div>
            <div className="stat-value">{activeReps}</div>
            <div className="stat-meta">Currently active</div>
          </div>
        </div>
      </div>

      {success && <div className="success-message" style={{ marginBottom: '16px' }}>{success}</div>}
      {error && <div className="error-message" style={{ marginBottom: '16px' }}>{error}</div>}

      {/* Tab Nav */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {[
          { key: 'list', label: 'All Representatives' },
          { key: 'add', label: '+ Add Representative' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '9px 20px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              background: activeTab === tab.key
                ? 'linear-gradient(135deg, #667eea, #764ba2)'
                : '#f3f4f6',
              color: activeTab === tab.key ? '#fff' : '#6b7280',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'list' && (
        <div className="premium-card">
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Loading...</div>
          ) : representatives.length === 0 ? (
            <div className="premium-empty-state">
              <div className="empty-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M16 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <p className="empty-title">No representatives yet</p>
              <p className="empty-subtitle">Add your first campus representative</p>
              <button
                onClick={() => setActiveTab('add')}
                style={{
                  marginTop: '12px', padding: '9px 22px', border: 'none', borderRadius: '8px',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff',
                  cursor: 'pointer', fontWeight: '600', fontSize: '14px'
                }}
              >
                Add Representative
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Representative</th>
                    <th>College</th>
                    <th>Designation</th>
                    <th>Mobile</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {representatives.map(rep => {
                    const initials = rep.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                    return (
                      <tr key={rep._id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '38px', height: '38px', borderRadius: '50%',
                              background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#fff', fontWeight: '700', fontSize: '13px', flexShrink: 0
                            }}>
                              {initials}
                            </div>
                            <div>
                              <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '14px' }}>{rep.name}</div>
                              <div style={{ fontSize: '12px', color: '#9ca3af' }}>{rep.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>{rep.college || '—'}</td>
                        <td>
                          <span style={{
                            padding: '3px 10px', borderRadius: '999px', fontSize: '12px',
                            fontWeight: '600', background: '#fef3c7', color: '#92400e'
                          }}>
                            {rep.designation}
                          </span>
                        </td>
                        <td className="mono-text">{rep.mobile || '—'}</td>
                        <td>
                          <span style={{
                            padding: '3px 10px', borderRadius: '999px', fontSize: '12px',
                            fontWeight: '600',
                            background: rep.status === 'active' ? '#d1fae5' : '#fee2e2',
                            color: rep.status === 'active' ? '#065f46' : '#991b1b'
                          }}>
                            {rep.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => handleDelete(rep._id, rep.name)}
                            className="table-action-btn"
                            style={{ background: '#ef4444' }}
                          >
                            Delete
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
      )}

      {activeTab === 'add' && (
        <div className="premium-card">
          <div className="premium-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <svg fill="none" stroke="#fff" viewBox="0 0 24 24" style={{ width: '22px', height: '22px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div>
                <h2 style={{ margin: 0 }}>Add New Representative</h2>
                <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>Fill in the representative's details</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label>Full Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Enter full name" required />
              </div>
              <div className="form-group">
                <label>Email Address *</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter email" required />
              </div>
              <div className="form-group">
                <label>Password *</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Set login password" required />
              </div>
              <div className="form-group">
                <label>Mobile Number</label>
                <input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} placeholder="Enter mobile number" />
              </div>
              <div className="form-group">
                <label>College</label>
                <input type="text" name="college" value={formData.college} onChange={handleChange} placeholder="College name" />
              </div>
              <div className="form-group">
                <label>Course</label>
                <input type="text" name="course" value={formData.course} onChange={handleChange} placeholder="e.g. B.Tech, MBA" />
              </div>
              <div className="form-group">
                <label>Department</label>
                <input type="text" name="department" value={formData.department} onChange={handleChange} placeholder="e.g. CSE, ECE" />
              </div>
              <div className="form-group">
                <label>Year</label>
                <select name="year" value={formData.year} onChange={handleChange} style={{ width: '100%' }}>
                  <option value="">Select Year</option>
                  <option>1st Year</option>
                  <option>2nd Year</option>
                  <option>3rd Year</option>
                  <option>4th Year</option>
                </select>
              </div>
              <div className="form-group">
                <label>Designation</label>
                <input type="text" name="designation" value={formData.designation} onChange={handleChange} placeholder="Campus Representative" />
              </div>
              <div className="form-group">
                <label>UPI ID</label>
                <input type="text" name="upiId" value={formData.upiId} onChange={handleChange} placeholder="e.g. name@upi" />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Sheet Links</label>
                <input type="text" name="sheetLinks" value={formData.sheetLinks} onChange={handleChange} placeholder="Google Sheets or tracking link (optional)" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '10px 28px', borderRadius: '8px', border: 'none',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: '#fff', fontWeight: '600', fontSize: '14px', cursor: 'pointer'
                }}
              >
                {submitting ? 'Adding...' : 'Add Representative'}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                style={{
                  padding: '10px 24px', borderRadius: '8px',
                  border: '1px solid #d1d5db', background: '#fff',
                  color: '#6b7280', fontWeight: '600', fontSize: '14px', cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default ManageRepresentatives;
