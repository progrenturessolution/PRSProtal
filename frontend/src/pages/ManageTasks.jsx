import { useState, useEffect } from 'react';
import { taskAPI } from '../services/api';

function ManageTasks({ onTaskApproved }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    deadline: ''
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await taskAPI.getAllTasks();
      console.log('Tasks response:', response.data);
      
      if (response.data.success && response.data.tasks) {
        setTasks(response.data.tasks);
      } else {
        setTasks([]);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to fetch tasks. Please check if you are logged in.');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveTask = async (taskId, taskTitle) => {
    if (!window.confirm(`Approve task: "${taskTitle}"?`)) {
      return;
    }

    try {
      await taskAPI.approveTask(taskId);
      setTasks(tasks.map(task => 
        task._id === taskId ? { ...task, status: 'Completed', completedAt: new Date() } : task
      ));
      
      // Notify parent to refresh stats
      if (onTaskApproved) {
        onTaskApproved();
      }
      alert('Task approved successfully!');
    } catch (err) {
      alert('Failed to approve task');
      console.error(err);
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setEditForm({
      title: task.title,
      description: task.description,
      deadline: new Date(task.deadline).toISOString().slice(0, 16)
    });
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    
    try {
      await taskAPI.editTask(editingTask._id, editForm);
      setTasks(tasks.map(task => 
        task._id === editingTask._id 
          ? { ...task, ...editForm, deadline: new Date(editForm.deadline) } 
          : task
      ));
      setEditingTask(null);
      
      // Notify parent to refresh stats
      if (onTaskApproved) {
        onTaskApproved();
      }
      alert('Task updated successfully!');
    } catch (err) {
      alert('Failed to update task');
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId, taskTitle) => {
    if (!window.confirm(`Are you sure you want to delete task: "${taskTitle}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      await taskAPI.deleteTask(taskId);
      setTasks(tasks.filter(task => task._id !== taskId));
      
      // Notify parent to refresh stats
      if (onTaskApproved) {
        onTaskApproved();
      }
      alert('Task deleted successfully!');
    } catch (err) {
      alert('Failed to delete task');
      console.error(err);
    }
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
    setEditForm({ title: '', description: '', deadline: '' });
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

  const formatDeadline = (deadline) => {
    return new Date(deadline).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  if (loading) {
    return (
      <div className="content-header">
        <h1>Loading tasks...</h1>
      </div>
    );
  }

  return (
    <>
      <div className="content-header">
        <h1>Manage Tasks</h1>
        <p>Monitor all task progress and approve completed work</p>
      </div>

      {error && (
        <div style={{
          padding: '16px',
          marginBottom: '20px',
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          color: '#dc2626',
          fontSize: '14px',
          fontWeight: 500
        }}>
          ❌ {error}
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '0',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            animation: 'slideUp 0.3s ease'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '24px 32px',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h2 style={{ 
                  margin: 0, 
                  fontSize: '24px', 
                  color: 'white',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  ✏️ Edit Task
                </h2>
                <p style={{
                  margin: '5px 0 0',
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.7)'
                }}>
                  Update task details below
                </p>
              </div>
              <button
                onClick={handleCancelEdit}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: 'white',
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleUpdateTask} style={{ padding: '32px' }}>
              <div className="form-group">
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#0f172a',
                  marginBottom: '8px'
                }}>
                  📝 Task Title
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="Enter task title"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '10px',
                    fontSize: '15px',
                    transition: 'all 0.2s',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                />
              </div>

              <div className="form-group" style={{ marginTop: '20px' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#0f172a',
                  marginBottom: '8px'
                }}>
                  📄 Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Enter task description"
                  rows="5"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '10px',
                    fontSize: '15px',
                    transition: 'all 0.2s',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                />
              </div>

              <div className="form-group" style={{ marginTop: '20px' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#0f172a',
                  marginBottom: '8px'
                }}>
                  📅 Deadline
                </label>
                <input
                  type="datetime-local"
                  value={editForm.deadline}
                  onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '10px',
                    fontSize: '15px',
                    transition: 'all 0.2s',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                />
              </div>

              {/* Modal Footer */}
              <div style={{ 
                display: 'flex', 
                gap: '12px', 
                marginTop: '32px',
                paddingTop: '24px',
                borderTop: '1px solid #e2e8f0'
              }}>
                <button 
                  type="button" 
                  onClick={handleCancelEdit}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: '#f1f5f9',
                    color: '#64748b',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: '15px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#e2e8f0'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#f1f5f9'}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-btn" 
                  style={{ 
                    flex: 1,
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    padding: '14px',
                    fontSize: '15px',
                    fontWeight: 600,
                    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)'
                  }}
                >
                  💾 Update Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {tasks.length > 0 && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div className="card" style={{ padding: '20px', background: '#f8fafc' }}>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Total Tasks</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>{tasks.length}</div>
          </div>
          <div className="card" style={{ padding: '20px', background: '#dbeafe' }}>
            <div style={{ fontSize: '13px', color: '#1e40af', marginBottom: '4px' }}>In Progress</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#2563eb' }}>
              {tasks.filter(t => t.status === 'In Progress').length}
            </div>
          </div>
          <div className="card" style={{ padding: '20px', background: '#fef3c7' }}>
            <div style={{ fontSize: '13px', color: '#92400e', marginBottom: '4px' }}>Pending Approval</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#f59e0b' }}>
              {tasks.filter(t => t.status === 'Pending Approval').length}
            </div>
          </div>
          <div className="card" style={{ padding: '20px', background: '#d1fae5' }}>
            <div style={{ fontSize: '13px', color: '#065f46', marginBottom: '4px' }}>Completed</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#10b981' }}>
              {tasks.filter(t => t.status === 'Completed').length}
            </div>
          </div>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <p>No tasks created yet. Create your first task to get started.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="desktop-only">
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '22%' }}>Task Details</th>
                    <th style={{ width: '15%' }}>Assigned To</th>
                    <th style={{ width: '14%' }}>Deadline</th>
                    <th style={{ width: '16%' }}>Progress</th>
                    <th style={{ width: '12%' }}>Status</th>
                    <th style={{ width: '21%', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task._id}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '15px', marginBottom: '6px' }}>
                          {task.title}
                        </div>
                        <div style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.4' }}>
                          {task.description.substring(0, 80)}
                          {task.description.length > 80 ? '...' : ''}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                          {task.assignedTo?.name}
                        </div>
                        <div style={{ 
                          padding: '4px 8px', 
                          background: '#f1f5f9', 
                          borderRadius: '6px',
                          display: 'inline-block',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#475569'
                        }}>
                          {task.assignedTo?.internId}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '13px', color: '#475569' }}>
                          {formatDeadline(task.deadline)}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            flex: 1,
                            height: '10px',
                            background: '#e2e8f0',
                            borderRadius: '10px',
                            overflow: 'hidden',
                            minWidth: '80px'
                          }}>
                            <div style={{
                              width: `${task.progress}%`,
                              height: '100%',
                              background: task.progress === 100 
                                ? 'linear-gradient(90deg, #10b981, #059669)' 
                                : 'linear-gradient(90deg, #3b82f6, #2563eb)',
                              transition: 'width 0.3s ease'
                            }}></div>
                          </div>
                          <span style={{ 
                            fontWeight: 700, 
                            fontSize: '13px', 
                            minWidth: '42px',
                            color: task.progress === 100 ? '#10b981' : '#3b82f6'
                          }}>
                            {task.progress}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <span style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor: `${getStatusColor(task.status)}20`,
                          color: getStatusColor(task.status),
                          display: 'inline-block',
                          whiteSpace: 'nowrap'
                        }}>
                          {task.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                          {task.status === 'Pending Approval' && (
                            <button
                              className="approve-btn"
                              onClick={() => handleApproveTask(task._id, task.title)}
                              style={{ 
                                fontSize: '12px', 
                                padding: '8px 12px',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                              }}
                            >
                              ✓ Approve
                            </button>
                          )}
                          {task.status === 'Completed' && (
                            <span style={{ 
                              color: '#10b981', 
                              fontWeight: 700, 
                              fontSize: '13px',
                              padding: '8px 12px',
                              background: '#d1fae5',
                              borderRadius: '8px'
                            }}>
                              ✓ Approved
                            </span>
                          )}
                          {task.status !== 'Completed' && (
                            <>
                              <button
                                onClick={() => handleEditTask(task)}
                                style={{
                                  padding: '8px 12px',
                                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '8px',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                              >
                                ✏️ Edit
                              </button>
                              <button
                                onClick={() => handleDeleteTask(task._id, task.title)}
                                style={{
                                  padding: '8px 12px',
                                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '8px',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                              >
                                🗑️ Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="mobile-only">
            {tasks.map((task) => (
              <div key={task._id} style={{
                background: 'white',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                border: '1px solid #e2e8f0'
              }}>
                {/* Task Header */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: '12px',
                  paddingBottom: '12px',
                  borderBottom: '2px solid #f1f5f9'
                }}>
                  <h3 style={{ 
                    fontSize: '16px', 
                    fontWeight: 700,
                    margin: 0,
                    flex: 1,
                    color: '#0f172a'
                  }}>
                    {task.title}
                  </h3>
                  <span style={{
                    backgroundColor: `${getStatusColor(task.status)}20`,
                    color: getStatusColor(task.status),
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: '20px',
                    whiteSpace: 'nowrap',
                    marginLeft: '10px'
                  }}>
                    {task.status}
                  </span>
                </div>

                <p style={{ 
                  margin: '0 0 16px',
                  fontSize: '13px',
                  color: '#64748b',
                  lineHeight: '1.5'
                }}>
                  {task.description.length > 120 ? task.description.substring(0, 120) + '...' : task.description}
                </p>

                {/* Intern Info */}
                <div style={{ 
                  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
                  padding: '12px',
                  borderRadius: '12px',
                  marginBottom: '12px'
                }}>
                  <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>👤 Assigned To</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                    {task.assignedTo?.name}
                  </div>
                  <div style={{ 
                    padding: '4px 10px', 
                    background: 'white', 
                    borderRadius: '6px',
                    display: 'inline-block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#475569'
                  }}>
                    {task.assignedTo?.internId}
                  </div>
                </div>

                {/* Deadline */}
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  background: '#fef3c7',
                  borderRadius: '10px',
                  marginBottom: '12px'
                }}>
                  <span style={{ fontSize: '12px', color: '#92400e', fontWeight: 600 }}>⏰ Deadline</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#78350f' }}>
                    {formatDeadline(task.deadline)}
                  </span>
                </div>

                {/* Progress */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>Progress</span>
                    <span style={{ 
                      fontSize: '14px', 
                      fontWeight: 700, 
                      color: task.progress === 100 ? '#10b981' : '#3b82f6' 
                    }}>
                      {task.progress}%
                    </span>
                  </div>
                  <div style={{
                    height: '10px',
                    background: '#e2e8f0',
                    borderRadius: '10px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${task.progress}%`,
                      height: '100%',
                      background: task.progress === 100 
                        ? 'linear-gradient(90deg, #10b981, #059669)' 
                        : 'linear-gradient(90deg, #3b82f6, #2563eb)',
                      transition: 'width 0.3s ease'
                    }}></div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {task.status === 'Pending Approval' && (
                    <button
                      onClick={() => handleApproveTask(task._id, task.title)}
                      style={{ 
                        flex: 1,
                        padding: '12px 16px',
                        fontSize: '13px',
                        fontWeight: 600,
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                        transition: 'all 0.2s'
                      }}
                    >
                      ✓ Approve Task
                    </button>
                  )}
                  {task.status === 'Completed' && (
                    <div style={{ 
                      flex: 1,
                      padding: '12px 16px',
                      fontSize: '13px',
                      fontWeight: 700,
                      background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                      color: '#065f46',
                      borderRadius: '10px',
                      textAlign: 'center'
                    }}>
                      ✓ Approved
                    </div>
                  )}
                  {task.status !== 'Completed' && (
                    <>
                      <button
                        onClick={() => handleEditTask(task)}
                        style={{
                          flex: 1,
                          padding: '12px 16px',
                          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                          transition: 'all 0.2s'
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task._id, task.title)}
                        style={{
                          flex: 1,
                          padding: '12px 16px',
                          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                          transition: 'all 0.2s'
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

export default ManageTasks;
