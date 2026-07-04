import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { taskAPI, UPLOADS_BASE } from "../services/api";

function ManageTasks({ onTaskApproved, onBack }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeSection, setActiveSection] = useState("team");
  const [expandedTask, setExpandedTask] = useState(null);
  const [adminMessage, setAdminMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    deadline: "",
  });
  const [openActionMenu, setOpenActionMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, openUpward: false });
  const [viewingTaskDetails, setViewingTaskDetails] = useState(null);

  const toggleActionMenu = (id, event) => {
    if (openActionMenu === id) {
      setOpenActionMenu(null);
    } else {
      const rect = event.currentTarget.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const menuHeight = 180;
      const openUpward = spaceBelow < menuHeight && spaceAbove > spaceBelow;

      setMenuPosition({
        top: openUpward ? rect.top - 4 : rect.bottom + 4,
        left: rect.right - 160,
        openUpward,
      });
      setOpenActionMenu(id);
    }
  };

  const adminUser = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      // Close menu if clicking outside any action menu button or dropdown
      if (!e.target.closest('[data-action-menu]')) {
        setOpenActionMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await taskAPI.getAllTasks();
      if (response.data.success && response.data.tasks)
        setTasks(response.data.tasks);
      else setTasks([]);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to fetch tasks. Please check if you are logged in.",
      );
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const teamTasks = tasks.filter((t) => t.isTeamTask);
  const soloTasks = tasks.filter((t) => !t.isTeamTask);

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 4000);
  };

  const handleApproveTask = async (taskId) => {
    try {
      await taskAPI.approveTask(taskId);
      // Refresh the full task list so all views stay in sync
      await fetchTasks();
      if (expandedTask?._id === taskId)
        setExpandedTask((prev) => ({ ...prev, status: "Completed" }));
      if (onTaskApproved) onTaskApproved();
      showSuccess("Task approved successfully!");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to approve task";
      setError(msg);
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await taskAPI.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      if (expandedTask?._id === taskId) setExpandedTask(null);
      if (onTaskApproved) onTaskApproved();
      showSuccess("Task deleted");
    } catch {
      setError("Failed to delete task");
      setTimeout(() => setError(""), 4000);
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setEditForm({
      title: task.title,
      description: task.description,
      deadline: new Date(task.deadline).toISOString().slice(0, 16),
    });
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    try {
      await taskAPI.editTask(editingTask._id, editForm);
      setTasks((prev) =>
        prev.map((t) =>
          t._id === editingTask._id
            ? { ...t, ...editForm, deadline: new Date(editForm.deadline) }
            : t,
        ),
      );
      setEditingTask(null);
      if (onTaskApproved) onTaskApproved();
      showSuccess("Task updated successfully");
    } catch {
      setError("Failed to update task");
      setTimeout(() => setError(""), 4000);
    }
  };

  const handleSendAdminMessage = async () => {
    if (!adminMessage.trim() || !expandedTask) return;
    setSendingMessage(true);
    try {
      const res = await taskAPI.sendAdminTeamMessage(expandedTask._id, {
        message: adminMessage,
        senderName: adminUser.name || "Admin",
      });
      setExpandedTask(res.data.task);
      setTasks((prev) =>
        prev.map((t) => (t._id === expandedTask._id ? res.data.task : t)),
      );
      setAdminMessage("");
    } catch (err) {
      console.error("Send message failed:", err);
    } finally {
      setSendingMessage(false);
    }
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

  const renderActionMenu = (task, isTeamTask) => {
    const isOpen = openActionMenu === task._id;
    const menuOptions = [];

    // View Details (always available)
    menuOptions.push({
      label: "View Details",
      action: () => {
        setViewingTaskDetails(task);
        setOpenActionMenu(null);
      },
    });

    if (isTeamTask) {
      menuOptions.push({
        label: "Chat with Team",
        action: () => {
          setExpandedTask(task);
          setAdminMessage("");
          setOpenActionMenu(null);
        },
      });
    }

    if (task.status === "Pending Approval") {
      menuOptions.push({
        label: "Approve",
        action: () => {
          handleApproveTask(task._id);
          setOpenActionMenu(null);
        },
        className: "approve",
      });
    }

    menuOptions.push({
      label: "Edit",
      action: () => {
        handleEditTask(task);
        setOpenActionMenu(null);
      },
      className: "edit",
    });

    // Allow deleting any task
    menuOptions.push({
      label: "Delete",
      action: () => {
        handleDeleteTask(task._id);
        setOpenActionMenu(null);
      },
      className: "delete",
    });

    return (
      <div
        data-action-menu
        style={{
          position: "relative",
          display: "inline-block",
        }}
      >
        <button
          data-action-menu
          onClick={(e) => {
            e.stopPropagation();
            toggleActionMenu(task._id, e);
          }}
          style={{
            background: isOpen ? "#f1f5f9" : "transparent",
            color: "#0f172a",
            border: "1px solid #d1d5db",
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
          title="Actions"
        >
          ⋮
        </button>

        {isOpen &&
          createPortal(
            <div
              data-action-menu
              style={{
                position: "fixed",
                left: `${menuPosition.left}px`,
                top: `${menuPosition.top}px`,
                transform: menuPosition.openUpward ? "translateY(-100%)" : "none",
                background: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
                zIndex: 11000,
                width: "160px",
                overflow: "hidden",
              }}
            >
              {menuOptions.map((option, idx) => (
                <button
                  key={idx}
                  onClick={option.action}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    background: "white",
                    border: "none",
                    textAlign: "left",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#0f172a",
                    borderTop: idx > 0 ? "1px solid #f3f4f6" : "none",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#f9fafb";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "white";
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>,
            document.body
          )}
      </div>
    );
  };

  const fmt = (d) =>
    new Date(d).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  const fmtFull = (d) =>
    new Date(d).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  if (loading)
    return (
      <div className="content-header">
        <h1>Loading tasks...</h1>
      </div>
    );

  return (
    <>
      <div className="premium-page-header" style={{ justifyContent: 'space-between', alignItems: 'center', display: 'flex' }}>
        <div className="header-left">
          <h1>Manage Tasks</h1>
          <p className="header-subtitle">Monitor and manage all assigned tasks</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="header-right" style={{ marginRight: 8 }}>
            <div className="date-badge">
              {new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </div>
          {onBack && (
            <button onClick={onBack} className="back-button back-button-primary" title="Back to Activity Management">
              Back
            </button>
          )}
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: "16px",
            marginBottom: "20px",
            backgroundColor: "#fee2e2",
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
          {success}
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
            <div className="stat-value">{tasks.length}</div>
            <div className="stat-meta">All tasks created</div>
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
            <div className="stat-value">
              {tasks.filter((t) => t.status === "In Progress").length}
            </div>
            <div className="stat-meta">Currently working</div>
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
            <div className="stat-label">Pending Approval</div>
            <div className="stat-value">
              {tasks.filter((t) => t.status === "Pending Approval").length}
            </div>
            <div className="stat-meta">Awaiting review</div>
          </div>
        </div>

        <div className="premium-stat-card accent-teal">
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
            <div className="stat-value">
              {tasks.filter((t) => t.status === "Completed").length}
            </div>
            <div className="stat-meta">Successfully finished</div>
          </div>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="premium-card" style={{ marginBottom: "24px" }}>
        <div className="premium-card-header">
          <h2>Tasks Overview</h2>
        </div>

        <div
          style={{
            display: "flex",
            gap: "4px",
            padding: "12px",
            background: "#f1f5f9",
            borderRadius: "12px",
            width: "fit-content",
          }}
        >
          {[
            { id: "team", label: " Squad Tasks", count: teamTasks.length },
            { id: "solo", label: " Solo Tasks", count: soloTasks.length },
          ].map(({ id, label, count }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              style={{
                padding: "10px 22px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                fontWeight: "700",
                fontSize: "14px",
                background: activeSection === id ? "white" : "transparent",
                color: activeSection === id ? "#0f172a" : "#64748b",
                boxShadow:
                  activeSection === id ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {label}
              <span
                style={{
                  padding: "2px 8px",
                  borderRadius: "10px",
                  fontSize: "12px",
                  background: activeSection === id ? "#eff6ff" : "#e2e8f0",
                  color: activeSection === id ? "#2563eb" : "#64748b",
                }}
              >
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Squad Tasks */}
      {activeSection === "team" &&
        (teamTasks.length === 0 ? (
          <div className="premium-card">
            <div className="empty-state">
              <p>
                No squad tasks created yet. Create a team task to get started.
              </p>
            </div>
          </div>
        ) : (
          <div
            className="premium-card"
            style={{ padding: 0, overflow: "hidden" }}
          >
            <div
              className="premium-card-header"
              style={{ paddingBottom: "9px", paddingLeft: "12px",paddingTop: "12px"  }}
            >
              <h2> Squad Tasks</h2>
            </div>
            <table className="data-table">
              <thead>
                <tr style={{
                  background: '#344158'
                }}>
                  <th style={{
                    background: '#344158',
                    color: '#ffffff',
                    padding: "16px 12px",
                    fontSize: "12px",
                    fontWeight: 700,
                    textAlign: "left",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>#</th>
                  <th style={{
                    background: '#344158',
                    color: '#ffffff',
                    padding: "16px 12px",
                    fontSize: "12px",
                    fontWeight: 700,
                    textAlign: "left",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>Task Title</th>
                  <th style={{
                    background: '#344158',
                    color: '#ffffff',
                    padding: "16px 12px",
                    fontSize: "12px",
                    fontWeight: 700,
                    textAlign: "left",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>Assigned On</th>
                  <th style={{
                    background: '#344158',
                    color: '#ffffff',
                    padding: "16px 12px",
                    fontSize: "12px",
                    fontWeight: 700,
                    textAlign: "left",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>Deadline</th>
                  <th style={{
                    background: '#344158',
                    color: '#ffffff',
                    padding: "16px 12px",
                    fontSize: "12px",
                    fontWeight: 700,
                    textAlign: "center",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>Team Size</th>
                  <th style={{
                    background: '#344158',
                    color: '#ffffff',
                    padding: "16px 12px",
                    fontSize: "12px",
                    fontWeight: 700,
                    textAlign: "left",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>Status</th>
                  <th style={{
                    background: '#344158',
                    color: '#ffffff',
                    padding: "16px 12px",
                    fontSize: "12px",
                    fontWeight: 700,
                    textAlign: "center",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teamTasks.map((task, i) => (
                  <tr key={task._id}>
                    <td style={{ color: "#94a3b8", fontSize: "13px" }}>
                      {i + 1}
                    </td>
                    <td>
                      <div
                        style={{
                          fontWeight: 600,
                          color: "#0f172a",
                          fontSize: "15px",
                        }}
                      >
                        {task.title}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#64748b",
                          marginTop: "3px",
                        }}
                      >
                        {task.description.substring(0, 60)}
                        {task.description.length > 60 ? "..." : ""}
                      </div>
                    </td>
                    <td
                      style={{
                        fontSize: "13px",
                        color: "#475569",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {fmt(task.createdAt)}
                    </td>
                    <td
                      style={{
                        fontSize: "13px",
                        color: "#475569",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {fmt(task.deadline)}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span
                        style={{
                          padding: "4px 12px",
                          borderRadius: "20px",
                          backgroundColor: "#dbeafe",
                          color: "#1e40af",
                          fontWeight: "600",
                          fontSize: "13px",
                        }}
                      >
                        {task.teamMembers?.length || 0}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          padding: "6px 12px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: 600,
                          backgroundColor: `${getStatusColor(task.status)}20`,
                          color: getStatusColor(task.status),
                        }}
                      >
                        {task.status}
                      </span>
                    </td>
                    <td
                      style={{
                        textAlign: "center",
                      }}
                    >
                      {renderActionMenu(task, true)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

      {/* Solo Tasks */}
      {activeSection === "solo" &&
        (soloTasks.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <p> No individual tasks created yet.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="desktop-only">
              <div
                className="premium-card"
                style={{ padding: 0, overflow: "hidden" }}
              >
                <div
                  className="premium-card-header"
                  style={{ paddingBottom: "12px",paddingLeft: "12px",paddingTop: "12px"   }}
                >
                  <h2>Solo Tasks</h2>
                </div>
                <table className="data-table">
                  <thead>
                    <tr style={{
                      background: '#344158'
                    }}>
                      <th style={{
                        width: "22%",
                        background: '#344158',
                        color: '#ffffff',
                        padding: "16px 12px",
                        fontSize: "12px",
                        fontWeight: 700,
                        textAlign: "left",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px"
                      }}>Task Details</th>
                      <th style={{
                        width: "15%",
                        background: '#344158',
                        color: '#ffffff',
                        padding: "16px 12px",
                        fontSize: "12px",
                        fontWeight: 700,
                        textAlign: "left",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px"
                      }}>Assigned To</th>
                      <th style={{
                        width: "14%",
                        background: '#344158',
                        color: '#ffffff',
                        padding: "16px 12px",
                        fontSize: "12px",
                        fontWeight: 700,
                        textAlign: "left",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px"
                      }}>Deadline</th>
                      <th style={{
                        width: "12%",
                        background: '#344158',
                        color: '#ffffff',
                        padding: "16px 12px",
                        fontSize: "12px",
                        fontWeight: 700,
                        textAlign: "left",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px"
                      }}>Status</th>
                      <th style={{
                        width: "21%",
                        background: '#344158',
                        color: '#ffffff',
                        padding: "16px 12px",
                        fontSize: "12px",
                        fontWeight: 700,
                        textAlign: "center",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px"
                      }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {soloTasks.map((task) => (
                      <tr key={task._id}>
                        <td>
                          <div
                            style={{
                              fontWeight: 600,
                              color: "#0f172a",
                              fontSize: "15px",
                              marginBottom: "6px",
                            }}
                          >
                            {task.title}
                          </div>
                          <div
                            style={{
                              fontSize: "13px",
                              color: "#64748b",
                              lineHeight: "1.4",
                            }}
                          >
                            {task.description.substring(0, 80)}
                            {task.description.length > 80 ? "..." : ""}
                          </div>
                        </td>
                        <td>
                          <div
                            style={{
                              fontWeight: 600,
                              color: "#0f172a",
                              marginBottom: "4px",
                            }}
                          >
                            {task.assignedTo?.name}
                          </div>
                          <div
                            style={{
                              padding: "4px 8px",
                              background: "#f1f5f9",
                              borderRadius: "6px",
                              display: "inline-block",
                              fontSize: "12px",
                              fontWeight: 600,
                              color: "#475569",
                            }}
                          >
                            {task.assignedTo?.internId}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: "13px", color: "#475569" }}>
                            {fmtFull(task.deadline)}
                          </div>
                        </td>
                        
                        <td>
                          <span
                            style={{
                              padding: "6px 12px",
                              borderRadius: "20px",
                              fontSize: "12px",
                              fontWeight: 600,
                              backgroundColor: `${getStatusColor(task.status)}20`,
                              color: getStatusColor(task.status),
                              whiteSpace: "nowrap",
                            }}
                          >
                            {task.status}
                          </span>
                        </td>
                        <td
                          style={{
                            textAlign: "center",
                          }}
                        >
                          {renderActionMenu(task, false)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile */}
            <div className="mobile-only">
              {soloTasks.map((task) => (
                <div
                  key={task._id}
                  style={{
                    background: "white",
                    borderRadius: "16px",
                    padding: "20px",
                    marginBottom: "16px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "12px",
                      paddingBottom: "12px",
                      borderBottom: "2px solid #f1f5f9",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "16px",
                        fontWeight: 700,
                        margin: 0,
                        flex: 1,
                        color: "#0f172a",
                      }}
                    >
                      {task.title}
                    </h3>
                    <span
                      style={{
                        backgroundColor: `${getStatusColor(task.status)}20`,
                        color: getStatusColor(task.status),
                        padding: "6px 12px",
                        fontSize: "12px",
                        fontWeight: 600,
                        borderRadius: "20px",
                        marginLeft: "10px",
                      }}
                    >
                      {task.status}
                    </span>
                  </div>
                  <p
                    style={{
                      margin: "0 0 16px",
                      fontSize: "13px",
                      color: "#64748b",
                      lineHeight: "1.5",
                    }}
                  >
                    {task.description.substring(0, 120)}
                    {task.description.length > 120 ? "..." : ""}
                  </p>
                  <div
                    style={{
                      background: "#f8fafc",
                      padding: "12px",
                      borderRadius: "12px",
                      marginBottom: "12px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#64748b",
                        marginBottom: "4px",
                      }}
                    >
                      Assigned To
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#0f172a",
                        marginBottom: "4px",
                      }}
                    >
                      {task.assignedTo?.name}
                    </div>
                    <div
                      style={{
                        padding: "4px 10px",
                        background: "white",
                        borderRadius: "6px",
                        display: "inline-block",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#475569",
                      }}
                    >
                      {task.assignedTo?.internId}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px",
                      background: "#fef3c7",
                      borderRadius: "10px",
                      marginBottom: "12px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#92400e",
                        fontWeight: 600,
                      }}
                    >
                      Deadline
                    </span>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#78350f",
                      }}
                    >
                      {fmtFull(task.deadline)}
                    </span>
                  </div>
                  <div style={{ marginBottom: "16px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "8px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#0f172a",
                        }}
                      >
                        Progress
                      </span>
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: task.progress === 100 ? "#10b981" : "#3b82f6",
                        }}
                      >
                        {task.progress}%
                      </span>
                    </div>
                    <div
                      style={{
                        height: "10px",
                        background: "#e2e8f0",
                        borderRadius: "10px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${task.progress}%`,
                          height: "100%",
                          background:
                            task.progress === 100
                              ? "linear-gradient(90deg,#10b981,#059669)"
                              : "linear-gradient(90deg,#3b82f6,#2563eb)",
                          transition: "width 0.3s",
                        }}
                      />
                    </div>
                  </div>
                  <div
                    style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}
                  >
                    <div style={{ flex: 1, display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {task.status === "Pending Approval" && (
                        <button
                          onClick={() => handleApproveTask(task._id)}
                          style={{
                            flex: "1 1 auto",
                            minWidth: "120px",
                            padding: "12px 16px",
                            fontSize: "13px",
                            fontWeight: 600,
                            background: "linear-gradient(135deg,#10b981,#059669)",
                            color: "white",
                            border: "none",
                            borderRadius: "10px",
                            cursor: "pointer",
                          }}
                        >
                          Approve Task
                        </button>
                      )}
                      {task.status === "Completed" && (
                        <div
                          style={{
                            flex: "1 1 auto",
                            minWidth: "120px",
                            padding: "12px",
                            fontSize: "13px",
                            fontWeight: 700,
                            background: "linear-gradient(135deg,#d1fae5,#a7f3d0)",
                            color: "#065f46",
                            borderRadius: "10px",
                            textAlign: "center",
                          }}
                        >
                          Approved
                        </div>
                      )}
                      {task.status !== "Completed" && (
                        <>
                          <button
                            onClick={() => handleEditTask(task)}
                            style={{
                              flex: "1 1 auto",
                              minWidth: "100px",
                              padding: "12px",
                              background:
                                "linear-gradient(135deg,#3b82f6,#2563eb)",
                              color: "white",
                              border: "none",
                              borderRadius: "10px",
                              fontSize: "13px",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task._id)}
                            style={{
                              flex: "1 1 auto",
                              minWidth: "100px",
                              padding: "12px",
                              background:
                                "linear-gradient(135deg,#ef4444,#dc2626)",
                              color: "white",
                              border: "none",
                              borderRadius: "10px",
                              fontSize: "13px",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      {renderActionMenu(task, false)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ))}

      {/* Edit Task Modal */}
      {editingTask && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "20px",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
          >
            <div
              style={{
                padding: "24px 32px",
                background: "linear-gradient(135deg,#0f172a,#1e293b)",
                borderRadius: "20px 20px 0 0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "24px",
                    color: "white",
                    fontWeight: 700,
                  }}
                >
                  Edit Task
                </h2>
                <p
                  style={{
                    margin: "5px 0 0",
                    fontSize: "14px",
                    color: "rgba(255,255,255,0.7)",
                  }}
                >
                  Update task details below
                </p>
              </div>
              <button
                onClick={() => setEditingTask(null)}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "none",
                  color: "white",
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdateTask} style={{ padding: "32px" }}>
              <div className="form-group">
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#0f172a",
                    marginBottom: "8px",
                  }}
                >
                  Task Title
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm({ ...editForm, title: e.target.value })
                  }
                  required
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "2px solid #e2e8f0",
                    borderRadius: "10px",
                    fontSize: "15px",
                    outline: "none",
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = "#3b82f6")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = "#e2e8f0")
                  }
                />
              </div>
              <div className="form-group" style={{ marginTop: "20px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#0f172a",
                    marginBottom: "8px",
                  }}
                >
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  rows="5"
                  required
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "2px solid #e2e8f0",
                    borderRadius: "10px",
                    fontSize: "15px",
                    resize: "vertical",
                    fontFamily: "inherit",
                    outline: "none",
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = "#3b82f6")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = "#e2e8f0")
                  }
                />
              </div>
              <div className="form-group" style={{ marginTop: "20px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#0f172a",
                    marginBottom: "8px",
                  }}
                >
                  Deadline
                </label>
                <input
                  type="datetime-local"
                  value={editForm.deadline}
                  onChange={(e) =>
                    setEditForm({ ...editForm, deadline: e.target.value })
                  }
                  required
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "2px solid #e2e8f0",
                    borderRadius: "10px",
                    fontSize: "15px",
                    outline: "none",
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = "#3b82f6")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = "#e2e8f0")
                  }
                />
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  marginTop: "32px",
                  paddingTop: "24px",
                  borderTop: "1px solid #e2e8f0",
                }}
              >
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  style={{
                    flex: 1,
                    padding: "14px",
                    background: "#f8fafc",
                    color: "#334155",
                    border: "1px solid #cbd5e1",
                    borderRadius: "10px",
                    fontWeight: 600,
                    fontSize: "15px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#eff6ff";
                    e.currentTarget.style.borderColor = "#3b82f6";
                    e.currentTarget.style.color = "#2563eb";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#f8fafc";
                    e.currentTarget.style.borderColor = "#cbd5e1";
                    e.currentTarget.style.color = "#334155";
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: "14px",
                    background: "#344158",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    fontWeight: 600,
                    fontSize: "15px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "0.9";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "1";
                  }}
                >
                  Update Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Task Details Modal */}
      {viewingTaskDetails && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.45)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 11000,
            padding: "20px",
          }}
          onClick={() => setViewingTaskDetails(null)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 12px 32px rgba(15,23,42,0.08)",
              maxWidth: "680px",
              width: "100%",
              maxHeight: "calc(100vh - 40px)",
              overflow: "auto",
              padding: "24px",
              position: "relative"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setViewingTaskDetails(null)}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                width: "30px",
                height: "30px",
                border: "1px solid #e2e8f0",
                borderRadius: "50%",
                background: "#ffffff",
                color: "#64748b",
                fontSize: "18px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: 1
              }}
            >
              ×
            </button>

            {/* Header */}
            <div style={{ marginBottom: "18px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
              <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "4px" }}>
                {viewingTaskDetails.isTeamTask ? "Squad Task Details" : "Solo Task Details"}
              </span>
              <h2 style={{ margin: 0, fontSize: "19px", color: "#334155", fontWeight: 500 }}>
                {viewingTaskDetails.title}
              </h2>
            </div>

            {/* Meta details */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "18px" }}>
              <div style={{ fontSize: "13px", color: "#475569" }}>
                <span style={{ color: "#64748b", minWidth: "120px", display: "inline-block" }}>Status:</span>
                <span style={{ 
                  padding: "3px 10px", 
                  borderRadius: "12px", 
                  fontSize: "11px", 
                  background: `${getStatusColor(viewingTaskDetails.status)}15`, 
                  color: getStatusColor(viewingTaskDetails.status),
                  border: `1px solid ${getStatusColor(viewingTaskDetails.status)}30`,
                  fontWeight: 500
                }}>
                  {viewingTaskDetails.status}
                </span>
              </div>
              <div style={{ fontSize: "13px", color: "#475569" }}>
                <span style={{ color: "#64748b", minWidth: "120px", display: "inline-block" }}>Assigned On:</span>
                <span>{fmtFull(viewingTaskDetails.createdAt)}</span>
              </div>
              <div style={{ fontSize: "13px", color: "#475569" }}>
                <span style={{ color: "#64748b", minWidth: "120px", display: "inline-block" }}>Deadline:</span>
                <span>{fmtFull(viewingTaskDetails.deadline)}</span>
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ margin: "0 0 6px", fontSize: "13px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 500 }}>
                Task Description
              </h4>
              <p style={{ margin: 0, fontSize: "13.5px", color: "#475569", lineHeight: "1.6", background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", whiteSpace: "pre-wrap" }}>
                {viewingTaskDetails.description}
              </p>
            </div>

            {/* Shared Document / PDF */}
            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ margin: "0 0 6px", fontSize: "13px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 500 }}>
                Shared Document
              </h4>
              {viewingTaskDetails.taskDocument?.filename ? (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "18px" }}>📄</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {viewingTaskDetails.taskDocument.filename}
                    </div>
                  </div>
                  <a
                    href={`${UPLOADS_BASE}/uploads/tasks/${viewingTaskDetails.taskDocument.filename}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontSize: "12px",
                      color: "#314158",
                      fontWeight: 500,
                      textDecoration: "none",
                      padding: "6px 12px",
                      border: "1px solid #314158",
                      borderRadius: "6px",
                      background: "#ffffff"
                    }}
                  >
                    Download PDF
                  </a>
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>No document shared with this task.</p>
              )}
            </div>

            {/* Squad Members */}
            {viewingTaskDetails.isTeamTask && (
              <div style={{ marginBottom: "10px" }}>
                <h4 style={{ margin: "0 0 10px", fontSize: "13px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 500 }}>
                  Squad Members ({viewingTaskDetails.teamMembers?.length || 0})
                </h4>
                {viewingTaskDetails.teamMembers?.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {viewingTaskDetails.teamMembers.map((member) => (
                      <div
                        key={member._id || member}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          backgroundColor: "#f8fafc",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            backgroundColor: "#e0e7ff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "13px",
                            fontWeight: 500,
                            color: "#4f46e5",
                            flexShrink: 0,
                          }}
                        >
                          {(member.name || "?").charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "13px", color: "#334155", fontWeight: 500 }}>
                              {member.name || "Unknown"}
                            </span>
                            {member.studentType && (
                              <span style={{
                                fontSize: "10px",
                                padding: "1px 6px",
                                backgroundColor: "#eff6ff",
                                color: "#2563eb",
                                borderRadius: "6px",
                                fontWeight: 500
                              }}>
                                {member.studentType}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "1px" }}>
                            {member.email} {member.internId ? ` • ID: ${member.internId}` : ""} {member.mobile ? ` • Phone: ${member.mobile}` : ""}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>No team members assigned.</p>
                )}
              </div>
            )}

            {/* Footer */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px", paddingTop: "12px", borderTop: "1px solid #e2e8f0" }}>
              <button
                type="button"
                onClick={() => setViewingTaskDetails(null)}
                style={{
                  padding: "8px 16px",
                  background: "#f1f5f9",
                  color: "#475569",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer"
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Squad Task Detail Modal */}
      {expandedTask && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => setExpandedTask(null)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "20px",
              maxWidth: "1040px",
              width: "100%",
              maxHeight: "92vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 60px rgba(0,0,0,0.35)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: "18px 24px",
                background: "linear-gradient(135deg,#1e293b,#0f172a)",
                borderRadius: "20px 20px 0 0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "12px",
                flexShrink: 0,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    flexWrap: "wrap",
                    marginBottom: "4px",
                  }}
                >
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "18px",
                      color: "white",
                      fontWeight: 700,
                      lineHeight: "1.3",
                    }}
                  >
                    {expandedTask.title}
                  </h2>
                  <span
                    style={{
                      padding: "3px 12px",
                      borderRadius: "20px",
                      backgroundColor: `${getStatusColor(expandedTask.status)}25`,
                      color: getStatusColor(expandedTask.status),
                      fontWeight: "700",
                      fontSize: "12px",
                      border: `1px solid ${getStatusColor(expandedTask.status)}50`,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {expandedTask.status}
                  </span>
                  {expandedTask.status === "Pending Approval" && (
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: "20px",
                        backgroundColor: "#fef3c7",
                        color: "#92400e",
                        fontWeight: "700",
                        fontSize: "11px",
                        animation: "pulse 2s infinite",
                      }}
                    >
                      Awaiting Review
                    </span>
                  )}
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: "12px",
                    color: "rgba(255,255,255,0.55)",
                  }}
                >
                  Squad Task &nbsp;•&nbsp;{" "}
                  {expandedTask.teamMembers?.length || 0} members &nbsp;•&nbsp;
                  Deadline: {fmt(expandedTask.deadline)}
                </p>
              </div>
              <button
                onClick={() => setExpandedTask(null)}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "white",
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "15px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                ✕
              </button>
            </div>

            {/* Two-column body */}
            <div
              style={{
                flex: 1,
                display: "flex",
                minHeight: 0,
                overflow: "hidden",
              }}
            >
              {/* LEFT - Task info + members + actions */}
              <div
                style={{
                  flex: "1 1 52%",
                  overflowY: "auto",
                  padding: "20px",
                  borderRight: "1px solid #e2e8f0",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  backgroundColor: "white",
                }}
              >
                {/* Pending Approval banner */}
                {expandedTask.status === "Pending Approval" && (
                  <div
                    style={{
                      padding: "14px 16px",
                      backgroundColor: "#fffbeb",
                      borderRadius: "12px",
                      border: "2px solid #fde68a",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <span style={{ fontSize: "24px" }}></span>
                      <div>
                        <div
                          style={{
                            fontWeight: "700",
                            color: "#92400e",
                            fontSize: "14px",
                          }}
                        >
                          Team submitted for review!
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#b45309",
                            marginTop: "2px",
                          }}
                        >
                          Review the work and approve, or send feedback via
                          chat.
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleApproveTask(expandedTask._id)}
                      style={{
                        padding: "10px 20px",
                        background: "linear-gradient(135deg,#10b981,#059669)",
                        color: "white",
                        border: "none",
                        borderRadius: "10px",
                        cursor: "pointer",
                        fontWeight: "700",
                        fontSize: "13px",
                        boxShadow: "0 4px 12px rgba(16,185,129,0.3)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Approve Task
                    </button>
                  </div>
                )}

                {expandedTask.status === "Completed" && (
                  <div
                    style={{
                      padding: "14px 16px",
                      backgroundColor: "#f0fdf4",
                      borderRadius: "12px",
                      border: "1.5px solid #86efac",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <span style={{ fontSize: "22px" }}></span>
                    <div>
                      <div
                        style={{
                          fontWeight: "700",
                          color: "#15803d",
                          fontSize: "14px",
                        }}
                      >
                        Task Completed & Approved
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#16a34a",
                          marginTop: "2px",
                        }}
                      >
                        This task has been reviewed and approved.
                      </div>
                    </div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <div
                    style={{
                      fontSize: "10px",
                      fontWeight: "700",
                      color: "#94a3b8",
                      textTransform: "uppercase",
                      letterSpacing: "0.8px",
                      marginBottom: "8px",
                    }}
                  >
                    Task Description
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#334155",
                      lineHeight: "1.75",
                      backgroundColor: "#f8fafc",
                      padding: "14px 16px",
                      borderRadius: "10px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    {expandedTask.description}
                  </div>
                </div>

                {/* Meta */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      padding: "12px",
                      backgroundColor: "#fef9c3",
                      borderRadius: "10px",
                      border: "1px solid #fde68a",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#92400e",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        marginBottom: "4px",
                      }}
                    >
                      Deadline
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: "700",
                        color: "#78350f",
                      }}
                    >
                      {fmtFull(expandedTask.deadline)}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: "12px",
                      backgroundColor: "#f0fdf4",
                      borderRadius: "10px",
                      border: "1px solid #86efac",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#15803d",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        marginBottom: "4px",
                      }}
                    >
                      Assigned On
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: "700",
                        color: "#166534",
                      }}
                    >
                      {fmtFull(expandedTask.createdAt)}
                    </div>
                  </div>
                </div>

                {/* Team Members */}
                {expandedTask.teamMembers?.length > 0 && (
                  <div>
                    <div
                      style={{
                        fontSize: "10px",
                        fontWeight: "700",
                        color: "#94a3b8",
                        textTransform: "uppercase",
                        letterSpacing: "0.8px",
                        marginBottom: "10px",
                      }}
                    >
                      Team Members ({expandedTask.teamMembers.length})
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      {expandedTask.teamMembers.map((member) => (
                        <div
                          key={member._id || member}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "10px 14px",
                            borderRadius: "10px",
                            backgroundColor: "#f8fafc",
                            border: "1px solid #e2e8f0",
                          }}
                        >
                          <div
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              backgroundColor: "#e0e7ff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "14px",
                              fontWeight: "700",
                              color: "#4f46e5",
                              flexShrink: 0,
                            }}
                          >
                            {(member.name || "?").charAt(0).toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                flexWrap: "wrap",
                              }}
                            >
                              <span
                                style={{
                                  fontWeight: "700",
                                  color: "#0f172a",
                                  fontSize: "13px",
                                }}
                              >
                                {member.name || "Unknown"}
                              </span>
                              {member.studentType && (
                                <span
                                  style={{
                                    fontSize: "10px",
                                    padding: "2px 7px",
                                    backgroundColor: "#dbeafe",
                                    color: "#1e40af",
                                    borderRadius: "8px",
                                    fontWeight: "600",
                                  }}
                                >
                                  {member.studentType}
                                </span>
                              )}
                            </div>
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#64748b",
                                marginTop: "2px",
                              }}
                            >
                              {member.email}
                              {member.internId ? ` • ${member.internId}` : ""}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {expandedTask.status !== "Pending Approval" && (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => {
                          setExpandedTask(null);
                          handleEditTask(expandedTask);
                        }}
                        style={{
                          flex: 1,
                          padding: "10px",
                          background: "#344158",
                          color: "white",
                          border: "none",
                          borderRadius: "10px",
                          cursor: "pointer",
                          fontWeight: "700",
                          fontSize: "13px",
                          transition: "opacity 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = "0.9";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = "1";
                        }}
                      >
                        Edit Task
                      </button>
                      <button
                        onClick={() => {
                          setExpandedTask(null);
                          handleDeleteTask(expandedTask._id);
                        }}
                        style={{
                          flex: 1,
                          padding: "10px",
                          background: "#344158",
                          color: "white",
                          border: "none",
                          borderRadius: "10px",
                          cursor: "pointer",
                          fontWeight: "700",
                          fontSize: "13px",
                          transition: "opacity 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = "0.9";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = "1";
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
              </div>

              {/* RIGHT - Team Discussion Chat */}
              <div
                style={{
                  flex: "1 1 48%",
                  display: "flex",
                  flexDirection: "column",
                  minWidth: 0,
                  overflow: "hidden",
                  backgroundColor: "#f8fafc",
                }}
              >
                {/* Chat header */}
                <div
                  style={{
                    padding: "13px 18px",
                    borderBottom: "1px solid #e2e8f0",
                    backgroundColor: "white",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      color: "#475569",
                      textTransform: "uppercase",
                      letterSpacing: "0.8px",
                    }}
                  >
                    Team Discussion
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#94a3b8",
                      marginTop: "2px",
                    }}
                  >
                    All team members will see your messages
                  </div>
                </div>

                {/* Messages area */}
                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "14px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {!expandedTask.teamMessages ||
                  expandedTask.teamMessages.length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        color: "#94a3b8",
                        padding: "40px 20px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "8px",
                        flex: 1,
                      }}
                    >
                      <div style={{ fontSize: "36px", opacity: 0.4 }}></div>
                      <div style={{ fontWeight: "600", fontSize: "13px" }}>
                        No messages yet
                      </div>
                      <div style={{ fontSize: "12px" }}>
                        Send a broadcast to start the conversation
                      </div>
                    </div>
                  ) : (
                    expandedTask.teamMessages.map((msg, i) => {
                      const isAdminMsg =
                        msg.senderName === "Admin" ||
                        msg.senderName === (adminUser.name || "");
                      const hasReply =
                        msg.replyToSnippet && msg.replyToSenderName;
                      return (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            justifyContent: isAdminMsg
                              ? "flex-end"
                              : "flex-start",
                          }}
                        >
                          <div
                            style={{
                              maxWidth: "82%",
                              padding: "9px 13px",
                              borderRadius: isAdminMsg
                                ? "14px 14px 4px 14px"
                                : "14px 14px 14px 4px",
                              backgroundColor: isAdminMsg ? "#1e40af" : "white",
                              border: isAdminMsg ? "none" : "1px solid #e2e8f0",
                              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                            }}
                          >
                            {/* Reply quote block */}
                            {hasReply && (
                              <div
                                style={{
                                  padding: "6px 10px",
                                  marginBottom: "8px",
                                  borderRadius: "6px",
                                  borderLeft: `3px solid ${isAdminMsg ? "rgba(255,255,255,0.4)" : "#94a3b8"}`,
                                  backgroundColor: isAdminMsg
                                    ? "rgba(255,255,255,0.12)"
                                    : "#f1f5f9",
                                  fontSize: "11px",
                                }}
                              >
                                <div
                                  style={{
                                    fontWeight: "700",
                                    color: isAdminMsg
                                      ? "rgba(255,255,255,0.75)"
                                      : "#475569",
                                    marginBottom: "2px",
                                  }}
                                >
                                  ↩ {msg.replyToSenderName}
                                </div>
                                <div
                                  style={{
                                    color: isAdminMsg
                                      ? "rgba(255,255,255,0.6)"
                                      : "#64748b",
                                    lineHeight: "1.4",
                                    wordBreak: "break-word",
                                  }}
                                >
                                  {msg.replyToSnippet.length > 90
                                    ? msg.replyToSnippet.substring(0, 90) + "…"
                                    : msg.replyToSnippet}
                                </div>
                              </div>
                            )}
                            <div
                              style={{
                                display: "flex",
                                gap: "8px",
                                alignItems: "center",
                                marginBottom: "4px",
                                flexWrap: "wrap",
                              }}
                            >
                              <span
                                style={{
                                  fontWeight: "700",
                                  fontSize: "11px",
                                  color: isAdminMsg
                                    ? "rgba(255,255,255,0.85)"
                                    : "#0f172a",
                                }}
                              >
                                {isAdminMsg ? "" : ""}
                                {msg.senderName}
                                {isAdminMsg ? " (Admin)" : ""}
                              </span>
                              <span
                                style={{
                                  fontSize: "10px",
                                  color: isAdminMsg
                                    ? "rgba(255,255,255,0.6)"
                                    : "#94a3b8",
                                  marginLeft: "auto",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {new Date(msg.sentAt).toLocaleString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <div
                              style={{
                                fontSize: "13px",
                                color: isAdminMsg ? "white" : "#334155",
                                lineHeight: "1.5",
                                wordBreak: "break-word",
                              }}
                            >
                              {msg.message}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Input */}
                <div
                  style={{
                    padding: "12px 14px",
                    borderTop: "1px solid #e2e8f0",
                    backgroundColor: "white",
                    display: "flex",
                    gap: "8px",
                    flexShrink: 0,
                  }}
                >
                  <input
                    type="text"
                    value={adminMessage}
                    onChange={(e) => setAdminMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        !sendingMessage &&
                        adminMessage.trim()
                      )
                        handleSendAdminMessage();
                    }}
                    placeholder="Type a message to the entire team…"
                    style={{
                      flex: 1,
                      padding: "10px 14px",
                      border: "1.5px solid #e2e8f0",
                      borderRadius: "8px",
                      fontSize: "13px",
                      outline: "none",
                      backgroundColor: "#f8fafc",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#3b82f6";
                      e.target.style.backgroundColor = "white";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e2e8f0";
                      e.target.style.backgroundColor = "#f8fafc";
                    }}
                  />
                  <button
                    onClick={handleSendAdminMessage}
                    disabled={!adminMessage.trim() || sendingMessage}
                    style={{
                      padding: "10px 18px",
                      backgroundColor:
                        adminMessage.trim() && !sendingMessage
                          ? "#1e40af"
                          : "#e2e8f0",
                      color:
                        adminMessage.trim() && !sendingMessage
                          ? "white"
                          : "#94a3b8",
                      border: "none",
                      borderRadius: "8px",
                      cursor:
                        adminMessage.trim() && !sendingMessage
                          ? "pointer"
                          : "not-allowed",
                      fontSize: "13px",
                      fontWeight: "700",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {sendingMessage ? "..." : "Send"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ManageTasks;
