import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { taskAPI } from '../services/api';

function PendingApprovals({ onTaskApproved, onBack }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, openUpward: false });
  const [viewingTaskDetails, setViewingTaskDetails] = useState(null);

  useEffect(() => {
    fetchPendingTasks();
  }, []);

  const fetchPendingTasks = async () => {
    try {
      setLoading(true);
      const response = await taskAPI.getAllTasks();
      const pendingTasks = response.data.tasks.filter(
        task => task.status === 'Pending Approval'
      );
      setTasks(pendingTasks);
    } catch (err) {
      console.error('Failed to fetch pending tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveTask = async (taskId /*, taskTitle */) => {
    try {
      await taskAPI.approveTask(taskId);
      setTasks(tasks.filter(task => task._id !== taskId));
      setSuccess('Task approved successfully');
      setTimeout(() => setSuccess(''), 4000);
      if (onTaskApproved) onTaskApproved();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to approve task';
      setError(msg);
      console.error('Approve task error:', err);
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleRequestChanges = (task) => {
    setSelectedTask(task);
    setFeedbackMessage('');
    setShowFeedbackModal(true);
  };

  const handleSendFeedback = async () => {
    if (!feedbackMessage.trim()) {
      setError('Please enter a feedback message');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      setSendingFeedback(true);
      await taskAPI.sendTaskFeedback(selectedTask._id, feedbackMessage.trim());
      setTasks(tasks.filter(task => task._id !== selectedTask._id));
      setShowFeedbackModal(false);
      setFeedbackMessage('');
      setSelectedTask(null);
      setSuccess('Feedback sent successfully. The task has been moved back to In Progress and the intern has been notified via email.');
      setTimeout(() => setSuccess(''), 4000);
      if (onTaskApproved) onTaskApproved();
    } catch (err) {
      setError('Failed to send feedback. Please try again.');
      console.error(err);
      setTimeout(() => setError(''), 4000);
    } finally {
      setSendingFeedback(false);
    }
  };

  const closeFeedbackModal = () => {
    if (!sendingFeedback) {
      setShowFeedbackModal(false);
      setFeedbackMessage('');
      setSelectedTask(null);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  if (loading) {
    return (
      <div className="card">
        <p>Loading pending approvals...</p>
      </div>
    );
  }

  return (
    <>
      <div className="content-header-with-back" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="content-header">
          <h1>Pending Task Approvals</h1>
          <p>Review and approve tasks submitted by interns</p>
        </div>
        <div>
          {onBack && (
            <button onClick={onBack} className="back-button back-button-primary" title="Back to Activity Management">
              Back
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{
          padding: '12px',
          marginBottom: '20px',
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          color: '#dc2626',
          fontSize: '14px',
          fontWeight: 500
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: '12px',
          marginBottom: '20px',
          backgroundColor: '#ecfccb',
          border: '1px solid #bbf7d0',
          borderRadius: '8px',
          color: '#166534',
          fontSize: '14px',
          fontWeight: 500
        }}>
          {success}
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div style={{ fontSize: '48px', marginBottom: '20px' }}></div>
            <h3 style={{ marginBottom: '10px', color: '#344158' }}>All Caught Up!</h3>
            <p>No tasks are pending approval at the moment.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="card" style={{ padding: 0, overflow: "hidden", borderRadius: 0, boxShadow: "0 2px 12px rgba(15,23,42,0.07)" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", minWidth: "900px", borderCollapse: "collapse", fontFamily: "inherit", marginTop: 0 }}>
                <thead>
                  <tr>
                    <th style={{ background: "#344158", color: "rgba(255,255,255,0.75)", padding: "13px 16px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.7px", textAlign: "left", borderBottom: "2px solid #2a3548" }}>#</th>
                    <th style={{ background: "#344158", color: "rgba(255,255,255,0.75)", padding: "13px 16px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.7px", textAlign: "left", borderBottom: "2px solid #2a3548" }}>Intern Details</th>
                    <th style={{ background: "#344158", color: "rgba(255,255,255,0.75)", padding: "13px 16px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.7px", textAlign: "left", borderBottom: "2px solid #2a3548" }}>Task Details</th>
                    <th style={{ background: "#344158", color: "rgba(255,255,255,0.75)", padding: "13px 16px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.7px", textAlign: "left", borderBottom: "2px solid #2a3548" }}>Dates</th>
                    <th style={{ background: "#344158", color: "rgba(255,255,255,0.75)", padding: "13px 16px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.7px", textAlign: "center", borderBottom: "2px solid #2a3548" }}>Progress</th>
                    <th style={{ background: "#344158", color: "rgba(255,255,255,0.75)", padding: "13px 16px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.7px", textAlign: "center", borderBottom: "2px solid #2a3548" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task, idx) => {
                    const isEven = idx % 2 === 0;
                    return (
                      <tr
                        key={task._id}
                        style={{ background: isEven ? "#ffffff" : "#f8fafc", borderBottom: "1px solid #f1f5f9" }}
                        onMouseEnter={e => e.currentTarget.style.background = isEven ? "#ffffff" : "#f8fafc"}
                        onMouseLeave={e => e.currentTarget.style.background = isEven ? "#ffffff" : "#f8fafc"}
                      >
                        {/* # */}
                        <td style={{ padding: "15px 16px", verticalAlign: "middle", color: "#c1cfe0", fontSize: "12px", fontWeight: 700, width: 44 }}>
                          {String(idx + 1).padStart(2, "0")}
                        </td>

                        {/* Intern Details */}
                        <td style={{ padding: "15px 16px", verticalAlign: "middle", maxWidth: "200px" }}>
                          <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "13.5px", marginBottom: "3px" }}>
                            {task.assignedTo?.name || "N/A"}
                          </div>
                          <div style={{ fontSize: "11.5px", color: "#64748b", display: "flex", gap: "6px", alignItems: "center" }}>
                            <span>{task.assignedTo?.internId || "N/A"}</span>
                            <span>•</span>
                            <span style={{ 
                              padding: "2px 7px", 
                              borderRadius: "4px", 
                              fontSize: "10px", 
                              fontWeight: 700,
                              backgroundColor: task.isTeamTask ? "rgba(52, 65, 88, 0.1)" : "#f1f5f9",
                              color: task.isTeamTask ? "#344158" : "#475569"
                            }}>
                              {task.isTeamTask ? "Group" : "Individual"}
                            </span>
                          </div>
                          {task.isTeamTask && task.teamMembers && task.teamMembers.length > 0 && (
                            <div style={{ fontSize: "10.5px", color: "#94a3b8", marginTop: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={task.teamMembers.map(m => m.name).join(", ")}>
                              Group: {task.teamMembers.map(m => m.name).join(", ")}
                            </div>
                          )}
                        </td>

                        {/* Task Details */}
                        <td style={{ padding: "15px 16px", verticalAlign: "middle", maxWidth: "280px" }}>
                          <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "13.5px", marginBottom: "3px" }}>{task.title}</div>
                          <div style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.45 }}>
                            {task.description.length > 80 ? task.description.substring(0, 80) + "…" : task.description}
                          </div>
                        </td>

                        {/* Dates */}
                        <td style={{ padding: "15px 16px", verticalAlign: "middle", fontSize: "12px", color: "#475569" }}>
                          <div style={{ marginBottom: "4px" }}>
                            <span style={{ color: "#94a3b8", fontSize: "10.5px", textTransform: "uppercase", fontWeight: 600, display: "inline-block", width: "70px" }}>Submitted:</span>
                            <strong>{formatDate(task.updatedAt)}</strong>
                          </div>
                          <div>
                            <span style={{ color: "#94a3b8", fontSize: "10.5px", textTransform: "uppercase", fontWeight: 600, display: "inline-block", width: "70px" }}>Deadline:</span>
                            <span>{formatDate(task.deadline)}</span>
                          </div>
                        </td>

                        {/* Progress */}
                        <td style={{ padding: "15px 16px", verticalAlign: "middle", textAlign: "center", minWidth: "90px" }}>
                          {(() => {
                            const r = 22;
                            const circ = 2 * Math.PI * r;
                            const filled = (task.progress / 100) * circ;
                            return (
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, margin: "0 auto" }}>
                                <div style={{ position: "relative", width: 56, height: 56 }}>
                                  <svg width="56" height="56" viewBox="0 0 56 56" style={{ transform: "rotate(-90deg)" }}>
                                    <circle cx="28" cy="28" r={r} fill="none" stroke="#e2e8f0" strokeWidth="5" />
                                    <circle
                                      cx="28" cy="28" r={r}
                                      fill="none"
                                      stroke="#324158"
                                      strokeWidth="5"
                                      strokeLinecap="round"
                                      strokeDasharray={`${filled} ${circ - filled}`}
                                      strokeDashoffset="0"
                                      style={{ transition: "stroke-dasharray 0.5s ease" }}
                                    />
                                  </svg>
                                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <span style={{ fontSize: "11px", fontWeight: 800, color: "#324158", letterSpacing: "-0.3px" }}>{task.progress}%</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </td>

                        {/* Action – Three-dot Dropdown via Portal */}
                        <td style={{ padding: "15px 16px", verticalAlign: "middle", textAlign: "center" }}>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              if (openDropdownId === task._id) {
                                setOpenDropdownId(null);
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const spaceBelow = window.innerHeight - rect.bottom;
                                const openUpward = spaceBelow < 90; // 90px threshold for 2 items
                                setDropdownPosition({
                                  top: openUpward ? rect.top - 4 : rect.bottom + 4,
                                  left: rect.right - 150,
                                  openUpward,
                                });
                                setOpenDropdownId(task._id);
                              }
                            }}
                            style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#000", fontSize: "18px", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 1, transition: "all 0.15s" }}
                            onMouseEnter={e => { e.currentTarget.style.background = "#344158"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "#344158"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.color = "#000"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
                          >⋮</button>

                          {openDropdownId === task._id && createPortal(
                            <>
                              <div
                                style={{ position: "fixed", inset: 0, zIndex: 9998 }}
                                onClick={() => setOpenDropdownId(null)}
                              />
                              <div style={{
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
                              }}>
                                <button
                                  onClick={() => { setViewingTaskDetails(task); setOpenDropdownId(null); }}
                                  style={{ width: "100%", padding: "12px 16px", background: "white", border: "none", textAlign: "left", fontSize: "14px", fontWeight: 500, color: "#0f172a", cursor: "pointer" }}
                                  onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                                  onMouseLeave={e => e.currentTarget.style.background = "white"}
                                >
                                  View Details
                                </button>
                                <button
                                  onClick={() => { handleApproveTask(task._id, task.title); setOpenDropdownId(null); }}
                                  style={{ width: "100%", padding: "12px 16px", background: "white", border: "none", textAlign: "left", fontSize: "14px", fontWeight: 500, color: "#0f172a", cursor: "pointer", borderTop: "1px solid #f3f4f6" }}
                                  onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                                  onMouseLeave={e => e.currentTarget.style.background = "white"}
                                >
                                  Approve Task
                                </button>
                                <button
                                  onClick={() => { handleRequestChanges(task); setOpenDropdownId(null); }}
                                  style={{ width: "100%", padding: "12px 16px", background: "white", border: "none", textAlign: "left", fontSize: "14px", fontWeight: 500, color: "#0f172a", cursor: "pointer", borderTop: "1px solid #f3f4f6" }}
                                  onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                                  onMouseLeave={e => e.currentTarget.style.background = "white"}
                                >
                                  Request Changes
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

          {/* Pending Approval Detail Modal */}
          {viewingTaskDetails && (
            <div
              style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 11000, padding: 20 }}
              onClick={() => setViewingTaskDetails(null)}
            >
              <div
                style={{ background: "#fff", borderRadius: 16, border: "1px solid #dbe7f2", boxShadow: "0 20px 48px rgba(15,23,42,0.16)", maxWidth: 640, width: "100%", maxHeight: "calc(100vh - 40px)", overflow: "hidden", display: "flex", flexDirection: "column", position: "relative" }}
                onClick={e => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div style={{ background: "#324158", padding: "20px 24px", color: "#fff", display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Review Task Submission</span>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <h2 style={{ margin: 0, fontSize: 19, color: "#fff", fontWeight: 500, flex: 1, paddingRight: 12 }}>{viewingTaskDetails.title}</h2>
                    <button
                      onClick={() => setViewingTaskDetails(null)}
                      style={{ width: 30, height: 30, border: "none", borderRadius: "50%", background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, flexShrink: 0 }}
                    >×</button>
                  </div>
                </div>

                {/* Modal Body */}
                <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>
                  {/* Meta */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20, padding: 12, background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                    <div>
                      <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>{viewingTaskDetails.isTeamTask ? "Group Lead" : "Intern"}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginTop: 2 }}>{viewingTaskDetails.assignedTo?.name || "N/A"}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>Intern ID</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginTop: 2 }}>{viewingTaskDetails.assignedTo?.internId || "N/A"}</div>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>Deadline</div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#475569", marginTop: 2 }}>{formatDate(viewingTaskDetails.deadline)}</div>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>Submitted</div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#475569", marginTop: 2 }}>{formatDate(viewingTaskDetails.updatedAt)}</div>
                    </div>
                  </div>

                  {/* Team Members List */}
                  {viewingTaskDetails.isTeamTask && viewingTaskDetails.teamMembers && viewingTaskDetails.teamMembers.length > 0 && (
                    <div style={{ marginBottom: 20, padding: 12, background: "rgba(52, 65, 88, 0.05)", borderRadius: 8, border: "1px solid rgba(52, 65, 88, 0.15)" }}>
                      <div style={{ fontSize: 12, color: "#344158", marginBottom: 6, fontWeight: 600 }}>Group Members</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {viewingTaskDetails.teamMembers.map((member) => (
                          <div key={member._id} style={{ fontSize: 13, color: "#475569", display: "flex", justifyContent: "space-between" }}>
                            <span>• {member.name}</span>
                            <span style={{ fontSize: 11, color: "rgba(52, 65, 88, 0.7)" }}>({member.internId})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  <div style={{ marginBottom: 20 }}>
                    <h4 style={{ margin: "0 0 6px", fontSize: 13, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 500 }}>Task Description</h4>
                    <p style={{ margin: 0, fontSize: "13.5px", color: "#475569", lineHeight: 1.6, background: "#f8fafc", padding: 12, borderRadius: 8, border: "1px solid #e2e8f0", whiteSpace: "pre-wrap" }}>{viewingTaskDetails.description}</p>
                  </div>
                </div>

                {/* Footer Actions */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "16px 24px", borderTop: "1px solid #e2e8f0", background: "#f8fafc" }}>
                  <button
                    onClick={() => {
                      handleRequestChanges(viewingTaskDetails);
                      setViewingTaskDetails(null);
                    }}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#fff",
                      color: "#344158",
                      border: "1.5px solid #344158",
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Request Changes
                  </button>
                  <button
                    onClick={() => {
                      handleApproveTask(viewingTaskDetails._id, viewingTaskDetails.title);
                      setViewingTaskDetails(null);
                    }}
                    style={{
                      padding: "8px 18px",
                      backgroundColor: "#344158",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Approve Task
                  </button>
                  <button
                    onClick={() => setViewingTaskDetails(null)}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#e2e8f0",
                      color: "#475569",
                      border: "none",
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={closeFeedbackModal}
        >
          <div 
            className="card"
            style={{
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '16px',
              borderBottom: '2px solid #e2e8f0'
            }}>
              <h2 style={{ margin: 0 }}>Request Changes</h2>
              <button
                onClick={closeFeedbackModal}
                disabled={sendingFeedback}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: sendingFeedback ? 'not-allowed' : 'pointer',
                  color: '#64748b',
                  padding: '4px 8px'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '8px', color: '#0f172a' }}>{selectedTask?.title}</h3>
              <div style={{ fontSize: '14px', color: '#64748b' }}>
                Intern: {selectedTask?.assignedTo?.name} ({selectedTask?.assignedTo?.internId})
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                Feedback Message <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)}
                disabled={sendingFeedback}
                placeholder="Explain what changes are needed for this task..."
                rows={6}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  borderRadius: '8px',
                  border: '2px solid #e2e8f0',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '8px' }}>
                This message will be sent to the intern via email and the task will be moved back to "In Progress".
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleSendFeedback}
                disabled={sendingFeedback || !feedbackMessage.trim()}
                className="approve-btn"
                style={{
                  flex: 1,
                  padding: '12px',
                  opacity: (sendingFeedback || !feedbackMessage.trim()) ? 0.6 : 1,
                  cursor: (sendingFeedback || !feedbackMessage.trim()) ? 'not-allowed' : 'pointer'
                }}
              >
                {sendingFeedback ? '✉ Sending...' : '✉ Send Feedback'}
              </button>
              <button
                onClick={closeFeedbackModal}
                disabled={sendingFeedback}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#fff',
                  color: '#64748b',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: sendingFeedback ? 'not-allowed' : 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default PendingApprovals;
