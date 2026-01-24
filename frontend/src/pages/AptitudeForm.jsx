import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { trainerAPI } from "../services/api";
import TrainerSidebar from "../components/TrainerSidebar";

function AptitudeForm() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    roundNumber: 1,
    score: "",
    result: "Pass",
    remarks: "",
  });
  const [aptitudes, setAptitudes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchAptitudes();
  }, [studentId]);

  const fetchAptitudes = async () => {
    try {
      const response = await trainerAPI.getStudentRecords(studentId);
      if (response.data.success) {
        setAptitudes(response.data.data.aptitudes);
      }
    } catch (error) {
      console.error("Error fetching aptitudes:", error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await trainerAPI.addAptitude({
        studentId,
        ...formData,
      });

      if (response.data.success) {
        setSuccess("Aptitude record added successfully!");
        setFormData({
          roundNumber: 1,
          score: "",
          result: "Pass",
          remarks: "",
        });
        fetchAptitudes();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add aptitude record");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <TrainerSidebar />
      <main className="main-content">
        <div className="content-header">
          <h1>Aptitude Test</h1>
          <p>Add aptitude test records for the student</p>
        </div>

        <div className="card">
          <h2>Add Aptitude Record</h2>
          <form onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="form-group">
              <label>Aptitude Round Number *</label>
              <input
                type="number"
                name="roundNumber"
                value={formData.roundNumber}
                onChange={handleChange}
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label>Score *</label>
              <input
                type="number"
                name="score"
                value={formData.score}
                onChange={handleChange}
                min="0"
                max="100"
                required
                placeholder="Enter score (0-100)"
              />
            </div>

            <div className="form-group">
              <label>Result *</label>
              <select
                name="result"
                value={formData.result}
                onChange={handleChange}
                required
              >
                <option value="Pass">Pass</option>
                <option value="Improve">Improve</option>
              </select>
            </div>

            <div className="form-group">
              <label>Remarks</label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                rows="4"
                placeholder="Enter your remarks about the aptitude test"
              />
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Saving..." : "Save Aptitude Record"}
            </button>
          </form>
        </div>

        {/* Aptitude History */}
        <div className="card" style={{ marginTop: "20px" }}>
          <h2>Aptitude Test History</h2>
          {aptitudes.length === 0 ? (
            <p>No aptitude records yet</p>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Round Number</th>
                    <th>Score</th>
                    <th>Result</th>
                    <th>Remarks</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {aptitudes.map((apt, index) => (
                    <tr key={index}>
                      <td>{apt.roundNumber}</td>
                      <td>{apt.score}</td>
                      <td>
                        <span
                          className={`status-badge ${apt.result === "Pass" ? "status-completed" : "status-pending"}`}
                        >
                          {apt.result}
                        </span>
                      </td>
                      <td>{apt.remarks || "-"}</td>
                      <td>{new Date(apt.createdAt).toLocaleDateString()}</td>
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

export default AptitudeForm;
