import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trainerAPI } from '../services/api';

function TrainingForm() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    attendance: 'Present',
    skillImprovementNote: '',
    engagementLevel: 'Medium',
    trainerRemarks: ''
  });
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchTrainings();
  }, [studentId]);

  const fetchTrainings = async () => {
    try {
      const response = await trainerAPI.getStudentRecords(studentId);
      if (response.data.success) {
        setTrainings(response.data.data.trainings);
      }
    } catch (error) {
      console.error('Error fetching trainings:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await trainerAPI.addTraining({
        studentId,
        ...formData
      });

      if (response.data.success) {
        setSuccess('Training record added successfully!');
        setFormData({
          date: new Date().toISOString().split('T')[0],
          attendance: 'Present',
          skillImprovementNote: '',
          engagementLevel: 'Medium',
          trainerRemarks: ''
        });
        fetchTrainings();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add training record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Progrentures</h2>
          <p className="sidebar-role">Trainer Panel</p>
        </div>
        <nav className="sidebar-nav">
          <button onClick={() => navigate('/trainer-dashboard')} className="nav-item">
            ← Back to Dashboard
          </button>
        </nav>
      </aside>

      <main className="dashboard-main">
        <div className="content-header">
          <h1>Training Update</h1>
          <p>Add training and attendance records for the student</p>
        </div>

        <div className="card">
          <h2>Add Training Record</h2>
          <form onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="form-group">
              <label>Date *</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Attendance *</label>
              <select
                name="attendance"
                value={formData.attendance}
                onChange={handleChange}
                required
              >
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Late">Late</option>
              </select>
            </div>

            <div className="form-group">
              <label>Skill Improvement Note</label>
              <textarea
                name="skillImprovementNote"
                value={formData.skillImprovementNote}
                onChange={handleChange}
                rows="3"
                placeholder="Enter notes about skill improvements observed"
              />
            </div>

            <div className="form-group">
              <label>Engagement Level *</label>
              <select
                name="engagementLevel"
                value={formData.engagementLevel}
                onChange={handleChange}
                required
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Excellent">Excellent</option>
              </select>
            </div>

            <div className="form-group">
              <label>Trainer Remarks</label>
              <textarea
                name="trainerRemarks"
                value={formData.trainerRemarks}
                onChange={handleChange}
                rows="4"
                placeholder="Enter your remarks about the training session"
              />
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Saving...' : 'Save Training Record'}
            </button>
          </form>
        </div>

        {/* Training History */}
        <div className="card" style={{ marginTop: '20px' }}>
          <h2>Training History</h2>
          {trainings.length === 0 ? (
            <p>No training records yet</p>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Attendance</th>
                    <th>Engagement Level</th>
                    <th>Skill Improvement</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {trainings.map((training, index) => (
                    <tr key={index}>
                      <td>{new Date(training.date).toLocaleDateString()}</td>
                      <td>
                        <span className={`status-badge ${
                          training.attendance === 'Present' ? 'status-completed' :
                          training.attendance === 'Late' ? 'status-pending' :
                          'status-rejected'
                        }`}>
                          {training.attendance}
                        </span>
                      </td>
                      <td>{training.engagementLevel}</td>
                      <td>{training.skillImprovementNote || '-'}</td>
                      <td>{training.trainerRemarks || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default TrainingForm;
