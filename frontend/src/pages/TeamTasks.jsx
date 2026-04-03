import { useState, useRef, useEffect } from "react";
import { taskAPI, UPLOADS_BASE } from "../services/api";

function TeamTasks({
  user,
  tasks,
  loading,
  error,
  onProgressUpdate,
  onTasksRefresh,
}) {
  const [selectedTask, setSelectedTask] = useState(null);
  const [teamMessage, setTeamMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [msgError, setMsgError] = useState("");
  const messagesEndRef = useRef(null);
  const pollingRef = useRef(null);

  const teamTasks = tasks.filter((t) => t.isTeamTask);

  // Scroll to latest message when modal opens or new message arrives
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedTask?._id, selectedTask?.teamMessages?.length]);

  // Keep selectedTask in sync when tasks prop refreshes
  useEffect(() => {
    if (selectedTask) {
      const updated = tasks.find((t) => t._id === selectedTask._id);
      if (updated) setSelectedTask(updated);
    }
  }, [tasks]);

  // Auto-poll for new messages while a task's discussion is open
  useEffect(() => {
    if (selectedTask) {
      pollingRef.current = setInterval(async () => {
        try {
          const res = await taskAPI.getInternTasks();
          if (res.data?.tasks) {
            const updated = res.data.tasks.find(
              (t) => t._id === selectedTask._id,
            );
            if (
              updated &&
              updated.teamMessages?.length !== selectedTask.teamMessages?.length
            ) {
              setSelectedTask(updated);
              if (onTasksRefresh) onTasksRefresh();
            }
          }
        } catch (_) {
          /* silent */
        }
      }, 8000);
    } else {
      clearInterval(pollingRef.current);
    }
    return () => clearInterval(pollingRef.current);
  }, [selectedTask?._id, selectedTask?.teamMessages?.length]);

  const refreshAndSync = async () => {
    if (onTasksRefresh) {
      const refreshed = await onTasksRefresh();
      if (refreshed) {
        const updated = refreshed.find((t) => t._id === selectedTask._id);
        if (updated) setSelectedTask(updated);
        return refreshed;
      }
    } else {
      const res = await taskAPI.getInternTasks();
      if (res.data?.tasks) {
        const updated = res.data.tasks.find((t) => t._id === selectedTask._id);
        if (updated) setSelectedTask(updated);
      }
    }
    return null;
  };

  const handleSendMessage = async () => {
    if (!teamMessage.trim() || !selectedTask) return;
    setSendingMessage(true);
    setMsgError("");
    try {
      await taskAPI.sendTeamMessage(selectedTask._id, {
        message: teamMessage.trim(),
        sentBy: user._id,
        senderName: user.name,
      });
      setTeamMessage("");
      await refreshAndSync();
    } catch (err) {
      console.error("Failed to send message:", err);
      setMsgError(err.response?.data?.message || "Failed to send message.");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!selectedTask || submittingReview) return;
    setSubmittingReview(true);
    try {
      await taskAPI.updateTaskProgress(selectedTask._id, 100);
      await refreshAndSync();
    } catch (err) {
      console.error("Failed to submit for review:", err);
      alert(
        err.response?.data?.message || "Failed to submit. Please try again.",
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });

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

  if (loading)
    return (
      <div className="card">
        <p>Loading team tasks...</p>
      </div>
    );

  if (teamTasks.length === 0) {
    return (
      <div className="card">
        <div className="empty-state">
          <p>
            No squad tasks assigned yet. Your team tasks will appear here once
            assigned by admin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Squad Tasks Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Task Title</th>
                <th>Description</th>
                <th>Deadline</th>
                <th>Team Size</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teamTasks.map((task) => (
                <tr key={task._id}>
                  <td style={{ fontWeight: 600, color: "#0f172a" }}>
                    {task.title}
                  </td>
                  <td style={{ maxWidth: "260px", color: "#475569" }}>
                    {task.description.length > 65
                      ? task.description.substring(0, 65) + "…"
                      : task.description}
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {formatDate(task.deadline)}
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
                      {task.teamMembers?.length || 0} members
                    </span>
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
                    <button
                      onClick={() => {
                        setSelectedTask(task);
                        setMsgError("");
                        setTeamMessage("");
                      }}
                      style={{
                        padding: "8px 18px",
                        backgroundColor: "#3b82f6",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: "600",
                      }}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Team Task Detail Modal ─── */}
      {selectedTask && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedTask(null)}
          style={{ zIndex: 1000 }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "1040px",
              width: "97vw",
              maxHeight: "92vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              padding: 0,
              borderRadius: "16px",
              boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "18px 24px",
                backgroundColor: "#0f172a",
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
                    marginBottom: "5px",
                  }}
                >
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "18px",
                      fontWeight: "700",
                      color: "white",
                      lineHeight: "1.3",
                    }}
                  >
                    {selectedTask.title}
                  </h2>
                  <span
                    style={{
                      padding: "3px 12px",
                      borderRadius: "20px",
                      backgroundColor: `${getStatusColor(selectedTask.status)}25`,
                      color: getStatusColor(selectedTask.status),
                      fontWeight: "700",
                      fontSize: "12px",
                      border: `1px solid ${getStatusColor(selectedTask.status)}50`,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {selectedTask.status}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>
                  Squad Task &nbsp;•&nbsp;{" "}
                  {selectedTask.teamMembers?.length || 0} Members &nbsp;•&nbsp;
                  Due {formatDate(selectedTask.deadline)}
                </p>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                style={{
                  width: "32px",
                  height: "32px",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "8px",
                  fontSize: "15px",
                  cursor: "pointer",
                  color: "white",
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
              {/* LEFT PANEL — Task info + team + submit */}
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
                    {selectedTask.description}
                  </div>
                </div>

                {/* Task Document */}
                {selectedTask.taskDocument?.filename && (
                  <a
                    href={`${UPLOADS_BASE}/uploads/tasks/${selectedTask.taskDocument.filename}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "12px 16px",
                      background: "linear-gradient(135deg,#dbeafe,#bfdbfe)",
                      borderRadius: "10px",
                      border: "1px solid #93c5fd",
                      textDecoration: "none",
                      color: "#1e40af",
                      fontWeight: "600",
                      fontSize: "14px",
                    }}
                  >
                    <span style={{ fontSize: "20px" }}></span>
                    <span style={{ flex: 1 }}>View Task Document (PDF)</span>
                    <span>→</span>
                  </a>
                )}

                {/* Meta grid */}
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
                      {formatDate(selectedTask.deadline)}
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
                      {selectedTask.createdAt
                        ? formatDate(selectedTask.createdAt)
                        : "—"}
                    </div>
                  </div>
                </div>

                {/* Team Members compact list */}
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
                    Team Members ({selectedTask.teamMembers?.length || 0})
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    {(selectedTask.teamMembers || []).map((member) => {
                      const isMe =
                        member._id?.toString() === user._id?.toString();
                      return (
                        <div
                          key={member._id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "10px 14px",
                            borderRadius: "10px",
                            backgroundColor: isMe ? "#eff6ff" : "#f8fafc",
                            border: isMe
                              ? "1.5px solid #bfdbfe"
                              : "1px solid #e2e8f0",
                          }}
                        >
                          <div
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              backgroundColor: isMe ? "#3b82f6" : "#e0e7ff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "14px",
                              fontWeight: "700",
                              color: isMe ? "white" : "#4f46e5",
                              flexShrink: 0,
                            }}
                          >
                            {member.name?.charAt(0).toUpperCase()}
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
                                {member.name}
                              </span>
                              {isMe && (
                                <span
                                  style={{
                                    fontSize: "10px",
                                    padding: "2px 7px",
                                    backgroundColor: "#3b82f6",
                                    color: "white",
                                    borderRadius: "8px",
                                    fontWeight: "700",
                                  }}
                                >
                                  YOU
                                </span>
                              )}
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
                              {member.studentId ? ` • ${member.studentId}` : ""}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Submit / status block */}
                {selectedTask.status === "Completed" ? (
                  <div
                    style={{
                      padding: "14px 16px",
                      backgroundColor: "#f0fdf4",
                      borderRadius: "12px",
                      border: "1.5px solid #86efac",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <span style={{ fontSize: "24px" }}></span>
                    <div>
                      <div
                        style={{
                          fontWeight: "700",
                          color: "#15803d",
                          fontSize: "14px",
                        }}
                      >
                        Task Completed!
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#16a34a",
                          marginTop: "2px",
                        }}
                      >
                        Reviewed and approved by admin.
                      </div>
                    </div>
                  </div>
                ) : selectedTask.status === "Pending Approval" ? (
                  <div
                    style={{
                      padding: "14px 16px",
                      backgroundColor: "#fffbeb",
                      borderRadius: "12px",
                      border: "1.5px solid #fde68a",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <span style={{ fontSize: "24px" }}>⏳</span>
                    <div>
                      <div
                        style={{
                          fontWeight: "700",
                          color: "#92400e",
                          fontSize: "14px",
                        }}
                      >
                        Pending Admin Approval
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#b45309",
                          marginTop: "2px",
                        }}
                      >
                        Your team has submitted. Waiting for admin review.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: "16px",
                      backgroundColor: "#f0fdf4",
                      borderRadius: "12px",
                      border: "1.5px solid #86efac",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: "700",
                        color: "#15803d",
                        marginBottom: "4px",
                      }}
                    >
                      ✅ Mark Task as Complete
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#4ade80",
                        marginBottom: "12px",
                      }}
                    >
                      Submit your team's work for admin review. Admin will be
                      notified to approve.
                    </div>
                    <button
                      onClick={handleSubmitForReview}
                      disabled={submittingReview}
                      style={{
                        width: "100%",
                        padding: "11px 0",
                        backgroundColor: submittingReview
                          ? "#86efac"
                          : "#22c55e",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: submittingReview ? "not-allowed" : "pointer",
                        fontWeight: "700",
                        fontSize: "14px",
                        boxShadow: submittingReview
                          ? "none"
                          : "0 4px 12px rgba(34,197,94,0.3)",
                      }}
                    >
                      {submittingReview
                        ? "Submitting..."
                        : "Submit for Admin Review"}
                    </button>
                  </div>
                )}
              </div>

              {/* RIGHT PANEL — Team Discussion */}
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
                    fontSize: "11px",
                    fontWeight: "700",
                    color: "#475569",
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                    backgroundColor: "white",
                    flexShrink: 0,
                  }}
                >
                  Team Discussion
                </div>

                {/* Messages */}
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
                  {!selectedTask.teamMessages ||
                  selectedTask.teamMessages.length === 0 ? (
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
                        Start the team conversation!
                      </div>
                    </div>
                  ) : (
                    selectedTask.teamMessages.map((msg, i) => {
                      const isAdmin =
                        msg.senderName === "Admin" ||
                        msg.senderName?.toLowerCase().includes("admin");
                      const isMe =
                        !isAdmin &&
                        msg.sentBy?.toString() === user._id?.toString();
                      const hasReply =
                        msg.replyToSnippet && msg.replyToSenderName;
                      return (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            justifyContent: isMe ? "flex-end" : "flex-start",
                          }}
                        >
                          <div
                            style={{
                              maxWidth: "82%",
                              padding: "9px 13px",
                              borderRadius: isMe
                                ? "14px 14px 4px 14px"
                                : "14px 14px 14px 4px",
                              backgroundColor: isAdmin
                                ? "#fef3c7"
                                : isMe
                                  ? "#3b82f6"
                                  : "white",
                              border: isAdmin
                                ? "1px solid #fde68a"
                                : isMe
                                  ? "none"
                                  : "1px solid #e2e8f0",
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
                                  borderLeft: `3px solid ${isAdmin ? "#f59e0b" : isMe ? "rgba(255,255,255,0.5)" : "#94a3b8"}`,
                                  backgroundColor: isAdmin
                                    ? "rgba(245,158,11,0.12)"
                                    : isMe
                                      ? "rgba(255,255,255,0.15)"
                                      : "#f1f5f9",
                                  fontSize: "11px",
                                }}
                              >
                                <div
                                  style={{
                                    fontWeight: "700",
                                    color: isAdmin
                                      ? "#92400e"
                                      : isMe
                                        ? "rgba(255,255,255,0.8)"
                                        : "#475569",
                                    marginBottom: "2px",
                                  }}
                                >
                                  ↩ {msg.replyToSenderName}
                                </div>
                                <div
                                  style={{
                                    color: isAdmin
                                      ? "#78350f"
                                      : isMe
                                        ? "rgba(255,255,255,0.7)"
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
                                  color: isAdmin
                                    ? "#92400e"
                                    : isMe
                                      ? "rgba(255,255,255,0.85)"
                                      : "#0f172a",
                                }}
                              >
                                {isAdmin ? "" : ""}
                                {msg.senderName}
                                {isMe ? " (You)" : ""}
                              </span>
                              <span
                                style={{
                                  fontSize: "10px",
                                  color: isAdmin
                                    ? "#a16207"
                                    : isMe
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
                                color: isAdmin
                                  ? "#78350f"
                                  : isMe
                                    ? "white"
                                    : "#334155",
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
                  <div ref={messagesEndRef} />
                </div>

                {/* Error bar */}
                {msgError && (
                  <div
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#fee2e2",
                      borderTop: "1px solid #fecaca",
                      fontSize: "12px",
                      color: "#dc2626",
                      flexShrink: 0,
                    }}
                  >
                    ⚠️ {msgError}
                  </div>
                )}

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
                    value={teamMessage}
                    onChange={(e) => setTeamMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        !sendingMessage &&
                        teamMessage.trim()
                      )
                        handleSendMessage();
                    }}
                    placeholder="Type a message…"
                    disabled={sendingMessage}
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
                    onClick={handleSendMessage}
                    disabled={!teamMessage.trim() || sendingMessage}
                    style={{
                      padding: "10px 18px",
                      backgroundColor:
                        teamMessage.trim() && !sendingMessage
                          ? "#3b82f6"
                          : "#e2e8f0",
                      color:
                        teamMessage.trim() && !sendingMessage
                          ? "white"
                          : "#94a3b8",
                      border: "none",
                      borderRadius: "8px",
                      cursor:
                        teamMessage.trim() && !sendingMessage
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

export default TeamTasks;
