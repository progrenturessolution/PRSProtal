import { useState, useEffect } from "react";
import { adminAPI, UPLOADS_BASE } from "../services/api";

function InternshipManagement() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, active, completed
  const [infoMessage, setInfoMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    mobile: "",
    domain: "",
    duration: "",
    joiningDate: "",
    status: "",
  });

  useEffect(() => {
    fetchInternshipStudents();
  }, []);

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

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (student) =>
          student.name?.toLowerCase().includes(query) ||
          student.email?.toLowerCase().includes(query) ||
          student.internId?.toLowerCase().includes(query) ||
          student.mobile?.includes(query) ||
          student.domain?.toLowerCase().includes(query),
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
        // If modal is open for this student, update it too so the View Details reflects the new document
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
      name: selectedStudent.name || "",
      email: selectedStudent.email || "",
      mobile: selectedStudent.mobile || "",
      domain: selectedStudent.domain || "",
      duration: selectedStudent.duration || "",
      joiningDate: selectedStudent.joiningDate
        ? selectedStudent.joiningDate.split("T")[0]
        : "",
      status: selectedStudent.status || "active",
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({
      name: "",
      email: "",
      mobile: "",
      domain: "",
      duration: "",
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
      <div className="content-header">
        <h1>Internship Management</h1>
        <p>Manage all internship programs and students</p>
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

        {/* Search Bar */}
        <div style={{ marginBottom: "20px" }}>
          <input
            type="text"
            placeholder="Search by name, email, ID, mobile, or domain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px",
              fontSize: "14px",
              border: "2px solid #e2e8f0",
              borderRadius: "10px",
              outline: "none",
              transition: "all 0.3s ease",
              background: "#f8fafc",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#3b82f6";
              e.target.style.background = "white";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#e2e8f0";
              e.target.style.background = "#f8fafc";
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          {/** Helper inline styles for clearer active/inactive states */}
          <button
            onClick={() => setFilter("all")}
            style={{
              padding: "10px 18px",
              borderRadius: "10px",
              cursor: "pointer",
              border: "none",
              fontWeight: 700,
              fontSize: "14px",
              background: filter === "all" ? "#324158" : "#f8fafc",
              color: filter === "all" ? "white" : "#324158",
              boxShadow:
                filter === "all" ? "0 8px 20px rgba(15, 23, 42, 0.3)" : "none",
            }}
          >
            All ({students.length})
          </button>

          <button
            onClick={() => setFilter("active")}
            style={{
              padding: "10px 18px",
              borderRadius: "10px",
              cursor: "pointer",
              border: "none",
              fontWeight: 700,
              fontSize: "14px",
              background: filter === "active" ? "#324158" : "#f8fafc",
              color: filter === "active" ? "white" : "#324158",
              boxShadow:
                filter === "active"
                  ? "0 8px 20px rgba(15, 23, 42, 0.3)"
                  : "none",
            }}
          >
            Active (
            {
              students.filter((s) => s.status?.toLowerCase() === "active")
                .length
            }
            )
          </button>

          <button
            onClick={() => setFilter("completed")}
            style={{
              padding: "10px 18px",
              borderRadius: "10px",
              cursor: "pointer",
              border: "none",
              fontWeight: 700,
              fontSize: "14px",
              background: filter === "completed" ? "#324158" : "#f8fafc",
              color: filter === "completed" ? "white" : "#324158",
              boxShadow:
                filter === "completed"
                  ? "0 8px 20px rgba(15, 23, 42, 0.3)"
                  : "none",
            }}
          >
            Completed (
            {
              students.filter((s) => s.status?.toLowerCase() === "completed")
                .length
            }
            )
          </button>
        </div>

        {/* Students Table */}
        {loading ? (
          <p>Loading...</p>
        ) : filteredStudents.length === 0 ? (
          <p>No internship students found.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Domain</th>
                  <th>Joining Date</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Added By</th>
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
                      <span
                        className={`status-badge ${
                          student.status?.toLowerCase() === "active"
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
                    <td style={{ position: "relative" }}>
                      <button
                        onClick={() =>
                          setOpenMenuId(
                            openMenuId === student._id ? null : student._id,
                          )
                        }
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
                          style={{
                            position: "absolute",
                            right: "40px",
                            top: "0",
                            background: "white",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                            zIndex: 1000,
                            minWidth: "160px",
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
                              padding: "10px 14px",
                              background: "white",
                              border: "none",
                              textAlign: "left",
                              cursor: "pointer",
                              fontSize: "14px",
                              fontWeight: "500",
                              color: "#132a5d",
                              transition: "background 0.2s",
                            }}
                            onMouseEnter={(e) =>
                              (e.target.style.background = "#f9fafb")
                            }
                            onMouseLeave={(e) =>
                              (e.target.style.background = "white")
                            }
                          >
                            View Details
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

      {/* Student Details Modal */}
      {selectedStudent && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
          }}
          onClick={() => setSelectedStudent(null)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              minWidth: "400px",
              maxWidth: "650px",
              width: "90%",
              maxHeight: "85vh",
              overflow: "hidden",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Gradient */}
            <div
              style={{
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                padding: "24px",
                color: "white",
                position: "relative",
              }}
            >
              <button
                onClick={() => setSelectedStudent(null)}
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  border: "none",
                  background: "rgba(255,255,255,0.2)",
                  color: "white",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  fontSize: "18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.target.style.background = "rgba(255,255,255,0.3)")
                }
                onMouseLeave={(e) =>
                  (e.target.style.background = "rgba(255,255,255,0.2)")
                }
              >
                ✕
              </button>
              <h2
                style={{
                  margin: "0 0 8px 0",
                  fontSize: "24px",
                  fontWeight: "600",
                }}
              >
                {selectedStudent.name}
              </h2>
              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  fontSize: "14px",
                  opacity: 0.95,
                }}
              >
                <span>ID: {selectedStudent.internId}</span>
                <span>•</span>
                <span>Type: {selectedStudent.studentType}</span>
              </div>
            </div>

            {/* Content */}
            <div
              style={{
                padding: "24px",
                maxHeight: "calc(85vh - 120px)",
                overflowY: "auto",
              }}
            >
              {/* Contact Information */}
              <div style={{ marginBottom: "24px" }}>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#1f2937",
                    marginBottom: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  Contact Information
                </h3>
                <div
                  style={{
                    background: "#f9fafb",
                    padding: "16px",
                    borderRadius: "8px",
                    display: "grid",
                    gap: "10px",
                  }}
                >
                  {!isEditing ? (
                    <>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span style={{ color: "#6b7280", fontSize: "14px" }}>
                          Name
                        </span>
                        <span
                          style={{
                            fontWeight: "500",
                            fontSize: "14px",
                            color: "#111827",
                          }}
                        >
                          {selectedStudent.name}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span style={{ color: "#6b7280", fontSize: "14px" }}>
                          Email
                        </span>
                        <span
                          style={{
                            fontWeight: "500",
                            fontSize: "14px",
                            color: "#111827",
                          }}
                        >
                          {selectedStudent.email}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span style={{ color: "#6b7280", fontSize: "14px" }}>
                          Mobile
                        </span>
                        <span
                          style={{
                            fontWeight: "500",
                            fontSize: "14px",
                            color: "#111827",
                          }}
                        >
                          {selectedStudent.mobile}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label
                          style={{
                            display: "block",
                            color: "#6b7280",
                            fontSize: "13px",
                            marginBottom: "4px",
                          }}
                        >
                          Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={editForm.name}
                          onChange={handleInputChange}
                          style={{
                            width: "100%",
                            padding: "8px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            fontSize: "14px",
                          }}
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            display: "block",
                            color: "#6b7280",
                            fontSize: "13px",
                            marginBottom: "4px",
                          }}
                        >
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={editForm.email}
                          onChange={handleInputChange}
                          style={{
                            width: "100%",
                            padding: "8px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            fontSize: "14px",
                          }}
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            display: "block",
                            color: "#6b7280",
                            fontSize: "13px",
                            marginBottom: "4px",
                          }}
                        >
                          Mobile
                        </label>
                        <input
                          type="tel"
                          name="mobile"
                          value={editForm.mobile}
                          onChange={handleInputChange}
                          style={{
                            width: "100%",
                            padding: "8px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            fontSize: "14px",
                          }}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Internship Details */}
              <div style={{ marginBottom: "24px" }}>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#1f2937",
                    marginBottom: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  Internship Details
                </h3>
                <div
                  style={{
                    background: "#f9fafb",
                    padding: "16px",
                    borderRadius: "8px",
                    display: "grid",
                    gap: "10px",
                  }}
                >
                  {!isEditing ? (
                    <>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span style={{ color: "#6b7280", fontSize: "14px" }}>
                          Domain
                        </span>
                        <span
                          style={{
                            fontWeight: "500",
                            fontSize: "14px",
                            color: "#111827",
                          }}
                        >
                          {selectedStudent.domain || "Not specified"}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span style={{ color: "#6b7280", fontSize: "14px" }}>
                          Duration
                        </span>
                        <span
                          style={{
                            fontWeight: "500",
                            fontSize: "14px",
                            color: "#111827",
                          }}
                        >
                          {selectedStudent.duration || "Not specified"}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span style={{ color: "#6b7280", fontSize: "14px" }}>
                          Joining Date
                        </span>
                        <span
                          style={{
                            fontWeight: "500",
                            fontSize: "14px",
                            color: "#111827",
                          }}
                        >
                          {selectedStudent.joiningDate
                            ? new Date(
                                selectedStudent.joiningDate,
                              ).toLocaleDateString()
                            : "Not specified"}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span style={{ color: "#6b7280", fontSize: "14px" }}>
                          Status
                        </span>
                        <span
                          style={{
                            fontWeight: "500",
                            fontSize: "14px",
                            color:
                              selectedStudent.status?.toLowerCase() === "active"
                                ? "#059669"
                                : "#d97706",
                            background:
                              selectedStudent.status?.toLowerCase() === "active"
                                ? "#d1fae5"
                                : "#fef3c7",
                            padding: "4px 12px",
                            borderRadius: "12px",
                          }}
                        >
                          {selectedStudent.status || "Active"}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label
                          style={{
                            display: "block",
                            color: "#6b7280",
                            fontSize: "13px",
                            marginBottom: "4px",
                          }}
                        >
                          Domain
                        </label>
                        <input
                          type="text"
                          name="domain"
                          value={editForm.domain}
                          onChange={handleInputChange}
                          style={{
                            width: "100%",
                            padding: "8px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            fontSize: "14px",
                          }}
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            display: "block",
                            color: "#6b7280",
                            fontSize: "13px",
                            marginBottom: "4px",
                          }}
                        >
                          Duration
                        </label>
                        <input
                          type="text"
                          name="duration"
                          value={editForm.duration}
                          onChange={handleInputChange}
                          style={{
                            width: "100%",
                            padding: "8px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            fontSize: "14px",
                          }}
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            display: "block",
                            color: "#6b7280",
                            fontSize: "13px",
                            marginBottom: "4px",
                          }}
                        >
                          Joining Date
                        </label>
                        <input
                          type="date"
                          name="joiningDate"
                          value={editForm.joiningDate}
                          onChange={handleInputChange}
                          style={{
                            width: "100%",
                            padding: "8px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            fontSize: "14px",
                          }}
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            display: "block",
                            color: "#6b7280",
                            fontSize: "13px",
                            marginBottom: "4px",
                          }}
                        >
                          Status
                        </label>
                        <select
                          name="status"
                          value={editForm.status}
                          onChange={handleInputChange}
                          style={{
                            width: "100%",
                            padding: "8px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            fontSize: "14px",
                          }}
                        >
                          <option value="active">Active</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "flex-end",
                  borderTop: "1px solid #e5e7eb",
                  paddingTop: "16px",
                }}
              >
                {!isEditing ? (
                  <button
                    onClick={handleEditClick}
                    style={{
                      padding: "10px 24px",
                      background:
                        "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                      transition: "transform 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.target.style.transform = "scale(1.02)")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.transform = "scale(1)")
                    }
                  >
                    Edit Details
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleCancelEdit}
                      style={{
                        padding: "10px 24px",
                        background: "#e5e7eb",
                        color: "#374151",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateStudent}
                      style={{
                        padding: "10px 24px",
                        background:
                          "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        transition: "transform 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.target.style.transform = "scale(1.02)")
                      }
                      onMouseLeave={(e) =>
                        (e.target.style.transform = "scale(1)")
                      }
                    >
                      Save Changes
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default InternshipManagement;
