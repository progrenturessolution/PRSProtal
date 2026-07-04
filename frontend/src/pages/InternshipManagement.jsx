import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { adminAPI, UPLOADS_BASE } from "../services/api";

function InternshipManagement({ onAddStudentClick }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, active, completed
  const [infoMessage, setInfoMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, openUpward: false });
  const [isEditing, setIsEditing] = useState(false);
  const [filterAddedBy, setFilterAddedBy] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isImSearchDropdownOpen, setIsImSearchDropdownOpen] = useState(false);
  const [imDropdownSearchText, setImDropdownSearchText] = useState("");
  const [showInactiveModal, setShowInactiveModal] = useState(false);
  const [inactiveModalStudent, setInactiveModalStudent] = useState(null);
  const [inactiveModalMessage, setInactiveModalMessage] = useState("");
  const [inactiveModalLoading, setInactiveModalLoading] = useState(false);
  const [inactiveModalError, setInactiveModalError] = useState("");
  const [showCertificateUpload, setShowCertificateUpload] = useState(false);
  const [certificateFile, setCertificateFile] = useState(null);
  const [certificateType, setCertificateType] = useState("offerLetter");
  const [certificateName, setCertificateName] = useState("");
  const [uploadingCert, setUploadingCert] = useState(false);
  const [certificateUploadStatus, setCertificateUploadStatus] = useState(null);
  const [editForm, setEditForm] = useState({
    internId: "",
    name: "",
    email: "",
    mobile: "",
    domain: "",
    duration: "",
    collegeName: "",
    branch: "",
    yearOfStudy: "",
    joiningDate: "",
    status: "",
  });

  const certificateTypeOptions = [
    { value: "offerLetter", label: "Offer Letter" },
    { value: "welcomeLetter", label: "Welcome Letter" },
    { value: "paymentReceipt", label: "Payment Receipt" },
    { value: "completionCertificate", label: "Completion Certificate" },
    { value: "experienceLetter", label: "Experience Letter" },
    { value: "other", label: "Other" },
  ];

  const directCertificateTypes = [
    "offerLetter",
    "welcomeLetter",
    "paymentReceipt",
    "completionCertificate",
    "experienceLetter",
  ];

  const handleCertificateUpload = async () => {
    if (!certificateFile) {
      alert("Please select a file to upload");
      return;
    }

    if (certificateType === "other" && !certificateName.trim()) {
      alert("Please enter certificate name for Other type");
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
            ? certificateType === "other"
              ? certificateName.trim()
              : selectedOption?.label || "Other Certificate"
            : selectedOption?.label || "Certificate",
        });
        setCertificateFile(null);
        setCertificateName("");
        setTimeout(() => setShowCertificateUpload(false), 1500);
      } else {
        setCertificateUploadStatus({ success: false });
      }
    } catch (err) {
      console.error("Upload error:", err);
      setCertificateUploadStatus({ success: false });
    } finally {
      setUploadingCert(false);
    }
  };

  useEffect(() => {
    fetchInternshipStudents();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest("[data-im-search-dropdown]")) {
        setIsImSearchDropdownOpen(false);
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

  const fetchInternshipStudents = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllInterns();
      console.log("All interns:", response.data.interns);
      if (response.data.success) {
        // Filter only Internship type students
        const internshipStudents = response.data.interns.filter(
          (intern) => intern.studentType === "Internship",
        );
        console.log("Internship students:", internshipStudents);
        setStudents(internshipStudents);
      }
    } catch (error) {
      console.error("Failed to fetch internship students:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredStudents = () => {
    let filtered = students;

    // Apply status filter
    if (filter === "active") {
      filtered = filtered.filter(
        (student) => student.status?.toLowerCase() === "active",
      );
    } else if (filter === "completed") {
      filtered = filtered.filter(
        (student) => student.status?.toLowerCase() === "completed",
      );
    }

    // Apply added by filter
    if (filterAddedBy === "Admin") {
      filtered = filtered.filter((student) => !student.addedByRepresentative);
    } else if (filterAddedBy === "Representative") {
      filtered = filtered.filter((student) => !!student.addedByRepresentative);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (student) =>
          student.name?.toLowerCase().includes(query) ||
          student.email?.toLowerCase().includes(query) ||
          student.internId?.toLowerCase().includes(query) ||
          student.mobile?.includes(query) ||
          student.domain?.toLowerCase().includes(query) ||
          student.collegeName?.toLowerCase().includes(query) ||
          student.branch?.toLowerCase().includes(query) ||
          student.yearOfStudy?.toLowerCase().includes(query) ||
          (student.addedByRepresentative?.name && student.addedByRepresentative.name.toLowerCase().includes(query)) ||
          (!student.addedByRepresentative && "admin".includes(query)),
      );
    }

    return filtered;
  };

  const handleDocumentUpload = async (e, studentId) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setErrorMessage("Only PDF files are allowed for offer letters.");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    const fd = new FormData();
    fd.append("file", file);
    fd.append("documentType", "offerLetter");

    try {
      const resp = await adminAPI.uploadStudentDocument(studentId, fd);
      if (resp.data && resp.data.success) {
        // Update local state for that student
        setStudents((prev) =>
          prev.map((s) => {
            if (s._id === studentId) {
              return {
                ...s,
                documents: {
                  ...(s.documents || {}),
                  offerLetter: resp.data.document,
                },
              };
            }
            return s;
          }),
        );
        // If modal is open for this student, update it too so the View Profile reflects the new document
        setSelectedStudent((prev) => {
          if (prev && prev._id === studentId) {
            return {
              ...prev,
              documents: {
                ...(prev.documents || {}),
                offerLetter: resp.data.document,
              },
            };
          }
          return prev;
        });
        setInfoMessage("Offer letter uploaded and synced.");
        setTimeout(() => setInfoMessage(""), 4000);
      } else {
        setErrorMessage("Upload failed.");
        setTimeout(() => setErrorMessage(""), 4000);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setErrorMessage("Upload failed.");
      setTimeout(() => setErrorMessage(""), 4000);
    }
  };

  const handleEditClick = () => {
    setEditForm({
      internId: selectedStudent.internId || "",
      name: selectedStudent.name || "",
      email: selectedStudent.email || "",
      mobile: selectedStudent.mobile || "",
      domain: selectedStudent.domain || "",
      duration: selectedStudent.duration || "",
      collegeName: selectedStudent.collegeName || "",
      branch: selectedStudent.branch || "",
      yearOfStudy: selectedStudent.yearOfStudy || "",
      joiningDate: selectedStudent.joiningDate
        ? selectedStudent.joiningDate.split("T")[0]
        : "",
      status: selectedStudent.status || "active",
    });
    setIsEditing(true);
  };

  const handleManageCertificates = (student) => {
    setSelectedStudent(student);
    setIsEditing(false);
    setShowCertificateUpload(true);
    setCertificateUploadStatus(null);
    setCertificateFile(null);
    setCertificateName("");
    setCertificateType("offerLetter");
    setOpenMenuId(null);
  };

  const handleStatusToggle = async (student) => {
    const current = (student.status || "").toLowerCase();
    const nextStatus = current === "active" ? "inactive" : "active";

    if (nextStatus === "inactive") {
      setInactiveModalStudent(student);
      setInactiveModalMessage("");
      setInactiveModalError("");
      setShowInactiveModal(true);
      return;
    }

    try {
      await adminAPI.updateInternStatus(student._id, nextStatus);
      const label = nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1);
      setStudents((prev) =>
        prev.map((s) =>
          s._id === student._id ? { ...s, status: label, inactiveMessage: "" } : s,
        ),
      );
      setSelectedStudent((prev) =>
        prev && prev._id === student._id ? { ...prev, status: label, inactiveMessage: "" } : prev,
      );
      setOpenMenuId(null);
      setInfoMessage("Student activated successfully");
      setTimeout(() => setInfoMessage(""), 4000);
    } catch (err) {
      console.error("Status update error:", err);
      alert("Failed to update status.");
    }
  };

  const handleMarkCompleted = async (student) => {
    const confirmed = window.confirm(`Mark ${student.name} as completed?`);
    if (!confirmed) return;

    try {
      await adminAPI.updateInternStatus(student._id, "completed");
      setStudents((prev) =>
        prev.map((s) =>
          s._id === student._id ? { ...s, status: "Completed" } : s,
        ),
      );
      setSelectedStudent((prev) =>
        prev && prev._id === student._id ? { ...prev, status: "Completed" } : prev,
      );
      setOpenMenuId(null);
    } catch (err) {
      console.error("Mark completed error:", err);
      alert("Failed to mark student as completed.");
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
      console.error("Delete student error:", err);
      alert("Failed to archive student.");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({
      internId: "",
      name: "",
      email: "",
      mobile: "",
      domain: "",
      duration: "",
      collegeName: "",
      branch: "",
      yearOfStudy: "",
      joiningDate: "",
      status: "",
    });
  };

  const handleUpdateStudent = async () => {
    try {
      const response = await adminAPI.updateIntern(
        selectedStudent._id,
        editForm,
      );
      if (response.data.success) {
        // Update local students array
        setStudents((prev) =>
          prev.map((s) =>
            s._id === selectedStudent._id ? { ...s, ...editForm } : s,
          ),
        );
        // Update selected student
        setSelectedStudent({ ...selectedStudent, ...editForm });
        setIsEditing(false);
        setInfoMessage("Student updated successfully!");
        setTimeout(() => setInfoMessage(""), 3000);
      }
    } catch (err) {
      console.error("Update error:", err);
      setErrorMessage("Failed to update student.");
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
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
          <h1>Internship Management</h1>
          <p>Manage all internship programs and students</p>
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
            <h3>Total Interns</h3>
            <p>{students.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h3>Active</h3>
            <p>
              {
                students.filter((s) => s.status?.toLowerCase() === "active")
                  .length
              }
            </p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h3>Completed</h3>
            <p>
              {
                students.filter((s) => s.status?.toLowerCase() === "completed")
                  .length
              }
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        {errorMessage && (
          <div
            style={{
              padding: "12px",
              marginBottom: "20px",
              backgroundColor: "#fee2e2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              color: "#dc2626",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            {errorMessage}
          </div>
        )}

        {infoMessage && (
          <div
            style={{
              padding: "12px",
              marginBottom: "20px",
              backgroundColor: "#ecfccb",
              border: "1px solid #bbf7d0",
              borderRadius: "8px",
              color: "#166534",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            {infoMessage}
          </div>
        )}



        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.5fr) minmax(180px, 1fr) minmax(180px, 1fr)",
            gap: "12px",
            marginBottom: "20px",
            alignItems: "end",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "13px",
                fontWeight: 600,
                color: "#0f172a",
              }}
            >
              Search Students
            </label>
            <div style={{ position: 'relative' }} data-im-search-dropdown>
              <div
                data-im-search-dropdown
                onClick={() => setIsImSearchDropdownOpen(!isImSearchDropdownOpen)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: `2px solid ${isImSearchDropdownOpen ? '#3b82f6' : '#cbd5e1'}`,
                  borderRadius: '10px',
                  background: 'white',
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
                <span style={{ fontSize: '11px', transition: 'transform 0.2s', transform: isImSearchDropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span>
              </div>
              {isImSearchDropdownOpen && (
                <div
                  data-im-search-dropdown
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
                      value={imDropdownSearchText}
                      onChange={(e) => { setImDropdownSearchText(e.target.value); setSearchQuery(e.target.value); }}
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
                      data-im-search-dropdown
                      onClick={() => { setSearchQuery(''); setImDropdownSearchText(''); setIsImSearchDropdownOpen(false); }}
                      style={{ padding: '10px 14px', fontSize: '13px', color: '#dc2626', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontWeight: 600 }}
                    >
                      ✕ Clear search
                    </div>
                  )}
                  <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                    {students
                      .filter(s =>
                        !imDropdownSearchText ||
                        s.name?.toLowerCase().includes(imDropdownSearchText.toLowerCase()) ||
                        s.internId?.toLowerCase().includes(imDropdownSearchText.toLowerCase()) ||
                        s.email?.toLowerCase().includes(imDropdownSearchText.toLowerCase())
                      )
                      .slice(0, 50)
                      .map((s) => {
                        const initials = (s.name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                        return (
                          <div
                            key={s._id}
                            data-im-search-dropdown
                            onClick={() => { setSearchQuery(s.name); setImDropdownSearchText(s.name); setIsImSearchDropdownOpen(false); }}
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
                      !imDropdownSearchText ||
                      s.name?.toLowerCase().includes(imDropdownSearchText.toLowerCase()) ||
                      s.internId?.toLowerCase().includes(imDropdownSearchText.toLowerCase()) ||
                      s.email?.toLowerCase().includes(imDropdownSearchText.toLowerCase())
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
                display: "block",
                marginBottom: "6px",
                fontSize: "13px",
                fontWeight: 600,
                color: "#0f172a",
              }}
            >
              Status Filter
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                border: "1px solid #cbd5e1",
                borderRadius: "10px",
                fontSize: "14px",
                background: "white",
                cursor: "pointer",
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
                display: "block",
                marginBottom: "6px",
                fontSize: "13px",
                fontWeight: 600,
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
                padding: "12px 14px",
                border: "1px solid #cbd5e1",
                borderRadius: "10px",
                fontSize: "14px",
                background: "white",
                cursor: "pointer",
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
          <p>No internship students found.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table internship-students-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Domain</th>
                  <th>Joining Date</th>
                  <th>Duration</th>
                  <th>Added By</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student._id}>
                    <td>{student.internId}</td>
                    <td>{student.name}</td>
                    <td>{student.domain || "N/A"}</td>
                    <td>
                      {student.joiningDate
                        ? new Date(student.joiningDate).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td>{student.duration || "N/A"}</td>
                    <td>
                      {student.addedByRepresentative
                        ? `Representative: ${student.addedByRepresentative.name}`
                        : "Admin"}
                    </td>
                    <td>
                      <span
                        className={`status-badge ${student.status?.toLowerCase() === "active"
                            ? "status-active"
                            : student.status?.toLowerCase() === "completed"
                              ? "status-completed"
                              : "status-inactive"
                          }`}
                      >
                        {student.status
                          ? student.status.charAt(0).toUpperCase() +
                          student.status.slice(1)
                          : "N/A"}
                      </span>
                    </td>
                    <td style={{ position: "relative" }}>
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
                                setSelectedStudent(student);
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
                              onClick={() => {
                                setSelectedStudent(student);
                                handleEditClick();
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
                                borderTop: "1px solid #f3f4f6"
                              }}
                              onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
                              onMouseLeave={(e) => e.target.style.background = 'white'}
                            >
                              Edit Details
                            </button>
                            <button
                              onClick={() => handleManageCertificates(student)}
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
                                borderTop: "1px solid #f3f4f6"
                              }}
                              onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
                              onMouseLeave={(e) => e.target.style.background = 'white'}
                            >
                              Certificates
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
                                borderTop: "1px solid #f3f4f6"
                              }}
                              onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
                              onMouseLeave={(e) => e.target.style.background = 'white'}
                            >
                              {student.status?.toLowerCase() === 'active' ? 'Mark Inactive' : 'Mark Active'}
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
                                borderTop: "1px solid #f3f4f6"
                              }}
                              onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
                              onMouseLeave={(e) => e.target.style.background = 'white'}
                            >
                              Mark Completed
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(student)}
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
                                borderTop: "1px solid #f3f4f6"
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

      {/* Student Details Modal */}
      {selectedStudent && (
        <div
          className="profile-modal-overlay"
          onClick={() => {
            setSelectedStudent(null);
            setIsEditing(false);
          }}
        >
          <div className="profile-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="profile-header" style={{ background: "#344158" }}>
              <button
                className="profile-close-btn"
                onClick={() => {
                  setSelectedStudent(null);
                  setIsEditing(false);
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
              <h2 className="profile-name">{selectedStudent.name}</h2>
              <div className="profile-badges">
                <span className="profile-badge">PIID: {selectedStudent.internId || "-"}</span>
                <span className="profile-badge">{selectedStudent.studentType || "Internship"}</span>
                <span
                  className={`profile-badge ${selectedStudent.status?.toLowerCase() === "active" ? "status-active" : "status-inactive"}`}
                >
                  {selectedStudent.status || "Active"}
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
                    <div className="profile-field"><label>Name</label><div className="field-value">{selectedStudent.name || "-"}</div></div>
                    <div className="profile-field"><label>Email</label><div className="field-value">{selectedStudent.email || "-"}</div></div>
                    <div className="profile-field"><label>PIID</label><div className="field-value">{selectedStudent.internId || "-"}</div></div>
                    <div className="profile-field"><label>Mobile</label><div className="field-value">{selectedStudent.mobile || "-"}</div></div>
                    <div className="profile-field"><label>Added By</label><div className="field-value">{selectedStudent.addedByRepresentative?.name || "Admin"}</div></div>
                    <div className="profile-field"><label>Registered On</label><div className="field-value">{selectedStudent.createdAt ? new Date(selectedStudent.createdAt).toLocaleDateString("en-IN") : "-"}</div></div>
                  </div>
                ) : (
                  <div className="profile-info-grid">
                    <div className="profile-field"><label>PIID</label><input type="text" name="internId" value={editForm.internId} onChange={handleInputChange} /></div>
                    <div className="profile-field"><label>Name</label><input type="text" name="name" value={editForm.name} onChange={handleInputChange} /></div>
                    <div className="profile-field"><label>Email</label><input type="email" name="email" value={editForm.email} onChange={handleInputChange} /></div>
                    <div className="profile-field"><label>Mobile</label><input type="tel" name="mobile" value={editForm.mobile} onChange={handleInputChange} /></div>
                  </div>
                )}
              </div>

              <div className="profile-section">
                <h3 className="profile-section-title">
                  <span className="profile-section-bar" />
                  Internship Details
                </h3>
                {!isEditing ? (
                  <div className="profile-info-grid">
                    <div className="profile-field"><label>Domain</label><div className="field-value">{selectedStudent.domain || "Not specified"}</div></div>
                    <div className="profile-field"><label>Duration</label><div className="field-value">{selectedStudent.duration || "Not specified"}</div></div>
                    <div className="profile-field"><label>College Name</label><div className="field-value">{selectedStudent.collegeName || "Not specified"}</div></div>
                    <div className="profile-field"><label>Branch</label><div className="field-value">{selectedStudent.branch || "Not specified"}</div></div>
                    <div className="profile-field"><label>Year of Study</label><div className="field-value">{selectedStudent.yearOfStudy || "Not specified"}</div></div>
                    <div className="profile-field"><label>Joining Date</label><div className="field-value">{selectedStudent.joiningDate ? new Date(selectedStudent.joiningDate).toLocaleDateString("en-IN") : "Not specified"}</div></div>
                    <div className="profile-field"><label>Status</label><div className="field-value">{selectedStudent.status || "Active"}</div></div>
                  </div>
                ) : (
                  <div className="profile-info-grid">
                    <div className="profile-field"><label>Domain</label><input type="text" name="domain" value={editForm.domain} onChange={handleInputChange} /></div>
                    <div className="profile-field"><label>Duration</label><input type="text" name="duration" value={editForm.duration} onChange={handleInputChange} /></div>
                    <div className="profile-field"><label>College Name</label><input type="text" name="collegeName" value={editForm.collegeName} onChange={handleInputChange} /></div>
                    <div className="profile-field"><label>Branch</label><input type="text" name="branch" value={editForm.branch} onChange={handleInputChange} /></div>
                    <div className="profile-field"><label>Year of Study</label><input type="text" name="yearOfStudy" value={editForm.yearOfStudy} onChange={handleInputChange} /></div>
                    <div className="profile-field"><label>Joining Date</label><input type="date" name="joiningDate" value={editForm.joiningDate} onChange={handleInputChange} /></div>
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

              <div className="profile-actions">
                {!isEditing ? (
                  <>
                    <button
                      onClick={handleEditClick}
                      className="profile-btn profile-btn-primary"
                      style={{ background: "#324158", borderColor: "#324158" }}
                    >
                      Edit Profile
                    </button>
                    <button
                      onClick={() => setShowCertificateUpload(!showCertificateUpload)}
                      className="profile-btn profile-btn-secondary"
                      style={{ background: '#324158', color: 'white', border: 'none', boxShadow: '0 4px 12px rgba(50, 65, 88, 0.2)' }}
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
            <div className="profile-header" style={{ background: "#344158" }}>
              <button
                className="profile-close-btn"
                onClick={() => {
                  if (!inactiveModalLoading) setShowInactiveModal(false);
                }}
              >
                ×
              </button>
              <div className="profile-avatar">{(inactiveModalStudent.name || "S").charAt(0).toUpperCase()}</div>
              <h2 className="profile-name">Mark Inactive</h2>
              <div className="profile-badges">
                <span className="profile-badge">PIID: {inactiveModalStudent.internId || "-"}</span>
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
                  style={{ width: "100%", minHeight: 100, padding: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
                  maxLength={300}
                />
                {inactiveModalError && <div style={{ color: "#dc2626", marginTop: 8 }}>{inactiveModalError}</div>}
              </div>

              <div className="profile-actions" style={{ marginTop: 12 }}>
                <button
                  className="profile-btn profile-btn-primary"
                  style={{ background: "#324158", color: "white", border: "none", boxShadow: "0 4px 12px rgba(50, 65, 88, 0.2)" }}
                  onClick={async () => {
                    if (inactiveModalLoading) return;
                    const msg = String(inactiveModalMessage || "").trim();
                    if (!msg) {
                      setInactiveModalError("Please enter a short message to show to the student");
                      return;
                    }
                    try {
                      setInactiveModalLoading(true);
                      await adminAPI.updateInternStatus(inactiveModalStudent._id, "inactive", msg);
                      setStudents((prev) =>
                        prev.map((s) =>
                          s._id === inactiveModalStudent._id
                            ? { ...s, status: "Inactive", inactiveMessage: msg }
                            : s,
                        ),
                      );
                      setSelectedStudent((prev) =>
                        prev && prev._id === inactiveModalStudent._id
                          ? { ...prev, status: "Inactive", inactiveMessage: msg }
                          : prev,
                      );
                      setShowInactiveModal(false);
                      setOpenMenuId(null);
                      setInfoMessage(`"${inactiveModalStudent.name}" marked as inactive`);
                      setTimeout(() => setInfoMessage(""), 4000);
                    } catch (err) {
                      console.error("Failed to mark inactive:", err);
                      setInactiveModalError(err.response?.data?.message || "Failed to mark inactive");
                    } finally {
                      setInactiveModalLoading(false);
                    }
                  }}
                >
                  {inactiveModalLoading ? "Saving..." : "Save & Mark Inactive"}
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

export default InternshipManagement;
