import { useState, useEffect } from "react";
import { adminAPI } from "../services/api";
import { taskAPI } from "../services/api";

function CreateTask({ onTaskCreated }) {
  const [interns, setInterns] = useState([]);
  const [filteredInterns, setFilteredInterns] = useState([]);
  const [assignmentType, setAssignmentType] = useState("individual"); // 'individual' or 'team'
  const [searchQuery, setSearchQuery] = useState("");
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

  useEffect(() => {
    fetchInterns();
  }, []);

  useEffect(() => {
    // Filter interns based on search query
    if (searchQuery.trim() === "") {
      setFilteredInterns(interns);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = interns.filter(
        (intern) =>
          intern.name?.toLowerCase().includes(query) ||
          intern.email?.toLowerCase().includes(query) ||
          intern.studentId?.toLowerCase().includes(query) ||
          intern.studentType?.toLowerCase().includes(query),
      );
      console.log("Search query:", query);
      console.log("Filtered interns:", filtered);
      setFilteredInterns(filtered);
    }
  }, [searchQuery, interns]);

  const fetchInterns = async () => {
    try {
      const response = await adminAPI.getAllInterns();
      console.log("Fetched interns:", response.data.interns);
      const activeInterns = response.data.interns || [];
      setInterns(activeInterns);
      setFilteredInterns(activeInterns);
    } catch (err) {
      console.error("Failed to fetch interns:", err);
      setError("Failed to load interns");
    }
  };

  const handleTeamMemberToggle = (internId) => {
    setSelectedTeamMembers((prev) => {
      if (prev.includes(internId)) {
        return prev.filter((id) => id !== internId);
      } else {
        return [...prev, internId];
      }
    });
  };

  const handleAssignmentTypeChange = (type) => {
    setAssignmentType(type);
    setFormData({ ...formData, assignedTo: "" });
    setSelectedTeamMembers([]);
    setSearchQuery("");
    setError("");
    setSuccess("");
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
    setSuccess("");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (file.type !== "application/pdf") {
        setError("Only PDF files are allowed");
        e.target.value = "";
        return;
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        e.target.value = "";
        return;
      }
      setSelectedFile(file);
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Validate team selection
    if (assignmentType === "team" && selectedTeamMembers.length === 0) {
      setError("Please select at least one team member");
      setLoading(false);
      return;
    }

    try {
      let response;

      if (assignmentType === "individual") {
        // Single task assignment with file upload
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
        // Team task - create ONE shared task for the whole team
        const taskFormData = new FormData();
        taskFormData.append("title", formData.title);
        taskFormData.append("description", formData.description);
        taskFormData.append("deadline", formData.deadline);
        taskFormData.append("assignedTo", selectedTeamMembers[0]); // primary member
        taskFormData.append("isTeamTask", "true");
        taskFormData.append("teamMembers", JSON.stringify(selectedTeamMembers));
        if (selectedFile) {
          taskFormData.append("taskDocument", selectedFile);
        }
        response = await taskAPI.createTask(taskFormData);
      }

      if (response.data.success) {
        const message =
          assignmentType === "team"
            ? `Task created and assigned to ${selectedTeamMembers.length} team members successfully!`
            : "Task created and assigned successfully!";

        setSuccess(message);

        // Reset form
        setFormData({
          title: "",
          description: "",
          deadline: "",
          assignedTo: "",
        });
        setSelectedTeamMembers([]);
        setSearchQuery("");
        setSelectedFile(null);
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = "";

        // Notify parent to refresh stats
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

  return (
    <>
      <div className="content-header">
        <h1>Create & Assign Task</h1>
        <p>Assign a new task to an intern</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {/* Assignment Type Selection */}
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
                  color:
                    assignmentType === "individual" ? "#3b82f6" : "#64748b",
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
            <small
              style={{ color: "#64748b", display: "block", marginTop: "6px" }}
            >
              Upload a PDF document with task details (Max 10MB)
            </small>
          </div>

          {/* Individual Assignment */}
          {assignmentType === "individual" && (
            <div className="form-group">
              <label>Assign to Intern * {formData.assignedTo && "✓"}</label>

              {/* Search Bar */}
              <input
                type="text"
                placeholder="🔍 Search by name, email, ID, or type..."
                value={searchQuery}
                onChange={(e) => {
                  console.log("Search input changed:", e.target.value);
                  setSearchQuery(e.target.value);
                }}
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

              {/* Show filtered results as clickable list */}
              <div
                style={{
                  maxHeight: "300px",
                  overflowY: "auto",
                  border: "2px solid #e2e8f0",
                  borderRadius: "10px",
                  backgroundColor: "#f8fafc",
                }}
              >
                {filteredInterns.length === 0 ? (
                  <div
                    style={{
                      padding: "20px",
                      textAlign: "center",
                      color: "#94a3b8",
                    }}
                  >
                    {searchQuery
                      ? "No interns found matching your search"
                      : "No interns available"}
                  </div>
                ) : (
                  filteredInterns.map((intern) => (
                    <div
                      key={intern._id}
                      onClick={() => {
                        setFormData({ ...formData, assignedTo: intern._id });
                        setSearchQuery(""); // Clear search after selection
                      }}
                      style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid #e2e8f0",
                        cursor: "pointer",
                        transition: "background-color 0.2s",
                        backgroundColor:
                          formData.assignedTo === intern._id
                            ? "#dbeafe"
                            : "transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (formData.assignedTo !== intern._id) {
                          e.currentTarget.style.backgroundColor = "#f1f5f9";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (formData.assignedTo !== intern._id) {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }
                      }}
                    >
                      <div
                        style={{
                          fontWeight: "600",
                          fontSize: "15px",
                          color: "#0f172a",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        {formData.assignedTo === intern._id && (
                          <span style={{ color: "#3b82f6", fontSize: "18px" }}>
                            ✓
                          </span>
                        )}
                        {intern.name}
                      </div>
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#64748b",
                          marginTop: "2px",
                        }}
                      >
                        {intern.email} • {intern.studentId || "No ID"} •{" "}
                        {intern.studentType}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Selected intern display */}
              {formData.assignedTo && !searchQuery && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "12px",
                    backgroundColor: "#dcfce7",
                    border: "2px solid #86efac",
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: "#166534",
                    fontWeight: "500",
                  }}
                >
                  ✓ Selected:{" "}
                  {interns.find((i) => i._id === formData.assignedTo)?.name}
                </div>
              )}

              {/* Hidden input for form validation */}
              <input
                type="hidden"
                name="assignedTo"
                value={formData.assignedTo}
                required
              />
            </div>
          )}

          {/* Team Assignment */}
          {assignmentType === "team" && (
            <div className="form-group">
              <label>
                Select Team Members * ({selectedTeamMembers.length} selected)
              </label>

              {/* Search Bar */}
              <input
                type="text"
                placeholder="Search by name, email, ID, or type..."
                value={searchQuery}
                onChange={(e) => {
                  console.log("Team search input changed:", e.target.value);
                  setSearchQuery(e.target.value);
                }}
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

              {/* Team Members List with Checkboxes */}
              <div
                style={{
                  maxHeight: "300px",
                  overflowY: "auto",
                  border: "2px solid #e2e8f0",
                  borderRadius: "10px",
                  backgroundColor: "#f8fafc",
                }}
              >
                {filteredInterns.length === 0 ? (
                  <div
                    style={{
                      padding: "20px",
                      textAlign: "center",
                      color: "#94a3b8",
                    }}
                  >
                    {searchQuery
                      ? "No interns found matching your search"
                      : "No interns available"}
                  </div>
                ) : (
                  filteredInterns.map((intern) => (
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
                        backgroundColor: selectedTeamMembers.includes(
                          intern._id,
                        )
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
                        style={{
                          width: "18px",
                          height: "18px",
                          cursor: "pointer",
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontWeight: "600",
                            fontSize: "15px",
                            color: "#0f172a",
                          }}
                        >
                          {intern.name}
                        </div>
                        <div
                          style={{
                            fontSize: "13px",
                            color: "#64748b",
                            marginTop: "2px",
                          }}
                        >
                          {intern.email} • {intern.studentId || "No ID"} •{" "}
                          {intern.studentType}
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading
              ? "Creating Task..."
              : assignmentType === "team"
                ? `Assign to ${selectedTeamMembers.length} Team Members`
                : "Create & Assign Task"}
          </button>
        </form>
      </div>
    </>
  );
}

export default CreateTask;
