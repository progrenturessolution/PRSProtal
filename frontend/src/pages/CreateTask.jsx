import { useEffect, useRef, useState } from "react";
import { adminAPI, taskAPI } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

function CreateTask({ onTaskCreated, onBack }) {
  const [interns, setInterns] = useState([]);
  const [assignmentType, setAssignmentType] = useState("individual");
  const [individualSearchQuery, setIndividualSearchQuery] = useState("");
  const [teamSearchQuery, setTeamSearchQuery] = useState("");
  const [isIndividualDropdownOpen, setIsIndividualDropdownOpen] = useState(false);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    deadline: "",
    assignedTo: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const individualDropdownRef = useRef(null);
  const individualSearchInputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchInterns();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        individualDropdownRef.current &&
        !individualDropdownRef.current.contains(event.target)
      ) {
        setIsIndividualDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isIndividualDropdownOpen) {
      individualSearchInputRef.current?.focus({ preventScroll: true });
    }
  }, [isIndividualDropdownOpen]);

  const openIndividualDropdown = () => {
    setIsIndividualDropdownOpen((prev) => !prev);
  };

  const filterInternsByQuery = (query) => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return interns;
    }

    return interns.filter((intern) => {
      const name = intern.name?.toLowerCase() || "";
      const email = intern.email?.toLowerCase() || "";
      const studentId = intern.studentId?.toLowerCase() || "";
      const studentType = intern.studentType?.toLowerCase() || "";

      return (
        name.includes(normalizedQuery) ||
        email.includes(normalizedQuery) ||
        studentId.includes(normalizedQuery) ||
        studentType.includes(normalizedQuery)
      );
    });
  };

  const filteredIndividualInterns = filterInternsByQuery(individualSearchQuery);
  const filteredTeamInterns = filterInternsByQuery(teamSearchQuery);

  const fetchInterns = async () => {
    try {
      const response = await adminAPI.getAllInterns();
      setInterns(response.data.interns || []);
    } catch (err) {
      console.error("Failed to fetch interns:", err);
      setError("Failed to load interns");
    }
  };

  const handleTeamMemberToggle = (internId) => {
    setSelectedTeamMembers((prev) => {
      if (prev.includes(internId)) {
        return prev.filter((id) => id !== internId);
      }

      return [...prev, internId];
    });
  };

  const handleAssignmentTypeChange = (type) => {
    setAssignmentType(type);
    setFormData((prev) => ({ ...prev, assignedTo: "" }));
    setSelectedTeamMembers([]);
    setIndividualSearchQuery("");
    setTeamSearchQuery("");
    setIsIndividualDropdownOpen(false);
    setError("");
    setSuccess("");
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setError("");
    setSuccess("");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (!file) {
      return;
    }

    if (file.type !== "application/pdf") {
      setError("Only PDF files are allowed");
      e.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (assignmentType === "individual" && !formData.assignedTo) {
      setError("Please select an intern from the dropdown");
      setLoading(false);
      return;
    }

    if (assignmentType === "team" && selectedTeamMembers.length === 0) {
      setError("Please select at least one team member");
      setLoading(false);
      return;
    }

    try {
      let response;

      if (assignmentType === "individual") {
        const taskFormData = new FormData();
        taskFormData.append("title", formData.title);
        taskFormData.append("description", formData.description);
        taskFormData.append("deadline", formData.deadline);
        taskFormData.append("assignedTo", formData.assignedTo);

        if (selectedFile) {
          taskFormData.append("taskDocument", selectedFile);
        }

        response = await taskAPI.createTask(taskFormData);
      } else {
        const taskFormData = new FormData();
        taskFormData.append("title", formData.title);
        taskFormData.append("description", formData.description);
        taskFormData.append("deadline", formData.deadline);
        taskFormData.append("assignedTo", selectedTeamMembers[0]);
        taskFormData.append("isTeamTask", "true");
        taskFormData.append("teamMembers", JSON.stringify(selectedTeamMembers));

        if (selectedFile) {
          taskFormData.append("taskDocument", selectedFile);
        }

        response = await taskAPI.createTask(taskFormData);
      }

      if (response.data.success) {
        setSuccess(
          assignmentType === "team"
            ? `Task created and assigned to ${selectedTeamMembers.length} team members successfully!`
            : "Task created and assigned successfully!",
        );

        setFormData({
          title: "",
          description: "",
          deadline: "",
          assignedTo: "",
        });
        setSelectedTeamMembers([]);
        setIndividualSearchQuery("");
        setTeamSearchQuery("");
        setIsIndividualDropdownOpen(false);
        setSelectedFile(null);

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        if (onTaskCreated) {
          onTaskCreated();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  const selectedIntern = interns.find((intern) => intern._id === formData.assignedTo);
  const selectedInternInitials = selectedIntern
    ? selectedIntern.name
        ?.split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "S"
    : "S";

  const dropdownContainerStyle = {
    position: "absolute",
    zIndex: 20,
    top: "calc(100% + 10px)",
    left: 0,
    right: 0,
    border: "1px solid rgba(148, 163, 184, 0.24)",
    borderRadius: "18px",
    backgroundColor: "#ffffff",
    boxShadow: "0 24px 60px rgba(15, 23, 42, 0.16)",
    overflow: "hidden",
  };

  const dropdownSearchStyle = {
    width: "100%",
    padding: "14px 16px 14px 44px",
    fontSize: "14px",
    border: "none",
    borderBottom: "1px solid #e2e8f0",
    outline: "none",
    backgroundColor: "#f8fafc",
    color: "#0f172a",
  };

  return (
    <>
      <div className="content-header-with-back" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="content-header">
          <h1>Create & Assign Task</h1>
          <p>Assign a new task to an intern</p>
        </div>
        <div>
          {onBack && (
            <button onClick={onBack} className="back-button back-button-primary" title="Back to Activity Management">
              Back
            </button>
          )}
        </div>
      </div>

      <div className="card" style={{ overflow: "visible" }}>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="form-group">
            <label>Assignment Type *</label>
            <div
              style={{
                display: "flex",
                gap: "16px",
                marginTop: "8px",
                padding: "12px",
                backgroundColor: "#f8fafc",
                borderRadius: "10px",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  fontSize: "15px",
                  fontWeight: assignmentType === "individual" ? "600" : "500",
                  color: assignmentType === "individual" ? "#3b82f6" : "#64748b",
                }}
              >
                <input
                  type="radio"
                  name="assignmentType"
                  value="individual"
                  checked={assignmentType === "individual"}
                  onChange={(e) => handleAssignmentTypeChange(e.target.value)}
                  style={{ width: "18px", height: "18px", cursor: "pointer" }}
                />
                Individual Task
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  fontSize: "15px",
                  fontWeight: assignmentType === "team" ? "600" : "500",
                  color: assignmentType === "team" ? "#3b82f6" : "#64748b",
                }}
              >
                <input
                  type="radio"
                  name="assignmentType"
                  value="team"
                  checked={assignmentType === "team"}
                  onChange={(e) => handleAssignmentTypeChange(e.target.value)}
                  style={{ width: "18px", height: "18px", cursor: "pointer" }}
                />
                Team Task
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Task Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter task title"
              required
            />
          </div>

          <div className="form-group">
            <label>Task Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the task in detail"
              required
              rows="5"
              style={{
                width: "100%",
                padding: "14px 16px",
                border: "2px solid #e2e8f0",
                borderRadius: "10px",
                fontSize: "15px",
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />
          </div>

          <div className="form-group">
            <label>Deadline *</label>
            <input
              type="datetime-local"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Task Document (PDF - Optional)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "2px solid #e2e8f0",
                borderRadius: "10px",
                fontSize: "15px",
                cursor: "pointer",
                backgroundColor: "#f8fafc",
              }}
            />
            {selectedFile && (
              <div
                style={{
                  marginTop: "8px",
                  padding: "8px 12px",
                  backgroundColor: "#dbeafe",
                  borderRadius: "6px",
                  fontSize: "14px",
                  color: "#1e40af",
                }}
              >
                {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
              </div>
            )}
            <small style={{ color: "#64748b", display: "block", marginTop: "6px" }}>
              Upload a PDF document with task details (Max 10MB)
            </small>
          </div>

          {assignmentType === "individual" && (
            <div className="form-group" ref={individualDropdownRef} style={{ position: "relative" }}>
              <label>Assign to Intern * {formData.assignedTo && "✓"}</label>

              <button
                type="button"
                className="gm-students-trigger"
                onClick={openIndividualDropdown}
                aria-expanded={isIndividualDropdownOpen}
                style={{ marginTop: "10px" }}
              >
                <span style={{ minWidth: 0, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "3px" }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {selectedIntern ? selectedIntern.name : "Select a student"}
                  </span>
                  <span style={{ fontSize: "12px", fontWeight: 500, color: "#64748b" }}>
                    {selectedIntern
                      ? `${selectedIntern.studentId || "No ID"} • ${selectedIntern.studentType || "Student"}`
                      : "Search by name, email, ID, or student type"}
                  </span>
                </span>
                <span className={`gm-trigger-arrow ${isIndividualDropdownOpen ? "is-open" : ""}`}>▾</span>
              </button>

              {isIndividualDropdownOpen && (
                <div
                  className="gm-students-dropdown"
                  style={{ maxHeight: "380px", position: "static", zIndex: 20 }}
                >
                  <div style={{ position: "relative" }}>
                    <span
                      style={{
                        position: "absolute",
                        left: "16px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#94a3b8",
                        pointerEvents: "none",
                        fontSize: "14px",
                      }}
                    >
                      🔍
                    </span>
                    <input
                      ref={individualSearchInputRef}
                      type="text"
                      placeholder="Search students..."
                      value={individualSearchQuery}
                      onChange={(e) => setIndividualSearchQuery(e.target.value)}
                      style={dropdownSearchStyle}
                    />
                  </div>

                  <div className="gm-students-box" style={{ maxHeight: "280px" }}>
                    {filteredIndividualInterns.length === 0 ? (
                      <div className="gm-empty-inline">
                        {individualSearchQuery
                          ? "No students found matching your search"
                          : "No students available"}
                      </div>
                    ) : (
                      filteredIndividualInterns.map((intern) => (
                        <button
                          key={intern._id}
                          type="button"
                          className={`gm-student-row ${formData.assignedTo === intern._id ? "is-selected" : ""}`}
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, assignedTo: intern._id }));
                            setIndividualSearchQuery("");
                            setIsIndividualDropdownOpen(false);
                          }}
                          style={{
                            width: "100%",
                            border: "1px solid #dbe4ef",
                            borderRadius: "10px",
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                          onMouseEnter={(e) => {
                            if (formData.assignedTo !== intern._id) {
                              e.currentTarget.style.backgroundColor = "#f8fafc";
                              e.currentTarget.style.transform = "translateX(2px)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (formData.assignedTo !== intern._id) {
                              e.currentTarget.style.backgroundColor = "transparent";
                              e.currentTarget.style.transform = "translateX(0)";
                            }
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%" }}>
                            <div
                              style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "50%",
                                display: "grid",
                                placeItems: "center",
                                backgroundColor:
                                  formData.assignedTo === intern._id ? "#dbeafe" : "#f1f5f9",
                                color: formData.assignedTo === intern._id ? "#2563eb" : "#475569",
                                fontWeight: 700,
                                fontSize: "12px",
                                flexShrink: 0,
                              }}
                            >
                              {intern.name
                                ?.split(" ")
                                .filter(Boolean)
                                .slice(0, 2)
                                .map((part) => part[0]?.toUpperCase())
                                .join("") || "S"}
                            </div>

                            <span className="gm-student-content">
                              <strong>{intern.name}</strong>
                              <small>{intern.email} • {intern.studentId || "No ID"}</small>
                              <span className="gm-type-chip">{intern.studentType}</span>
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {formData.assignedTo && !isIndividualDropdownOpen && selectedIntern && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "12px 14px",
                    backgroundColor: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: "12px",
                    fontSize: "14px",
                    color: "#166534",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                  }}
                >
                  <span>Selected: {selectedIntern.name}</span>
                  <span style={{ fontSize: "12px", color: "#16a34a" }}>{selectedIntern.studentId || "No ID"}</span>
                </div>
              )}

              <input type="hidden" name="assignedTo" value={formData.assignedTo} required />
            </div>
          )}

          {assignmentType === "team" && (
            <div className="form-group">
              <label>Select Team Members * ({selectedTeamMembers.length} selected)</label>

              <input
                type="text"
                placeholder="Search by name, email, ID, or type..."
                value={teamSearchQuery}
                onChange={(e) => setTeamSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  fontSize: "14px",
                  border: "2px solid #e2e8f0",
                  borderRadius: "10px",
                  marginBottom: "12px",
                  outline: "none",
                }}
              />

              <div
                style={{
                  maxHeight: "300px",
                  overflowY: "auto",
                  border: "2px solid #e2e8f0",
                  borderRadius: "10px",
                  backgroundColor: "#f8fafc",
                }}
              >
                {filteredTeamInterns.length === 0 ? (
                  <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>
                    {teamSearchQuery ? "No interns found matching your search" : "No interns available"}
                  </div>
                ) : (
                  filteredTeamInterns.map((intern) => (
                    <label
                      key={intern._id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px 16px",
                        borderBottom: "1px solid #e2e8f0",
                        cursor: "pointer",
                        transition: "background-color 0.2s",
                        backgroundColor: selectedTeamMembers.includes(intern._id)
                          ? "#dbeafe"
                          : "transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (!selectedTeamMembers.includes(intern._id)) {
                          e.currentTarget.style.backgroundColor = "#f1f5f9";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!selectedTeamMembers.includes(intern._id)) {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTeamMembers.includes(intern._id)}
                        onChange={() => handleTeamMemberToggle(intern._id)}
                        style={{ width: "18px", height: "18px", cursor: "pointer" }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: "600", fontSize: "15px", color: "#0f172a" }}>
                          {intern.name}
                        </div>
                        <div style={{ fontSize: "13px", color: "#64748b", marginTop: "2px" }}>
                          {intern.email} • {intern.studentId || "No ID"} • {intern.studentType}
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', alignItems: 'center' }}>
            {onBack && (
              <button type="button" className="nm-btn ghost" onClick={onBack}>
                Close
              </button>
            )}
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <LoadingSpinner text="Creating Task..." inline size="sm" />
              ) : assignmentType === "team" ? (
                `Assign to ${selectedTeamMembers.length} Team Members`
              ) : (
                "Create & Assign Task"
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default CreateTask;
