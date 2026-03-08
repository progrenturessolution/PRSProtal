import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { taskAPI, internAPI, UPLOADS_BASE } from "../services/api";
import TeamTasks from "./TeamTasks";
import logo from "../assets/logo.png";

function InternDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [documents, setDocuments] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [aptitude, setAptitude] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [jobPostings, setJobPostings] = useState([]);
  const [assignedCerts, setAssignedCerts] = useState([]);
  const [taskView, setTaskView] = useState("individual");
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    const userRole = localStorage.getItem("userRole");

    if (!token || !userData || userRole !== "intern") {
      navigate("/");
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== "intern") {
      navigate("/");
      return;
    }

    setUser(parsedUser);
    fetchProfile();
    fetchTasks();
  }, [navigate]);

  const fetchProfile = async () => {
    try {
      const response = await internAPI.getMyProfile();
      if (response.data.success) {
        setUser((prevUser) => ({ ...prevUser, ...response.data.user }));
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await taskAPI.getInternTasks();
      setTasks(response.data.tasks);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleProgressUpdate = async (taskId, newProgress) => {
    try {
      await taskAPI.updateTaskProgress(taskId, newProgress);
      setTasks(
        tasks.map((task) => {
          if (task._id === taskId) {
            let newStatus = task.status;
            if (newProgress === 0) newStatus = "Assigned";
            else if (newProgress > 0 && newProgress < 100)
              newStatus = "In Progress";
            else if (newProgress === 100) newStatus = "Pending Approval";

            return { ...task, progress: newProgress, status: newStatus };
          }
          return task;
        }),
      );
    } catch (err) {
      setError("Failed to update progress");
      console.error(err);
      setTimeout(() => setError(""), 4000);
    }
  };

  const handleSectionClick = async (section) => {
    setActiveSection(section);
    setSidebarOpen(false);

    // Fetch data when clicking on sections
    try {
      switch (section) {
        case "documents":
          const docResp = await internAPI.getMyDocuments();
          if (docResp.data && docResp.data.success) {
            setDocuments(docResp.data.documents || null);
          }
          try {
            const certResp = await internAPI.getMyAssignedCertificates();
            if (certResp.data && certResp.data.success) {
              setAssignedCerts(certResp.data.certificates || []);
            }
          } catch (e) {
            console.error("Failed to fetch assigned certs:", e);
          }
          break;
        case "interviews":
          const intResp = await internAPI.getMyInterviews();
          if (intResp.data && intResp.data.success) {
            setInterviews(intResp.data.interviews || []);
          }
          break;
        case "assessments":
          const aptResp = await internAPI.getMyAptitude();
          const assResp = await internAPI.getMyAssessments();
          if (aptResp.data && aptResp.data.success) {
            setAptitude(aptResp.data.aptitudeRecords || []);
          }
          if (assResp.data && assResp.data.success) {
            setAssessments(assResp.data.assessments || []);
          }
          break;
        case "notifications":
          const notifResp = await internAPI.getMyNotifications();
          if (notifResp.data && notifResp.data.success) {
            setNotifications(notifResp.data.notifications || []);
          }
          break;
        case "jobs":
          const jobsResp = await internAPI.getMyJobPostings();
          if (jobsResp.data && jobsResp.data.success) {
            setJobPostings(jobsResp.data.postings || []);
          }
          break;
      }
    } catch (err) {
      console.error(`Failed to fetch ${section}:`, err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Assigned":
        return "#94a3b8";
      case "In Progress":
        return "#3b82f6";
      case "Pending Approval":
        return "#f59e0b";
      case "Completed":
        return "#10b981";
      default:
        return "#64748b";
    }
  };

  const formatDeadline = (deadline) => {
    return new Date(deadline).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const isOverdue = (deadline) => {
    return new Date(deadline) < new Date();
  };

  const getTaskStats = () => {
    const individualTasks = tasks.filter((t) => !t.isTeamTask);
    const teamTasks = tasks.filter((t) => t.isTeamTask);

    return {
      total: tasks.length,
      individual: individualTasks.length,
      team: teamTasks.length,
      assigned: tasks.filter((t) => t.status === "Assigned").length,
      inProgress: tasks.filter((t) => t.status === "In Progress").length,
      pendingApproval: tasks.filter((t) => t.status === "Pending Approval")
        .length,
      completed: tasks.filter((t) => t.status === "Completed").length,
    };
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard">
      {/* Mobile Menu Button */}
      <button
        className="mobile-menu-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle Menu"
      >
        <svg
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          width="24"
          height="24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo-container">
            <img src={logo} alt="Progrentures" className="sidebar-logo" />
          </div>
          <h2>PROGRENTURES</h2>
          <p>Student Portal</p>
        </div>

        <div
          style={{
            padding: "20px",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div style={{ fontSize: "14px", opacity: 0.7, marginBottom: "5px" }}>
            Welcome,
          </div>
          <div style={{ fontSize: "16px", fontWeight: 600 }}>{user.name}</div>
          <div style={{ fontSize: "13px", opacity: 0.7, marginTop: "5px" }}>
            {user.internId}
          </div>
        </div>

        <ul className="sidebar-menu">
          {/* Overview */}
          <li className="menu-section-header">OVERVIEW</li>
          <li
            className={activeSection === "dashboard" ? "active" : ""}
            onClick={() => handleSectionClick("dashboard")}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z"
              />
            </svg>
            Dashboard Overview
          </li>

          {/* My Progress */}
          <li className="menu-section-header">MY PROGRESS</li>
          <li
            className={activeSection === "profile" ? "active" : ""}
            onClick={() => handleSectionClick("profile")}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            My Profile
          </li>
          <li
            className={activeSection === "program" ? "active" : ""}
            onClick={() => handleSectionClick("program")}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            My Program
          </li>
          <li
            className={activeSection === "tasks" ? "active" : ""}
            onClick={() => handleSectionClick("tasks")}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            Tasks/Projects
          </li>

          {/* Assessments */}
          <li className="menu-section-header">ASSESSMENTS</li>
          <li
            className={activeSection === "interviews" ? "active" : ""}
            onClick={() => handleSectionClick("interviews")}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            Interviews
          </li>
          <li
            className={activeSection === "assessments" ? "active" : ""}
            onClick={() => handleSectionClick("assessments")}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
            Aptitude & Assessments
          </li>

          {/* Resources */}
          <li className="menu-section-header">RESOURCES</li>
          <li
            className={activeSection === "documents" ? "active" : ""}
            onClick={() => handleSectionClick("documents")}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Certificates/Documents
          </li>
          <li
            className={activeSection === "notifications" ? "active" : ""}
            onClick={() => handleSectionClick("notifications")}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-5 5v-5zM4.868 12.683A17.925 17.925 0 012 21h9a3 3 0 003-3v-8a3 3 0 00-.879-2.122l-3.54-3.54A3 3 0 008.12 3H5a3 3 0 00-3 3v11.586a1 1 0 00.293.707l3.414 3.414z"
              />
            </svg>
            Notifications
          </li>
          <li
            className={activeSection === "jobs" ? "active" : ""}
            onClick={() => handleSectionClick("jobs")}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Job & Internship Updates
          </li>
        </ul>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main className="main-content">
        {/* Dashboard Overview Section */}
        {activeSection === "dashboard" && (
          <>
            <div className="premium-page-header">
              <div className="header-left">
                <h1>Student Dashboard</h1>
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

            {/* Task Statistics */}
            <div className="premium-stats-grid">
              <div className="premium-stat-card accent-blue">
                <div className="stat-icon-wrapper">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <div className="stat-content">
                  <div className="stat-label">Total Tasks</div>
                  <div className="stat-value">{getTaskStats().total}</div>
                  <div className="stat-meta">All assigned tasks</div>
                </div>
              </div>

              <div className="premium-stat-card accent-teal">
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
                  <div className="stat-label">In Progress</div>
                  <div className="stat-value">{getTaskStats().inProgress}</div>
                  <div className="stat-meta">Currently working</div>
                </div>
              </div>

              <div className="premium-stat-card accent-indigo">
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
                  <div className="stat-label">Pending Approval</div>
                  <div className="stat-value">
                    {getTaskStats().pendingApproval}
                  </div>
                  <div className="stat-meta">Awaiting review</div>
                </div>
              </div>

              <div className="premium-stat-card accent-slate">
                <div className="stat-icon-wrapper">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="stat-content">
                  <div className="stat-label">Completed</div>
                  <div className="stat-value">{getTaskStats().completed}</div>
                  <div className="stat-meta">Successfully finished</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="premium-action-grid">
              <div className="premium-action-card">
                <div className="action-card-icon blue">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <div className="action-card-content">
                  <h3>View Tasks</h3>
                  <p>Check your assigned tasks and projects</p>
                </div>
                <button
                  className="action-card-btn"
                  onClick={() => setActiveSection("tasks")}
                >
                  View
                </button>
              </div>

              <div className="premium-action-card">
                <div className="action-card-icon teal">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <div className="action-card-content">
                  <h3>Notifications</h3>
                  <p>View important announcements and updates</p>
                </div>
                <button
                  className="action-card-btn"
                  onClick={() => setActiveSection("notifications")}
                >
                  Check
                </button>
              </div>

              <div className="premium-action-card">
                <div className="action-card-icon indigo">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <div className="action-card-content">
                  <h3>Job Opportunities</h3>
                  <p>Explore available job and internship positions</p>
                </div>
                <button
                  className="action-card-btn"
                  onClick={() => setActiveSection("jobs")}
                >
                  Explore
                </button>
              </div>
            </div>
          </>
        )}

        {/* My Profile Section */}
        {activeSection === "profile" && (
          <>
            <div className="content-header">
              <h1>My Profile</h1>
              <p>Your personal and professional information</p>
            </div>

            <div className="card">
              <h2>Personal Details</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>Name</label>
                  <div
                    style={{
                      padding: "12px",
                      backgroundColor: "#f8fafc",
                      borderRadius: "6px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    {user.name}
                  </div>
                </div>
                <div className="form-group">
                  <label>Student ID</label>
                  <div
                    style={{
                      padding: "12px",
                      backgroundColor: "#f8fafc",
                      borderRadius: "6px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    {user.internId}
                  </div>
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <div
                    style={{
                      padding: "12px",
                      backgroundColor: "#f8fafc",
                      borderRadius: "6px",
                      border: "1px solid #e2e8f0",
                      wordBreak: "break-all",
                    }}
                  >
                    {user.email}
                  </div>
                </div>
                <div className="form-group">
                  <label>Mobile</label>
                  <div
                    style={{
                      padding: "12px",
                      backgroundColor: "#f8fafc",
                      borderRadius: "6px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    {user.mobile || "Not provided"}
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <h2>Current Designation & Program</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>Current Designation</label>
                  <div
                    style={{
                      padding: "12px",
                      backgroundColor: "#f8fafc",
                      borderRadius: "6px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    {user.currentDesignation || "Not specified"}
                  </div>
                </div>
                <div className="form-group">
                  <label>Program</label>
                  <div
                    style={{
                      padding: "12px",
                      backgroundColor: "#f8fafc",
                      borderRadius: "6px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    {user.studentType || "Not specified"}
                  </div>
                </div>
                <div className="form-group">
                  <label>Technology</label>
                  <div
                    style={{
                      padding: "12px",
                      backgroundColor: "#f8fafc",
                      borderRadius: "6px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    {user.domain || "Not specified"}
                  </div>
                </div>
                <div className="form-group">
                  <label>Start Date</label>
                  <div
                    style={{
                      padding: "12px",
                      backgroundColor: "#f8fafc",
                      borderRadius: "6px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    {user.joiningDate
                      ? new Date(user.joiningDate).toLocaleDateString()
                      : "Not specified"}
                  </div>
                </div>
                <div className="form-group">
                  <label>Student Type</label>
                  <div
                    style={{
                      padding: "12px",
                      backgroundColor: "#f8fafc",
                      borderRadius: "6px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    {user.studentType}
                  </div>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <div
                    style={{
                      padding: "12px",
                      backgroundColor: "#f8fafc",
                      borderRadius: "6px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    {user.status || "Active"}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* My Program Section */}
        {activeSection === "program" && (
          <>
            <div className="content-header">
              <h1>My Program</h1>
              <p>Program enrollment and details</p>
            </div>

            <div className="card">
              {user.studentType === "Internship" ? (
                <>
                  <h2>Internship Details</h2>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Domain</label>
                      <div
                        style={{
                          padding: "12px",
                          backgroundColor: "#f8fafc",
                          borderRadius: "6px",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        {user.domain || "Not Specified"}
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Duration</label>
                      <div
                        style={{
                          padding: "12px",
                          backgroundColor: "#f8fafc",
                          borderRadius: "6px",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        {user.duration || "Not Specified"}
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Start Date</label>
                      <div
                        style={{
                          padding: "12px",
                          backgroundColor: "#f8fafc",
                          borderRadius: "6px",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        {user.joiningDate
                          ? new Date(user.joiningDate).toLocaleDateString()
                          : "Not Set"}
                      </div>
                    </div>
                    <div className="form-group">
                      <label>End Date</label>
                      <div
                        style={{
                          padding: "12px",
                          backgroundColor: "#f8fafc",
                          borderRadius: "6px",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        {user.endingDate
                          ? new Date(user.endingDate).toLocaleDateString()
                          : "Not Set"}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h2>SMS Program Details</h2>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Payment Status</label>
                      <div
                        style={{
                          padding: "12px",
                          backgroundColor: "#f8fafc",
                          borderRadius: "6px",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        {user.paymentDoneBy || "Not Specified"}
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Payment Date</label>
                      <div
                        style={{
                          padding: "12px",
                          backgroundColor: "#f8fafc",
                          borderRadius: "6px",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        {user.dateOfPayment
                          ? new Date(user.dateOfPayment).toLocaleDateString()
                          : "Not Set"}
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Transaction ID</label>
                      <div
                        style={{
                          padding: "12px",
                          backgroundColor: "#f8fafc",
                          borderRadius: "6px",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        {user.transactionId || "Not Available"}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* Tasks/Projects Section */}
        {activeSection === "tasks" && (
          <>
            <div className="premium-page-header">
              <div className="header-left">
                <h1>Tasks / Projects</h1>
                <p className="header-subtitle">
                  Manage your assigned tasks and projects
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

            {error && (
              <div
                style={{
                  padding: "12px",
                  marginBottom: "20px",
                  backgroundColor: "#fee2e2",
                  border: "1px solid #fecaca",
                  borderRadius: "8px",
                  color: "#dc2626",
                  fontSize: "14px",
                }}
              >
                {error}
              </div>
            )}

            {/* Task Statistics */}
            <div className="premium-stats-grid">
              <div className="premium-stat-card accent-blue">
                <div className="stat-icon-wrapper">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <div className="stat-content">
                  <div className="stat-label">Total Tasks</div>
                  <div className="stat-value">{getTaskStats().total}</div>
                  <div className="stat-meta">All assigned tasks</div>
                </div>
              </div>

              <div className="premium-stat-card accent-teal">
                <div className="stat-icon-wrapper">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 5v2m-4 0v2M5 5a2 2 0 012-2h6a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5z"
                    />
                  </svg>
                </div>
                <div className="stat-content">
                  <div className="stat-label">Assigned</div>
                  <div className="stat-value">{getTaskStats().assigned}</div>
                  <div className="stat-meta">Newly assigned</div>
                </div>
              </div>

              <div className="premium-stat-card accent-indigo">
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
                  <div className="stat-label">In Progress</div>
                  <div className="stat-value">{getTaskStats().inProgress}</div>
                  <div className="stat-meta">Currently working</div>
                </div>
              </div>

              <div className="premium-stat-card accent-orange">
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
                  <div className="stat-label">Pending Approval</div>
                  <div className="stat-value">
                    {getTaskStats().pendingApproval}
                  </div>
                  <div className="stat-meta">Awaiting review</div>
                </div>
              </div>

              <div className="premium-stat-card accent-slate">
                <div className="stat-icon-wrapper">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="stat-content">
                  <div className="stat-label">Completed</div>
                  <div className="stat-value">{getTaskStats().completed}</div>
                  <div className="stat-meta">Successfully finished</div>
                </div>
              </div>
            </div>

            {/* Sub-tabs */}
            <div
              style={{
                display: "flex",
                gap: "4px",
                marginBottom: "20px",
                background: "#f1f5f9",
                padding: "6px",
                borderRadius: "12px",
                width: "fit-content",
              }}
            >
              {[
                {
                  id: "individual",
                  label: "Individual Tasks",
                  count: tasks.filter((t) => !t.isTeamTask).length,
                },
                {
                  id: "squad",
                  label: " Squad Tasks",
                  count: tasks.filter((t) => t.isTeamTask).length,
                },
              ].map(({ id, label, count }) => (
                <button
                  key={id}
                  onClick={() => setTaskView(id)}
                  style={{
                    padding: "9px 18px",
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: "700",
                    fontSize: "13px",
                    background: taskView === id ? "white" : "transparent",
                    color: taskView === id ? "#0f172a" : "#64748b",
                    boxShadow:
                      taskView === id ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  {label}
                  <span
                    style={{
                      padding: "2px 7px",
                      borderRadius: "10px",
                      fontSize: "11px",
                      background: taskView === id ? "#eff6ff" : "#e2e8f0",
                      color: taskView === id ? "#2563eb" : "#64748b",
                    }}
                  >
                    {count}
                  </span>
                </button>
              ))}
            </div>

            {/* Individual Tasks */}
            {taskView === "individual" &&
              (loading ? (
                <div className="card">
                  <p>Loading tasks...</p>
                </div>
              ) : tasks.filter((t) => !t.isTeamTask).length === 0 ? (
                <div className="card">
                  <div className="empty-state">
                    <p>No individual tasks assigned yet.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="desktop-only">
                    <div
                      className="card"
                      style={{ padding: 0, overflow: "hidden" }}
                    >
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Task Title</th>
                            <th>Description</th>
                            <th>Deadline</th>
                            <th>Progress</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tasks
                            .filter((t) => !t.isTeamTask)
                            .map((task) => (
                              <tr key={task._id}>
                                <td
                                  style={{ fontWeight: 600, color: "#0f172a" }}
                                >
                                  {task.title}
                                  {task.taskDocument?.filename && (
                                    <a
                                      href={`${UPLOADS_BASE}/uploads/tasks/${task.taskDocument.filename}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        marginTop: "4px",
                                        fontSize: "11px",
                                        color: "#2563eb",
                                        textDecoration: "none",
                                        fontWeight: "600",
                                      }}
                                    >
                                      View PDF
                                    </a>
                                  )}
                                </td>
                                <td>{task.description.substring(0, 60)}</td>
                                <td>{formatDeadline(task.deadline)}</td>
                                <td>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "10px",
                                    }}
                                  >
                                    <div
                                      className="progress-bar-container"
                                      style={{ flex: 1, minWidth: "100px" }}
                                    >
                                      <div
                                        className="progress-bar-fill"
                                        style={{ width: `${task.progress}%` }}
                                      ></div>
                                    </div>
                                    <span
                                      style={{
                                        fontSize: "13px",
                                        fontWeight: 600,
                                        color: "#3b82f6",
                                      }}
                                    >
                                      {task.progress}%
                                    </span>
                                  </div>
                                </td>
                                <td>
                                  <span
                                    className="status-badge"
                                    style={{
                                      backgroundColor: `${getStatusColor(task.status)}20`,
                                      color: getStatusColor(task.status),
                                    }}
                                  >
                                    {task.status}
                                  </span>
                                </td>
                                <td>
                                  {task.status !== "Completed" && (
                                    <select
                                      value={task.progress}
                                      onChange={(e) =>
                                        handleProgressUpdate(
                                          task._id,
                                          parseInt(e.target.value),
                                        )
                                      }
                                      className="progress-select"
                                      style={{
                                        padding: "6px 8px",
                                        fontSize: "12px",
                                      }}
                                    >
                                      <option value={0}>Not Started</option>
                                      <option value={25}>25%</option>
                                      <option value={50}>50%</option>
                                      <option value={75}>75%</option>
                                      <option value={100}>Submit</option>
                                    </select>
                                  )}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="mobile-only">
                    <div className="tasks-grid">
                      {tasks
                        .filter((t) => !t.isTeamTask)
                        .map((task) => (
                          <div key={task._id} className="task-card">
                            <div className="task-header">
                              <h3>{task.title}</h3>
                              <span
                                className="task-status-badge"
                                style={{
                                  backgroundColor: `${getStatusColor(task.status)}20`,
                                  color: getStatusColor(task.status),
                                }}
                              >
                                {task.status}
                              </span>
                            </div>
                            <p className="task-description">
                              {task.description}
                            </p>
                            {task.taskDocument?.filename && (
                              <a
                                href={`${UPLOADS_BASE}/uploads/tasks/${task.taskDocument.filename}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  margin: "8px 0",
                                  padding: "8px 14px",
                                  background: "#dbeafe",
                                  borderRadius: "8px",
                                  border: "1px solid #93c5fd",
                                  color: "#1e40af",
                                  textDecoration: "none",
                                  fontWeight: "600",
                                  fontSize: "13px",
                                }}
                              >
                                View Task Document (PDF)
                              </a>
                            )}
                            <div className="task-deadline">
                              Deadline: {formatDeadline(task.deadline)}
                            </div>
                            <div className="task-progress">
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  marginBottom: "8px",
                                }}
                              >
                                <span>Progress</span>
                                <span
                                  style={{ color: "#3b82f6", fontWeight: 600 }}
                                >
                                  {task.progress}%
                                </span>
                              </div>
                              <div className="progress-bar-container">
                                <div
                                  className="progress-bar-fill"
                                  style={{ width: `${task.progress}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </>
              ))}

            {/* Squad Tasks */}
            {taskView === "squad" && (
              <TeamTasks
                user={user}
                tasks={tasks}
                loading={loading}
                error={error}
                onProgressUpdate={handleProgressUpdate}
                onTasksRefresh={async () => {
                  const res = await taskAPI.getInternTasks();
                  if (res.data.success) {
                    setTasks(res.data.tasks);
                    return res.data.tasks;
                  }
                  return null;
                }}
              />
            )}
          </>
        )}

        {/* Interviews Section */}
        {activeSection === "interviews" && (
          <>
            <div className="content-header">
              <h1>Interviews</h1>
              <p>Your interview attempt history and HR remarks</p>
            </div>

            <div className="card">
              {interviews.length === 0 ? (
                <div className="empty-state">
                  <p>No interview records yet.</p>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                  }}
                >
                  {interviews.map((interview, idx) => (
                    <div
                      key={interview._id}
                      style={{
                        padding: "20px",
                        background: "#f9fafb",
                        borderRadius: "10px",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "start",
                          marginBottom: "15px",
                        }}
                      >
                        <div>
                          <h3
                            style={{
                              margin: "0 0 5px 0",
                              color: "#0f172a",
                              fontSize: "16px",
                            }}
                          >
                            Attempt #{interview.attemptNumber} -{" "}
                            {interview.interviewType} Interview
                          </h3>
                          <span style={{ fontSize: "12px", color: "#6b7280" }}>
                            {new Date(interview.date).toLocaleDateString()}
                          </span>
                        </div>
                        <span
                          style={{
                            padding: "6px 12px",
                            borderRadius: "20px",
                            fontSize: "13px",
                            fontWeight: 600,
                            backgroundColor: interview.levelCrossed
                              ? "#d1fae5"
                              : "#fee2e2",
                            color: interview.levelCrossed
                              ? "#065f46"
                              : "#991b1b",
                          }}
                        >
                          {interview.levelCrossed ? "Passed" : "Not Passed"}
                        </span>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(150px, 1fr))",
                          gap: "12px",
                          marginBottom: "15px",
                        }}
                      >
                        <div
                          style={{
                            padding: "12px",
                            background: "white",
                            borderRadius: "8px",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#6b7280",
                              marginBottom: "4px",
                            }}
                          >
                            Communication
                          </div>
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: 600,
                              color: "#0f172a",
                            }}
                          >
                            {interview.communicationLevel === "B"
                              ? "Beginner"
                              : interview.communicationLevel === "I"
                                ? "Intermediate"
                                : interview.communicationLevel === "A"
                                  ? "Advanced"
                                  : "Expert"}
                          </div>
                        </div>
                        <div
                          style={{
                            padding: "12px",
                            background: "white",
                            borderRadius: "8px",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#6b7280",
                              marginBottom: "4px",
                            }}
                          >
                            Confidence
                          </div>
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: 600,
                              color: "#0f172a",
                            }}
                          >
                            {interview.confidenceLevel === "B"
                              ? "Beginner"
                              : interview.confidenceLevel === "I"
                                ? "Intermediate"
                                : interview.confidenceLevel === "A"
                                  ? "Advanced"
                                  : "Expert"}
                          </div>
                        </div>
                        <div
                          style={{
                            padding: "12px",
                            background: "white",
                            borderRadius: "8px",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#6b7280",
                              marginBottom: "4px",
                            }}
                          >
                            Clarity
                          </div>
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: 600,
                              color: "#0f172a",
                            }}
                          >
                            {interview.clarityLevel === "B"
                              ? "Beginner"
                              : interview.clarityLevel === "I"
                                ? "Intermediate"
                                : interview.clarityLevel === "A"
                                  ? "Advanced"
                                  : "Expert"}
                          </div>
                        </div>
                        <div
                          style={{
                            padding: "12px",
                            background: "white",
                            borderRadius: "8px",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#6b7280",
                              marginBottom: "4px",
                            }}
                          >
                            Overall Level
                          </div>
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: 600,
                              color: "#0f172a",
                            }}
                          >
                            {interview.overallLevel === "F"
                              ? "Fail"
                              : interview.overallLevel === "C"
                                ? "Clear"
                                : interview.overallLevel === "P"
                                  ? "Pass"
                                  : "Excellent"}
                          </div>
                        </div>
                      </div>

                      {interview.remarks && (
                        <div
                          style={{
                            padding: "12px",
                            background: "#eff6ff",
                            borderRadius: "8px",
                            borderLeft: "3px solid #3b82f6",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "12px",
                              fontWeight: 600,
                              color: "#1e40af",
                              marginBottom: "6px",
                            }}
                          >
                            HR Remarks (Read-only)
                          </div>
                          <div style={{ fontSize: "13px", color: "#1f2937" }}>
                            {interview.remarks}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Aptitude & Assessments Section */}
        {activeSection === "assessments" && (
          <>
            <div className="content-header">
              <h1>Aptitude & Assessments</h1>
              <p>Your scores and feedback analysis</p>
            </div>

            {/* Aptitude Section */}
            <div className="card" style={{ marginBottom: "30px" }}>
              <h3
                style={{
                  marginBottom: "20px",
                  fontSize: "18px",
                  color: "#0f172a",
                }}
              >
                Aptitude Test Results
              </h3>
              {aptitude.length === 0 ? (
                <div className="empty-state">
                  <p>No aptitude records yet.</p>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "15px",
                  }}
                >
                  {aptitude.map((apt) => (
                    <div
                      key={apt._id}
                      style={{
                        padding: "16px",
                        background: "#f0fdf4",
                        borderRadius: "10px",
                        border: "1px solid #b7e4c7",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "start",
                          marginBottom: "10px",
                        }}
                      >
                        <div>
                          <h4
                            style={{
                              margin: "0 0 3px 0",
                              color: "#0f172a",
                              fontSize: "15px",
                              fontWeight: 600,
                            }}
                          >
                            Round {apt.roundNumber}
                          </h4>
                          <span style={{ fontSize: "12px", color: "#6b7280" }}>
                            {new Date(apt.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <span
                          style={{
                            padding: "6px 12px",
                            borderRadius: "20px",
                            fontSize: "13px",
                            fontWeight: 600,
                            backgroundColor:
                              apt.result === "Pass" ? "#d1fae5" : "#fef3c7",
                            color:
                              apt.result === "Pass" ? "#065f46" : "#92400e",
                          }}
                        >
                          {apt.result}
                        </span>
                      </div>
                      <div
                        style={{
                          padding: "12px",
                          background: "white",
                          borderRadius: "8px",
                          marginBottom: "10px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "13px",
                            color: "#6b7280",
                            marginBottom: "4px",
                          }}
                        >
                          Score
                        </div>
                        <div
                          style={{
                            fontSize: "20px",
                            fontWeight: 700,
                            color: "#059669",
                          }}
                        >
                          {apt.score}
                        </div>
                      </div>
                      {apt.remarks && (
                        <div
                          style={{
                            padding: "10px",
                            background: "#f0fdf4",
                            borderRadius: "6px",
                            borderLeft: "3px solid #10b981",
                          }}
                        >
                          <div style={{ fontSize: "13px", color: "#166534" }}>
                            <strong>Feedback:</strong> {apt.remarks}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Assessment Section */}
            <div className="card">
              <h3
                style={{
                  marginBottom: "20px",
                  fontSize: "18px",
                  color: "#0f172a",
                }}
              >
                Assessment Results
              </h3>
              {assessments.length === 0 ? (
                <div className="empty-state">
                  <p>No assessment records yet.</p>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "15px",
                  }}
                >
                  {assessments.map((assess) => (
                    <div
                      key={assess._id}
                      style={{
                        padding: "16px",
                        background: "#eff6ff",
                        borderRadius: "10px",
                        border: "1px solid #bfdbfe",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "start",
                          marginBottom: "10px",
                        }}
                      >
                        <div>
                          <h4
                            style={{
                              margin: "0 0 3px 0",
                              color: "#0f172a",
                              fontSize: "15px",
                              fontWeight: 600,
                            }}
                          >
                            {assess.assessmentType} Assessment
                          </h4>
                          <span style={{ fontSize: "12px", color: "#6b7280" }}>
                            {new Date(assess.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <span
                          style={{
                            padding: "6px 12px",
                            borderRadius: "20px",
                            fontSize: "13px",
                            fontWeight: 600,
                            backgroundColor:
                              assess.status === "Pass"
                                ? "#d1fae5"
                                : assess.status === "Fail"
                                  ? "#fee2e2"
                                  : "#fef3c7",
                            color:
                              assess.status === "Pass"
                                ? "#065f46"
                                : assess.status === "Fail"
                                  ? "#991b1b"
                                  : "#92400e",
                          }}
                        >
                          {assess.status}
                        </span>
                      </div>
                      <div
                        style={{
                          padding: "12px",
                          background: "white",
                          borderRadius: "8px",
                          marginBottom: "10px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "13px",
                            color: "#6b7280",
                            marginBottom: "4px",
                          }}
                        >
                          Score
                        </div>
                        <div
                          style={{
                            fontSize: "20px",
                            fontWeight: 700,
                            color: "#3b82f6",
                          }}
                        >
                          {assess.score || "N/A"}
                        </div>
                      </div>
                      {assess.feedback && (
                        <div
                          style={{
                            padding: "10px",
                            background: "#eff6ff",
                            borderRadius: "6px",
                            borderLeft: "3px solid #3b82f6",
                          }}
                        >
                          <div style={{ fontSize: "13px", color: "#1e40af" }}>
                            <strong>Feedback:</strong> {assess.feedback}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Certificates/Documents Section */}
        {activeSection === "documents" && (
          <>
            <div className="content-header">
              <h1>Certificates / Documents</h1>
              <p>
                Your official documents and certificates organized by category
              </p>
            </div>

            {!documents ? (
              <div className="card">
                <div className="empty-state">
                  <p>Loading documents...</p>
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "24px" }}>
                {/* Document Category Based on Student Type */}
                {user?.studentType === "SMS Program" && (
                  <div className="card">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "16px",
                      }}
                    >
                      <h2 style={{ margin: "0" }}>SMS Program Documents</h2>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                      }}
                    >
                      {/* Welcome Letter */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "14px",
                          background: "#ffffff",
                          borderRadius: "8px",
                          border: "1px solid #e5e7eb",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <strong
                              style={{
                                color: "#1f2937",
                                fontSize: "20px",
                                fontWeight: "600",
                              }}
                            >
                              Welcome Letter
                            </strong>
                            <span
                              style={{
                                fontSize: "11px",
                                padding: "2px 6px",
                                background: documents.welcomeLetter?.filename
                                  ? "#f0fdf4"
                                  : "#fef2f2",
                                color: documents.welcomeLetter?.filename
                                  ? "#166534"
                                  : "#991b1b",
                                borderRadius: "4px",
                                fontWeight: "600",
                              }}
                            >
                              {documents.welcomeLetter?.filename
                                ? "Uploaded"
                                : "Not Uploaded"}
                            </span>
                          </div>
                          <p
                            style={{
                              color: "#6b7280",
                              fontSize: "13px",
                              margin: "4px 0 0 0",
                            }}
                          >
                            Welcome documentation from organization
                          </p>
                        </div>
                        <div>
                          {documents.welcomeLetter?.filename ? (
                            <a
                              href={
                                UPLOADS_BASE +
                                "/uploads/students/" +
                                documents.welcomeLetter.filename
                              }
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                padding: "8px 16px",
                                background: "#374151",
                                color: "white",
                                borderRadius: "6px",
                                textDecoration: "none",
                                fontSize: "13px",
                                fontWeight: "500",
                                cursor: "pointer",
                              }}
                            >
                              View Document
                            </a>
                          ) : (
                            <span
                              style={{
                                padding: "8px 16px",
                                background: "#f3f4f6",
                                color: "#6b7280",
                                borderRadius: "6px",
                                fontSize: "13px",
                                fontWeight: "500",
                              }}
                            >
                              Not Uploaded Yet
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Internship Offer Letter */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "14px",
                          background: "#ffffff",
                          borderRadius: "8px",
                          border: "1px solid #e5e7eb",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <strong
                              style={{
                                color: "#1f2937",
                                fontSize: "20px",
                                fontWeight: "600",
                              }}
                            >
                              Internship Offer Letter
                            </strong>
                            <span
                              style={{
                                fontSize: "11px",
                                padding: "2px 6px",
                                background: documents.offerLetter?.filename
                                  ? "#f0fdf4"
                                  : "#fef2f2",
                                color: documents.offerLetter?.filename
                                  ? "#166534"
                                  : "#991b1b",
                                borderRadius: "4px",
                                fontWeight: "600",
                              }}
                            >
                              {documents.offerLetter?.filename
                                ? "Uploaded"
                                : "Not Uploaded"}
                            </span>
                          </div>
                          <p
                            style={{
                              color: "#6b7280",
                              fontSize: "13px",
                              margin: "4px 0 0 0",
                            }}
                          >
                            Formal offer letter from organization
                          </p>
                        </div>
                        <div>
                          {documents.offerLetter?.filename ? (
                            <a
                              href={
                                UPLOADS_BASE +
                                "/uploads/students/" +
                                documents.offerLetter.filename
                              }
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                padding: "8px 16px",
                                background: "#374151",
                                color: "white",
                                borderRadius: "6px",
                                textDecoration: "none",
                                fontSize: "13px",
                                fontWeight: "500",
                                cursor: "pointer",
                              }}
                            >
                              View Document
                            </a>
                          ) : (
                            <span
                              style={{
                                padding: "8px 16px",
                                background: "#f3f4f6",
                                color: "#6b7280",
                                borderRadius: "6px",
                                fontSize: "13px",
                                fontWeight: "500",
                              }}
                            >
                              Not Uploaded Yet
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Payment Receipt */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "14px",
                          background: "#ffffff",
                          borderRadius: "8px",
                          border: "1px solid #e5e7eb",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <strong
                              style={{
                                color: "#1f2937",
                                fontSize: "20px",
                                fontWeight: "600",
                              }}
                            >
                              Payment Receipt
                            </strong>
                            <span
                              style={{
                                fontSize: "11px",
                                padding: "2px 6px",
                                background: documents.paymentReceipt?.filename
                                  ? "#f0fdf4"
                                  : "#fef2f2",
                                color: documents.paymentReceipt?.filename
                                  ? "#166534"
                                  : "#991b1b",
                                borderRadius: "4px",
                                fontWeight: "600",
                              }}
                            >
                              {documents.paymentReceipt?.filename
                                ? "Uploaded"
                                : "Not Uploaded"}
                            </span>
                          </div>
                          <p
                            style={{
                              color: "#6b7280",
                              fontSize: "13px",
                              margin: "4px 0 0 0",
                            }}
                          >
                            Payment confirmation document
                          </p>
                        </div>
                        <div>
                          {documents.paymentReceipt?.filename ? (
                            <a
                              href={
                                UPLOADS_BASE +
                                "/uploads/students/" +
                                documents.paymentReceipt.filename
                              }
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                padding: "8px 16px",
                                background: "#324158",
                                color: "white",
                                borderRadius: "6px",
                                textDecoration: "none",
                                fontSize: "13px",
                                fontWeight: "500",
                                cursor: "pointer",
                              }}
                            >
                              View Document
                            </a>
                          ) : (
                            <span
                              style={{
                                padding: "8px 16px",
                                background: "#f3f4f6",
                                color: "#6b7280",
                                borderRadius: "6px",
                                fontSize: "13px",
                                fontWeight: "500",
                              }}
                            >
                              Not Uploaded Yet
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Internship Program Documents */}
                {user?.studentType === "Internship" && (
                  <div className="card">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "16px",
                      }}
                    >
                      <h2 style={{ margin: "0" }}>Internship Documents</h2>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                      }}
                    >
                      {/* Offer Letter */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "14px",
                          background: "#ffffff",
                          borderRadius: "8px",
                          border: "1px solid #e5e7eb",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <strong
                              style={{
                                color: "#1f2937",
                                fontSize: "20px",
                                fontWeight: "600",
                              }}
                            >
                              Offer Letter
                            </strong>
                            <span
                              style={{
                                fontSize: "11px",
                                padding: "2px 6px",
                                background: documents.offerLetter?.filename
                                  ? "#f0fdf4"
                                  : "#fef2f2",
                                color: documents.offerLetter?.filename
                                  ? "#166534"
                                  : "#991b1b",
                                borderRadius: "4px",
                                fontWeight: "600",
                              }}
                            >
                              {documents.offerLetter?.filename
                                ? "Uploaded"
                                : "Not Uploaded"}
                            </span>
                          </div>
                          <p
                            style={{
                              color: "#6b7280",
                              fontSize: "13px",
                              margin: "4px 0 0 0",
                            }}
                          >
                            Your formal offer letter from the organization
                          </p>
                        </div>
                        <div>
                          {documents.offerLetter?.filename ? (
                            <a
                              href={
                                UPLOADS_BASE +
                                "/uploads/students/" +
                                documents.offerLetter.filename
                              }
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                padding: "8px 16px",
                                background: "#374151",
                                color: "white",
                                borderRadius: "6px",
                                textDecoration: "none",
                                fontSize: "13px",
                                fontWeight: "500",
                                cursor: "pointer",
                              }}
                            >
                              View Document
                            </a>
                          ) : (
                            <span
                              style={{
                                padding: "8px 16px",
                                background: "#f3f4f6",
                                color: "#6b7280",
                                borderRadius: "6px",
                                fontSize: "13px",
                                fontWeight: "500",
                              }}
                            >
                              Not Uploaded Yet
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional Certificates Section (SMS program only) */}
                {user?.studentType === "SMS Program" && (
                  <div className="card">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "16px",
                      }}
                    >
                      <h2 style={{ margin: "0" }}>Additional Certificates</h2>
                      {documents.otherCertificates?.length > 0 && (
                        <span
                          style={{
                            fontSize: "12px",
                            padding: "4px 8px",
                            background: "#f3f4f6",
                            color: "#374151",
                            borderRadius: "6px",
                            fontWeight: "500",
                          }}
                        >
                          {documents.otherCertificates.length} uploaded
                        </span>
                      )}
                    </div>

                    {/* Always show completion and experience letters with upload status */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                      }}
                    >
                      {/* Completion Letter */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "14px",
                          background: "#ffffff",
                          borderRadius: "8px",
                          border: "1px solid #e5e7eb",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <strong
                              style={{
                                color: "#1f2937",
                                fontSize: "20px",
                                fontWeight: "600",
                              }}
                            >
                              Completion Letter
                            </strong>
                            <span
                              style={{
                                fontSize: "11px",
                                padding: "2px 6px",
                                background: documents.completionLetter?.filename
                                  ? "#f0fdf4"
                                  : "#fef2f2",
                                color: documents.completionLetter?.filename
                                  ? "#166534"
                                  : "#991b1b",
                                borderRadius: "4px",
                                fontWeight: "600",
                              }}
                            >
                              {documents.completionLetter?.filename
                                ? "Uploaded"
                                : "Not Uploaded"}
                            </span>
                          </div>
                          <p
                            style={{
                              color: "#6b7280",
                              fontSize: "13px",
                              margin: "4px 0 0 0",
                            }}
                          >
                            Official completion document
                          </p>
                        </div>
                        <div>
                          {documents.completionLetter?.filename ? (
                            <a
                              href={
                                UPLOADS_BASE +
                                "/uploads/students/" +
                                documents.completionLetter.filename
                              }
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                padding: "8px 16px",
                                background: "#374151",
                                color: "white",
                                borderRadius: "6px",
                                textDecoration: "none",
                                fontSize: "13px",
                                fontWeight: "500",
                                cursor: "pointer",
                              }}
                            >
                              View Document
                            </a>
                          ) : (
                            <span
                              style={{
                                padding: "8px 16px",
                                background: "#f3f4f6",
                                color: "#6b7280",
                                borderRadius: "6px",
                                fontSize: "13px",
                                fontWeight: "500",
                              }}
                            >
                              Not Uploaded Yet
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Experience Letter */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "14px",
                          background: "#ffffff",
                          borderRadius: "8px",
                          border: "1px solid #e5e7eb",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <strong
                              style={{
                                color: "#1f2937",
                                fontSize: "20px",
                                fontWeight: "600",
                              }}
                            >
                              Experience Letter
                            </strong>
                            <span
                              style={{
                                fontSize: "11px",
                                padding: "2px 6px",
                                background: documents.experienceLetter?.filename
                                  ? "#f0fdf4"
                                  : "#fef2f2",
                                color: documents.experienceLetter?.filename
                                  ? "#166534"
                                  : "#991b1b",
                                borderRadius: "4px",
                                fontWeight: "600",
                              }}
                            >
                              {documents.experienceLetter?.filename
                                ? "Uploaded"
                                : "Not Uploaded"}
                            </span>
                          </div>
                          <p
                            style={{
                              color: "#6b7280",
                              fontSize: "13px",
                              margin: "4px 0 0 0",
                            }}
                          >
                            Experience documentation
                          </p>
                        </div>
                        <div>
                          {documents.experienceLetter?.filename ? (
                            <a
                              href={
                                UPLOADS_BASE +
                                "/uploads/students/" +
                                documents.experienceLetter.filename
                              }
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                padding: "8px 16px",
                                background: "#374151",
                                color: "white",
                                borderRadius: "6px",
                                textDecoration: "none",
                                fontSize: "13px",
                                fontWeight: "500",
                                cursor: "pointer",
                              }}
                            >
                              View Document
                            </a>
                          ) : (
                            <span
                              style={{
                                padding: "8px 16px",
                                background: "#f3f4f6",
                                color: "#6b7280",
                                borderRadius: "6px",
                                fontSize: "13px",
                                fontWeight: "500",
                              }}
                            >
                              Not Uploaded Yet
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Other uploaded certificates */}
                      {documents.otherCertificates?.length > 0 && (
                        <>
                          {documents.otherCertificates.map((cert, idx) => (
                            <a
                              key={idx}
                              href={
                                UPLOADS_BASE +
                                "/uploads/students/" +
                                cert.filename
                              }
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "12px",
                                background: "#ffffff",
                                borderRadius: "8px",
                                border: "1px solid #e5e7eb",
                                textDecoration: "none",
                                color: "#1f2937",
                                transition: "all 0.2s ease",
                                cursor: "pointer",
                              }}
                            >
                              <div>
                                <strong style={{ fontSize: "14px" }}>
                                  {cert.name || cert.filename}
                                </strong>
                                <p
                                  style={{
                                    color: "#6b7280",
                                    fontSize: "12px",
                                    margin: "4px 0 0 0",
                                  }}
                                >
                                  Uploaded - Click to view
                                </p>
                              </div>
                              <span
                                style={{
                                  color: "#374151",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                }}
                              >
                                View →
                              </span>
                            </a>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Assigned Certificates */}
                {assignedCerts.length > 0 && (
                  <div className="card">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "16px",
                      }}
                    >
                      <h2 style={{ margin: "0" }}>Assigned Certificates</h2>
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#374151",
                          background: "#f3f4f6",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontWeight: "600",
                        }}
                      >
                        5-day download window
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                      }}
                    >
                      {assignedCerts.map((cert) => {
                        const timeLeft = new Date(cert.expiresAt) - new Date();
                        const days = Math.floor(
                          timeLeft / (1000 * 60 * 60 * 24),
                        );
                        const hours = Math.floor(
                          (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
                        );
                        const expired = timeLeft <= 0;
                        return (
                          <div
                            key={cert._id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "12px",
                              background: "#ffffff",
                              borderRadius: "8px",
                              border: "1px solid #e5e7eb",
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  fontWeight: "600",
                                  color: "#1f2937",
                                  fontSize: "20px",
                                }}
                              >
                                {cert.name}
                              </div>
                              <div
                                style={{
                                  fontSize: "12px",
                                  color: expired
                                    ? "#dc2626"
                                    : days >= 2
                                      ? "#16a34a"
                                      : "#d97706",
                                  marginTop: "4px",
                                  fontWeight: "500",
                                }}
                              >
                                {expired
                                  ? "Expired - No longer available"
                                  : `${days}d ${hours}h remaining`}
                              </div>
                            </div>
                            {!expired && (
                              <a
                                href={`${UPLOADS_BASE}/uploads/certificates/${cert.filename}`}
                                download
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  padding: "8px 16px",
                                  background: "#374151",
                                  color: "white",
                                  borderRadius: "6px",
                                  textDecoration: "none",
                                  fontWeight: "600",
                                  fontSize: "13px",
                                }}
                              >
                                Download
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Notifications Section */}
        {activeSection === "notifications" && (
          <>
            <div className="content-header">
              <h1>Notifications</h1>
              <p>Important announcements and updates</p>
            </div>

            <div className="card">
              {notifications.length === 0 ? (
                <div className="empty-state">
                  <p>No notifications at this time.</p>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "15px",
                  }}
                >
                  {notifications.map((notif) => (
                    <div
                      key={notif._id}
                      style={{
                        padding: "16px",
                        background:
                          notif.notificationType === "General/Announcement"
                            ? "#f9fafb"
                            : "#eff6ff",
                        borderRadius: "10px",
                        border:
                          "1px solid " +
                          (notif.notificationType === "General/Announcement"
                            ? "#e5e7eb"
                            : "#bfdbfe"),
                        borderLeft:
                          "0.5px solid " +
                          (notif.notificationType === "Interview"
                            ? "#f59e0b"
                            : notif.notificationType === "Test/Assessment"
                              ? "#3b82f6"
                              : notif.notificationType === "Certificate"
                                ? "#10b981"
                                : "#6b7280"),
                      }}
                    >
                      <div style={{ marginBottom: "8px" }}>
                        <h4
                          style={{
                            margin: "0 0 4px 0",
                            color: "#0f172a",
                            fontSize: "23px",
                            fontWeight: 600,
                          }}
                        >
                          {notif.title}
                        </h4>
                        <span style={{ fontSize: "12px", color: "#6b7280" }}>
                          {new Date(notif.createdAt).toLocaleDateString()} at{" "}
                          {new Date(notif.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <p
                        style={{
                          margin: "8px 0",
                          color: "#374158",
                          fontSize: "16px",
                          lineHeight: "1.5",
                        }}
                      >
                        {notif.message}
                      </p>
                      {notif.attachment?.filename && (
                        <a
                          href={
                            UPLOADS_BASE +
                            "/uploads/notifications/" +
                            notif.attachment.filename
                          }
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            fontSize: "13px",
                            color: "#324158",
                            marginTop: "8px",
                            display: "inline-block",
                          }}
                        >
                          Download Attachment
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Job & Internship Updates Section */}
        {activeSection === "jobs" && (
          <>
            <div className="content-header">
              <h1>Job & Internship Updates</h1>
              <p>Available opportunities and updates</p>
            </div>

            <div className="card">
              {jobPostings.length === 0 ? (
                <div className="empty-state">
                  <p>
                    No job or internship opportunities at this time. Check back
                    later!
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                  }}
                >
                  {jobPostings.map((posting) => (
                    <div
                      key={posting._id}
                      style={{
                        padding: "20px",
                        background: "#f9fafb",
                        borderRadius: "10px",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "start",
                          marginBottom: "15px",
                        }}
                      >
                        <div>
                          <h3
                            style={{
                              margin: "0 0 5px 0",
                              color: "#0f172a",
                              fontSize: "16px",
                              fontWeight: 600,
                            }}
                          >
                            {posting.title}
                          </h3>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "4px 10px",
                              backgroundColor:
                                posting.opportunityType === "Job"
                                  ? "#dbeafe"
                                  : "#f0fdf4",
                              color:
                                posting.opportunityType === "Job"
                                  ? "#0c4a6e"
                                  : "#166534",
                              borderRadius: "12px",
                              fontSize: "12px",
                              fontWeight: 600,
                              marginRight: "8px",
                            }}
                          >
                            {posting.opportunityType}
                          </span>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "4px 10px",
                              backgroundColor: "#f3e8ff",
                              color: "#6b21a8",
                              borderRadius: "12px",
                              fontSize: "12px",
                              fontWeight: 600,
                            }}
                          >
                            {posting.domain}
                          </span>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(200px, 1fr))",
                          gap: "12px",
                          marginBottom: "15px",
                        }}
                      >
                        <div
                          style={{
                            padding: "12px",
                            background: "white",
                            borderRadius: "8px",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#6b7280",
                              marginBottom: "4px",
                            }}
                          >
                            Eligibility
                          </div>
                          <div style={{ fontSize: "13px", color: "#0f172a" }}>
                            {posting.eligibilityCriteria}
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          padding: "12px",
                          background: "white",
                          borderRadius: "8px",
                          marginBottom: "15px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "13px",
                            color: "#374151",
                            lineHeight: "1.6",
                          }}
                        >
                          {posting.description}
                        </div>
                      </div>

                      {posting.applicationLink && (
                        <a
                          href={posting.applicationLink}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: "inline-block",
                            padding: "10px 20px",
                            background: "#0f172a",
                            color: "white",
                            borderRadius: "6px",
                            textDecoration: "none",
                            fontWeight: 600,
                            fontSize: "14px",
                          }}
                        >
                          Apply Now →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default InternDashboard;
