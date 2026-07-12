import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { trainerAPI } from "../services/api";
import StudentRecordsSidebar from "../components/StudentRecordsSidebar";
import LoadingSpinner from "../components/LoadingSpinner";

function TrainingForm() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    attendance: "Present",
    skillImprovementNote: "",
    engagementLevel: "Medium",
    trainerRemarks: "",
    score: "",
    outOf: "",
  });
  const [trainings, setTrainings] = useState([]);
  const [historySearch, setHistorySearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [studentInfo, setStudentInfo] = useState(null);

  useEffect(() => {
    fetchStudentInfo();
    fetchTrainings();
  }, [studentId]);

  const fetchStudentInfo = async () => {
    try {
      const response = await trainerAPI.getAssignedStudents();
      if (response.data.success) {
        const student = (response.data.students || []).find((item) => item._id === studentId);
        setStudentInfo(student || null);
      }
    } catch (error) {
      console.error("Error fetching student info:", error);
    }
  };

  const fetchTrainings = async () => {
    try {
      const response = await trainerAPI.getStudentRecords(studentId);
      if (response.data.success) {
        setTrainings(response.data.data.trainings);
      }
    } catch (error) {
      console.error("Error fetching trainings:", error);
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
      const cleanedData = {
        studentId,
        ...formData,
      };
      if (cleanedData.score) cleanedData.score = parseFloat(cleanedData.score);
      if (cleanedData.outOf) cleanedData.outOf = parseFloat(cleanedData.outOf);
      const response = await trainerAPI.addTraining(cleanedData);

      if (response.data.success) {
        setSuccess("Training record added successfully!");
        setFormData({
          date: new Date().toISOString().split("T")[0],
          attendance: "Present",
          skillImprovementNote: "",
          engagementLevel: "Medium",
          trainerRemarks: "",
          score: "",
          outOf: "",
        });
        fetchTrainings();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add training record");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    const sourceTab = location.state?.fromTab || "assignments";
    navigate(`/trainer-dashboard?tab=${sourceTab}`);
  };

  const filteredTrainings = trainings.filter((training) => {
    const query = historySearch.trim().toLowerCase();
    if (!query) return true;

    const fields = [
      training?.date ? new Date(training.date).toLocaleDateString() : "",
      training?.attendance,
      training?.engagementLevel,
      training?.skillImprovementNote,
      training?.trainerRemarks,
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
            <h1>Training Update</h1>
            <p>Add training and attendance records for the student</p>
          </div>
        </div>

        <section className="record-spotlight">
          <div className="record-spotlight-left">
            <h2>Training Control Center</h2>
            <p>Maintain attendance and engagement updates with consistent session-level observations.</p>
          </div>
          <div className="record-spotlight-chips">
            <span className="record-chip">Date: {formData.date || "-"}</span>
            <span className="record-chip">Attendance: {formData.attendance}</span>
            <span className="record-chip">Engagement: {formData.engagementLevel}</span>
          </div>
        </section>

        <div className="student-records-shell">
          <aside className="student-records-sidepanel">
            <StudentRecordsSidebar studentId={studentId} activeTab="training" />
          </aside>
          <div className="student-records-content">

        <div className="card record-form-card">
          <h2>Add Training Record</h2>
          <p className="record-form-subtitle">Log attendance and session quality with focused training notes.</p>
          <form onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="record-form-grid">
              <div className="form-group">
                <label>PSMS ID</label>
                <input type="text" value={studentInfo?.internId || ""} readOnly />
              </div>

              <div className="form-group">
                <label>Student Name</label>
                <input type="text" value={studentInfo?.name || ""} readOnly />
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
                <label>Score</label>
                <input
                  type="number"
                  name="score"
                  value={formData.score}
                  onChange={handleChange}
                  min="0"
                  placeholder="Score"
                />
              </div>

              <div className="form-group">
                <label>Out Of</label>
                <input
                  type="number"
                  name="outOf"
                  value={formData.outOf}
                  onChange={handleChange}
                  min="0"
                  placeholder="Out Of"
                />
              </div>

              <div className="form-group full-width">
                <label>Skill Improvement Note</label>
                <textarea
                  name="skillImprovementNote"
                  value={formData.skillImprovementNote}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Enter notes about skill improvements observed"
                />
              </div>

              <div className="form-group full-width">
                <label>Trainer Remarks</label>
                <textarea
                  name="trainerRemarks"
                  value={formData.trainerRemarks}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Enter your remarks about the training session"
                />
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <LoadingSpinner text="Saving..." inline size="sm" />
              ) : (
                "Save Training Record"
              )}
            </button>
          </form>
        </div>

        {/* Training History */}
        <div className="card student-history-card" style={{ marginTop: "20px" }}>
          <h2>Training History</h2>
          {trainings.length === 0 ? (
            <p className="record-history-empty">No training records yet</p>
          ) : (
            <>
              <div className="student-history-toolbar interview-history-toolbar">
                <div className="interview-history-search-wrap">
                  <label className="interview-history-search-label">Search Training</label>
                  <input
                    type="text"
                    className="student-history-search interview-history-search"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Search by date, attendance, engagement, notes..."
                    aria-label="Search training history"
                  />
                </div>
                <div className="interview-history-toolbar-meta">
                  <span>{filteredTrainings.length} records</span>
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
              <table className="data-table view-students-table training-history-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Attendance</th>
                    <th>Engagement Level</th>
                    <th>Score</th>
                    <th>Skill Improvement</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrainings.length === 0 ? (
                    <tr>
                      <td colSpan="5">No training records match your search</td>
                    </tr>
                  ) : (
                    filteredTrainings.map((training, index) => (
                      <tr key={index}>
                        <td>{new Date(training.date).toLocaleDateString()}</td>
                        <td>
                          <span
                            className={`status-badge ${
                              training.attendance === "Present"
                                ? "status-completed"
                                : training.attendance === "Late"
                                  ? "status-pending"
                                  : "status-rejected"
                            }`}
                          >
                            {training.attendance}
                          </span>
                        </td>
                        <td>{training.engagementLevel}</td>
                        <td>{training.score !== undefined && training.score !== null ? `${training.score}${training.outOf ? '/' + training.outOf : ''}` : "-"}</td>
                        <td>{training.skillImprovementNote || "-"}</td>
                        <td>{training.trainerRemarks || "-"}</td>
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

export default TrainingForm;
