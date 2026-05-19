import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AddIntern from "./AddIntern";
import ViewInterns from "./ViewInterns";
import ArchivedStudents from "./ArchivedStudents";
import CreateTask from "./CreateTask";
import ManageTasks from "./ManageTasks";
import PendingApprovals from "./PendingApprovals";
import CompletedTasks from "./CompletedTasks";
import InternshipManagement from "./InternshipManagement";
import SMSProgramManagement from "./SMSProgramManagement";
import Certificates from "./Certificates";
import Notifications from "./Notifications";
import JobsInternships from "./JobsInternships";
import AccessManagement from "./AccessManagement";
import Reports from "./Reports";
import ManageRepresentatives from "./ManageRepresentatives";
import RepresentativePayoutManagement from "./RepresentativePayoutManagement";
import GroupManagement from "./GroupManagement";
import ActivityManagementNew from "./ActivityManagementNew";
import { adminAPI, taskAPI } from "../services/api";
import logo from "../assets/logo.png";

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalInterns: 0,
    activeInterns: 0,
    completedInterns: 0,
    thisMonthInterns: 0,
  });
  const [taskStats, setTaskStats] = useState({
    totalTasks: 0,
    assignedTasks: 0,
    inProgressTasks: 0,
    pendingApprovalTasks: 0,
    completedTasks: 0,
  });

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    const userRole = localStorage.getItem("userRole");

    if (!token || !userData || userRole !== "admin") {
      navigate("/admin-login");
      return;
    }

    setUser(JSON.parse(userData));
  }, [navigate]);

  // Fetch stats on mount and when activeMenu changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching stats...");
        const statsResponse = await adminAPI.getStats();
        console.log("Stats response:", statsResponse.data);
        if (statsResponse.data.success) {
          setStats(statsResponse.data.stats);
        }

        console.log("Fetching task stats...");
        const taskStatsResponse = await taskAPI.getTaskStats();
        console.log("Task stats response:", taskStatsResponse.data);
        if (taskStatsResponse.data.success) {
          setTaskStats(taskStatsResponse.data.stats);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user, activeMenu]);

  const fetchStats = async () => {
    try {
      const response = await adminAPI.getStats();
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const fetchTaskStats = async () => {
    try {
      const response = await taskAPI.getTaskStats();
      if (response.data.success) {
        setTaskStats(response.data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch task stats:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleCardKeyDown = (event, menuKey) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setActiveMenu(menuKey);
    }
  };

  // Listen for hash changes so other pages (ActivityManagement) can request opening sidebar sections
  useEffect(() => {
    const mapHashToMenu = (hash) => {
      if (!hash) return null;
      const h = String(hash || '').trim();
      if (h === '#create-task') return 'create-task';
      if (h === '#manage-tasks') return 'manage-tasks';
      if (h === '#pending-approvals') return 'pending-approvals';
      return null;
    };

    const applyHash = () => {
      try {
        const menu = mapHashToMenu(window.location.hash);
        if (menu) {
          setActiveMenu(menu);
          setSidebarOpen(true);
        }
      } catch (e) { /* ignore */ }
    };

    // apply immediately on mount
    applyHash();
    window.addEventListener('hashchange', applyHash);
    // also listen for programmatic menu open events
    const openMenuHandler = (e) => {
      try {
        const menu = e?.detail?.menu;
        if (menu) {
          setActiveMenu(menu);
          setSidebarOpen(true);
        }
      } catch (err) { /* ignore */ }
    };
    window.addEventListener('openAdminMenu', openMenuHandler);
    return () => {
      window.removeEventListener('hashchange', applyHash);
      window.removeEventListener('openAdminMenu', openMenuHandler);
    };
  }, []);

  const renderContent = () => {
    switch (activeMenu) {
      case "dashboard":
        return (
          <>
            <div className="premium-page-header">
              <div className="header-left">
                <h1>Admin Dashboard</h1>
                <p className="header-subtitle">Welcome back, {user?.email}</p>
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

            {/* Student Statistics */}
            <div className="premium-stats-grid">
              <div
                className="premium-stat-card accent-blue admin-clickable-card"
                role="button"
                tabIndex={0}
                onClick={() => setActiveMenu("view-interns")}
                onKeyDown={(event) => handleCardKeyDown(event, "view-interns")}
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
                  <div className="stat-value">{stats.totalInterns}</div>
                  <div className="stat-meta">All enrolled students</div>
                </div>
              </div>

              <div
                className="premium-stat-card accent-teal admin-clickable-card"
                role="button"
                tabIndex={0}
                onClick={() => setActiveMenu("view-interns")}
                onKeyDown={(event) => handleCardKeyDown(event, "view-interns")}
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
                  <div className="stat-label">Active Students</div>
                  <div className="stat-value">{stats.activeInterns}</div>
                  <div className="stat-meta">Currently enrolled</div>
                </div>
              </div>

              <div
                className="premium-stat-card accent-indigo admin-clickable-card"
                role="button"
                tabIndex={0}
                onClick={() => setActiveMenu("archived-students")}
                onKeyDown={(event) => handleCardKeyDown(event, "archived-students")}
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
                  <div className="stat-value">{stats.completedInterns}</div>
                  <div className="stat-meta">Program finished</div>
                </div>
              </div>

              <div
                className="premium-stat-card accent-slate admin-clickable-card"
                role="button"
                tabIndex={0}
                onClick={() => setActiveMenu("add-intern")}
                onKeyDown={(event) => handleCardKeyDown(event, "add-intern")}
              >
                <div className="stat-icon-wrapper">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="stat-content">
                  <div className="stat-label">This Month</div>
                  <div className="stat-value">{stats.thisMonthInterns}</div>
                  <div className="stat-meta">New enrollments</div>
                </div>
              </div>
            </div>

            {/* Task Statistics Section */}
            <div className="premium-card" style={{ marginBottom: "24px" }}>
              <div className="premium-card-header">
                <h2>Task Statistics</h2>
              </div>

              <div className="premium-stats-grid" style={{ marginBottom: "0" }}>
                <div
                  className="premium-stat-card accent-blue admin-clickable-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveMenu("manage-tasks")}
                  onKeyDown={(event) => handleCardKeyDown(event, "manage-tasks")}
                >
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
                    <div className="stat-value">{taskStats.totalTasks}</div>
                    <div className="stat-meta">All tasks created</div>
                  </div>
                </div>

                <div
                  className="premium-stat-card accent-teal admin-clickable-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveMenu("manage-tasks")}
                  onKeyDown={(event) => handleCardKeyDown(event, "manage-tasks")}
                >
                  <div className="stat-icon-wrapper">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                  </div>
                  <div className="stat-content">
                    <div className="stat-label">Assigned</div>
                    <div className="stat-value">{taskStats.assignedTasks}</div>
                    <div className="stat-meta">Assigned to students</div>
                  </div>
                </div>

                <div
                  className="premium-stat-card accent-indigo admin-clickable-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveMenu("manage-tasks")}
                  onKeyDown={(event) => handleCardKeyDown(event, "manage-tasks")}
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
                    <div className="stat-label">In Progress</div>
                    <div className="stat-value">
                      {taskStats.inProgressTasks}
                    </div>
                    <div className="stat-meta">Currently working</div>
                  </div>
                </div>

                <div
                  className="premium-stat-card accent-slate admin-clickable-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveMenu("pending-approvals")}
                  onKeyDown={(event) => handleCardKeyDown(event, "pending-approvals")}
                >
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
                      {taskStats.pendingApprovalTasks}
                    </div>
                    <div className="stat-meta">Awaiting review</div>
                  </div>
                </div>

                <div
                  className="premium-stat-card accent-blue admin-clickable-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveMenu("completed-tasks")}
                  onKeyDown={(event) => handleCardKeyDown(event, "completed-tasks")}
                >
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
                    <div className="stat-value">{taskStats.completedTasks}</div>
                    <div className="stat-meta">Successfully finished</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="premium-action-grid">
              <div
                className="premium-action-card admin-clickable-card"
                role="button"
                tabIndex={0}
                onClick={() => setActiveMenu("add-intern")}
                onKeyDown={(event) => handleCardKeyDown(event, "add-intern")}
              >
                <div className="action-card-icon blue">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <div className="action-card-content">
                  <h3>Add New Student</h3>
                  <p>Enroll new students into programs</p>
                </div>
                <button
                  className="action-card-btn"
                  onClick={() => setActiveMenu("add-intern")}
                >
                  Add
                </button>
              </div>

              <div
                className="premium-action-card admin-clickable-card"
                role="button"
                tabIndex={0}
                onClick={() => setActiveMenu("create-task")}
                onKeyDown={(event) => handleCardKeyDown(event, "create-task")}
              >
                <div className="action-card-icon teal">
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
                  <h3>Create Task</h3>
                  <p>Assign new tasks to students</p>
                </div>
                <button
                  className="action-card-btn"
                  onClick={() => setActiveMenu("create-task")}
                >
                  Create
                </button>
              </div>

              <div
                className="premium-action-card admin-clickable-card"
                role="button"
                tabIndex={0}
                onClick={() => setActiveMenu("reports")}
                onKeyDown={(event) => handleCardKeyDown(event, "reports")}
              >
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
                  <h3>View Reports</h3>
                  <p>Access analytics and insights</p>
                </div>
                <button
                  className="action-card-btn"
                  onClick={() => setActiveMenu("reports")}
                >
                  View
                </button>
              </div>
            </div>
          </>
        );

      case "add-intern":
        return (
          <AddIntern
            key="add-intern"
            onInternAdded={fetchStats}
            onBack={() => setActiveMenu("view-interns")}
          />
        );

      case "view-interns":
        return (
          <ViewInterns
            key="view-interns"
            onInternDeleted={fetchStats}
            onAddStudentClick={() => setActiveMenu("add-intern")}
          />
        );

      case "group-management":
        return <GroupManagement key="group-management" />;

      case "archived-students":
        return <ArchivedStudents key="archived-students" />;

      case "create-task":
        return <CreateTask key="create-task" onTaskCreated={fetchTaskStats} onBack={() => setActiveMenu('activity-management')} />;

      case "manage-tasks":
        return (
          <ManageTasks key="manage-tasks" onTaskApproved={fetchTaskStats} onBack={() => setActiveMenu('activity-management')} />
        );

      case "pending-approvals":
        return (
          <PendingApprovals
            key="pending-approvals"
            onTaskApproved={fetchTaskStats}
            onBack={() => setActiveMenu('activity-management')}
          />
        );

      case "completed-tasks":
        return <CompletedTasks key="completed-tasks" />;

      case "internship-management":
        return (
          <InternshipManagement
            key="internship-management"
            onAddStudentClick={() => setActiveMenu("add-intern")}
          />
        );

      case "sms-management":
        return <SMSProgramManagement key="sms-management" />;

      case "certificates":
        return <Certificates key="certificates" />;

      case "notifications":
        return <Notifications key="notifications" />;

      case "jobs-internships":
        return <JobsInternships key="jobs-internships" />;

      case "access-management":
        return <AccessManagement key="access-management" />;

      case "reports":
        return <Reports key="reports" />;

      case "representatives":
        return (
          <ManageRepresentatives
            key="representatives"
          />
        );

      case "representative-payout":
        return <RepresentativePayoutManagement key="representative-payout" />;

      case "activity-management":
        return <ActivityManagementNew />;
      default:
        return (
          <div className="content-header">
            <h1>Coming Soon</h1>
            <p>This feature is under development</p>
          </div>
        );
    }
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
            <img src={logo} alt="PRS Portal" className="sidebar-logo" />
          </div>
          <h2>PRS PORTAL</h2>
          <p>Admin Pannel</p>
        </div>

        <ul className="sidebar-menu">
          <li
            className={activeMenu === "dashboard" ? "active" : ""}
            onClick={() => {
              setActiveMenu("dashboard");
              setSidebarOpen(false);
            }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z"
              />
            </svg>
            Dashboard
          </li>

          <li
            className={activeMenu === "view-interns" ? "active" : ""}
            onClick={() => {
              setActiveMenu("view-interns");
              setSidebarOpen(false);
            }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            View all Aspirant
          </li>

          <li
            className={activeMenu === "sms-management" ? "active" : ""}
            onClick={() => {
              setActiveMenu("sms-management");
              setSidebarOpen(false);
            }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            SMS program Management
          </li>

          <li
            className={activeMenu === "internship-management" ? "active" : ""}
            onClick={() => {
              setActiveMenu("internship-management");
              setSidebarOpen(false);
            }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Internship Management
          </li>

          <li
            className={activeMenu === "representatives" ? "active" : ""}
            onClick={() => {
              setActiveMenu("representatives");
              setSidebarOpen(false);
            }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M16 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            Representative
          </li>

          <li
            className={activeMenu === "representative-payout" ? "active" : ""}
            onClick={() => {
              setActiveMenu("representative-payout");
              setSidebarOpen(false);
            }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Representative Payout
          </li>

          <li
            className={activeMenu === "access-management" ? "active" : ""}
            onClick={() => {
              setActiveMenu("access-management");
              setSidebarOpen(false);
            }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            Employee Management
          </li>

          <li
            className={activeMenu === "group-management" ? "active" : ""}
            onClick={() => {
              setActiveMenu("group-management");
              setSidebarOpen(false);
            }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h10v10H7zM3 3h4v4H3zM17 3h4v4h-4zM3 17h4v4H3zM17 17h4v4h-4z"
              />
            </svg>
            Group Management
          </li>

          <li
            className={activeMenu === "certificates" ? "active" : ""}
            onClick={() => {
              setActiveMenu("certificates");
              setSidebarOpen(false);
            }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
            Documents
          </li>

          {/* Create/manage task & pending-approvals moved to Activity Management actions; removed from sidebar */}

          <li
            className={activeMenu === "notifications" ? "active" : ""}
            onClick={() => {
              setActiveMenu("notifications");
              setSidebarOpen(false);
            }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            Notifications
          </li>

          <li
            className={activeMenu === "jobs-internships" ? "active" : ""}
            onClick={() => {
              setActiveMenu("jobs-internships");
              setSidebarOpen(false);
            }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Jobs and internship updates
          </li>

          <li
            className={activeMenu === "archived-students" ? "active" : ""}
            onClick={() => {
              setActiveMenu("archived-students");
              setSidebarOpen(false);
            }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
              />
            </svg>
            archived students
          </li>

          <li
            className={activeMenu === "reports" ? "active" : ""}
            onClick={() => {
              setActiveMenu("reports");
              setSidebarOpen(false);
            }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            reports
          </li>

          <li
            className={activeMenu === "activity-management" ? "active" : ""}
            onClick={() => {
              setActiveMenu("activity-management");
              setSidebarOpen(false);
            }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Activity Management
          </li>
        </ul>

        <button className="logout-btn" onClick={handleLogout}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Logout
        </button>
      </aside>

      <main className="main-content">{renderContent()}</main>
    </div>
  );
}

export default AdminDashboard;
