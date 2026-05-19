import { useState, useEffect } from 'react';
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
            <h3 style={{ marginBottom: '10px', color: '#10b981' }}>All Caught Up!</h3>
            <p>No tasks are pending approval at the moment.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: '20px', background: '#fef3c7', border: '2px solid #f59e0b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}></span>
              <div>
                <strong style={{ color: '#92400e' }}>{tasks.length} task{tasks.length > 1 ? 's' : ''} awaiting approval</strong>
                <p style={{ margin: '5px 0 0', fontSize: '14px', color: '#78350f' }}>
                  Review completed work and approve to finalize tasks
                </p>
              </div>
            </div>
          </div>

          <div className="tasks-grid">
            {tasks.map((task) => (
              <div key={task._id} className="task-card" style={{ border: '2px solid #f59e0b' }}>
                <div className="task-header">
                  <h3>{task.title}</h3>
                  <span 
                    className="task-status-badge"
                    style={{
                      backgroundColor: '#fef3c7',
                      color: '#f59e0b'
                    }}
                  >
                    Pending Approval
                  </span>
                </div>

                <p className="task-description">{task.description}</p>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '12px',
                  marginBottom: '16px',
                  padding: '12px',
                  background: '#f8fafc',
                  borderRadius: '8px'
                }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Intern</div>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{task.assignedTo?.name || 'N/A'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Intern ID</div>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{task.assignedTo?.internId || 'N/A'}</div>
                  </div>
                </div>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '12px',
                  marginBottom: '16px'
                }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Deadline</div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{formatDate(task.deadline)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Submitted</div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{formatDate(task.updatedAt)}</div>
                  </div>
                </div>

                <div className="task-progress">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>Progress</span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#10b981' }}>
                      {task.progress}%
                    </span>
                  </div>
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar-fill"
                      style={{ width: '100%', background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)' }}
                    ></div>
                  </div>
                </div>

                <button
                  onClick={() => handleApproveTask(task._id, task.title)}
                  className="approve-btn"
                  style={{ width: '100%', marginTop: '16px', padding: '12px' }}
                >
                  Approve Task
                </button>

                <button
                  onClick={() => handleRequestChanges(task)}
                  style={{
                    width: '100%',
                    marginTop: '8px',
                    padding: '12px',
                    backgroundColor: '#fff',
                    color: '#f59e0b',
                    border: '2px solid #f59e0b',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#fef3c7';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#fff';
                  }}
                >
                  Request Changes
                </button>
              </div>
            ))}
          </div>
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
