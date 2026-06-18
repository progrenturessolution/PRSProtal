import { useState, useEffect, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { adminAPI, UPLOADS_BASE } from '../services/api';

function SMSProgramManagement() {
  const [students, setStudents] = useState([]);
  const [uploadState, setUploadState] = useState({}); // { [studentId]: { uploading, success, filenames: [] } }
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [openDocs, setOpenDocs] = useState({});
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, openUpward: false });
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [documentModalStudent, setDocumentModalStudent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showInactiveModal, setShowInactiveModal] = useState(false);
  const [inactiveModalStudent, setInactiveModalStudent] = useState(null);
  const [inactiveModalMessage, setInactiveModalMessage] = useState('');
  const [inactiveModalLoading, setInactiveModalLoading] = useState(false);
  const [inactiveModalError, setInactiveModalError] = useState('');
  const [showCertificateUpload, setShowCertificateUpload] = useState(false);
  const [certificateFile, setCertificateFile] = useState(null);
  const [certificateType, setCertificateType] = useState('offerLetter');
  const [certificateName, setCertificateName] = useState('');
  const [uploadingCert, setUploadingCert] = useState(false);
  const [certificateUploadStatus, setCertificateUploadStatus] = useState(null);
  const [editForm, setEditForm] = useState({
    internId: '',
    name: '',
    email: '',
    mobile: '',
    suggestedDomain: '',
    currentQualification: '',
    instituteName: '',
    instituteLocation: '',
    yearOfStudy: '',
    enrolmentDate: '',
    enrolBatchMonth: '',
    totalFees: '',
    firstPaymentAmount: '',
    firstPaymentDate: '',
    secondPaymentAmount: '',
    secondPaymentDate: '',
    finalPaymentAmount: '',
    finalPaymentDate: '',
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

  const certificateTypeOptions = [
    { value: 'offerLetter', label: 'Offer Letter' },
    { value: 'welcomeLetter', label: 'Welcome Letter' },
    { value: 'paymentReceipt', label: 'Payment Receipt' },
    { value: 'smsProgramEnrollmentLetter', label: 'SMS Program Enrollment Letter' },
    { value: 'completionCertificate', label: 'Completion Certificate' },
    { value: 'experienceLetter', label: 'Experience Letter' },
    { value: 'other', label: 'Other' },
  ];

  const directCertificateTypes = [
    'offerLetter',
    'welcomeLetter',
    'paymentReceipt',
    'smsProgramEnrollmentLetter',
    'completionCertificate',
    'experienceLetter',
  ];

  const handleCertificateUpload = async () => {
    if (!certificateFile) {
      alert('Please select a file to upload');
      return;
    }

    if (certificateType === 'other' && !certificateName.trim()) {
      alert('Please enter certificate name for Other type');
      return;
    }

    const selectedOption = certificateTypeOptions.find(
      (item) => item.value === certificateType,
    );
    const isDirectType = directCertificateTypes.includes(certificateType);
    const uploadDocumentType = isDirectType ? certificateType : 'other';

    setUploadingCert(true);
    try {
      const formData = new FormData();
      formData.append('file', certificateFile);
      formData.append('documentType', uploadDocumentType);
      if (!isDirectType) {
        formData.append(
          'certificateName',
          certificateType === 'other'
            ? certificateName.trim()
            : selectedOption?.label || 'Other Certificate',
        );
      }

      const response = await adminAPI.uploadStudentDocument(
        selectedStudent._id,
        formData,
      );

      if (response.data && response.data.success) {
        // Update selected student
        setSelectedStudent((prev) => {
          let updatedDocuments = { ...(prev.documents || {}) };

          if (!isDirectType) {
            const existingOther = updatedDocuments.otherCertificates || [];
            updatedDocuments.otherCertificates = [
              ...existingOther,
              response.data.document,
            ];
          } else {
            updatedDocuments[certificateType] = response.data.document;
          }

          return {
            ...prev,
            documents: updatedDocuments,
          };
        });

        // Update students list
        setStudents(prev => prev.map(s => {
          if (s._id === selectedStudent._id) {
            let updatedDocuments = { ...(s.documents || {}) };
            if (!isDirectType) {
              const existingOther = updatedDocuments.otherCertificates || [];
              updatedDocuments.otherCertificates = [
                ...existingOther,
                response.data.document,
              ];
            } else {
              updatedDocuments[certificateType] = response.data.document;
            }
            return {
              ...s,
              documents: updatedDocuments,
            };
          }
          return s;
        }));

        setCertificateUploadStatus({
          success: true,
          label: !isDirectType
            ? certificateType === 'other'
              ? certificateName.trim()
              : selectedOption?.label || 'Other Certificate'
            : selectedOption?.label || 'Certificate',
        });
        setCertificateFile(null);
        setCertificateName('');
        setTimeout(() => setShowCertificateUpload(false), 1500);
      } else {
        setCertificateUploadStatus({ success: false });
      }
    } catch (err) {
      console.error('Upload error:', err);
      setCertificateUploadStatus({ success: false });
    } finally {
      setUploadingCert(false);
    }
  };

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
  const [filterAddedBy, setFilterAddedBy] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSMSStudents();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!openMenuId) return;
      if (
        e.target.closest('[data-menu]') ||
        e.target.closest('[data-menu-toggle]')
      )
        return;
      setOpenMenuId(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

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

    // Apply added by filter
    if (filterAddedBy === 'Admin') {
      filtered = filtered.filter(student => !student.addedByRepresentative);
    } else if (filterAddedBy === 'Representative') {
      filtered = filtered.filter(student => !!student.addedByRepresentative);
    }

    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(student =>
        (student.name && student.name.toLowerCase().includes(query)) ||
        (student.email && student.email.toLowerCase().includes(query)) ||
        (student.internId && student.internId.toLowerCase().includes(query)) ||
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
      internId: selectedStudent.internId || '',
      name: selectedStudent.name || '',
      email: selectedStudent.email || '',
      mobile: selectedStudent.mobile || '',
      suggestedDomain: selectedStudent.suggestedDomain || '',
      currentQualification: selectedStudent.currentQualification || '',
      instituteName: selectedStudent.instituteName || '',
      instituteLocation: selectedStudent.instituteLocation || '',
      yearOfStudy: selectedStudent.yearOfStudy || '',
      enrolmentDate: selectedStudent.enrolmentDate ? selectedStudent.enrolmentDate.split('T')[0] : '',
      enrolBatchMonth: selectedStudent.enrolBatchMonth || '',
      totalFees: selectedStudent.totalFees || '',
      firstPaymentAmount: selectedStudent.firstPaymentAmount || '',
      firstPaymentDate: selectedStudent.firstPaymentDate ? selectedStudent.firstPaymentDate.split('T')[0] : '',
      secondPaymentAmount: selectedStudent.secondPaymentAmount || '',
      secondPaymentDate: selectedStudent.secondPaymentDate ? selectedStudent.secondPaymentDate.split('T')[0] : '',
      finalPaymentAmount: selectedStudent.finalPaymentAmount || '',
      finalPaymentDate: selectedStudent.finalPaymentDate ? selectedStudent.finalPaymentDate.split('T')[0] : '',
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
      internId: '',
      name: '',
      email: '',
      mobile: '',
      suggestedDomain: '',
      currentQualification: '',
      instituteName: '',
      instituteLocation: '',
      yearOfStudy: '',
      enrolmentDate: '',
      enrolBatchMonth: '',
      totalFees: '',
      firstPaymentAmount: '',
      firstPaymentDate: '',
      secondPaymentAmount: '',
      secondPaymentDate: '',
      finalPaymentAmount: '',
      finalPaymentDate: '',
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

  const getBatchStartMonthYear = (student) => {
    const dateSource = student.enrolmentDate || student.joiningDate;
    if (dateSource) {
      return new Date(dateSource).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric'
      });
    }
    return student.enrolBatchMonth || 'N/A';
  };

  const parseMoney = (value) => {
    if (value === null || value === undefined || value === '') return 0;
    const cleaned = String(value).replace(/[^0-9.-]/g, '');
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const getPaidAmount = (student) => {
    const directPayment = parseMoney(student.paymentAmount);
    if (directPayment > 0) return directPayment;

    const completedFees = parseMoney(student.completedFees);
    if (completedFees > 0) return completedFees;

    const splitPayments =
      parseMoney(student.firstPaymentAmount) +
      parseMoney(student.secondPaymentAmount) +
      parseMoney(student.finalPaymentAmount);

    return splitPayments;
  };

  const getTotalFeesDisplay = (student) => {
    const total = parseMoney(student.totalFees);
    if (Number.isFinite(total) && total > 0) return `Rs. ${total}`;

    const completed = parseMoney(student.completedFees);
    const pending = parseMoney(student.pendingFees);
    const fallbackTotal = completed + pending;
    return fallbackTotal > 0 ? `Rs. ${fallbackTotal}` : 'N/A';
  };

  const getPendingFeesDisplay = (student) => {
    const total = parseMoney(student.totalFees);
    if (total <= 0) {
      const fallbackPending = parseMoney(student.pendingFees);
      return Number.isFinite(fallbackPending) ? `Rs. ${Math.round(fallbackPending)}` : 'N/A';
    }

    const paid = getPaidAmount(student);
    const pending = Math.max(0, total - paid);
    return `Rs. ${Math.round(pending)}`;
  };

  const handleStatusToggle = async (student) => {
    const current = (student.status || '').toLowerCase();
    const nextStatus = current === 'active' ? 'inactive' : 'active';

    if (nextStatus === 'inactive') {
      setInactiveModalStudent(student);
      setInactiveModalMessage('');
      setInactiveModalError('');
      setShowInactiveModal(true);
      return;
    }

    try {
      await adminAPI.updateInternStatus(student._id, nextStatus);
      const label = nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1);
      setStudents((prev) =>
        prev.map((s) =>
          s._id === student._id ? { ...s, status: label, inactiveMessage: '' } : s,
        ),
      );
      setSelectedStudent((prev) =>
        prev && prev._id === student._id ? { ...prev, status: label, inactiveMessage: '' } : prev,
      );
      setOpenMenuId(null);
      setInfoMessage('Student activated successfully');
      setTimeout(() => setInfoMessage(''), 4000);
    } catch (err) {
      console.error('Status update error:', err);
      alert('Failed to update status.');
    }
  };

  const handleMarkCompleted = async (student) => {
    const confirmed = window.confirm(`Mark ${student.name} as completed?`);
    if (!confirmed) return;

    try {
      await adminAPI.updateInternStatus(student._id, 'completed');
      setStudents((prev) =>
        prev.map((s) => (s._id === student._id ? { ...s, status: 'Completed' } : s)),
      );
      setSelectedStudent((prev) =>
        prev && prev._id === student._id ? { ...prev, status: 'Completed' } : prev,
      );
      setOpenMenuId(null);
    } catch (err) {
      console.error('Mark completed error:', err);
      alert('Failed to mark student as completed.');
    }
  };

  const handleDeleteStudent = async (student) => {
    const confirmed = window.confirm(
      `Archive ${student.name}? You can restore later from Archived Students.`,
    );
    if (!confirmed) return;

    try {
      await adminAPI.deleteIntern(student._id);
      setStudents((prev) => prev.filter((s) => s._id !== student._id));
      if (selectedStudent?._id === student._id) {
        setSelectedStudent(null);
      }
      setOpenMenuId(null);
    } catch (err) {
      console.error('Delete student error:', err);
      alert('Failed to archive student.');
    }
  };

  const handleViewProgress = (student) => {
    setSelectedStudent(student);
    setOpenMenuId(null);
  };

  const handleManageCertificates = (student) => {
    setSelectedStudent(student);
    setIsEditing(false);
    setShowCertificateUpload(true);
    setCertificateUploadStatus(null);
    setCertificateFile(null);
    setCertificateName('');
    setCertificateType('offerLetter');
    setOpenMenuId(null);
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


        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.5fr) minmax(180px, 1fr) minmax(180px, 1fr)',
            gap: '12px',
            marginBottom: '20px',
            alignItems: 'end'
          }}
        >
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#0f172a'
              }}
            >
              Search Students
            </label>
            <input
              type="text"
              placeholder="Search by name, email, ID, designation, payment info..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                fontSize: '14px',
                background: 'white',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#0f172a'
              }}
            >
              Status Filter
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                fontSize: '14px',
                background: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#0f172a'
              }}
            >
              Added By
            </label>
            <select
              value={filterAddedBy}
              onChange={(e) => setFilterAddedBy(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                fontSize: '14px',
                background: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="All">All</option>
              <option value="Admin">Admin</option>
              <option value="Representative">Representative</option>
            </select>
          </div>
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
                  <th>Domain</th>
                  <th>Duration</th>
                  <th>Batch Start Month and Year</th>
                  <th>Added By</th>
                  <th>Total Fees</th>
                  <th>Pending Fees</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <Fragment key={student._id}>
                    <tr>
                      <td>{student.internId}</td>
                      <td>{student.name}</td>
                      <td>{student.suggestedDomain || student.domain || student.currentDesignation || 'N/A'}</td>
                      <td>{student.duration || 'N/A'}</td>
                      <td>{getBatchStartMonthYear(student)}</td>
                      <td>
                        {student.addedByRepresentative
                          ? `Representative: ${student.addedByRepresentative.name}`
                          : 'Admin'}
                      </td>
                      <td>{getTotalFeesDisplay(student)}</td>
                      <td>{getPendingFeesDisplay(student)}</td>
                      <td style={{ position: 'relative' }}>
                        <button
                          data-menu-toggle
                          onClick={(e) => {
                            e.stopPropagation();
                            if (openMenuId === student._id) {
                              setOpenMenuId(null);
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const spaceBelow = window.innerHeight - rect.bottom;
                              const spaceAbove = rect.top;
                              const menuHeight = 300;
                              const openUpward = spaceBelow < menuHeight && spaceAbove > spaceBelow;
                              setMenuPosition({
                                top: openUpward ? rect.top + window.scrollY - 4 : rect.bottom + window.scrollY + 4,
                                left: rect.right - 160 + window.scrollX,
                                openUpward
                              });
                              setOpenMenuId(student._id);
                            }
                          }}
                          style={{
                            background: "transparent",
                            color: "#0f172a",
                            border: "1px solid #d1d5db",
                            borderRadius: "8px",
                            width: "36px",
                            height: "36px",
                            cursor: "pointer",
                            fontSize: "20px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          ⋮
                        </button>

                        {openMenuId === student._id &&
                          createPortal(
                            <div
                              data-menu
                              style={{
                                position: 'absolute',
                                left: `${menuPosition.left}px`,
                                top: `${menuPosition.top}px`,
                                transform: menuPosition.openUpward ? 'translateY(-100%)' : 'none',
                                background: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '12px',
                                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                                zIndex: 11000,
                                width: '160px',
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
                                  padding: '12px 16px',
                                  background: 'white',
                                  border: 'none',
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  fontWeight: '500',
                                  color: '#0f172a',
                                }}
                                onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
                                onMouseLeave={(e) => e.target.style.background = 'white'}
                              >
                                View Profile
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedStudent(student);
                                  handleEditClick();
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
                                  borderTop: '1px solid #f3f4f6'
                                }}
                                onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
                                onMouseLeave={(e) => e.target.style.background = 'white'}
                              >
                                Edit Details
                              </button>
                              <button
                                onClick={() => handleManageCertificates(student)}
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
                                  borderTop: '1px solid #f3f4f6'
                                }}
                                onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
                                onMouseLeave={(e) => e.target.style.background = 'white'}
                              >
                                Certificates
                              </button>
                              <div
                                style={{
                                  padding: '10px 16px',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  letterSpacing: '0.06em',
                                  textTransform: 'uppercase',
                                  color: '#64748b',
                                  borderTop: '1px solid #f3f4f6',
                                  background: '#f8fafc',
                                }}
                              >
                                More
                              </div>
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
                                  color: '#0f172a',
                                  borderTop: '1px solid #f3f4f6'
                                }}
                                onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
                                onMouseLeave={(e) => e.target.style.background = 'white'}
                              >
                                {student.status?.toLowerCase() === 'active' ? 'Mark Inactive' : 'Mark Active'}
                              </button>
                              <button
                                onClick={() => handleMarkCompleted(student)}
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
                                  borderTop: '1px solid #f3f4f6'
                                }}
                                onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
                                onMouseLeave={(e) => e.target.style.background = 'white'}
                              >
                                Mark Completed
                              </button>
                              <button
                                onClick={() => handleDeleteStudent(student)}
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
                                  borderTop: '1px solid #f3f4f6'
                                }}
                                onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
                                onMouseLeave={(e) => e.target.style.background = 'white'}
                              >
                                Delete
                              </button>
                            </div>,
                            document.body
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
                                      otherCertificates: [...(s.documents?.otherCertificates || []), resp.data.document]
                                    }
                                  };
                                }
                                return s;
                              }));
                              setDocumentModalStudent(prev => ({
                                ...prev,
                                documents: {
                                  ...(prev.documents || {}),
                                  otherCertificates: [...(prev.documents?.otherCertificates || []), resp.data.document]
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
            setShowCertificateUpload(false);
            setCertificateUploadStatus(null);
          }}
        >
          <div className="profile-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="profile-header" style={{ background: '#324158' }}>
              <button
                className="profile-close-btn"
                onClick={() => {
                  setSelectedStudent(null);
                  setIsEditing(false);
                  setShowCertificateUpload(false);
                  setCertificateUploadStatus(null);
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
                    <div className="profile-field"><label>PSMS ID</label><div className="field-value">{selectedStudent.internId || '-'}</div></div>
                    <div className="profile-field"><label>Name</label><div className="field-value">{selectedStudent.name || '-'}</div></div>
                    <div className="profile-field"><label>Email</label><div className="field-value">{selectedStudent.email || '-'}</div></div>
                    <div className="profile-field"><label>Mobile</label><div className="field-value">{selectedStudent.mobile || '-'}</div></div>
                    <div className="profile-field"><label>Current Designation</label><div className="field-value">{selectedStudent.currentDesignation || 'N/A'}</div></div>
                    <div className="profile-field"><label>Added By</label><div className="field-value">{selectedStudent.addedByRepresentative ? selectedStudent.addedByRepresentative.name : 'Admin'}</div></div>
                  </div>
                ) : (
                  <div className="profile-info-grid">
                    <div className="profile-field"><label>PSMS ID</label><input type="text" name="internId" value={editForm.internId} onChange={handleInputChange} /></div>
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
                  Program Details
                </h3>
                {!isEditing ? (
                  <div className="profile-info-grid">
                    <div className="profile-field"><label>Suggested Domain</label><div className="field-value">{selectedStudent.suggestedDomain || 'N/A'}</div></div>
                    <div className="profile-field"><label>Current Qualification</label><div className="field-value">{selectedStudent.currentQualification || 'N/A'}</div></div>
                    <div className="profile-field"><label>Institute Name</label><div className="field-value">{selectedStudent.instituteName || 'N/A'}</div></div>
                    <div className="profile-field"><label>Institute Location</label><div className="field-value">{selectedStudent.instituteLocation || 'N/A'}</div></div>
                    <div className="profile-field"><label>Year of Study</label><div className="field-value">{selectedStudent.yearOfStudy || 'N/A'}</div></div>
                    <div className="profile-field"><label>Enrolment Date</label><div className="field-value">{selectedStudent.enrolmentDate ? new Date(selectedStudent.enrolmentDate).toLocaleDateString('en-IN') : 'N/A'}</div></div>
                    <div className="profile-field"><label>Batch Month</label><div className="field-value">{selectedStudent.enrolBatchMonth || 'N/A'}</div></div>
                    <div className="profile-field"><label>Total Fees</label><div className="field-value">Rs. {selectedStudent.totalFees || 0}</div></div>
                  </div>
                ) : (
                  <div className="profile-info-grid">
                    <div className="profile-field"><label>Suggested Domain</label><input type="text" name="suggestedDomain" value={editForm.suggestedDomain} onChange={handleInputChange} /></div>
                    <div className="profile-field"><label>Current Qualification</label><input type="text" name="currentQualification" value={editForm.currentQualification} onChange={handleInputChange} /></div>
                    <div className="profile-field"><label>Institute Name</label><input type="text" name="instituteName" value={editForm.instituteName} onChange={handleInputChange} /></div>
                    <div className="profile-field"><label>Institute Location</label><input type="text" name="instituteLocation" value={editForm.instituteLocation} onChange={handleInputChange} /></div>
                    <div className="profile-field"><label>Year of Study</label><input type="text" name="yearOfStudy" value={editForm.yearOfStudy} onChange={handleInputChange} /></div>
                    <div className="profile-field"><label>Enrolment Date</label><input type="date" name="enrolmentDate" value={editForm.enrolmentDate} onChange={handleInputChange} /></div>
                    <div className="profile-field"><label>Batch Month</label><input type="month" name="enrolBatchMonth" value={editForm.enrolBatchMonth} onChange={handleInputChange} /></div>
                    <div className="profile-field"><label>Total Fees</label><input type="number" name="totalFees" value={editForm.totalFees} onChange={handleInputChange} /></div>
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
                    <div className="profile-field"><label>First Payment</label><div className="field-value">Rs. {selectedStudent.firstPaymentAmount || 0}{selectedStudent.firstPaymentDate ? ` on ${new Date(selectedStudent.firstPaymentDate).toLocaleDateString('en-IN')}` : ''}</div></div>
                    <div className="profile-field"><label>Second Payment</label><div className="field-value">Rs. {selectedStudent.secondPaymentAmount || 0}{selectedStudent.secondPaymentDate ? ` on ${new Date(selectedStudent.secondPaymentDate).toLocaleDateString('en-IN')}` : ''}</div></div>
                    <div className="profile-field"><label>Final Payment</label><div className="field-value">Rs. {selectedStudent.finalPaymentAmount || 0}{selectedStudent.finalPaymentDate ? ` on ${new Date(selectedStudent.finalPaymentDate).toLocaleDateString('en-IN')}` : ''}</div></div>
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
                    <div className="profile-field"><label>First Payment Amount</label><input type="number" name="firstPaymentAmount" value={editForm.firstPaymentAmount} onChange={handleInputChange} /></div>
                    <div className="profile-field"><label>First Payment Date</label><input type="date" name="firstPaymentDate" value={editForm.firstPaymentDate} onChange={handleInputChange} /></div>
                    <div className="profile-field"><label>Second Payment Amount</label><input type="number" name="secondPaymentAmount" value={editForm.secondPaymentAmount} onChange={handleInputChange} /></div>
                    <div className="profile-field"><label>Second Payment Date</label><input type="date" name="secondPaymentDate" value={editForm.secondPaymentDate} onChange={handleInputChange} /></div>
                    <div className="profile-field"><label>Final Payment Amount</label><input type="number" name="finalPaymentAmount" value={editForm.finalPaymentAmount} onChange={handleInputChange} /></div>
                    <div className="profile-field"><label>Final Payment Date</label><input type="date" name="finalPaymentDate" value={editForm.finalPaymentDate} onChange={handleInputChange} /></div>
                    <div className="profile-field"><label>Completed Fees</label><input type="number" name="completedFees" value={editForm.completedFees} onChange={handleInputChange} /></div>
                    <div className="profile-field"><label>Pending Fees</label><input type="number" name="pendingFees" value={editForm.pendingFees} onChange={handleInputChange} /></div>
                    <div className="profile-field"><label>Payment Date</label><input type="date" name="dateOfPayment" value={editForm.dateOfPayment} onChange={handleInputChange} /></div>
                    <div className="profile-field"><label>Last Payment Date</label><input type="date" name="lastPaymentDate" value={editForm.lastPaymentDate} onChange={handleInputChange} /></div>
                    <div className="profile-field">
                      <label>Status</label>
                      <select name="status" value={editForm.status} onChange={handleInputChange}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="profile-section">
                <h3 className="profile-section-title">
                  <span className="profile-section-bar" />
                  Documents &amp; Certificates
                </h3>
                <div style={{ display: "grid", gap: "10px" }}>
                  {[
                    { key: "offerLetter", label: "Offer Letter" },
                    { key: "welcomeLetter", label: "Welcome Letter" },
                    { key: "paymentReceipt", label: "Payment Receipt" },
                    { key: "smsProgramEnrollmentLetter", label: "SMS Program Enrollment Letter" },
                    { key: "completionCertificate", label: "Completion Certificate" },
                    { key: "experienceLetter", label: "Experience Letter" },
                  ].map(({ key, label }) => (
                    <div
                      key={key}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 14px",
                        background: "#f8fafc",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a" }}>
                          {label}
                        </div>
                        {selectedStudent.documents?.[key] && (
                          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                            Uploaded: {new Date(selectedStudent.documents[key].uploadedAt || Date.now()).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      {selectedStudent.documents?.[key] ? (
                        <a
                          href={`${UPLOADS_BASE}/uploads/students/${selectedStudent.documents[key].filename}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: "6px 14px",
                            background: "#0f172a",
                            color: "white",
                            textDecoration: "none",
                            borderRadius: "6px",
                            fontSize: "13px",
                            fontWeight: "600",
                          }}
                        >
                          View
                        </a>
                      ) : (
                        <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                          Not uploaded
                        </span>
                      )}
                    </div>
                  ))}

                  {(selectedStudent.documents?.otherCertificates || []).map((cert, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 14px",
                        background: "#f8fafc",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a" }}>
                          {cert.name || `Certificate ${i + 1}`}
                        </div>
                        <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                          Uploaded: {new Date(cert.uploadedAt || Date.now()).toLocaleDateString()}
                        </div>
                      </div>
                      <a
                        href={`${UPLOADS_BASE}/uploads/students/${cert.filename}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: "6px 14px",
                          background: "#0f172a",
                          color: "white",
                          textDecoration: "none",
                          borderRadius: "6px",
                          fontSize: "13px",
                          fontWeight: "600",
                        }}
                      >
                        View
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {showCertificateUpload && (
                <div style={{
                  padding: '20px',
                  background: '#eff6ff',
                  borderRadius: '10px',
                  marginBottom: '24px',
                  border: '2px dashed #3b82f6',
                }}>
                  <h3 style={{ marginTop: 0, fontSize: '16px', color: '#1e40af' }}>
                    Upload New Certificate
                  </h3>

                  {certificateUploadStatus?.success && (
                    <div style={{
                      marginBottom: '12px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: '#dcfce7',
                      border: '1px solid #86efac',
                      color: '#166534',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}>
                      Certificate assigned successfully: {certificateUploadStatus.label}
                    </div>
                  )}

                  {certificateUploadStatus && !certificateUploadStatus.success && (
                    <div style={{
                      marginBottom: '12px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: '#fee2e2',
                      border: '1px solid #fca5a5',
                      color: '#991b1b',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}>
                      Certificate assignment failed. Please retry.
                    </div>
                  )}

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 600,
                      marginBottom: '6px',
                      color: '#0f172a',
                    }}>
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
                        fontSize: '14px',
                      }}
                    >
                      {certificateTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {certificateType === 'other' && (
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: 600,
                        marginBottom: '6px',
                        color: '#0f172a',
                      }}>
                        Certificate Name
                      </label>
                      <input
                        type="text"
                        value={certificateName}
                        onChange={(e) => setCertificateName(e.target.value)}
                        placeholder="e.g., Participation Certificate"
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontSize: '14px',
                        }}
                      />
                    </div>
                  )}

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 600,
                      marginBottom: '6px',
                      color: '#0f172a',
                    }}>
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
                        background: 'white',
                      }}
                    />
                    {certificateFile && (
                      <div style={{
                        marginTop: '8px',
                        fontSize: '13px',
                        color: '#059669',
                        fontWeight: 500,
                      }}>
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
                      fontWeight: 600,
                    }}
                  >
                    {uploadingCert ? 'Assigning Certificate...' : 'Assign Certificate'}
                  </button>
                </div>
              )}

              <div className="profile-actions">
                {!isEditing ? (
                  <>
                    <button
                      onClick={handleEditClick}
                      className="profile-btn profile-btn-primary"
                      style={{ background: '#324158', borderColor: '#324158' }}
                    >
                      Edit Profile
                    </button>
                    <button
                      onClick={() => setShowCertificateUpload(!showCertificateUpload)}
                      className="profile-btn profile-btn-secondary"
                    >
                      {showCertificateUpload ? 'Hide' : 'Manage Certificates'}
                    </button>
                  </>
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
      {showInactiveModal && inactiveModalStudent && createPortal(
        <div
          className="profile-modal-overlay"
          onClick={() => {
            if (!inactiveModalLoading) setShowInactiveModal(false);
          }}
        >
          <div className="profile-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="profile-header" style={{ background: '#324158' }}>
              <button
                className="profile-close-btn"
                onClick={() => {
                  if (!inactiveModalLoading) setShowInactiveModal(false);
                }}
              >
                ×
              </button>
              <div className="profile-avatar">{(inactiveModalStudent.name || 'S').charAt(0).toUpperCase()}</div>
              <h2 className="profile-name">Mark Inactive</h2>
              <div className="profile-badges">
                <span className="profile-badge">PIID: {inactiveModalStudent.internId || '-'}</span>
              </div>
            </div>

            <div className="profile-body">
              <div className="profile-section">
                <h3 className="profile-section-title">
                  <span className="profile-section-bar" />Provide a short message for the student
                </h3>
                <textarea
                  value={inactiveModalMessage}
                  onChange={(e) => setInactiveModalMessage(e.target.value)}
                  placeholder="E.g. Suspended due to policy violation. Contact admin to reactivate."
                  style={{ width: '100%', minHeight: 100, padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  maxLength={300}
                />
                {inactiveModalError && <div style={{ color: '#dc2626', marginTop: 8 }}>{inactiveModalError}</div>}
              </div>

              <div className="profile-actions" style={{ marginTop: 12 }}>
                <button
                  className="profile-btn profile-btn-primary"
                  onClick={async () => {
                    if (inactiveModalLoading) return;
                    const msg = String(inactiveModalMessage || '').trim();
                    if (!msg) {
                      setInactiveModalError('Please enter a short message to show to the student');
                      return;
                    }
                    try {
                      setInactiveModalLoading(true);
                      await adminAPI.updateInternStatus(inactiveModalStudent._id, 'inactive', msg);
                      setStudents((prev) =>
                        prev.map((s) =>
                          s._id === inactiveModalStudent._id
                            ? { ...s, status: 'Inactive', inactiveMessage: msg }
                            : s,
                        ),
                      );
                      setSelectedStudent((prev) =>
                        prev && prev._id === inactiveModalStudent._id
                          ? { ...prev, status: 'Inactive', inactiveMessage: msg }
                          : prev,
                      );
                      setShowInactiveModal(false);
                      setOpenMenuId(null);
                      setInfoMessage(`"${inactiveModalStudent.name}" marked as inactive`);
                      setTimeout(() => setInfoMessage(''), 4000);
                    } catch (err) {
                      console.error('Failed to mark inactive:', err);
                      setInactiveModalError(err.response?.data?.message || 'Failed to mark inactive');
                    } finally {
                      setInactiveModalLoading(false);
                    }
                  }}
                >
                  {inactiveModalLoading ? 'Saving...' : 'Save & Mark Inactive'}
                </button>

                <button
                  className="profile-btn profile-btn-ghost"
                  onClick={() => {
                    if (!inactiveModalLoading) setShowInactiveModal(false);
                  }}
                  style={{ marginLeft: 8 }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

export default SMSProgramManagement;
