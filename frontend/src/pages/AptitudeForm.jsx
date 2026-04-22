import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { trainerAPI } from "../services/api";
import StudentRecordsSidebar from "../components/StudentRecordsSidebar";
import LoadingSpinner from "../components/LoadingSpinner";

function AptitudeForm() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    roundNumber: 1,
    score: "",
    result: "Pass",
    remarks: "",
  });
  const [aptitudes, setAptitudes] = useState([]);
  const [historySearch, setHistorySearch] = useState("");
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

  const handleBack = () => {
    const sourceTab = location.state?.fromTab || "assignments";
    navigate(`/trainer-dashboard?tab=${sourceTab}`);
  };

  const filteredAptitudes = aptitudes.filter((apt) => {
    const query = historySearch.trim().toLowerCase();
    if (!query) return true;

    const fields = [
      apt?.roundNumber,
      apt?.score,
      apt?.result,
      apt?.remarks,
      apt?.createdAt ? new Date(apt.createdAt).toLocaleDateString() : "",
    ];

    return fields.some((field) => String(field || "").toLowerCase().includes(query));
  });

  return (
    <div className="student-records-standalone">
      <main className="main-content student-records-page student-records-main">
        <div className="content-header-with-back">
          <button
            className="back-button"
            onClick={handleBack}
            title="Go back to previous page"
          >
            <span className="back-arrow">←</span>
            <span>Back</span>
          </button>
          <div className="student-records-header-copy">
            <h1>Aptitude Test</h1>
            <p>Add aptitude test records for the student</p>
          </div>
        </div>

        <div className="student-records-shell">
          <aside className="student-records-sidepanel">
            <StudentRecordsSidebar studentId={studentId} activeTab="aptitude" />
          </aside>
          <div className="student-records-content">

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
              {loading ? (
                <LoadingSpinner text="Saving..." inline size="sm" />
              ) : (
                "Save Aptitude Record"
              )}
            </button>
          </form>
        </div>

        {/* Aptitude History */}
        <div className="card student-history-card" style={{ marginTop: "20px" }}>
          <h2>Aptitude Test History</h2>
          {aptitudes.length === 0 ? (
            <p>No aptitude records yet</p>
          ) : (
            <>
              <div className="student-history-toolbar">
                <input
                  type="text"
                  className="student-history-search"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search by round, score, result, remarks, date..."
                  aria-label="Search aptitude history"
                />
              </div>
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
                  {filteredAptitudes.length === 0 ? (
                    <tr>
                      <td colSpan="5">No aptitude records match your search</td>
                    </tr>
                  ) : (
                    filteredAptitudes.map((apt, index) => (
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
            </>
          )}
        </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AptitudeForm;
