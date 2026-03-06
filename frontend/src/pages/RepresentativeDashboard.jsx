import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { representativeAPI } from '../services/api';
import logo from '../assets/logo.png';

/* ─────────────── Sidebar ─────────────── */
function RepSidebar({ activeTab, setActiveTab, sidebarOpen, setSidebarOpen }) {
  const items = [
    { key: 'overview', label: 'Dashboard Overview', icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
    )},
    { key: 'profile', label: 'My Profile', icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    )},
    { key: 'add-student', label: 'Add Student', icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    )},
    { key: 'my-students', label: 'My Students', icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    )},
    { key: 'performance', label: 'Weekly Performance & Rewards', icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    )},
    { key: 'certificates', label: 'Certificates', icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    )},
    { key: 'notifications', label: 'Notifications', icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    )}
  ];

  return (
    <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo-container">
          <img src={logo} alt="Progrentures" className="sidebar-logo" />
        </div>
        <h2>PROGRENTURES</h2>
        <p>Representative Panel</p>
      </div>
      <ul className="sidebar-menu">
        {items.map(item => (
          <li
            key={item.key}
            className={activeTab === item.key ? 'active' : ''}
            onClick={() => { setActiveTab(item.key); setSidebarOpen(false); }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">{item.icon}</svg>
            {item.label}
          </li>
        ))}
      </ul>
    </aside>
  );
}

