import { useState, useEffect } from 'react';
import { taskAPI } from '../services/api';

function CompletedTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompletedTasks();
  }, []);

  const fetchCompletedTasks = async () => {
    try {
      setLoading(true);
      const response = await taskAPI.getAllTasks();
      const completedTasks = response.data.tasks.filter(
        task => task.status === 'Completed'
      );
      setTasks(completedTasks);
    } catch (err) {
      console.error('Failed to fetch completed tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  if (loading) {
    return (
      <div className="card">
        <p>Loading completed tasks...</p>
      </div>
    );
  }

  return (
    <>
      <div className="content-header">
        <h1>Completed Tasks</h1>
        <p>View all approved and completed task records</p>
      </div>

      {tasks.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📋</div>
            <p>No completed tasks yet. Approved tasks will appear here.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Summary Card */}
          <div style={{ 
            marginBottom: '20px', 
            padding: '20px 24px', 
            background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', 
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 4px 6px rgba(16, 185, 129, 0.1)'
          }}>
            <div style={{ 
              background: 'white', 
              borderRadius: '12px', 
              width: '56px', 
              height: '56px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px'
            }}>
              ✓
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#065f46' }}>
                {tasks.length} Task{tasks.length > 1 ? 's' : ''} Completed
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#047857', opacity: 0.9 }}>
                Complete history of all approved tasks
              </p>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="desktop-only">
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '25%' }}>Task Details</th>
                    <th style={{ width: '18%' }}>Intern Info</th>
                    <th style={{ width: '14%' }}>Assigned Date</th>
                    <th style={{ width: '14%' }}>Deadline</th>
                    <th style={{ width: '14%' }}>Completed Date</th>
                    <th style={{ width: '15%', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task._id}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '15px', marginBottom: '6px' }}>
                          {task.title}
                        </div>
                        <div style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>
                          {task.description.length > 100 
                            ? task.description.substring(0, 100) + '...' 
                            : task.description}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                          {task.assignedTo?.name || 'N/A'}
                        </div>
                        <div style={{ 
                          padding: '4px 10px', 
                          background: '#f1f5f9', 
                          borderRadius: '6px',
                          display: 'inline-block',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#475569'
                        }}>
                          {task.assignedTo?.internId || 'N/A'}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '13px', color: '#475569' }}>
                          {formatDate(task.createdAt)}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '13px', color: '#475569' }}>
                          {formatDate(task.deadline)}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#10b981' }}>
                          🎉 {formatDate(task.completedAt)}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          padding: '8px 16px',
                          borderRadius: '20px',
                          fontSize: '13px',
                          fontWeight: 600,
                          backgroundColor: '#d1fae5',
                          color: '#059669',
                          display: 'inline-block'
                        }}>
                          ✓ Completed
                        </span>
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
                <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '2px solid #d1fae5' }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                    {task.title}
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>
                    {task.description}
                  </div>
                </div>

                {/* Intern Info */}
                <div style={{ 
                  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
                  padding: '12px',
                  borderRadius: '12px',
                  marginBottom: '16px'
                }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>👤 Intern</div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                    {task.assignedTo?.name || 'N/A'}
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
                    {task.assignedTo?.internId || 'N/A'}
                  </div>
                </div>

                {/* Date Info Grid */}
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  marginBottom: '16px'
                }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>📅 Assigned</div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#475569' }}>
                      {formatDate(task.createdAt)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>⏰ Deadline</div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#475569' }}>
                      {formatDate(task.deadline)}
                    </div>
                  </div>
                </div>

                {/* Completed Info */}
                <div style={{
                  background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                  padding: '14px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#047857', marginBottom: '4px' }}>🎉 Completed On</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#065f46' }}>
                      {formatDate(task.completedAt)}
                    </div>
                  </div>
                  <span style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 600,
                    backgroundColor: 'white',
                    color: '#059669'
                  }}>
                    ✓ Done
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

export default CompletedTasks;
