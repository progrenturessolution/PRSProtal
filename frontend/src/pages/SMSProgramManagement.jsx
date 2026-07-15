import { useState, useEffect, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { adminAPI, UPLOADS_BASE } from '../services/api';

function SMSProgramManagement({ onAddStudentClick }) {
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
  const [showPassword, setShowPassword] = useState(false);
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
  const [feeFilter, setFeeFilter] = useState('all'); // all, pending, completed
  const [searchQuery, setSearchQuery] = useState('');
  const [isSmsSearchDropdownOpen, setIsSmsSearchDropdownOpen] = useState(false);
  const [smsDropdownSearchText, setSmsDropdownSearchText] = useState('');

  useEffect(() => {
    fetchSMSStudents();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('[data-sms-search-dropdown]')) {
        setIsSmsSearchDropdownOpen(false);
      }
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

    const getPendingAmount = (student) => {
      const total = parseMoney(student.totalFees);
      if (total > 0) {
        const paid = getPaidAmount(student);
        return Math.max(0, total - paid);
      }
      return Math.max(0, parseMoney(student.pendingFees));
    };

    const hasCompletedFees = (student) => {
      const total = parseMoney(student.totalFees);
      const paid = getPaidAmount(student);
      const pendingFromField = parseMoney(student.pendingFees);
      const completedFromField = parseMoney(student.completedFees);

      if (total > 0) return paid >= total;
      if (completedFromField > 0 && pendingFromField <= 0) return true;
      return false;
    };

    // Apply status filter
    if (filter === 'active') {
      filtered = filtered.filter(student => student.status?.toLowerCase() === 'active');
    }
    if (filter === 'completed') {
      filtered = filtered.filter(student => student.status?.toLowerCase() === 'completed');
    }

    // Apply fees filter
    if (feeFilter === 'pending') {
      filtered = filtered.filter(student => getPendingAmount(student) > 0);
    }
    if (feeFilter === 'completed') {
      filtered = filtered.filter(student => hasCompletedFees(student));
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
    const total = parseMoney(selectedStudent.totalFees);
    let completed = parseMoney(selectedStudent.completedFees);
    if (completed <= 0) {
      completed = parseMoney(selectedStudent.firstPaymentAmount) +
                  parseMoney(selectedStudent.secondPaymentAmount) +
                  parseMoney(selectedStudent.finalPaymentAmount);
      if (completed <= 0) {
        completed = parseMoney(selectedStudent.paymentAmount);
      }
    }
    const pending = total > 0 ? Math.max(0, total - completed) : parseMoney(selectedStudent.pendingFees);

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
      completedFees: String(completed),
      pendingFees: String(pending),
      dateOfPayment: selectedStudent.dateOfPayment ? selectedStudent.dateOfPayment.split('T')[0] : '',
      lastPaymentDate: selectedStudent.lastPaymentDate ? selectedStudent.lastPaymentDate.split('T')[0] : '',
      status: selectedStudent.status || 'active',
      stipendType: selectedStudent.stipendType === 'Stipend' || selectedStudent.stipendType === 'Performance Based' ? selectedStudent.stipendType : 'Unpaid',
      stipendAmount: selectedStudent.stipendAmount || ''
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
      status: '',
      stipendType: 'Unpaid',
      stipendAmount: ''
    });
  };

  const handleUpdateStudent = async () => {
    try {
      const response = await adminAPI.updateIntern(selectedStudent._id, editForm);
      if (response.data.success) {
        const updatedStudent = response.data.intern || { ...selectedStudent, ...editForm };
        setStudents(prev => prev.map(s =>
          s._id === selectedStudent._id ? updatedStudent : s
        ));
        setSelectedStudent(updatedStudent);
        setIsEditing(false);
        alert('Student updated successfully!');
      }
    } catch (err) {
      console.error('Update error:', err);
      alert('Failed to update student.');
    }
  };

  const formatDateValue = (value) =>
    value ? new Date(value).toLocaleDateString('en-IN') : "Not set";

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => {
      const next = { ...prev, [name]: value };
      if (['totalFees', 'completedFees', 'firstPaymentAmount', 'secondPaymentAmount', 'finalPaymentAmount'].includes(name)) {
        const total = parseMoney(next.totalFees);
        
        let completed = parseMoney(next.completedFees);
        if (['firstPaymentAmount', 'secondPaymentAmount', 'finalPaymentAmount'].includes(name)) {
          const first = parseMoney(next.firstPaymentAmount);
          const second = parseMoney(next.secondPaymentAmount);
          const final = parseMoney(next.finalPaymentAmount);
          completed = first + second + final;
          next.completedFees = String(completed);
        }
        
        next.pendingFees = String(Math.max(0, total - completed));
      }
      return next;
    });
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
    const completedFees = parseMoney(student.completedFees);
    if (completedFees > 0) return completedFees;

    const splitPayments =
      parseMoney(student.firstPaymentAmount) +
      parseMoney(student.secondPaymentAmount) +
      parseMoney(student.finalPaymentAmount);
    if (splitPayments > 0) return splitPayments;

    const directPayment = parseMoney(student.paymentAmount);
    return directPayment;
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
      <div
        className="content-header"
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1>SMS Program Management</h1>
          <p>Manage SMS program students and activities</p>
        </div>
        {onAddStudentClick && (
          <button
            type="button"
            onClick={onAddStudentClick}
            style={{
              padding: "10px 20px",
              borderRadius: "10px",
              border: "none",
              background: "#344158",
              color: "#fff",
              fontWeight: "600",
              fontSize: "14px",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            + Add Student
          </button>
        )}
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
      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "24px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
          border: "1px solid #e2e8f0",
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
            alignItems: 'end'
          }}
        >
          <div style={{ gridColumn: '1 / -1' }} data-sms-search-dropdown>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#0f172a'
              }}
            >
              Search Students
            </label>
            <div style={{ position: 'relative' }} data-sms-search-dropdown>
              <div
                data-sms-search-dropdown
                onClick={() => setIsSmsSearchDropdownOpen(!isSmsSearchDropdownOpen)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `2px solid ${isSmsSearchDropdownOpen ? '#3b82f6' : '#e2e8f0'}`,
                  borderRadius: '10px',
                  background: '#f8fafc',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s',
                  color: searchQuery ? '#0f172a' : '#94a3b8',
                  userSelect: 'none',
                }}
              >
                <span>{searchQuery || 'Search & select a student...'}</span>
                <span style={{ fontSize: '11px', transition: 'transform 0.2s', transform: isSmsSearchDropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span>
              </div>
              {isSmsSearchDropdownOpen && (
                <div
                  data-sms-search-dropdown
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '6px',
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                    zIndex: 2000,
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>
                    <input
                      autoFocus
                      type="text"
                      value={smsDropdownSearchText}
                      onChange={(e) => { setSmsDropdownSearchText(e.target.value); setSearchQuery(e.target.value); }}
                      placeholder="Type to search by name, ID, email..."
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        fontSize: '13px',
                        background: '#f8fafc',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  {searchQuery && (
                    <div
                      data-sms-search-dropdown
                      onClick={() => { setSearchQuery(''); setSmsDropdownSearchText(''); setIsSmsSearchDropdownOpen(false); }}
                      style={{ padding: '10px 14px', fontSize: '13px', color: '#dc2626', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontWeight: 600 }}
                    >
                      ✕ Clear search
                    </div>
                  )}
                  <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                    {students
                      .filter(s =>
                        !smsDropdownSearchText ||
                        s.name?.toLowerCase().includes(smsDropdownSearchText.toLowerCase()) ||
                        s.internId?.toLowerCase().includes(smsDropdownSearchText.toLowerCase()) ||
                        s.email?.toLowerCase().includes(smsDropdownSearchText.toLowerCase())
                      )
                      .slice(0, 50)
                      .map((s) => {
                        const initials = (s.name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                        return (
                          <div
                            key={s._id}
                            data-sms-search-dropdown
                            onClick={() => { setSearchQuery(s.name); setSmsDropdownSearchText(s.name); setIsSmsSearchDropdownOpen(false); }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '10px 14px',
                              borderBottom: '1px solid #f8fafc',
                              cursor: 'pointer',
                              transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#e0e7ff', color: '#3730a3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                              {initials}
                            </div>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{s.name}</div>
                              <div style={{ fontSize: '12px', color: '#64748b' }}>{s.internId} • {s.email}</div>
                            </div>
                          </div>
                        );
                      })}
                    {students.filter(s =>
                      !smsDropdownSearchText ||
                      s.name?.toLowerCase().includes(smsDropdownSearchText.toLowerCase()) ||
                      s.internId?.toLowerCase().includes(smsDropdownSearchText.toLowerCase()) ||
                      s.email?.toLowerCase().includes(smsDropdownSearchText.toLowerCase())
                    ).length === 0 && (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>No students found</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
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
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '15px',
                background: '#f8fafc',
                cursor: 'pointer',
                fontWeight: '500'
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
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
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
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '15px',
                background: '#f8fafc',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              <option value="All">All</option>
              <option value="Admin">Admin</option>
              <option value="Representative">Representative</option>
            </select>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#0f172a'
              }}
            >
              Fee Filter
            </label>
            <select
              value={feeFilter}
              onChange={(e) => setFeeFilter(e.target.value)}
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
              <option value="all">All Fees</option>
              <option value="pending">Pending Fees</option>
              <option value="completed">Completed Fees</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="card">
        {loading ? (
          <p>Loading...</p>
        ) : filteredStudents.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "#64748b",
            }}
          >
            <h3 style={{ color: "#0f172a", marginBottom: "8px" }}>
              {searchQuery ? `No students found matching "${searchQuery}".` : "No SMS program students found."}
            </h3>
            <p>Try adjusting your filters or search query</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table view-students-table" style={{ minWidth: "1100px" }}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Domain</th>
                  <th>Duration</th>
                  <th>Batch Start Month</th>
                  <th>Added By</th>
                  <th>Total Fees</th>
                  <th>Pending Fees</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student._id}>
                    <td>{student.internId || '—'}</td>
                    <td>{student.name || '—'}</td>
                    <td>{student.suggestedDomain || student.domain || student.currentDesignation || '—'}</td>
                    <td>{student.duration || '—'}</td>
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
                              onClick={() => setOpenMenuId(null)}
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
                                  borderBottom: 'none'
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
                                onClick={(e) => e.stopPropagation()}
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
            <div className="profile-header" style={{ background: '#344158' }}>
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
              {!isEditing ? (
                <>
                  <div className="profile-section">
                    <h3 className="profile-section-title">
                      <span className="profile-section-bar" />
                      Contact Information
                    </h3>
                    <div className="profile-info-grid">
                      <div className="profile-field"><label>Name</label><div className="field-value">{selectedStudent.name || "-"}</div></div>
                      <div className="profile-field"><label>Email</label><div className="field-value">{selectedStudent.email || "-"}</div></div>
                      <div className="profile-field"><label>Password</label><div className="field-value" style={{ fontWeight: "600", color: "#0f172a" }}>{selectedStudent.plainPassword || "intern"}</div></div>
                      <div className="profile-field"><label>PIID</label><div className="field-value">{selectedStudent.internId || "-"}</div></div>
                      <div className="profile-field"><label>Mobile</label><div className="field-value">{selectedStudent.mobile || "-"}</div></div>
                      <div className="profile-field"><label>Current Designation</label><div className="field-value">{selectedStudent.currentDesignation || "Not set"}</div></div>
                      <div className="profile-field"><label>Added By</label><div className="field-value">{selectedStudent.addedByRepresentative?.name || "Admin"}</div></div>
                      <div className="profile-field"><label>Registered On</label><div className="field-value">{formatDateValue(selectedStudent.createdAt)}</div></div>
                      <div className="profile-field"><label>Joining Date</label><div className="field-value">{formatDateValue(selectedStudent.joiningDate)}</div></div>
                      <div className="profile-field"><label>Ending Date</label><div className="field-value">{formatDateValue(selectedStudent.endingDate)}</div></div>
                      <div className="profile-field"><label>Duration</label><div className="field-value">{selectedStudent.duration || "Not set"}</div></div>
                      {selectedStudent.assignedTrainer && (
                        <>
                          <div className="profile-field"><label>Assigned Employee</label><div className="field-value">{selectedStudent.assignedTrainer.name || selectedStudent.assignedTrainer}</div></div>
                          <div className="profile-field"><label>Employee Email</label><div className="field-value">{selectedStudent.assignedTrainer.email || "Not available"}</div></div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="profile-section">
                    <h3 className="profile-section-title">
                      <span className="profile-section-bar" />
                      {selectedStudent.studentType === "Internship" ? "Internship Details" : "Program Details"}
                    </h3>
                    <div className="profile-info-grid">
                      {selectedStudent.studentType === "Internship" ? (
                        <>
                          <div className="profile-field"><label>Domain</label><div className="field-value">{selectedStudent.domain || "Not set"}</div></div>
                          <div className="profile-field"><label>Stipend</label><div className="field-value">{(selectedStudent.stipendType === 'Stipend') ? `Stipend — Rs. ${selectedStudent.stipendAmount || '0'}` : (selectedStudent.stipendType === 'Performance Based' ? 'Performance Based' : 'Unpaid')}</div></div>
                          <div className="profile-field"><label>College Name</label><div className="field-value">{selectedStudent.collegeName || "Not set"}</div></div>
                          <div className="profile-field"><label>Branch</label><div className="field-value">{selectedStudent.branch || "Not set"}</div></div>
                          <div className="profile-field"><label>Year of Study</label><div className="field-value">{selectedStudent.yearOfStudy || "Not set"}</div></div>
                        </>
                      ) : (
                        <>
                          <div className="profile-field"><label>Suggested Domain</label><div className="field-value">{selectedStudent.suggestedDomain || "Not set"}</div></div>
                          <div className="profile-field"><label>Current Qualification</label><div className="field-value">{selectedStudent.currentQualification || "Not set"}</div></div>
                          <div className="profile-field"><label>Institute Name</label><div className="field-value">{selectedStudent.instituteName || "Not set"}</div></div>
                          <div className="profile-field"><label>Institute Location</label><div className="field-value">{selectedStudent.instituteLocation || "Not set"}</div></div>
                          <div className="profile-field"><label>Enrolment Date</label><div className="field-value">{formatDateValue(selectedStudent.enrolmentDate)}</div></div>
                          <div className="profile-field"><label>Batch Month</label><div className="field-value">{selectedStudent.enrolBatchMonth || "Not set"}</div></div>
                          <div className="profile-field"><label>Total Fees</label><div className="field-value">Rs. {selectedStudent.totalFees || 0}</div></div>
                          <div className="profile-field"><label>Completed Fees</label><div className="field-value">Rs. {selectedStudent.completedFees || 0}</div></div>
                          <div className="profile-field"><label>Pending Fees</label><div className="field-value">Rs. {selectedStudent.pendingFees || 0}</div></div>
                          <div className="profile-field"><label>Gender</label><div className="field-value">{selectedStudent.gender || "Not set"}</div></div>
                          <div className="profile-field"><label>Payment Done By</label><div className="field-value">{selectedStudent.paymentDoneBy || "Not set"}</div></div>
                          <div className="profile-field"><label>Transaction ID</label><div className="field-value">{selectedStudent.transactionId || "Not set"}</div></div>
                          <div className="profile-field"><label>Payment Amount</label><div className="field-value">Rs. {selectedStudent.paymentAmount || 0}</div></div>
                          <div className="profile-field"><label>Date of Payment</label><div className="field-value">{formatDateValue(selectedStudent.dateOfPayment)}</div></div>
                          <div className="profile-field"><label>Last Payment Date</label><div className="field-value">{formatDateValue(selectedStudent.lastPaymentDate)}</div></div>
                          <div className="profile-field"><label>First Payment</label><div className="field-value">Rs. {selectedStudent.firstPaymentAmount || 0}{selectedStudent.firstPaymentDate ? ` on ${formatDateValue(selectedStudent.firstPaymentDate)}` : ""}</div></div>
                          <div className="profile-field"><label>Second Payment</label><div className="field-value">Rs. {selectedStudent.secondPaymentAmount || 0}{selectedStudent.secondPaymentDate ? ` on ${formatDateValue(selectedStudent.secondPaymentDate)}` : ""}</div></div>
                          <div className="profile-field"><label>Final Payment</label><div className="field-value">Rs. {selectedStudent.finalPaymentAmount || 0}{selectedStudent.finalPaymentDate ? ` on ${formatDateValue(selectedStudent.finalPaymentDate)}` : ""}</div></div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="profile-section">
                    <h3 className="profile-section-title">
                      <span className="profile-section-bar"></span>
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
                                background: "#324158",
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

                      {/* Other Certificates */}
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
                              background: "#324158",
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
                </>
              ) : (
                <>
                  <div className="profile-section">
                    <h3 className="profile-section-title">
                      <span className="profile-section-bar" />
                      Basic Information
                    </h3>
                    <div className="profile-info-grid">
                      <div className="profile-field">
                        <label>Student ID</label>
                        <input value={editForm.internId} readOnly style={{ background: '#f1f5f9' }} />
                      </div>
                      <div className="profile-field">
                        <label>Password</label>
                        <div className="password-input-wrapper">
                          <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={editForm.password}
                            onChange={handleInputChange}
                            placeholder="Enter password"
                          />
                          <button
                            type="button"
                            className="password-toggle-btn"
                            onClick={() => setShowPassword(!showPassword)}
                            title={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? (
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: "20px", height: "20px" }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: "20px", height: "20px" }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="profile-field">
                        <label>Full Name</label>
                        <input
                          name="name"
                          value={editForm.name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="profile-field">
                        <label>Email</label>
                        <input
                          type="email"
                          name="email"
                          value={editForm.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="profile-field">
                        <label>Mobile</label>
                        <input
                          name="mobile"
                          value={editForm.mobile}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="profile-field">
                        <label>Current Designation</label>
                        <input
                          name="currentDesignation"
                          value={editForm.currentDesignation}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="profile-field">
                        <label>Joining Date</label>
                        <input
                          type="date"
                          name="joiningDate"
                          value={editForm.joiningDate}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="profile-field">
                        <label>Ending Date</label>
                        <input
                          type="date"
                          name="endingDate"
                          value={editForm.endingDate}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="profile-field">
                        <label>Duration</label>
                        <input
                          name="duration"
                          value={editForm.duration}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="profile-field">
                        <label>Stipend Type</label>
                        <select name="stipendType" value={editForm.stipendType} onChange={handleInputChange}>
                          <option value="Unpaid">Unpaid</option>
                          <option value="Stipend">Stipend</option>
                          <option value="Performance Based">Performance Based</option>
                        </select>
                      </div>
                      {editForm.stipendType === 'Stipend' && (
                        <div className="profile-field">
                          <label>Stipend Amount (Rs.)</label>
                          <input name="stipendAmount" value={editForm.stipendAmount} onChange={handleInputChange} />
                        </div>
                      )}
                      <div className="profile-field">
                        <label>Status</label>
                        <select name="status" value={editForm.status} onChange={handleInputChange}>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="profile-section">
                    <h3 className="profile-section-title">
                      <span className="profile-section-bar" />
                      Program Details
                    </h3>
                    <div className="profile-info-grid">
                      <div className="profile-field">
                        <label>Suggested Domain</label>
                        <input
                          name="suggestedDomain"
                          value={editForm.suggestedDomain}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="profile-field">
                        <label>Current Qualification</label>
                        <input
                          name="currentQualification"
                          value={editForm.currentQualification}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="profile-field">
                        <label>Institute Name</label>
                        <input
                          name="instituteName"
                          value={editForm.instituteName}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="profile-field">
                        <label>Institute Location</label>
                        <input
                          name="instituteLocation"
                          value={editForm.instituteLocation}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="profile-field">
                        <label>Enrolment Date</label>
                        <input
                          type="date"
                          name="enrolmentDate"
                          value={editForm.enrolmentDate}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="profile-field">
                        <label>Batch Month</label>
                        <input
                          type="month"
                          name="enrolBatchMonth"
                          value={editForm.enrolBatchMonth}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="profile-field">
                        <label>Total Fees</label>
                        <input
                          name="totalFees"
                          value={editForm.totalFees}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="profile-field">
                        <label>Completed Fees</label>
                        <input
                          name="completedFees"
                          value={editForm.completedFees}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="profile-field">
                        <label>Pending Fees [Auto]</label>
                        <input
                          name="pendingFees"
                          value={editForm.pendingFees}
                          readOnly
                          style={{ background: '#f1f5f9' }}
                        />
                      </div>
                      <div className="profile-field">
                        <label>Gender</label>
                        <select
                          name="gender"
                          value={editForm.gender}
                          onChange={handleInputChange}
                        >
                          <option value="">Select gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="profile-section">
                    <h3 className="profile-section-title">
                      <span className="profile-section-bar" />
                      Payment Details
                    </h3>
                    <div className="profile-info-grid">
                      <div className="profile-field">
                        <label>Payment Done By</label>
                        <input
                          name="paymentDoneBy"
                          value={editForm.paymentDoneBy}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="profile-field">
                        <label>Transaction ID</label>
                        <input
                          name="transactionId"
                          value={editForm.transactionId}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="profile-field">
                        <label>Date of Payment</label>
                        <input
                          type="date"
                          name="dateOfPayment"
                          value={editForm.dateOfPayment}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="profile-field">
                        <label>First Payment Amount</label>
                        <input
                          name="firstPaymentAmount"
                          value={editForm.firstPaymentAmount}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="profile-field">
                        <label>First Payment Date</label>
                        <input
                          type="date"
                          name="firstPaymentDate"
                          value={editForm.firstPaymentDate}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="profile-field">
                        <label>Second Payment Amount</label>
                        <input
                          name="secondPaymentAmount"
                          value={editForm.secondPaymentAmount}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="profile-field">
                        <label>Second Payment Date</label>
                        <input
                          type="date"
                          name="secondPaymentDate"
                          value={editForm.secondPaymentDate}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="profile-field">
                        <label>Final Payment Amount</label>
                        <input
                          name="finalPaymentAmount"
                          value={editForm.finalPaymentAmount}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="profile-field">
                        <label>Final Payment Date</label>
                        <input
                          type="date"
                          name="finalPaymentDate"
                          value={editForm.finalPaymentDate}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="profile-field">
                        <label>Last Payment Date</label>
                        <input
                          type="date"
                          name="lastPaymentDate"
                          value={editForm.lastPaymentDate}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
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
                      background: uploadingCert || !certificateFile ? '#cbd5e1' : '#324158',
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

              <div className="profile-actions" style={{ padding: "20px 24px", margin: "0" }}>
                {!isEditing ? (
                  <>
                    <button
                      className="profile-btn profile-btn-edit"
                      style={{ background: "#324158", color: "white", border: "none", boxShadow: "0 4px 12px rgba(50, 65, 88, 0.2)" }}
                      onClick={handleEditClick}
                    >
                      Edit Profile
                    </button>
                    <button
                      className="profile-btn profile-btn-certificates"
                      style={{ background: "#324158", color: "white", border: "none", boxShadow: "0 4px 12px rgba(50, 65, 88, 0.2)" }}
                      onClick={() => setShowCertificateUpload(!showCertificateUpload)}
                    >
                      {showCertificateUpload ? 'Hide' : 'Manage Certificates'}
                    </button>
                    <button
                      className="profile-btn profile-btn-close"
                      style={{ background: "#324158", color: "white", border: "none", boxShadow: "0 4px 12px rgba(50, 65, 88, 0.2)" }}
                      onClick={() => {
                        setSelectedStudent(null);
                        setIsEditing(false);
                        setShowCertificateUpload(false);
                      }}
                    >
                      Close
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="profile-btn profile-btn-ghost"
                      onClick={handleCancelEdit}
                      style={{ background: '#ffffff', color: '#324158', border: '2px solid #324158' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="profile-btn profile-btn-primary"
                      onClick={handleUpdateStudent}
                      style={{ background: '#324158', color: 'white', border: 'none', boxShadow: '0 4px 12px rgba(50, 65, 88, 0.2)' }}
                    >
                      Save Changes
                    </button>
                  </>
                )}
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
            <div className="profile-header" style={{ background: '#344158' }}>
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
                  style={{ background: "#324158", color: "white", border: "none", boxShadow: "0 4px 12px rgba(50, 65, 88, 0.2)" }}
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
                  style={{ marginLeft: 8, background: "#f1f5f9", color: "#475569", border: "none" }}
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
