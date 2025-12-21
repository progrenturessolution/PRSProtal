import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { taskAPI } from '../services/api';

function CreateTask({ onTaskCreated }) {
  const [interns, setInterns] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    assignedTo: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInterns();
  }, []);

  const fetchInterns = async () => {
    try {
      const response = await adminAPI.getAllInterns();
      setInterns(response.data.interns);
    } catch (err) {
      console.error('Failed to fetch interns:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await taskAPI.createTask(formData);
      
      if (response.data.success) {
        const emailMsg = response.data.emailSent 
          ? '📧 Email notification sent to intern' 
          : '⚠️ Task created but email failed';
        
        setSuccess(`✅ Task created and assigned successfully!\n${emailMsg}`);
        
        // Reset form
        setFormData({
          title: '',
          description: '',
          deadline: '',
          assignedTo: ''
        });

        // Notify parent to refresh stats
        if (onTaskCreated) {
          onTaskCreated();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="content-header">
        <h1>Create & Assign Task</h1>
        <p>Assign a new task to an intern</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="form-group">
            <label>Task Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter task title"
              required
            />
          </div>

          <div className="form-group">
            <label>Task Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the task in detail"
              required
              rows="5"
              style={{
                width: '100%',
                padding: '14px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '15px',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>

          <div className="form-group">
            <label>Deadline *</label>
            <input
              type="datetime-local"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Assign to Intern *</label>
            <select
              name="assignedTo"
              value={formData.assignedTo}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '14px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '15px',
                background: '#f8fafc'
              }}
            >
              <option value="">Select an intern</option>
              {interns.map((intern) => (
                <option key={intern._id} value={intern._id}>
                  {intern.name} - {intern.internId}
                </option>
              ))}
            </select>
          </div>

          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading}
          >
            {loading ? 'Creating Task...' : '📋 Create & Assign Task'}
          </button>
        </form>
      </div>
    </>
  );
}

export default CreateTask;
