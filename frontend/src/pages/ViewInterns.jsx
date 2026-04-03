import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { adminAPI, UPLOADS_BASE } from "../services/api";

function ViewInterns({ onInternDeleted }) {
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
  const [certificateFile, setCertificateFile] = useState(null);
  const [certificateType, setCertificateType] = useState("offerLetter");
  const [certificateName, setCertificateName] = useState("");
  const [uploadingCert, setUploadingCert] = useState(false);

  useEffect(() => {
    fetchInterns();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [interns, searchQuery, filterType, filterStatus]);

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
          intern.mobile?.includes(searchQuery),
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
      name: student.name || "",
      email: student.email || "",
      mobile: student.mobile || "",
      studentType: student.studentType || "",
      currentDesignation: student.currentDesignation || "",
      domain: student.domain || "",
      duration: student.duration || "",
      joiningDate: student.joiningDate
        ? new Date(student.joiningDate).toISOString().slice(0, 10)
        : "",
      endingDate: student.endingDate
        ? new Date(student.endingDate).toISOString().slice(0, 10)
        : "",
      paymentDoneBy: student.paymentDoneBy || "",
      transactionId: student.transactionId || "",
      dateOfPayment: student.dateOfPayment
        ? new Date(student.dateOfPayment).toISOString().slice(0, 10)
        : "",
      paymentAmount: student.paymentAmount || "",
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
    setOpenMenuId(null);
  };

  const handleCertificateUpload = async () => {
    if (!certificateFile) {
      setError("Please select a file to upload");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (certificateType === "other" && !certificateName.trim()) {
      setError("Please provide a name for the certificate");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (certificateFile.type !== "application/pdf") {
      setError("Only PDF files are allowed");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setUploadingCert(true);
    try {
      const formData = new FormData();
      formData.append("file", certificateFile);
      formData.append("documentType", certificateType);
      if (certificateType === "other") {
        formData.append("certificateName", certificateName);
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

              if (certificateType === "other") {
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

          if (certificateType === "other") {
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
        setCertificateFile(null);
        setCertificateName("");
      } else {
        setError("Failed to upload certificate");
        setTimeout(() => setError(""), 4000);
      }
    } catch (err) {
      console.error("Certificate upload error:", err);
      setError(err.response?.data?.message || "Failed to upload certificate");
      setTimeout(() => setError(""), 4000);
    } finally {
      setUploadingCert(false);
    }
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
      <div className="content-header">
        <div>
          <h1>All Students</h1>
          <p>
            Manage and view all registered students - {filteredInterns.length}{" "}
            of {interns.length} students
          </p>
        </div>
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
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            alignItems: "end",
          }}
        >
          {/* Search */}
          <div style={{ gridColumn: "span 2" }}>
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
              placeholder="Search by name, email, ID, or mobile..."
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
        </div>
      </div>

      {/* Students Table */}
      <div className="card">
        {filteredInterns.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "#64748b",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}></div>
            <h3 style={{ color: "#0f172a", marginBottom: "8px" }}>
              No Students Found
            </h3>
            <p>Try adjusting your filters or search query</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Mobile</th>
                  <th>Type</th>
                  <th>Added By</th>
                  <th>Domain / Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInterns.map((student, index) => (
                  <tr key={student._id}>
                    <td style={{ color: "#94a3b8", fontSize: "13px" }}>
                      {index + 1}
                    </td>
                    <td>
                      <span
                        style={{
                          padding: "3px 10px",
                          background:
                            student.studentType === "Internship"
                              ? "#eff6ff"
                              : "#f0fdf4",
                          color:
                            student.studentType === "Internship"
                              ? "#1e40af"
                              : "#15803d",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "700",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {student.internId}
                      </span>
                    </td>
                    <td style={{ fontWeight: "600", color: "#0f172a" }}>
                      {student.name}
                    </td>
                    <td style={{ color: "#475569", fontSize: "13px" }}>
                      {student.email}
                    </td>
                    <td style={{ color: "#475569", fontSize: "13px" }}>
                      {student.mobile || "—"}
                    </td>
                    <td>
                      <span
                        style={{
                          padding: "3px 10px",
                          background:
                            student.studentType === "Internship"
                              ? "#eff6ff"
                              : "#fdf4ff",
                          color:
                            student.studentType === "Internship"
                              ? "#2563eb"
                              : "#7c3aed",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "600",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {student.studentType || "—"}
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
                    <td style={{ color: "#475569", fontSize: "13px" }}>
                      {student.domain || student.currentDesignation || "—"}
                    </td>
                    <td>
                      <span
                        className={`status-badge ${
                          (student.status || "").toLowerCase() === "active"
                            ? "status-active"
                            : (student.status || "").toLowerCase() ===
                                "completed"
                              ? "status-completed"
                              : "status-inactive"
                        }`}
                      >
                        {student.status
                          ? student.status.charAt(0).toUpperCase() +
                            student.status.slice(1)
                          : "Active"}
                      </span>
                    </td>
                    <td style={{ position: "relative" }}>
                      <button
                        data-menu-toggle
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMenu(student._id);
                        }}
                        style={{
                          background: "#f8fafc",
                          border: "none",
                          borderRadius: "8px",
                          width: "36px",
                          height: "36px",
                          cursor: "pointer",
                          fontSize: "20px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#e2e8f0")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "#f8fafc")
                        }
                      >
                        ⋮
                      </button>

                      {openMenuId === student._id && (
                        <div
                          data-menu
                          style={{
                            position: "absolute",
                            right: "40px",
                            top: "0",
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
                            onClick={() => handleViewProfile(student)}
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
                              transition: "background 0.2s",
                            }}
                            onMouseEnter={(e) =>
                              (e.target.style.background = "#f9fafb")
                            }
                            onMouseLeave={(e) =>
                              (e.target.style.background = "white")
                            }
                          >
                            View Profile
                          </button>

                          <button
                            onClick={() => handleEdit(student)}
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
                              transition: "background 0.2s",
                              borderTop: "1px solid #f3f4f6",
                            }}
                            onMouseEnter={(e) =>
                              (e.target.style.background = "#f9fafb")
                            }
                            onMouseLeave={(e) =>
                              (e.target.style.background = "white")
                            }
                          >
                            Edit Details
                          </button>

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
                              transition: "background 0.2s",
                              borderTop: "1px solid #f3f4f6",
                            }}
                            onMouseEnter={(e) =>
                              (e.target.style.background = "#f9fafb")
                            }
                            onMouseLeave={(e) =>
                              (e.target.style.background = "white")
                            }
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
                                (student.status || "").toLowerCase() ===
                                "active"
                                  ? "#dc2626"
                                  : "#059669",
                              transition: "background 0.2s",
                              borderTop: "1px solid #f3f4f6",
                            }}
                            onMouseEnter={(e) =>
                              (e.target.style.background = "#f9fafb")
                            }
                            onMouseLeave={(e) =>
                              (e.target.style.background = "white")
                            }
                          >
                            {(student.status || "").toLowerCase() === "active"
                              ? "Mark Inactive"
                              : "Mark Active"}
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(student._id, student.name)
                            }
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
                              transition: "background 0.2s",
                              borderTop: "1px solid #f3f4f6",
                            }}
                            onMouseEnter={(e) =>
                              (e.target.style.background = "#fef2f2")
                            }
                            onMouseLeave={(e) =>
                              (e.target.style.background = "white")
                            }
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

      {/* View Profile Modal - Enhanced */}
      {showProfileModal &&
        selectedStudent &&
        createPortal(
          <div className="profile-modal-overlay">
            <div className="profile-modal-container">
              <div className="profile-header">
                <button
                  className="profile-close-btn"
                  onClick={() => setShowProfileModal(false)}
                  aria-label="Close"
                >
                  ×
                </button>

                <div>
                  <div className="profile-avatar">
                    {selectedStudent.name.charAt(0).toUpperCase()}
                  </div>
                  <h2 className="profile-name">{selectedStudent.name}</h2>
                  <div className="profile-badges">
                    <span className="profile-badge">
                      {selectedStudent.internId}
                    </span>
                    <span
                      className={`profile-badge ${
                        (selectedStudent.status || "").toLowerCase() ===
                        "active"
                          ? "status-active"
                          : "status-inactive"
                      }`}
                    >
                      {selectedStudent.status || "Active"}
                    </span>
                    <span className="profile-badge">
                      {selectedStudent.studentType}
                    </span>
                  </div>
                </div>
              </div>

              {/* Content Body */}
              <div className="profile-body">
                {/* Contact Information */}
                <div className="profile-section">
                  <h3 className="profile-section-title">
                    <span className="profile-section-bar"></span>
                    Contact Information
                  </h3>
                  <div className="profile-info-grid">
                    <div className="profile-info-card">
                      <div className="profile-info-label">Email Address</div>
                      <div className="profile-info-value">
                        {selectedStudent.email}
                      </div>
                    </div>
                    <div className="profile-info-card">
                      <div className="profile-info-label">Mobile Number</div>
                      <div className="profile-info-value">
                        {selectedStudent.mobile || "Not provided"}
                      </div>
                    </div>
                    <div className="profile-info-card">
                      <div className="profile-info-label">Student ID</div>
                      <div className="profile-info-value">
                        {selectedStudent.internId}
                      </div>
                    </div>
                    <div className="profile-info-card">
                      <div className="profile-info-label">Registered On</div>
                      <div className="profile-info-value">
                        {selectedStudent.createdAt
                          ? new Date(
                              selectedStudent.createdAt,
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "—"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Assigned Trainer */}
                {selectedStudent.assignedTrainer && (
                  <div className="profile-section">
                    <h3 className="profile-section-title">
                      <span className="profile-section-bar"></span>
                      Assigned Trainer
                    </h3>
                    <div className="profile-info-grid">
                      <div className="profile-info-card">
                        <div className="profile-info-label">Trainer Name</div>
                        <div
                          className="profile-info-value"
                          style={{ color: "#059669", fontWeight: "700" }}
                        >
                          {selectedStudent.assignedTrainer.name ||
                            selectedStudent.assignedTrainer}
                        </div>
                      </div>
                      {selectedStudent.assignedTrainer.email && (
                        <div className="profile-info-card">
                          <div className="profile-info-label">
                            Trainer Email
                          </div>
                          <div className="profile-info-value">
                            {selectedStudent.assignedTrainer.email}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Internship Details */}
                {selectedStudent.studentType === "Internship" && (
                  <div className="profile-section">
                    <h3 className="profile-section-title">
                      <span className="profile-section-bar"></span>
                      Internship Details
                    </h3>
                    <div className="profile-details-grid">
                      <div className="profile-detail-card type-domain">
                        <div className="profile-detail-label color-indigo">
                          Domain
                        </div>
                        <div className="profile-detail-value">
                          {selectedStudent.domain || "Not specified"}
                        </div>
                      </div>
                      <div className="profile-detail-card type-domain">
                        <div className="profile-detail-label color-indigo">
                          Duration
                        </div>
                        <div className="profile-detail-value">
                          {selectedStudent.duration || "Not specified"}
                        </div>
                      </div>
                      <div className="profile-detail-card type-success">
                        <div className="profile-detail-label color-success">
                          Joining Date
                        </div>
                        <div className="profile-detail-value">
                          {selectedStudent.joiningDate
                            ? new Date(
                                selectedStudent.joiningDate,
                              ).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "Not set"}
                        </div>
                      </div>
                      <div className="profile-detail-card type-warning">
                        <div className="profile-detail-label color-warning">
                          Ending Date
                        </div>
                        <div className="profile-detail-value">
                          {selectedStudent.endingDate
                            ? new Date(
                                selectedStudent.endingDate,
                              ).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "Not set"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SMS Program Details */}
                {selectedStudent.studentType === "SMS Program" && (
                  <div className="profile-section">
                    <h3 className="profile-section-title">
                      <span className="profile-section-bar"></span>
                      SMS Program Details
                    </h3>
                    <div className="profile-details-grid">
                      <div className="profile-detail-card type-pink">
                        <div className="profile-detail-label color-pink">
                          Gender
                        </div>
                        <div className="profile-detail-value">
                          {selectedStudent.gender || "Not specified"}
                        </div>
                      </div>
                      <div className="profile-detail-card type-pink">
                        <div className="profile-detail-label color-pink">
                          Current Designation
                        </div>
                        <div className="profile-detail-value">
                          {selectedStudent.currentDesignation ||
                            "Not specified"}
                        </div>
                      </div>
                      <div className="profile-detail-card type-domain">
                        <div className="profile-detail-label color-indigo">
                          Payment Done By
                        </div>
                        <div className="profile-detail-value">
                          {selectedStudent.paymentDoneBy || "Not specified"}
                        </div>
                      </div>
                      <div className="profile-detail-card type-domain">
                        <div className="profile-detail-label color-indigo">
                          Transaction ID
                        </div>
                        <div
                          className="profile-detail-value"
                          style={{ fontFamily: "monospace", fontSize: "13px" }}
                        >
                          {selectedStudent.transactionId || "Not provided"}
                        </div>
                      </div>
                      <div className="profile-detail-card type-success">
                        <div className="profile-detail-label color-success">
                          Payment Amount
                        </div>
                        <div className="profile-detail-value">
                          ₹{selectedStudent.paymentAmount || 0}
                        </div>
                      </div>
                      <div className="profile-detail-card type-success">
                        <div className="profile-detail-label color-success">
                          Completed Fees
                        </div>
                        <div className="profile-detail-value">
                          ₹{selectedStudent.completedFees || 0}
                        </div>
                      </div>
                      <div className="profile-detail-card type-warning">
                        <div className="profile-detail-label color-warning">
                          Pending Fees
                        </div>
                        <div className="profile-detail-value">
                          ₹{selectedStudent.pendingFees || 0}
                        </div>
                      </div>
                      {selectedStudent.dateOfPayment && (
                        <div className="profile-detail-card type-success">
                          <div className="profile-detail-label color-success">
                            Date of Payment
                          </div>
                          <div className="profile-detail-value">
                            {new Date(
                              selectedStudent.dateOfPayment,
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                        </div>
                      )}
                      {selectedStudent.lastPaymentDate && (
                        <div className="profile-detail-card type-warning">
                          <div className="profile-detail-label color-warning">
                            Last Payment Date
                          </div>
                          <div className="profile-detail-value">
                            {new Date(
                              selectedStudent.lastPaymentDate,
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                        </div>
                      )}
                      {selectedStudent.joiningDate && (
                        <div className="profile-detail-card type-warning">
                          <div className="profile-detail-label color-warning">
                            Joining Date
                          </div>
                          <div className="profile-detail-value">
                            {new Date(
                              selectedStudent.joiningDate,
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

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
              padding: "20px",
              maxWidth: "600px",
              width: "95%",
            }}
          >
            <h2 style={{ marginTop: 0 }}>Edit Student</h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    marginBottom: "6px",
                  }}
                >
                  Full Name
                </label>
                <input
                  value={editForm.name}
                  onChange={(e) => handleEditChange("name", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "6px",
                    border: "1px solid #e5e7eb",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    marginBottom: "6px",
                  }}
                >
                  Email
                </label>
                <input
                  value={editForm.email}
                  onChange={(e) => handleEditChange("email", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "6px",
                    border: "1px solid #e5e7eb",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    marginBottom: "6px",
                  }}
                >
                  Mobile
                </label>
                <input
                  value={editForm.mobile}
                  onChange={(e) => handleEditChange("mobile", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "6px",
                    border: "1px solid #e5e7eb",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    marginBottom: "6px",
                  }}
                >
                  Current Designation
                </label>
                <input
                  value={editForm.currentDesignation}
                  onChange={(e) =>
                    handleEditChange("currentDesignation", e.target.value)
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "6px",
                    border: "1px solid #e5e7eb",
                  }}
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    marginBottom: "6px",
                  }}
                >
                  Student Type
                </label>
                <input
                  value={editForm.studentType}
                  disabled
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "6px",
                    border: "1px solid #e5e7eb",
                    background: "#f8fafc",
                  }}
                />
              </div>

              {editForm.studentType === "Internship" && (
                <>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        marginBottom: "6px",
                      }}
                    >
                      Domain
                    </label>
                    <input
                      value={editForm.domain}
                      onChange={(e) =>
                        handleEditChange("domain", e.target.value)
                      }
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "6px",
                        border: "1px solid #e5e7eb",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        marginBottom: "6px",
                      }}
                    >
                      Duration
                    </label>
                    <input
                      value={editForm.duration}
                      onChange={(e) =>
                        handleEditChange("duration", e.target.value)
                      }
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "6px",
                        border: "1px solid #e5e7eb",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        marginBottom: "6px",
                      }}
                    >
                      Joining Date
                    </label>
                    <input
                      type="date"
                      value={editForm.joiningDate}
                      onChange={(e) =>
                        handleEditChange("joiningDate", e.target.value)
                      }
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "6px",
                        border: "1px solid #e5e7eb",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        marginBottom: "6px",
                      }}
                    >
                      Ending Date
                    </label>
                    <input
                      type="date"
                      value={editForm.endingDate}
                      onChange={(e) =>
                        handleEditChange("endingDate", e.target.value)
                      }
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "6px",
                        border: "1px solid #e5e7eb",
                      }}
                    />
                  </div>
                </>
              )}

              {editForm.studentType === "SMS Program" && (
                <>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        marginBottom: "6px",
                      }}
                    >
                      Payment Done By
                    </label>
                    <input
                      value={editForm.paymentDoneBy}
                      onChange={(e) =>
                        handleEditChange("paymentDoneBy", e.target.value)
                      }
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "6px",
                        border: "1px solid #e5e7eb",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        marginBottom: "6px",
                      }}
                    >
                      Transaction ID
                    </label>
                    <input
                      value={editForm.transactionId}
                      onChange={(e) =>
                        handleEditChange("transactionId", e.target.value)
                      }
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "6px",
                        border: "1px solid #e5e7eb",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        marginBottom: "6px",
                      }}
                    >
                      Date of Payment
                    </label>
                    <input
                      type="date"
                      value={editForm.dateOfPayment}
                      onChange={(e) =>
                        handleEditChange("dateOfPayment", e.target.value)
                      }
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "6px",
                        border: "1px solid #e5e7eb",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        marginBottom: "6px",
                      }}
                    >
                      Payment Amount
                    </label>
                    <input
                      value={editForm.paymentAmount}
                      onChange={(e) =>
                        handleEditChange("paymentAmount", e.target.value)
                      }
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "6px",
                        border: "1px solid #e5e7eb",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        marginBottom: "6px",
                      }}
                    >
                      Completed Fees
                    </label>
                    <input
                      value={editForm.completedFees}
                      onChange={(e) =>
                        handleEditChange("completedFees", e.target.value)
                      }
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "6px",
                        border: "1px solid #e5e7eb",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        marginBottom: "6px",
                      }}
                    >
                      Pending Fees
                    </label>
                    <input
                      value={editForm.pendingFees}
                      onChange={(e) =>
                        handleEditChange("pendingFees", e.target.value)
                      }
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "6px",
                        border: "1px solid #e5e7eb",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        marginBottom: "6px",
                      }}
                    >
                      Last Payment Date
                    </label>
                    <input
                      type="date"
                      value={editForm.lastPaymentDate}
                      onChange={(e) =>
                        handleEditChange("lastPaymentDate", e.target.value)
                      }
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "6px",
                        border: "1px solid #e5e7eb",
                      }}
                    />
                  </div>
                </>
              )}
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "18px" }}>
              <button
                onClick={handleSaveEdit}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  background: "#0f172a",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Save
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Cancel
              </button>
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
                  <option value="offerLetter">Offer Letter</option>
                  <option value="welcomeLetter">Welcome Letter</option>
                  <option value="paymentReceipt">Payment Receipt</option>
                  <option value="completionCertificate">
                    Completion Certificate
                  </option>
                  <option value="experienceLetter">Experience Letter</option>
                  <option value="other">Other Certificate</option>
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
                {uploadingCert ? "Uploading..." : "Upload Certificate"}
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

                {/* Welcome Letter */}
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
                      Welcome Letter
                    </div>
                    {selectedStudent.documents?.welcomeLetter && (
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#64748b",
                          marginTop: "4px",
                        }}
                      >
                        Uploaded:{" "}
                        {new Date(
                          selectedStudent.documents.welcomeLetter.uploadedAt ||
                            Date.now(),
                        ).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div>
                    {selectedStudent.documents?.welcomeLetter ? (
                      <a
                        href={`${UPLOADS_BASE}/uploads/students/${selectedStudent.documents.welcomeLetter.filename}`}
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
                    {selectedStudent.documents?.completionCertificate && (
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#64748b",
                          marginTop: "4px",
                        }}
                      >
                        Uploaded:{" "}
                        {new Date(
                          selectedStudent.documents.completionCertificate
                            .uploadedAt || Date.now(),
                        ).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div>
                    {selectedStudent.documents?.completionCertificate ? (
                      <a
                        href={`${UPLOADS_BASE}/uploads/students/${selectedStudent.documents.completionCertificate.filename}`}
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
