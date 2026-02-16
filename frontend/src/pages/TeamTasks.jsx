import { useState, useEffect } from 'react';
import { taskAPI, adminAPI } from '../services/api';

function TeamTasks({ user, tasks, loading, error, onProgressUpdate }) {
  const [selectedTask, setSelectedTask] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamMessage, setTeamMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const teamTasks = tasks.filter(t => t.isTeamTask);

  useEffect(() => {
    if (selectedTask && selectedTask.teamMembers) {
      fetchTeamMembers(selectedTask.teamMembers);
    }
  }, [selectedTask]);

  const fetchTeamMembers = async (memberIds) => {
    try {
      const response = await adminAPI.getAllInterns();
      const allInterns = response.data.interns;
      const members = allInterns.filter(intern => memberIds.includes(intern._id));
      setTeamMembers(members);
    } catch (err) {
      console.error('Failed to fetch team members:', err);
    }
  };

  const handleSendMessage = async () => {
    if (!teamMessage.trim() || !selectedTask) return;

    setSendingMessage(true);
    try {
      await taskAPI.sendTeamMessage(selectedTask._id, {
        message: teamMessage,
        sentBy: user._id,
        senderName: user.name
      });
      
      // Refresh task to get updated messages
      const response = await taskAPI.getInternTasks();
      const updatedTask = response.data.tasks.find(t => t._id === selectedTask._id);
      setSelectedTask(updatedTask);
      setTeamMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  const formatDeadline = (deadline) => {
    return new Date(deadline).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Assigned': return '#94a3b8';
      case 'In Progress': return '#3b82f6';
      case 'Pending Approval': return '#f59e0b';
      case 'Completed': return '#10b981';
      default: return '#64748b';
    }
  };

  if (loading) {
    return (
      <div className="card">
        <p>Loading team tasks...</p>
      </div>
    );
  }

  if (teamTasks.length === 0) {
    return (
      <div className="card">
        <div className="empty-state">
          <p>No team tasks assigned yet. Your team tasks will appear here once assigned by admin.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="card">
        <div style={{ overflowX: 'auto' }}>
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
                  <td style={{ fontWeight: 600, color: '#0f172a' }}>{task.title}</td>
                  <td style={{ maxWidth: '300px' }}>
                    {task.description.length > 60 
                      ? task.description.substring(0, 60) + '...' 
                      : task.description}
                  </td>
                  <td>{formatDeadline(task.deadline)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      backgroundColor: '#dbeafe',
                      color: '#1e40af',
                      fontWeight: '600',
                      fontSize: '13px'
                    }}>
                      {task.teamMembers?.length || 0} members
                    </span>
                  </td>
                  <td>
                    <span 
                      className="status-badge"
                      style={{
                        backgroundColor: `${getStatusColor(task.status)}20`,
                        color: getStatusColor(task.status)
                      }}
                    >
                      {task.status}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => setSelectedTask(task)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
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

      {/* Team Task Details Modal */}
      {selectedTask && (
        <div className="modal-overlay" onClick={() => setSelectedTask(null)}>
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()}
            style={{ 
              maxWidth: '950px', 
              maxHeight: '90vh', 
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              padding: 0
            }}
          >
            {/* Modal Header */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '24px 28px',
              borderBottom: '2px solid #e2e8f0',
              backgroundColor: '#f8fafc'
            }}>
              <div>
                <h2 style={{ 
                  margin: 0, 
                  marginBottom: '4px',
                  fontSize: '22px',
                  fontWeight: '700',
                  color: '#0f172a'
                }}>
                  {selectedTask.title}
                </h2>
                <p style={{ 
                  margin: 0, 
                  fontSize: '14px', 
                  color: '#64748b',
                  fontWeight: '500'
                }}>
                  Team Task Details & Collaboration
                </p>
              </div>
              <button 
                onClick={() => setSelectedTask(null)}
                style={{
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'white',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#64748b',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#fee2e2';
                  e.target.style.borderColor = '#ef4444';
                  e.target.style.color = '#ef4444';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'white';
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.color = '#64748b';
                }}
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content */}
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              padding: '28px'
            }}>
            {/* Task Details */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{
                display: 'inline-block',
                padding: '6px 14px',
                backgroundColor: '#eff6ff',
                borderRadius: '6px',
                marginBottom: '14px'
              }}>
                <h3 style={{ 
                  margin: 0, 
                  fontSize: '15px',
                  fontWeight: '700',
                  color: '#1e40af',
                  letterSpacing: '0.3px'
                }}>
                  📋 TASK DESCRIPTION
                </h3>
              </div>
              <p style={{ 
                color: '#475569', 
                lineHeight: '1.8',
                fontSize: '15px',
                backgroundColor: 'white',
                padding: '16px',
                borderRadius: '10px',
                border: '2px solid #e2e8f0',
                margin: 0
              }}>
                {selectedTask.description}
              </p>
              
              {selectedTask.taskDocument && (
                <div style={{
                  marginTop: '16px',
                  padding: '16px 18px',
                  background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                  borderRadius: '12px',
                  border: '2px solid #3b82f6',
                  boxShadow: '0 2px 8px rgba(59, 130, 246, 0.15)'
                }}>
                  <a 
                    href={`http://localhost:5000/${selectedTask.taskDocument.filepath.replace(/\\/g, '/')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: '#1e40af',
                      textDecoration: 'none',
                      fontWeight: 700,
                      fontSize: '15px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'translateX(5px)'}
                    onMouseLeave={(e) => e.target.style.transform = 'translateX(0)'}
                  >
                    <span style={{ fontSize: '20px' }}>📄</span>
                    <span>View Task Document (PDF)</span>
                    <span style={{ marginLeft: 'auto', fontSize: '16px' }}>→</span>
                  </a>
                </div>
              )}
              
              <div style={{ 
                marginTop: '20px', 
                padding: '18px', 
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                borderRadius: '12px',
                border: '2px solid #cbd5e1',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px'
              }}>
                <div>
                  <span style={{ 
                    fontSize: '12px', 
                    color: '#64748b',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    ⏰ Deadline
                  </span>
                  <div style={{ 
                    fontWeight: '700', 
                    color: '#0f172a', 
                    marginTop: '6px',
                    fontSize: '16px'
                  }}>
                    {formatDeadline(selectedTask.deadline)}
                  </div>
                </div>
                <div>
                  <span style={{ 
                    fontSize: '12px', 
                    color: '#64748b',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    📊 Status
                  </span>
                  <div style={{ marginTop: '6px' }}>
                    <span 
                      style={{
                        padding: '6px 16px',
                        borderRadius: '20px',
                        backgroundColor: `${getStatusColor(selectedTask.status)}20`,
                        color: getStatusColor(selectedTask.status),
                        fontWeight: '700',
                        fontSize: '14px',
                        border: `2px solid ${getStatusColor(selectedTask.status)}40`
                      }}
                    >
                      {selectedTask.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Team Members */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{
                textAlign: 'center',
                marginBottom: '20px'
              }}>
                <div style={{
                  display: 'inline-block',
                  padding: '8px 18px',
                  backgroundColor: '#f0fdf4',
                  borderRadius: '8px',
                  border: '2px solid #86efac'
                }}>
                  <h3 style={{ 
                    margin: 0, 
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#15803d',
                    letterSpacing: '0.5px'
                  }}>
                    👥 YOUR TEAM MEMBERS ({teamMembers.length})
                  </h3>
                </div>
              </div>
              <div style={{ 
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '20px',
                maxWidth: '1000px',
                margin: '0 auto'
              }}>
                {teamMembers.map((member) => (
                  <div 
                    key={member._id}
                    style={{
                      width: '280px',
                      padding: '20px',
                      border: member._id === user._id ? '3px solid #3b82f6' : '2px solid #e2e8f0',
                      borderRadius: '16px',
                      backgroundColor: member._id === user._id ? '#eff6ff' : 'white',
                      boxShadow: member._id === user._id 
                        ? '0 8px 20px rgba(59, 130, 246, 0.2)' 
                        : '0 4px 12px rgba(0,0,0,0.08)',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = member._id === user._id 
                        ? '0 12px 28px rgba(59, 130, 246, 0.3)' 
                        : '0 8px 20px rgba(0,0,0,0.12)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = member._id === user._id 
                        ? '0 8px 20px rgba(59, 130, 246, 0.2)' 
                        : '0 4px 12px rgba(0,0,0,0.08)';
                    }}
                  >
                    {member._id === user._id && (
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        fontSize: '24px'
                      }}>
                        ⭐
                      </div>
                    )}
                    
                    {/* Profile Icon */}
                    <div style={{
                      width: '70px',
                      height: '70px',
                      borderRadius: '50%',
                      backgroundColor: member._id === user._id ? '#3b82f6' : '#e0e7ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                      fontSize: '32px',
                      fontWeight: '700',
                      color: member._id === user._id ? 'white' : '#4f46e5',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}>
                      {member.name?.charAt(0).toUpperCase()}
                    </div>

                    {/* Name */}
                    <div style={{ 
                      textAlign: 'center',
                      marginBottom: '12px'
                    }}>
                      <div style={{
                        fontWeight: '700', 
                        color: member._id === user._id ? '#1e40af' : '#0f172a', 
                        fontSize: '17px',
                        marginBottom: '6px',
                        lineHeight: '1.3'
                      }}>
                        {member.name}
                      </div>
                      {member._id === user._id && (
                        <span style={{
                          display: 'inline-block',
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '4px 12px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          borderRadius: '20px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          You
                        </span>
                      )}
                    </div>

                    {/* Student ID */}
                    {member.studentId && (
                      <div style={{
                        textAlign: 'center',
                        padding: '6px 12px',
                        backgroundColor: '#fef3c7',
                        borderRadius: '8px',
                        marginBottom: '12px'
                      }}>
                        <div style={{ 
                          fontSize: '11px', 
                          color: '#92400e',
                          fontWeight: '600',
                          marginBottom: '2px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Student ID
                        </div>
                        <div style={{ 
                          fontSize: '13px', 
                          color: '#78350f',
                          fontWeight: '700'
                        }}>
                          {member.studentId}
                        </div>
                      </div>
                    )}

                    {/* Contact Info */}
                    <div style={{
                      backgroundColor: '#f8fafc',
                      padding: '14px',
                      borderRadius: '10px',
                      marginTop: '12px'
                    }}>
                      <div style={{ 
                        fontSize: '13px', 
                        color: '#475569',
                        marginBottom: '10px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px'
                      }}>
                        <span style={{ fontSize: '16px', marginTop: '1px' }}>📧</span>
                        <div style={{ flex: 1, wordBreak: 'break-word' }}>
                          <div style={{ 
                            fontSize: '11px', 
                            color: '#94a3b8', 
                            fontWeight: '600',
                            marginBottom: '2px',
                            textTransform: 'uppercase'
                          }}>
                            Email
                          </div>
                          <div style={{ fontWeight: '600', color: '#334155' }}>
                            {member.email}
                          </div>
                        </div>
                      </div>

                      {member.mobile && (
                        <div style={{ 
                          fontSize: '13px', 
                          color: '#475569',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '8px',
                          paddingTop: '10px',
                          borderTop: '1px solid #e2e8f0'
                        }}>
                          <span style={{ fontSize: '16px', marginTop: '1px' }}>📱</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ 
                              fontSize: '11px', 
                              color: '#94a3b8', 
                              fontWeight: '600',
                              marginBottom: '2px',
                              textTransform: 'uppercase'
                            }}>
                              Mobile
                            </div>
                            <div style={{ fontWeight: '600', color: '#334155' }}>
                              {member.mobile}
                            </div>
                          </div>
                        </div>
                      )}

                      {member.studentType && (
                        <div style={{ 
                          marginTop: '10px',
                          paddingTop: '10px',
                          borderTop: '1px solid #e2e8f0'
                        }}>
                          <div style={{ 
                            fontSize: '11px', 
                            color: '#94a3b8', 
                            fontWeight: '600',
                            marginBottom: '4px',
                            textTransform: 'uppercase'
                          }}>
                            Type
                          </div>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            backgroundColor: '#dbeafe',
                            color: '#1e40af',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '700'
                          }}>
                            {member.studentType}
                          </span>
                        </div>
                      )}

                      {member.domain && (
                        <div style={{ 
                          marginTop: '10px',
                          paddingTop: '10px',
                          borderTop: '1px solid #e2e8f0'
                        }}>
                          <div style={{ 
                            fontSize: '11px', 
                            color: '#94a3b8', 
                            fontWeight: '600',
                            marginBottom: '4px',
                            textTransform: 'uppercase'
                          }}>
                            Domain
                          </div>
                          <div style={{ 
                            fontSize: '13px',
                            color: '#334155',
                            fontWeight: '600'
                          }}>
                            {member.domain}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Team Messages/Chat */}
            <div>
              <div style={{
                display: 'inline-block',
                padding: '6px 14px',
                backgroundColor: '#fef3c7',
                borderRadius: '6px',
                marginBottom: '14px'
              }}>
                <h3 style={{ 
                  margin: 0, 
                  fontSize: '15px',
                  fontWeight: '700',
                  color: '#92400e',
                  letterSpacing: '0.3px'
                }}>
                  💬 TEAM DISCUSSION
                </h3>
              </div>
              <div style={{
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                backgroundColor: 'white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                height: '350px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}>
                {/* Messages Area */}
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '20px',
                  backgroundColor: '#f8fafc'
                }}>
                  {selectedTask.teamMessages && selectedTask.teamMessages.length > 0 ? (
                    selectedTask.teamMessages.map((msg, index) => (
                      <div 
                        key={index}
                        style={{
                          marginBottom: '14px',
                          display: 'flex',
                          justifyContent: msg.sentBy === user._id ? 'flex-end' : 'flex-start'
                        }}
                      >
                        <div style={{
                          maxWidth: '70%',
                          padding: '14px 16px',
                          borderRadius: msg.sentBy === user._id ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          backgroundColor: msg.sentBy === user._id ? '#3b82f6' : 'white',
                          border: msg.sentBy === user._id ? 'none' : '2px solid #e2e8f0',
                          boxShadow: msg.sentBy === user._id ? '0 2px 8px rgba(59, 130, 246, 0.25)' : '0 2px 6px rgba(0,0,0,0.08)'
                        }}>
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '6px',
                            gap: '12px'
                          }}>
                            <span style={{ 
                              fontWeight: '700', 
                              fontSize: '13px', 
                              color: msg.sentBy === user._id ? 'rgba(255,255,255,0.95)' : '#0f172a'
                            }}>
                              {msg.senderName} {msg.sentBy === user._id && '(You)'}
                            </span>
                            <span style={{ 
                              fontSize: '11px', 
                              color: msg.sentBy === user._id ? 'rgba(255,255,255,0.75)' : '#94a3b8',
                              whiteSpace: 'nowrap'
                            }}>
                              {new Date(msg.sentAt).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <div style={{ 
                            color: msg.sentBy === user._id ? 'white' : '#334155', 
                            fontSize: '14px',
                            lineHeight: '1.5',
                            wordWrap: 'break-word'
                          }}>
                            {msg.message}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ 
                      textAlign: 'center', 
                      color: '#94a3b8',
                      padding: '60px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <div style={{ fontSize: '48px', opacity: 0.5 }}>💬</div>
                      <div style={{ fontWeight: '600', fontSize: '15px' }}>No messages yet</div>
                      <div style={{ fontSize: '13px' }}>Start the conversation with your team!</div>
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div style={{
                  padding: '16px',
                  borderTop: '2px solid #e2e8f0',
                  backgroundColor: 'white',
                  display: 'flex',
                  gap: '10px'
                }}>
                  <input
                    type="text"
                    value={teamMessage}
                    onChange={(e) => setTeamMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !sendingMessage) {
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type your message here..."
                    disabled={sendingMessage}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '10px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      backgroundColor: '#f8fafc'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.backgroundColor = 'white';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.backgroundColor = '#f8fafc';
                    }}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!teamMessage.trim() || sendingMessage}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: teamMessage.trim() ? '#3b82f6' : '#e2e8f0',
                      color: teamMessage.trim() ? 'white' : '#94a3b8',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: teamMessage.trim() ? 'pointer' : 'not-allowed',
                      fontSize: '14px',
                      fontWeight: '700',
                      transition: 'all 0.2s',
                      boxShadow: teamMessage.trim() ? '0 2px 8px rgba(59, 130, 246, 0.25)' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (teamMessage.trim()) {
                        e.target.style.backgroundColor = '#2563eb';
                        e.target.style.transform = 'translateY(-1px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (teamMessage.trim()) {
                        e.target.style.backgroundColor = '#3b82f6';
                        e.target.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    {sendingMessage ? 'Sending...' : 'Send'}
                  </button>
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

export default TeamTasks;
