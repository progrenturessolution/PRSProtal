import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { trainerAPI } from "../services/api";
import logo from "../assets/logo.png";
import TrainerSidebar from "../components/TrainerSidebar";

function TrainerDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedStudentTab, setSelectedStudentTab] = useState(null);
  const [studentFilter, setStudentFilter] = useState("all");
  const [studentSearch, setStudentSearch] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [recordError, setRecordError] = useState("");
  const [recordSuccess, setRecordSuccess] = useState("");
  const [recordSubmitting, setRecordSubmitting] = useState(false);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [interviews, setInterviews] = useState([]);
  const [aptitudes, setAptitudes] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [interviewFormData, setInterviewFormData] = useState({
    interviewType: "HR",
    attendanceStatus: "Present",
    date: "",
    attemptNumber: 1,
    communicationLevel: "",
    confidenceLevel: "",
    clarityLevel: "",
    overallLevel: "",
    levelCrossed: false,
    remarks: "",
  });
  const [aptitudeFormData, setAptitudeFormData] = useState({
    attendanceStatus: "Present",
    roundNumber: 1,
    score: "",
    result: "Pass",
    remarks: "",
  });
  const [assessmentFormData, setAssessmentFormData] = useState({
    attendanceStatus: "Present",
    assessmentType: "Domain",
    score: "",
    status: "Pending",
    feedback: "",
  });
  const [trainingFormData, setTrainingFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    attendance: "Present",
    skillImprovementNote: "",
    engagementLevel: "Medium",
    trainerRemarks: "",
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [location.search]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const userRole = localStorage.getItem("userRole");

    if (!storedUser || userRole !== "trainer") {
      navigate("/");
      return;
    }

    setUser(JSON.parse(storedUser));
    fetchAssignedStudents();
  }, [navigate]);

  useEffect(() => {
    if (!selectedStudent?._id) {
      return;
    }
    fetchStudentRecords(selectedStudent._id);
  }, [selectedStudent]);

  const fetchAssignedStudents = async () => {
    try {
      const response = await trainerAPI.getAssignedStudents();
      if (response.data.success) {
        setStudents(response.data.students);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentRecords = async (studentId) => {
    try {
      setRecordsLoading(true);
      const response = await trainerAPI.getStudentRecords(studentId);
      if (response.data.success) {
        const data = response.data.data || {};
        setInterviews(data.interviews || []);
        setAptitudes(data.aptitudes || []);
        setAssessments(data.assessments || []);
        setTrainings(data.trainings || []);
      }
    } catch (error) {
      console.error("Error fetching student records:", error);
      setRecordError("Failed to load student records");
    } finally {
      setRecordsLoading(false);
    }
  };

  const clearRecordMessages = () => {
    setRecordError("");
    setRecordSuccess("");
  };

  const handleInterviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent?._id) return;
    setRecordSubmitting(true);
    clearRecordMessages();
    try {
      const response = await trainerAPI.addInterview({
        studentId: selectedStudent._id,
        ...interviewFormData,
      });
      if (response.data.success) {
        setRecordSuccess("Interview record added successfully!");
        setInterviewFormData({
          interviewType: "HR",
          attendanceStatus: "Present",
          date: "",
          attemptNumber: 1,
          communicationLevel: "",
          confidenceLevel: "",
          clarityLevel: "",
          overallLevel: "",
          levelCrossed: false,
          remarks: "",
        });
        fetchStudentRecords(selectedStudent._id);
      }
    } catch (error) {
      setRecordError(error.response?.data?.message || "Failed to add interview record");
    } finally {
      setRecordSubmitting(false);
    }
  };

  const handleAptitudeSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent?._id) return;
    setRecordSubmitting(true);
    clearRecordMessages();
    try {
      const response = await trainerAPI.addAptitude({
        studentId: selectedStudent._id,
        ...aptitudeFormData,
      });
      if (response.data.success) {
        setRecordSuccess("Aptitude record added successfully!");
        setAptitudeFormData({
          attendanceStatus: "Present",
          roundNumber: 1,
          score: "",
          result: "Pass",
          remarks: "",
        });
        fetchStudentRecords(selectedStudent._id);
      }
    } catch (error) {
      setRecordError(error.response?.data?.message || "Failed to add aptitude record");
    } finally {
      setRecordSubmitting(false);
    }
  };

  const handleAssessmentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent?._id) return;
    setRecordSubmitting(true);
    clearRecordMessages();
    try {
      const response = await trainerAPI.addAssessment({
        studentId: selectedStudent._id,
        ...assessmentFormData,
      });
      if (response.data.success) {
        setRecordSuccess("Assessment record added successfully!");
        setAssessmentFormData({
          attendanceStatus: "Present",
          assessmentType: "Domain",
          score: "",
          status: "Pending",
          feedback: "",
        });
        fetchStudentRecords(selectedStudent._id);
      }
    } catch (error) {
      setRecordError(error.response?.data?.message || "Failed to add assessment record");
    } finally {
      setRecordSubmitting(false);
    }
  };

  const handleTrainingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent?._id) return;
    setRecordSubmitting(true);
    clearRecordMessages();
    try {
      const response = await trainerAPI.addTraining({
        studentId: selectedStudent._id,
        ...trainingFormData,
      });
      if (response.data.success) {
        setRecordSuccess("Training record added successfully!");
        setTrainingFormData({
          date: new Date().toISOString().split("T")[0],
          attendance: "Present",
          skillImprovementNote: "",
          engagementLevel: "Medium",
          trainerRemarks: "",
        });
        fetchStudentRecords(selectedStudent._id);
      }
    } catch (error) {
      setRecordError(error.response?.data?.message || "Failed to add training record");
    } finally {
      setRecordSubmitting(false);
    }
  };

  const handleUpdateStatus = async (studentId, newStatus) => {
    try {
      await trainerAPI.updateStudentStatus(studentId, newStatus);
      // Update local state
      setStudents(
        students.map((student) =>
          student._id === studentId
            ? { ...student, status: newStatus }
            : student,
        ),
      );
      setSuccessMessage(`Student marked as ${newStatus}`);
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (error) {
      console.error("Error updating student status:", error);
      alert("Failed to update student status");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const handleEditClick = () => {
    setEditFormData({
      name: user?.name || "",
      email: user?.email || "",
      mobile: user?.mobile || "",
      password: "",
      confirmPassword: "",
    });
    setEditError("");
    setShowEditModal(true);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError("");
    setEditLoading(true);

    // Validation
    if (!editFormData.name.trim()) {
      setEditError("Name is required");
      setEditLoading(false);
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (editFormData.email && !emailRegex.test(editFormData.email)) {
      setEditError("Please enter a valid email address");
      setEditLoading(false);
      return;
    }

    if (!editFormData.email.trim()) {
      setEditError("Email is required");
      setEditLoading(false);
      return;
    }

    // If password is provided, check if passwords match
    if (
      editFormData.password &&
      editFormData.password !== editFormData.confirmPassword
    ) {
      setEditError("Passwords do not match");
      setEditLoading(false);
      return;
    }

    try {
      const updateData = {
        name: editFormData.name,
        email: editFormData.email,
        mobile: editFormData.mobile,
      };

      // Only include password if provided
      if (editFormData.password) {
        updateData.password = editFormData.password;
      }

      const response = await trainerAPI.updateProfile(updateData);

      if (response.data.success) {
        // Update user in local state
        const updatedUser = response.data.user;
        setUser(updatedUser);

        // Update localStorage with new user data
        localStorage.setItem("user", JSON.stringify(updatedUser));

        setSuccessMessage("Profile updated successfully!");
        setTimeout(() => setSuccessMessage(""), 4000);
        setShowEditModal(false);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setEditError(error.response?.data?.message || "Failed to update profile");
    } finally {
      setEditLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setEditError("");
    setEditFormData({
      name: "",
      email: "",
      mobile: "",
      password: "",
      confirmPassword: "",
    });
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      {/* Mobile Menu Button */}
      <button 
        className="mobile-menu-btn" 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle Menu"
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <TrainerSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        selectedStudent={selectedStudent}
        setSelectedStudent={setSelectedStudent}
        selectedStudentTab={selectedStudentTab}
        setSelectedStudentTab={setSelectedStudentTab}
      />

      {/* Clean Enterprise Content */}
      <main className="main-content">
        <div className="dashboard-content">
          {activeTab === "overview" && (
            <>
              <div className="premium-page-header">
                <div className="header-left">
                  <h1>Dashboard</h1>
                  <p className="header-subtitle">Welcome back, {user?.name}</p>
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

              {/* Premium Stats Cards */}
              <div className="premium-stats-grid">
                <div
                  className="premium-stat-card accent-blue"
                  onClick={() => {
                    setActiveTab("students");
                    setStudentFilter("all");
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <div className="stat-icon-wrapper">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </div>
                  <div className="stat-content">
                    <div className="stat-label">Total Students</div>
                    <div className="stat-value">{students.length}</div>
                    <div className="stat-meta">Assigned to you</div>
                  </div>
                </div>

                <div
                  className="premium-stat-card accent-teal"
                  onClick={() => {
                    setActiveTab("students");
                    setStudentFilter("active");
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <div className="stat-icon-wrapper">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <div className="stat-content">
                    <div className="stat-label">Active Training</div>
                    <div className="stat-value">
                      {students.filter((s) => s.status === "active").length}
                    </div>
                    <div className="stat-meta">Currently enrolled</div>
                  </div>
                </div>

                <div
                  className="premium-stat-card accent-indigo"
                  onClick={() => {
                    setActiveTab("students");
                    setStudentFilter("completed");
                  }}
                  style={{ cursor: "pointer" }}
                >
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
                    <div className="stat-label">Completed</div>
                    <div className="stat-value">
                      {students.filter((s) => s.status === "completed").length}
                    </div>
                    <div className="stat-meta">Training finished</div>
                  </div>
                </div>

                <div className="premium-stat-card accent-slate">
                  <div className="stat-icon-wrapper">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="stat-content">
                    <div className="stat-label">Pending Reviews</div>
                    <div className="stat-value">0</div>
                    <div className="stat-meta">Awaiting feedback</div>
                  </div>
                </div>
              </div>

              {/* Premium Action Cards */}
              <div className="premium-action-grid">
                <div className="premium-action-card">
                  <div className="action-card-icon blue">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </div>
                  <div className="action-card-content">
                    <h3>Manage Students</h3>
                    <p>View and track student progress</p>
                  </div>
                  <button
                    className="action-card-btn"
                    onClick={() => setActiveTab("students")}
                  >
                    View
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === "students" && (
            <>
              <div className="premium-page-header">
                <div className="header-left">
                  <h1>Assigned Students</h1>
                  <p className="header-subtitle">
                    Search and manage your assigned students
                  </p>
                </div>
              </div>

              {successMessage && (
                <div className="success-message" style={{ marginBottom: "20px" }}>
                  {successMessage}
                </div>
              )}

              {/* Search + Filter Bar */}
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  marginBottom: "20px",
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                {/* Search Input */}
                <div
                  style={{
                    flex: "1",
                    minWidth: "220px",
                    position: "relative",
                  }}
                >
                  <svg
                    fill="none"
                    stroke="#9ca3af"
                    viewBox="0 0 24 24"
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "18px",
                      height: "18px",
                      pointerEvents: "none",
                    }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by name or student ID..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px 10px 38px",
                      borderRadius: "8px",
                      border: "1px solid #d1d5db",
                      fontSize: "14px",
                      background: "#fff",
                      boxSizing: "border-box",
                      outline: "none",
                    }}
                  />
                </div>

                {/* Status Filter */}
                <div style={{ position: "relative" }}>
                  <svg
                    fill="none"
                    stroke="#9ca3af"
                    viewBox="0 0 24 24"
                    style={{
                      position: "absolute",
                      left: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "16px",
                      height: "16px",
                      pointerEvents: "none",
                    }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"
                    />
                  </svg>
                  <select
                    value={studentFilter}
                    onChange={(e) => setStudentFilter(e.target.value)}
                    style={{
                      padding: "10px 12px 10px 32px",
                      borderRadius: "8px",
                      border: "1px solid #d1d5db",
                      fontSize: "14px",
                      background: "#fff",
                      cursor: "pointer",
                      appearance: "none",
                      minWidth: "160px",
                    }}
                  >
                    <option value="all">All Students</option>
                    <option value="active">Active Training</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                {/* Clear search button */}
                {studentSearch && (
                  <button
                    onClick={() => setStudentSearch("")}
                    style={{
                      padding: "10px 16px",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      background: "#f3f4f6",
                      color: "#6b7280",
                      fontSize: "13px",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    ✕ Clear
                  </button>
                )}
              </div>

              <div className="premium-card record-workspace">
                {(() => {
                  const q = studentSearch.trim().toLowerCase();
                  const filteredStudents = students.filter((student) => {
                    const matchesFilter =
                      studentFilter === "all" ||
                      student.status === (studentFilter === "active" ? "active" : "completed");
                    const matchesSearch =
                      !q ||
                      student.name?.toLowerCase().includes(q) ||
                      student.internId?.toLowerCase().includes(q) ||
                      student.email?.toLowerCase().includes(q);
                    return matchesFilter && matchesSearch;
                  });

                  return filteredStudents.length === 0 ? (
                    <div className="premium-empty-state">
                      <div className="empty-icon">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                          />
                        </svg>
                      </div>
                      <p className="empty-title">
                        {q ? `No students match "${studentSearch}"` : "No students assigned"}
                      </p>
                      <p className="empty-subtitle">
                        {q
                          ? "Try a different name or student ID"
                          : "Students assigned to you will appear here"}
                      </p>
                      {q && (
                        <button
                          onClick={() => setStudentSearch("")}
                          style={{
                            marginTop: "12px",
                            padding: "8px 20px",
                            borderRadius: "6px",
                            border: "none",
                            background: "linear-gradient(135deg, #667eea, #764ba2)",
                            color: "#fff",
                            cursor: "pointer",
                            fontSize: "14px",
                          }}
                        >
                          Clear Search
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Result count */}
                      <div
                        style={{
                          padding: "12px 20px",
                          borderBottom: "1px solid #f3f4f6",
                          fontSize: "13px",
                          color: "#6b7280",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "15px", height: "15px" }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        Showing <strong style={{ color: "#374151" }}>{filteredStudents.length}</strong> of{" "}
                        <strong style={{ color: "#374151" }}>{students.length}</strong> students
                        {q && (
                          <span style={{ marginLeft: "4px" }}>
                            for <em>"{studentSearch}"</em>
                          </span>
                        )}
                      </div>

                      <div style={{ overflowX: "auto" }}>
                        <table className="premium-table">
                          <thead>
                            <tr>
                              <th>Student</th>
                              <th>Student ID</th>
                              <th>Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredStudents.map((student) => {
                              const initials = student.name
                                ? student.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
                                : "S";
                              const isCompleted = student.status === "completed";
                              return (
                                <tr key={student._id}>
                                  {/* Student with avatar */}
                                  <td>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                      <div
                                        style={{
                                          width: "38px",
                                          height: "38px",
                                          borderRadius: "50%",
                                          background: "linear-gradient(135deg, #667eea, #764ba2)",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          color: "#fff",
                                          fontWeight: "700",
                                          fontSize: "13px",
                                          flexShrink: 0,
                                        }}
                                      >
                                        {initials}
                                      </div>
                                      <div>
                                        <div
                                          style={{ fontWeight: "600", color: "#1f2937", fontSize: "14px" }}
                                          dangerouslySetInnerHTML={{
                                            __html: q
                                              ? student.name?.replace(
                                                  new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"),
                                                  '<mark style="background:#fef08a;padding:0 2px;border-radius:2px">$1</mark>'
                                                )
                                              : student.name,
                                          }}
                                        />
                                        {student.email && (
                                          <div style={{ fontSize: "12px", color: "#9ca3af" }}>
                                            {student.email}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </td>

                                  {/* Student ID with highlight */}
                                  <td>
                                    <span
                                      className="mono-text"
                                      style={{ fontSize: "13px" }}
                                      dangerouslySetInnerHTML={{
                                        __html: q
                                          ? student.internId?.replace(
                                              new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"),
                                              '<mark style="background:#fef08a;padding:0 2px;border-radius:2px">$1</mark>'
                                            )
                                          : student.internId,
                                      }}
                                    />
                                  </td>

                                  {/* Status badge */}
                                  <td>
                                    <span
                                      style={{
                                        display: "inline-block",
                                        padding: "3px 10px",
                                        borderRadius: "999px",
                                        fontSize: "12px",
                                        fontWeight: "600",
                                        background: isCompleted ? "#d1fae5" : "#dbeafe",
                                        color: isCompleted ? "#065f46" : "#1e40af",
                                      }}
                                    >
                                      {isCompleted ? "Completed" : "Active"}
                                    </span>
                                  </td>

                                  {/* Actions */}
                                  <td>
                                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                      <button
                                        onClick={() => {
                                          setSelectedStudent(student);
                                          setSelectedStudentTab('interviews');
                                          setActiveTab('student-records');
                                        }}
                                        className="table-action-btn"
                                        style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', fontWeight: '600' }}
                                      >
                                        View Student
                                      </button>
                                      {!isCompleted ? (
                                        <button
                                          onClick={() => handleUpdateStatus(student._id, "completed")}
                                          className="table-action-btn"
                                          style={{ background: "#3b82f6" }}
                                        >
                                          Mark Completed
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => handleUpdateStatus(student._id, "active")}
                                          className="table-action-btn"
                                          style={{ background: "#10b981" }}
                                        >
                                          Mark Active
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  );
                })()}
              </div>
            </>
          )}

          {activeTab === "student-records" && selectedStudent && (
            <>
              <div className="premium-page-header">
                <div className="header-left">
                  <h1>{selectedStudent.name}</h1>
                  <p className="header-subtitle">
                    Student ID: {selectedStudent.internId} | {selectedStudent.email}
                  </p>
                </div>
                <div className="header-right">
                  <button
                    onClick={() => {
                      setSelectedStudent(null);
                      setSelectedStudentTab(null);
                      setActiveTab("students");
                    }}
                    className="premium-btn-secondary"
                  >
                    ← Back to Students
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="premium-card record-workspace">
                {recordsLoading && (
                  <div className="premium-empty-state">
                    <p className="empty-title">Loading records...</p>
                  </div>
                )}

                {!recordsLoading && recordError && (
                  <div className="error-message" style={{ margin: "20px" }}>{recordError}</div>
                )}

                {!recordsLoading && recordSuccess && (
                  <div className="success-message" style={{ margin: "20px" }}>{recordSuccess}</div>
                )}

                {!recordsLoading && selectedStudentTab === "interviews" && (
                  <div className="record-section">
                    <h2 className="record-form-title">Add Interview Record</h2>
                    <div className="record-intro-card">
                      <strong>Interview Evaluation</strong>
                      <p>Fill detailed interview performance for this student and save it to history.</p>
                    </div>
                    <form onSubmit={handleInterviewSubmit} className="record-form-grid">
                      <div className="form-group">
                        <label>Interview Type *</label>
                        <select
                          name="interviewType"
                          value={interviewFormData.interviewType}
                          onChange={(e) => setInterviewFormData({ ...interviewFormData, [e.target.name]: e.target.value })}
                          required
                        >
                          <option value="HR">HR</option>
                          <option value="Technical">Technical</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Attendance *</label>
                        <select
                          name="attendanceStatus"
                          value={interviewFormData.attendanceStatus}
                          onChange={(e) => setInterviewFormData({ ...interviewFormData, [e.target.name]: e.target.value })}
                          required
                        >
                          <option value="Present">Present</option>
                          <option value="Absent">Absent</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Date *</label>
                        <input
                          type="date"
                          name="date"
                          value={interviewFormData.date}
                          onChange={(e) => setInterviewFormData({ ...interviewFormData, [e.target.name]: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Attempt Number *</label>
                        <input
                          type="number"
                          name="attemptNumber"
                          value={interviewFormData.attemptNumber}
                          onChange={(e) => setInterviewFormData({ ...interviewFormData, [e.target.name]: e.target.value })}
                          min="1"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Communication Level *</label>
                        <select
                          name="communicationLevel"
                          value={interviewFormData.communicationLevel}
                          onChange={(e) => setInterviewFormData({ ...interviewFormData, [e.target.name]: e.target.value })}
                          required
                        >
                          <option value="">Select Level</option>
                          <option value="B">B - Beginner</option>
                          <option value="I">I - Intermediate</option>
                          <option value="A">A - Advanced</option>
                          <option value="E">E - Expert</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Confidence Level *</label>
                        <select
                          name="confidenceLevel"
                          value={interviewFormData.confidenceLevel}
                          onChange={(e) => setInterviewFormData({ ...interviewFormData, [e.target.name]: e.target.value })}
                          required
                        >
                          <option value="">Select Level</option>
                          <option value="B">B - Beginner</option>
                          <option value="I">I - Intermediate</option>
                          <option value="A">A - Advanced</option>
                          <option value="E">E - Expert</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Clarity Level *</label>
                        <select
                          name="clarityLevel"
                          value={interviewFormData.clarityLevel}
                          onChange={(e) => setInterviewFormData({ ...interviewFormData, [e.target.name]: e.target.value })}
                          required
                        >
                          <option value="">Select Level</option>
                          <option value="B">B - Beginner</option>
                          <option value="I">I - Intermediate</option>
                          <option value="A">A - Advanced</option>
                          <option value="E">E - Expert</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Overall Level *</label>
                        <select
                          name="overallLevel"
                          value={interviewFormData.overallLevel}
                          onChange={(e) => setInterviewFormData({ ...interviewFormData, [e.target.name]: e.target.value })}
                          required
                        >
                          <option value="">Select Level</option>
                          <option value="F">F - Fail</option>
                          <option value="C">C - Clear</option>
                          <option value="P">P - Pass</option>
                          <option value="E">E - Excellent</option>
                        </select>
                      </div>
                      <div className="form-group left-align">
                        <label className="checkbox-label record-checkbox-label">
                          <input
                            type="checkbox"
                            name="levelCrossed"
                            checked={interviewFormData.levelCrossed}
                            onChange={(e) => setInterviewFormData({ ...interviewFormData, levelCrossed: e.target.checked })}
                            className="record-checkbox-input"
                          />
                          Level Crossed?
                        </label>
                      </div>
                      <div className="form-group">
                        <label>Remarks</label>
                        <textarea
                          name="remarks"
                          value={interviewFormData.remarks}
                          onChange={(e) => setInterviewFormData({ ...interviewFormData, [e.target.name]: e.target.value })}
                          rows="4"
                        />
                      </div>
                      <button type="submit" className="submit-btn record-submit-btn record-submit-btn-compact" disabled={recordSubmitting}>
                        {recordSubmitting ? "Saving..." : "Save Interview Record"}
                      </button>
                    </form>

                    <div className="record-history">
                      <h2 className="record-history-title">Interview History</h2>
                      {interviews.length === 0 ? (
                        <p>No interview records yet</p>
                      ) : (
                        <div className="record-table-wrap">
                          <table className="premium-table">
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Attendance</th>
                                <th>Attempt</th>
                                <th>Communication</th>
                                <th>Confidence</th>
                                <th>Clarity</th>
                                <th>Overall</th>
                                <th>Level Crossed</th>
                              </tr>
                            </thead>
                            <tbody>
                              {interviews.map((interview, index) => (
                                <tr key={index}>
                                  <td>{new Date(interview.date).toLocaleDateString()}</td>
                                  <td>{interview.interviewType}</td>
                                  <td>{interview.attendanceStatus || "-"}</td>
                                  <td>{interview.attemptNumber}</td>
                                  <td>{interview.communicationLevel}</td>
                                  <td>{interview.confidenceLevel}</td>
                                  <td>{interview.clarityLevel}</td>
                                  <td>{interview.overallLevel}</td>
                                  <td>{interview.levelCrossed ? "Yes" : "No"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!recordsLoading && selectedStudentTab === "aptitude" && (
                  <div className="record-section">
                    <h2 className="record-form-title">Add Aptitude Record</h2>
                    <div className="record-intro-card">
                      <strong>Aptitude Round Entry</strong>
                      <p>Capture round score, result, and trainer remarks in one place.</p>
                    </div>
                    <form onSubmit={handleAptitudeSubmit} className="record-form-grid">
                      <div className="form-group">
                        <label>Attendance *</label>
                        <select
                          name="attendanceStatus"
                          value={aptitudeFormData.attendanceStatus}
                          onChange={(e) => setAptitudeFormData({ ...aptitudeFormData, [e.target.name]: e.target.value })}
                          required
                        >
                          <option value="Present">Present</option>
                          <option value="Absent">Absent</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Aptitude Round Number *</label>
                        <input
                          type="number"
                          name="roundNumber"
                          value={aptitudeFormData.roundNumber}
                          onChange={(e) => setAptitudeFormData({ ...aptitudeFormData, [e.target.name]: e.target.value })}
                          min="1"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Score *</label>
                        <input
                          type="number"
                          name="score"
                          value={aptitudeFormData.score}
                          onChange={(e) => setAptitudeFormData({ ...aptitudeFormData, [e.target.name]: e.target.value })}
                          min="0"
                          max="100"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Result *</label>
                        <select
                          name="result"
                          value={aptitudeFormData.result}
                          onChange={(e) => setAptitudeFormData({ ...aptitudeFormData, [e.target.name]: e.target.value })}
                          required
                        >
                          <option value="Pass">Pass</option>
                          <option value="Improve">Improve</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Remarks</label>
                        <textarea
                          name="remarks"
                          value={aptitudeFormData.remarks}
                          onChange={(e) => setAptitudeFormData({ ...aptitudeFormData, [e.target.name]: e.target.value })}
                          rows="4"
                        />
                      </div>
                      <button type="submit" className="submit-btn record-submit-btn record-submit-btn-compact" disabled={recordSubmitting}>
                        {recordSubmitting ? "Saving..." : "Save Aptitude Record"}
                      </button>
                    </form>

                    <div className="record-history">
                      <h2 className="record-history-title">Aptitude Test History</h2>
                      {aptitudes.length === 0 ? (
                        <p>No aptitude records yet</p>
                      ) : (
                        <div className="record-table-wrap">
                          <table className="premium-table">
                            <thead>
                              <tr>
                                <th>Attendance</th>
                                <th>Round Number</th>
                                <th>Score</th>
                                <th>Result</th>
                                <th>Remarks</th>
                                <th>Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {aptitudes.map((apt, index) => (
                                <tr key={index}>
                                  <td>{apt.attendanceStatus || "-"}</td>
                                  <td>{apt.roundNumber}</td>
                                  <td>{apt.score}</td>
                                  <td>{apt.result}</td>
                                  <td>{apt.remarks || "-"}</td>
                                  <td>{new Date(apt.createdAt).toLocaleDateString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!recordsLoading && selectedStudentTab === "assessments" && (
                  <div className="record-section">
                    <h2 className="record-form-title">Add Assessment Record</h2>
                    <div className="record-intro-card">
                      <strong>Assessment Review</strong>
                      <p>Record assessment type, score, status, and actionable feedback.</p>
                    </div>
                    <form onSubmit={handleAssessmentSubmit} className="record-form-grid">
                      <div className="form-group">
                        <label>Attendance *</label>
                        <select
                          name="attendanceStatus"
                          value={assessmentFormData.attendanceStatus}
                          onChange={(e) => setAssessmentFormData({ ...assessmentFormData, [e.target.name]: e.target.value })}
                          required
                        >
                          <option value="Present">Present</option>
                          <option value="Absent">Absent</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Assessment Type *</label>
                        <select
                          name="assessmentType"
                          value={assessmentFormData.assessmentType}
                          onChange={(e) => setAssessmentFormData({ ...assessmentFormData, [e.target.name]: e.target.value })}
                          required
                        >
                          <option value="Domain">Domain</option>
                          <option value="Coding">Coding</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Score</label>
                        <input
                          type="number"
                          name="score"
                          value={assessmentFormData.score}
                          onChange={(e) => setAssessmentFormData({ ...assessmentFormData, [e.target.name]: e.target.value })}
                          min="0"
                          max="100"
                        />
                      </div>
                      <div className="form-group">
                        <label>Status *</label>
                        <select
                          name="status"
                          value={assessmentFormData.status}
                          onChange={(e) => setAssessmentFormData({ ...assessmentFormData, [e.target.name]: e.target.value })}
                          required
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Pass">Pass</option>
                          <option value="Fail">Fail</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Feedback</label>
                        <textarea
                          name="feedback"
                          value={assessmentFormData.feedback}
                          onChange={(e) => setAssessmentFormData({ ...assessmentFormData, [e.target.name]: e.target.value })}
                          rows="4"
                        />
                      </div>
                      <button type="submit" className="submit-btn record-submit-btn record-submit-btn-compact" disabled={recordSubmitting}>
                        {recordSubmitting ? "Saving..." : "Save Assessment Record"}
                      </button>
                    </form>

                    <div className="record-history">
                      <h2 className="record-history-title">Assessment History</h2>
                      {assessments.length === 0 ? (
                        <p>No assessment records yet</p>
                      ) : (
                        <div className="record-table-wrap">
                          <table className="premium-table">
                            <thead>
                              <tr>
                                <th>Attendance</th>
                                <th>Type</th>
                                <th>Score</th>
                                <th>Status</th>
                                <th>Feedback</th>
                                <th>Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {assessments.map((assessment, index) => (
                                <tr key={index}>
                                  <td>{assessment.attendanceStatus || "-"}</td>
                                  <td>{assessment.assessmentType}</td>
                                  <td>{assessment.score || "-"}</td>
                                  <td>{assessment.status}</td>
                                  <td>{assessment.feedback || "-"}</td>
                                  <td>{new Date(assessment.createdAt).toLocaleDateString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!recordsLoading && selectedStudentTab === "training" && (
                  <div className="record-section">
                    <h2 className="record-form-title">Add Training Record</h2>
                    <div className="record-intro-card">
                      <strong>Training Session Update</strong>
                      <p>Log attendance, engagement, improvement notes, and session remarks.</p>
                    </div>
                    <form onSubmit={handleTrainingSubmit} className="record-form-grid">
                      <div className="form-group">
                        <label>Date *</label>
                        <input
                          type="date"
                          name="date"
                          value={trainingFormData.date}
                          onChange={(e) => setTrainingFormData({ ...trainingFormData, [e.target.name]: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Attendance *</label>
                        <select
                          name="attendance"
                          value={trainingFormData.attendance}
                          onChange={(e) => setTrainingFormData({ ...trainingFormData, [e.target.name]: e.target.value })}
                          required
                        >
                          <option value="Present">Present</option>
                          <option value="Absent">Absent</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Skill Improvement Note</label>
                        <textarea
                          name="skillImprovementNote"
                          value={trainingFormData.skillImprovementNote}
                          onChange={(e) => setTrainingFormData({ ...trainingFormData, [e.target.name]: e.target.value })}
                          rows="3"
                        />
                      </div>
                      <div className="form-group">
                        <label>Engagement Level *</label>
                        <select
                          name="engagementLevel"
                          value={trainingFormData.engagementLevel}
                          onChange={(e) => setTrainingFormData({ ...trainingFormData, [e.target.name]: e.target.value })}
                          required
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Excellent">Excellent</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Trainer Remarks</label>
                        <textarea
                          name="trainerRemarks"
                          value={trainingFormData.trainerRemarks}
                          onChange={(e) => setTrainingFormData({ ...trainingFormData, [e.target.name]: e.target.value })}
                          rows="4"
                        />
                      </div>
                      <button type="submit" className="submit-btn record-submit-btn record-submit-btn-compact" disabled={recordSubmitting}>
                        {recordSubmitting ? "Saving..." : "Save Training Record"}
                      </button>
                    </form>

                    <div className="record-history">
                      <h2 className="record-history-title">Training History</h2>
                      {trainings.length === 0 ? (
                        <p>No training records yet</p>
                      ) : (
                        <div className="record-table-wrap">
                          <table className="premium-table">
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Attendance</th>
                                <th>Engagement Level</th>
                                <th>Skill Improvement</th>
                                <th>Remarks</th>
                              </tr>
                            </thead>
                            <tbody>
                              {trainings.map((training, index) => (
                                <tr key={index}>
                                  <td>{new Date(training.date).toLocaleDateString()}</td>
                                  <td>{training.attendance}</td>
                                  <td>{training.engagementLevel}</td>
                                  <td>{training.skillImprovementNote || "-"}</td>
                                  <td>{training.trainerRemarks || "-"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === "notifications" && (
            <>
              <div className="premium-page-header">
                <div className="header-left">
                  <h1>Notifications</h1>
                  <p className="header-subtitle">
                    Stay updated with recent activities
                  </p>
                </div>
              </div>

              <div className="premium-card">
                <div className="premium-empty-state">
                  <div className="empty-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                  </div>
                  <p className="empty-title">No notifications</p>
                  <p className="empty-subtitle">
                    You're all caught up! New updates will appear here
                  </p>
                </div>
              </div>
            </>
          )}

          {activeTab === "profile" && (
            <>
              <div className="premium-page-header">
                <div className="header-left">
                  <h1>My Profile</h1>
                  <p className="header-subtitle">
                    Manage your personal information
                  </p>
                </div>
                <div className="header-right">
                  <button
                    className="premium-btn-secondary"
                    onClick={handleEditClick}
                  >
                    Edit Profile
                  </button>
                </div>
              </div>

              {successMessage && (
                <div
                  className="success-message"
                  style={{ marginBottom: "20px" }}
                >
                  {successMessage}
                </div>
              )}

              <div className="premium-card">
                <div className="premium-card-header">
                  <h2>Personal Information</h2>
                </div>

                <div className="profile-info-grid">
                  <div className="profile-field">
                    <label>Full Name</label>
                    <div className="field-value">{user?.name}</div>
                  </div>
                  <div className="profile-field">
                    <label>Email Address</label>
                    <div className="field-value mono-text">{user?.email}</div>
                  </div>
                  <div className="profile-field">
                    <label>Mobile Number</label>
                    <div className="field-value mono-text">
                      {user?.mobile || "Not available"}
                    </div>
                  </div>
                  <div className="profile-field">
                    <label>Role</label>
                    <div className="field-value">
                      <span className="badge-neutral">
                        {user?.role || "Trainer"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="info-banner">
                  <strong>Update Your Information</strong>
                  <p>
                    Click the "Edit Profile" button above to update your name,
                    email, mobile number, or password.
                  </p>
                </div>
              </div>

              {/* Edit Profile Modal */}
              {showEditModal && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                  <div
                    className="modal-content"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="modal-header">
                      <h2>Edit Profile</h2>
                      <button
                        className="modal-close-btn"
                        onClick={handleCloseModal}
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleEditSubmit}>
                      {editError && (
                        <div
                          className="error-message"
                          style={{ marginBottom: "15px" }}
                        >
                          {editError}
                        </div>
                      )}

                      <div className="form-group">
                        <label htmlFor="edit-name">Full Name *</label>
                        <input
                          id="edit-name"
                          type="text"
                          name="name"
                          value={editFormData.name}
                          onChange={handleEditInputChange}
                          placeholder="Enter your full name"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="edit-email">Email Address *</label>
                        <input
                          id="edit-email"
                          type="email"
                          name="email"
                          value={editFormData.email}
                          onChange={handleEditInputChange}
                          placeholder="Enter your email address"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="edit-mobile">Mobile Number</label>
                        <input
                          id="edit-mobile"
                          type="tel"
                          name="mobile"
                          value={editFormData.mobile}
                          onChange={handleEditInputChange}
                          placeholder="Enter your mobile number"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="edit-password">
                          New Password (Optional)
                        </label>
                        <input
                          id="edit-password"
                          type="password"
                          name="password"
                          value={editFormData.password}
                          onChange={handleEditInputChange}
                          placeholder="Leave blank to keep current password"
                        />
                      </div>

                      {editFormData.password && (
                        <div className="form-group">
                          <label htmlFor="edit-confirm-password">
                            Confirm Password *
                          </label>
                          <input
                            id="edit-confirm-password"
                            type="password"
                            name="confirmPassword"
                            value={editFormData.confirmPassword}
                            onChange={handleEditInputChange}
                            placeholder="Confirm your new password"
                            required={!!editFormData.password}
                          />
                        </div>
                      )}

                      <div className="modal-actions">
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={handleCloseModal}
                          disabled={editLoading}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn-primary"
                          disabled={editLoading}
                        >
                          {editLoading ? "Saving..." : "Save Changes"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default TrainerDashboard;
