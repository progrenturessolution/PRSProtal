import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { representativeAPI, UPLOADS_BASE } from '../services/api';
import logo from '../assets/logo.png';
import LoadingSpinner from '../components/LoadingSpinner';

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
    studentType: 'Internship',
    name: '',
    email: '',
    mobile: '',
    password: '',
    domain: '',
    joiningDate: '',
    endingDate: '',
    duration: '',
    paymentDoneBy: '',
    dateOfPayment: '',
    transactionId: '',
    paymentAmount: '',
    completedFees: '',
    pendingFees: '',
    lastPaymentDate: '',
    currentDesignation: ''
  });
  const [studentFormLoading, setStudentFormLoading] = useState(false);
  const [studentFormError, setStudentFormError] = useState('');
  const [studentFormSuccess, setStudentFormSuccess] = useState('');
  const [studentStats, setStudentStats] = useState({
    totalStudents: 0,
    weeklyStudents: 0,
    monthlyStudents: 0,
    byType: { internship: 0, smsProgram: 0 }
  });
  const [payouts, setPayouts] = useState([]);
  const [payoutsLoading, setPayoutsLoading] = useState(false);

  // My students filter state
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [filters, setFilters] = useState({ name: '', mobile: '', dateFrom: '', dateTo: '' });
  const [deleteSuccess, setDeleteSuccess] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

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
    fetchStudentStats();
    fetchPayouts();
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

  const fetchStudentStats = async () => {
    try {
      const res = await representativeAPI.getMyStudentStats();
      if (res.data.success) {
        setStudentStats(res.data.stats);
      }
    } catch (err) {
      console.error('Fetch representative stats error:', err);
    }
  };

  const fetchPayouts = async () => {
    try {
      setPayoutsLoading(true);
      const res = await representativeAPI.getMyPayouts();
      if (res.data.success) {
        setPayouts(res.data.payouts || []);
      }
    } catch (err) {
      console.error('Fetch payout history error:', err);
    } finally {
      setPayoutsLoading(false);
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

    if (!studentForm.name || !studentForm.email || !studentForm.mobile || !studentForm.password) {
      setStudentFormError('Please fill name, email, mobile and password');
      return;
    }

    if (
      studentForm.studentType === 'Internship' &&
      (!studentForm.domain || !studentForm.joiningDate || !studentForm.duration)
    ) {
      setStudentFormError('For internship, domain, joining date and duration are required');
      return;
    }

    try {
      setStudentFormLoading(true);
      const res = await representativeAPI.addStudent(studentForm);
      if (res.data.success) {
        const intern = res.data.intern;
        const emailSent = res.data.emailSent;
        const emailQueued = res.data.emailQueued;
        const emailMsg = emailQueued
          ? 'Credentials email queued and will be sent shortly.'
          : (emailSent
            ? `Credentials sent on email (${intern.email}).`
            : 'Email not sent, please share credentials manually.');

        setStudentFormSuccess(`Student added successfully! ID: ${intern.internId}. ${emailMsg}`);
        setStudentForm({
          studentType: 'Internship',
          name: '',
          email: '',
          mobile: '',
          password: '',
          domain: '',
          joiningDate: '',
          endingDate: '',
          duration: '',
          paymentDoneBy: '',
          dateOfPayment: '',
          transactionId: '',
          paymentAmount: '',
          completedFees: '',
          pendingFees: '',
          lastPaymentDate: '',
          currentDesignation: ''
        });
        fetchStudents();
        fetchStudentStats();
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
      fetchStudentStats();
      setDeleteSuccess('Student deleted.');
      setTimeout(() => setDeleteSuccess(''), 3000);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleViewStudentDetails = (student) => {
    setSelectedStudent(student);
  };

  if (loading) return <div className="loading">Loading...</div>;

  const totalStudents = studentStats.totalStudents || students.length;
  const weeklyStudents = studentStats.weeklyStudents || 0;
  const monthlyStudents = studentStats.monthlyStudents || 0;
  const internshipStudents = studentStats.byType?.internship || 0;
  const smsStudents = studentStats.byType?.smsProgram || 0;
  const profileName = profile?.name || user?.name || 'Representative';
  const profileInitials = profileName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase() || 'RP';
  const profileEmail = profile?.email || 'Not available';
  const profileMobile = profile?.mobile || 'Not available';
  const profileDesignation = profile?.designation || 'Representative';
  const profileSheetLink = profile?.sheetLinks || '';
  const profileApplicationFormLink = profile?.internshipApplicationFormLink || '';
  const profileInternshipSheetLink = profile?.internshipSheetLink || '';
  const profileHighlights = [
    { label: 'Total Students', value: totalStudents, note: 'All-time referrals' },
    { label: 'This Month', value: monthlyStudents, note: 'Current month activity' },
    { label: 'This Week', value: weeklyStudents, note: 'Recent additions' },
    { label: 'Designation', value: profileDesignation, note: 'Current role' },
  ];

  const profileInfoRows = [
    { label: 'PGIR ID', value: profile?.pgirId || '-' },
    { label: 'College', value: profile?.college || 'Not provided' },
    { label: 'Course', value: profile?.course || 'Not provided' },
    { label: 'Department', value: profile?.department || 'Not provided' },
    { label: 'Year', value: profile?.year || 'Not provided' },
    { label: 'Joining Date', value: profile?.joiningDate ? new Date(profile.joiningDate).toLocaleDateString('en-IN') : 'Not provided' },
    { label: 'Email', value: profileEmail },
    { label: 'Mobile', value: profileMobile },
    { label: 'UPI ID', value: profile?.upiId || 'Not provided' },
    { label: 'UPI/Mobile', value: profile?.upiMobileNumber || 'Not provided' },
  ];

  const profileLinkRows = [
    { label: 'Application Form', href: profileApplicationFormLink },
    { label: 'Internship Sheet', href: profileInternshipSheetLink },
    { label: 'Sheet Links', href: profileSheetLink },
  ];

  const profilePromoRows = [
    { label: 'Internship', value: profile?.internshipPromotionalMessage || 'Not provided' },
    { label: 'SMS Program', value: profile?.smsPromotionalMessage || 'Not provided' },
  ];

  const resolveFileUrl = (filepath) => {
    if (!filepath) return '';
    const relative = String(filepath).replace(/\\/g, '/').split('uploads/')[1] || '';
    return `${UPLOADS_BASE}/uploads/${relative}`;
  };

  const assignedDocs = [
    {
      key: 'upiScanner',
      label: 'UPI Scanner',
      filename: profile?.docs?.upiScanner?.filename,
      filepath: profile?.docs?.upiScanner?.filepath,
      uploadedAt: profile?.docs?.upiScanner?.uploadedAt,
    },
    {
      key: 'pgirSelectionLetter',
      label: 'PGIR Selection Letter',
      filename: profile?.docs?.pgirSelectionLetter?.filename,
      filepath: profile?.docs?.pgirSelectionLetter?.filepath,
      uploadedAt: profile?.docs?.pgirSelectionLetter?.uploadedAt,
    },
    {
      key: 'internshipOfferLetter',
      label: 'Internship Offer Letter',
      filename: profile?.docs?.internshipOfferLetter?.filename,
      filepath: profile?.docs?.internshipOfferLetter?.filepath,
      uploadedAt: profile?.docs?.internshipOfferLetter?.uploadedAt,
    },
  ];

  const certificateCount = assignedDocs.filter((doc) => doc.filepath).length;

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
                    <div className="stat-label">This Week</div>
                    <div className="stat-value">{weeklyStudents}</div>
                    <div className="stat-meta">Students added in last 7 days</div>
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
                    <div className="stat-label">This Month</div>
                    <div className="stat-value">{monthlyStudents}</div>
                    <div className="stat-meta">Students added this month</div>
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
                    <div className="stat-label">Internship / SMS</div>
                    <div className="stat-value" style={{ fontSize: '16px', lineHeight: 1.3 }}>{internshipStudents} / {smsStudents}</div>
                    <div className="stat-meta">Type-wise student split</div>
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
                  <p className="header-subtitle">Your identity, assignments and account details in one structured view</p>
                </div>
              </div>

              {editMode ? (
                <div className="rep-profile-shell">
                  <div className="premium-card rep-profile-edit-card">
                    <div className="premium-card-header rep-profile-edit-header">
                      <h2>Edit Your Profile</h2>
                    </div>
                    <form onSubmit={handleEditSubmit} className="rep-profile-edit-form">
                      {editError && <div className="error-message" style={{ marginBottom: '16px' }}>{editError}</div>}
                      {editSuccess && <div className="success-message" style={{ marginBottom: '16px' }}>{editSuccess}</div>}

                      <div className="rep-profile-note">
                        <strong>Note:</strong> Name, designation and sheet links are managed by admin only.
                      </div>

                      <div className="rep-profile-form-section">
                        <h3>Academic Information</h3>
                        <div className="rep-profile-form-grid">
                          <div className="form-group">
                            <label>College</label>
                            <input type="text" name="college" value={editData.college} onChange={handleEditChange} placeholder="Enter college name" />
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
                            <select name="year" value={editData.year} onChange={handleEditChange}>
                              <option value="">Select Year</option>
                              <option>1st Year</option>
                              <option>2nd Year</option>
                              <option>3rd Year</option>
                              <option>4th Year</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="rep-profile-form-section">
                        <h3>Contact Information</h3>
                        <div className="rep-profile-form-grid">
                          <div className="form-group">
                            <label>Mobile Number</label>
                            <input type="tel" name="mobile" value={editData.mobile} onChange={handleEditChange} placeholder="Mobile number" />
                          </div>
                          <div className="form-group">
                            <label>Email Address</label>
                            <input type="email" name="email" value={editData.email} onChange={handleEditChange} placeholder="Email address" />
                          </div>
                        </div>
                      </div>

                      <div className="rep-profile-form-section">
                        <h3>Payment and Security</h3>
                        <div className="rep-profile-form-grid">
                          <div className="form-group">
                            <label>UPI ID</label>
                            <input type="text" name="upiId" value={editData.upiId} onChange={handleEditChange} placeholder="name@upi" />
                          </div>
                          <div className="form-group">
                            <label>New Password (optional)</label>
                            <input type="password" name="password" value={editData.password} onChange={handleEditChange} placeholder="Leave blank to keep current" />
                          </div>
                        </div>
                      </div>

                      <div className="rep-profile-actions">
                        <button type="submit" className="rep-profile-btn rep-profile-btn-primary" disabled={editLoading}>
                          {editLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button type="button" className="rep-profile-btn rep-profile-btn-ghost" onClick={() => setEditMode(false)}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="rep-profile-shell" style={{ display: 'grid', gap: '16px' }}>
                  <section
                    style={{
                      position: 'relative',
                      overflow: 'hidden',
                      borderRadius: '22px',
                      padding: '22px',
                      background: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 55%, #38bdf8 100%)',
                      color: '#fff',
                      boxShadow: '0 18px 50px rgba(15, 23, 42, 0.18)',
                    }}
                  >
                    <div style={{ position: 'absolute', inset: 'auto -60px -80px auto', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(255,255,255,0.12)', filter: 'blur(10px)' }} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '16px', alignItems: 'center', position: 'relative' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        <div className="rep-profile-avatar" style={{ width: '84px', height: '84px', fontSize: '28px', border: '2px solid rgba(255,255,255,0.35)', boxShadow: '0 10px 26px rgba(15, 23, 42, 0.15)' }}>{profileInitials}</div>
                        <div style={{ minWidth: '240px' }}>
                          <div style={{ fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.82 }}>Representative Profile</div>
                          <h2 style={{ margin: '6px 0 4px', fontSize: '30px', lineHeight: 1.1 }}>{profileName}</h2>
                          <p style={{ margin: 0, opacity: 0.92, fontSize: '16px' }}>{profileDesignation}</p>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                            <span style={{ background: 'rgba(255,255,255,0.14)', borderRadius: '999px', padding: '6px 10px', fontSize: '12px', fontWeight: 700 }}>PGIR: {profile?.pgirId || '-'}</span>
                            <span style={{ background: 'rgba(255,255,255,0.14)', borderRadius: '999px', padding: '6px 10px', fontSize: '12px', fontWeight: 700 }}>{profileMobile}</span>
                            <span style={{ background: 'rgba(255,255,255,0.14)', borderRadius: '999px', padding: '6px 10px', fontSize: '12px', fontWeight: 700 }}>{profileEmail}</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
                        {profileHighlights.map((item) => (
                          <div key={item.label} style={{ background: 'rgba(255,255,255,0.14)', borderRadius: '16px', padding: '12px 14px', backdropFilter: 'blur(6px)' }}>
                            <div style={{ fontSize: '12px', opacity: 0.85 }}>{item.label}</div>
                            <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px' }}>{item.value}</div>
                            <div style={{ fontSize: '12px', opacity: 0.82, marginTop: '2px' }}>{item.note}</div>
                          </div>
                        ))}
                        <button className="rep-profile-btn rep-profile-btn-light" onClick={startEdit} style={{ gridColumn: '1 / -1', boxShadow: '0 10px 24px rgba(15, 23, 42, 0.12)' }}>Edit Profile</button>
                      </div>
                    </div>
                  </section>

                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(280px, 0.8fr)', gap: '16px', alignItems: 'start' }}>
                    <div style={{ display: 'grid', gap: '16px' }}>
                      <article className="premium-card" style={{ padding: '18px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                          <h3 style={{ margin: 0 }}>Profile Details</h3>
                          <span style={{ fontSize: '12px', fontWeight: 800, color: '#334155', background: '#e2e8f0', padding: '6px 10px', borderRadius: '999px' }}>Identity & Contact</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                          {profileInfoRows.map((item) => (
                            <div key={item.label} style={{ padding: '12px', borderRadius: '14px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                              <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', marginBottom: '6px', fontWeight: 800 }}>{item.label}</div>
                              <div style={{ color: '#0f172a', fontWeight: 600, wordBreak: 'break-word' }}>{item.value}</div>
                            </div>
                          ))}
                        </div>
                      </article>

                      <article className="premium-card" style={{ padding: '18px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                          <h3 style={{ margin: 0 }}>Assigned Documents</h3>
                          <span style={{ fontSize: '12px', fontWeight: 800, color: '#334155', background: '#e2e8f0', padding: '6px 10px', borderRadius: '999px' }}>{certificateCount} ready</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                          {assignedDocs.map((doc) => {
                            const isReady = Boolean(doc.filepath);
                            return (
                              <div key={doc.key} style={{ borderRadius: '16px', border: `1px solid ${isReady ? '#cbd5e1' : '#fecaca'}`, background: isReady ? 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)' : 'linear-gradient(180deg, #fff5f5 0%, #ffffff 100%)', padding: '14px', boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'start' }}>
                                  <div>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Assigned file</div>
                                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>{doc.label}</div>
                                  </div>
                                  <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 9px', borderRadius: '999px', background: isReady ? '#dcfce7' : '#fee2e2', color: isReady ? '#166534' : '#991b1b' }}>{isReady ? 'READY' : 'MISSING'}</span>
                                </div>
                                <div style={{ marginTop: '12px', display: 'grid', gap: '8px', color: '#334155', fontSize: '13px' }}>
                                  <div><strong>File:</strong> {doc.filename || 'Not uploaded'}</div>
                                  <div><strong>Uploaded:</strong> {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString('en-IN') : '-'}</div>
                                  {isReady ? (
                                    <a href={resolveFileUrl(doc.filepath)} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', width: 'fit-content', marginTop: '4px', alignItems: 'center', justifyContent: 'center', padding: '9px 14px', borderRadius: '10px', background: '#0f172a', color: '#fff', textDecoration: 'none', fontWeight: 700 }}>Open Document</a>
                                  ) : (
                                    <div style={{ marginTop: '4px', color: '#64748b' }}>This document has not been assigned yet.</div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </article>
                    </div>

                    <aside style={{ display: 'grid', gap: '16px' }}>
                      <article className="premium-card" style={{ padding: '18px' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '12px' }}>Quick Links</h3>
                        <div style={{ display: 'grid', gap: '10px' }}>
                          {profileLinkRows.map((item) => (
                            <div key={item.label} style={{ padding: '12px', borderRadius: '14px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                              <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.label}</div>
                              {item.href ? <a href={item.href} target="_blank" rel="noreferrer">Open</a> : <span style={{ color: '#64748b' }}>Not available</span>}
                            </div>
                          ))}
                        </div>
                      </article>

                      <article className="premium-card" style={{ padding: '18px' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '12px' }}>Promotional Messages</h3>
                        <div style={{ display: 'grid', gap: '12px' }}>
                          {profilePromoRows.map((item) => (
                            <div key={item.label} style={{ padding: '12px', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#fff' }}>
                              <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', marginBottom: '6px', fontWeight: 800 }}>{item.label}</div>
                              <div style={{ color: '#0f172a', lineHeight: 1.55 }}>{item.value}</div>
                            </div>
                          ))}
                        </div>
                      </article>

                      <article className="premium-card" style={{ padding: '18px' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '12px' }}>At a Glance</h3>
                        <div style={{ display: 'grid', gap: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}><span>Instagram</span><strong style={{ textAlign: 'right' }}>{profile?.instagramProfile || 'Not provided'}</strong></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}><span>LinkedIn</span><strong style={{ textAlign: 'right' }}>{profile?.linkedinProfile || 'Not provided'}</strong></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}><span>Sheet Links</span><strong style={{ textAlign: 'right' }}>{profileSheetLink ? 'Available' : 'Not available'}</strong></div>
                        </div>
                      </article>
                    </aside>
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
                      background: '#324158',  
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
                      <label>Student Type *</label>
                      <select name="studentType" value={studentForm.studentType} onChange={handleStudentChange}>
                        <option value="Internship">Internship</option>
                        <option value="SMS Program">SMS Program</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Student Name *</label>
                      <input type="text" name="name" value={studentForm.name} onChange={handleStudentChange} placeholder="Full name" required />
                    </div>
                    <div className="form-group">
                      <label>Email *</label>
                      <input type="email" name="email" value={studentForm.email} onChange={handleStudentChange} placeholder="Email address" required />
                    </div>
                    <div className="form-group">
                      <label>Mobile Number *</label>
                      <input type="tel" name="mobile" value={studentForm.mobile} onChange={handleStudentChange} placeholder="Mobile number" />
                    </div>
                    <div className="form-group">
                      <label>Password *</label>
                      <input type="password" name="password" value={studentForm.password} onChange={handleStudentChange} placeholder="Set login password" min="6" required />
                    </div>

                    {studentForm.studentType === 'Internship' ? (
                      <>
                        <div className="form-group">
                          <label>Domain *</label>
                          <input type="text" name="domain" value={studentForm.domain} onChange={handleStudentChange} placeholder="e.g. Web Development" />
                        </div>
                        <div className="form-group">
                          <label>Joining Date *</label>
                          <input type="date" name="joiningDate" value={studentForm.joiningDate} onChange={handleStudentChange} />
                        </div>
                        <div className="form-group">
                          <label>Duration *</label>
                          <input type="text" name="duration" value={studentForm.duration} onChange={handleStudentChange} placeholder="e.g. 3 months" />
                        </div>
                        <div className="form-group">
                          <label>Ending Date</label>
                          <input type="date" name="endingDate" value={studentForm.endingDate} onChange={handleStudentChange} />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="form-group">
                          <label>Payment Done By</label>
                          <input type="text" name="paymentDoneBy" value={studentForm.paymentDoneBy} onChange={handleStudentChange} placeholder="Student / Parent" />
                        </div>
                        <div className="form-group">
                          <label>Date Of Payment</label>
                          <input type="date" name="dateOfPayment" value={studentForm.dateOfPayment} onChange={handleStudentChange} />
                        </div>
                        <div className="form-group">
                          <label>Transaction ID</label>
                          <input type="text" name="transactionId" value={studentForm.transactionId} onChange={handleStudentChange} placeholder="Transaction reference" />
                        </div>
                        <div className="form-group">
                          <label>Payment Amount</label>
                          <input type="text" name="paymentAmount" value={studentForm.paymentAmount} onChange={handleStudentChange} placeholder="e.g. 5000" />
                        </div>
                        <div className="form-group">
                          <label>Completed Fees</label>
                          <input type="text" name="completedFees" value={studentForm.completedFees} onChange={handleStudentChange} placeholder="e.g. 3000" />
                        </div>
                        <div className="form-group">
                          <label>Pending Fees</label>
                          <input type="text" name="pendingFees" value={studentForm.pendingFees} onChange={handleStudentChange} placeholder="e.g. 2000" />
                        </div>
                        <div className="form-group">
                          <label>Last Payment Date</label>
                          <input type="date" name="lastPaymentDate" value={studentForm.lastPaymentDate} onChange={handleStudentChange} />
                        </div>
                        <div className="form-group">
                          <label>Current Designation</label>
                          <input type="text" name="currentDesignation" value={studentForm.currentDesignation} onChange={handleStudentChange} placeholder="e.g. Student" />
                        </div>
                      </>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <button type="submit" disabled={studentFormLoading}
                      style={{
                        padding: '10px 28px', borderRadius: '8px', border: 'none',
                        background: '#475569',
                        color: '#fff', fontWeight: '600', fontSize: '14px', cursor: 'pointer'
                      }}
                    >
                      {studentFormLoading ? (
                        <LoadingSpinner text="Adding..." inline size="sm" />
                      ) : (
                        'Add Student'
                      )}
                    </button>
                    <button type="button" onClick={() => setActiveTab('my-students')}
                      style={{
                        padding: '10px 24px', borderRadius: '8px',
                        border: '1px solid #d1d5db', background: '#fff',
                        color: '#324158', fontWeight: '600', fontSize: '14px', cursor: 'pointer'
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
                      background: "#324158",
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
                        background: "#324158",
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
                        background: '#324158', color: '#fff',
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
                            <th>Intern ID</th>
                            <th>Mobile</th>
                            <th>Email</th>
                            <th>Type</th>
                            <th>Added By</th>
                            <th>Domain / Payment</th>
                            <th>Added On</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {students.map(student => {
                            return (
                              <tr key={student._id}>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontWeight: '600', color: '#1f2937' }}>{student.name}</span>
                                  </div>
                                </td>
                                <td className="mono-text" style={{ fontSize: '13px' }}>{student.internId}</td>
                                <td className="mono-text">{student.mobile || '—'}</td>
                                <td style={{ fontSize: '13px' }}>{student.email || '—'}</td>
                                <td>
                                  <span style={{
                                    padding: '3px 10px',
                                    borderRadius: '999px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    background: student.studentType === 'SMS Program' ? '#ede9fe' : '#dcfce7',
                                    color: student.studentType === 'SMS Program' ? '#6d28d9' : '#15803d'
                                  }}>
                                    {student.studentType}
                                  </span>
                                </td>
                                <td>
                                  <span
                                    style={{
                                      padding: "4px 10px",
                                      background: student.addedByRepresentative
                                        ? "#fef3c7"
                                        : "#dbeafe",
                                      color: student.addedByRepresentative
                                        ? "#b45309"
                                        : "#1e40af",
                                      borderRadius: "6px",
                                      fontSize: "11px",
                                      fontWeight: "600",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {student.addedByRepresentative
                                      ? `Added by ${student.addedByRepresentative.name}`
                                      : "Added by Admin"}
                                  </span>
                                </td>
                                <td>
                                  {student.studentType === 'SMS Program'
                                    ? `₹${student.paymentAmount || 0}`
                                    : (student.domain || '—')}
                                </td>
                                <td className="mono-text" style={{ fontSize: '13px' }}>
                                  {student.createdAt ? new Date(student.createdAt).toLocaleDateString('en-IN') : '—'}
                                </td>
                                <td>
                                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    <button
                                      onClick={() => handleViewStudentDetails(student)}
                                      className="table-action-btn"
                                      style={{ background: '#324158' }}
                                    >
                                      View Details
                                    </button>
                                    <button
                                      onClick={() => handleDeleteStudent(student._id, student.name)}
                                      className="table-action-btn"
                                      style={{ background: '#ef4444' }}
                                    >
                                      Delete
                                    </button>
                                  </div>
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

          {selectedStudent && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(15, 23, 42, 0.58)',
                zIndex: 1200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px'
              }}
              onClick={() => setSelectedStudent(null)}
            >
              <div
                style={{
                  width: 'min(760px, 100%)',
                  maxHeight: '90vh',
                  overflow: 'auto',
                  background: '#fff',
                  borderRadius: '18px',
                  boxShadow: '0 30px 80px rgba(15, 23, 42, 0.35)'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ padding: '22px 24px', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#fff', position: 'relative' }}>
                  <button
                    onClick={() => setSelectedStudent(null)}
                    style={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px',
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      border: 'none',
                      background: 'rgba(255,255,255,0.16)',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '18px'
                    }}
                  >
                    ✕
                  </button>
                  <h2 style={{ margin: '0 0 8px 0' }}>{selectedStudent.name}</h2>
                  <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '14px', opacity: 0.95 }}>
                    <span>ID: {selectedStudent.internId}</span>
                    <span>•</span>
                    <span>{selectedStudent.studentType}</span>
                  </div>
                </div>

                <div style={{ padding: '24px' }}>
                  <div style={{ display: 'grid', gap: '20px' }}>
                    <section>
                      <h3 style={{ margin: '0 0 12px 0', color: '#0f172a' }}>Student Information</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                        <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px' }}>
                          <div style={{ color: '#64748b', fontSize: '13px' }}>Email</div>
                          <div style={{ color: '#0f172a', fontWeight: '600' }}>{selectedStudent.email || 'N/A'}</div>
                        </div>
                        <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px' }}>
                          <div style={{ color: '#64748b', fontSize: '13px' }}>Mobile</div>
                          <div style={{ color: '#0f172a', fontWeight: '600' }}>{selectedStudent.mobile || 'N/A'}</div>
                        </div>
                        <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px' }}>
                          <div style={{ color: '#64748b', fontSize: '13px' }}>Designation</div>
                          <div style={{ color: '#0f172a', fontWeight: '600' }}>{selectedStudent.currentDesignation || 'N/A'}</div>
                        </div>
                        <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px' }}>
                          <div style={{ color: '#64748b', fontSize: '13px' }}>Added On</div>
                          <div style={{ color: '#0f172a', fontWeight: '600' }}>
                            {selectedStudent.createdAt ? new Date(selectedStudent.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </section>

                    {selectedStudent.studentType === 'SMS Program' ? (
                      <section>
                        <h3 style={{ margin: '0 0 12px 0', color: '#0f172a' }}>Payment & Fees</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                          <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px' }}>
                            <div style={{ color: '#64748b', fontSize: '13px' }}>Payment Done By</div>
                            <div style={{ color: '#0f172a', fontWeight: '600' }}>{selectedStudent.paymentDoneBy || 'N/A'}</div>
                          </div>
                          <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px' }}>
                            <div style={{ color: '#64748b', fontSize: '13px' }}>Transaction ID</div>
                            <div style={{ color: '#0f172a', fontWeight: '600', fontFamily: 'monospace' }}>{selectedStudent.transactionId || 'N/A'}</div>
                          </div>
                          <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px' }}>
                            <div style={{ color: '#64748b', fontSize: '13px' }}>Payment Amount</div>
                            <div style={{ color: '#059669', fontWeight: '700' }}>{selectedStudent.paymentAmount ? `₹${selectedStudent.paymentAmount}` : '₹0'}</div>
                          </div>
                          <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px' }}>
                            <div style={{ color: '#64748b', fontSize: '13px' }}>Completed Fees</div>
                            <div style={{ color: '#059669', fontWeight: '700' }}>{selectedStudent.completedFees ? `₹${selectedStudent.completedFees}` : '₹0'}</div>
                          </div>
                          <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px' }}>
                            <div style={{ color: '#64748b', fontSize: '13px' }}>Pending Fees</div>
                            <div style={{ color: '#d97706', fontWeight: '700' }}>{selectedStudent.pendingFees ? `₹${selectedStudent.pendingFees}` : '₹0'}</div>
                          </div>
                          <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px' }}>
                            <div style={{ color: '#64748b', fontSize: '13px' }}>Payment Date</div>
                            <div style={{ color: '#0f172a', fontWeight: '600' }}>
                              {selectedStudent.dateOfPayment ? new Date(selectedStudent.dateOfPayment).toLocaleDateString('en-IN') : 'N/A'}
                            </div>
                          </div>
                          <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px' }}>
                            <div style={{ color: '#64748b', fontSize: '13px' }}>Last Payment Date</div>
                            <div style={{ color: '#0f172a', fontWeight: '600' }}>
                              {selectedStudent.lastPaymentDate ? new Date(selectedStudent.lastPaymentDate).toLocaleDateString('en-IN') : 'N/A'}
                            </div>
                          </div>
                        </div>
                      </section>
                    ) : (
                      <section>
                        <h3 style={{ margin: '0 0 12px 0', color: '#0f172a' }}>Internship Details</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                          <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px' }}>
                            <div style={{ color: '#64748b', fontSize: '13px' }}>Domain</div>
                            <div style={{ color: '#0f172a', fontWeight: '600' }}>{selectedStudent.domain || 'N/A'}</div>
                          </div>
                          <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px' }}>
                            <div style={{ color: '#64748b', fontSize: '13px' }}>Joining Date</div>
                            <div style={{ color: '#0f172a', fontWeight: '600' }}>
                              {selectedStudent.joiningDate ? new Date(selectedStudent.joiningDate).toLocaleDateString('en-IN') : 'N/A'}
                            </div>
                          </div>
                          <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px' }}>
                            <div style={{ color: '#64748b', fontSize: '13px' }}>Ending Date</div>
                            <div style={{ color: '#0f172a', fontWeight: '600' }}>
                              {selectedStudent.endingDate ? new Date(selectedStudent.endingDate).toLocaleDateString('en-IN') : 'N/A'}
                            </div>
                          </div>
                          <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px' }}>
                            <div style={{ color: '#64748b', fontSize: '13px' }}>Duration</div>
                            <div style={{ color: '#0f172a', fontWeight: '600' }}>{selectedStudent.duration || 'N/A'}</div>
                          </div>
                        </div>
                      </section>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── PERFORMANCE ─── */}
          {activeTab === 'performance' && (
            <>
              <div className="premium-page-header">
                <div className="header-left">
                  <h1>Weekly Performance & Rewards</h1>
                  <p className="header-subtitle">Track eligibility, reward percentage and payout status</p>
                </div>
              </div>

              <div className="premium-stats-grid" style={{ marginBottom: '16px' }}>
                <div className="premium-stat-card accent-blue">
                  <div className="stat-content">
                    <div className="stat-label">Total Reward Cycles</div>
                    <div className="stat-value">{payouts.length}</div>
                  </div>
                </div>
                <div className="premium-stat-card accent-teal">
                  <div className="stat-content">
                    <div className="stat-label">Paid Cycles</div>
                    <div className="stat-value">{payouts.filter((item) => item.payoutStatus === 'Paid').length}</div>
                  </div>
                </div>
                <div className="premium-stat-card accent-indigo">
                  <div className="stat-content">
                    <div className="stat-label">Total Earned (₹)</div>
                    <div className="stat-value">
                      ₹{payouts.reduce((sum, item) => sum + (Number(item.payoutAmount) || 0), 0)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="premium-card">
                {payoutsLoading ? (
                  <div style={{ padding: '30px', textAlign: 'center' }}>Loading reward history...</div>
                ) : payouts.length === 0 ? (
                  <div className="premium-empty-state">
                    <p className="empty-title">No reward records yet</p>
                    <p className="empty-subtitle">Admin will add weekly payout entries here</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="premium-table">
                      <thead>
                        <tr>
                          <th>Month</th>
                          <th>Week</th>
                          <th>Enrollments</th>
                          <th>3000 Paid</th>
                          <th>Payout Eligible</th>
                          <th>Reward %</th>
                          <th>Payout (₹)</th>
                          <th>Status</th>
                          <th>Release Date</th>
                          <th>UPI/QR</th>
                          <th>Promotional Docs</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payouts.map((row) => (
                          <tr key={row._id}>
                            <td>{row.monthLabel}</td>
                            <td>{row.weekLabel}</td>
                            <td>{row.totalEnrollmentCount}</td>
                            <td>{row.studentsWith3000Paid}</td>
                            <td>{row.payoutEligible}</td>
                            <td>{row.rewardPercent}%</td>
                            <td>₹{row.payoutAmount || 0}</td>
                            <td>{row.payoutStatus}</td>
                            <td>{row.payoutReleaseDate ? new Date(row.payoutReleaseDate).toLocaleDateString('en-IN') : '-'}</td>
                            <td>{row.upiQrDriveLink ? <a href={row.upiQrDriveLink} target="_blank" rel="noreferrer">Open</a> : '-'}</td>
                            <td>{row.promotionalDocumentsLink ? <a href={row.promotionalDocumentsLink} target="_blank" rel="noreferrer">Open</a> : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ─── CERTIFICATES ─── */}
          {activeTab === 'certificates' && (
            <>
              <div className="premium-page-header">
                <div className="header-left">
                  <h1>Certificates</h1>
                  <p className="header-subtitle">Assigned files, certification details and quick access</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 0.8fr', gap: '16px', alignItems: 'start' }}>
                <section
                  className="premium-card"
                  style={{
                    padding: '0',
                    overflow: 'hidden',
                    border: '1px solid #e2e8f0',
                    background: '#fff',
                  }}
                >
                  <div style={{ padding: '18px 18px 14px', background: 'linear-gradient(135deg, #0f172a 0%, #334155 55%, #0ea5e9 100%)', color: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.85 }}>Certificates Hub</div>
                        <h2 style={{ margin: '6px 0 4px' }}>Your Assigned Documents</h2>
                        <p style={{ margin: 0, opacity: 0.9 }}>Everything assigned by admin in one organized view.</p>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <div style={{ background: 'rgba(255,255,255,0.14)', borderRadius: '12px', padding: '10px 12px', minWidth: '110px' }}>
                          <div style={{ fontSize: '12px', opacity: 0.85 }}>Assigned</div>
                          <div style={{ fontSize: '22px', fontWeight: 800 }}>{certificateCount}</div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.14)', borderRadius: '12px', padding: '10px 12px', minWidth: '110px' }}>
                          <div style={{ fontSize: '12px', opacity: 0.85 }}>Total Docs</div>
                          <div style={{ fontSize: '22px', fontWeight: 800 }}>{assignedDocs.length}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: '18px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
                      {assignedDocs.map((doc) => {
                        const isReady = Boolean(doc.filepath);
                        return (
                          <div
                            key={doc.key}
                            style={{
                              borderRadius: '16px',
                              border: `1px solid ${isReady ? '#cbd5e1' : '#fecaca'}`,
                              background: isReady ? 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)' : 'linear-gradient(180deg, #fff5f5 0%, #ffffff 100%)',
                              padding: '14px',
                              boxShadow: '0 10px 30px rgba(15, 23, 42, 0.05)',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '10px' }}>
                              <div>
                                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Assigned File</div>
                                <h3 style={{ margin: 0, color: '#0f172a', fontSize: '16px' }}>{doc.label}</h3>
                              </div>
                              <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 9px', borderRadius: '999px', background: isReady ? '#dcfce7' : '#fee2e2', color: isReady ? '#166534' : '#991b1b' }}>
                                {isReady ? 'READY' : 'MISSING'}
                              </span>
                            </div>

                            <div style={{ marginTop: '12px', display: 'grid', gap: '8px' }}>
                              <div style={{ fontSize: '13px', color: '#334155' }}>
                                <strong>File:</strong> {doc.filename || 'Not uploaded'}
                              </div>
                              <div style={{ fontSize: '13px', color: '#334155' }}>
                                <strong>Uploaded:</strong> {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString('en-IN') : '-'}
                              </div>

                              {isReady ? (
                                <a
                                  href={resolveFileUrl(doc.filepath)}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    marginTop: '6px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    width: 'fit-content',
                                    padding: '9px 14px',
                                    borderRadius: '10px',
                                    background: '#0f172a',
                                    color: '#fff',
                                    textDecoration: 'none',
                                    fontWeight: 700,
                                    fontSize: '13px',
                                  }}
                                >
                                  Open Document
                                </a>
                              ) : (
                                <div style={{ marginTop: '6px', color: '#64748b', fontSize: '13px' }}>This document has not been assigned yet.</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>

                <aside style={{ display: 'grid', gap: '16px' }}>
                  <section className="premium-card" style={{ padding: '16px' }}>
                    <h2 style={{ marginTop: 0, marginBottom: '12px' }}>Certification Metadata</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
                      <div style={{ padding: '12px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}><strong>PGIR ID</strong><div style={{ marginTop: '6px' }}>{profile?.pgirId || '-'}</div></div>
                      <div style={{ padding: '12px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}><strong>Designation</strong><div style={{ marginTop: '6px' }}>{profile?.designation || '-'}</div></div>
                      <div style={{ padding: '12px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}><strong>Joining Date</strong><div style={{ marginTop: '6px' }}>{profile?.joiningDate ? new Date(profile.joiningDate).toLocaleDateString('en-IN') : '-'}</div></div>
                      <div style={{ padding: '12px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}><strong>UPI ID</strong><div style={{ marginTop: '6px' }}>{profile?.upiId || '-'}</div></div>
                      <div style={{ padding: '12px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}><strong>UPI/Mobile</strong><div style={{ marginTop: '6px' }}>{profile?.upiMobileNumber || '-'}</div></div>
                      <div style={{ padding: '12px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}><strong>LinkedIn</strong><div style={{ marginTop: '6px' }}>{profile?.linkedinProfile || '-'}</div></div>
                    </div>
                  </section>

                  <section className="premium-card" style={{ padding: '16px' }}>
                    <h2 style={{ marginTop: 0, marginBottom: '12px' }}>Quick Links</h2>
                    <div style={{ display: 'grid', gap: '10px' }}>
                      <div style={{ padding: '12px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Application Form</div>
                        {profileApplicationFormLink ? <a href={profileApplicationFormLink} target="_blank" rel="noreferrer">Open</a> : <span style={{ color: '#64748b' }}>Not available</span>}
                      </div>
                      <div style={{ padding: '12px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Internship Sheet</div>
                        {profileInternshipSheetLink ? <a href={profileInternshipSheetLink} target="_blank" rel="noreferrer">Open</a> : <span style={{ color: '#64748b' }}>Not available</span>}
                      </div>
                    </div>
                  </section>

                  <section className="premium-card" style={{ padding: '16px' }}>
                    <h2 style={{ marginTop: 0, marginBottom: '12px' }}>Promotional Messages</h2>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      <div style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '12px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Internship</div>
                        <div style={{ color: '#0f172a', lineHeight: 1.55 }}>{profile?.internshipPromotionalMessage || 'Not provided'}</div>
                      </div>
                      <div style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '12px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>SMS Program</div>
                        <div style={{ color: '#0f172a', lineHeight: 1.55 }}>{profile?.smsPromotionalMessage || 'Not provided'}</div>
                      </div>
                    </div>
                  </section>
                </aside>
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
