import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { trainerAPI } from "../services/api";
import StudentRecordsSidebar from "../components/StudentRecordsSidebar";
import LoadingSpinner from "../components/LoadingSpinner";

function InterviewForm() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [studentInfo, setStudentInfo] = useState(null);
  const [formData, setFormData] = useState({
    interviewType: "HR",
    date: "",
    attemptNumber: 1,
    communicationLevel: "",
    confidenceLevel: "",
    bodyLanguage: "",
    clarityOfAnswer: "",
    technicalKnowledge: "",
    problemSolving: "",
    codingAbility: "",
    logicAndApproach: "",
    overallHRLevel: "",
    overallTechnicalLevel: "",
    levelCrossed: false,
    hrRemarks: "",
    technicalRemarks: "",
  });
  const [interviews, setInterviews] = useState([]);
  const [historySearch, setHistorySearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchStudentInfo();
    fetchInterviews();
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
      [name]: name === "levelCrossed" ? value === "true" : type === "checkbox" ? checked : value,
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
          bodyLanguage: "",
          clarityOfAnswer: "",
          technicalKnowledge: "",
          problemSolving: "",
          codingAbility: "",
          logicAndApproach: "",
          overallHRLevel: "",
          overallTechnicalLevel: "",
          levelCrossed: false,
          hrRemarks: "",
          technicalRemarks: "",
        });
        fetchInterviews();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add interview record");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    const sourceTab = location.state?.fromTab || "assignments";
    navigate(`/trainer-dashboard?tab=${sourceTab}`);
  };

  const filteredInterviews = interviews.filter((interview) => {
    const query = historySearch.trim().toLowerCase();
    if (!query) return true;

    const dateText = interview?.date ? new Date(interview.date).toLocaleDateString().toLowerCase() : "";
    const fields = [
      dateText,
      interview?.interviewType,
      interview?.attemptNumber,
      interview?.communicationLevel,
      interview?.confidenceLevel,
      interview?.bodyLanguage,
      interview?.clarityOfAnswer,
      interview?.technicalKnowledge,
      interview?.problemSolving,
      interview?.codingAbility,
      interview?.logicAndApproach,
      interview?.overallHRLevel,
      interview?.overallTechnicalLevel,
      interview?.overallLevel,
      interview?.levelCrossed ? "crossed" : "not crossed",
      interview?.levelCrossed ? "crossed" : "not crossed",
      interview?.hrRemarks,
      interview?.technicalRemarks,
      interview?.remarks,
    ];

    return fields.some((field) => String(field || "").toLowerCase().includes(query));
  });

  return (
    <div className="student-records-standalone">
      <main className="main-content student-records-page student-records-main interview-unique-page">
        <div className="content-header-with-back">
          <button
            className="back-button"
            onClick={handleBack}
            title="Go back to previous page"
          >
            Back
          </button>
          <div className="student-records-header-copy">
            <h1>Interview Evaluation</h1>
            <p>Add interview records for the student</p>
          </div>
        </div>

        <section className="record-spotlight">
          <div className="record-spotlight-left">
            <h2>Interview Control Center</h2>
            <p>Capture each interview round with structured ratings and maintain a clean decision history.</p>
          </div>
          <div className="record-spotlight-chips">
            <span className="record-chip">Type: {formData.interviewType}</span>
            <span className="record-chip">Attempt: {formData.attemptNumber}</span>
            <span className={`record-chip ${formData.levelCrossed ? "passed" : "pending"}`}>
              Level: {formData.levelCrossed ? "Crossed" : "Pending"}
            </span>
          </div>
        </section>

        <div className="student-records-shell">
          <aside className="student-records-sidepanel">
            <StudentRecordsSidebar studentId={studentId} activeTab="interviews" />
          </aside>
          <div className="student-records-content">

        <div className="card record-form-card">
          <h2>Add Interview Record</h2>
          <p className="record-form-subtitle">Capture complete interview feedback in a clean, structured format.</p>
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
                <label>Interview Type *</label>
                <select
                  name="interviewType"
                  value={formData.interviewType}
                  onChange={(e) => {
                    const interviewType = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      interviewType,
                      communicationLevel: "",
                      confidenceLevel: "",
                      bodyLanguage: "",
                      clarityOfAnswer: "",
                      technicalKnowledge: "",
                      problemSolving: "",
                      codingAbility: "",
                      logicAndApproach: "",
                      overallHRLevel: "",
                      overallTechnicalLevel: "",
                      levelCrossed: false,
                      hrRemarks: "",
                      technicalRemarks: "",
                    }));
                  }}
                  required
                >
                  <option value="HR">HR</option>
                  <option value="Technical">Technical</option>
                </select>
              </div>

              <div className="form-group">
                <label>Interview Attempt (ex. 4/24) *</label>
                <input
                  type="text"
                  name="attemptNumber"
                  value={formData.attemptNumber}
                  onChange={handleChange}
                  placeholder="4/24"
                  required
                />
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

              {formData.interviewType === "HR" ? (
                <>
                  <div className="form-group">
                    <label>Communication Level (B/I/A/E) *</label>
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
                    <label>Confidence Level (B/I/A/E) *</label>
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
                    <label>Body Language (B/I/A/E) *</label>
                    <select
                      name="bodyLanguage"
                      value={formData.bodyLanguage}
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
                    <label>Clarity of Answer (B/I/A/E) *</label>
                    <select
                      name="clarityOfAnswer"
                      value={formData.clarityOfAnswer}
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
                    <label>Overall HR Level (B/I/A/E) *</label>
                    <select
                      name="overallHRLevel"
                      value={formData.overallHRLevel}
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
                  <div className="form-group full-width">
                    <label>Level Crossed? (Yes/No) *</label>
                    <select
                      name="levelCrossed"
                      value={String(formData.levelCrossed)}
                      onChange={handleChange}
                      required
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                  <div className="form-group full-width">
                    <label>HR Remarks</label>
                    <textarea
                      name="hrRemarks"
                      value={formData.hrRemarks}
                      onChange={handleChange}
                      rows="4"
                      placeholder="Enter HR remarks"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label>Technical Knowledge (B/I/A/E) *</label>
                    <select
                      name="technicalKnowledge"
                      value={formData.technicalKnowledge}
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
                    <label>Problem-Solving (B/I/A/E) *</label>
                    <select
                      name="problemSolving"
                      value={formData.problemSolving}
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
                    <label>Coding Ability (B/I/A/E) *</label>
                    <select
                      name="codingAbility"
                      value={formData.codingAbility}
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
                    <label>Logic &amp; Approach (B/I/A/E) *</label>
                    <select
                      name="logicAndApproach"
                      value={formData.logicAndApproach}
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
                    <label>Overall Technical Level (B/I/A/E) *</label>
                    <select
                      name="overallTechnicalLevel"
                      value={formData.overallTechnicalLevel}
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
                  <div className="form-group full-width">
                    <label>Level Crossed? (Yes/No) *</label>
                    <select
                      name="levelCrossed"
                      value={String(formData.levelCrossed)}
                      onChange={handleChange}
                      required
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                  <div className="form-group full-width">
                    <label>Technical Remarks</label>
                    <textarea
                      name="technicalRemarks"
                      value={formData.technicalRemarks}
                      onChange={handleChange}
                      rows="4"
                      placeholder="Enter technical remarks"
                    />
                  </div>
                </>
              )}
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
        <div className="card student-history-card" style={{ marginTop: "20px" }}>
          <h2>Interview History</h2>
          {interviews.length === 0 ? (
            <p className="record-history-empty">No interview records yet</p>
          ) : (
            <>
              <div className="student-history-toolbar interview-history-toolbar">
                <div className="interview-history-search-wrap">
                  <label className="interview-history-search-label">Search Interviews</label>
                  <input
                    type="text"
                    className="student-history-search interview-history-search"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Search by date, type, attempt, levels, remarks..."
                    aria-label="Search interview history"
                  />
                </div>
                <div className="interview-history-toolbar-meta">
                  <span>{filteredInterviews.length} records</span>
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
              <table className="data-table view-students-table interview-history-table">
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
                  {filteredInterviews.length === 0 ? (
                    <tr>
                      <td colSpan="8">No interview records match your search</td>
                    </tr>
                  ) : (
                    filteredInterviews.map((interview, index) => (
                      <tr key={index}>
                        <td>{new Date(interview.date).toLocaleDateString()}</td>
                        <td>{interview.interviewType}</td>
                        <td>{interview.attemptNumber}</td>
                        <td>{interview.communicationLevel || "-"}</td>
                        <td>{interview.confidenceLevel || "-"}</td>
                        <td>{interview.clarityLevel || interview.clarityOfAnswer || "-"}</td>
                        <td>{interview.overallLevel || (interview.interviewType === "Technical" ? interview.overallTechnicalLevel : interview.overallHRLevel) || "-"}</td>
                        <td>{interview.levelCrossed ? "Crossed" : "Not Crossed"}</td>
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

export default InterviewForm;
