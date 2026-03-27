import { useState, useEffect } from "react";
import { adminAPI } from "../services/api";

function AccessManagement() {
  const [trainers, setTrainers] = useState([]);
  const [students, setStudents] = useState([]);
  const [activeTab, setActiveTab] = useState("list");
  const [selectedTrainer, setSelectedTrainer] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);

  const [trainerFormData, setTrainerFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    role: "trainer",
  });

  const [selectedTrainerDetails, setSelectedTrainerDetails] = useState(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [newTrainerCredentials, setNewTrainerCredentials] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filteredStudents, setFilteredStudents] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [students, searchQuery, filterType, filterStatus]);

  const applyFilters = () => {
    let filtered = [...students];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (student) =>
          student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.internId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.mobile?.includes(searchQuery),
      );
    }

    // Type filter
    if (filterType !== "All") {
      filtered = filtered.filter(
        (student) => student.studentType === filterType,
      );
    }

    // Status filter
    if (filterStatus !== "All") {
      filtered = filtered.filter(
        (student) =>
          (student.status || "").toLowerCase() === filterStatus.toLowerCase(),
      );
    }

    setFilteredStudents(filtered);
  };

  const fetchData = async () => {
    try {
      // Fetch trainers
      const trainersResponse = await adminAPI.getAllTrainers();
      if (trainersResponse.data.success) {
        setTrainers(trainersResponse.data.trainers);
      }

      // Fetch students
      const studentsResponse = await adminAPI.getAllInterns();
      if (studentsResponse.data.success) {
        setStudents(studentsResponse.data.interns);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  };

  const handleTrainerFormChange = (e) => {
    setTrainerFormData({
      ...trainerFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddTrainer = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Store credentials before clearing form
      const credentials = {
        email: trainerFormData.email,
        password: trainerFormData.password,
        name: trainerFormData.name,
        role: trainerFormData.role,
      };

      const response = await adminAPI.addTrainer(trainerFormData);

      if (response.data.success) {
        setSuccess("Trainer added successfully!");

        // Show credentials modal
        setNewTrainerCredentials(credentials);
        setShowCredentialsModal(true);

        setTrainerFormData({
          name: "",
          email: "",
          mobile: "",
          password: "",
          role: "trainer",
        });
        setActiveTab("list");
        fetchData();
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to add trainer. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrainer = async (trainerId, trainerName) => {
    if (
      window.confirm(
        `Are you sure you want to delete trainer "${trainerName}"? This action cannot be undone.`
      )
    ) {
      try {
        const response = await adminAPI.deleteTrainer(trainerId);
        if (response.data.success) {
          setTrainers(trainers.filter((t) => t._id !== trainerId));
          setOpenMenuId(null);
          setSuccess("Trainer deleted successfully");
          setTimeout(() => setSuccess(""), 5000);
        } else {
          setError(response.data.message || "Failed to delete trainer");
        }
      } catch (error) {
        console.error("Delete trainer error:", error);
        setError("Failed to delete trainer. Please try again.");
      }
    }
  };

  const handleStudentSelection = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter((id) => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  const handleAssignStudents = async (e) => {
    e.preventDefault();

    if (!selectedTrainer) {
      setError("Please select a trainer.");
      return;
    }

    if (selectedStudents.length === 0) {
      setError("Please select at least one student.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      console.log("Sending assign request:", {
        trainerId: selectedTrainer,
        studentIds: selectedStudents,
      });

      const response = await adminAPI.assignStudentsToTrainer({
        trainerId: selectedTrainer,
        studentIds: selectedStudents,
      });

      console.log("Assign response:", response);

      if (response.data.success) {
        setSuccess(
          `${selectedStudents.length} student(s) assigned successfully!`,
        );
        setSelectedTrainer("");
        setSelectedStudents([]);
        setActiveTab("list");
        fetchData();
      }
    } catch (err) {
      console.error("Assign error:", err);
      console.error("Error response:", err.response);

      let errorMessage = "Failed to assign students. Please try again.";

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = `Network error: ${err.message}`;
      } else if (!navigator.onLine) {
        errorMessage = "No internet connection. Please check your network.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const totalAssigned = trainers.reduce(
    (sum, t) => sum + (t.assignedStudents?.length || 0),
    0,
  );
  const activeCount = trainers.filter(
    (t) => (t.status || "").toLowerCase() === "active",
  ).length;
  const hrCount = trainers.filter((t) => t.role === "hr").length;

  return (
    <>
      {/* Page Header */}
      <div className="premium-page-header">
        <div className="header-left">
          <h1>Access Management</h1>
          <p className="header-subtitle">
            Manage trainers, HR staff, and student assignments
          </p>
        </div>
        <div className="header-right">
          <div className="date-badge">
            {new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="premium-stats-grid">
        <div className="premium-stat-card accent-blue">
          <div className="stat-icon-wrapper">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zM6 20h12a6 6 0 00-12 0z"
              />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Trainers</div>
            <div className="stat-value">{trainers.length}</div>
            <div className="stat-meta">All trainers and staff</div>
          </div>
        </div>

        <div className="premium-stat-card accent-teal">
          <div className="stat-icon-wrapper">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">HR Staff</div>
            <div className="stat-value">{hrCount}</div>
            <div className="stat-meta">HR administrators</div>
          </div>
        </div>

        <div className="premium-stat-card accent-indigo">
          <div className="stat-icon-wrapper">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-5m-4-6l4.586-4.586a2 2 0 112.828 2.828L12.414 12A2 2 0 0010 13.414l-4.586 4.586a2 2 0 11-2.828-2.828L7.586 10.414A2 2 0 1010 8.586l4.586-4.586a2 2 0 110 2.828L10 11.414"
              />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">Active</div>
            <div className="stat-value">{activeCount}</div>
            <div className="stat-meta">Active trainers</div>
          </div>
        </div>

        <div className="premium-stat-card accent-orange">
          <div className="stat-icon-wrapper">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">Students Assigned</div>
            <div className="stat-value">{totalAssigned}</div>
            <div className="stat-meta">Currently assigned</div>
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <div
          style={{
            padding: "12px 16px",
            marginBottom: "16px",
            background: "#fee2e2",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            color: "#dc2626",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          {error}
        </div>
      )}
      {success && (
        <div
          style={{
            padding: "12px 16px",
            marginBottom: "16px",
            background: "#dcfce7",
            border: "1px solid #bbf7d0",
            borderRadius: "8px",
            color: "#166534",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          {success}
        </div>
      )}

      {/* Tab Navigation */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          marginBottom: "24px",
          flexWrap: "wrap",
          background: "#f1f5f9",
          padding: "6px",
          borderRadius: "12px",
          width: "fit-content",
        }}
      >
        {[
          { key: "list", label: "Trainers List" },
          { key: "add", label: "Add Trainer" },
          { key: "assign", label: "Assign Students" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "10px 22px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 600,
              transition: "all 0.2s",
              background: activeTab === tab.key ? "white" : "transparent",
              color: activeTab === tab.key ? "#0f172a" : "#64748b",
              boxShadow:
                activeTab === tab.key ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── ADD TRAINER TAB ── */}
      {activeTab === "add" && (
        <div className="card">
          {/* Card header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "24px",
              paddingBottom: "16px",
              borderBottom: "1px solid #f1f5f9",
            }}
          >
            <div>
              <h3 style={{ margin: 0, color: "#324158", fontSize: "18px" }}>
                Add New Trainer
              </h3>
              <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                Create login credentials for a new trainer or HR staff
              </p>
            </div>
          </div>

          <form onSubmit={handleAddTrainer}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "16px",
              }}
            >
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={trainerFormData.name}
                  onChange={handleTrainerFormChange}
                  placeholder="Enter trainer's full name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={trainerFormData.email}
                  onChange={handleTrainerFormChange}
                  placeholder="Enter email address"
                  required
                />
              </div>
              <div className="form-group">
                <label>Mobile Number *</label>
                <input
                  type="tel"
                  name="mobile"
                  value={trainerFormData.mobile}
                  onChange={handleTrainerFormChange}
                  placeholder="Enter mobile number"
                  required
                />
              </div>
              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  name="password"
                  value={trainerFormData.password}
                  onChange={handleTrainerFormChange}
                  placeholder="Set a password"
                  required
                  minLength="6"
                />
              </div>
              <div className="form-group">
                <label>Role *</label>
                <select
                  name="role"
                  value={trainerFormData.role}
                  onChange={handleTrainerFormChange}
                  required
                >
                  <option value="trainer">Trainer</option>
                  <option value="hr">HR</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "12px 28px",
                  background: loading ? "#94a3b8" : "#324158",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                {loading ? "Adding..." : "Add Trainer"}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("list")}
                style={{
                  padding: "12px 24px",
                  background: "#f1f5f9",
                  color: "#64748b",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── ASSIGN STUDENTS TAB ── */}
      {activeTab === "assign" && (
        <div className="card">
          {/* Card header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "24px",
              paddingBottom: "16px",
              borderBottom: "1px solid #f1f5f9",
            }}
          >
            <div>
              <h3 style={{ margin: 0, color: "#324158", fontSize: "18px" }}>
                Assign Students to Trainer
              </h3>
              <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                Connect students with their assigned trainer
              </p>
            </div>
          </div>

          <form onSubmit={handleAssignStudents}>
            <div className="form-group" style={{ marginBottom: "20px" }}>
              <label>Select Trainer *</label>
              <select
                value={selectedTrainer}
                onChange={(e) => setSelectedTrainer(e.target.value)}
                required
              >
                <option value="">Choose a trainer...</option>
                {trainers.map((trainer) => (
                  <option key={trainer._id} value={trainer._id}>
                    {trainer.name} ({trainer.role === "hr" ? "HR" : "Trainer"})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>
                Select Students *{" "}
                <span style={{ color: "#64748b", fontWeight: 400 }}>
                  — {selectedStudents.length} selected (
                  {filteredStudents.length} shown)
                </span>
              </label>

              {/* Filters and Search Bar */}
              <div
                style={{
                  background: "#f8fafc",
                  padding: "16px",
                  borderRadius: "10px",
                  marginBottom: "16px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "12px",
                    alignItems: "end",
                  }}
                >
                  {/* Search */}
                  <div style={{ gridColumn: "span 2" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "6px",
                        fontSize: "13px",
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
                        padding: "10px 12px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                        fontSize: "14px",
                        background: "white",
                        transition: "all 0.2s",
                      }}
                    />
                  </div>

                  {/* Student Type Filter */}
                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "6px",
                        fontSize: "13px",
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
                        padding: "10px 12px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                        fontSize: "14px",
                        background: "white",
                        cursor: "pointer",
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
                        marginBottom: "6px",
                        fontSize: "13px",
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
                        padding: "10px 12px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                        fontSize: "14px",
                        background: "white",
                        cursor: "pointer",
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

              <div
                style={{
                  maxHeight: "320px",
                  overflowY: "auto",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "8px",
                }}
              >
                {filteredStudents.length === 0 ? (
                  <p
                    style={{
                      textAlign: "center",
                      color: "#64748b",
                      padding: "24px 0",
                    }}
                  >
                    {searchQuery ||
                    filterType !== "All" ||
                    filterStatus !== "All"
                      ? "No students match your search or filters"
                      : "No students available"}
                  </p>
                ) : (
                  filteredStudents.map((student) => (
                    <label
                      key={student._id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "10px 12px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        background: selectedStudents.includes(student._id)
                          ? "#eff6ff"
                          : "transparent",
                        marginBottom: "2px",
                        transition: "background 0.15s",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student._id)}
                        onChange={() => handleStudentSelection(student._id)}
                        style={{
                          width: "16px",
                          height: "16px",
                          accentColor: "#0f172a",
                          flexShrink: 0,
                        }}
                      />
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          background: "#e2e8f0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#475569",
                          fontSize: "13px",
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {student.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div
                          style={{
                            fontWeight: 600,
                            color: "#0f172a",
                            fontSize: "14px",
                          }}
                        >
                          {student.name}
                        </div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>
                          {student.internId} · {student.email}
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "12px 28px",
                  background: loading ? "#94a3b8" : "#324158",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: 600,
                  boxShadow: loading
                    ? "none"
                    : "0 2px 8px rgba(16,185,129,0.35)",
                }}
              >
                {loading ? "Assigning..." : "Assign Students"}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("list")}
                style={{
                  padding: "12px 24px",
                  background: "#f1f5f9",
                  color: "#64748b",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── TRAINERS LIST TAB ── */}
      {activeTab === "list" && (
        <div className="card">
          {/* Card header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              paddingBottom: "16px",
              borderBottom: "1px solid #f1f5f9",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h3 style={{ margin: 0, color: "#0f172a", fontSize: "17px" }}>
                Trainers & HR Staff
              </h3>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                onClick={() => setActiveTab("add")}
                style={{
                  padding: "9px 18px",
                  background: "#324158",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                Add Trainer
              </button>
              <button
                onClick={() => setActiveTab("assign")}
                style={{
                  padding: "9px 18px",
                  background: "#324158",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                Assign Students
              </button>
            </div>
          </div>

          {trainers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 20px" }}>
              <div style={{ fontSize: "52px", marginBottom: "12px" }}>−</div>
              <h3
                style={{
                  color: "#64748b",
                  margin: "0 0 8px 0",
                  fontWeight: 600,
                }}
              >
                No trainers yet
              </h3>
              <p
                style={{
                  color: "#94a3b8",
                  margin: "0 0 20px 0",
                  fontSize: "14px",
                }}
              >
                Add your first trainer to get started
              </p>
              <button
                onClick={() => setActiveTab("add")}
                style={{
                  padding: "10px 24px",
                  background: "#324158",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                + Add Trainer
              </button>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Trainer</th>
                    <th>Email</th>
                    <th>Mobile</th>
                    <th>Role</th>
                    <th>Assigned Students</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {trainers.map((trainer) => (
                    <tr key={trainer._id}>
                      {/* Name */}
                      <td>
                        <span
                          style={{
                            fontWeight: 600,
                            color: "#0f172a",
                          }}
                        >
                          {trainer.name}
                        </span>
                      </td>
                      <td style={{ color: "#64748b" }}>{trainer.email}</td>
                      <td style={{ color: "#64748b" }}>{trainer.mobile}</td>
                      <td>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 10px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: 600,
                            background:
                              trainer.role === "hr" ? "#f1f5f9" : "#f1f5f9",
                            color:
                              trainer.role === "hr" ? "#475569" : "#475569",
                            textTransform: "capitalize",
                          }}
                        >
                          {trainer.role === "hr" ? "HR" : "Trainer"}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            fontWeight: 600,
                            color: "#0f172a",
                          }}
                        >
                          {trainer.assignedStudents?.length || 0}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`status-badge ${
                            (trainer.status || "").toLowerCase() === "active"
                              ? "status-active"
                              : "status-inactive"
                          }`}
                        >
                          {trainer.status}
                        </span>
                      </td>
                      <td style={{ position: "relative" }}>
                        <button
                          onClick={() =>
                            setOpenMenuId(
                              openMenuId === trainer._id ? null : trainer._id,
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

                        {openMenuId === trainer._id && (
                          <div
                            style={{
                              position: "absolute",
                              right: "40px",
                              top: "0",
                              background: "white",
                              border: "1px solid #e5e7eb",
                              borderRadius: "8px",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                              zIndex: 1000,
                              minWidth: "160px",
                              overflow: "hidden",
                            }}
                          >
                            <button
                              onClick={() => {
                                setSelectedTrainerDetails(trainer);
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
                                color: "#0f172a",
                                transition: "background 0.2s",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background = "#f9fafb")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background = "white")
                              }
                            >
                              View Details
                            </button>
                            <div
                              style={{
                                height: "1px",
                                background: "#e5e7eb",
                                margin: "0",
                              }}
                            ></div>
                            <button
                              onClick={() => {
                                handleDeleteTrainer(trainer._id, trainer.name);
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
                                color: "#dc2626",
                                transition: "background 0.2s",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background = "#fee2e2")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background = "white")
                              }
                            >
                              Delete Trainer
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
      )}

      {/* Credentials Modal - Shows after adding trainer */}
      {showCredentialsModal && newTrainerCredentials && (
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
            zIndex: 11000,
          }}
          onClick={() => setShowCredentialsModal(false)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              maxWidth: "600px",
              width: "90%",
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                background: "#0f172a",
                padding: "24px",
                borderTopLeftRadius: "16px",
                borderTopRightRadius: "16px",
                color: "white",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "600" }}>
                  Trainer Added Successfully!
                </h2>
                <button
                  onClick={() => setShowCredentialsModal(false)}
                  style={{
                    background: "rgba(255, 255, 255, 0.2)",
                    border: "none",
                    color: "white",
                    fontSize: "24px",
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.target.style.background = "rgba(255, 255, 255, 0.3)")
                  }
                  onMouseLeave={(e) =>
                    (e.target.style.background = "rgba(255, 255, 255, 0.2)")
                  }
                >
                  ×
                </button>
              </div>
              <p
                style={{ margin: "8px 0 0 0", opacity: 0.95, fontSize: "14px" }}
              >
                Share these login credentials with the trainer
              </p>
            </div>

            {/* Content */}
            <div style={{ padding: "32px" }}>
              {/* Warning Message */}
              <div
                style={{
                  background: "#fef3c7",
                  border: "1px solid #fbbf24",
                  borderRadius: "8px",
                  padding: "16px",
                  marginBottom: "24px",
                  display: "flex",
                  gap: "12px",
                }}
              >
                <span style={{ fontSize: "20px" }}>!</span>
                <div>
                  <strong
                    style={{
                      color: "#92400e",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Important: Save These Credentials
                  </strong>
                  <p style={{ margin: 0, color: "#78350f", fontSize: "14px" }}>
                    These login credentials will not be shown again. Please save
                    them securely or share them with the trainer immediately.
                  </p>
                </div>
              </div>

              {/* Trainer Info Card */}
              <div
                style={{
                  background: "#f1f5f9",
                  borderRadius: "12px",
                  padding: "24px",
                  marginBottom: "24px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <h3
                  style={{
                    margin: "0 0 16px 0",
                    color: "#0f172a",
                    fontSize: "18px",
                  }}
                >
                  Trainer Information
                </h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#075985",
                        marginBottom: "4px",
                      }}
                    >
                      Full Name
                    </label>
                    <div
                      style={{
                        fontSize: "16px",
                        color: "#0c4a6e",
                        fontWeight: "500",
                      }}
                    >
                      {newTrainerCredentials.name}
                    </div>
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#075985",
                        marginBottom: "4px",
                      }}
                    >
                      Role
                    </label>
                    <div
                      style={{
                        fontSize: "16px",
                        color: "#0c4a6e",
                        textTransform: "capitalize",
                        fontWeight: "500",
                      }}
                    >
                      {newTrainerCredentials.role}
                    </div>
                  </div>
                </div>
              </div>

              {/* Login Credentials Card */}
              <div
                style={{
                  background: "#f1f5f9",
                  borderRadius: "12px",
                  padding: "24px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <h3
                  style={{
                    margin: "0 0 16px 0",
                    color: "#0f172a",
                    fontSize: "18px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  Login Credentials
                </h3>
                <div style={{ display: "grid", gap: "16px" }}>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#64748b",
                        marginBottom: "6px",
                      }}
                    >
                      Email / Login ID
                    </label>
                    <div
                      style={{
                        background: "white",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        fontSize: "16px",
                        color: "#0f172a",
                        fontWeight: "600",
                        border: "1px solid #e2e8f0",
                        fontFamily: "monospace",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {newTrainerCredentials.email}
                    </div>
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#64748b",
                        marginBottom: "6px",
                      }}
                    >
                      Password
                    </label>
                    <div
                      style={{
                        background: "white",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        fontSize: "16px",
                        color: "#0f172a",
                        fontWeight: "600",
                        border: "1px solid #e2e8f0",
                        fontFamily: "monospace",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {newTrainerCredentials.password}
                    </div>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div
                style={{
                  marginTop: "24px",
                  background: "#f9fafb",
                  borderRadius: "8px",
                  padding: "16px",
                }}
              >
                <h4
                  style={{
                    margin: "0 0 12px 0",
                    color: "#374151",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  How to Login:
                </h4>
                <ol
                  style={{
                    margin: 0,
                    paddingLeft: "20px",
                    color: "#6b7280",
                    fontSize: "14px",
                    lineHeight: "1.6",
                  }}
                >
                  <li>Go to the login page</li>
                  <li>Click on "Trainer / HR" tab</li>
                  <li>Enter the email and password shown above</li>
                  <li>Click "Sign In" to access the trainer dashboard</li>
                </ol>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowCredentialsModal(false)}
                style={{
                  width: "100%",
                  marginTop: "24px",
                  padding: "14px",
                  background: "#0f172a",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "transform 0.2s",
                }}
                onMouseEnter={(e) => (e.target.style.transform = "scale(1.02)")}
                onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
              >
                I've Saved the Credentials
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trainer Details Modal - Shows trainer info from table */}
      {selectedTrainerDetails && (
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
            zIndex: 1100,
          }}
          onClick={() => setSelectedTrainerDetails(null)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              maxWidth: "600px",
              width: "90%",
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                background: "#0f172a",
                padding: "24px",
                borderTopLeftRadius: "16px",
                borderTopRightRadius: "16px",
                color: "white",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "600" }}>
                  Trainer Details
                </h2>
                <button
                  onClick={() => setSelectedTrainerDetails(null)}
                  style={{
                    background: "rgba(255, 255, 255, 0.2)",
                    border: "none",
                    color: "white",
                    fontSize: "24px",
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.target.style.background = "rgba(255, 255, 255, 0.3)")
                  }
                  onMouseLeave={(e) =>
                    (e.target.style.background = "rgba(255, 255, 255, 0.2)")
                  }
                >
                  ×
                </button>
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: "32px" }}>
              {/* Info Cards */}
              <div style={{ display: "grid", gap: "16px" }}>
                <div
                  style={{
                    background: "#f8fafc",
                    borderRadius: "12px",
                    padding: "20px",
                  }}
                >
                  <h3
                    style={{
                      margin: "0 0 16px 0",
                      color: "#0c4a6e",
                      fontSize: "16px",
                    }}
                  >
                    Personal Information
                  </h3>
                  <div style={{ display: "grid", gap: "12px" }}>
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "#075985",
                          marginBottom: "4px",
                        }}
                      >
                        Full Name
                      </label>
                      <div style={{ fontSize: "15px", color: "#0c4a6e" }}>
                        {selectedTrainerDetails.name}
                      </div>
                    </div>
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "#075985",
                          marginBottom: "4px",
                        }}
                      >
                        Email Address
                      </label>
                      <div style={{ fontSize: "15px", color: "#0c4a6e" }}>
                        {selectedTrainerDetails.email}
                      </div>
                    </div>
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "#075985",
                          marginBottom: "4px",
                        }}
                      >
                        Mobile Number
                      </label>
                      <div style={{ fontSize: "15px", color: "#0c4a6e" }}>
                        {selectedTrainerDetails.mobile}
                      </div>
                    </div>
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "#075985",
                          marginBottom: "4px",
                        }}
                      >
                        Role
                      </label>
                      <div
                        style={{
                          fontSize: "15px",
                          color: "#0c4a6e",
                          textTransform: "capitalize",
                        }}
                      >
                        {selectedTrainerDetails.role}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    background: "#f8fafc",
                    borderRadius: "12px",
                    padding: "20px",
                  }}
                >
                  <h3
                    style={{
                      margin: "0 0 16px 0",
                      color: "#14532d",
                      fontSize: "16px",
                    }}
                  >
                    Assignment Information
                  </h3>
                  <div style={{ display: "grid", gap: "12px" }}>
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "#166534",
                          marginBottom: "4px",
                        }}
                      >
                        Assigned Students
                      </label>
                      <div style={{ fontSize: "15px", color: "#14532d" }}>
                        {selectedTrainerDetails.assignedStudents?.length || 0}{" "}
                        students
                      </div>
                    </div>
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "#166534",
                          marginBottom: "4px",
                        }}
                      >
                        Status
                      </label>
                      <div>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 12px",
                            borderRadius: "12px",
                            fontSize: "13px",
                            fontWeight: "600",
                            background:
                              selectedTrainerDetails.status === "Active"
                                ? "#dcfce7"
                                : "#fee2e2",
                            color:
                              selectedTrainerDetails.status === "Active"
                                ? "#166534"
                                : "#991b1b",
                          }}
                        >
                          {selectedTrainerDetails.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Login Info Note */}
                <div
                  style={{
                    background: "#fef3c7",
                    border: "1px solid #fbbf24",
                    borderRadius: "8px",
                    padding: "16px",
                  }}
                >
                  <div style={{ display: "flex", gap: "12px" }}>
                   
                    <div>
                      <strong
                        style={{
                          color: "#92400e",
                          display: "block",
                          marginBottom: "4px",
                          fontSize: "14px",
                        }}
                      >
                        Login Credentials
                      </strong>
                      <p
                        style={{
                          margin: 0,
                          color: "#78350f",
                          fontSize: "13px",
                          lineHeight: "1.5",
                        }}
                      >
                        Trainer can login using their email address:{" "}
                        <strong>{selectedTrainerDetails.email}</strong>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AccessManagement;
