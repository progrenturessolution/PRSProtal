import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { representativeAPI, UPLOADS_BASE } from '../services/api';
import logo from '../assets/logo.png';
import LoadingSpinner from '../components/LoadingSpinner';

const initialStudentForm = {
  studentType: 'Internship',
  internId: '',
  name: '',
  email: '',
  mobile: '',
  password: '',
  domain: '',
  customDomain: '',
  joiningDate: '',
  endingDate: '',
  duration: '',
  collegeName: '',
  branch: '',
  yearOfStudy: '',
  suggestedDomain: '',
  currentQualification: '',
  instituteName: '',
  instituteLocation: '',
  enrolmentDate: '',
  enrolBatchMonth: '',
  totalFees: '',
  firstPaymentAmount: '',
  firstPaymentDate: '',
  secondPaymentAmount: '',
  secondPaymentDate: '',
  finalPaymentAmount: '',
  finalPaymentDate: '',
  completedFees: '',
  pendingFees: '',
  currentDesignation: '',
  stipendType: 'Unstipend',
  stipendAmount: '',
};

/* ─────────────── Sidebar ─────────────── */
function RepSidebar({ activeTab, onSelectTab, sidebarOpen, setSidebarOpen, user, onLogout, showNotificationDot = false }) {
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
    { key: 'my-students', label: 'My Added Students', icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    )},
    { key: 'performance', label: 'Weekly Performance & Rewards', icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    )},
    { key: 'certificates', label: 'Documents', icon: (
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
          <img src={logo} alt="PRS Portal" className="sidebar-logo" />
        </div>
        <h2>PRS PORTAL</h2>
        <p>Representative Portal</p>
      </div>

      <div className="sidebar-user-summary">
        <p className="sidebar-user-label">Welcome,</p>
        <p className="sidebar-user-name">{user?.name || "Representative"}</p>
        <p className="sidebar-user-role">Representative</p>
      </div>
      <ul className="sidebar-menu">
        {items.map(item => (
          <li
            key={item.key}
            className={activeTab === item.key ? 'active' : ''}
            onClick={() => onSelectTab(item.key)}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">{item.icon}</svg>
            {item.label}
            {item.key === 'notifications' && showNotificationDot && <span className="sidebar-notification-dot" aria-hidden="true" />}
          </li>
        ))}
      </ul>

      <button
        className="logout-btn"
        onClick={() => {
          if (onLogout) onLogout();
          setSidebarOpen(false);
        }}
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
        Logout
      </button>
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  // Add student state
  const [studentForm, setStudentForm] = useState(initialStudentForm);
  const [studentFormLoading, setStudentFormLoading] = useState(false);
  const [studentFormError, setStudentFormError] = useState('');
  const [studentFormSuccess, setStudentFormSuccess] = useState('');
  const [smsEnrollmentFile, setSmsEnrollmentFile] = useState(null);
  const [smsOfferFile, setSmsOfferFile] = useState(null);
  const [smsPaymentFile, setSmsPaymentFile] = useState(null);
  const [studentStats, setStudentStats] = useState({
    totalStudents: 0,
    weeklyStudents: 0,
    monthlyStudents: 0,
    byType: { internship: 0, smsProgram: 0 }
  });
  const [payouts, setPayouts] = useState([]);
  const [payoutsLoading, setPayoutsLoading] = useState(false);

  // Assigned students filter state
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [filters, setFilters] = useState({ name: '', mobile: '', dateFrom: '', dateTo: '' });
  const [deleteSuccess, setDeleteSuccess] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentProfileModal, setShowStudentProfileModal] = useState(false);
  const [showStudentEditModal, setShowStudentEditModal] = useState(false);
  const [studentEditForm, setStudentEditForm] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState('');

  const calculatePendingFees = (data) => {
    const total = Number(data.totalFees || 0);
    const first = Number(data.firstPaymentAmount || 0);
    const second = Number(data.secondPaymentAmount || 0);
    const final = Number(data.finalPaymentAmount || 0);
    return String(Math.max(total - (first + second + final), 0));
  };

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const role = localStorage.getItem('userRole');
    if (!stored || role !== 'representative') {
      navigate('/');
      return;
    }
    setUser(JSON.parse(stored));
    fetchProfile();
    fetchStudents();
    fetchStudentStats();
    fetchPayouts();
    fetchNotifications();
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

  const fetchNotifications = async () => {
    try {
      setNotificationsLoading(true);
      setNotificationsError('');
      const res = await representativeAPI.getMyNotifications();
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error('Fetch notification error:', err);
      setNotificationsError(err.response?.data?.message || 'Failed to load notifications');
    } finally {
      setNotificationsLoading(false);
    }
  };

  const markNotificationsRead = async () => {
    try {
      await representativeAPI.markNotificationsRead();
    } catch (err) {
      console.error('Mark notifications read error:', err);
    }
  };

  const handleSelectTab = async (tabKey) => {
    setActiveTab(tabKey);
    setSidebarOpen(false);

    if (tabKey === 'notifications') {
      await markNotificationsRead();
      await fetchNotifications();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    navigate('/');
  };

  /* ── Profile Edit ── */
  const startEdit = () => {
    setEditData({
      name: profile?.name || '',
      designation: profile?.designation || '',
      college: profile?.college || '',
      course: profile?.course || '',
      department: profile?.department || '',
      year: profile?.year || '',
      mobile: profile?.mobile || '',
      email: profile?.email || '',
      upiId: profile?.upiId || '',
      upiMobileNumber: profile?.upiMobileNumber || '',
      instagramProfile: profile?.instagramProfile || '',
      linkedinProfile: profile?.linkedinProfile || '',
      joiningDate: profile?.joiningDate ? new Date(profile.joiningDate).toISOString().split('T')[0] : '',
      sheetLinks: profile?.sheetLinks || '',
      internshipApplicationFormLink: profile?.internshipApplicationFormLink || '',
      internshipSheetLink: profile?.internshipSheetLink || '',
      internshipPromotionalMessage: profile?.internshipPromotionalMessage || '',
      smsPromotionalMessage: profile?.smsPromotionalMessage || '',
      password: ''
    });
    setEditError('');
    setShowEditModal(true);
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setEditError('');
    setEditData({});
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
        const updatedUser = {
          ...user,
          name: res.data.representative.name,
          email: res.data.representative.email,
        };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setEditSuccess('Profile updated successfully!');
        setTimeout(() => {
          setShowEditModal(false);
          setEditSuccess('');
        }, 1800);
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
    setStudentForm((prev) => {
      const next = { ...prev, [name]: value };

      if (
        ['totalFees', 'firstPaymentAmount', 'secondPaymentAmount', 'finalPaymentAmount'].includes(name)
      ) {
        const first = Number(next.firstPaymentAmount || 0);
        const second = Number(next.secondPaymentAmount || 0);
        const final = Number(next.finalPaymentAmount || 0);
        next.completedFees = String(first + second + final);
        next.pendingFees = calculatePendingFees(next);
      }

      return next;
    });
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
      (!studentForm.internId || !studentForm.domain || !studentForm.joiningDate || !studentForm.duration || !studentForm.collegeName || !studentForm.branch || !studentForm.yearOfStudy)
    ) {
      setStudentFormError('For internship, PIID, domain, joining date, duration, college, branch and year of study are required');
      return;
    }

    if (studentForm.studentType === 'Internship' && studentForm.stipendType === 'Stipend' && (!studentForm.stipendAmount || Number(studentForm.stipendAmount) <= 0)) {
      setStudentFormError('Please enter stipend amount for stipend-based internships');
      return;
    }

    if (
      studentForm.studentType === 'SMS Program' &&
      (!studentForm.internId || !studentForm.suggestedDomain || !studentForm.instituteName || !studentForm.yearOfStudy || !studentForm.enrolmentDate || !studentForm.enrolBatchMonth || !studentForm.totalFees)
    ) {
      setStudentFormError('For SMS Program, PSMS ID, suggested domain, institute name, year, enrolment date, enrol batch month and total fees are required');
      return;
    }

    const payload = { ...studentForm };
    if (payload.studentType === 'Internship' && payload.domain === 'Other') {
      payload.domain = payload.customDomain;
    }

    const submitData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      submitData.append(key, value || '');
    });

    if (payload.studentType === 'SMS Program') {
      if (smsEnrollmentFile) submitData.append('smsProgramEnrollmentLetter', smsEnrollmentFile);
      if (smsOfferFile) submitData.append('offerLetter', smsOfferFile);
      if (smsPaymentFile) submitData.append('paymentReceipt', smsPaymentFile);
    }

    try {
      setStudentFormLoading(true);
      const res = await representativeAPI.addStudent(submitData);
      if (res.data.success) {
        const intern = res.data.intern;
        setStudentFormSuccess(`Student added successfully! ID: ${intern.internId}.`);
        setStudentForm(initialStudentForm);
        setSmsEnrollmentFile(null);
        setSmsOfferFile(null);
        setSmsPaymentFile(null);
        fetchStudents();
        fetchStudentStats();
        fetchNotifications();
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
    setShowStudentProfileModal(true);
    setOpenMenuId(null);
  };

  const handleEditStudent = (student) => {
    setSelectedStudent(student);
    setStudentEditForm({
      internId: student.internId || '',
      name: student.name || '',
      email: student.email || '',
      mobile: student.mobile || '',
      studentType: student.studentType || '',
      currentDesignation: student.currentDesignation || '',
      domain: student.domain || '',
      duration: student.duration || '',
      collegeName: student.collegeName || '',
      branch: student.branch || '',
      yearOfStudy: student.yearOfStudy || '',
      suggestedDomain: student.suggestedDomain || '',
      currentQualification: student.currentQualification || '',
      instituteName: student.instituteName || '',
      instituteLocation: student.instituteLocation || '',
      enrolmentDate: student.enrolmentDate ? new Date(student.enrolmentDate).toISOString().slice(0, 10) : '',
      enrolBatchMonth: student.enrolBatchMonth || '',
      totalFees: student.totalFees || '',
      joiningDate: student.joiningDate ? new Date(student.joiningDate).toISOString().slice(0, 10) : '',
      endingDate: student.endingDate ? new Date(student.endingDate).toISOString().slice(0, 10) : '',
      gender: student.gender || '',
      paymentDoneBy: student.paymentDoneBy || '',
      transactionId: student.transactionId || '',
      dateOfPayment: student.dateOfPayment ? new Date(student.dateOfPayment).toISOString().slice(0, 10) : '',
      paymentAmount: student.paymentAmount || '',
      firstPaymentAmount: student.firstPaymentAmount || '',
      firstPaymentDate: student.firstPaymentDate ? new Date(student.firstPaymentDate).toISOString().slice(0, 10) : '',
      secondPaymentAmount: student.secondPaymentAmount || '',
      secondPaymentDate: student.secondPaymentDate ? new Date(student.secondPaymentDate).toISOString().slice(0, 10) : '',
      finalPaymentAmount: student.finalPaymentAmount || '',
      finalPaymentDate: student.finalPaymentDate ? new Date(student.finalPaymentDate).toISOString().slice(0, 10) : '',
      completedFees: student.completedFees || '',
      pendingFees: student.pendingFees || '',
      lastPaymentDate: student.lastPaymentDate ? new Date(student.lastPaymentDate).toISOString().slice(0, 10) : '',
    });
    setShowStudentEditModal(true);
    setOpenMenuId(null);
  };

  const handleStudentEditChange = (key, value) => {
    setStudentEditForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveStudentEdit = async () => {
    if (!selectedStudent || !studentEditForm) return;
    try {
      const response = await representativeAPI.updateStudent(selectedStudent._id, studentEditForm);
      if (response.data && response.data.success) {
        const updatedStudent = response.data.student;
        setStudents((prev) => prev.map((item) => (item._id === updatedStudent._id ? updatedStudent : item)));
        setSelectedStudent(updatedStudent);
        setShowStudentEditModal(false);
        setDeleteSuccess('Student updated successfully.');
        setTimeout(() => setDeleteSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Update student error:', err);
    }
  };

  const formatDateValue = (value) =>
    value ? new Date(value).toLocaleDateString() : 'Not set';

  const closeStudentProfileModal = () => {
    setShowStudentProfileModal(false);
    setSelectedStudent(null);
  };

  const toggleMenu = (id) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!openMenuId) return;
      if (e.target.closest('[data-menu]') || e.target.closest('[data-menu-toggle]')) return;
      setOpenMenuId(null);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

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

  const profileDisplayName = profile?.name || user?.name || 'Representative';
  const profileRole = profile?.designation || user?.role || 'Representative';
  const profileStatus = profile?.status || user?.status || 'active';
  const profileInitial = profileDisplayName ? profileDisplayName.charAt(0).toUpperCase() : 'R';

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
        onSelectTab={handleSelectTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        user={user}
        onLogout={handleLogout}
        showNotificationDot={notifications.some((notification) => !notification.isRead)}
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
                  <button className="logout-btn" onClick={handleLogout}>Logout</button>
                </div>
              </div>
              
              <div className="section-card">
                <h3>Admin Actions</h3>
                <div className="section-grid" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'center' }}>
                  <div className="field-col">
                    <label>Quick Actions</label>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button className="btn-primary" onClick={() => setActiveTab('add-student')}>Add Student</button>
                      <button className="btn-secondary" onClick={() => setActiveTab('my-students')}>View Students</button>
                    </div>
                  </div>
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
                    <h3>My Added Students</h3>
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
                  <p className="header-subtitle">Manage your personal information</p>
                </div>
                <div className="header-right">
                  <button className="premium-btn-secondary" onClick={startEdit}>
                    Edit Profile
                  </button>
                </div>
              </div>

              {editSuccess && (
                <div className="success-message" style={{ marginBottom: '20px' }}>
                  {editSuccess}
                </div>
              )}

              <div className="profile-summary-card" style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div className="profile-top-avatar" style={{ width: 72, height: 72, fontSize: 32 }}>
                    {profileInitial}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 700 }}>{profileDisplayName}</div>
                      <div style={{ color: "#64748b", marginTop: 4 }}>
                        {profile?.pgirId || profile?.representativeId || ""} • {profileRole || "Representative"}
                        <span style={{ marginLeft: 10, fontSize: 12, color: "#475569", fontWeight: 700 }}>
                          {(profileStatus || "active").toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="profile-sections">
                <div className="section-card">
                  <h3>Personal Details</h3>
                  <div className="section-grid">
                    <div className="field-col"><label>Full Name</label><div className="field-value">{profile?.name || user?.name || "-"}</div></div>
                    <div className="field-col"><label>PGIR ID</label><div className="field-value mono-text">{profile?.pgirId || profile?.representativeId || "-"}</div></div>
                    <div className="field-col"><label>Designation</label><div className="field-value">{profileRole || "-"}</div></div>
                    <div className="field-col"><label>Account Status</label><div className="field-value">{profileStatus || "-"}</div></div>
                    {profile?.joiningDate && <div className="field-col"><label>Joining Date</label><div className="field-value">{new Date(profile.joiningDate).toLocaleDateString()}</div></div>}
                    {profile?.createdAt && <div className="field-col"><label>Profile Created</label><div className="field-value">{new Date(profile.createdAt).toLocaleDateString()}</div></div>}
                    {profile?.updatedAt && <div className="field-col"><label>Last Updated</label><div className="field-value">{new Date(profile.updatedAt).toLocaleDateString()}</div></div>}
                    <div className="field-col"><label>Total Students</label><div className="field-value">{totalStudents}</div></div>
                  </div>
                </div>

                <div className="section-card">
                  <h3>Contact Details</h3>
                  <div className="section-grid">
                    <div className="field-col"><label>Email Address</label><div className="field-value mono-text">{profile?.email || user?.email || "-"}</div></div>
                    <div className="field-col"><label>Mobile Number</label><div className="field-value mono-text">{profile?.mobile || user?.mobile || "-"}</div></div>
                    <div className="field-col"><label>UPI ID</label><div className="field-value mono-text">{profile?.upiId || "-"}</div></div>
                    <div className="field-col"><label>UPI Mobile Number</label><div className="field-value mono-text">{profile?.upiMobileNumber || "-"}</div></div>
                  </div>
                </div>

                <div className="section-card">
                  <h3>Work Profile</h3>
                  <div className="section-grid">
                    <div className="field-col">
                      <label>College</label>
                      <div className="field-value">{profile?.college || 'Not provided'}</div>
                    </div>
                    <div className="field-col">
                      <label>Course</label>
                      <div className="field-value">{profile?.course || 'Not provided'}</div>
                    </div>
                    <div className="field-col">
                      <label>Department</label>
                      <div className="field-value">{profile?.department || 'Not provided'}</div>
                    </div>
                    <div className="field-col">
                      <label>Year</label>
                      <div className="field-value">{profile?.year || 'Not provided'}</div>
                    </div>
                    <div className="field-col">
                      <label>Instagram Profile</label>
                      <div className="field-value">{profile?.instagramProfile || 'Not provided'}</div>
                    </div>
                    <div className="field-col">
                      <label>LinkedIn Profile</label>
                      <div className="field-value">{profile?.linkedinProfile || 'Not provided'}</div>
                    </div>
                  </div>
                </div>

                <div className="section-card">
                  <h3>Links & Messages</h3>
                  <div className="section-grid">
                    <div className="field-col">
                      <label>Application Form Link</label>
                      <div className="field-value" style={{ wordBreak: 'break-word' }}>{profile?.internshipApplicationFormLink || 'Not provided'}</div>
                    </div>
                    <div className="field-col">
                      <label>Internship Sheet Link</label>
                      <div className="field-value" style={{ wordBreak: 'break-word' }}>{profile?.internshipSheetLink || 'Not provided'}</div>
                    </div>
                    <div className="field-col">
                      <label>Sheet Links</label>
                      <div className="field-value" style={{ wordBreak: 'break-word' }}>{profile?.sheetLinks || 'Not provided'}</div>
                    </div>
                    <div className="field-col">
                      <label>Internship Promo Message</label>
                      <div className="field-value" style={{ whiteSpace: 'pre-wrap' }}>{profile?.internshipPromotionalMessage || 'Not provided'}</div>
                    </div>
                    <div className="field-col">
                      <label>SMS Promo Message</label>
                      <div className="field-value" style={{ whiteSpace: 'pre-wrap' }}>{profile?.smsPromotionalMessage || 'Not provided'}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="info-banner">
                <strong>Update Your Information</strong>
                <p>
                  Click the "Edit Profile" button above to update your details, links, and promotional content from one place.
                </p>
              </div>

              {showEditModal && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                  <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                      <h2>Edit Profile</h2>
                      <button className="modal-close-btn" onClick={handleCloseModal}>✕</button>
                    </div>

                    <form onSubmit={handleEditSubmit}>
                      {editError && (
                        <div className="error-message" style={{ marginBottom: '15px' }}>
                          {editError}
                        </div>
                      )}

                      <div className="form-group">
                        <label htmlFor="rep-edit-name">Full Name</label>
                        <input
                          id="rep-edit-name"
                          type="text"
                          name="name"
                          value={editData.name || ''}
                          onChange={handleEditChange}
                          placeholder="Full name"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="rep-edit-designation">Designation</label>
                        <input
                          id="rep-edit-designation"
                          type="text"
                          name="designation"
                          value={editData.designation || ''}
                          onChange={handleEditChange}
                          placeholder="Designation"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="rep-edit-college">College</label>
                        <input
                          id="rep-edit-college"
                          type="text"
                          name="college"
                          value={editData.college || ''}
                          onChange={handleEditChange}
                          placeholder="Enter college name"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="rep-edit-course">Course</label>
                        <input
                          id="rep-edit-course"
                          type="text"
                          name="course"
                          value={editData.course || ''}
                          onChange={handleEditChange}
                          placeholder="e.g. B.Tech"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="rep-edit-department">Department</label>
                        <input
                          id="rep-edit-department"
                          type="text"
                          name="department"
                          value={editData.department || ''}
                          onChange={handleEditChange}
                          placeholder="e.g. CSE"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="rep-edit-year">Year</label>
                        <select id="rep-edit-year" name="year" value={editData.year || ''} onChange={handleEditChange}>
                          <option value="">Select Year</option>
                          <option>1st Year</option>
                          <option>2nd Year</option>
                          <option>3rd Year</option>
                          <option>4th Year</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="rep-edit-mobile">Mobile Number</label>
                        <input
                          id="rep-edit-mobile"
                          type="tel"
                          name="mobile"
                          value={editData.mobile || ''}
                          onChange={handleEditChange}
                          placeholder="Mobile number"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="rep-edit-email">Email Address</label>
                        <input
                          id="rep-edit-email"
                          type="email"
                          name="email"
                          value={editData.email || ''}
                          onChange={handleEditChange}
                          placeholder="Email address"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="rep-edit-upi">UPI ID</label>
                        <input
                          id="rep-edit-upi"
                          type="text"
                          name="upiId"
                          value={editData.upiId || ''}
                          onChange={handleEditChange}
                          placeholder="name@upi"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="rep-edit-upiMobileNumber">UPI Mobile Number</label>
                        <input
                          id="rep-edit-upiMobileNumber"
                          type="text"
                          name="upiMobileNumber"
                          value={editData.upiMobileNumber || ''}
                          onChange={handleEditChange}
                          placeholder="UPI linked mobile number"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="rep-edit-joiningDate">Joining Date</label>
                        <input
                          id="rep-edit-joiningDate"
                          type="date"
                          name="joiningDate"
                          value={editData.joiningDate || ''}
                          onChange={handleEditChange}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="rep-edit-instagramProfile">Instagram Profile</label>
                        <input
                          id="rep-edit-instagramProfile"
                          type="text"
                          name="instagramProfile"
                          value={editData.instagramProfile || ''}
                          onChange={handleEditChange}
                          placeholder="Instagram URL or handle"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="rep-edit-linkedinProfile">LinkedIn Profile</label>
                        <input
                          id="rep-edit-linkedinProfile"
                          type="text"
                          name="linkedinProfile"
                          value={editData.linkedinProfile || ''}
                          onChange={handleEditChange}
                          placeholder="LinkedIn profile URL"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="rep-edit-sheetLinks">Sheet Links</label>
                        <input
                          id="rep-edit-sheetLinks"
                          type="text"
                          name="sheetLinks"
                          value={editData.sheetLinks || ''}
                          onChange={handleEditChange}
                          placeholder="Google sheet link"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="rep-edit-internshipApplicationFormLink">Application Form Link</label>
                        <input
                          id="rep-edit-internshipApplicationFormLink"
                          type="text"
                          name="internshipApplicationFormLink"
                          value={editData.internshipApplicationFormLink || ''}
                          onChange={handleEditChange}
                          placeholder="Internship application form link"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="rep-edit-internshipSheetLink">Internship Sheet Link</label>
                        <input
                          id="rep-edit-internshipSheetLink"
                          type="text"
                          name="internshipSheetLink"
                          value={editData.internshipSheetLink || ''}
                          onChange={handleEditChange}
                          placeholder="Internship sheet link"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="rep-edit-internshipPromotionalMessage">Internship Promo Message</label>
                        <textarea
                          id="rep-edit-internshipPromotionalMessage"
                          name="internshipPromotionalMessage"
                          value={editData.internshipPromotionalMessage || ''}
                          onChange={handleEditChange}
                          rows={3}
                          placeholder="Internship promotional message"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="rep-edit-smsPromotionalMessage">SMS Promo Message</label>
                        <textarea
                          id="rep-edit-smsPromotionalMessage"
                          name="smsPromotionalMessage"
                          value={editData.smsPromotionalMessage || ''}
                          onChange={handleEditChange}
                          rows={3}
                          placeholder="SMS program promotional message"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="rep-edit-password">New Password (Optional)</label>
                        <input
                          id="rep-edit-password"
                          type="password"
                          name="password"
                          value={editData.password || ''}
                          onChange={handleEditChange}
                          placeholder="Leave blank to keep current password"
                        />
                      </div>

                      <div className="modal-actions">
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={handleCloseModal}
                          disabled={editLoading}
                        >
                          Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={editLoading}>
                          {editLoading ? 'Updating...' : 'Update Profile'}
                        </button>
                      </div>
                    </form>
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

                  <div className="rep-add-student-grid">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Student Type *</label>
                      <select name="studentType" value={studentForm.studentType} onChange={handleStudentChange}>
                        <option value="Internship">Internship</option>
                        <option value="SMS Program">SMS Program</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>{studentForm.studentType === 'SMS Program' ? 'PSMS ID *' : 'PIID *'}</label>
                      <input
                        type="text"
                        name="internId"
                        value={studentForm.internId}
                        onChange={handleStudentChange}
                        placeholder={studentForm.studentType === 'SMS Program' ? 'Enter PSMS ID' : 'Enter PIID'}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Full Name *</label>
                      <input type="text" name="name" value={studentForm.name} onChange={handleStudentChange} placeholder="Full name" required />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Mobile Number (WhatsApp preferred) *</label>
                      <input type="tel" name="mobile" value={studentForm.mobile} onChange={handleStudentChange} placeholder="Mobile number" required />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Email *</label>
                      <input type="email" name="email" value={studentForm.email} onChange={handleStudentChange} placeholder="Email address" required />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Password *</label>
                      <input type="password" name="password" value={studentForm.password} onChange={handleStudentChange} placeholder="Set login password" min="6" required />
                    </div>

                    {studentForm.studentType === 'Internship' ? (
                      <>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Internship Domain *</label>
                          <select name="domain" value={studentForm.domain} onChange={handleStudentChange} required>
                            <option value="">Select Domain</option>
                            <option value="Web Development">Web Development</option>
                            <option value="App Development">App Development</option>
                            <option value="Data Science">Data Science</option>
                            <option value="Machine Learning">Machine Learning</option>
                            <option value="Artificial Intelligence">Artificial Intelligence</option>
                            <option value="UI/UX Design">UI/UX Design</option>
                            <option value="Graphic Design">Graphic Design</option>
                            <option value="Digital Marketing">Digital Marketing</option>
                            <option value="Content Writing">Content Writing</option>
                            <option value="Business Development">Business Development</option>
                            <option value="Human Resources">Human Resources</option>
                            <option value="Sales & Marketing">Sales & Marketing</option>
                            <option value="Finance">Finance</option>
                            <option value="Cybersecurity">Cybersecurity</option>
                            <option value="Cloud Computing">Cloud Computing</option>
                            <option value="DevOps">DevOps</option>
                            <option value="Full Stack Development">Full Stack Development</option>
                            <option value="Frontend Development">Frontend Development</option>
                            <option value="Backend Development">Backend Development</option>
                            <option value="Mobile App Development">Mobile App Development</option>
                            <option value="Game Development">Game Development</option>
                            <option value="Quality Assurance">Quality Assurance</option>
                            <option value="Project Management">Project Management</option>
                            <option value="Business Analytics">Business Analytics</option>
                            <option value="Other">Other (Type Manually)</option>
                          </select>
                        </div>
                        {studentForm.domain === 'Other' && (
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Enter Custom Domain *</label>
                            <input type="text" name="customDomain" value={studentForm.customDomain} onChange={handleStudentChange} placeholder="Enter custom domain" required />
                          </div>
                        )}
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Joining Date *</label>
                          <input type="date" name="joiningDate" value={studentForm.joiningDate} onChange={handleStudentChange} required />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Internship Duration *</label>
                          <input type="text" name="duration" value={studentForm.duration} onChange={handleStudentChange} placeholder="e.g. 3 months" required />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>College Name *</label>
                          <input type="text" name="collegeName" value={studentForm.collegeName} onChange={handleStudentChange} placeholder="Enter college name" required />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Branch *</label>
                          <input type="text" name="branch" value={studentForm.branch} onChange={handleStudentChange} placeholder="Enter branch" required />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Year of Study *</label>
                          <input type="text" name="yearOfStudy" value={studentForm.yearOfStudy} onChange={handleStudentChange} placeholder="e.g. 2nd Year" required />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Stipend Type</label>
                          <select name="stipendType" value={studentForm.stipendType} onChange={handleStudentChange}>
                            <option value="Unstipend">Unstipend</option>
                            <option value="Stipend">Stipend</option>
                          </select>
                        </div>
                        {studentForm.stipendType === 'Stipend' && (
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Stipend Amount (Rs.)</label>
                            <input type="number" name="stipendAmount" value={studentForm.stipendAmount} onChange={handleStudentChange} placeholder="Enter stipend amount" />
                          </div>
                        )}
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Ending Date</label>
                          <input type="date" name="endingDate" value={studentForm.endingDate} onChange={handleStudentChange} />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Suggested Domain (required) *</label>
                          <input type="text" name="suggestedDomain" value={studentForm.suggestedDomain} onChange={handleStudentChange} placeholder="Enter suggested domain" required />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Current Qualification</label>
                          <input type="text" name="currentQualification" value={studentForm.currentQualification} onChange={handleStudentChange} placeholder="e.g. Diploma, BCA" />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Full Name of College/Institute/School (required) *</label>
                          <input type="text" name="instituteName" value={studentForm.instituteName} onChange={handleStudentChange} placeholder="Enter institute name" required />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Year of Study (required) *</label>
                          <input type="text" name="yearOfStudy" value={studentForm.yearOfStudy} onChange={handleStudentChange} placeholder="e.g. 1st Year" required />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>City/Location of your College/Institute</label>
                          <input type="text" name="instituteLocation" value={studentForm.instituteLocation} onChange={handleStudentChange} placeholder="Enter city/location" />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Enrolment date (required) *</label>
                          <input type="date" name="enrolmentDate" value={studentForm.enrolmentDate} onChange={handleStudentChange} required />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Enrol Batch Month (required) *</label>
                          <input type="month" name="enrolBatchMonth" value={studentForm.enrolBatchMonth} onChange={handleStudentChange} required />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Total Fees (required) *</label>
                          <input type="number" name="totalFees" value={studentForm.totalFees} onChange={handleStudentChange} placeholder="Enter total fees" required />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>First Payment Amount</label>
                          <input type="number" name="firstPaymentAmount" value={studentForm.firstPaymentAmount} onChange={handleStudentChange} placeholder="Enter first payment" />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>First Payment Date</label>
                          <input type="date" name="firstPaymentDate" value={studentForm.firstPaymentDate} onChange={handleStudentChange} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Second Payment Amount</label>
                          <input type="number" name="secondPaymentAmount" value={studentForm.secondPaymentAmount} onChange={handleStudentChange} placeholder="Enter second payment" />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Second Payment Date</label>
                          <input type="date" name="secondPaymentDate" value={studentForm.secondPaymentDate} onChange={handleStudentChange} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Final Payment Amount</label>
                          <input type="number" name="finalPaymentAmount" value={studentForm.finalPaymentAmount} onChange={handleStudentChange} placeholder="Enter final payment" />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Final Payment Date</label>
                          <input type="date" name="finalPaymentDate" value={studentForm.finalPaymentDate} onChange={handleStudentChange} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Pending Fees</label>
                          <input type="number" name="pendingFees" value={studentForm.pendingFees} readOnly placeholder="Auto-calculated" />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Current Designation</label>
                          <input type="text" name="currentDesignation" value={studentForm.currentDesignation} onChange={handleStudentChange} placeholder="e.g. Student" />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>SMS Program Enrollment Letter</label>
                          <input type="file" accept="application/pdf,image/*" onChange={(e) => setSmsEnrollmentFile(e.target.files?.[0] || null)} />
                          <small>(Optional)</small>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Internship Offer Letter</label>
                          <input type="file" accept="application/pdf,image/*" onChange={(e) => setSmsOfferFile(e.target.files?.[0] || null)} />
                          <small>(Optional)</small>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Payment Recipt</label>
                          <input type="file" accept="application/pdf,image/*" onChange={(e) => setSmsPaymentFile(e.target.files?.[0] || null)} />
                          <small>(Optional)</small>
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

          {/* ─── MY ADDED STUDENTS ─── */}
          {activeTab === 'my-students' && (
            <>
              <div className="premium-page-header">
                <div className="header-left">
                  <h1>My Added Students</h1>
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
                      <table className="data-table view-students-table" style={{ minWidth: '860px' }}>
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Mobile</th>
                            <th>Type</th>
                            <th>Added By</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {students.map((student, index) => {
                            return (
                              <tr key={student._id}>
                                <td>{index + 1}</td>
                                <td>{student.internId || '—'}</td>
                                <td>{student.name || '—'}</td>
                                <td style={{ wordBreak: 'break-word' }}>{student.email || '—'}</td>
                                <td>{student.mobile || '—'}</td>
                                <td>{student.studentType || '—'}</td>
                                <td>
                                    {student.addedByRepresentative
                                      ? `Representative: ${student.addedByRepresentative.name}`
                                      : 'Admin'}
                                </td>
                                <td>
                                  <span
                                    className={`status-badge ${
                                      (student.status || '').toLowerCase() === 'active'
                                        ? 'status-active'
                                        : (student.status || '').toLowerCase() === 'completed'
                                          ? 'status-completed'
                                          : 'status-inactive'
                                    }`}
                                  >
                                    {student.status
                                      ? student.status.charAt(0).toUpperCase() + student.status.slice(1)
                                      : 'Active'}
                                  </span>
                                </td>
                                <td style={{ position: 'relative' }}>
                                  <button
                                    data-menu-toggle
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleMenu(student._id);
                                    }}
                                    style={{
                                      background: 'transparent',
                                      color: '#0f172a',
                                      border: '1px solid #d1d5db',
                                      borderRadius: '8px',
                                      width: '36px',
                                      height: '36px',
                                      cursor: 'pointer',
                                      fontSize: '20px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                  >
                                    ⋮
                                  </button>

                                  {openMenuId === student._id && (
                                    <div
                                      data-menu
                                      style={{
                                        position: 'absolute',
                                        right: 0,
                                        top: '42px',
                                        background: 'white',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '12px',
                                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                                        zIndex: 1000,
                                        minWidth: '180px',
                                        overflow: 'hidden',
                                      }}
                                    >
                                      <button
                                        onClick={() => {
                                          handleViewStudentDetails(student);
                                          setOpenMenuId(null);
                                        }}
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
                                        }}
                                        onMouseEnter={(e) => (e.target.style.background = '#f9fafb')}
                                        onMouseLeave={(e) => (e.target.style.background = 'white')}
                                      >
                                        View Profile
                                      </button>
                                      <button
                                        onClick={() => {
                                          handleDeleteStudent(student._id, student.name);
                                          setOpenMenuId(null);
                                        }}
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
                                          borderTop: '1px solid #f3f4f6',
                                        }}
                                        onMouseEnter={(e) => (e.target.style.background = '#fef2f2')}
                                        onMouseLeave={(e) => (e.target.style.background = 'white')}
                                      >
                                        Delete Student
                                      </button>
                                    </div>
                                  )}
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

          {showStudentProfileModal &&
            selectedStudent &&
            createPortal(
              <div className="profile-modal-overlay">
                <div className="profile-modal-container">
                  <div className="profile-body">
                    <div className="premium-page-header" style={{ marginBottom: '16px' }}>
                      <div className="header-left">
                        <h1 style={{ marginBottom: '4px' }}>Student Profile</h1>
                        <p className="header-subtitle">{selectedStudent.name}</p>
                      </div>
                      <div className="header-right">
                        <button className="premium-btn-secondary" onClick={closeStudentProfileModal}>
                          Close
                        </button>
                      </div>
                    </div>

                    <div className="premium-card" style={{ marginBottom: '16px' }}>
                      <div className="premium-card-header">
                        <h2>Personal Information</h2>
                      </div>

                      <div className="profile-info-grid">
                        <div className="profile-field">
                          <label>Full Name</label>
                          <div className="field-value">{selectedStudent.name || 'Not available'}</div>
                        </div>
                        <div className="profile-field">
                          <label>Email Address</label>
                          <div className="field-value mono-text">{selectedStudent.email || 'Not available'}</div>
                        </div>
                        <div className="profile-field">
                          <label>Mobile Number</label>
                          <div className="field-value mono-text">{selectedStudent.mobile || 'Not available'}</div>
                        </div>
                        <div className="profile-field">
                          <label>Student ID</label>
                          <div className="field-value mono-text">{selectedStudent.internId || 'Not available'}</div>
                        </div>
                        <div className="profile-field">
                          <label>Student Type</label>
                          <div className="field-value">
                            <span className="badge-neutral">{selectedStudent.studentType || 'Not set'}</span>
                          </div>
                        </div>
                        <div className="profile-field">
                          <label>Status</label>
                          <div className="field-value">
                            <span className="badge-neutral">{selectedStudent.status || 'active'}</span>
                          </div>
                        </div>
                        <div className="profile-field">
                          <label>Current Designation</label>
                          <div className="field-value">{selectedStudent.currentDesignation || 'Not set'}</div>
                        </div>
                        <div className="profile-field">
                          <label>Registered On</label>
                          <div className="field-value">{formatDateValue(selectedStudent.createdAt)}</div>
                        </div>
                        <div className="profile-field">
                          <label>Joining Date</label>
                          <div className="field-value">{formatDateValue(selectedStudent.joiningDate)}</div>
                        </div>
                        <div className="profile-field">
                          <label>Ending Date</label>
                          <div className="field-value">{formatDateValue(selectedStudent.endingDate)}</div>
                        </div>
                        <div className="profile-field">
                          <label>Duration</label>
                          <div className="field-value">{selectedStudent.duration || 'Not set'}</div>
                        </div>

                        {selectedStudent.studentType === 'Internship' ? (
                          <>
                            <div className="profile-field">
                              <label>Domain</label>
                              <div className="field-value">{selectedStudent.domain || 'Not set'}</div>
                            </div>
                            <div className="profile-field">
                              <label>College Name</label>
                              <div className="field-value">{selectedStudent.collegeName || 'Not set'}</div>
                            </div>
                            <div className="profile-field">
                              <label>Branch</label>
                              <div className="field-value">{selectedStudent.branch || 'Not set'}</div>
                            </div>
                            <div className="profile-field">
                              <label>Year of Study</label>
                              <div className="field-value">{selectedStudent.yearOfStudy || 'Not set'}</div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="profile-field">
                              <label>Suggested Domain</label>
                              <div className="field-value">{selectedStudent.suggestedDomain || 'Not set'}</div>
                            </div>
                            <div className="profile-field">
                              <label>Current Qualification</label>
                              <div className="field-value">{selectedStudent.currentQualification || 'Not set'}</div>
                            </div>
                            <div className="profile-field">
                              <label>Institute Name</label>
                              <div className="field-value">{selectedStudent.instituteName || 'Not set'}</div>
                            </div>
                            <div className="profile-field">
                              <label>Institute Location</label>
                              <div className="field-value">{selectedStudent.instituteLocation || 'Not set'}</div>
                            </div>
                            <div className="profile-field">
                              <label>Enrolment Date</label>
                              <div className="field-value">{formatDateValue(selectedStudent.enrolmentDate)}</div>
                            </div>
                            <div className="profile-field">
                              <label>Batch Month</label>
                              <div className="field-value">{selectedStudent.enrolBatchMonth || 'Not set'}</div>
                            </div>
                            <div className="profile-field">
                              <label>Total Fees</label>
                              <div className="field-value">{selectedStudent.totalFees || '0'}</div>
                            </div>
                            <div className="profile-field">
                              <label>Completed Fees</label>
                              <div className="field-value">{selectedStudent.completedFees || '0'}</div>
                            </div>
                            <div className="profile-field">
                              <label>Pending Fees</label>
                              <div className="field-value">{selectedStudent.pendingFees || '0'}</div>
                            </div>
                            <div className="profile-field">
                              <label>Gender</label>
                              <div className="field-value">{selectedStudent.gender || 'Not set'}</div>
                            </div>
                            <div className="profile-field">
                              <label>Payment Done By</label>
                              <div className="field-value">{selectedStudent.paymentDoneBy || 'Not set'}</div>
                            </div>
                            <div className="profile-field">
                              <label>Transaction ID</label>
                              <div className="field-value mono-text">{selectedStudent.transactionId || 'Not set'}</div>
                            </div>
                            <div className="profile-field">
                              <label>Payment Amount</label>
                              <div className="field-value">{selectedStudent.paymentAmount || '0'}</div>
                            </div>
                            <div className="profile-field">
                              <label>Date of Payment</label>
                              <div className="field-value">{formatDateValue(selectedStudent.dateOfPayment)}</div>
                            </div>
                            <div className="profile-field">
                              <label>Last Payment Date</label>
                              <div className="field-value">{formatDateValue(selectedStudent.lastPaymentDate)}</div>
                            </div>
                            <div className="profile-field">
                              <label>First Payment</label>
                              <div className="field-value">
                                {(selectedStudent.firstPaymentAmount || '0') +
                                  (selectedStudent.firstPaymentDate
                                    ? ` on ${formatDateValue(selectedStudent.firstPaymentDate)}`
                                    : '')}
                              </div>
                            </div>
                            <div className="profile-field">
                              <label>Second Payment</label>
                              <div className="field-value">
                                {(selectedStudent.secondPaymentAmount || '0') +
                                  (selectedStudent.secondPaymentDate
                                    ? ` on ${formatDateValue(selectedStudent.secondPaymentDate)}`
                                    : '')}
                              </div>
                            </div>
                            <div className="profile-field">
                              <label>Final Payment</label>
                              <div className="field-value">
                                {(selectedStudent.finalPaymentAmount || '0') +
                                  (selectedStudent.finalPaymentDate
                                    ? ` on ${formatDateValue(selectedStudent.finalPaymentDate)}`
                                    : '')}
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="info-banner">
                        <strong>Profile Information</strong>
                        <p>
                          Is profile ka layout intern My Profile jaisa rakha gaya hai,
                          jisme sab main details clearly visible hain.
                        </p>
                      </div>
                    </div>

                    <div className="profile-actions">
                      <button className="profile-btn profile-btn-ghost" onClick={closeStudentProfileModal}>
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>,
              document.body,
            )}

          {showStudentEditModal && selectedStudent && studentEditForm && (
            <div className="modal-overlay" onClick={() => setShowStudentEditModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Edit Profile</h2>
                  <button className="modal-close-btn" onClick={() => setShowStudentEditModal(false)}>
                    ✕
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSaveStudentEdit();
                  }}
                >
                  <div className="form-group">
                    <label>Student Type</label>
                    <select
                      value={studentEditForm.studentType}
                      onChange={(e) => handleStudentEditChange('studentType', e.target.value)}
                    >
                      <option value="Internship">Internship</option>
                      <option value="SMS Program">SMS Program</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Student ID</label>
                    <input value={studentEditForm.internId} readOnly />
                  </div>

                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      value={studentEditForm.name}
                      onChange={(e) => handleStudentEditChange('name', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={studentEditForm.email}
                      onChange={(e) => handleStudentEditChange('email', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Mobile</label>
                    <input
                      value={studentEditForm.mobile}
                      onChange={(e) => handleStudentEditChange('mobile', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Current Designation</label>
                    <input
                      value={studentEditForm.currentDesignation}
                      onChange={(e) => handleStudentEditChange('currentDesignation', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Joining Date</label>
                    <input
                      type="date"
                      value={studentEditForm.joiningDate}
                      onChange={(e) => handleStudentEditChange('joiningDate', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Ending Date</label>
                    <input
                      type="date"
                      value={studentEditForm.endingDate}
                      onChange={(e) => handleStudentEditChange('endingDate', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Duration</label>
                    <input
                      value={studentEditForm.duration}
                      onChange={(e) => handleStudentEditChange('duration', e.target.value)}
                    />
                  </div>

                  {studentEditForm.studentType === 'Internship' ? (
                    <>
                      <div className="form-group">
                        <label>Domain</label>
                        <input
                          value={studentEditForm.domain}
                          onChange={(e) => handleStudentEditChange('domain', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>College Name</label>
                        <input
                          value={studentEditForm.collegeName}
                          onChange={(e) => handleStudentEditChange('collegeName', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Branch</label>
                        <input
                          value={studentEditForm.branch}
                          onChange={(e) => handleStudentEditChange('branch', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Year of Study</label>
                        <input
                          value={studentEditForm.yearOfStudy}
                          onChange={(e) => handleStudentEditChange('yearOfStudy', e.target.value)}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="form-group">
                        <label>Suggested Domain</label>
                        <input
                          value={studentEditForm.suggestedDomain}
                          onChange={(e) => handleStudentEditChange('suggestedDomain', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Current Qualification</label>
                        <input
                          value={studentEditForm.currentQualification}
                          onChange={(e) => handleStudentEditChange('currentQualification', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Institute Name</label>
                        <input
                          value={studentEditForm.instituteName}
                          onChange={(e) => handleStudentEditChange('instituteName', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Institute Location</label>
                        <input
                          value={studentEditForm.instituteLocation}
                          onChange={(e) => handleStudentEditChange('instituteLocation', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Enrolment Date</label>
                        <input
                          type="date"
                          value={studentEditForm.enrolmentDate}
                          onChange={(e) => handleStudentEditChange('enrolmentDate', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Batch Month</label>
                        <input
                          type="month"
                          value={studentEditForm.enrolBatchMonth}
                          onChange={(e) => handleStudentEditChange('enrolBatchMonth', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Total Fees</label>
                        <input
                          value={studentEditForm.totalFees}
                          onChange={(e) => handleStudentEditChange('totalFees', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Completed Fees</label>
                        <input
                          value={studentEditForm.completedFees}
                          onChange={(e) => handleStudentEditChange('completedFees', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Pending Fees</label>
                        <input
                          value={studentEditForm.pendingFees}
                          onChange={(e) => handleStudentEditChange('pendingFees', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Gender</label>
                        <select
                          value={studentEditForm.gender}
                          onChange={(e) => handleStudentEditChange('gender', e.target.value)}
                        >
                          <option value="">Select gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Payment Done By</label>
                        <input
                          value={studentEditForm.paymentDoneBy}
                          onChange={(e) => handleStudentEditChange('paymentDoneBy', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Transaction ID</label>
                        <input
                          value={studentEditForm.transactionId}
                          onChange={(e) => handleStudentEditChange('transactionId', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Date of Payment</label>
                        <input
                          type="date"
                          value={studentEditForm.dateOfPayment}
                          onChange={(e) => handleStudentEditChange('dateOfPayment', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Payment Amount</label>
                        <input
                          value={studentEditForm.paymentAmount}
                          onChange={(e) => handleStudentEditChange('paymentAmount', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>First Payment Amount</label>
                        <input
                          value={studentEditForm.firstPaymentAmount}
                          onChange={(e) => handleStudentEditChange('firstPaymentAmount', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>First Payment Date</label>
                        <input
                          type="date"
                          value={studentEditForm.firstPaymentDate}
                          onChange={(e) => handleStudentEditChange('firstPaymentDate', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Second Payment Amount</label>
                        <input
                          value={studentEditForm.secondPaymentAmount}
                          onChange={(e) => handleStudentEditChange('secondPaymentAmount', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Second Payment Date</label>
                        <input
                          type="date"
                          value={studentEditForm.secondPaymentDate}
                          onChange={(e) => handleStudentEditChange('secondPaymentDate', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Final Payment Amount</label>
                        <input
                          value={studentEditForm.finalPaymentAmount}
                          onChange={(e) => handleStudentEditChange('finalPaymentAmount', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Final Payment Date</label>
                        <input
                          type="date"
                          value={studentEditForm.finalPaymentDate}
                          onChange={(e) => handleStudentEditChange('finalPaymentDate', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Last Payment Date</label>
                        <input
                          type="date"
                          value={studentEditForm.lastPaymentDate}
                          onChange={(e) => handleStudentEditChange('lastPaymentDate', e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  <div className="modal-actions">
                    <button type="button" className="btn-secondary" onClick={() => setShowStudentEditModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      Save Changes
                    </button>
                  </div>
                </form>
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
                  <>
                    <div style={{
                      padding: '12px 20px', borderBottom: '1px solid #f3f4f6',
                      fontSize: '13px', color: '#6b7280'
                    }}>
                      Showing <strong style={{ color: '#374151' }}>{payouts.length}</strong> reward cycle{payouts.length !== 1 ? 's' : ''}
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="premium-table view-students-table" style={{ minWidth: '860px' }}>
                        <thead style={{ background: '#324158' }}>
                          <tr style={{ background: '#324158' }}>
                            <th style={{ background: '#324158', color: '#ffffff', fontWeight: 600 }}>Month</th>
                            <th style={{ background: '#324158', color: '#ffffff', fontWeight: 600 }}>Week</th>
                            <th style={{ background: '#324158', color: '#ffffff', fontWeight: 600 }}>Enrollments</th>
                            <th style={{ background: '#324158', color: '#ffffff', fontWeight: 600 }}>3000 Paid</th>
                            <th style={{ background: '#324158', color: '#ffffff', fontWeight: 600 }}>Eligible</th>
                            <th style={{ background: '#324158', color: '#ffffff', fontWeight: 600 }}>Reward %</th>
                            <th style={{ background: '#324158', color: '#ffffff', fontWeight: 600 }}>Payout (₹)</th>
                            <th style={{ background: '#324158', color: '#ffffff', fontWeight: 600 }}>Status</th>
                            <th style={{ background: '#324158', color: '#ffffff', fontWeight: 600 }}>Release Date</th>
                            <th style={{ background: '#324158', color: '#ffffff', fontWeight: 600 }}>UPI/QR</th>
                            <th style={{ background: '#324158', color: '#ffffff', fontWeight: 600 }}>Promo Docs</th>
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
                              <td style={{ fontWeight: 600, color: '#16a34a' }}>₹{row.payoutAmount || 0}</td>
                              <td>
                                <span
                                  style={{
                                    display: 'inline-block',
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    background: row.payoutStatus === 'Paid' ? '#dcfce7' : '#fef3c7',
                                    color: row.payoutStatus === 'Paid' ? '#166534' : '#92400e',
                                  }}
                                >
                                  {row.payoutStatus}
                                </span>
                              </td>
                              <td>{row.payoutReleaseDate ? new Date(row.payoutReleaseDate).toLocaleDateString('en-IN') : '-'}</td>
                              <td>{row.upiQrDriveLink ? <a href={row.upiQrDriveLink} target="_blank" rel="noreferrer" style={{ color: '#324158', fontWeight: 600 }}>Open</a> : '-'}</td>
                              <td>{row.promotionalDocumentsLink ? <a href={row.promotionalDocumentsLink} target="_blank" rel="noreferrer" style={{ color: '#324158', fontWeight: 600 }}>Open</a> : '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {/* ─── DOCUMENTS ─── */}
          {activeTab === 'certificates' && (
            <>
              <div className="premium-page-header">
                <div className="header-left">
                  <h1>Documents</h1>
                  <p className="header-subtitle">Assigned files, certification details and quick access</p>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '16px' }}>
                <div
                  className="premium-card"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '12px',
                    padding: '16px',
                  }}
                >
                  <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Assigned Documents</div>
                    <div style={{ fontSize: '22px', fontWeight: '700', color: '#111827' }}>{certificateCount}</div>
                  </div>
                  <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Total Document Types</div>
                    <div style={{ fontSize: '22px', fontWeight: '700', color: '#111827' }}>{assignedDocs.length}</div>
                  </div>
                </div>

                <section className="premium-card" style={{ padding: '0', overflow: 'hidden' }}>
                  <div style={{ padding: '16px 18px', borderBottom: '1px solid #eef2f7' }}>
                    <h2 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>Your Assigned Documents</h2>
                    <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '13px' }}>All assigned certificate files in a simple view.</p>
                  </div>

                  <div style={{ overflowX: 'auto', padding: '0 12px 12px' }}>
                    <table className="data-table view-students-table" style={{ minWidth: '760px' }}>
                      <thead>
                        <tr>
                          <th>Document</th>
                          <th>File Name</th>
                          <th>Uploaded On</th>
                          <th>Status</th>
                          <th>Open File</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignedDocs.map((doc) => {
                          const isReady = Boolean(doc.filepath);
                          return (
                            <tr key={doc.key}>
                              <td>{doc.label}</td>
                              <td style={{ wordBreak: 'break-word' }}>{doc.filename || 'Not uploaded'}</td>
                              <td>{doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString('en-IN') : '-'}</td>
                              <td>
                                <span
                                  style={{
                                    padding: '4px 10px',
                                    borderRadius: '999px',
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    background: isReady ? '#dcfce7' : '#f3f4f6',
                                    color: isReady ? '#166534' : '#4b5563',
                                  }}
                                >
                                  {isReady ? 'Ready' : 'Missing'}
                                </span>
                              </td>
                              <td>
                                {isReady ? (
                                  <a
                                    href={resolveFileUrl(doc.filepath)}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                      padding: '6px 12px',
                                      borderRadius: '8px',
                                      background: '#324158',
                                      color: '#fff',
                                      textDecoration: 'none',
                                      fontSize: '12px',
                                      fontWeight: '600',
                                    }}
                                  >
                                    Open
                                  </a>
                                ) : (
                                  <span style={{ color: '#9ca3af', fontSize: '12px' }}>Not available</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                  <section className="premium-card" style={{ padding: '16px' }}>
                    <h2 style={{ marginTop: 0, marginBottom: '12px' }}>Certification Metadata</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
                      <div style={{ padding: '10px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e5e7eb' }}><strong>PGIR ID</strong><div style={{ marginTop: '4px' }}>{profile?.pgirId || '-'}</div></div>
                      <div style={{ padding: '10px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e5e7eb' }}><strong>Designation</strong><div style={{ marginTop: '4px' }}>{profile?.designation || '-'}</div></div>
                      <div style={{ padding: '10px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e5e7eb' }}><strong>Joining Date</strong><div style={{ marginTop: '4px' }}>{profile?.joiningDate ? new Date(profile.joiningDate).toLocaleDateString('en-IN') : '-'}</div></div>
                      <div style={{ padding: '10px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e5e7eb' }}><strong>UPI ID</strong><div style={{ marginTop: '4px' }}>{profile?.upiId || '-'}</div></div>
                      <div style={{ padding: '10px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e5e7eb' }}><strong>UPI/Mobile</strong><div style={{ marginTop: '4px' }}>{profile?.upiMobileNumber || '-'}</div></div>
                      <div style={{ padding: '10px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e5e7eb' }}><strong>LinkedIn</strong><div style={{ marginTop: '4px' }}>{profile?.linkedinProfile || '-'}</div></div>
                    </div>
                  </section>

                  <section className="premium-card" style={{ padding: '16px' }}>
                    <h2 style={{ marginTop: 0, marginBottom: '12px' }}>Quick Links</h2>
                    <div style={{ display: 'grid', gap: '10px' }}>
                      <div style={{ padding: '10px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '6px' }}>Application Form</div>
                        {profileApplicationFormLink ? <a href={profileApplicationFormLink} target="_blank" rel="noreferrer" style={{ color: '#324158', fontWeight: 600 }}>Open</a> : <span style={{ color: '#9ca3af' }}>Not available</span>}
                      </div>
                      <div style={{ padding: '10px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '6px' }}>Internship Sheet</div>
                        {profileInternshipSheetLink ? <a href={profileInternshipSheetLink} target="_blank" rel="noreferrer" style={{ color: '#324158', fontWeight: 600 }}>Open</a> : <span style={{ color: '#9ca3af' }}>Not available</span>}
                      </div>

                      <div style={{ padding: '10px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '6px' }}>Internship Message</div>
                        <div style={{ color: '#0f172a', lineHeight: 1.5, fontSize: '13px' }}>{profile?.internshipPromotionalMessage || 'Not provided'}</div>
                      </div>
                      <div style={{ padding: '10px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '6px' }}>SMS Program Message</div>
                        <div style={{ color: '#0f172a', lineHeight: 1.5, fontSize: '13px' }}>{profile?.smsPromotionalMessage || 'Not provided'}</div>
                      </div>
                    </div>
                  </section>
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
                {notificationsLoading ? (
                  <div className="premium-empty-state">
                    <div className="empty-icon">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M4.93 4.93l14.14 14.14M20.07 4.93L5.93 19.07" />
                      </svg>
                    </div>
                    <p className="empty-title">Loading notifications</p>
                    <p className="empty-subtitle">Please wait while we fetch your latest updates</p>
                  </div>
                ) : notificationsError ? (
                  <div className="premium-empty-state">
                    <div className="empty-icon">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86l-7.42 12.8A2 2 0 004.59 20h14.82a2 2 0 001.72-3.34l-7.42-12.8a2 2 0 00-3.42 0z" />
                      </svg>
                    </div>
                    <p className="empty-title">Could not load notifications</p>
                    <p className="empty-subtitle">{notificationsError}</p>
                  </div>
                ) : notifications.length === 0 ? (
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
                ) : (
                  <div className="notification-list">
                    {notifications.map((notification) => (
                      <div key={notification._id} className={`notification-card ${notification.isRead ? 'read' : 'unread'}`}>
                        <div className="notification-card-header">
                          <div>
                            <h3>{notification.title}</h3>
                            <p>{notification.message}</p>
                          </div>
                          {!notification.isRead && <span className="notification-read-pill">New</span>}
                        </div>
                        <div className="notification-card-meta">
                          <span>{notification.notificationType || 'General'}</span>
                          <span>{new Date(notification.createdAt).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

        </div>
      </main>
      
    </div>
  );
}

export default RepresentativeDashboard;
