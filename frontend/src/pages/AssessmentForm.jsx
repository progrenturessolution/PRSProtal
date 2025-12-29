import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trainerAPI } from '../services/api';

function AssessmentForm() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    assessmentType: 'Domain',
    score: '',
    status: 'Pending',
    feedback: ''
  });
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchAssessments();
  }, [studentId]);

  const fetchAssessments = async () => {
    try {
      const response = await trainerAPI.getStudentRecords(studentId);
      if (response.data.success) {
        setAssessments(response.data.data.assessments);
      }
    } catch (error) {
      console.error('Error fetching assessments:', error);
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
      const response = await trainerAPI.addAssessment({
        studentId,
        ...formData
      });

      if (response.data.success) {
        setSuccess('Assessment record added successfully!');
        setFormData({
          assessmentType: 'Domain',
          score: '',
          status: 'Pending',
          feedback: ''
        });
        fetchAssessments();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add assessment record');
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
          <h1>Assessment Evaluation</h1>
          <p>Add assessment records for the student</p>
        </div>

        <div className="card">
          <h2>Add Assessment Record</h2>
          <form onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="form-group">
              <label>Assessment Type *</label>
              <select
                name="assessmentType"
                value={formData.assessmentType}
                onChange={handleChange}
                required
              >
                <option value="Domain">Domain</option>
                <option value="Coding">Coding</option>
              </select>
            </div>

            <div className="form-group">
              <label>Score</label>
              <input
                type="number"
                name="score"
                value={formData.score}
                onChange={handleChange}
                min="0"
                max="100"
                placeholder="Enter score (0-100)"
              />
            </div>

            <div className="form-group">
              <label>Status *</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Pass">Pass</option>
                <option value="Fail">Fail</option>
              </select>
            </div>

            <div className="form-group">
              <label>Feedback</label>
              <textarea
                name="feedback"
                value={formData.feedback}
                onChange={handleChange}
                rows="4"
                placeholder="Enter your feedback about the assessment"
              />
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Saving...' : 'Save Assessment Record'}
            </button>
          </form>
        </div>

        {/* Assessment History */}
        <div className="card" style={{ marginTop: '20px' }}>
          <h2>Assessment History</h2>
          {assessments.length === 0 ? (
            <p>No assessment records yet</p>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Score</th>
                    <th>Status</th>
                    <th>Feedback</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {assessments.map((assessment, index) => (
                    <tr key={index}>
                      <td>{assessment.assessmentType}</td>
                      <td>{assessment.score || '-'}</td>
                      <td>
                        <span className={`status-badge ${
                          assessment.status === 'Pass' ? 'status-completed' :
                          assessment.status === 'Fail' ? 'status-rejected' :
                          'status-pending'
                        }`}>
                          {assessment.status}
                        </span>
                      </td>
                      <td>{assessment.feedback || '-'}</td>
                      <td>{new Date(assessment.createdAt).toLocaleDateString()}</td>
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

export default AssessmentForm;
