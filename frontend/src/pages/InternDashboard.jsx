import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { taskAPI, internAPI, UPLOADS_BASE } from "../services/api";
import TeamTasks from "./TeamTasks";
import logo from "../assets/logo.png";
import AIAssistant from "../components/AIAssistant";

function InternDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("profile");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [documents, setDocuments] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [aptitude, setAptitude] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [jobPostings, setJobPostings] = useState([]);
  const [assignedCerts, setAssignedCerts] = useState([]);
  const [taskView, setTaskView] = useState('individual');
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
    fetchTasks();
  }, [navigate]);

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
          } catch (e) { console.error('Failed to fetch assigned certs:', e); }
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

  const handleAssistantAction = async (action) => {
    await handleSectionClick(action.section);
    if (action.taskView) {
      setTaskView(action.taskView);
    }
  };

  const getAssistantSnapshot = async () => {
    const [profileResult, tasksResult, notificationsResult] = await Promise.allSettled([
      internAPI.getMyProfile(),
      taskAPI.getInternTasks(),
      internAPI.getMyNotifications(),
    ]);

    const profileData =
      profileResult.status === "fulfilled" && profileResult.value.data?.success
        ? profileResult.value.data.profile
        : user;

    const taskList =
      tasksResult.status === "fulfilled" && tasksResult.value.data?.success
        ? tasksResult.value.data.tasks || []
        : tasks;

    const notificationList =
      notificationsResult.status === "fulfilled" && notificationsResult.value.data?.success
        ? notificationsResult.value.data.notifications || []
        : notifications;

    const completedTasks = taskList.filter((task) => task.status === "Completed").length;

    return {
      name: profileData?.name || user?.name || "Intern",
      totalTasks: taskList.length,
      pendingTasks: taskList.length - completedTasks,
      completedTasks,
      notifications: notificationList.length,
    };
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
          <p>Intern Portal</p>
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
          <li
            className={activeSection === "profile" ? "active" : ""}
            onClick={() => handleSectionClick("profile")}
            style={{ cursor: "pointer" }}
          >
            My Profile
          </li>
          <li
            className={activeSection === "program" ? "active" : ""}
            onClick={() => handleSectionClick("program")}
            style={{ cursor: "pointer" }}
          >
            My Program
          </li>
          <li
            className={activeSection === "tasks" ? "active" : ""}
            onClick={() => handleSectionClick("tasks")}
            style={{ cursor: "pointer" }}
          >
            Tasks/Projects
          </li>
          <li
            className={activeSection === "interviews" ? "active" : ""}
            onClick={() => handleSectionClick("interviews")}
            style={{ cursor: "pointer" }}
          >
            Interviews
          </li>
          <li
            className={activeSection === "assessments" ? "active" : ""}
            onClick={() => handleSectionClick("assessments")}
            style={{ cursor: "pointer" }}
          >
            Aptitude & Assessments
          </li>
          <li
            className={activeSection === "documents" ? "active" : ""}
            onClick={() => handleSectionClick("documents")}
            style={{ cursor: "pointer" }}
          >
            Certificates/Documents
          </li>
          <li
            className={activeSection === "notifications" ? "active" : ""}
            onClick={() => handleSectionClick("notifications")}
            style={{ cursor: "pointer" }}
          >
            Notifications
          </li>
          <li
            className={activeSection === "jobs" ? "active" : ""}
            onClick={() => handleSectionClick("jobs")}
            style={{ cursor: "pointer" }}
          >
            Job & Internship Updates
          </li>
        </ul>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main className="main-content">
        {/* My Profile Section */}
        {activeSection === "profile" && (
          <>
            <div className="content-header">
              <h1>My Profile</h1>
              <p>Your personal and professional information</p>
            </div>

            <div className="card" style={{ marginBottom: "30px" }}>
              <h2
                style={{
                  marginBottom: "20px",
                  fontSize: "20px",
                  color: "#0f172a",
                }}
              >
                Personal Details
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: "20px",
                }}
              >
                <div
                  style={{
                    padding: "15px",
                    background:
                      "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                    borderRadius: "12px",
                    color: "white",
                    boxShadow: "0 8px 20px rgba(37, 99, 235, 0.25)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "13px",
                      opacity: 0.8,
                      marginBottom: "5px",
                    }}
                  >
                    Name
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: 600 }}>
                    {user.name}
                  </div>
                </div>
                <div
                  style={{
                    padding: "15px",
                    background:
                      "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
                    borderRadius: "12px",
                    color: "white",
                    boxShadow: "0 8px 20px rgba(2, 132, 199, 0.25)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "13px",
                      opacity: 0.8,
                      marginBottom: "5px",
                    }}
                  >
                    Intern ID
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: 600 }}>
                    {user.internId}
                  </div>
                </div>
                <div
                  style={{
                    padding: "15px",
                    background:
                      "linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)",
                    borderRadius: "12px",
                    color: "white",
                    boxShadow: "0 8px 20px rgba(20, 184, 166, 0.25)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "13px",
                      opacity: 0.8,
                      marginBottom: "5px",
                    }}
                  >
                    Email
                  </div>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: 600,
                      wordBreak: "break-all",
                    }}
                  >
                    {user.email}
                  </div>
                </div>
                <div
                  style={{
                    padding: "15px",
                    background:
                      "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                    borderRadius: "12px",
                    color: "white",
                    boxShadow: "0 8px 20px rgba(234, 88, 12, 0.25)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "13px",
                      opacity: 0.8,
                      marginBottom: "5px",
                    }}
                  >
                    Mobile
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: 600 }}>
                    {user.mobile}
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <h2
                style={{
                  marginBottom: "20px",
                  fontSize: "20px",
                  color: "#0f172a",
                }}
              >
                Current Designation & Program
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: "20px",
                }}
              >
                <div
                  style={{
                    padding: "15px",
                    background: "#f3f4f6",
                    borderRadius: "12px",
                    borderLeft: "4px solid #6366f1",
                  }}
                >
                  <div
                    style={{
                      fontSize: "13px",
                      opacity: 0.8,
                      marginBottom: "5px",
                      color: "#6b7280",
                    }}
                  >
                    Current Designation
                  </div>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: 600,
                      color: "#0f172a",
                    }}
                  >
                    {user.currentDesignation || "Not Set"}
                  </div>
                </div>
                <div
                  style={{
                    padding: "15px",
                    background: "#f3f4f6",
                    borderRadius: "12px",
                    borderLeft: "4px solid #8b5cf6",
                  }}
                >
                  <div
                    style={{
                      fontSize: "13px",
                      opacity: 0.8,
                      marginBottom: "5px",
                      color: "#6b7280",
                    }}
                  >
                    Student Type
                  </div>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: 600,
                      color: "#0f172a",
                    }}
                  >
                    {user.studentType}
                  </div>
                </div>
                <div
                  style={{
                    padding: "15px",
                    background: "#f3f4f6",
                    borderRadius: "12px",
                    borderLeft: "4px solid #ec4899",
                  }}
                >
                  <div
                    style={{
                      fontSize: "13px",
                      opacity: 0.8,
                      marginBottom: "5px",
                      color: "#6b7280",
                    }}
                  >
                    Status
                  </div>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: 600,
                      color: "#0f172a",
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
                  <h3
                    style={{
                      marginBottom: "20px",
                      fontSize: "18px",
                      color: "#0f172a",
                    }}
                  >
                    Internship Details
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(250px, 1fr))",
                      gap: "20px",
                    }}
                  >
                    <div
                      style={{
                        padding: "15px",
                        background: "#f0f9ff",
                        borderRadius: "10px",
                        border: "1px solid #bfdbfe",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#0c4a6e",
                          marginBottom: "5px",
                        }}
                      >
                        Domain
                      </div>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: 600,
                          color: "#0f172a",
                        }}
                      >
                        {user.domain || "Not Specified"}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "15px",
                        background: "#f0f9ff",
                        borderRadius: "10px",
                        border: "1px solid #bfdbfe",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#0c4a6e",
                          marginBottom: "5px",
                        }}
                      >
                        Duration
                      </div>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: 600,
                          color: "#0f172a",
                        }}
                      >
                        {user.duration || "Not Specified"}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "15px",
                        background: "#f0f9ff",
                        borderRadius: "10px",
                        border: "1px solid #bfdbfe",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#0c4a6e",
                          marginBottom: "5px",
                        }}
                      >
                        Start Date
                      </div>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: 600,
                          color: "#0f172a",
                        }}
                      >
                        {user.joiningDate
                          ? new Date(user.joiningDate).toLocaleDateString()
                          : "Not Set"}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "15px",
                        background: "#f0f9ff",
                        borderRadius: "10px",
                        border: "1px solid #bfdbfe",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#0c4a6e",
                          marginBottom: "5px",
                        }}
                      >
                        End Date
                      </div>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: 600,
                          color: "#0f172a",
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
                  <h3
                    style={{
                      marginBottom: "20px",
                      fontSize: "18px",
                      color: "#0f172a",
                    }}
                  >
                    SMS Program Details
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(250px, 1fr))",
                      gap: "20px",
                    }}
                  >
                    <div
                      style={{
                        padding: "15px",
                        background: "#f0fdf4",
                        borderRadius: "10px",
                        border: "1px solid #b7e4c7",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#166534",
                          marginBottom: "5px",
                        }}
                      >
                        Payment Status
                      </div>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: 600,
                          color: "#0f172a",
                        }}
                      >
                        {user.paymentDoneBy || "Not Specified"}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "15px",
                        background: "#f0fdf4",
                        borderRadius: "10px",
                        border: "1px solid #b7e4c7",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#166534",
                          marginBottom: "5px",
                        }}
                      >
                        Payment Date
                      </div>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: 600,
                          color: "#0f172a",
                        }}
                      >
                        {user.dateOfPayment
                          ? new Date(user.dateOfPayment).toLocaleDateString()
                          : "Not Set"}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "15px",
                        background: "#f0fdf4",
                        borderRadius: "10px",
                        border: "1px solid #b7e4c7",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#166534",
                          marginBottom: "5px",
                        }}
                      >
                        Transaction ID
                      </div>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: 600,
                          color: "#0f172a",
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
            <div className="content-header">
              <h1>Tasks / Projects</h1>
              <p>View and manage your assigned tasks</p>
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

            <div className="card" style={{ marginBottom: "20px" }}>
              <h3
                style={{
                  marginBottom: "15px",
                  fontSize: "16px",
                  color: "#0f172a",
                }}
              >
                Task Statistics
              </h3>
              <div className="stats-grid">
                <div
                  className="stat-card"
                  style={{ borderLeft: "4px solid #0f172a" }}
                >
                  <div className="stat-value">{getTaskStats().total}</div>
                  <div className="stat-label">Total Tasks</div>
                </div>
                <div
                  className="stat-card"
                  style={{ borderLeft: "4px solid #94a3b8" }}
                >
                  <div className="stat-value">{getTaskStats().assigned}</div>
                  <div className="stat-label">Assigned</div>
                </div>
                <div
                  className="stat-card"
                  style={{ borderLeft: "4px solid #3b82f6" }}
                >
                  <div className="stat-value">{getTaskStats().inProgress}</div>
                  <div className="stat-label">In Progress</div>
                </div>
                <div
                  className="stat-card"
                  style={{ borderLeft: "4px solid #f59e0b" }}
                >
                  <div className="stat-value">
                    {getTaskStats().pendingApproval}
                  </div>
                  <div className="stat-label">Pending Approval</div>
                </div>
                <div
                  className="stat-card"
                  style={{ borderLeft: "4px solid #10b981" }}
                >
                  <div className="stat-value">{getTaskStats().completed}</div>
                  <div className="stat-label">Completed</div>
                </div>
              </div>
            </div>

            {/* Sub-tabs */}
            <div style={{ display: "flex", gap: "4px", marginBottom: "20px", background: "#f1f5f9", padding: "6px", borderRadius: "12px", width: "fit-content" }}>
              {[
                { id: "individual", label: "👤 Individual Tasks", count: tasks.filter(t => !t.isTeamTask).length },
                { id: "squad", label: "🤝 Squad Tasks", count: tasks.filter(t => t.isTeamTask).length }
              ].map(({ id, label, count }) => (
                <button
                  key={id}
                  onClick={() => setTaskView(id)}
                  style={{
                    padding: "9px 18px", borderRadius: "8px", border: "none", cursor: "pointer",
                    fontWeight: "700", fontSize: "13px",
                    background: taskView === id ? "white" : "transparent",
                    color: taskView === id ? "#0f172a" : "#64748b",
                    boxShadow: taskView === id ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
                    transition: "all 0.2s", display: "flex", alignItems: "center", gap: "6px"
                  }}
                >
                  {label}
                  <span style={{ padding: "2px 7px", borderRadius: "10px", fontSize: "11px", background: taskView === id ? "#eff6ff" : "#e2e8f0", color: taskView === id ? "#2563eb" : "#64748b" }}>{count}</span>
                </button>
              ))}
            </div>

            {/* Individual Tasks */}
            {taskView === "individual" && (
              loading ? (
                <div className="card"><p>Loading tasks...</p></div>
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
                                <td style={{ fontWeight: 600, color: "#0f172a" }}>
                                  {task.title}
                                  {task.taskDocument?.filename && (
                                    <a
                                      href={`${UPLOADS_BASE}/uploads/tasks/${task.taskDocument.filename}`}
                                      target="_blank" rel="noopener noreferrer"
                                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '11px', color: '#2563eb', textDecoration: 'none', fontWeight: '600' }}
                                    >
                                      📄 View PDF
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
                            <p className="task-description">{task.description}</p>
                            {task.taskDocument?.filename && (
                              <a
                                href={`${UPLOADS_BASE}/uploads/tasks/${task.taskDocument.filename}`}
                                target="_blank" rel="noopener noreferrer"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', margin: '8px 0', padding: '8px 14px', background: '#dbeafe', borderRadius: '8px', border: '1px solid #93c5fd', color: '#1e40af', textDecoration: 'none', fontWeight: '600', fontSize: '13px' }}
                              >
                                📄 View Task Document (PDF)
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
              )
            )}

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
                  if (res.data.success) { setTasks(res.data.tasks); return res.data.tasks; }
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
              <p>Your official documents and certificates</p>
            </div>

            <div className="card">
              {(() => {
                const hasAny = documents && (
                  documents.offerLetter?.filename ||
                  documents.welcomeLetter?.filename ||
                  documents.paymentReceipt?.filename ||
                  (documents.otherCertificates?.length > 0)
                );
                if (!hasAny) return (
                  <div className="empty-state">
                    <p>No documents available yet.</p>
                  </div>
                );
                return (
                <div style={{ display: "grid", gap: "16px" }}>
                  {documents.offerLetter?.filename && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "16px",
                        background: "#f9fafb",
                        borderRadius: "10px",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <div>
                        <strong style={{ color: "#374151", fontSize: "15px" }}>
                          Offer Letter
                        </strong>
                        <span
                          style={{
                            color: "#6b7280",
                            fontSize: "13px",
                            marginLeft: "8px",
                          }}
                        >
                          Your official offer letter
                        </span>
                      </div>
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
                          background: "#10b981",
                          color: "white",
                          borderRadius: "6px",
                          textDecoration: "none",
                        }}
                      >
                        View
                      </a>
                    </div>
                  )}
                  {documents.welcomeLetter?.filename && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "16px",
                        background: "#f9fafb",
                        borderRadius: "10px",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <div>
                        <strong style={{ color: "#374151", fontSize: "15px" }}>
                          Welcome Letter
                        </strong>
                        <span
                          style={{
                            color: "#6b7280",
                            fontSize: "13px",
                            marginLeft: "8px",
                          }}
                        >
                          Welcome to the organization
                        </span>
                      </div>
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
                          background: "#10b981",
                          color: "white",
                          borderRadius: "6px",
                          textDecoration: "none",
                        }}
                      >
                        View
                      </a>
                    </div>
                  )}
                  {documents.paymentReceipt?.filename && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "16px",
                        background: "#f9fafb",
                        borderRadius: "10px",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <div>
                        <strong style={{ color: "#374151", fontSize: "15px" }}>
                          Payment Receipt
                        </strong>
                        <span
                          style={{
                            color: "#6b7280",
                            fontSize: "13px",
                            marginLeft: "8px",
                          }}
                        >
                          Payment confirmation document
                        </span>
                      </div>
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
                          background: "#10b981",
                          color: "white",
                          borderRadius: "6px",
                          textDecoration: "none",
                        }}
                      >
                        View
                      </a>
                    </div>
                  )}
                  {documents.otherCertificates?.length > 0 && (
                    <div
                      style={{
                        padding: "16px",
                        background: "#f9fafb",
                        borderRadius: "10px",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <div style={{ marginBottom: "12px" }}>
                        <strong style={{ color: "#374151", fontSize: "15px" }}>
                          Other Certificates (
                          {documents.otherCertificates.length})
                        </strong>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                        }}
                      >
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
                              padding: "10px",
                              background: "white",
                              borderRadius: "6px",
                              textDecoration: "none",
                              color: "#4f46e5",
                              border: "1px solid #e5e7eb",
                            }}
                          >
                            {cert.name || cert.filename}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                );
              })()}

              {/* Assigned Certificates */}
              {assignedCerts.length > 0 && (
                <div style={{ padding: "16px", background: "#f0fdf4", borderRadius: "10px", border: "2px solid #86efac", marginTop: "20px" }}>
                  <div style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <strong style={{ color: "#15803d", fontSize: "15px" }}>🏆 Assigned Certificates ({assignedCerts.length})</strong>
                    <span style={{ fontSize: "12px", color: "#16a34a", background: "#dcfce7", padding: "2px 8px", borderRadius: "10px" }}>5-day download window</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {assignedCerts.map(cert => {
                      const timeLeft = new Date(cert.expiresAt) - new Date();
                      const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
                      const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                      const expired = timeLeft <= 0;
                      return (
                        <div key={cert._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "white", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                          <div>
                            <div style={{ fontWeight: "600", color: "#0f172a" }}>{cert.name}</div>
                            <div style={{ fontSize: "12px", color: expired ? "#dc2626" : days >= 2 ? "#16a34a" : "#d97706", marginTop: "2px" }}>
                              {expired ? "Expired" : `${days}d ${hours}h remaining`}
                            </div>
                          </div>
                          {!expired && (
                            <a
                              href={`${UPLOADS_BASE}/uploads/certificates/${cert.filename}`}
                              download
                              target="_blank"
                              rel="noreferrer"
                              style={{ padding: "8px 16px", background: "#22c55e", color: "white", borderRadius: "6px", textDecoration: "none", fontWeight: "600", fontSize: "13px" }}
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
                          "4px solid " +
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
                            fontSize: "15px",
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
                          color: "#374151",
                          fontSize: "14px",
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
                            color: "#3b82f6",
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
                            background: "#3b82f6",
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

      <AIAssistant
        currentSection={activeSection}
        onAction={handleAssistantAction}
        onRefreshData={getAssistantSnapshot}
      />
    </div>
  );
}

export default InternDashboard;
