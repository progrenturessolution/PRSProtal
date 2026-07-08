import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { trainerAPI } from "../services/api";
import StudentRecordsSidebar from "../components/StudentRecordsSidebar";
import LoadingSpinner from "../components/LoadingSpinner";

function AssessmentForm() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    assessmentType: "Domain",
    score: "",
    status: "Pending",
    feedback: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [assessments, setAssessments] = useState([]);
  const [historySearch, setHistorySearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
      console.error("Error fetching assessments:", error);
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
      const response = await trainerAPI.addAssessment({
        studentId,
        ...formData,
      });

      if (response.data.success) {
        setSuccess("Assessment record added successfully!");
        setFormData({
          assessmentType: "Domain",
          score: "",
          status: "Pending",
          feedback: "",
          date: new Date().toISOString().split("T")[0],
        });
        fetchAssessments();
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to add assessment record",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    const sourceTab = location.state?.fromTab || "assignments";
    navigate(`/trainer-dashboard?tab=${sourceTab}`);
  };

  const filteredAssessments = assessments.filter((assessment) => {
    const query = historySearch.trim().toLowerCase();
    if (!query) return true;

    const fields = [
      assessment?.assessmentType,
      assessment?.score,
      assessment?.status,
      assessment?.feedback,
      assessment?.createdAt ? new Date(assessment.createdAt).toLocaleDateString() : "",
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
            Back
          </button>
          <div className="student-records-header-copy">
            <h1>Assessment Evaluation</h1>
            <p>Add assessment records for the student</p>
          </div>
        </div>

        <section className="record-spotlight">
          <div className="record-spotlight-left">
            <h2>Assessment Control Center</h2>
            <p>Document assessment outcomes clearly so progress and performance trends stay visible.</p>
          </div>
          <div className="record-spotlight-chips">
            <span className="record-chip">Type: {formData.assessmentType}</span>
            <span className="record-chip">Status: {formData.status}</span>
            <span className="record-chip">Score: {formData.score || "-"}</span>
          </div>
        </section>

        <div className="student-records-shell">
          <aside className="student-records-sidepanel">
            <StudentRecordsSidebar studentId={studentId} activeTab="assessments" />
          </aside>
          <div className="student-records-content">

        <div className="card record-form-card">
          <h2>Add Assessment Record</h2>
          <p className="record-form-subtitle">Document each assessment with clear outcomes, scores, and actionable feedback.</p>
          <form onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="record-form-grid">
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

              <div className="form-group full-width">
                <label>Feedback</label>
                <textarea
                  name="feedback"
                  value={formData.feedback}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Enter your feedback about the assessment"
                />
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <LoadingSpinner text="Saving..." inline size="sm" />
              ) : (
                "Save Assessment Record"
              )}
            </button>
          </form>
        </div>

        {/* Assessment History */}
        <div className="card student-history-card" style={{ marginTop: "20px" }}>
          <h2>Assessment History</h2>
          {assessments.length === 0 ? (
            <p className="record-history-empty">No assessment records yet</p>
          ) : (
            <>
              <div className="student-history-toolbar interview-history-toolbar">
                <div className="interview-history-search-wrap">
                  <label className="interview-history-search-label">Search Assessments</label>
                  <input
                    type="text"
                    className="student-history-search interview-history-search"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Search by type, score, status, feedback, date..."
                    aria-label="Search assessment history"
                  />
                </div>
                <div className="interview-history-toolbar-meta">
                  <span>{filteredAssessments.length} records</span>
                  {historySearch.trim() && (
                    <button
                      type="button"
                      className="interview-history-clear-btn"
                      onClick={() => setHistorySearch("")}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            <div className="table-container">
              <table className="data-table view-students-table assessment-history-table">
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
                  {filteredAssessments.length === 0 ? (
                    <tr>
                      <td colSpan="5">No assessment records match your search</td>
                    </tr>
                  ) : (
                    filteredAssessments.map((assessment, index) => (
                      <tr key={index}>
                        <td>{assessment.assessmentType}</td>
                        <td>{assessment.score || "-"}</td>
                        <td>
                          <span
                            className={`status-badge ${
                              assessment.status === "Pass"
                                ? "status-completed"
                                : assessment.status === "Fail"
                                  ? "status-rejected"
                                  : "status-pending"
                            }`}
                          >
                            {assessment.status}
                          </span>
                        </td>
                        <td>{assessment.feedback || "-"}</td>
                        <td>
                          {assessment.date ? new Date(assessment.date).toLocaleDateString() : new Date(assessment.createdAt).toLocaleDateString()}
                        </td>
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

export default AssessmentForm;
