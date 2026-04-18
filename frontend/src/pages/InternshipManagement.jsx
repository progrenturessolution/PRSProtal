import { useState, useEffect } from "react";
import { adminAPI, UPLOADS_BASE } from "../services/api";

function InternshipManagement({ onAddStudentClick }) {
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
    collegeName: "",
    branch: "",
    yearOfStudy: "",
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
          student.domain?.toLowerCase().includes(query) ||
          student.collegeName?.toLowerCase().includes(query) ||
          student.branch?.toLowerCase().includes(query) ||
          student.yearOfStudy?.toLowerCase().includes(query),
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

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({
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
              background: "#324158",
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
            <table className="data-table internship-students-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Domain</th>
                  <th>Joining Date</th>
                  <th>Duration</th>
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
          className="profile-modal-overlay"
          onClick={() => {
            setSelectedStudent(null);
            setIsEditing(false);
          }}
        >
          <div className="profile-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="profile-header" style={{ background: "#324158" }}>
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
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="profile-actions">
                {!isEditing ? (
                  <button
                    onClick={handleEditClick}
                    className="profile-btn profile-btn-primary"
                    style={{ background: "#324158", borderColor: "#324158" }}
                  >
                    Edit Profile
                  </button>
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
    </>
  );
}

export default InternshipManagement;
