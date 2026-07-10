import { useEffect, useRef, useState } from "react";
import { adminAPI, taskAPI } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

function CreateTask({ onTaskCreated, onBack }) {
  const [interns, setInterns] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [groupSearchQuery, setGroupSearchQuery] = useState("");
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
  const [assignmentType, setAssignmentType] = useState("individual");
  const [individualSearchQuery, setIndividualSearchQuery] = useState("");
  const [teamSearchQuery, setTeamSearchQuery] = useState("");
  const [isIndividualDropdownOpen, setIsIndividualDropdownOpen] = useState(false);
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);
  const [selectedIndividualInterns, setSelectedIndividualInterns] = useState([]);
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
  const teamDropdownRef = useRef(null);
  const teamSearchInputRef = useRef(null);
  const groupDropdownRef = useRef(null);
  const groupSearchInputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchInterns();
    fetchGroups();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        individualDropdownRef.current &&
        !individualDropdownRef.current.contains(event.target)
      ) {
        setIsIndividualDropdownOpen(false);
      }
      if (
        teamDropdownRef.current &&
        !teamDropdownRef.current.contains(event.target)
      ) {
        setIsTeamDropdownOpen(false);
      }
      if (
        groupDropdownRef.current &&
        !groupDropdownRef.current.contains(event.target)
      ) {
        setIsGroupDropdownOpen(false);
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

  useEffect(() => {
    if (isTeamDropdownOpen) {
      teamSearchInputRef.current?.focus({ preventScroll: true });
    }
  }, [isTeamDropdownOpen]);

  useEffect(() => {
    if (isGroupDropdownOpen) {
      groupSearchInputRef.current?.focus({ preventScroll: true });
    }
  }, [isGroupDropdownOpen]);

  const openIndividualDropdown = () => {
    setIsIndividualDropdownOpen((prev) => !prev);
  };

  const openTeamDropdown = () => {
    setIsTeamDropdownOpen((prev) => !prev);
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

  const filteredGroups = groups.filter((group) => {
    const name = group.groupName?.toLowerCase() || "";
    const num = group.groupNumber?.toLowerCase() || "";
    const query = groupSearchQuery.trim().toLowerCase();
    return name.includes(query) || num.includes(query);
  });

  const fetchInterns = async () => {
    try {
      const response = await adminAPI.getAllInterns();
      setInterns(response.data.interns || []);
    } catch (err) {
      console.error("Failed to fetch interns:", err);
      setError("Failed to load interns");
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await adminAPI.getGroups();
      setGroups(response.data.groups || []);
    } catch (err) {
      console.error("Failed to fetch groups:", err);
    }
  };

  const handleGroupChange = (groupId) => {
    setSelectedGroup(groupId);
    if (!groupId) {
      setSelectedTeamMembers([]);
      return;
    }
    const group = groups.find((g) => g._id === groupId);
    if (group && group.students) {
      const studentIds = group.students.map((s) => (typeof s === "object" ? s._id : s));
      setSelectedTeamMembers(studentIds);
    }
  };

  const toggleIndividualIntern = (internId) => {
    setSelectedIndividualInterns((prev) => {
      if (prev.includes(internId)) {
        return prev.filter((id) => id !== internId);
      }
      return [...prev, internId];
    });
  };

  const handleSelectAllIndividuals = () => {
    if (selectedIndividualInterns.length === filteredIndividualInterns.length) {
      setSelectedIndividualInterns([]);
    } else {
      setSelectedIndividualInterns(filteredIndividualInterns.map((intern) => intern._id));
    }
  };

  const handleSelectAllTeam = () => {
    if (selectedTeamMembers.length === filteredTeamInterns.length) {
      setSelectedTeamMembers([]);
    } else {
      setSelectedTeamMembers(filteredTeamInterns.map((intern) => intern._id));
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
    setSelectedIndividualInterns([]);
    setIndividualSearchQuery("");
    setTeamSearchQuery("");
    setIsIndividualDropdownOpen(false);
    setIsTeamDropdownOpen(false);
    setSelectedGroup("");
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

    if (assignmentType === "individual" && selectedIndividualInterns.length === 0) {
      setError("Please select at least one intern from the dropdown");
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
        taskFormData.append("assignedTo", JSON.stringify(selectedIndividualInterns));

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
            : `Task created and assigned to ${selectedIndividualInterns.length} intern(s) successfully!`,
        );

        setFormData({
          title: "",
          description: "",
          deadline: "",
          assignedTo: "",
        });
        setSelectedIndividualInterns([]);
        setSelectedTeamMembers([]);
        setIndividualSearchQuery("");
        setTeamSearchQuery("");
        setIsIndividualDropdownOpen(false);
        setIsTeamDropdownOpen(false);
        setSelectedGroup("");
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ fontSize: '15px', fontWeight: '500', color: '#1f2937', marginBottom: '0' }}>
                  Assign to Intern * ({selectedIndividualInterns.length} selected)
                </label>
                <button
                  type="button"
                  onClick={handleSelectAllIndividuals}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    background: '#324158',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.boxShadow = '0 4px 12px rgba(50, 65, 88, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  {selectedIndividualInterns.length === filteredIndividualInterns.length && filteredIndividualInterns.length > 0 ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div
                onClick={openIndividualDropdown}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: `2px solid ${isIndividualDropdownOpen ? '#3b82f6' : '#cbd5e1'}`,
                  borderRadius: '10px',
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s',
                  color: selectedIndividualInterns.length > 0 ? '#0f172a' : '#94a3b8',
                  userSelect: 'none',
                  boxSizing: 'border-box',
                  marginTop: '10px',
                }}
              >
                <span>
                  {selectedIndividualInterns.length > 0
                    ? `${selectedIndividualInterns.length} student(s) selected`
                    : "Search students by name, ID, email..."}
                </span>
                <span style={{ fontSize: '10px', transition: 'transform 0.2s', transform: isIndividualDropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span>
              </div>

              {isIndividualDropdownOpen && (
                <div
                  className="gm-students-dropdown"
                  style={{
                    position: 'relative',
                    marginTop: '10px',
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
                    zIndex: 20,
                    overflow: 'hidden',
                    maxHeight: '380px',
                  }}
                >
                  <div style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>
                    <input
                      ref={individualSearchInputRef}
                      type="text"
                      placeholder="Search students..."
                      value={individualSearchQuery}
                      onChange={(e) => setIndividualSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        fontSize: '13px',
                        background: '#f8fafc',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
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
                          className={`gm-student-row ${selectedIndividualInterns.includes(intern._id) ? "is-selected" : ""}`}
                          onClick={() => toggleIndividualIntern(intern._id)}
                          style={{
                            width: "100%",
                            border: "1px solid #dbe4ef",
                            borderRadius: "10px",
                            cursor: "pointer",
                            textAlign: "left",
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 16px',
                            background: selectedIndividualInterns.includes(intern._id) ? '#f0fdf4' : 'transparent',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedIndividualInterns.includes(intern._id)}
                            onChange={() => {}}
                            style={{ pointerEvents: 'none', width: '18px', height: '18px' }}
                          />
                          <div
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              display: "grid",
                              placeItems: "center",
                              backgroundColor: selectedIndividualInterns.includes(intern._id) ? "#dbeafe" : "#f1f5f9",
                              color: selectedIndividualInterns.includes(intern._id) ? "#2563eb" : "#475569",
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

                          <span className="gm-student-content" style={{ flex: 1 }}>
                            <span style={{ display: 'block', fontSize: '14px', color: '#0f172a', fontWeight: 'normal' }}>{intern.name}</span>
                            <small style={{ display: 'block', fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                              {intern.studentId || "No ID"} • {intern.email}
                            </small>
                            <span className="gm-type-chip">{intern.studentType}</span>
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {selectedIndividualInterns.length > 0 && !isIndividualDropdownOpen && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "12px 14px",
                    backgroundColor: "#f0fdf4",
                    borderRadius: "8px",
                    border: "1px solid #bbf7d0",
                    color: "#16a34a",
                    fontSize: "14px",
                    fontWeight: 600,
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div>
                    Selected: {selectedIndividualInterns.length} student(s)
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {selectedIndividualInterns.map((id) => {
                      const s = interns.find(intern => intern._id === id);
                      if (!s) return null;
                      return (
                        <span key={id} style={{ background: '#dcfce7', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', color: '#15803d' }}>
                          {s.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              <input type="hidden" name="assignedTo" value={selectedIndividualInterns.length > 0 ? JSON.stringify(selectedIndividualInterns) : ''} required />
            </div>
          )}

          {assignmentType === "team" && (
            <>
              <div className="form-group" ref={groupDropdownRef} style={{ position: "relative", marginBottom: "20px" }}>
                <label style={{ fontSize: '15px', fontWeight: '500', color: '#1f2937', marginBottom: '8px', display: 'block' }}>
                  Select Group
                </label>
                
                <div
                  onClick={() => setIsGroupDropdownOpen(!isGroupDropdownOpen)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: `2px solid ${isGroupDropdownOpen ? '#3b82f6' : '#cbd5e1'}`,
                    borderRadius: '10px',
                    background: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s',
                    color: selectedGroup ? '#0f172a' : '#94a3b8',
                    userSelect: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  <span>
                    {(() => {
                      const selectedGroupObj = groups.find(g => g._id === selectedGroup);
                      return selectedGroupObj 
                        ? `${selectedGroupObj.groupName} (${selectedGroupObj.groupNumber}) - ${selectedGroupObj.students?.length || 0} Students`
                        : "Search and select a group...";
                    })()}
                  </span>
                  <span style={{ fontSize: '10px', transition: 'transform 0.2s', transform: isGroupDropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span>
                </div>

                {isGroupDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '6px',
                      background: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
                      zIndex: 30,
                      overflow: 'hidden',
                      maxHeight: '300px',
                    }}
                  >
                    <div style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>
                      <input
                        ref={groupSearchInputRef}
                        type="text"
                        placeholder="Search groups by name or number..."
                        value={groupSearchQuery}
                        onChange={(e) => setGroupSearchQuery(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb',
                          fontSize: '13px',
                          background: '#f8fafc',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    <div style={{ maxHeight: "200px", overflowY: "auto", padding: "6px" }}>
                      {filteredGroups.length === 0 ? (
                        <div style={{ padding: '12px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                          No groups found
                        </div>
                      ) : (
                        filteredGroups.map((group) => (
                          <button
                            key={group._id}
                            type="button"
                            onClick={() => {
                              handleGroupChange(group._id);
                              setIsGroupDropdownOpen(false);
                            }}
                            style={{
                              width: "100%",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              textAlign: "left",
                              padding: '10px 14px',
                              background: selectedGroup === group._id ? '#f0fdf4' : 'transparent',
                              color: '#0f172a',
                              display: 'block',
                              marginBottom: '2px',
                              fontSize: '13px',
                              fontWeight: selectedGroup === group._id ? '600' : 'normal'
                            }}
                            onMouseEnter={(e) => {
                              if (selectedGroup !== group._id) e.target.style.background = '#f8fafc';
                            }}
                            onMouseLeave={(e) => {
                              if (selectedGroup !== group._id) e.target.style.background = 'transparent';
                            }}
                          >
                            <div style={{ fontWeight: '600', color: '#324158' }}>{group.groupName} ({group.groupNumber})</div>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                              Type: {group.studentType} • {group.students?.length || 0} Students
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group" ref={teamDropdownRef} style={{ position: "relative" }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ fontSize: '15px', fontWeight: '500', color: '#1f2937', marginBottom: '0' }}>
                  Select Team Members * ({selectedTeamMembers.length} selected)
                </label>
                <button
                  type="button"
                  onClick={handleSelectAllTeam}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    background: '#324158',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.boxShadow = '0 4px 12px rgba(50, 65, 88, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  {selectedTeamMembers.length === filteredTeamInterns.length && filteredTeamInterns.length > 0 ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div
                onClick={openTeamDropdown}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: `2px solid ${isTeamDropdownOpen ? '#3b82f6' : '#cbd5e1'}`,
                  borderRadius: '10px',
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s',
                  color: selectedTeamMembers.length > 0 ? '#0f172a' : '#94a3b8',
                  userSelect: 'none',
                  boxSizing: 'border-box',
                  marginTop: '10px',
                }}
              >
                <span>
                  {selectedTeamMembers.length > 0
                    ? `${selectedTeamMembers.length} student(s) selected`
                    : "Search students by name, ID, email..."}
                </span>
                <span style={{ fontSize: '10px', transition: 'transform 0.2s', transform: isTeamDropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span>
              </div>

              {isTeamDropdownOpen && (
                <div
                  className="gm-students-dropdown"
                  style={{
                    position: 'relative',
                    marginTop: '10px',
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
                    zIndex: 20,
                    overflow: 'hidden',
                    maxHeight: '380px',
                  }}
                >
                  <div style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>
                    <input
                      ref={teamSearchInputRef}
                      type="text"
                      placeholder="Search students..."
                      value={teamSearchQuery}
                      onChange={(e) => setTeamSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        fontSize: '13px',
                        background: '#f8fafc',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div className="gm-students-box" style={{ maxHeight: "280px" }}>
                    {filteredTeamInterns.length === 0 ? (
                      <div className="gm-empty-inline">
                        {teamSearchQuery
                          ? "No students found matching your search"
                          : "No students available"}
                      </div>
                    ) : (
                      filteredTeamInterns.map((intern) => (
                        <button
                          key={intern._id}
                          type="button"
                          className={`gm-student-row ${selectedTeamMembers.includes(intern._id) ? "is-selected" : ""}`}
                          onClick={() => handleTeamMemberToggle(intern._id)}
                          style={{
                            width: "100%",
                            border: "1px solid #dbe4ef",
                            borderRadius: "10px",
                            cursor: "pointer",
                            textAlign: "left",
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 16px',
                            background: selectedTeamMembers.includes(intern._id) ? '#f0fdf4' : 'transparent',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedTeamMembers.includes(intern._id)}
                            onChange={() => {}}
                            style={{ pointerEvents: 'none', width: '18px', height: '18px' }}
                          />
                          <div
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              display: "grid",
                              placeItems: "center",
                              backgroundColor: selectedTeamMembers.includes(intern._id) ? "#dbeafe" : "#f1f5f9",
                              color: selectedTeamMembers.includes(intern._id) ? "#2563eb" : "#475569",
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

                          <span className="gm-student-content" style={{ flex: 1 }}>
                            <span style={{ display: 'block', fontSize: '14px', color: '#0f172a', fontWeight: 'normal' }}>{intern.name}</span>
                            <small style={{ display: 'block', fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                              {intern.studentId || "No ID"} • {intern.email}
                            </small>
                            <span className="gm-type-chip">{intern.studentType}</span>
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {selectedTeamMembers.length > 0 && !isTeamDropdownOpen && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "12px 14px",
                    backgroundColor: "#f0fdf4",
                    borderRadius: "8px",
                    border: "1px solid #bbf7d0",
                    color: "#16a34a",
                    fontSize: "14px",
                    fontWeight: 600,
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div>
                    Selected: {selectedTeamMembers.length} student(s)
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {selectedTeamMembers.map((id) => {
                      const s = interns.find(intern => intern._id === id);
                      if (!s) return null;
                      return (
                        <span key={id} style={{ background: '#dcfce7', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', color: '#15803d' }}>
                          {s.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            </>
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
