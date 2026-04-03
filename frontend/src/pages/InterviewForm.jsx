import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { trainerAPI } from "../services/api";
import TrainerSidebar from "../components/TrainerSidebar";
import LoadingSpinner from "../components/LoadingSpinner";

function InterviewForm() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    interviewType: "HR",
    date: "",
    attemptNumber: 1,
    communicationLevel: "",
    confidenceLevel: "",
    clarityLevel: "",
    overallLevel: "",
    levelCrossed: false,
    remarks: "",
  });
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchInterviews();
  }, [studentId]);

  const fetchInterviews = async () => {
    try {
      const response = await trainerAPI.getStudentRecords(studentId);
      if (response.data.success) {
        setInterviews(response.data.data.interviews);
      }
    } catch (error) {
      console.error("Error fetching interviews:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await trainerAPI.addInterview({
        studentId,
        ...formData,
      });

      if (response.data.success) {
        setSuccess("Interview record added successfully!");
        setFormData({
          interviewType: "HR",
          date: "",
          attemptNumber: 1,
          communicationLevel: "",
          confidenceLevel: "",
          clarityLevel: "",
          overallLevel: "",
          levelCrossed: false,
          remarks: "",
        });
        fetchInterviews();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add interview record");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <TrainerSidebar />
      <main className="main-content">
        <div className="content-header-with-back">
          <button
            className="back-button"
            onClick={() => navigate(-1)}
            title="Go back to previous page"
          >
            <span className="back-arrow">←</span>
            <span>Back</span>
          </button>
          <div>
            <h1>Interview Evaluation</h1>
            <p>Add interview records for the student</p>
          </div>
        </div>

        <div className="card">
          <h2>Add Interview Record</h2>
          <form onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="form-group">
              <label>Interview Type *</label>
              <select
                name="interviewType"
                value={formData.interviewType}
                onChange={handleChange}
                required
              >
                <option value="HR">HR</option>
                <option value="Technical">Technical</option>
              </select>
            </div>

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
              <label>Attempt Number *</label>
              <input
                type="number"
                name="attemptNumber"
                value={formData.attemptNumber}
                onChange={handleChange}
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label>Communication Level *</label>
              <select
                name="communicationLevel"
                value={formData.communicationLevel}
                onChange={handleChange}
                required
              >
                <option value="">Select Level</option>
                <option value="B">B - Beginner</option>
                <option value="I">I - Intermediate</option>
                <option value="A">A - Advanced</option>
                <option value="E">E - Expert</option>
              </select>
            </div>

            <div className="form-group">
              <label>Confidence Level *</label>
              <select
                name="confidenceLevel"
                value={formData.confidenceLevel}
                onChange={handleChange}
                required
              >
                <option value="">Select Level</option>
                <option value="B">B - Beginner</option>
                <option value="I">I - Intermediate</option>
                <option value="A">A - Advanced</option>
                <option value="E">E - Expert</option>
              </select>
            </div>

            <div className="form-group">
              <label>Clarity Level *</label>
              <select
                name="clarityLevel"
                value={formData.clarityLevel}
                onChange={handleChange}
                required
              >
                <option value="">Select Level</option>
                <option value="B">B - Beginner</option>
                <option value="I">I - Intermediate</option>
                <option value="A">A - Advanced</option>
                <option value="E">E - Expert</option>
              </select>
            </div>

            <div className="form-group">
              <label>Overall Level *</label>
              <select
                name="overallLevel"
                value={formData.overallLevel}
                onChange={handleChange}
                required
              >
                <option value="">Select Level</option>
                <option value="F">F - Fail</option>
                <option value="C">C - Clear</option>
                <option value="P">P - Pass</option>
                <option value="E">E - Excellent</option>
              </select>
            </div>

            <div className="form-group left-align">
              <label
                className="checkbox-label"
                style={{
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <input
                  type="checkbox"
                  name="levelCrossed"
                  checked={formData.levelCrossed}
                  onChange={handleChange}
                  style={{ marginRight: "10px" }}
                />
                Level Crossed?
              </label>
            </div>

            <div className="form-group">
              <label>Remarks</label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                rows="4"
                placeholder="Enter your remarks about the interview"
              />
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <LoadingSpinner text="Saving..." inline size="sm" />
              ) : (
                "Save Interview Record"
              )}
            </button>
          </form>
        </div>

        {/* Interview History */}
        <div className="card" style={{ marginTop: "20px" }}>
          <h2>Interview History</h2>
          {interviews.length === 0 ? (
            <p>No interview records yet</p>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Attempt</th>
                    <th>Communication</th>
                    <th>Confidence</th>
                    <th>Clarity</th>
                    <th>Overall</th>
                    <th>Level Crossed</th>
                  </tr>
                </thead>
                <tbody>
                  {interviews.map((interview, index) => (
                    <tr key={index}>
                      <td>{new Date(interview.date).toLocaleDateString()}</td>
                      <td>{interview.interviewType}</td>
                      <td>{interview.attemptNumber}</td>
                      <td>{interview.communicationLevel}</td>
                      <td>{interview.confidenceLevel}</td>
                      <td>{interview.clarityLevel}</td>
                      <td>{interview.overallLevel}</td>
                      <td>{interview.levelCrossed ? "Yes" : "No"}</td>
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

export default InterviewForm;
