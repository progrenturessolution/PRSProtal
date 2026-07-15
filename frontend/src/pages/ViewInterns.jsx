import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { adminAPI, UPLOADS_BASE } from "../services/api";

function ViewInterns({
  onInternDeleted,
  onAddStudentClick,
}) {
  const [interns, setInterns] = useState([]);
  const [filteredInterns, setFilteredInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, openUpward: false });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [dropdownSearchText, setDropdownSearchText] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterAddedBy, setFilterAddedBy] = useState("All");
  const [certificateFile, setCertificateFile] = useState(null);
  const [certificateType, setCertificateType] = useState("offerLetter");
  const [certificateName, setCertificateName] = useState("");
  const [uploadingCert, setUploadingCert] = useState(false);
  const [certificateUploadStatus, setCertificateUploadStatus] = useState(null);
  // Inactive message modal state
  const [showInactiveModal, setShowInactiveModal] = useState(false);
  const [inactiveModalStudent, setInactiveModalStudent] = useState(null);
  const [inactiveModalMessage, setInactiveModalMessage] = useState('');
  const [inactiveModalLoading, setInactiveModalLoading] = useState(false);
  const [inactiveModalError, setInactiveModalError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const certificateTypeOptions = [
    { value: "offerLetter", label: "Internship Offer letter" },
    { value: "smsProgramEnrollmentLetter", label: "SMS Enrollment letter" },
    { value: "paymentReceipt", label: "Fees Receipt" },
    { value: "completionCertificate", label: "Completion Certificate" },
    { value: "experienceLetter", label: "Experience Certificate" },
    {
      value: "designationLevel1Foundation",
      label: "Designation Certificate - Level 1 - Foundation level Certificate",
    },
    {
      value: "designationLevel2Competent",
      label: "Designation Certificate - Level 2 - Competent level Certificate",
    },
    {
      value: "designationLevel3Proficient",
      label: "Designation Certificate - Level 3 - Proficient level Certificate",
    },
    {
      value: "designationLevel4Expert",
      label: "Designation Certificate - Level 4 - Expert-level Certificate",
    },
    { value: "programCompletionCertificate", label: "Program Completion Certificate" },
    {
      value: "domainTrainingCourseCompletion",
      label: "Domain Training / Course Completion Certificate",
    },
    { value: "recommendationsLetter", label: "Recommendations Letter" },
    { value: "appreciationLetter", label: "Appreciation Letter" },
    { value: "finalDesignationCertificate", label: "Final Designation Certificate" },
    {
      value: "representativeDesignationCertificate",
      label: "Representative Designation Certificate",
    },
    { value: "other", label: "Other" },
  ];

  const directCertificateTypes = [
    "offerLetter",
    "smsProgramEnrollmentLetter",
    "paymentReceipt",
    "completionCertificate",
    "experienceLetter",
  ];

  useEffect(() => {
    fetchInterns();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [interns, searchQuery, filterType, filterStatus, filterAddedBy]);

  const fetchInterns = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await adminAPI.getAllInterns();
      console.log("Interns response:", response.data);

      if (response.data.success && response.data.interns) {
        setInterns(response.data.interns);
      } else {
        setInterns([]);
      }
    } catch (err) {
      console.error("Error fetching interns:", err);
      console.error("Error response:", err.response?.data);
      setError(
        err.response?.data?.message ||
        "Failed to fetch interns. Please check if you are logged in.",
      );
      setInterns([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...interns];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (intern) =>
          intern.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          intern.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          intern.internId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          intern.mobile?.includes(searchQuery) ||
          intern.addedByRepresentative?.name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          ((searchQuery || "").toLowerCase() === "admin" &&
            !intern.addedByRepresentative),
      );
    }

    // Type filter
    if (filterType !== "All") {
      filtered = filtered.filter((intern) => intern.studentType === filterType);
    }

    // Status filter
    if (filterStatus !== "All") {
      filtered = filtered.filter(
        (intern) =>
          (intern.status || "").toLowerCase() === filterStatus.toLowerCase(),
      );
    }

    // Added-by filter
    if (filterAddedBy === "Admin") {
      filtered = filtered.filter((intern) => !intern.addedByRepresentative);
    } else if (filterAddedBy === "Representative") {
      filtered = filtered.filter((intern) => !!intern.addedByRepresentative);
    }

    setFilteredInterns(filtered);
  };

  const handleDelete = async (id, name) => {
    // Add confirmation dialog to prevent accidental deletion
    const confirmDelete = window.confirm(
      `Are you sure you want to move "${name}" to archived students?\n\nThe student will be moved to the Recycle Bin where you can:\n- Restore them later if needed\n- Permanently delete them\n\nClick OK to archive this student.`,
    );

    if (!confirmDelete) {
      return; // User cancelled, do nothing
    }

    try {
      await adminAPI.deleteIntern(id);
      setInterns(interns.filter((intern) => intern._id !== id));
      setInfoMessage(
        `"${name}" has been archived. You can restore them from Archived Students.`,
      );
      setTimeout(() => setInfoMessage(""), 5000);
      if (onInternDeleted) onInternDeleted();
    } catch (err) {
      setError("Failed to archive student");
      console.error(err);
      setTimeout(() => setError(""), 4000);
    }
  };

  const handleMarkCompleted = async (student) => {
    const confirmComplete = window.confirm(
      `Mark "${student.name}" as completed?\n\nThis will prevent the student from logging in.`,
    );

    if (!confirmComplete) return;

    try {
      await adminAPI.updateInternStatus(student._id, 'completed');
      setInterns(
        interns.map((intern) =>
          intern._id === student._id ? { ...intern, status: 'Completed' } : intern,
        ),
      );
      setOpenMenuId(null);
      setInfoMessage(`"${student.name}" marked as completed`);
      setTimeout(() => setInfoMessage(''), 4000);
    } catch (err) {
      console.error('Failed to mark completed:', err);
      setError(err.response?.data?.message || 'Failed to mark student as completed');
      setTimeout(() => setError(''), 4000);
    }
  };

  const handleStatusToggle = async (student) => {
    const current = (student.status || "").toLowerCase();
    const newStatus = current === "active" ? "inactive" : "active";
    // If switching to inactive, open modal to collect message
    if (newStatus === 'inactive') {
      setInactiveModalStudent(student);
      setInactiveModalMessage('');
      setInactiveModalError('');
      setShowInactiveModal(true);
      return;
    }

    try {
      // Activate directly
      await adminAPI.updateInternStatus(student._id, newStatus, '');
      const label = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
      setInterns(
        interns.map((intern) => (intern._id === student._id ? { ...intern, status: label, inactiveMessage: '' } : intern)),
      );
      setOpenMenuId(null);
      setInfoMessage(`Student activated successfully`);
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
      internId: student.internId || "",
      name: student.name || "",
      email: student.email || "",
      mobile: student.mobile || "",
      studentType: student.studentType || "",
      currentDesignation: student.currentDesignation || "",
      domain: student.domain || "",
      duration: student.duration || "",
      collegeName: student.collegeName || "",
      branch: student.branch || "",
      yearOfStudy: student.yearOfStudy || "",
      suggestedDomain: student.suggestedDomain || "",
      currentQualification: student.currentQualification || "",
      instituteName: student.instituteName || "",
      instituteLocation: student.instituteLocation || "",
      enrolmentDate: student.enrolmentDate
        ? new Date(student.enrolmentDate).toISOString().slice(0, 10)
        : "",
      enrolBatchMonth: student.enrolBatchMonth || "",
      totalFees: student.totalFees || "",
      joiningDate: student.joiningDate
        ? new Date(student.joiningDate).toISOString().slice(0, 10)
        : "",
      endingDate: student.endingDate
        ? new Date(student.endingDate).toISOString().slice(0, 10)
        : "",
      gender: student.gender || "",
      paymentDoneBy: student.paymentDoneBy || "",
      transactionId: student.transactionId || "",
      dateOfPayment: student.dateOfPayment
        ? new Date(student.dateOfPayment).toISOString().slice(0, 10)
        : "",
      paymentAmount: student.paymentAmount || "",
      firstPaymentAmount: student.firstPaymentAmount || "",
      firstPaymentDate: student.firstPaymentDate
        ? new Date(student.firstPaymentDate).toISOString().slice(0, 10)
        : "",
      secondPaymentAmount: student.secondPaymentAmount || "",
      secondPaymentDate: student.secondPaymentDate
        ? new Date(student.secondPaymentDate).toISOString().slice(0, 10)
        : "",
      finalPaymentAmount: student.finalPaymentAmount || "",
      finalPaymentDate: student.finalPaymentDate
        ? new Date(student.finalPaymentDate).toISOString().slice(0, 10)
        : "",
      completedFees: student.completedFees || "",
      pendingFees: student.pendingFees || "",
      lastPaymentDate: student.lastPaymentDate
        ? new Date(student.lastPaymentDate).toISOString().slice(0, 10)
        : "",
      stipendType: student.stipendType === 'Stipend' || student.stipendType === 'Performance Based' ? student.stipendType : 'Unpaid',
      stipendAmount: student.stipendAmount || '',
      password: student.plainPassword || '',
    });
    setShowEditModal(true);
    setOpenMenuId(null);
  };

  const handleEditChange = (key, value) => {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveEdit = async () => {
    if (!selectedStudent || !editForm) return;
    try {
      const response = await adminAPI.updateIntern(
        selectedStudent._id,
        editForm,
      );
      if (response.data && response.data.success) {
        const updated = response.data.intern;
        setInterns(interns.map((i) => (i._id === updated._id ? updated : i)));
        setSelectedStudent(updated);
        setShowEditModal(false);
        setInfoMessage("Student updated successfully");
        setTimeout(() => setInfoMessage(""), 4000);
      } else {
        setError("Failed to update student");
      }
    } catch (err) {
      console.error("Save edit error:", err);
      setError(err.response?.data?.message || "Failed to update student");
    }
  };

  const handleViewCertificates = (student) => {
    setSelectedStudent(student);
    setShowCertificateModal(true);
    setCertificateType("offerLetter");
    setCertificateFile(null);
    setCertificateName("");
    setCertificateUploadStatus(null);
    setOpenMenuId(null);
  };

  const handleCertificateUpload = async () => {
    if (!certificateFile) {
      setError("Please select a file to upload");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (certificateType === "other" && !certificateName.trim()) {
      setError("Please enter certificate name for Other type");
      setTimeout(() => setError(""), 3000);
      return;
    }

    const selectedOption = certificateTypeOptions.find(
      (item) => item.value === certificateType,
    );
    const isDirectType = directCertificateTypes.includes(certificateType);
    const uploadDocumentType = isDirectType ? certificateType : "other";

    setUploadingCert(true);
    try {
      const formData = new FormData();
      formData.append("file", certificateFile);
      formData.append("documentType", uploadDocumentType);
      if (!isDirectType) {
        formData.append(
          "certificateName",
          certificateType === "other"
            ? certificateName.trim()
            : selectedOption?.label || "Other Certificate",
        );
      }

      const response = await adminAPI.uploadStudentDocument(
        selectedStudent._id,
        formData,
      );

      if (response.data && response.data.success) {
        // Update local state
        setInterns(
          interns.map((intern) => {
            if (intern._id === selectedStudent._id) {
              let updatedDocuments = { ...(intern.documents || {}) };

              if (!isDirectType) {
                // Add to otherCertificates array
                const existingOther = updatedDocuments.otherCertificates || [];
                updatedDocuments.otherCertificates = [
                  ...existingOther,
                  response.data.document,
                ];
              } else {
                // Single document types
                updatedDocuments[certificateType] = response.data.document;
              }

              return {
                ...intern,
                documents: updatedDocuments,
              };
            }
            return intern;
          }),
        );

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

        setInfoMessage("Certificate uploaded successfully");
        setTimeout(() => setInfoMessage(""), 4000);
        setCertificateUploadStatus({
          success: true,
          label: !isDirectType
            ? certificateType === "other"
              ? certificateName.trim()
              : selectedOption?.label || "Other Certificate"
            : selectedOption?.label || "Certificate",
        });
        setCertificateFile(null);
        setCertificateName("");
      } else {
        setError("Failed to upload certificate");
        setTimeout(() => setError(""), 4000);
        setCertificateUploadStatus({ success: false, label: "" });
      }
    } catch (err) {
      console.error("Certificate upload error:", err);
      setError(err.response?.data?.message || "Failed to upload certificate");
      setTimeout(() => setError(""), 4000);
      setCertificateUploadStatus({ success: false, label: "" });
    } finally {
      setUploadingCert(false);
    }
  };

  const formatDateValue = (value) =>
    value ? new Date(value).toLocaleDateString() : "Not set";

  const getStartMonthValue = (student) => {
    if (student.enrolBatchMonth) return student.enrolBatchMonth;

    const startDate = student.joiningDate || student.enrolmentDate;
    if (!startDate) return "—";

    return new Date(startDate).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  const toggleMenu = (id, event) => {
    if (openMenuId === id) {
      setOpenMenuId(null);
    } else {
      const rect = event.currentTarget.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const menuHeight = 300;
      const openUpward = spaceBelow < menuHeight && spaceAbove > spaceBelow;

      setMenuPosition({
        top: openUpward ? rect.top + window.scrollY - 4 : rect.bottom + window.scrollY + 4,
        left: rect.right - 160 + window.scrollX,
        openUpward,
      });
      setOpenMenuId(id);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest("[data-vi-search-dropdown]")) {
        setIsSearchDropdownOpen(false);
      }
      if (!openMenuId) return;
      if (
        e.target.closest("[data-menu]") ||
        e.target.closest("[data-menu-toggle]")
      )
        return;
      setOpenMenuId(null);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openMenuId]);

  if (loading) {
    return (
      <div className="content-header">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div className="spinner"></div>
          <h1>Loading Students...</h1>
        </div>
      </div>
    );
  }

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
        <div style={{ minWidth: 0, flex: "1 1 320px" }}>
          <h1>All Students</h1>
          <p>
            Manage and view all registered students - {filteredInterns.length}{" "}
            of {interns.length} students
          </p>
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
              flex: "0 0 auto",
              alignSelf: "flex-start",
            }}
          >
            + Add Student
          </button>
        )}
      </div>

      {error && (
        <div className="error-message" style={{ marginBottom: "20px" }}>
          {error}
        </div>
      )}

      {/* Inactive Message Modal */}
      {showInactiveModal && inactiveModalStudent &&
        createPortal(
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
                        setInterns(interns.map((i) => (i._id === inactiveModalStudent._id ? { ...i, status: 'Inactive', inactiveMessage: msg } : i)));
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

      {infoMessage && (
        <div className="success-message" style={{ marginBottom: "20px" }}>
          {infoMessage}
        </div>
      )}

      {/* Filters and Search Bar */}
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
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "16px",
            alignItems: "end",
          }}
        >
          {/* Search */}
          <div style={{ gridColumn: "1 / -1" }} data-vi-search-dropdown>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "600",
                color: "#0f172a",
              }}
            >
              Search Students
            </label>
            {/* Searchable Dropdown */}
            <div style={{ position: 'relative' }} data-vi-search-dropdown>
              {/* Trigger */}
              <div
                data-vi-search-dropdown
                onClick={() => setIsSearchDropdownOpen(!isSearchDropdownOpen)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `2px solid ${isSearchDropdownOpen ? '#3b82f6' : '#e2e8f0'}`,
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
                <span style={{ fontSize: '11px', transition: 'transform 0.2s', transform: isSearchDropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span>
              </div>
              {/* Dropdown Panel */}
              {isSearchDropdownOpen && (
                <div
                  data-vi-search-dropdown
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
                      value={dropdownSearchText}
                      onChange={(e) => { setDropdownSearchText(e.target.value); setSearchQuery(e.target.value); }}
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
                      data-vi-search-dropdown
                      onClick={() => { setSearchQuery(''); setDropdownSearchText(''); setIsSearchDropdownOpen(false); }}
                      style={{ padding: '10px 14px', fontSize: '13px', color: '#dc2626', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontWeight: 600 }}
                    >
                      ✕ Clear search
                    </div>
                  )}
                  <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                    {interns
                      .filter(s =>
                        !dropdownSearchText ||
                        s.name?.toLowerCase().includes(dropdownSearchText.toLowerCase()) ||
                        s.internId?.toLowerCase().includes(dropdownSearchText.toLowerCase()) ||
                        s.email?.toLowerCase().includes(dropdownSearchText.toLowerCase())
                      )
                      .slice(0, 50)
                      .map((s) => {
                        const initials = (s.name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                        return (
                          <div
                            key={s._id}
                            data-vi-search-dropdown
                            onClick={() => { setSearchQuery(s.name); setDropdownSearchText(s.name); setIsSearchDropdownOpen(false); }}
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
                    {interns.filter(s =>
                      !dropdownSearchText ||
                      s.name?.toLowerCase().includes(dropdownSearchText.toLowerCase()) ||
                      s.internId?.toLowerCase().includes(dropdownSearchText.toLowerCase()) ||
                      s.email?.toLowerCase().includes(dropdownSearchText.toLowerCase())
                    ).length === 0 && (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>No students found</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Student Type Filter */}
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "600",
                color: "#0f172a",
              }}
            >
              Student Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "2px solid #e2e8f0",
                borderRadius: "10px",
                fontSize: "15px",
                background: "#f8fafc",
                cursor: "pointer",
                fontWeight: "500",
              }}
            >
              <option value="All">All Types</option>
              <option value="Internship">Internship</option>
              <option value="SMS Program">SMS Program</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "600",
                color: "#0f172a",
              }}
            >
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "2px solid #e2e8f0",
                borderRadius: "10px",
                fontSize: "15px",
                background: "#f8fafc",
                cursor: "pointer",
                fontWeight: "500",
              }}
            >
              <option value="All">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Added By Filter */}
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "600",
                color: "#0f172a",
              }}
            >
              Added By
            </label>
            <select
              value={filterAddedBy}
              onChange={(e) => setFilterAddedBy(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "2px solid #e2e8f0",
                borderRadius: "10px",
                fontSize: "15px",
                background: "#f8fafc",
                cursor: "pointer",
                fontWeight: "500",
              }}
            >
              <option value="All">All</option>
              <option value="Admin">Admin</option>
              <option value="Representative">Representative</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="card">
        {filteredInterns.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "#64748b",
            }}
          >
            <h3 style={{ color: "#0f172a", marginBottom: "8px" }}>
              No Students Found
            </h3>
            <p>Try adjusting your filters or search query</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table view-students-table" style={{ minWidth: "860px" }}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Mobile</th>
                  <th>Type</th>
                  <th>Domain</th>
                  <th>Added By</th>
                  <th>Start Month</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInterns.map((student) => (
                  <tr key={student._id}>
                    <td>{student.internId || "—"}</td>
                    <td>{student.name || "—"}</td>
                    <td>{student.mobile || "—"}</td>
                    <td>{student.studentType || "—"}</td>
                    <td>{student.domain || student.suggestedDomain || "—"}</td>
                    <td>
                      {student.addedByRepresentative
                        ? `Representative: ${student.addedByRepresentative.name}`
                        : "Admin"}
                    </td>
                    <td>{getStartMonthValue(student)}</td>
                    <td style={{ position: "relative" }}>
                      <button
                        data-menu-toggle
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMenu(student._id, e);
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
                              position: "absolute",
                              left: `${menuPosition.left}px`,
                              top: `${menuPosition.top}px`,
                              transform: menuPosition.openUpward ? "translateY(-100%)" : "none",
                              background: "white",
                              border: "1px solid #e5e7eb",
                              borderRadius: "12px",
                              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
                              zIndex: 11000,
                              width: "160px",
                              overflow: "hidden",
                            }}
                          >
                            <button
                              onClick={() => {
                                handleViewProfile(student);
                                setOpenMenuId(null);
                              }}
                              style={{
                                width: "100%",
                                padding: "12px 16px",
                                background: "white",
                                border: "none",
                                textAlign: "left",
                                cursor: "pointer",
                                fontSize: "14px",
                                fontWeight: "500",
                                color: "#0f172a",
                              }}
                              onMouseEnter={(e) => (e.target.style.background = "#f9fafb")}
                              onMouseLeave={(e) => (e.target.style.background = "white")}
                            >
                              View Profile
                            </button>
                            <button
                              onClick={() => {
                                handleEdit(student);
                                setOpenMenuId(null);
                              }}
                              style={{
                                width: "100%",
                                padding: "12px 16px",
                                background: "white",
                                border: "none",
                                textAlign: "left",
                                cursor: "pointer",
                                fontSize: "14px",
                                fontWeight: "500",
                                color: "#0f172a",
                                borderTop: "1px solid #f3f4f6",
                              }}
                              onMouseEnter={(e) => (e.target.style.background = "#f9fafb")}
                              onMouseLeave={(e) => (e.target.style.background = "white")}
                            >
                              Edit Details
                            </button>
                            <div
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                padding: "10px 16px",
                                fontSize: "12px",
                                fontWeight: "700",
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                                color: "#64748b",
                                borderTop: "1px solid #f3f4f6",
                                background: "#f8fafc",
                              }}
                            >
                              More
                            </div>
                            <button
                              onClick={() => handleViewCertificates(student)}
                              style={{
                                width: "100%",
                                padding: "12px 16px",
                                background: "white",
                                border: "none",
                                textAlign: "left",
                                cursor: "pointer",
                                fontSize: "14px",
                                fontWeight: "500",
                                color: "#0f172a",
                              }}
                              onMouseEnter={(e) => (e.target.style.background = "#f9fafb")}
                              onMouseLeave={(e) => (e.target.style.background = "white")}
                            >
                              Certificates
                            </button>
                            <button
                              onClick={() => handleStatusToggle(student)}
                              style={{
                                width: "100%",
                                padding: "12px 16px",
                                background: "white",
                                border: "none",
                                textAlign: "left",
                                cursor: "pointer",
                                fontSize: "14px",
                                fontWeight: "500",
                                color: "#0f172a",
                                borderTop: "1px solid #f3f4f6",
                              }}
                              onMouseEnter={(e) => (e.target.style.background = "#f9fafb")}
                              onMouseLeave={(e) => (e.target.style.background = "white")}
                            >
                              {(student.status || "").toLowerCase() === "active"
                                ? "Mark Inactive"
                                : "Mark Active"}
                            </button>
                            <button
                              onClick={() => handleMarkCompleted(student)}
                              style={{
                                width: "100%",
                                padding: "12px 16px",
                                background: "white",
                                border: "none",
                                textAlign: "left",
                                cursor: "pointer",
                                fontSize: "14px",
                                fontWeight: "500",
                                color: "#0f172a",
                                borderTop: "1px solid #f3f4f6",
                              }}
                              onMouseEnter={(e) => (e.target.style.background = "#f9fafb")}
                              onMouseLeave={(e) => (e.target.style.background = "white")}
                            >
                              Mark Completed
                            </button>
                            <button
                              onClick={() => handleDelete(student._id, student.name)}
                              style={{
                                width: "100%",
                                padding: "12px 16px",
                                background: "white",
                                border: "none",
                                textAlign: "left",
                                cursor: "pointer",
                                fontSize: "14px",
                                fontWeight: "500",
                                color: "#0f172a",
                                borderTop: "1px solid #f3f4f6",
                              }}
                              onMouseEnter={(e) => (e.target.style.background = "#f9fafb")}
                              onMouseLeave={(e) => (e.target.style.background = "white")}
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

      {/* View Profile Modal */}
      {showProfileModal &&
        selectedStudent &&
        createPortal(
          <div
            className="profile-modal-overlay"
            onClick={() => {
              setShowProfileModal(false);
              setSelectedStudent(null);
            }}
          >
            <div className="profile-modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="profile-header" style={{ background: "#344158" }}>
                <button
                  className="profile-close-btn"
                  onClick={() => {
                    setShowProfileModal(false);
                    setSelectedStudent(null);
                  }}
                >
                  ×
                </button>

                <div className="profile-avatar">
                  {String(selectedStudent.name || "S")
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase()}
                </div>
                <h2 className="profile-name">{selectedStudent.name || "Student"}</h2>
                <div className="profile-badges">
                  <span className="profile-badge">PIID: {selectedStudent.internId || "-"}</span>
                  <span className="profile-badge">{selectedStudent.studentType || "Student"}</span>
                  <span
                    className={`profile-badge ${(selectedStudent.status || "").toLowerCase() === "active" ? "status-active" : "status-inactive"}`}
                  >
                    {selectedStudent.status || "Active"}
                  </span>
                </div>
                {((selectedStudent.status || '').toLowerCase() === 'inactive' && (selectedStudent.inactiveMessage || '').trim()) && (
                  <div style={{ marginTop: 12, padding: '10px 12px', background: '#fff7ed', border: '1px solid #fcd34d', borderRadius: 8 }}>
                    <strong style={{ display: 'block', marginBottom: 4 }}>Inactive note</strong>
                    <div style={{ color: '#92400e' }}>{selectedStudent.inactiveMessage}</div>
                    <div style={{ marginTop: 8, color: '#92400e', fontSize: 13 }}>Contact admin to make yourself active.</div>
                  </div>
                )}
              </div>

              <div className="profile-body">
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
                      {
                        key: "smsProgramEnrollmentLetter",
                        label: "SMS Program Enrollment Letter",
                      },
                      {
                        key: "completionCertificate",
                        label: "Completion Certificate",
                      },
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
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: "600",
                              color: "#0f172a",
                            }}
                          >
                            {label}
                          </div>
                          {selectedStudent.documents?.[key] && (
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#64748b",
                                marginTop: "2px",
                              }}
                            >
                              Uploaded:{" "}
                              {new Date(
                                selectedStudent.documents[key].uploadedAt ||
                                Date.now(),
                              ).toLocaleDateString()}
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
                    {(selectedStudent.documents?.otherCertificates || []).map(
                      (cert, i) => (
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
                            <div
                              style={{
                                fontSize: "14px",
                                fontWeight: "600",
                                color: "#0f172a",
                              }}
                            >
                              {cert.name || `Certificate ${i + 1}`}
                            </div>
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#64748b",
                                marginTop: "2px",
                              }}
                            >
                              Uploaded:{" "}
                              {new Date(
                                cert.uploadedAt || Date.now(),
                              ).toLocaleDateString()}
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
                      ),
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="profile-actions">
                  <button
                    className="profile-btn profile-btn-edit"
                    style={{ background: "#324158", color: "white", border: "none", boxShadow: "0 4px 12px rgba(50, 65, 88, 0.2)" }}
                    onClick={() => {
                      setShowProfileModal(false);
                      handleEdit(selectedStudent);
                    }}
                  >
                    Edit Profile
                  </button>
                  <button
                    className="profile-btn profile-btn-certificates"
                    style={{ background: "#324158", color: "white", border: "none", boxShadow: "0 4px 12px rgba(50, 65, 88, 0.2)" }}
                    onClick={() => {
                      setShowProfileModal(false);
                      handleViewCertificates(selectedStudent);
                    }}
                  >
                    Manage Certificates
                  </button>
                  <button
                    className="profile-btn profile-btn-close"
                    style={{ background: "#324158", color: "white", border: "none", boxShadow: "0 4px 12px rgba(50, 65, 88, 0.2)" }}
                    onClick={() => {
                      setShowProfileModal(false);
                      setSelectedStudent(null);
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Edit Modal */}
      {showEditModal && selectedStudent && editForm && (
        <div className="profile-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="profile-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="profile-header" style={{ background: "#344158" }}>
              <button className="profile-close-btn" onClick={() => setShowEditModal(false)}>
                ×
              </button>
              <div className="profile-avatar">
                {String(editForm.name || selectedStudent.name || "S")
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")
                  .toUpperCase()}
              </div>
              <h2 className="profile-name">Edit Profile</h2>
              <div className="profile-badges">
                <span className="profile-badge">PIID: {editForm.internId || "-"}</span>
                <span className="profile-badge">{editForm.studentType || "Student"}</span>
              </div>
            </div>

            <div className="profile-body">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveEdit();
                }}
              >
                <div className="profile-section">
                  <h3 className="profile-section-title">
                    <span className="profile-section-bar" />
                    Basic Information
                  </h3>
                  <div className="profile-info-grid">
                    <div className="profile-field">
                      <label>Student Type</label>
                      <select
                        value={editForm.studentType}
                        onChange={(e) => handleEditChange("studentType", e.target.value)}
                      >
                        <option value="Internship">Internship</option>
                        <option value="SMS Program">SMS Program</option>
                      </select>
                    </div>
                    <div className="profile-field">
                      <label>Student ID</label>
                      <input value={editForm.internId} readOnly />
                    </div>
                    <div className="profile-field">
                      <label>Password</label>
                      <div className="password-input-wrapper">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={editForm.password}
                          onChange={(e) => handleEditChange("password", e.target.value)}
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
                        value={editForm.name}
                        onChange={(e) => handleEditChange("name", e.target.value)}
                        required
                      />
                    </div>
                    <div className="profile-field">
                      <label>Email</label>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => handleEditChange("email", e.target.value)}
                        required
                      />
                    </div>
                    <div className="profile-field">
                      <label>Mobile</label>
                      <input
                        value={editForm.mobile}
                        onChange={(e) => handleEditChange("mobile", e.target.value)}
                      />
                    </div>
                    <div className="profile-field">
                      <label>Current Designation</label>
                      <input
                        value={editForm.currentDesignation}
                        onChange={(e) => handleEditChange("currentDesignation", e.target.value)}
                      />
                    </div>
                    <div className="profile-field">
                      <label>Joining Date</label>
                      <input
                        type="date"
                        value={editForm.joiningDate}
                        onChange={(e) => handleEditChange("joiningDate", e.target.value)}
                      />
                    </div>
                    <div className="profile-field">
                      <label>Ending Date</label>
                      <input
                        type="date"
                        value={editForm.endingDate}
                        onChange={(e) => handleEditChange("endingDate", e.target.value)}
                      />
                    </div>
                    <div className="profile-field">
                      <label>Duration</label>
                      <input
                        value={editForm.duration}
                        onChange={(e) => handleEditChange("duration", e.target.value)}
                      />
                    </div>
                    <div className="profile-field">
                      <label>Stipend Type</label>
                      <select value={editForm.stipendType} onChange={(e) => handleEditChange('stipendType', e.target.value)}>
                        <option value="Unpaid">Unpaid</option>
                        <option value="Stipend">Stipend</option>
                        <option value="Performance Based">Performance Based</option>
                      </select>
                    </div>
                    {editForm.stipendType === 'Stipend' && (
                      <div className="profile-field">
                        <label>Stipend Amount (Rs.)</label>
                        <input value={editForm.stipendAmount} onChange={(e) => handleEditChange('stipendAmount', e.target.value)} />
                      </div>
                    )}
                  </div>
                </div>

                {editForm.studentType === "Internship" ? (
                  <div className="profile-section">
                    <h3 className="profile-section-title">
                      <span className="profile-section-bar" />
                      Internship Details
                    </h3>
                    <div className="profile-info-grid">
                      <div className="profile-field">
                        <label>Domain</label>
                        <input
                          value={editForm.domain}
                          onChange={(e) => handleEditChange("domain", e.target.value)}
                        />
                      </div>
                      <div className="profile-field">
                        <label>College Name</label>
                        <input
                          value={editForm.collegeName}
                          onChange={(e) => handleEditChange("collegeName", e.target.value)}
                        />
                      </div>
                      <div className="profile-field">
                        <label>Branch</label>
                        <input
                          value={editForm.branch}
                          onChange={(e) => handleEditChange("branch", e.target.value)}
                        />
                      </div>
                      <div className="profile-field">
                        <label>Year of Study</label>
                        <input
                          value={editForm.yearOfStudy}
                          onChange={(e) => handleEditChange("yearOfStudy", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="profile-section">
                      <h3 className="profile-section-title">
                        <span className="profile-section-bar" />
                        Program Details
                      </h3>
                      <div className="profile-info-grid">
                        <div className="profile-field">
                          <label>Suggested Domain</label>
                          <input
                            value={editForm.suggestedDomain}
                            onChange={(e) => handleEditChange("suggestedDomain", e.target.value)}
                          />
                        </div>
                        <div className="profile-field">
                          <label>Current Qualification</label>
                          <input
                            value={editForm.currentQualification}
                            onChange={(e) => handleEditChange("currentQualification", e.target.value)}
                          />
                        </div>
                        <div className="profile-field">
                          <label>Institute Name</label>
                          <input
                            value={editForm.instituteName}
                            onChange={(e) => handleEditChange("instituteName", e.target.value)}
                          />
                        </div>
                        <div className="profile-field">
                          <label>Institute Location</label>
                          <input
                            value={editForm.instituteLocation}
                            onChange={(e) => handleEditChange("instituteLocation", e.target.value)}
                          />
                        </div>
                        <div className="profile-field">
                          <label>Enrolment Date</label>
                          <input
                            type="date"
                            value={editForm.enrolmentDate}
                            onChange={(e) => handleEditChange("enrolmentDate", e.target.value)}
                          />
                        </div>
                        <div className="profile-field">
                          <label>Batch Month</label>
                          <input
                            type="month"
                            value={editForm.enrolBatchMonth}
                            onChange={(e) => handleEditChange("enrolBatchMonth", e.target.value)}
                          />
                        </div>
                        <div className="profile-field">
                          <label>Total Fees</label>
                          <input
                            value={editForm.totalFees}
                            onChange={(e) => handleEditChange("totalFees", e.target.value)}
                          />
                        </div>
                        <div className="profile-field">
                          <label>Completed Fees</label>
                          <input
                            value={editForm.completedFees}
                            onChange={(e) => handleEditChange("completedFees", e.target.value)}
                          />
                        </div>
                        <div className="profile-field">
                          <label>Pending Fees</label>
                          <input
                            value={editForm.pendingFees}
                            onChange={(e) => handleEditChange("pendingFees", e.target.value)}
                          />
                        </div>
                        <div className="profile-field">
                          <label>Gender</label>
                          <select
                            value={editForm.gender}
                            onChange={(e) => handleEditChange("gender", e.target.value)}
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
                            value={editForm.paymentDoneBy}
                            onChange={(e) => handleEditChange("paymentDoneBy", e.target.value)}
                          />
                        </div>
                        <div className="profile-field">
                          <label>Transaction ID</label>
                          <input
                            value={editForm.transactionId}
                            onChange={(e) => handleEditChange("transactionId", e.target.value)}
                          />
                        </div>
                        <div className="profile-field">
                          <label>Date of Payment</label>
                          <input
                            type="date"
                            value={editForm.dateOfPayment}
                            onChange={(e) => handleEditChange("dateOfPayment", e.target.value)}
                          />
                        </div>
                        <div className="profile-field">
                          <label>Payment Amount</label>
                          <input
                            value={editForm.paymentAmount}
                            onChange={(e) => handleEditChange("paymentAmount", e.target.value)}
                          />
                        </div>
                        <div className="profile-field">
                          <label>First Payment Amount</label>
                          <input
                            value={editForm.firstPaymentAmount}
                            onChange={(e) => handleEditChange("firstPaymentAmount", e.target.value)}
                          />
                        </div>
                        <div className="profile-field">
                          <label>First Payment Date</label>
                          <input
                            type="date"
                            value={editForm.firstPaymentDate}
                            onChange={(e) => handleEditChange("firstPaymentDate", e.target.value)}
                          />
                        </div>
                        <div className="profile-field">
                          <label>Second Payment Amount</label>
                          <input
                            value={editForm.secondPaymentAmount}
                            onChange={(e) => handleEditChange("secondPaymentAmount", e.target.value)}
                          />
                        </div>
                        <div className="profile-field">
                          <label>Second Payment Date</label>
                          <input
                            type="date"
                            value={editForm.secondPaymentDate}
                            onChange={(e) => handleEditChange("secondPaymentDate", e.target.value)}
                          />
                        </div>
                        <div className="profile-field">
                          <label>Final Payment Amount</label>
                          <input
                            value={editForm.finalPaymentAmount}
                            onChange={(e) => handleEditChange("finalPaymentAmount", e.target.value)}
                          />
                        </div>
                        <div className="profile-field">
                          <label>Final Payment Date</label>
                          <input
                            type="date"
                            value={editForm.finalPaymentDate}
                            onChange={(e) => handleEditChange("finalPaymentDate", e.target.value)}
                          />
                        </div>
                        <div className="profile-field">
                          <label>Last Payment Date</label>
                          <input
                            type="date"
                            value={editForm.lastPaymentDate}
                            onChange={(e) => handleEditChange("lastPaymentDate", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="profile-actions">
                  <button type="button" className="profile-btn profile-btn-ghost" onClick={() => setShowEditModal(false)}
                    style={{ background: '#ffffff', color: '#324158', border: '2px solid #324158' }}>
                    Cancel
                  </button>
                  <button type="submit" className="profile-btn profile-btn-primary"
                    style={{ background: '#324158', boxShadow: '0 4px 12px rgba(50,65,88,0.3)' }}>
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Management Modal */}
      {showCertificateModal && selectedStudent && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "700px",
              width: "95%",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h2 style={{ margin: 0 }}>
                Manage Certificates - {selectedStudent.name}
              </h2>
              <button
                onClick={() => setShowCertificateModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  padding: "0",
                  width: "30px",
                  height: "30px",
                  color: "#64748b",
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                marginBottom: "24px",
                padding: "16px",
                background: "#f8fafc",
                borderRadius: "8px",
              }}
            >
              <div
                style={{
                  fontSize: "13px",
                  color: "#64748b",
                  marginBottom: "8px",
                }}
              >
                Student Information
              </div>
              <div
                style={{ fontSize: "15px", fontWeight: 600, color: "#0f172a" }}
              >
                {selectedStudent.internId} • {selectedStudent.studentType}
              </div>
            </div>

            {/* Upload Section */}
            <div
              style={{
                padding: "20px",
                background: "#eff6ff",
                borderRadius: "10px",
                marginBottom: "24px",
                border: "2px dashed #3b82f6",
              }}
            >
              <h3 style={{ marginTop: 0, fontSize: "16px", color: "#1e40af" }}>
                Upload New Certificate
              </h3>

              {certificateUploadStatus?.success && (
                <div
                  style={{
                    marginBottom: "12px",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    background: "#dcfce7",
                    border: "1px solid #86efac",
                    color: "#166534",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  Certificate assigned successfully: {certificateUploadStatus.label}
                </div>
              )}

              {certificateUploadStatus && !certificateUploadStatus.success && (
                <div
                  style={{
                    marginBottom: "12px",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    background: "#fee2e2",
                    border: "1px solid #fca5a5",
                    color: "#991b1b",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  Certificate assignment failed. Please retry.
                </div>
              )}

              <div style={{ marginBottom: "12px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    marginBottom: "6px",
                    color: "#0f172a",
                  }}
                >
                  Certificate Type
                </label>
                <select
                  value={certificateType}
                  onChange={(e) => setCertificateType(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                  }}
                >
                  {certificateTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {certificateType === "other" && (
                <div style={{ marginBottom: "12px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 600,
                      marginBottom: "6px",
                      color: "#0f172a",
                    }}
                  >
                    Certificate Name
                  </label>
                  <input
                    type="text"
                    value={certificateName}
                    onChange={(e) => setCertificateName(e.target.value)}
                    placeholder="e.g., Participation Certificate, Workshop Certificate"
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                    }}
                  />
                </div>
              )}

              <div style={{ marginBottom: "12px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    marginBottom: "6px",
                    color: "#0f172a",
                  }}
                >
                  Select PDF File
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setCertificateFile(e.target.files[0])}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    background: "white",
                  }}
                />
                {certificateFile && (
                  <div
                    style={{
                      marginTop: "8px",
                      fontSize: "13px",
                      color: "#059669",
                      fontWeight: 500,
                    }}
                  >
                    Selected: {certificateFile.name}
                  </div>
                )}
              </div>

              <button
                onClick={handleCertificateUpload}
                disabled={uploadingCert || !certificateFile}
                style={{
                  width: "100%",
                  padding: "12px",
                  background:
                    uploadingCert || !certificateFile ? "#cbd5e1" : "#324158",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor:
                    uploadingCert || !certificateFile
                      ? "not-allowed"
                      : "pointer",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                {uploadingCert ? "Assigning Certificate..." : "Assign Certificate"}
              </button>
            </div>

            {/* Existing Certificates */}
            <div>
              <h3
                style={{
                  fontSize: "16px",
                  marginBottom: "12px",
                  color: "#0f172a",
                }}
              >
                Existing Certificates
              </h3>

              <div style={{ display: "grid", gap: "12px" }}>
                {/* Offer Letter */}
                <div
                  style={{
                    padding: "12px",
                    background: "#f8fafc",
                    borderRadius: "8px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#0f172a",
                      }}
                    >
                      Offer Letter
                    </div>
                    {selectedStudent.documents?.offerLetter && (
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#64748b",
                          marginTop: "4px",
                        }}
                      >
                        Uploaded:{" "}
                        {new Date(
                          selectedStudent.documents.offerLetter.uploadedAt ||
                          Date.now(),
                        ).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div>
                    {selectedStudent.documents?.offerLetter ? (
                      <a
                        href={`${UPLOADS_BASE}/uploads/students/${selectedStudent.documents.offerLetter.filename}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: "8px 16px",
                          background: "#324158",
                          color: "white",
                          textDecoration: "none",
                          borderRadius: "6px",
                          fontSize: "13px",
                          fontWeight: 600,
                        }}
                      >
                        View
                      </a>
                    ) : (
                      <span style={{ fontSize: "13px", color: "#94a3b8" }}>
                        Not uploaded
                      </span>
                    )}
                  </div>
                </div>

                {/* SMS Enrollment Letter */}
                <div
                  style={{
                    padding: "12px",
                    background: "#f8fafc",
                    borderRadius: "8px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#0f172a",
                      }}
                    >
                      SMS Enrollment letter
                    </div>
                    {selectedStudent.documents?.smsProgramEnrollmentLetter && (
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#64748b",
                          marginTop: "4px",
                        }}
                      >
                        Uploaded:{" "}
                        {new Date(
                          selectedStudent.documents.smsProgramEnrollmentLetter
                            .uploadedAt || Date.now(),
                        ).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div>
                    {selectedStudent.documents?.smsProgramEnrollmentLetter ? (
                      <a
                        href={`${UPLOADS_BASE}/uploads/students/${selectedStudent.documents.smsProgramEnrollmentLetter.filename}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: "8px 16px",
                          background: "#324158",
                          color: "white",
                          textDecoration: "none",
                          borderRadius: "6px",
                          fontSize: "13px",
                          fontWeight: 600,
                        }}
                      >
                        View
                      </a>
                    ) : (
                      <span style={{ fontSize: "13px", color: "#94a3b8" }}>
                        Not uploaded
                      </span>
                    )}
                  </div>
                </div>

                {/* Payment Receipt */}
                <div
                  style={{
                    padding: "12px",
                    background: "#f8fafc",
                    borderRadius: "8px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#0f172a",
                      }}
                    >
                      Payment Receipt
                    </div>
                    {selectedStudent.documents?.paymentReceipt && (
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#64748b",
                          marginTop: "4px",
                        }}
                      >
                        Uploaded:{" "}
                        {new Date(
                          selectedStudent.documents.paymentReceipt.uploadedAt ||
                          Date.now(),
                        ).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div>
                    {selectedStudent.documents?.paymentReceipt ? (
                      <a
                        href={`${UPLOADS_BASE}/uploads/students/${selectedStudent.documents.paymentReceipt.filename}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: "8px 16px",
                          background: "#324158",
                          color: "white",
                          textDecoration: "none",
                          borderRadius: "6px",
                          fontSize: "13px",
                          fontWeight: 600,
                        }}
                      >
                        View
                      </a>
                    ) : (
                      <span style={{ fontSize: "13px", color: "#94a3b8" }}>
                        Not uploaded
                      </span>
                    )}
                  </div>
                </div>

                {/* Completion Certificate */}
                <div
                  style={{
                    padding: "12px",
                    background: "#f8fafc",
                    borderRadius: "8px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#0f172a",
                      }}
                    >
                      Completion Certificate
                    </div>
                    {(selectedStudent.documents?.completionCertificate ||
                      selectedStudent.documents?.completionLetter) && (
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#64748b",
                            marginTop: "4px",
                          }}
                        >
                          Uploaded:{" "}
                          {new Date(
                            (selectedStudent.documents.completionCertificate ||
                              selectedStudent.documents.completionLetter)
                              ?.uploadedAt || Date.now(),
                          ).toLocaleDateString()}
                        </div>
                      )}
                  </div>
                  <div>
                    {(selectedStudent.documents?.completionCertificate ||
                      selectedStudent.documents?.completionLetter) ? (
                      <a
                        href={`${UPLOADS_BASE}/uploads/students/${(selectedStudent.documents.completionCertificate || selectedStudent.documents.completionLetter).filename}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: "8px 16px",
                          background: "#324158",
                          color: "white",
                          textDecoration: "none",
                          borderRadius: "6px",
                          fontSize: "13px",
                          fontWeight: 600,
                        }}
                      >
                        View
                      </a>
                    ) : (
                      <span style={{ fontSize: "13px", color: "#94a3b8" }}>
                        Not uploaded
                      </span>
                    )}
                  </div>
                </div>

                {/* Experience Letter */}
                <div
                  style={{
                    padding: "12px",
                    background: "#f8fafc",
                    borderRadius: "8px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#0f172a",
                      }}
                    >
                      Experience Letter
                    </div>
                    {selectedStudent.documents?.experienceLetter && (
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#64748b",
                          marginTop: "4px",
                        }}
                      >
                        Uploaded:{" "}
                        {new Date(
                          selectedStudent.documents.experienceLetter
                            .uploadedAt || Date.now(),
                        ).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div>
                    {selectedStudent.documents?.experienceLetter ? (
                      <a
                        href={`${UPLOADS_BASE}/uploads/students/${selectedStudent.documents.experienceLetter.filename}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: "8px 16px",
                          background: "#324158",
                          color: "white",
                          textDecoration: "none",
                          borderRadius: "6px",
                          fontSize: "13px",
                          fontWeight: 600,
                        }}
                      >
                        View
                      </a>
                    ) : (
                      <span style={{ fontSize: "13px", color: "#94a3b8" }}>
                        Not uploaded
                      </span>
                    )}
                  </div>
                </div>

                {/* Other Certificates */}
                {selectedStudent.documents?.otherCertificates &&
                  selectedStudent.documents.otherCertificates.length > 0 && (
                    <div
                      style={{
                        padding: "12px",
                        background: "#f8fafc",
                        borderRadius: "8px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#0f172a",
                          marginBottom: "8px",
                        }}
                      >
                        Other Certificates
                      </div>
                      {selectedStudent.documents.otherCertificates.map(
                        (cert, index) => (
                          <div
                            key={index}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "8px 0",
                              borderTop:
                                index > 0 ? "1px solid #e2e8f0" : "none",
                            }}
                          >
                            <span
                              style={{ fontSize: "13px", color: "#475569" }}
                            >
                              {cert.name || cert.filename}
                            </span>
                            <a
                              href={`${UPLOADS_BASE}/uploads/students/${cert.filename}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                padding: "6px 12px",
                                background: "#324158",
                                color: "white",
                                textDecoration: "none",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: 600,
                              }}
                            >
                              View
                            </a>
                          </div>
                        ),
                      )}
                    </div>
                  )}
              </div>
            </div>

            <button
              onClick={() => setShowCertificateModal(false)}
              style={{
                marginTop: "20px",
                padding: "10px 20px",
                background: "#324158",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 600,
                width: "100%",
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
