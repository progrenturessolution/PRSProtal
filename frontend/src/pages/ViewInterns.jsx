import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { adminAPI, UPLOADS_BASE } from "../services/api";

function ViewInterns({ onInternDeleted, onAddStudentClick }) {
  const [interns, setInterns] = useState([]);
  const [filteredInterns, setFilteredInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterAddedBy, setFilterAddedBy] = useState("All");
  const [certificateFile, setCertificateFile] = useState(null);
  const [certificateType, setCertificateType] = useState("offerLetter");
  const [certificateName, setCertificateName] = useState("");
  const [uploadingCert, setUploadingCert] = useState(false);
  const [certificateUploadStatus, setCertificateUploadStatus] = useState(null);

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

  const handleStatusToggle = async (student) => {
    const current = (student.status || "").toLowerCase();
    const newStatus = current === "active" ? "inactive" : "active";

    try {
      // Send normalized lower-case status to backend
      await adminAPI.updateInternStatus(student._id, newStatus);
      // Update UI with capitalized label for readability
      const label = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
      setInterns(
        interns.map((intern) =>
          intern._id === student._id ? { ...intern, status: label } : intern,
        ),
      );
      setOpenMenuId(null);
      // Show inline info message instead of alert
      setInfoMessage(
        `Student ${newStatus === "active" ? "activated" : "deactivated"} successfully`,
      );
      setTimeout(() => setInfoMessage(""), 4000);
    } catch (err) {
      setError("Failed to update status");
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

  const toggleMenu = (id) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      // If no menu is open, nothing to do
      if (!openMenuId) return;
      // If click happened inside an open menu or its toggle button, ignore
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
              background: "#324158",
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
          <div style={{ gridColumn: "1 / -1" }}>
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
            <input
              type="text"
              placeholder="Search by name, email, ID, mobile, representative..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "2px solid #e2e8f0",
                borderRadius: "10px",
                fontSize: "15px",
                transition: "all 0.2s",
                background: "#f8fafc",
              }}
            />
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
                          toggleMenu(student._id);
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

                      {openMenuId === student._id && (
                        <div
                          data-menu
                          style={{
                            position: "absolute",
                            right: 0,
                            top: "42px",
                            background: "white",
                            border: "1px solid #e5e7eb",
                            borderRadius: "12px",
                            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
                            zIndex: 1000,
                            minWidth: "180px",
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
                              color:
                                (student.status || "").toLowerCase() === "active"
                                  ? "#dc2626"
                                  : "#059669",
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
                              color: "#dc2626",
                              borderTop: "1px solid #f3f4f6",
                            }}
                            onMouseEnter={(e) => (e.target.style.background = "#fef2f2")}
                            onMouseLeave={(e) => (e.target.style.background = "white")}
                          >
                            Delete
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
      {showProfileModal &&
        selectedStudent &&
        createPortal(
          <div className="profile-modal-overlay">
            <div className="profile-modal-container">
              <div className="profile-body">
                <div className="premium-page-header" style={{ marginBottom: "16px" }}>
                  <div className="header-left">
                    <h1 style={{ marginBottom: "4px" }}>Student Profile</h1>
                    <p className="header-subtitle">{selectedStudent.name}</p>
                  </div>
                  <div className="header-right">
                    <button
                      className="premium-btn-secondary"
                      onClick={() => setShowProfileModal(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>

                <div className="premium-card" style={{ marginBottom: "16px" }}>
                  <div className="premium-card-header">
                    <h2>Personal Information</h2>
                  </div>

                  <div className="profile-info-grid">
                    <div className="profile-field">
                      <label>Full Name</label>
                      <div className="field-value">{selectedStudent.name || "Not available"}</div>
                    </div>
                    <div className="profile-field">
                      <label>Email Address</label>
                      <div className="field-value mono-text">{selectedStudent.email || "Not available"}</div>
                    </div>
                    <div className="profile-field">
                      <label>Mobile Number</label>
                      <div className="field-value mono-text">{selectedStudent.mobile || "Not available"}</div>
                    </div>
                    <div className="profile-field">
                      <label>Student ID</label>
                      <div className="field-value mono-text">{selectedStudent.internId || "Not available"}</div>
                    </div>
                    <div className="profile-field">
                      <label>Student Type</label>
                      <div className="field-value">
                        <span className="badge-neutral">{selectedStudent.studentType || "Not set"}</span>
                      </div>
                    </div>
                    <div className="profile-field">
                      <label>Status</label>
                      <div className="field-value">
                        <span className="badge-neutral">{selectedStudent.status || "active"}</span>
                      </div>
                    </div>
                    <div className="profile-field">
                      <label>Current Designation</label>
                      <div className="field-value">{selectedStudent.currentDesignation || "Not set"}</div>
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
                      <div className="field-value">{selectedStudent.duration || "Not set"}</div>
                    </div>

                    {selectedStudent.assignedTrainer && (
                      <>
                        <div className="profile-field">
                          <label>Assigned Trainer</label>
                          <div className="field-value">
                            {selectedStudent.assignedTrainer.name || selectedStudent.assignedTrainer}
                          </div>
                        </div>
                        <div className="profile-field">
                          <label>Trainer Email</label>
                          <div className="field-value mono-text">
                            {selectedStudent.assignedTrainer.email || "Not available"}
                          </div>
                        </div>
                      </>
                    )}

                    {selectedStudent.studentType === "Internship" ? (
                      <>
                        <div className="profile-field">
                          <label>Domain</label>
                          <div className="field-value">{selectedStudent.domain || "Not set"}</div>
                        </div>
                        <div className="profile-field">
                          <label>College Name</label>
                          <div className="field-value">{selectedStudent.collegeName || "Not set"}</div>
                        </div>
                        <div className="profile-field">
                          <label>Branch</label>
                          <div className="field-value">{selectedStudent.branch || "Not set"}</div>
                        </div>
                        <div className="profile-field">
                          <label>Year of Study</label>
                          <div className="field-value">{selectedStudent.yearOfStudy || "Not set"}</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="profile-field">
                          <label>Suggested Domain</label>
                          <div className="field-value">{selectedStudent.suggestedDomain || "Not set"}</div>
                        </div>
                        <div className="profile-field">
                          <label>Current Qualification</label>
                          <div className="field-value">{selectedStudent.currentQualification || "Not set"}</div>
                        </div>
                        <div className="profile-field">
                          <label>Institute Name</label>
                          <div className="field-value">{selectedStudent.instituteName || "Not set"}</div>
                        </div>
                        <div className="profile-field">
                          <label>Institute Location</label>
                          <div className="field-value">{selectedStudent.instituteLocation || "Not set"}</div>
                        </div>
                        <div className="profile-field">
                          <label>Enrolment Date</label>
                          <div className="field-value">{formatDateValue(selectedStudent.enrolmentDate)}</div>
                        </div>
                        <div className="profile-field">
                          <label>Batch Month</label>
                          <div className="field-value">{selectedStudent.enrolBatchMonth || "Not set"}</div>
                        </div>
                        <div className="profile-field">
                          <label>Total Fees</label>
                          <div className="field-value">{selectedStudent.totalFees || "0"}</div>
                        </div>
                        <div className="profile-field">
                          <label>Completed Fees</label>
                          <div className="field-value">{selectedStudent.completedFees || "0"}</div>
                        </div>
                        <div className="profile-field">
                          <label>Pending Fees</label>
                          <div className="field-value">{selectedStudent.pendingFees || "0"}</div>
                        </div>
                        <div className="profile-field">
                          <label>Gender</label>
                          <div className="field-value">{selectedStudent.gender || "Not set"}</div>
                        </div>
                        <div className="profile-field">
                          <label>Payment Done By</label>
                          <div className="field-value">{selectedStudent.paymentDoneBy || "Not set"}</div>
                        </div>
                        <div className="profile-field">
                          <label>Transaction ID</label>
                          <div className="field-value mono-text">{selectedStudent.transactionId || "Not set"}</div>
                        </div>
                        <div className="profile-field">
                          <label>Payment Amount</label>
                          <div className="field-value">{selectedStudent.paymentAmount || "0"}</div>
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
                            {(selectedStudent.firstPaymentAmount || "0") +
                              (selectedStudent.firstPaymentDate
                                ? ` on ${formatDateValue(selectedStudent.firstPaymentDate)}`
                                : "")}
                          </div>
                        </div>
                        <div className="profile-field">
                          <label>Second Payment</label>
                          <div className="field-value">
                            {(selectedStudent.secondPaymentAmount || "0") +
                              (selectedStudent.secondPaymentDate
                                ? ` on ${formatDateValue(selectedStudent.secondPaymentDate)}`
                                : "")}
                          </div>
                        </div>
                        <div className="profile-field">
                          <label>Final Payment</label>
                          <div className="field-value">
                            {(selectedStudent.finalPaymentAmount || "0") +
                              (selectedStudent.finalPaymentDate
                                ? ` on ${formatDateValue(selectedStudent.finalPaymentDate)}`
                                : "")}
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

                {/* Documents / Certificates */}
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
                      ),
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="profile-actions">
                  <button
                    className="profile-btn profile-btn-primary"
                    onClick={() => {
                      setShowProfileModal(false);
                      handleEdit(selectedStudent);
                    }}
                  >
                    Edit Profile
                  </button>
                  <button
                    className="profile-btn profile-btn-secondary"
                    onClick={() => {
                      setShowProfileModal(false);
                      handleViewCertificates(selectedStudent);
                    }}
                  >
                    Manage Certificates
                  </button>
                  <button
                    className="profile-btn profile-btn-ghost"
                    onClick={() => setShowProfileModal(false)}
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
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Profile</h2>
              <button className="modal-close-btn" onClick={() => setShowEditModal(false)}>
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveEdit();
              }}
            >
              <div className="form-group">
                <label>Student Type</label>
                <select
                  value={editForm.studentType}
                  onChange={(e) => handleEditChange("studentType", e.target.value)}
                >
                  <option value="Internship">Internship</option>
                  <option value="SMS Program">SMS Program</option>
                </select>
              </div>

              <div className="form-group">
                <label>Student ID</label>
                <input value={editForm.internId} readOnly />
              </div>

              <div className="form-group">
                <label>Full Name</label>
                <input
                  value={editForm.name}
                  onChange={(e) => handleEditChange("name", e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => handleEditChange("email", e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Mobile</label>
                <input
                  value={editForm.mobile}
                  onChange={(e) => handleEditChange("mobile", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Current Designation</label>
                <input
                  value={editForm.currentDesignation}
                  onChange={(e) =>
                    handleEditChange("currentDesignation", e.target.value)
                  }
                />
              </div>

              <div className="form-group">
                <label>Joining Date</label>
                <input
                  type="date"
                  value={editForm.joiningDate}
                  onChange={(e) => handleEditChange("joiningDate", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Ending Date</label>
                <input
                  type="date"
                  value={editForm.endingDate}
                  onChange={(e) => handleEditChange("endingDate", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Duration</label>
                <input
                  value={editForm.duration}
                  onChange={(e) => handleEditChange("duration", e.target.value)}
                />
              </div>

              {editForm.studentType === "Internship" ? (
                <>
                  <div className="form-group">
                    <label>Domain</label>
                    <input
                      value={editForm.domain}
                      onChange={(e) => handleEditChange("domain", e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>College Name</label>
                    <input
                      value={editForm.collegeName}
                      onChange={(e) => handleEditChange("collegeName", e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Branch</label>
                    <input
                      value={editForm.branch}
                      onChange={(e) => handleEditChange("branch", e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Year of Study</label>
                    <input
                      value={editForm.yearOfStudy}
                      onChange={(e) => handleEditChange("yearOfStudy", e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label>Suggested Domain</label>
                    <input
                      value={editForm.suggestedDomain}
                      onChange={(e) => handleEditChange("suggestedDomain", e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Current Qualification</label>
                    <input
                      value={editForm.currentQualification}
                      onChange={(e) => handleEditChange("currentQualification", e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Institute Name</label>
                    <input
                      value={editForm.instituteName}
                      onChange={(e) => handleEditChange("instituteName", e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Institute Location</label>
                    <input
                      value={editForm.instituteLocation}
                      onChange={(e) => handleEditChange("instituteLocation", e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Enrolment Date</label>
                    <input
                      type="date"
                      value={editForm.enrolmentDate}
                      onChange={(e) => handleEditChange("enrolmentDate", e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Batch Month</label>
                    <input
                      type="month"
                      value={editForm.enrolBatchMonth}
                      onChange={(e) => handleEditChange("enrolBatchMonth", e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Total Fees</label>
                    <input
                      value={editForm.totalFees}
                      onChange={(e) => handleEditChange("totalFees", e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Completed Fees</label>
                    <input
                      value={editForm.completedFees}
                      onChange={(e) => handleEditChange("completedFees", e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Pending Fees</label>
                    <input
                      value={editForm.pendingFees}
                      onChange={(e) => handleEditChange("pendingFees", e.target.value)}
                    />
                  </div>
                  <div className="form-group">
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
                  <div className="form-group">
                    <label>Payment Done By</label>
                    <input
                      value={editForm.paymentDoneBy}
                      onChange={(e) => handleEditChange("paymentDoneBy", e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Transaction ID</label>
                    <input
                      value={editForm.transactionId}
                      onChange={(e) => handleEditChange("transactionId", e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Date of Payment</label>
                    <input
                      type="date"
                      value={editForm.dateOfPayment}
                      onChange={(e) => handleEditChange("dateOfPayment", e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Payment Amount</label>
                    <input
                      value={editForm.paymentAmount}
                      onChange={(e) => handleEditChange("paymentAmount", e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>First Payment Amount</label>
                    <input
                      value={editForm.firstPaymentAmount}
                      onChange={(e) => handleEditChange("firstPaymentAmount", e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>First Payment Date</label>
                    <input
                      type="date"
                      value={editForm.firstPaymentDate}
                      onChange={(e) => handleEditChange("firstPaymentDate", e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Second Payment Amount</label>
                    <input
                      value={editForm.secondPaymentAmount}
                      onChange={(e) => handleEditChange("secondPaymentAmount", e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Second Payment Date</label>
                    <input
                      type="date"
                      value={editForm.secondPaymentDate}
                      onChange={(e) => handleEditChange("secondPaymentDate", e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Final Payment Amount</label>
                    <input
                      value={editForm.finalPaymentAmount}
                      onChange={(e) => handleEditChange("finalPaymentAmount", e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Final Payment Date</label>
                    <input
                      type="date"
                      value={editForm.finalPaymentDate}
                      onChange={(e) => handleEditChange("finalPaymentDate", e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Payment Date</label>
                    <input
                      type="date"
                      value={editForm.lastPaymentDate}
                      onChange={(e) => handleEditChange("lastPaymentDate", e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save
                </button>
              </div>
            </form>
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
                    uploadingCert || !certificateFile ? "#cbd5e1" : "#3b82f6",
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
                          background: "#0f172a",
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
                          background: "#0f172a",
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
                          background: "#0f172a",
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
                          background: "#0f172a",
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
                          background: "#0f172a",
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
                                background: "#0f172a",
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
                background: "#64748b",
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