/* ─────────────── Main Dashboard ─────────────── */
function RepresentativeDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [students, setStudents] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Profile edit state
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  // Add student state
  const [studentForm, setStudentForm] = useState({
    studentName: '', college: '', branch: '', mobile: '', email: '',
    domain: '', batchJoiningDate: '', totalAmount: '',
    firstInstallment: '', secondInstallment: ''
  });
  const [studentFormLoading, setStudentFormLoading] = useState(false);
  const [studentFormError, setStudentFormError] = useState('');
  const [studentFormSuccess, setStudentFormSuccess] = useState('');

  // My students filter state
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [filters, setFilters] = useState({ name: '', mobile: '', dateFrom: '', dateTo: '' });
  const [deleteSuccess, setDeleteSuccess] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const role = localStorage.getItem('userRole');
    if (!stored || role !== 'representative') {
      navigate('/representative-login');
      return;
    }
    setUser(JSON.parse(stored));
    fetchProfile();
    fetchStudents();
  }, [navigate]);

  const fetchProfile = async () => {
    try {
      const res = await representativeAPI.getProfile();
      if (res.data.success) setProfile(res.data.representative);
    } catch (err) {
      console.error('Fetch profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (params = {}) => {
    try {
      setStudentsLoading(true);
      const res = await representativeAPI.getMyStudents(params);
      if (res.data.success) setStudents(res.data.students);
    } catch (err) {
      console.error('Fetch students error:', err);
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  /* ── Profile Edit ── */
  const startEdit = () => {
    setEditData({
      college: profile?.college || '',
      course: profile?.course || '',
      department: profile?.department || '',
      year: profile?.year || '',
      mobile: profile?.mobile || '',
      email: profile?.email || '',
      upiId: profile?.upiId || '',
      password: ''
    });
    setEditError('');
    setEditSuccess('');
    setEditMode(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditLoading(true);
    try {
      const res = await representativeAPI.updateProfile(editData);
      if (res.data.success) {
        setProfile(res.data.representative);
        const updatedUser = { ...user, email: res.data.representative.email };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setEditSuccess('Profile updated successfully!');
        setTimeout(() => { setEditMode(false); setEditSuccess(''); }, 1800);
      }
    } catch (err) {
      setEditError(err.response?.data?.message || 'Update failed');
    } finally {
      setEditLoading(false);
    }
  };

  /* ── Add Student ── */
  const handleStudentChange = (e) => {
    const { name, value } = e.target;
    setStudentForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setStudentFormError('');
    setStudentFormSuccess('');
    if (!studentForm.studentName) {
      setStudentFormError('Student name is required');
      return;
    }
    try {
      setStudentFormLoading(true);
      const res = await representativeAPI.addStudent(studentForm);
      if (res.data.success) {
        setStudentFormSuccess('Student added successfully!');
        setStudentForm({
          studentName: '', college: '', branch: '', mobile: '', email: '',
          domain: '', batchJoiningDate: '', totalAmount: '',
          firstInstallment: '', secondInstallment: ''
        });
        fetchStudents();
        setTimeout(() => { setStudentFormSuccess(''); setActiveTab('my-students'); }, 1800);
      }
    } catch (err) {
      setStudentFormError(err.response?.data?.message || 'Failed to add student');
    } finally {
      setStudentFormLoading(false);
    }
  };

  /* ── Filters ── */
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    const params = {};
    if (filters.name) params.name = filters.name;
    if (filters.mobile) params.mobile = filters.mobile;
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    fetchStudents(params);
  };

  const clearFilters = () => {
    setFilters({ name: '', mobile: '', dateFrom: '', dateTo: '' });
    fetchStudents();
  };

  const handleDeleteStudent = async (id, name) => {
    if (!window.confirm(`Delete student "${name}"?`)) return;
    try {
      await representativeAPI.deleteStudent(id);
      setStudents(prev => prev.filter(s => s._id !== id));
      setDeleteSuccess('Student deleted.');
      setTimeout(() => setDeleteSuccess(''), 3000);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  const totalStudents = students.length;
  const totalCollected = students.reduce((s, st) => s + (st.firstInstallment || 0) + (st.secondInstallment || 0), 0);
  const totalPending = students.reduce((s, st) => s + ((st.totalAmount || 0) - (st.firstInstallment || 0) - (st.secondInstallment || 0)), 0);

  return (
    <div className="dashboard">
      {/* Mobile menu button */}
      <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle Menu">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <RepSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <main className="main-content">
        <div className="dashboard-content">

          {/* ─── OVERVIEW ─── */}
          {activeTab === 'overview' && (
            <>
              <div className="premium-page-header">
                <div className="header-left">
                  <h1>Dashboard</h1>
                  <p className="header-subtitle">Welcome back, {profile?.name || user?.name}</p>
                </div>
                <div className="header-right">
                  <button className="premium-btn-secondary" onClick={handleLogout}>Logout</button>
                </div>
              </div>

              <div className="premium-stats-grid">
                <div className="premium-stat-card accent-blue" onClick={() => setActiveTab('my-students')} style={{ cursor: 'pointer' }}>
                  <div className="stat-icon-wrapper">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div className="stat-content">
                    <div className="stat-label">Total Students</div>
                    <div className="stat-value">{totalStudents}</div>
                    <div className="stat-meta">Added by you</div>
                  </div>
                </div>

                <div className="premium-stat-card accent-teal">
                  <div className="stat-icon-wrapper">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="stat-content">
                    <div className="stat-label">Total Collected</div>
                    <div className="stat-value">₹{totalCollected.toLocaleString()}</div>
                    <div className="stat-meta">Paid amount</div>
                  </div>
                </div>

                <div className="premium-stat-card accent-indigo">
                  <div className="stat-icon-wrapper">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="stat-content">
                    <div className="stat-label">Pending Amount</div>
                    <div className="stat-value">₹{totalPending.toLocaleString()}</div>
                    <div className="stat-meta">Still due</div>
                  </div>
                </div>

                <div className="premium-stat-card accent-slate" onClick={() => setActiveTab('profile')} style={{ cursor: 'pointer' }}>
                  <div className="stat-icon-wrapper">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="stat-content">
                    <div className="stat-label">My College</div>
                    <div className="stat-value" style={{ fontSize: '16px', lineHeight: 1.3 }}>{profile?.college || '—'}</div>
                    <div className="stat-meta">{profile?.designation || 'Representative'}</div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="premium-action-grid">
                <div className="premium-action-card">
                  <div className="action-card-icon blue">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <div className="action-card-content">
                    <h3>Add Student</h3>
                    <p>Enroll a new student under your referral</p>
                  </div>
                  <button className="action-card-btn" onClick={() => setActiveTab('add-student')}>Add</button>
                </div>

                <div className="premium-action-card">
                  <div className="action-card-icon teal">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div className="action-card-content">
                    <h3>My Students</h3>
                    <p>View and track all your students</p>
                  </div>
                  <button className="action-card-btn" onClick={() => setActiveTab('my-students')}>View</button>
                </div>
              </div>
            </>
          )}

          {/* ─── PROFILE ─── */}
          {activeTab === 'profile' && (
            <>
              <div className="premium-page-header">
                <div className="header-left">
                  <h1>My Profile</h1>
                  <p className="header-subtitle">View and update your information</p>
                </div>
                {!editMode && (
                  <div className="header-right">
                    <button className="premium-btn-secondary" onClick={startEdit}>Edit Profile</button>
                  </div>
                )}
              </div>

              {editMode ? (
                <div className="premium-card">
                  <div className="premium-card-header"><h2>Edit Profile</h2></div>
                  <form onSubmit={handleEditSubmit} style={{ padding: '24px' }}>
                    {editError && <div className="error-message" style={{ marginBottom: '16px' }}>{editError}</div>}
                    {editSuccess && <div className="success-message" style={{ marginBottom: '16px' }}>{editSuccess}</div>}

                    <div className="info-banner" style={{ marginBottom: '20px' }}>
                      <strong>Note:</strong> Name, designation, sheet links, and certificates are managed by the admin and cannot be edited here.
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                      <div className="form-group">
                        <label>College</label>
                        <input type="text" name="college" value={editData.college} onChange={handleEditChange} placeholder="College name" />
                      </div>
                      <div className="form-group">
                        <label>Course</label>
                        <input type="text" name="course" value={editData.course} onChange={handleEditChange} placeholder="e.g. B.Tech" />
                      </div>
                      <div className="form-group">
                        <label>Department</label>
                        <input type="text" name="department" value={editData.department} onChange={handleEditChange} placeholder="e.g. CSE" />
                      </div>
                      <div className="form-group">
                        <label>Year</label>
                        <select name="year" value={editData.year} onChange={handleEditChange} style={{ width: '100%' }}>
                          <option value="">Select Year</option>
                          <option>1st Year</option>
                          <option>2nd Year</option>
                          <option>3rd Year</option>
                          <option>4th Year</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Mobile Number</label>
                        <input type="tel" name="mobile" value={editData.mobile} onChange={handleEditChange} placeholder="Mobile number" />
                      </div>
                      <div className="form-group">
                        <label>Email Address</label>
                        <input type="email" name="email" value={editData.email} onChange={handleEditChange} placeholder="Email address" />
                      </div>
                      <div className="form-group">
                        <label>UPI ID</label>
                        <input type="text" name="upiId" value={editData.upiId} onChange={handleEditChange} placeholder="e.g. name@upi" />
                      </div>
                      <div className="form-group">
                        <label>New Password (optional)</label>
                        <input type="password" name="password" value={editData.password} onChange={handleEditChange} placeholder="Leave blank to keep current" />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                      <button type="submit" disabled={editLoading}
                        style={{
                          padding: '10px 28px', borderRadius: '8px', border: 'none',
                          background: 'linear-gradient(135deg, #667eea, #764ba2)',
                          color: '#fff', fontWeight: '600', fontSize: '14px', cursor: 'pointer'
                        }}
                      >
                        {editLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button type="button" onClick={() => setEditMode(false)}
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
              ) : (
                <div className="premium-card">
                  <div className="premium-card-header"><h2>Personal Information</h2></div>
                  <div className="profile-info-grid">
                    {[
                      { label: 'Full Name', value: profile?.name, locked: true },
                      { label: 'Email', value: profile?.email },
                      { label: 'Mobile', value: profile?.mobile || '—' },
                      { label: 'College', value: profile?.college || '—' },
                      { label: 'Course', value: profile?.course || '—' },
                      { label: 'Department', value: profile?.department || '—' },
                      { label: 'Year', value: profile?.year || '—' },
                      { label: 'UPI ID', value: profile?.upiId || '—' },
                      { label: 'Designation', value: profile?.designation, locked: true },
                      { label: 'Sheet Links', value: profile?.sheetLinks || '—', locked: true }
                    ].map(field => (
                      <div key={field.label} className="profile-field">
                        <label>
                          {field.label}
                          {field.locked && (
                            <span style={{
                              marginLeft: '6px', fontSize: '11px', padding: '1px 6px',
                              borderRadius: '4px', background: '#f3f4f6', color: '#9ca3af'
                            }}>
                              read-only
                            </span>
                          )}
                        </label>
                        <div className="field-value">{field.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ─── ADD STUDENT ─── */}
          {activeTab === 'add-student' && (
            <>
              <div className="premium-page-header">
                <div className="header-left">
                  <h1>Add Student</h1>
                  <p className="header-subtitle">Enroll a new student under your referral</p>
                </div>
              </div>

              <div className="premium-card">
                <div className="premium-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '10px',
                      background: 'linear-gradient(135deg, #667eea, #764ba2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <svg fill="none" stroke="#fff" viewBox="0 0 24 24" style={{ width: '22px', height: '22px' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </div>
                    <div>
                      <h2 style={{ margin: 0 }}>Student Details</h2>
                      <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>Fill in the student information</p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleAddStudent} style={{ padding: '24px' }}>
                  {studentFormError && <div className="error-message" style={{ marginBottom: '16px' }}>{studentFormError}</div>}
                  {studentFormSuccess && <div className="success-message" style={{ marginBottom: '16px' }}>{studentFormSuccess}</div>}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                    <div className="form-group">
                      <label>Student Name *</label>
                      <input type="text" name="studentName" value={studentForm.studentName} onChange={handleStudentChange} placeholder="Full name" required />
                    </div>
                    <div className="form-group">
                      <label>College</label>
                      <input type="text" name="college" value={studentForm.college} onChange={handleStudentChange} placeholder="College name" />
                    </div>
                    <div className="form-group">
                      <label>Branch</label>
                      <input type="text" name="branch" value={studentForm.branch} onChange={handleStudentChange} placeholder="e.g. CSE, ECE" />
                    </div>
                    <div className="form-group">
                      <label>Mobile Number</label>
                      <input type="tel" name="mobile" value={studentForm.mobile} onChange={handleStudentChange} placeholder="Mobile number" />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input type="email" name="email" value={studentForm.email} onChange={handleStudentChange} placeholder="Email address" />
                    </div>
                    <div className="form-group">
                      <label>Domain</label>
                      <input type="text" name="domain" value={studentForm.domain} onChange={handleStudentChange} placeholder="e.g. Web Dev, Data Science" />
                    </div>
                    <div className="form-group">
                      <label>Batch Joining Date</label>
                      <input type="date" name="batchJoiningDate" value={studentForm.batchJoiningDate} onChange={handleStudentChange} />
                    </div>
                    <div className="form-group">
                      <label>Total Amount (₹)</label>
                      <input type="number" name="totalAmount" value={studentForm.totalAmount} onChange={handleStudentChange} placeholder="0" min="0" />
                    </div>
                    <div className="form-group">
                      <label>1st Installment (₹)</label>
                      <input type="number" name="firstInstallment" value={studentForm.firstInstallment} onChange={handleStudentChange} placeholder="0" min="0" />
                    </div>
                    <div className="form-group">
                      <label>2nd Installment (₹)</label>
                      <input type="number" name="secondInstallment" value={studentForm.secondInstallment} onChange={handleStudentChange} placeholder="0" min="0" />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <button type="submit" disabled={studentFormLoading}
                      style={{
                        padding: '10px 28px', borderRadius: '8px', border: 'none',
                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                        color: '#fff', fontWeight: '600', fontSize: '14px', cursor: 'pointer'
                      }}
                    >
                      {studentFormLoading ? 'Adding...' : 'Add Student'}
                    </button>
                    <button type="button" onClick={() => setActiveTab('my-students')}
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
            </>
          )}

          {/* ─── MY STUDENTS ─── */}
          {activeTab === 'my-students' && (
            <>
              <div className="premium-page-header">
                <div className="header-left">
                  <h1>My Students</h1>
                  <p className="header-subtitle">All students added by you</p>
                </div>
                <div className="header-right">
                  <button
                    onClick={() => setActiveTab('add-student')}
                    style={{
                      padding: '9px 20px', borderRadius: '8px', border: 'none',
                      background: 'linear-gradient(135deg, #667eea, #764ba2)',
                      color: '#fff', fontWeight: '600', fontSize: '14px', cursor: 'pointer'
                    }}
                  >
                    + Add Student
                  </button>
                </div>
              </div>

              {deleteSuccess && <div className="success-message" style={{ marginBottom: '16px' }}>{deleteSuccess}</div>}

              {/* Filters */}
              <div className="premium-card" style={{ marginBottom: '20px', padding: '20px' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '12px',
                  alignItems: 'end'
                }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px', display: 'block' }}>Student Name</label>
                    <input
                      type="text" name="name" value={filters.name} onChange={handleFilterChange}
                      placeholder="Search by name"
                      style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', width: '100%', fontSize: '14px' }}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px', display: 'block' }}>Mobile Number</label>
                    <input
                      type="text" name="mobile" value={filters.mobile} onChange={handleFilterChange}
                      placeholder="Search by mobile"
                      style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', width: '100%', fontSize: '14px' }}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px', display: 'block' }}>Date From</label>
                    <input
                      type="date" name="dateFrom" value={filters.dateFrom} onChange={handleFilterChange}
                      style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', width: '100%', fontSize: '14px' }}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px', display: 'block' }}>Date To</label>
                    <input
                      type="date" name="dateTo" value={filters.dateTo} onChange={handleFilterChange}
                      style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', width: '100%', fontSize: '14px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={applyFilters}
                      style={{
                        flex: 1, padding: '10px 0', borderRadius: '8px', border: 'none',
                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                        color: '#fff', fontWeight: '600', fontSize: '13px', cursor: 'pointer'
                      }}
                    >
                      Apply
                    </button>
                    <button
                      onClick={clearFilters}
                      style={{
                        flex: 1, padding: '10px 0', borderRadius: '8px',
                        border: '1px solid #d1d5db', background: '#fff',
                        color: '#6b7280', fontWeight: '600', fontSize: '13px', cursor: 'pointer'
                      }}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>

              <div className="premium-card">
                {studentsLoading ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Loading students...</div>
                ) : students.length === 0 ? (
                  <div className="premium-empty-state">
                    <div className="empty-icon">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <p className="empty-title">No students found</p>
                    <p className="empty-subtitle">Add your first student to get started</p>
                    <button
                      onClick={() => setActiveTab('add-student')}
                      style={{
                        marginTop: '12px', padding: '9px 22px', border: 'none', borderRadius: '8px',
                        background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff',
                        cursor: 'pointer', fontWeight: '600', fontSize: '14px'
                      }}
                    >
                      Add Student
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{
                      padding: '12px 20px', borderBottom: '1px solid #f3f4f6',
                      fontSize: '13px', color: '#6b7280'
                    }}>
                      Showing <strong style={{ color: '#374151' }}>{students.length}</strong> student{students.length !== 1 ? 's' : ''}
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="premium-table">
                        <thead>
                          <tr>
                            <th>Student Name</th>
                            <th>College</th>
                            <th>Branch</th>
                            <th>Mobile</th>
                            <th>Email</th>
                            <th>Domain</th>
                            <th>Total Payment</th>
                            <th>Paid</th>
                            <th>Pending</th>
                            <th>Joining Date</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {students.map(student => {
                            const paid = (student.firstInstallment || 0) + (student.secondInstallment || 0);
                            const pending = (student.totalAmount || 0) - paid;
                            const initials = student.studentName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                            return (
                              <tr key={student._id}>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{
                                      width: '34px', height: '34px', borderRadius: '50%',
                                      background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      color: '#fff', fontWeight: '700', fontSize: '12px', flexShrink: 0
                                    }}>
                                      {initials}
                                    </div>
                                    <span style={{ fontWeight: '600', color: '#1f2937' }}>{student.studentName}</span>
                                  </div>
                                </td>
                                <td>{student.college || '—'}</td>
                                <td>{student.branch || '—'}</td>
                                <td className="mono-text">{student.mobile || '—'}</td>
                                <td style={{ fontSize: '13px' }}>{student.email || '—'}</td>
                                <td>{student.domain || '—'}</td>
                                <td>
                                  <span style={{ fontWeight: '600', color: '#374151' }}>
                                    ₹{(student.totalAmount || 0).toLocaleString()}
                                  </span>
                                </td>
                                <td>
                                  <span style={{ fontWeight: '600', color: '#059669' }}>
                                    ₹{paid.toLocaleString()}
                                  </span>
                                </td>
                                <td>
                                  <span style={{ fontWeight: '600', color: pending > 0 ? '#dc2626' : '#059669' }}>
                                    ₹{pending.toLocaleString()}
                                  </span>
                                </td>
                                <td className="mono-text" style={{ fontSize: '13px' }}>
                                  {student.batchJoiningDate
                                    ? new Date(student.batchJoiningDate).toLocaleDateString('en-IN')
                                    : '—'}
                                </td>
                                <td>
                                  <button
                                    onClick={() => handleDeleteStudent(student._id, student.studentName)}
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
                  </>
                )}
              </div>
            </>
          )}

          {/* ─── PERFORMANCE ─── */}
          {activeTab === 'performance' && (
            <>
              <div className="premium-page-header">
                <div className="header-left">
                  <h1>Weekly Performance & Rewards</h1>
                  <p className="header-subtitle">Track your weekly targets and earnings</p>
                </div>
              </div>
              <div className="premium-card">
                <div className="premium-empty-state">
                  <div className="empty-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="empty-title">Coming Soon</p>
                  <p className="empty-subtitle">Weekly performance tracking and rewards will be available here</p>
                </div>
              </div>
            </>
          )}

          {/* ─── CERTIFICATES ─── */}
          {activeTab === 'certificates' && (
            <>
              <div className="premium-page-header">
                <div className="header-left">
                  <h1>Certificates</h1>
                  <p className="header-subtitle">Your certificates and achievements</p>
                </div>
              </div>
              <div className="premium-card">
                <div className="premium-empty-state">
                  <div className="empty-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <p className="empty-title">No certificates yet</p>
                  <p className="empty-subtitle">Certificates assigned by the admin will appear here</p>
                </div>
              </div>
            </>
          )}

          {/* ─── NOTIFICATIONS ─── */}
          {activeTab === 'notifications' && (
            <>
              <div className="premium-page-header">
                <div className="header-left">
                  <h1>Notifications</h1>
                  <p className="header-subtitle">Stay updated with the latest news</p>
                </div>
              </div>
              <div className="premium-card">
                <div className="premium-empty-state">
                  <div className="empty-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <p className="empty-title">No notifications</p>
                  <p className="empty-subtitle">You're all caught up! New updates will appear here</p>
                </div>
              </div>
            </>
          )}

        </div>
      </main>

      {/* Logout button in sidebar footer handled by sidebar */}
      <style>{`
        .rep-logout { display: none; }
      `}</style>
    </div>
  );
}

export default RepresentativeDashboard;
