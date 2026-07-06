import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, openUpward: false });
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
            No group tasks assigned yet. Your team tasks will appear here once
            assigned by admin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Group Tasks Table – Polished & Squared */}
      <div className="card" style={{ padding: 0, overflow: "hidden", borderRadius: 0, boxShadow: "0 2px 12px rgba(15,23,42,0.07)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: "760px", borderCollapse: "collapse", fontFamily: "inherit", marginTop: 0 }}>
            <thead>
              <tr>
                <th style={{ background: "#344158", color: "rgba(255,255,255,0.75)", padding: "13px 16px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.7px", textAlign: "left", borderBottom: "2px solid #2a3548" }}>Task Title</th>
                <th style={{ background: "#344158", color: "rgba(255,255,255,0.75)", padding: "13px 16px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.7px", textAlign: "left", borderBottom: "2px solid #2a3548" }}>Description</th>
                <th style={{ background: "#344158", color: "rgba(255,255,255,0.75)", padding: "13px 16px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.7px", textAlign: "left", borderBottom: "2px solid #2a3548" }}>Deadline</th>
                <th style={{ background: "#344158", color: "rgba(255,255,255,0.75)", padding: "13px 16px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.7px", textAlign: "center", borderBottom: "2px solid #2a3548" }}>Team Size</th>
                <th style={{ background: "#344158", color: "rgba(255,255,255,0.75)", padding: "13px 16px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.7px", textAlign: "left", borderBottom: "2px solid #2a3548" }}>Status</th>
                <th style={{ background: "#344158", color: "rgba(255,255,255,0.75)", padding: "13px 16px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.7px", textAlign: "center", borderBottom: "2px solid #2a3548" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {teamTasks.map((task, idx) => {
                const isEven = idx % 2 === 0;
                return (
                  <tr
                    key={task._id}
                    style={{ background: isEven ? "#ffffff" : "#f8fafc", borderBottom: "1px solid #f1f5f9" }}
                    onMouseEnter={e => e.currentTarget.style.background = isEven ? "#ffffff" : "#f8fafc"}
                    onMouseLeave={e => e.currentTarget.style.background = isEven ? "#ffffff" : "#f8fafc"}
                  >
                    {/* Task Title */}
                    <td style={{ padding: "15px 16px", verticalAlign: "middle" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <span style={{ fontWeight: 600, color: "#0f172a", fontSize: "13.5px" }}>{task.title}</span>
                        {task.hasUnreadFeedback && (
                          <span title="New feedback" style={{ width: 7, height: 7, borderRadius: "50%", background: "#f43f5e", display: "inline-block", flexShrink: 0, boxShadow: "0 0 0 2px rgba(244,63,94,0.2)" }} />
                        )}
                      </div>
                    </td>

                    {/* Description */}
                    <td style={{ padding: "15px 16px", verticalAlign: "middle", maxWidth: "260px", color: "#64748b", fontSize: "12px", lineHeight: 1.45 }}>
                      {task.description.length > 65
                        ? task.description.substring(0, 65) + "…"
                        : task.description}
                    </td>

                    {/* Deadline */}
                    <td style={{ padding: "15px 16px", verticalAlign: "middle", whiteSpace: "nowrap", fontSize: "12.5px", color: "#475569", fontWeight: 500 }}>
                      {formatDate(task.deadline)}
                    </td>

                    {/* Team Size */}
                    <td style={{ padding: "15px 16px", verticalAlign: "middle", textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 12px",
                          borderRadius: 20,
                          fontSize: "11px",
                          fontWeight: 700,
                          letterSpacing: "0.03em",
                          backgroundColor: "#32415815",
                          color: "#324158",
                          border: "1px solid #32415835",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {task.teamMembers?.length || 0} members
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "15px 16px", verticalAlign: "middle" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 11px",
                          borderRadius: 20,
                          fontSize: "11px",
                          fontWeight: 700,
                          letterSpacing: "0.03em",
                          backgroundColor: `${getStatusColor(task.status)}15`,
                          color: getStatusColor(task.status),
                          border: `1px solid ${getStatusColor(task.status)}35`,
                          whiteSpace: "nowrap"
                        }}
                      >
                        {task.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "15px 16px", verticalAlign: "middle", textAlign: "center", position: "relative" }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (openDropdownId === task._id) {
                            setOpenDropdownId(null);
                          } else {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const spaceBelow = window.innerHeight - rect.bottom;
                            const openUpward = spaceBelow < 60; // 60px threshold
                            setDropdownPosition({
                              top: openUpward ? rect.top - 4 : rect.bottom + 4,
                              left: rect.right - 140,
                              openUpward,
                            });
                            setOpenDropdownId(task._id);
                          }
                        }}
                        style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#475569", fontSize: "18px", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 1, transition: "all 0.15s" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#344158"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "#344158"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.color = "#475569"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
                      >
                        ⋮
                      </button>

                      {openDropdownId === task._id && createPortal(
                        <>
                          <div 
                            style={{
                              position: "fixed",
                              inset: 0,
                              zIndex: 9998,
                              cursor: "default"
                            }}
                            onClick={() => setOpenDropdownId(null)}
                          />
                          <div
                             style={{
                               position: "fixed",
                               left: `${dropdownPosition.left}px`,
                               top: `${dropdownPosition.top}px`,
                               transform: dropdownPosition.openUpward ? "translateY(-100%)" : "none",
                               background: "white",
                               border: "1px solid #e5e7eb",
                               borderRadius: "12px",
                               boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
                               zIndex: 9999,
                               width: "160px",
                               overflow: "hidden"
                             }}
                           >
                             <button
                               onClick={async () => {
                                 setSelectedTask(task);
                                 setMsgError("");
                                 setTeamMessage("");
                                 setOpenDropdownId(null);
                                 if (task.hasUnreadFeedback) {
                                   try {
                                     await taskAPI.readFeedback(task._id);
                                     if (onTasksRefresh) {
                                       onTasksRefresh();
                                     }
                                   } catch (e) {
                                     console.error("Failed to mark team task feedback read:", e);
                                   }
                                 }
                               }}
                               style={{
                                 width: "100%",
                                 padding: "12px 16px",
                                 background: "white",
                                 border: "none",
                                 color: "#0f172a",
                                 fontSize: "14px",
                                 fontWeight: "500",
                                 cursor: "pointer",
                                 textAlign: "left",
                                 display: "block"
                               }}
                               onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
                               onMouseLeave={(e) => e.target.style.background = 'white'}
                             >
                               View Details
                             </button>
                          </div>
                        </>,
                        document.body
                      )}
                    </td>
                  </tr>
                );
              })}
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
                backgroundColor: "#344158",
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
                  Group Task &nbsp;•&nbsp;{" "}
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
                      whiteSpace: "pre-wrap"
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
                      background: "linear-gradient(135deg, rgba(52, 65, 88, 0.08), rgba(52, 65, 88, 0.15))",
                      borderRadius: "10px",
                      border: "1px solid rgba(52, 65, 88, 0.25)",
                      textDecoration: "none",
                      color: "#344158",
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
                      backgroundColor: "#f8fafc",
                      borderRadius: "10px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#64748b",
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
                        color: "#344158",
                      }}
                    >
                      {formatDate(selectedTask.deadline)}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: "12px",
                      backgroundColor: "#f8fafc",
                      borderRadius: "10px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#64748b",
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
                        color: "#344158",
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
                            backgroundColor: isMe ? "rgba(52, 65, 88, 0.05)" : "#f8fafc",
                            border: isMe
                              ? "1.5px solid rgba(52, 65, 88, 0.3)"
                              : "1px solid #e2e8f0",
                          }}
                        >
                          <div
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              backgroundColor: isMe ? "#344158" : "#f1f5f9",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "14px",
                              fontWeight: "700",
                              color: isMe ? "white" : "#344158",
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
                                    backgroundColor: "#344158",
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
                                    backgroundColor: "rgba(52, 65, 88, 0.1)",
                                    color: "#344158",
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
                      backgroundColor: "rgba(52, 65, 88, 0.05)",
                      borderRadius: "12px",
                      border: "1.5px solid rgba(52, 65, 88, 0.2)",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <span style={{ fontSize: "24px" }}>✅</span>
                    <div>
                      <div
                        style={{
                          fontWeight: "700",
                          color: "#344158",
                          fontSize: "14px",
                        }}
                      >
                        Task Completed!
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#475569",
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
                      backgroundColor: "rgba(52, 65, 88, 0.05)",
                      borderRadius: "12px",
                      border: "1.5px solid rgba(52, 65, 88, 0.2)",
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
                          color: "#344158",
                          fontSize: "14px",
                        }}
                      >
                        Pending Admin Approval
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#475569",
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
                      backgroundColor: "rgba(52, 65, 88, 0.05)",
                      borderRadius: "12px",
                      border: "1.5px solid rgba(52, 65, 88, 0.2)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: "700",
                        color: "#344158",
                        marginBottom: "4px",
                      }}
                    >
                      ✅ Mark Task as Complete
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#64748b",
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
                          ? "rgba(52, 65, 88, 0.5)"
                          : "#344158",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: submittingReview ? "not-allowed" : "pointer",
                        fontWeight: "700",
                        fontSize: "14px",
                        boxShadow: submittingReview
                          ? "none"
                          : "0 4px 12px rgba(52, 65, 88, 0.25)",
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
                    color: "#344158",
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
                                  ? "#344158"
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
                                whiteSpace: "pre-wrap",
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
                      e.target.style.borderColor = "#344158";
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
                          ? "#344158"
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
