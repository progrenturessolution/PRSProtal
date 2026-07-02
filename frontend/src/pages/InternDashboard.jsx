import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { taskAPI, internAPI, UPLOADS_BASE } from "../services/api";
import TeamTasks from "./TeamTasks";
import logo from "../assets/logo.png";
import "./ActivityManagementNew.css";

function InternDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const notificationStorageKey = "intern-notifications-last-seen";
  const jobPostingsStorageKey = "intern-job-postings-last-seen";
  const scheduledInterviewsStorageKey = "intern-scheduled-interviews-last-seen";
  const scheduledGdsStorageKey = "intern-scheduled-gds-last-seen";
  const scheduledAssignmentsStorageKey = "intern-scheduled-assignments-last-seen";
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(location.state?.activeSection || "profile");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activityOpenIntern, setActivityOpenIntern] = useState(true);
  const [documents, setDocuments] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [scheduledInterviews, setScheduledInterviews] = useState([]);
  const [scheduledGds, setScheduledGds] = useState([]);
  const [scheduledAssignments, setScheduledAssignments] = useState([]);
  const [aptitude, setAptitude] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [interviewSearch, setInterviewSearch] = useState("");
  const [aptitudeSearch, setAptitudeSearch] = useState("");
  const [assessmentSearch, setAssessmentSearch] = useState("");
  const [trainingSearch, setTrainingSearch] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [jobPostings, setJobPostings] = useState([]);
  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [assignedCerts, setAssignedCerts] = useState([]);
  const [taskView, setTaskView] = useState('individual');
  const [activityMenuOpen, setActivityMenuOpen] = useState(true);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [hasUnreadJobPostings, setHasUnreadJobPostings] = useState(false);
  const [hasUnreadScheduledInterviews, setHasUnreadScheduledInterviews] = useState(false);
  const [hasUnreadScheduledGds, setHasUnreadScheduledGds] = useState(false);
  const [hasUnreadScheduledAssignments, setHasUnreadScheduledAssignments] = useState(false);
  const [error, setError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [progressFilter, setProgressFilter] = useState("interviews");
  const [reportDownloading, setReportDownloading] = useState(false);

  const renderInterviews = () => {
    return (
      <>
        <div className="content-header">
          <h1>Interviews</h1>
          <p>Your interview attempt history and HR remarks</p>
        </div>

        <div className="card student-history-card">
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
                    value={interviewSearch}
                    onChange={(e) => setInterviewSearch(e.target.value)}
                    placeholder="Search by date, type, attempt, score, remarks..."
                    aria-label="Search interview history"
                  />
                </div>
                <div className="interview-history-toolbar-meta">
                  <span>{filteredInterviews.length} records</span>
                  {interviewSearch.trim() && (
                    <button
                      type="button"
                      className="interview-history-clear-btn"
                      onClick={() => setInterviewSearch("")}
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
                      <th>Attendance</th>
                      <th>Attempt</th>
                      <th>Score</th>
                      <th>Communication</th>
                      <th>Confidence</th>
                      <th>Clarity</th>
                      <th>Overall</th>
                      <th>Level Crossed</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInterviews.length === 0 ? (
                      <tr>
                        <td colSpan="11">No interview records match your search</td>
                      </tr>
                    ) : (
                      filteredInterviews.map((interview) => (
                        <tr key={interview._id}>
                          <td>{interview.date ? new Date(interview.date).toLocaleDateString() : "-"}</td>
                          <td>{interview.interviewType || "-"}</td>
                          <td>{interview.attendanceStatus || "-"}</td>
                          <td>{interview.attemptNumber || "-"}</td>
                          <td>{getInterviewScore(interview)}</td>
                          <td>{interviewLevelTextMap[interview.communicationLevel] || interview.communicationLevel || "-"}</td>
                          <td>{interviewLevelTextMap[interview.confidenceLevel] || interview.confidenceLevel || "-"}</td>
                          <td>{interviewLevelTextMap[interview.clarityLevel || interview.clarityOfAnswer] || interview.clarityLevel || interview.clarityOfAnswer || "-"}</td>
                          <td>{(() => {
                            const overall = interview.overallLevel || (interview.interviewType === "Technical" ? interview.overallTechnicalLevel : interview.overallHRLevel);
                            return interviewLevelTextMap[overall] || overall || "-";
                          })()}</td>
                          <td>
                            <span className={`status-badge ${interview.levelCrossed ? "status-completed" : "status-rejected"}`}>
                              {interview.levelCrossed ? "Crossed" : "Not Crossed"}
                            </span>
                          </td>
                          <td>{interview.remarks || (interview.interviewType === "Technical" ? interview.technicalRemarks : interview.hrRemarks) || "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </>
    );
  };

  const renderScheduledInterviews = () => {
    return (
      <>
        <div className="content-header">
          <h1>Scheduled Interviews</h1>
          <p>Your upcoming interview schedules</p>
        </div>

        <div className="card student-history-card">
          <h2>Upcoming Interviews</h2>
          {scheduledInterviews.length === 0 ? (
            <p className="record-history-empty">No scheduled interviews yet</p>
          ) : (
            <div className="table-container">
              <table className="data-table view-students-table interview-schedule-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Interview Type</th>
                    <th>Mode</th>
                    <th>Interviewer</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduledInterviews.map((interview, idx) => (
                    <tr key={interview._id || interview.title || idx}>
                      <td>{(interview.date || interview.dateTime || interview.details?.form?.date) ? new Date(interview.date || interview.dateTime || interview.details?.form?.date).toLocaleDateString() : "-"}</td>
                      <td>{interview.startTime || interview.details?.form?.startTime || interview.dateTime?.split(' ')[1] || "-"}</td>
                      <td>{interview.interviewType || interview.type || "-"}</td>
                      <td>{getScheduledInterviewMode(interview)}</td>
                      <td>{interview.trainerId?.name || interview.details?.form?.interviewerName || interview.details?.form?.trainerId || "-"}</td>
                      <td>
                        <span className="status-badge status-pending">
                          {interview.status || "Scheduled"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </>
    );
  };

  const renderScheduledGds = () => {
    return (
      <>
        <div className="content-header">
          <h1>Scheduled GDs</h1>
          <p>Group Discussions you are assigned to</p>
        </div>

        <div className="card student-history-card">
          <h2>Upcoming GDs</h2>
          {scheduledGds.length === 0 ? (
            <p className="record-history-empty">No scheduled GDs yet</p>
          ) : (
            <div className="table-container">
              <table className="data-table view-students-table interview-schedule-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Groups</th>
                    <th>Interviewer</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduledGds.map((gd, idx) => (
                    <tr key={gd._id || gd.title || idx}>
                      <td>{gd.title || gd.details?.form?.title || 'Group Discussion'}</td>
                      <td>{(gd.date || gd.dateTime || gd.details?.form?.date) ? new Date(gd.date || gd.dateTime || gd.details?.form?.date).toLocaleDateString() : '-'}</td>
                      <td>{gd.startTime || gd.details?.form?.startTime || '-'}</td>
                      <td>{getGdGroupLabelForUser(gd)}</td>
                      <td>{getGdInterviewer(gd)}</td>
                      <td><span className="status-badge status-pending">{gd.status || 'Scheduled'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </>
    );
  };

  const renderScheduledAssessments = () => {
    return (
      <>
        <div className="content-header">
          <h1>Schedule Assessment</h1>
          <p>Assignments assigned to you</p>
        </div>

        <div className="card student-history-card" style={{ marginBottom: "16px" }}>
          <h2>Upcoming Assignments — Individual</h2>
          {scheduledAssignments.filter((a) => getScheduledAssessmentMode(a) === "Individual").length === 0 ? (
            <p className="record-history-empty">No individual scheduled assessments yet</p>
          ) : (
            <div className="table-container">
              <table className="data-table view-students-table interview-schedule-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Assigned On</th>
                    <th>Due</th>
                    <th>Assigned By</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduledAssignments.filter((a) => getScheduledAssessmentMode(a) === "Individual").map((a, idx) => (
                    <tr key={a._id || a.title || idx}>
                      <td>{a.title || a.details?.form?.title || 'Assignment'}</td>
                      <td>{(a.dateTime || a.details?.form?.date) ? new Date(a.dateTime || a.details?.form?.date).toLocaleDateString() : '-'}</td>
                      <td>{(a.details?.form?.dueDate) ? new Date(a.details.form.dueDate + ' ' + (a.details.form.dueTime || '00:00')).toLocaleString() : (a.dateTime ? new Date(a.dateTime).toLocaleString() : '-')}</td>
                      <td>{a.createdBy || '-'}</td>
                      <td><span className="status-badge status-pending">{a.status || 'Scheduled'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card student-history-card">
          <h2>Upcoming Assignments — Group</h2>
          {scheduledAssignments.filter((a) => getScheduledAssessmentMode(a) === "Group").length === 0 ? (
            <p className="record-history-empty">No group scheduled assessments yet</p>
          ) : (
            <div className="table-container">
              <table className="data-table view-students-table interview-schedule-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Assigned On</th>
                    <th>Due</th>
                    <th>Assigned By</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduledAssignments.filter((a) => getScheduledAssessmentMode(a) === "Group").map((a, idx) => (
                    <tr key={a._id || a.title || idx}>
                      <td>{a.title || a.details?.form?.title || 'Assignment'}</td>
                      <td>{(a.dateTime || a.details?.form?.date) ? new Date(a.dateTime || a.details?.form?.date).toLocaleDateString() : '-'}</td>
                      <td>{(a.details?.form?.dueDate) ? new Date(a.details.form.dueDate + ' ' + (a.details.form.dueTime || '00:00')).toLocaleString() : (a.dateTime ? new Date(a.dateTime).toLocaleString() : '-')}</td>
                      <td>{a.createdBy || '-'}</td>
                      <td><span className="status-badge status-pending">{a.status || 'Scheduled'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </>
    );
  };

  const renderAptitude = () => {
    return (
      <>
        <div className="content-header">
          <h1>Aptitude</h1>
          <p>Your aptitude scores and remarks</p>
        </div>

        <div className="card student-history-card">
          <h2>Aptitude Test History</h2>
          {aptitude.length === 0 ? (
            <p className="record-history-empty">No aptitude records yet</p>
          ) : (
            <>
              <div className="student-history-toolbar interview-history-toolbar">
                <div className="interview-history-search-wrap">
                  <label className="interview-history-search-label">Search Aptitude</label>
                  <input
                    type="text"
                    className="student-history-search interview-history-search"
                    value={aptitudeSearch}
                    onChange={(e) => setAptitudeSearch(e.target.value)}
                    placeholder="Search by attendance, round, score, result, remarks, date..."
                    aria-label="Search aptitude history"
                  />
                </div>
                <div className="interview-history-toolbar-meta">
                  <span>{filteredAptitudes.length} records</span>
                  {aptitudeSearch.trim() && (
                    <button
                      type="button"
                      className="interview-history-clear-btn"
                      onClick={() => setAptitudeSearch("")}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="table-container">
                <table className="data-table view-students-table aptitude-history-table">
                  <thead>
                    <tr>
                      <th>Attendance</th>
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
                        <td colSpan="6">No aptitude records match your search</td>
                      </tr>
                    ) : (
                      filteredAptitudes.map((apt) => (
                        <tr key={apt._id}>
                          <td>{apt.attendanceStatus || "-"}</td>
                          <td>{apt.roundNumber}</td>
                          <td>{apt.score}</td>
                          <td>
                            <span className={`status-badge ${apt.result === "Pass" ? "status-completed" : "status-pending"}`}>
                              {apt.result}
                            </span>
                          </td>
                          <td>{apt.remarks || "-"}</td>
                          <td>{apt.createdAt ? new Date(apt.createdAt).toLocaleDateString() : "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </>
    );
  };

  const renderAssessments = () => {
    return (
      <>
        <div className="content-header">
          <h1>Assessments</h1>
          <p>Your assessment scores and feedback</p>
        </div>

        <div className="card student-history-card">
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
                    value={assessmentSearch}
                    onChange={(e) => setAssessmentSearch(e.target.value)}
                    placeholder="Search by attendance, type, score, status, feedback, date..."
                    aria-label="Search assessment history"
                  />
                </div>
                <div className="interview-history-toolbar-meta">
                  <span>{filteredAssessments.length} records</span>
                  {assessmentSearch.trim() && (
                    <button
                      type="button"
                      className="interview-history-clear-btn"
                      onClick={() => setAssessmentSearch("")}
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
                      <th>Attendance</th>
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
                        <td colSpan="6">No assessment records match your search</td>
                      </tr>
                    ) : (
                      filteredAssessments.map((assessment) => (
                        <tr key={assessment._id}>
                          <td>{assessment.attendanceStatus || "-"}</td>
                          <td>{assessment.assessmentType || "-"}</td>
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
                              {assessment.status || "-"}
                            </span>
                          </td>
                          <td>{assessment.feedback || "-"}</td>
                          <td>{assessment.createdAt ? new Date(assessment.createdAt).toLocaleDateString() : "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </>
    );
  };

  const renderTraining = () => {
    return (
      <>
        <div className="content-header">
          <h1>Training</h1>
          <p>Your training attendance and engagement scores</p>
        </div>

        <div className="card student-history-card">
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
                    value={trainingSearch}
                    onChange={(e) => setTrainingSearch(e.target.value)}
                    placeholder="Search by date, attendance, score, engagement, remarks..."
                    aria-label="Search training history"
                  />
                </div>
                <div className="interview-history-toolbar-meta">
                  <span>{filteredTrainings.length} records</span>
                  {trainingSearch.trim() && (
                    <button
                      type="button"
                      className="interview-history-clear-btn"
                      onClick={() => setTrainingSearch("")}
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
                      <th>Score</th>
                      <th>Attendance</th>
                      <th>Engagement Level</th>
                      <th>Skill Improvement</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTrainings.length === 0 ? (
                      <tr>
                        <td colSpan="6">No training records match your search</td>
                      </tr>
                    ) : (
                      filteredTrainings.map((training) => (
                        <tr key={training._id}>
                          <td>{training.date ? new Date(training.date).toLocaleDateString() : "-"}</td>
                          <td>{getTrainingScore(training)}</td>
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
                              {training.attendance || "-"}
                            </span>
                          </td>
                          <td>{training.engagementLevel || "-"}</td>
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
      </>
    );
  };
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    studentType: "Internship",
    internId: "",
    name: "",
    email: "",
    mobile: "",
    currentDesignation: "",
    domain: "",
    joiningDate: "",
    endingDate: "",
    duration: "",
    collegeName: "",
    branch: "",
    yearOfStudy: "",
    suggestedDomain: "",
    currentQualification: "",
    instituteName: "",
    instituteLocation: "",
    enrolmentDate: "",
    enrolBatchMonth: "",
    totalFees: "",
    firstPaymentAmount: "",
    firstPaymentDate: "",
    secondPaymentAmount: "",
    secondPaymentDate: "",
    finalPaymentAmount: "",
    finalPaymentDate: "",
    completedFees: "",
    pendingFees: "",
    password: "",
    confirmPassword: "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    const userRole = localStorage.getItem("userRole");

    if (!token || !userData || userRole !== "intern") {
      navigate("/");
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== "intern") {
      navigate("/");
      return;
    }
    setUser(parsedUser);
    setLoading(false); // Show dashboard immediately
    
    // Initialize job postings last viewed time if not set (1 week ago so existing postings show as unread)
    if (!localStorage.getItem(jobPostingsStorageKey)) {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      localStorage.setItem(jobPostingsStorageKey, oneWeekAgo.toISOString());
    }
    
    // Load tasks in the background without blocking the UI
    fetchTasks();
    
    // Refresh profile in background (don't block UI)
    fetchProfileDetails();

    // Refresh notification badge in background
    refreshNotificationBadge(parsedUser);
    
    // Refresh job postings badge in background
    refreshJobPostingsBadge();

    // Refresh activity badges in background
    refreshActivityBadges(parsedUser);
  }, [navigate]);

  // Periodic refresh for job postings and activity badges
  useEffect(() => {
    refreshJobPostingsBadge();
    refreshActivityBadges();
    const interval = setInterval(() => {
      refreshJobPostingsBadge();
      refreshActivityBadges();
    }, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [activeSection, user]);

  const getLatestNotificationTimestamp = (items = []) => {
    return items.reduce((latest, item) => {
      const value = item?.createdAt ? new Date(item.createdAt).getTime() : 0;
      return value > latest ? value : latest;
    }, 0);
  };

  const refreshNotificationBadge = async (currentUser = user) => {
    try {
      const response = await internAPI.getMyNotifications();
      const unreadCount = response.data?.unreadCount || 0;
      setHasUnreadNotifications(unreadCount > 0);

      if (currentUser && activeSection === "notifications") {
        await internAPI.markNotificationsRead();
        setHasUnreadNotifications(false);
      }
    } catch (err) {
      console.error("Failed to refresh notification badge:", err);
    }
  };

  const markNotificationsAsSeen = async () => {
    try {
      await internAPI.markNotificationsRead();
      setHasUnreadNotifications(false);
    } catch (err) {
      console.error("Failed to mark notifications as read:", err);
    }
  };

  const refreshJobPostingsBadge = async () => {
    try {
      const response = await internAPI.getMyJobPostings();
      const postings = response.data?.postings || [];
      const latestTimestamp = getLatestNotificationTimestamp(postings);
      const lastSeenTimestamp = Number(localStorage.getItem(jobPostingsStorageKey) || 0);
      const isUnread = latestTimestamp > lastSeenTimestamp;
      setHasUnreadJobPostings(isUnread);

      if (activeSection === "jobs") {
        localStorage.setItem(jobPostingsStorageKey, String(latestTimestamp || Date.now()));
        setHasUnreadJobPostings(false);
      }
    } catch (err) {
      console.error("Failed to refresh job postings badge:", err);
    }
  };

  const markJobPostingsAsSeen = () => {
    if (jobPostings.length > 0) {
      const latestTimestamp = getLatestNotificationTimestamp(jobPostings);
      localStorage.setItem(jobPostingsStorageKey, String(latestTimestamp || Date.now()));
    } else {
      localStorage.setItem(jobPostingsStorageKey, String(Date.now()));
    }
    setHasUnreadJobPostings(false);
  };

  const getLatestActivityTimestamp = (items = []) => {
    return items.reduce((latest, item) => {
      const createdTime = item?.createdAt ? new Date(item.createdAt).getTime() : 0;
      const updatedTime = item?.updatedAt ? new Date(item.updatedAt).getTime() : 0;
      const dateTimeVal = item?.dateTime ? new Date(item.dateTime).getTime() : 0;
      const dateVal = item?.date ? new Date(item.date).getTime() : 0;
      const maxTime = Math.max(createdTime, updatedTime, dateTimeVal, dateVal);
      return maxTime > latest ? maxTime : latest;
    }, 0);
  };

  const refreshActivityBadges = async (currentUser = user) => {
    if (!currentUser) return;
    try {
      // 1. Scheduled Interviews
      const intResp = await internAPI.getMyScheduledInterviews();
      if (intResp.data && intResp.data.success) {
        const interviewsList = intResp.data.interviews || [];
        const latestTimestamp = getLatestActivityTimestamp(interviewsList);
        const lastSeenTimestamp = Number(localStorage.getItem(scheduledInterviewsStorageKey) || 0);
        setHasUnreadScheduledInterviews(latestTimestamp > lastSeenTimestamp);
        if (activeSection === "scheduled-interviews") {
          localStorage.setItem(scheduledInterviewsStorageKey, String(latestTimestamp || Date.now()));
          setHasUnreadScheduledInterviews(false);
        }
      }

      // 2. Scheduled GDs
      const gdResp = await internAPI.getMyScheduledGDs();
      if (gdResp.data && gdResp.data.success) {
        const gdList = gdResp.data.activities || [];
        const latestTimestamp = getLatestActivityTimestamp(gdList);
        const lastSeenTimestamp = Number(localStorage.getItem(scheduledGdsStorageKey) || 0);
        setHasUnreadScheduledGds(latestTimestamp > lastSeenTimestamp);
        if (activeSection === "scheduled-gds") {
          localStorage.setItem(scheduledGdsStorageKey, String(latestTimestamp || Date.now()));
          setHasUnreadScheduledGds(false);
        }
      }

      // 3. Scheduled Assessments
      try {
        const [notifResp] = await Promise.allSettled([internAPI.getMyNotifications()]);
        const notificationItems = [];
        if (notifResp.status === 'fulfilled' && notifResp.value?.data?.success) {
          const notes = notifResp.value.data.notifications || [];
          notes
            .filter((note) => note.notificationType === 'Test/Assessment')
            .forEach((note) => {
              notificationItems.push({
                _id: note._id,
                type: 'Assessment',
                title: note.title,
                dateTime: note.createdAt,
                createdAt: note.createdAt,
                createdBy: note.createdBy?.email || note.createdBy?.name || 'Admin',
                status: 'Scheduled',
                details: { notification: note },
              });
            });
        }
        let localItems = [];
        try {
          const rawActs = JSON.parse(localStorage.getItem('recentActivities') || '[]');
          const myIdCandidates = [currentUser?._id, currentUser?.id, currentUser?.internId, currentUser?.psmsId].map(String).filter(Boolean);
          localItems = (rawActs || []).filter((act) =>
            act.type === 'Assignment' &&
            Array.isArray(act.details?.assigned) &&
            act.details.assigned.some((a) => myIdCandidates.includes(String(a)))
          );
        } catch (e) {
          localItems = [];
        }
        const seen = new Set();
        const merged = [...notificationItems, ...localItems].filter((item) => {
          const key = item._id ? `n:${item._id}` : `${item.title || ''}_${item.dateTime || ''}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        const latestTimestamp = getLatestActivityTimestamp(merged);
        const lastSeenTimestamp = Number(localStorage.getItem(scheduledAssignmentsStorageKey) || 0);
        setHasUnreadScheduledAssignments(latestTimestamp > lastSeenTimestamp);
        if (activeSection === "scheduled-assignments") {
          localStorage.setItem(scheduledAssignmentsStorageKey, String(latestTimestamp || Date.now()));
          setHasUnreadScheduledAssignments(false);
        }
      } catch (err) {
        console.error("Failed to check assessment badge:", err);
      }
    } catch (err) {
      console.error("Failed to refresh activity badges:", err);
    }
  };

  const fetchProfileDetails = async () => {
    try {
      const response = await internAPI.getMyProfile();
      if (response.data.success && response.data.user) {
        setUser(response.data.user);
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }
    } catch (err) {
      console.error("Failed to fetch profile details:", err);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await taskAPI.getInternTasks();
      setTasks(response.data.tasks);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
      setLoading(false);
    }
  };

  const handleProgressUpdate = async (taskId, newProgress) => {
    try {
      await taskAPI.updateTaskProgress(taskId, newProgress);
      setTasks(
        tasks.map((task) => {
          if (task._id === taskId) {
            let newStatus = task.status;
            if (newProgress === 0) newStatus = "Assigned";
            else if (newProgress > 0 && newProgress < 100)
              newStatus = "In Progress";
            else if (newProgress === 100) newStatus = "Pending Approval";

            return { ...task, progress: newProgress, status: newStatus };
          }
          return task;
        }),
      );
    } catch (err) {
      setError("Failed to update progress");
      console.error(err);
      setTimeout(() => setError(""), 4000);
    }
  };

  const handleEditClick = () => {
    setEditFormData({
      studentType: user?.studentType || "Internship",
      internId: user?.internId || "",
      name: user?.name || "",
      email: user?.email || "",
      mobile: user?.mobile || "",
      currentDesignation: user?.currentDesignation || "",
      domain: user?.domain || "",
      joiningDate: user?.joiningDate ? new Date(user.joiningDate).toISOString().split('T')[0] : "",
      endingDate: user?.endingDate ? new Date(user.endingDate).toISOString().split('T')[0] : "",
      duration: user?.duration || "",
      collegeName: user?.collegeName || "",
      branch: user?.branch || "",
      yearOfStudy: user?.yearOfStudy || "",
      suggestedDomain: user?.suggestedDomain || "",
      currentQualification: user?.currentQualification || "",
      instituteName: user?.instituteName || "",
      instituteLocation: user?.instituteLocation || "",
      enrolmentDate: user?.enrolmentDate ? new Date(user.enrolmentDate).toISOString().split('T')[0] : "",
      enrolBatchMonth: user?.enrolBatchMonth || "",
      totalFees: user?.totalFees || "",
      firstPaymentAmount: user?.firstPaymentAmount || "",
      firstPaymentDate: user?.firstPaymentDate ? new Date(user.firstPaymentDate).toISOString().split('T')[0] : "",
      secondPaymentAmount: user?.secondPaymentAmount || "",
      secondPaymentDate: user?.secondPaymentDate ? new Date(user.secondPaymentDate).toISOString().split('T')[0] : "",
      finalPaymentAmount: user?.finalPaymentAmount || "",
      finalPaymentDate: user?.finalPaymentDate ? new Date(user.finalPaymentDate).toISOString().split('T')[0] : "",
      completedFees: user?.completedFees || "",
      pendingFees: user?.pendingFees || "",
      password: "",
      confirmPassword: "",
    });
    setShowEditModal(true);
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setEditError("");
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editFormData.password || !editFormData.confirmPassword) {
      setEditError("Please enter and confirm your new password");
      return;
    }
    if (editFormData.password !== editFormData.confirmPassword) {
      setEditError("Passwords do not match");
      return;
    }
    try {
      setEditLoading(true);
      setEditError("");
      const payload = { ...editFormData };
      const response = await internAPI.updateMyProfile(payload);
      if (response.data.success) {
        setUser(response.data.user || user);
        localStorage.setItem("user", JSON.stringify(response.data.user || user));
        setShowEditModal(false);
        setProfileSuccess("Profile updated successfully");
        setTimeout(() => setProfileSuccess(""), 4000);
      } else {
        setEditError(response.data.message || "Failed to update profile");
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
      setEditError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setEditLoading(false);
    }
  };

  const fetchAssignedCertificates = async () => {
    try {
      const certResp = await internAPI.getMyAssignedCertificates();
      if (certResp.data && certResp.data.success) {
        setAssignedCerts(certResp.data.certificates || []);
      } else {
        setAssignedCerts([]);
      }
    } catch (err) {
      console.error('Failed to fetch assigned certs:', err);
      setAssignedCerts([]);
    }
  };

  const loadScheduledAssessments = async () => {
    try {
      const [notifResp] = await Promise.allSettled([internAPI.getMyNotifications()]);
      const notificationItems = [];

      if (notifResp.status === 'fulfilled' && notifResp.value?.data?.success) {
        const notes = notifResp.value.data.notifications || [];
        notes
          .filter((note) => note.notificationType === 'Test/Assessment')
          .forEach((note) => {
            notificationItems.push({
              _id: note._id,
              type: 'Assessment',
              title: note.title,
              dateTime: note.createdAt,
              createdBy: note.createdBy?.email || note.createdBy?.name || 'Admin',
              status: 'Scheduled',
              details: { notification: note },
            });
          });
      }

      let localItems = [];
      try {
        const rawActs = JSON.parse(localStorage.getItem('recentActivities') || '[]');
        const myIdCandidates = [user?._id, user?.id, user?.internId, user?.psmsId].map(String).filter(Boolean);
        localItems = (rawActs || []).filter((act) =>
          act.type === 'Assignment' &&
          Array.isArray(act.details?.assigned) &&
          act.details.assigned.some((a) => myIdCandidates.includes(String(a)) || String(a) === String(user?._id) || String(a) === String(user?.internId))
        );
      } catch (e) {
        localItems = [];
      }

      const seen = new Set();
      const merged = [...notificationItems, ...localItems].filter((item) => {
        const key = item._id ? `n:${item._id}` : `${item.title || ''}_${item.dateTime || ''}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setScheduledAssignments(merged);
      return merged;
    } catch (error) {
      console.error('Failed to load scheduled assessments:', error);
      setScheduledAssignments([]);
      return [];
    }
  };

  const downloadCompleteReportPDF = async () => {
    setReportDownloading(true);
    try {
      const recordsResponse = await internAPI.getMyStudentRecords();
      if (!recordsResponse.data.success) {
        alert("Failed to load report data");
        return;
      }
      const reportData = recordsResponse.data.data;
      const studentInfo = reportData.student;
      const allInterviews = reportData.interviews || [];
      const allAptitudes = reportData.aptitudes || [];
      const allAssessments = reportData.assessments || [];
      const allTrainings = reportData.trainings || [];

      let htmlContent = `
        <html>
          <head>
            <title>Student Report - ${studentInfo.name}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #324158; padding-bottom: 15px; }
              .header h1 { margin: 10px 0; color: #324158; }
              .section { margin: 20px 0; }
              .section-title { font-size: 16px; font-weight: bold; color: #324158; margin: 15px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; }
              .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px; }
              .info-item { padding: 10px; background: #f8fafc; border-radius: 4px; }
              .info-label { font-size: 12px; color: #94a3b8; font-weight: bold; text-transform: uppercase; }
              .info-value { font-size: 14px; color: #0f172a; font-weight: 600; margin-top: 5px; }
              table { width: 100%; border-collapse: collapse; margin: 15px 0; }
              th { background-color: #324158; color: white; padding: 10px; text-align: left; border: 1px solid #ddd; }
              td { padding: 8px; border: 1px solid #e2e8f0; }
              tr:nth-child(even) { background-color: #f9fafb; }
              .stat-section { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 15px 0; }
              .stat-box { padding: 15px; background: #f8fafc; border-left: 4px solid #324158; text-align: center; }
              .stat-number { font-size: 24px; font-weight: bold; color: #324158; }
              .stat-label { font-size: 12px; color: #64748b; margin-top: 5px; }
              .footer { margin-top: 40px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px; color: #999; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Student Assessment Report</h1>
              <p>Type: <strong>Complete Performance History</strong></p>
              <p>${new Date().toLocaleDateString('en-IN')}</p>
            </div>

            <div class="section">
              <div class="section-title">Student Information</div>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Name</div>
                  <div class="info-value">${studentInfo.name}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">ID</div>
                  <div class="info-value">${studentInfo.internId || studentInfo.psmsId || "-"}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Email</div>
                  <div class="info-value">${studentInfo.email}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Type</div>
                  <div class="info-value">${studentInfo.studentType}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Status</div>
                  <div class="info-value">${studentInfo.status}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Joining Date</div>
                  <div class="info-value">${studentInfo.joiningDate ? new Date(studentInfo.joiningDate).toLocaleDateString('en-IN') : 'N/A'}</div>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Assessment Summary</div>
              <div class="stat-section">
                <div class="stat-box">
                  <div class="stat-number">${allInterviews.length}</div>
                  <div class="stat-label">Interviews</div>
                </div>
                <div class="stat-box">
                  <div class="stat-number">${allAptitudes.length}</div>
                  <div class="stat-label">Aptitude Tests</div>
                </div>
                <div class="stat-box">
                  <div class="stat-number">${allAssessments.length}</div>
                  <div class="stat-label">Assessments</div>
                </div>
                <div class="stat-box">
                  <div class="stat-number">${allTrainings.length}</div>
                  <div class="stat-label">Trainings</div>
                </div>
              </div>
            </div>
      `;

      if (allInterviews.length > 0) {
        htmlContent += `
          <div class="section">
            <div class="section-title">Interview Records</div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Overall</th>
                  <th>Level Crossed</th>
                </tr>
              </thead>
              <tbody>
                ${allInterviews.map(interview => {
                  const overallLevel = interview.interviewType === "Technical" ? interview.overallTechnicalLevel : interview.overallHRLevel;
                  return `
                  <tr>
                    <td>${interview.date ? new Date(interview.date).toLocaleDateString('en-IN') : 'N/A'}</td>
                    <td>${interview.interviewType}</td>
                    <td>${interviewLevelTextMap[overallLevel] || overallLevel || "-"}</td>
                    <td>${interview.levelCrossed ? 'Yes' : 'No'}</td>
                  </tr>
                `; }).join('')}
              </tbody>
            </table>
          </div>
        `;
      }

      if (allAptitudes.length > 0) {
        htmlContent += `
          <div class="section">
            <div class="section-title">Aptitude Test Records</div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Round</th>
                  <th>Score</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                ${allAptitudes.map(apt => `
                  <tr>
                    <td>${apt.createdAt ? new Date(apt.createdAt).toLocaleDateString('en-IN') : 'N/A'}</td>
                    <td>Round ${apt.roundNumber}</td>
                    <td>${apt.score}</td>
                    <td>${apt.result}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }

      if (allAssessments.length > 0) {
        htmlContent += `
          <div class="section">
            <div class="section-title">Assessment Records</div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${allAssessments.map(assess => `
                  <tr>
                    <td>${assess.createdAt ? new Date(assess.createdAt).toLocaleDateString('en-IN') : 'N/A'}</td>
                    <td>${assess.assessmentType}</td>
                    <td>${assess.score || '-'}</td>
                    <td>${assess.status}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }

      if (allTrainings.length > 0) {
        htmlContent += `
          <div class="section">
            <div class="section-title">Training Records</div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Attendance</th>
                  <th>Engagement</th>
                </tr>
              </thead>
              <tbody>
                ${allTrainings.map(training => `
                  <tr>
                    <td>${training.date ? new Date(training.date).toLocaleDateString('en-IN') : 'N/A'}</td>
                    <td>${training.attendance}</td>
                    <td>${training.engagementLevel}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }

      htmlContent += `
        <div class="footer">
          <p>This report was generated on ${new Date().toLocaleString('en-IN')}</p>
        </div>
          </body>
        </html>
      `;

      const printWindow = window.open("", "", "height=600,width=800");
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      setTimeout(() => {
        printWindow.print();
      }, 500);
    } catch (err) {
      console.error("Error generating PDF report:", err);
      alert("Error generating PDF report");
    } finally {
      setReportDownloading(false);
    }
  };

  const fetchSectionData = async (section) => {
    try {
      switch (section) {
        case "documents":
          try {
            const docResp = await internAPI.getMyDocuments();
            if (docResp.data && docResp.data.success) {
              setDocuments(docResp.data.documents || null);
            } else {
              setDocuments(null);
            }
          } catch (e) {
            console.error('Failed to fetch documents:', e);
            setDocuments(null);
          }
          await fetchAssignedCertificates();
          break;
        case "interviews":
          const intResp = await internAPI.getMyInterviews();
          if (intResp.data && intResp.data.success) {
            setInterviews(intResp.data.interviews || []);
          }
          break;
        case "scheduled-interviews":
          const schedResp = await internAPI.getMyScheduledInterviews();
          if (schedResp.data && schedResp.data.success) {
            const list = schedResp.data.interviews || [];
            setScheduledInterviews(list);
            const latestTimestamp = getLatestActivityTimestamp(list);
            localStorage.setItem(scheduledInterviewsStorageKey, String(latestTimestamp || Date.now()));
            setHasUnreadScheduledInterviews(false);
          }
          await loadScheduledAssessments();
          // Merge any locally-persisted scheduled GDs that include this intern
          try {
            const raw = JSON.parse(localStorage.getItem('scheduledGDs') || '[]');
            const myIdCandidates = [user?._id, user?.id, user?.internId, user?.psmsId].map(String).filter(Boolean);
            const myGds = (raw || []).filter(act => {
              try {
                const groups = act.details?.groups || [];
                for (const g of groups) {
                  const members = Array.isArray(g) ? g : (g.members || []);
                  for (const m of members) {
                    const mid = (m._id || m.id || m.studentId || m.psmsId || m.internId || m).toString();
                    if (myIdCandidates.includes(mid)) return true;
                  }
                }
              } catch (e) {}
              return false;
            });
            setScheduledGds(myGds || []);
          } catch (e) { setScheduledGds([]); }
          break;
        case "scheduled-gds":
          let finalGds = [];
          try {
            const resp = await internAPI.getMyScheduledGDs();
            if (resp.data && resp.data.success) {
              finalGds = resp.data.activities || [];
              setScheduledGds(finalGds);
            } else {
              // fallback to localStorage for older entries
              const raw = JSON.parse(localStorage.getItem('scheduledGDs') || '[]');
              const myIdCandidates = [user?._id, user?.id, user?.internId, user?.psmsId].map(String).filter(Boolean);
              finalGds = (raw || []).filter(act => {
                try {
                  const groups = act.details?.groups || [];
                  for (const g of groups) {
                    const members = Array.isArray(g) ? g : (g.members || []);
                    for (const m of members) {
                      const mid = (m._id || m.id || m.studentId || m.psmsId || m.internId || m).toString();
                      if (myIdCandidates.includes(mid)) return true;
                    }
                  }
                } catch (e) {}
                return false;
              });
              setScheduledGds(finalGds || []);
            }
          } catch (e) {
            // fallback to localStorage for older entries
            try {
              const raw = JSON.parse(localStorage.getItem('scheduledGDs') || '[]');
              const myIdCandidates = [user?._id, user?.id, user?.internId, user?.psmsId].map(String).filter(Boolean);
              finalGds = (raw || []).filter(act => {
                try {
                  const groups = act.details?.groups || [];
                  for (const g of groups) {
                    const members = Array.isArray(g) ? g : (g.members || []);
                    for (const m of members) {
                      const mid = (m._id || m.id || m.studentId || m.psmsId || m.internId || m).toString();
                      if (myIdCandidates.includes(mid)) return true;
                    }
                  }
                } catch (e) {}
                return false;
              });
              setScheduledGds(finalGds || []);
            } catch (e2) { setScheduledGds([]); }
          }
          const latestGdTimestamp = getLatestActivityTimestamp(finalGds);
          localStorage.setItem(scheduledGdsStorageKey, String(latestGdTimestamp || Date.now()));
          setHasUnreadScheduledGds(false);
          await loadScheduledAssessments();
          break;
        case "scheduled-assignments":
          const assessList = await loadScheduledAssessments();
          const latestAssessTimestamp = getLatestActivityTimestamp(assessList);
          localStorage.setItem(scheduledAssignmentsStorageKey, String(latestAssessTimestamp || Date.now()));
          setHasUnreadScheduledAssignments(false);
          break;
        case "aptitude":
          const aptResp = await internAPI.getMyAptitude();
          if (aptResp.data && aptResp.data.success) {
            setAptitude(aptResp.data.aptitude || aptResp.data.aptitudeRecords || []);
          }
          break;
        case "assessments":
          const assResp = await internAPI.getMyAssessments();
          if (assResp.data && assResp.data.success) {
            setAssessments(assResp.data.assessments || []);
          }
          break;
        case "training":
          const trResp = await internAPI.getMyTraining();
          if (trResp.data && trResp.data.success) {
            setTrainings(trResp.data.training || trResp.data.trainings || []);
          }
          break;
        case "notifications":
          const notifResp = await internAPI.getMyNotifications();
          if (notifResp.data && notifResp.data.success) {
            setNotifications(notifResp.data.notifications || []);
            markNotificationsAsSeen();
          }
          break;
        case "groups":
          if (!groupsLoading) {
            setGroupsLoading(true);
            try {
              const grpResp = await internAPI.getMyGroups();
              if (grpResp.data && grpResp.data.success) {
                setGroups(grpResp.data.groups || []);
              }
            } finally {
              setGroupsLoading(false);
            }
          }
          break;
        case "jobs":
          try {
            const jobsResp = await internAPI.getMyJobPostings();
            if (jobsResp.data && jobsResp.data.success) {
              setJobPostings(jobsResp.data.postings || []);
              markJobPostingsAsSeen();
            }
          } catch (e) {
            console.error('Failed to fetch job postings:', e);
            setJobPostings([]);
          }
          break;
        default:
          break;
      }
    } catch (err) {
      console.error(`Failed to load data for ${section}:`, err);
    }
  };

  const handleSectionClick = (section) => {
    if (["scheduled-interviews", "scheduled-gds", "scheduled-assignments"].includes(section)) {
      setActivityMenuOpen(true);
    }
    setActiveSection(section);
    setSidebarOpen(false);
  };

  const handleProgressCardClick = (filter) => {
    setProgressFilter(filter);
  };

  useEffect(() => {
    if (activeSection === "progress-report") {
      fetchSectionData(progressFilter);
    } else {
      fetchSectionData(activeSection);
    }
  }, [activeSection, progressFilter]);


  const levelScoreMap = {
    B: 25,
    I: 50,
    A: 75,
    E: 100,
    F: 25,
    C: 60,
    P: 80,
  };

  const attendanceScoreMap = {
    Present: 100,
    Late: 70,
    Absent: 0,
  };

  const engagementScoreMap = {
    Low: 25,
    Medium: 50,
    High: 75,
    Excellent: 100,
  };

  const getInterviewScore = (interview) => {
    const clarity = interview?.clarityLevel || interview?.clarityOfAnswer;
    const overall = interview?.overallLevel || (interview?.interviewType === "Technical" ? interview?.overallTechnicalLevel : interview?.overallHRLevel);
    const scoreValues = [
      levelScoreMap[interview?.communicationLevel],
      levelScoreMap[interview?.confidenceLevel],
      levelScoreMap[clarity],
      levelScoreMap[overall],
    ].filter((value) => typeof value === "number");

    if (scoreValues.length === 0) {
      return "-";
    }

    const averageScore = Math.round(
      scoreValues.reduce((sum, value) => sum + value, 0) / scoreValues.length,
    );

    return interview?.levelCrossed ? Math.min(100, averageScore + 5) : averageScore;
  };

  const getTrainingScore = (training) => {
    const attendanceScore = attendanceScoreMap[training?.attendance];
    const engagementScore = engagementScoreMap[training?.engagementLevel];
    const scoreValues = [attendanceScore, engagementScore].filter(
      (value) => typeof value === "number",
    );

    if (scoreValues.length === 0) {
      return "-";
    }

    return Math.round(
      scoreValues.reduce((sum, value) => sum + value, 0) / scoreValues.length,
    );
  };

  const interviewLevelTextMap = {
    B: "Beginner",
    I: "Intermediate",
    A: "Advanced",
    E: "Expert",
    F: "Fail",
    C: "Clear",
    P: "Pass",
  };

  const getScheduledInterviewMode = (interview) => {
    const rawMode = interview?.mode || interview?.details?.form?.mode || interview?.details?.mode || (interview?.groupId || interview?.details?.groupId ? "Group" : "Individual");
    return String(rawMode).toLowerCase() === "group" ? "Group" : "Individual";
  };

  const getScheduledAssessmentMode = (assessment) => {
    const rawMode = assessment?.details?.notification?.assessmentMeta?.assessmentMode || assessment?.details?.form?.mode || assessment?.mode || (Array.isArray(assessment?.details?.assigned) && assessment.details.assigned.length > 1 ? "Group" : "Individual");
    return String(rawMode).toLowerCase() === "group" ? "Group" : "Individual";
  };

  const getGdInterviewer = (gd) => {
    try {
      const details = gd.details || {};
      const form = details.form || {};
      // common places where interviewer/trainer name may be stored
      return (
        form.interviewerName ||
        details.interviewerName ||
        details.trainerName ||
        form.trainerName ||
        (details.interviewerId && details.interviewerId.name) ||
        (details.trainerId && details.trainerId.name) ||
        gd.createdByName ||
        gd.createdBy ||
        '-'
      );
    } catch (e) {
      return '-';
    }
  };

  const getGdGroupLabelForUser = (gd) => {
    try {
      const groups = gd.details?.groups || gd.groups || [];
      const myIds = [user?._id, user?.id, user?.internId, user?.psmsId].map(String).filter(Boolean);
      // find group that contains current user
      for (const g of groups) {
        const members = Array.isArray(g) ? g : (g.members || []);
        for (const m of members) {
          const mid = String(m?._id || m?.id || m?.studentId || m?.internId || m || "");
          if (myIds.includes(mid)) {
            return g.groupName || g.groupNumber || g.name || g.title || (`Group ${g.groupNumber || ''}`).trim();
          }
        }
      }
      // fallback: if groups exist return count or joined names
      if (groups.length === 0) return '-';
      const names = groups.map(g => g.groupName || g.groupNumber || g.name || g.title).filter(Boolean);
      return names.length ? names.join(', ') : `${groups.length}`;
    } catch (e) {
      return '-';
    }
  };

  const filteredInterviews = interviews.filter((interview) => {
    const query = interviewSearch.trim().toLowerCase();
    if (!query) return true;

    const fields = [
      interview?.date ? new Date(interview.date).toLocaleDateString() : "",
      interview?.interviewType,
      interview?.attendanceStatus,
      interview?.attemptNumber,
      getInterviewScore(interview),
      interviewLevelTextMap[interview?.communicationLevel],
      interviewLevelTextMap[interview?.confidenceLevel],
      interviewLevelTextMap[interview?.clarityLevel || interview?.clarityOfAnswer],
      interviewLevelTextMap[interview?.overallLevel || (interview?.interviewType === "Technical" ? interview?.overallTechnicalLevel : interview?.overallHRLevel)],
      interview?.levelCrossed ? "crossed" : "not crossed",
      interview?.remarks || (interview?.interviewType === "Technical" ? interview?.technicalRemarks : interview?.hrRemarks),
    ];

    return fields.some((field) => String(field || "").toLowerCase().includes(query));
  });

  const filteredAptitudes = aptitude.filter((apt) => {
    const query = aptitudeSearch.trim().toLowerCase();
    if (!query) return true;

    const fields = [
      apt?.attendanceStatus,
      apt?.roundNumber,
      apt?.score,
      apt?.result,
      apt?.remarks,
      apt?.createdAt ? new Date(apt.createdAt).toLocaleDateString() : "",
    ];

    return fields.some((field) => String(field || "").toLowerCase().includes(query));
  });

  const filteredAssessments = assessments.filter((assessment) => {
    const query = assessmentSearch.trim().toLowerCase();
    if (!query) return true;

    const fields = [
      assessment?.attendanceStatus,
      assessment?.assessmentType,
      assessment?.score,
      assessment?.status,
      assessment?.feedback,
      assessment?.createdAt ? new Date(assessment.createdAt).toLocaleDateString() : "",
    ];

    return fields.some((field) => String(field || "").toLowerCase().includes(query));
  });

  const filteredTrainings = trainings.filter((training) => {
    const query = trainingSearch.trim().toLowerCase();
    if (!query) return true;

    const fields = [
      training?.date ? new Date(training.date).toLocaleDateString() : "",
      training?.attendance,
      training?.engagementLevel,
      training?.skillImprovementNote,
      training?.trainerRemarks,
      getTrainingScore(training),
    ];

    return fields.some((field) => String(field || "").toLowerCase().includes(query));
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Assigned":
        return "#94a3b8";
      case "In Progress":
        return "#3b82f6";
      case "Pending Approval":
        return "#f59e0b";
      case "Completed":
        return "#10b981";
      default:
        return "#64748b";
    }
  };

  const formatDeadline = (deadline) => {
    return new Date(deadline).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const isOverdue = (deadline) => {
    return new Date(deadline) < new Date();
  };

  const getTaskStats = () => {
    const individualTasks = tasks.filter((t) => !t.isTeamTask);
    const teamTasks = tasks.filter((t) => t.isTeamTask);

    return {
      total: tasks.length,
      individual: individualTasks.length,
      team: teamTasks.length,
      assigned: tasks.filter((t) => t.status === "Assigned").length,
      inProgress: tasks.filter((t) => t.status === "In Progress").length,
      pendingApproval: tasks.filter((t) => t.status === "Pending Approval")
        .length,
      completed: tasks.filter((t) => t.status === "Completed").length,
    };
  };

  const getTaskTimeline = (task) => {
    const timeline = [
      ...(task.comments || []).map((entry) => ({
        source: entry.sentBy === "admin" ? "Admin feedback" : "Your note",
        message: entry.message,
        sentAt: entry.sentAt,
      })),
      ...(task.teamMessages || []).map((entry) => ({
        source: entry.senderName || "Update",
        message: entry.message,
        sentAt: entry.sentAt,
      })),
    ]
      .filter((entry) => entry.message)
      .sort((left, right) => new Date(left.sentAt) - new Date(right.sentAt));

    return timeline;
  };

  const getLatestTaskUpdate = (task) => {
    const timeline = getTaskTimeline(task);
    return timeline.length > 0 ? timeline[timeline.length - 1] : null;
  };

  const getRecentTaskUpdates = (task, limit = 2) => {
    return getTaskTimeline(task).slice(-limit);
  };

  const formatTaskUpdateTime = (value) => {
    if (!value) {
      return "Just now";
    }

    return new Date(value).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const hasDisplayValue = (value) => {
    if (value === 0) return true;
    if (value === false) return true;
    if (value === null || value === undefined) return false;
    return String(value).trim() !== "";
  };

  const formatPostingDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString();
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard">
      {/* Mobile Menu Button */}
      <button
        className="mobile-menu-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle Menu"
      >
        <svg
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          width="24"
          height="24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo-container">
            <img src={logo} alt="PRS Portal" className="sidebar-logo" />
          </div>
          <h2>PRS PORTAL</h2>
          <p>Aspirant Portal</p>
        </div>

        <div
          style={{
            padding: "20px",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div style={{ fontSize: "14px", opacity: 0.7, marginBottom: "5px" }}>
            Welcome,
          </div>
          <div style={{ fontSize: "16px", fontWeight: 600 }}>{user.name}</div>
          <div style={{ fontSize: "13px", opacity: 0.7, marginTop: "5px" }}>
            {user.internId}
          </div>
        </div>

        <ul className="sidebar-menu">
          <li
            className={activeSection === "profile" ? "active" : ""}
            onClick={() => handleSectionClick("profile")}
            style={{ cursor: "pointer" }}
          >
            My Profile
          </li>
          {/* Activity Management collapsible section at 2nd position */}
          <li
            className={(["scheduled-interviews", "scheduled-gds", "scheduled-assignments"].includes(activeSection) ? "active" : "")}
            onClick={() => setActivityOpenIntern(!activityOpenIntern)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: "pointer" }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Activity Management</span>
              {(hasUnreadScheduledInterviews || hasUnreadScheduledGds || hasUnreadScheduledAssignments) && (
                <span className="sidebar-notification-dot" aria-hidden="true" style={{ margin: 0 }} />
              )}
            </div>
            <div style={{ opacity: 0.9 }}>{activityOpenIntern ? '▾' : '▸'}</div>
          </li>

          {activityOpenIntern && (
            <>
              <li
                className={activeSection === "scheduled-interviews" ? "active" : ""}
                onClick={() => handleSectionClick("scheduled-interviews")}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: "pointer", paddingLeft: '24px' }}
              >
                <span>Scheduled Interviews</span>
                {hasUnreadScheduledInterviews && <span className="sidebar-notification-dot" aria-hidden="true" style={{ margin: 0 }} />}
              </li>

              <li
                className={activeSection === "scheduled-gds" ? "active" : ""}
                onClick={() => handleSectionClick("scheduled-gds")}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: "pointer", paddingLeft: '24px' }}
              >
                <span>Scheduled GDs</span>
                {hasUnreadScheduledGds && <span className="sidebar-notification-dot" aria-hidden="true" style={{ margin: 0 }} />}
              </li>

              <li
                className={activeSection === "scheduled-assignments" ? "active" : ""}
                onClick={() => handleSectionClick("scheduled-assignments")}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: "pointer", paddingLeft: '24px' }}
              >
                <span>Scheduled Assessments</span>
                {hasUnreadScheduledAssignments && <span className="sidebar-notification-dot" aria-hidden="true" style={{ margin: 0 }} />}
              </li>
            </>
          )}

          <li
            className={activeSection === "tasks" ? "active" : ""}
            onClick={() => handleSectionClick("tasks")}
            style={{ cursor: "pointer" }}
          >
            Tasks/Projects
          </li>
          <li
            className={activeSection === "progress-report" ? "active" : ""}
            onClick={() => handleSectionClick("progress-report")}
            style={{ cursor: "pointer" }}
          >
            Progress Report
          </li>
          <li
            className={activeSection === "documents" ? "active" : ""}
            onClick={() => handleSectionClick("documents")}
            style={{ cursor: "pointer" }}
          >
            Certificates/Documents
          </li>
          <li
            className={activeSection === "groups" ? "active" : ""}
            onClick={() => handleSectionClick("groups")}
            style={{ cursor: "pointer" }}
          >
            Groups
          </li>
          <li
            className={activeSection === "notifications" ? "active" : ""}
            onClick={() => handleSectionClick("notifications")}
            style={{ cursor: "pointer" }}
          >
            Notifications
            {hasUnreadNotifications && <span className="sidebar-notification-dot" aria-hidden="true" />}
          </li>
          <li
            className={activeSection === "jobs" ? "active" : ""}
            onClick={() => handleSectionClick("jobs")}
            style={{ cursor: "pointer" }}
          >
            Job & Internship Updates
            {hasUnreadJobPostings && <span className="sidebar-notification-dot" aria-hidden="true" />}
          </li>
        </ul>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main className="main-content">
        {/* My Profile Section */}
        {activeSection === "profile" && (
          <>
            <div className="premium-page-header">
              <div className="header-left">
                <h1>My Profile</h1>
                <p className="header-subtitle">Manage your personal information</p>
              </div>
              <div className="header-right">
                <button
                  className="premium-btn-secondary"
                  onClick={handleEditClick}
                >
                  Edit Profile
                </button>
              </div>
            </div>

            {profileSuccess && (
              <div className="success-message" style={{ marginBottom: "20px" }}>
                {profileSuccess}
              </div>
            )}

            <div className="profile-summary-card" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div className="profile-top-avatar" style={{ width: 72, height: 72, fontSize: 32 }}>
                  {(user.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{user.name}</div>
                    <div style={{ color: '#64748b', marginTop: 4 }}>
                      {user.internId || ''} • {user.studentType || 'Internship'}
                      <span style={{ marginLeft: 10, fontSize: 12, color: '#475569', fontWeight: 700 }}>
                        {(user.status || 'active').toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="section-card">
              <h3>Personal Details</h3>
              <div className="section-grid">
                <div className="field-col"><label>Full Name</label><div className="field-value">{user.name || '-'}</div></div>
                <div className="field-col"><label>Student ID</label><div className="field-value mono-text">{user.internId || '-'}</div></div>
                <div className="field-col"><label>Student Type</label><div className="field-value">{user.studentType || '-'}</div></div>
                {hasDisplayValue(user.currentDesignation) && <div className="field-col"><label>Current Designation</label><div className="field-value">{user.currentDesignation}</div></div>}
                {hasDisplayValue(user.assignedTrainer) && <div className="field-col"><label>Assigned Trainer</label><div className="field-value">{user.assignedTrainer?.name || user.assignedTrainer}</div></div>}
                {hasDisplayValue(user.addedByRepresentative) && <div className="field-col"><label>Added By (Representative)</label><div className="field-value">{user.addedByRepresentative?.name || user.addedByRepresentative}</div></div>}
                {hasDisplayValue(user.status) && <div className="field-col"><label>Status</label><div className="field-value">{user.status}</div></div>}
              </div>
            </div>

            {(hasDisplayValue(user.email) || hasDisplayValue(user.mobile)) && (
              <div className="section-card">
                <h3>Contact Details</h3>
                <div className="section-grid">
                  {hasDisplayValue(user.email) && <div className="field-col"><label>Email</label><div className="field-value mono-text">{user.email}</div></div>}
                  {hasDisplayValue(user.mobile) && <div className="field-col"><label>Mobile</label><div className="field-value mono-text">{user.mobile}</div></div>}
                </div>
              </div>
            )}

            {user.studentType === 'Internship' && (hasDisplayValue(user.domain) || hasDisplayValue(user.duration) || hasDisplayValue(user.joiningDate) || hasDisplayValue(user.endingDate) || hasDisplayValue(user.stipendType) || hasDisplayValue(user.stipendAmount)) && (
              <div className="section-card">
                <h3>Program Details</h3>
                <div className="section-grid">
                  {hasDisplayValue(user.domain) && <div className="field-col"><label>Domain</label><div className="field-value">{user.domain}</div></div>}
                  {hasDisplayValue(user.duration) && <div className="field-col"><label>Duration</label><div className="field-value">{user.duration}</div></div>}
                  {hasDisplayValue(user.joiningDate) && <div className="field-col"><label>Joining Date</label><div className="field-value">{new Date(user.joiningDate).toLocaleDateString()}</div></div>}
                  {hasDisplayValue(user.endingDate) && <div className="field-col"><label>Ending Date</label><div className="field-value">{new Date(user.endingDate).toLocaleDateString()}</div></div>}
                  {hasDisplayValue(user.stipendType) && <div className="field-col"><label>Stipend Type</label><div className="field-value">{user.stipendType}</div></div>}
                  {hasDisplayValue(user.stipendAmount) && <div className="field-col"><label>Stipend Amount</label><div className="field-value">{`Rs. ${user.stipendAmount}`}</div></div>}
                </div>
              </div>
            )}

            {user.studentType === 'Internship' ? (
              (hasDisplayValue(user.collegeName) || hasDisplayValue(user.branch) || hasDisplayValue(user.yearOfStudy)) && (
                <div className="section-card">
                  <h3>Academic Details</h3>
                  <div className="section-grid">
                    {hasDisplayValue(user.collegeName) && <div className="field-col"><label>College</label><div className="field-value">{user.collegeName}</div></div>}
                    {hasDisplayValue(user.branch) && <div className="field-col"><label>Branch</label><div className="field-value">{user.branch}</div></div>}
                    {hasDisplayValue(user.yearOfStudy) && <div className="field-col"><label>Year of Study</label><div className="field-value">{user.yearOfStudy}</div></div>}
                  </div>
                </div>
              )
            ) : (
              (hasDisplayValue(user.suggestedDomain) || hasDisplayValue(user.currentQualification) || hasDisplayValue(user.instituteName) || hasDisplayValue(user.instituteLocation) || hasDisplayValue(user.enrolmentDate) || hasDisplayValue(user.enrolBatchMonth)) && (
                <div className="section-card">
                  <h3>Academic Details</h3>
                  <div className="section-grid">
                    {hasDisplayValue(user.suggestedDomain) && <div className="field-col"><label>Suggested Domain</label><div className="field-value">{user.suggestedDomain}</div></div>}
                    {hasDisplayValue(user.currentQualification) && <div className="field-col"><label>Current Qualification</label><div className="field-value">{user.currentQualification}</div></div>}
                    {hasDisplayValue(user.instituteName) && <div className="field-col"><label>Institute</label><div className="field-value">{user.instituteName}</div></div>}
                    {hasDisplayValue(user.instituteLocation) && <div className="field-col"><label>Institute Location</label><div className="field-value">{user.instituteLocation}</div></div>}
                    {hasDisplayValue(user.enrolmentDate) && <div className="field-col"><label>Enrolment Date</label><div className="field-value">{new Date(user.enrolmentDate).toLocaleDateString()}</div></div>}
                    {hasDisplayValue(user.enrolBatchMonth) && <div className="field-col"><label>Batch Month</label><div className="field-value">{user.enrolBatchMonth}</div></div>}
                    {hasDisplayValue(user.totalFees) && <div className="field-col"><label>Total Fees</label><div className="field-value">{user.totalFees}</div></div>}
                  </div>
                </div>
              )
            )}

            {(hasDisplayValue(user.totalFees) || hasDisplayValue(user.completedFees) || hasDisplayValue(user.pendingFees) || hasDisplayValue(user.paymentAmount) || hasDisplayValue(user.dateOfPayment) || hasDisplayValue(user.transactionId)) && (
              <div className="section-card">
                <h3>Fees & Payments</h3>
                <div className="section-grid">
                  {hasDisplayValue(user.totalFees) && <div className="field-col"><label>Total Fees</label><div className="field-value">{user.totalFees}</div></div>}
                  {hasDisplayValue(user.completedFees) && <div className="field-col"><label>Completed Fees</label><div className="field-value">{user.completedFees}</div></div>}
                  {hasDisplayValue(user.pendingFees) && <div className="field-col"><label>Pending Fees</label><div className="field-value">{user.pendingFees}</div></div>}
                  {hasDisplayValue(user.paymentAmount) && <div className="field-col"><label>Payment Amount</label><div className="field-value">{user.paymentAmount}</div></div>}
                  {hasDisplayValue(user.dateOfPayment) && <div className="field-col"><label>Payment Date</label><div className="field-value">{new Date(user.dateOfPayment).toLocaleDateString()}</div></div>}
                  {hasDisplayValue(user.transactionId) && <div className="field-col"><label>Transaction ID</label><div className="field-value mono-text">{user.transactionId}</div></div>}
                </div>
              </div>
            )}

            <div className="section-card">
              <h3>Documents</h3>
              <div className="section-grid">
                <div className="field-col" style={{ gridColumn: '1 / -1' }}>
                  {user.documents && Object.keys(user.documents || {}).length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                      {user.documents.offerLetter?.filename && (
                        <div className="doc-item" style={{ padding: 12, border: '1px solid #e6eef5', borderRadius: 8 }}>
                          <div style={{ fontWeight: 700 }}>Offer Letter</div>
                          <div style={{ color: '#475569', fontSize: 13, marginTop: 6 }}>{user.documents.offerLetter.filename}</div>
                          {user.documents.offerLetter.uploadedAt && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>{new Date(user.documents.offerLetter.uploadedAt).toLocaleDateString()}</div>}
                          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                            <a className="btn-secondary" href={`${UPLOADS_BASE}/uploads/students/${user.documents.offerLetter.filename}`} target="_blank" rel="noreferrer">View</a>
                            <a className="btn-primary" href={`${UPLOADS_BASE}/uploads/students/${user.documents.offerLetter.filename}`} download>Download</a>
                          </div>
                        </div>
                      )}

                      {user.documents.welcomeLetter?.filename && (
                        <div className="doc-item" style={{ padding: 12, border: '1px solid #e6eef5', borderRadius: 8 }}>
                          <div style={{ fontWeight: 700 }}>Welcome Letter</div>
                          <div style={{ color: '#475569', fontSize: 13, marginTop: 6 }}>{user.documents.welcomeLetter.filename}</div>
                          {user.documents.welcomeLetter.uploadedAt && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>{new Date(user.documents.welcomeLetter.uploadedAt).toLocaleDateString()}</div>}
                          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                            <a className="btn-secondary" href={`${UPLOADS_BASE}/uploads/students/${user.documents.welcomeLetter.filename}`} target="_blank" rel="noreferrer">View</a>
                            <a className="btn-primary" href={`${UPLOADS_BASE}/uploads/students/${user.documents.welcomeLetter.filename}`} download>Download</a>
                          </div>
                        </div>
                      )}

                      {user.documents.paymentReceipt?.filename && (
                        <div className="doc-item" style={{ padding: 12, border: '1px solid #e6eef5', borderRadius: 8 }}>
                          <div style={{ fontWeight: 700 }}>Payment Receipt</div>
                          <div style={{ color: '#475569', fontSize: 13, marginTop: 6 }}>{user.documents.paymentReceipt.filename}</div>
                          {user.documents.paymentReceipt.uploadedAt && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>{new Date(user.documents.paymentReceipt.uploadedAt).toLocaleDateString()}</div>}
                          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                            <a className="btn-secondary" href={`${UPLOADS_BASE}/uploads/students/${user.documents.paymentReceipt.filename}`} target="_blank" rel="noreferrer">View</a>
                            <a className="btn-primary" href={`${UPLOADS_BASE}/uploads/students/${user.documents.paymentReceipt.filename}`} download>Download</a>
                          </div>
                        </div>
                      )}

                      {user.documents.completionCertificate?.filename && (
                        <div className="doc-item" style={{ padding: 12, border: '1px solid #e6eef5', borderRadius: 8 }}>
                          <div style={{ fontWeight: 700 }}>Completion Certificate</div>
                          <div style={{ color: '#475569', fontSize: 13, marginTop: 6 }}>{user.documents.completionCertificate.filename}</div>
                          {user.documents.completionCertificate.uploadedAt && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>{new Date(user.documents.completionCertificate.uploadedAt).toLocaleDateString()}</div>}
                          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                            <a className="btn-secondary" href={`${UPLOADS_BASE}/uploads/students/${user.documents.completionCertificate.filename}`} target="_blank" rel="noreferrer">View</a>
                            <a className="btn-primary" href={`${UPLOADS_BASE}/uploads/students/${user.documents.completionCertificate.filename}`} download>Download</a>
                          </div>
                        </div>
                      )}

                      {user.documents.experienceLetter?.filename && (
                        <div className="doc-item" style={{ padding: 12, border: '1px solid #e6eef5', borderRadius: 8 }}>
                          <div style={{ fontWeight: 700 }}>Experience Letter</div>
                          <div style={{ color: '#475569', fontSize: 13, marginTop: 6 }}>{user.documents.experienceLetter.filename}</div>
                          {user.documents.experienceLetter.uploadedAt && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>{new Date(user.documents.experienceLetter.uploadedAt).toLocaleDateString()}</div>}
                          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                            <a className="btn-secondary" href={`${UPLOADS_BASE}/uploads/students/${user.documents.experienceLetter.filename}`} target="_blank" rel="noreferrer">View</a>
                            <a className="btn-primary" href={`${UPLOADS_BASE}/uploads/students/${user.documents.experienceLetter.filename}`} download>Download</a>
                          </div>
                        </div>
                      )}

                      {user.documents.otherCertificates && user.documents.otherCertificates.length > 0 && user.documents.otherCertificates.map((c, idx) => (
                        <div key={idx} className="doc-item" style={{ padding: 12, border: '1px solid #e6eef5', borderRadius: 8 }}>
                          <div style={{ fontWeight: 700 }}>{c.name || `Document ${idx + 1}`}</div>
                          <div style={{ color: '#475569', fontSize: 13, marginTop: 6 }}>{c.filename}</div>
                          {c.uploadedAt && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>{new Date(c.uploadedAt).toLocaleDateString()}</div>}
                          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                            <a className="btn-secondary" href={`${UPLOADS_BASE}/uploads/students/${c.filename}`} target="_blank" rel="noreferrer">View</a>
                            <a className="btn-primary" href={`${UPLOADS_BASE}/uploads/students/${c.filename}`} download>Download</a>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="field-value">No documents uploaded</div>
                  )}
                </div>
              </div>
            </div>

            {showEditModal && (
              <div className="modal-overlay" onClick={handleCloseModal}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h2>Edit Profile</h2>
                    <button className="modal-close-btn" onClick={handleCloseModal}>✕</button>
                  </div>

                  <form onSubmit={handleEditSubmit}>
                    {editError && (
                      <div className="error-message" style={{ marginBottom: "15px" }}>
                        {editError}
                      </div>
                    )}

                    <div className="form-group">
                      <label htmlFor="intern-edit-password">New Password *</label>
                      <input
                        id="intern-edit-password"
                        type="password"
                        name="password"
                        value={editFormData.password}
                        onChange={handleEditInputChange}
                        placeholder="Enter your new password"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="intern-edit-confirm-password">Confirm Password *</label>
                      <input
                        id="intern-edit-confirm-password"
                        type="password"
                        name="confirmPassword"
                        value={editFormData.confirmPassword}
                        onChange={handleEditInputChange}
                        placeholder="Confirm your new password"
                        required
                      />
                    </div>

                    <div className="modal-actions">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={handleCloseModal}
                        disabled={editLoading}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn-primary btn-update-password" disabled={editLoading}>
                        {editLoading ? "Updating..." : "Update Password"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}



        {/* My Program Section */}
        {activeSection === "program" && (
          <>
            <div className="content-header">
              <h1>My Program</h1>
              <p>Program enrollment and details</p>
            </div>

            <div className="card">
              {user.studentType === "Internship" ? (
                <>
                  <h3
                    style={{
                      marginBottom: "20px",
                      fontSize: "18px",
                      color: "#0f172a",
                    }}
                  >
                    Internship Details
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(250px, 1fr))",
                      gap: "20px",
                    }}
                  >
                    <div
                      style={{
                        padding: "15px",
                        background: "#ffffff",
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#475569",
                          marginBottom: "5px",
                        }}
                      >
                        Domain
                      </div>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: 600,
                          color: "#0f172a",
                        }}
                      >
                        {user.domain || "Not Specified"}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "15px",
                        background: "#ffffff",
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#475569",
                          marginBottom: "5px",
                        }}
                      >
                        Duration
                      </div>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: 600,
                          color: "#0f172a",
                        }}
                      >
                        {user.duration || "Not Specified"}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "15px",
                        background: "#ffffff",
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#475569",
                          marginBottom: "5px",
                        }}
                      >
                        College Name
                      </div>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: 600,
                          color: "#0f172a",
                        }}
                      >
                        {user.collegeName || "Not Specified"}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "15px",
                        background: "#ffffff",
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#475569",
                          marginBottom: "5px",
                        }}
                      >
                        Branch
                      </div>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: 600,
                          color: "#0f172a",
                        }}
                      >
                        {user.branch || "Not Specified"}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "15px",
                        background: "#ffffff",
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#475569",
                          marginBottom: "5px",
                        }}
                      >
                        Year of Study
                      </div>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: 600,
                          color: "#0f172a",
                        }}
                      >
                        {user.yearOfStudy || "Not Specified"}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "15px",
                        background: "#ffffff",
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#475569",
                          marginBottom: "5px",
                        }}
                      >
                        Start Date
                      </div>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: 600,
                          color: "#0f172a",
                        }}
                      >
                        {user.joiningDate
                          ? new Date(user.joiningDate).toLocaleDateString()
                          : "Not Set"}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "15px",
                        background: "#ffffff",
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#475569",
                          marginBottom: "5px",
                        }}
                      >
                        End Date
                      </div>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: 600,
                          color: "#0f172a",
                        }}
                      >
                        {user.endingDate
                          ? new Date(user.endingDate).toLocaleDateString()
                          : "Not Set"}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div
                    style={{
                      padding: "20px",
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "14px",
                    }}
                  >
                    <h3
                      style={{
                        marginBottom: "20px",
                        fontSize: "18px",
                        color: "#0f172a",
                      }}
                    >
                      SMS Program Details
                    </h3>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(250px, 1fr))",
                        gap: "20px",
                      }}
                    >
                    <div
                      style={{
                        padding: "15px",
                        background: "#ffffff",
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#475569",
                          marginBottom: "5px",
                        }}
                      >
                        Payment Status
                      </div>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: 600,
                          color: "#0f172a",
                        }}
                      >
                        {user.paymentDoneBy || "Not Specified"}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "15px",
                        background: "#ffffff",
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#475569",
                          marginBottom: "5px",
                        }}
                      >
                        Payment Date
                      </div>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: 600,
                          color: "#0f172a",
                        }}
                      >
                        {user.dateOfPayment
                          ? new Date(user.dateOfPayment).toLocaleDateString()
                          : "Not Set"}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "15px",
                        background: "#ffffff",
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#475569",
                          marginBottom: "5px",
                        }}
                      >
                        Transaction ID
                      </div>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: 600,
                          color: "#0f172a",
                        }}
                      >
                        {user.transactionId || "Not Available"}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "15px",
                        background: "#ffffff",
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#475569",
                          marginBottom: "5px",
                        }}
                      >
                        Payment Amount
                      </div>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: 600,
                          color: "#0f172a",
                        }}
                      >
                        {user.paymentAmount || "Not Available"}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "15px",
                        background: "#ffffff",
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#475569",
                          marginBottom: "5px",
                        }}
                      >
                        Completed Fees
                      </div>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: 600,
                          color: "#0f172a",
                        }}
                      >
                        {user.completedFees || "0"}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "15px",
                        background: "#ffffff",
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#475569",
                          marginBottom: "5px",
                        }}
                      >
                        Pending Fees
                      </div>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: 600,
                          color: "#0f172a",
                        }}
                      >
                        {user.pendingFees || "0"}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "15px",
                        background: "#ffffff",
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#475569",
                          marginBottom: "5px",
                        }}
                      >
                        Last Payment Date
                      </div>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: 600,
                          color: "#0f172a",
                        }}
                      >
                        {user.lastPaymentDate
                          ? new Date(user.lastPaymentDate).toLocaleDateString()
                          : "Not Set"}
                      </div>
                    </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* Tasks/Projects Section */}
        {activeSection === "tasks" && (
          <>
            <div className="content-header">
              <h1>Tasks / Projects</h1>
              <p>View and manage your assigned tasks</p>
            </div>

            {error && (
              <div
                style={{
                  padding: "12px",
                  marginBottom: "20px",
                  backgroundColor: "#fee2e2",
                  border: "1px solid #fecaca",
                  borderRadius: "8px",
                  color: "#dc2626",
                  fontSize: "14px",
                }}
              >
                {error}
              </div>
            )}

            <div className="card" style={{ marginBottom: "20px" }}>
              <h3
                style={{
                  marginBottom: "15px",
                  fontSize: "16px",
                  color: "#0f172a",
                }}
              >
                Task Statistics
              </h3>
              <div className="stats-grid">
                <div
                  className="stat-card"
                  style={{ borderLeft: "4px solid #324158" }}
                >
                  <div className="stat-value">{getTaskStats().total}</div>
                  <div className="stat-label">Total Tasks</div>
                </div>
                <div
                  className="stat-card"
                  style={{ borderLeft: "4px solid #324158" }}
                >
                  <div className="stat-value">{getTaskStats().assigned}</div>
                  <div className="stat-label">Assigned</div>
                </div>
                <div
                  className="stat-card"
                  style={{ borderLeft: "4px solid #324158" }}
                >
                  <div className="stat-value">{getTaskStats().inProgress}</div>
                  <div className="stat-label">In Progress</div>
                </div>
                <div
                  className="stat-card"
                  style={{ borderLeft: "4px solid #324158" }}
                >
                  <div className="stat-value">
                    {getTaskStats().pendingApproval}
                  </div>
                  <div className="stat-label">Pending Approval</div>
                </div>
                <div
                  className="stat-card"
                  style={{ borderLeft: "4px solid #324158" }}
                >
                  <div className="stat-value">{getTaskStats().completed}</div>
                  <div className="stat-label">Completed</div>
                </div>
              </div>
            </div>

            {/* Sub-tabs */}
            <div style={{ display: "flex", gap: "4px", marginBottom: "20px", background: "#f1f5f9", padding: "6px", borderRadius: "12px", width: "fit-content" }}>
              {[
                { id: "individual", label: "Individual Tasks", count: tasks.filter(t => !t.isTeamTask).length },
                { id: "squad", label: "Squad Tasks", count: tasks.filter(t => t.isTeamTask).length }
              ].map(({ id, label, count }) => (
                <button
                  key={id}
                  onClick={() => setTaskView(id)}
                  style={{
                    padding: "9px 18px", borderRadius: "8px", border: "none", cursor: "pointer",
                    fontWeight: "700", fontSize: "13px",
                    background: taskView === id ? "white" : "transparent",
                    color: taskView === id ? "#0f172a" : "#64748b",
                    boxShadow: taskView === id ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
                    transition: "all 0.2s", display: "flex", alignItems: "center", gap: "6px"
                  }}
                >
                  {label}
                  <span style={{ padding: "2px 7px", borderRadius: "10px", fontSize: "11px", background: taskView === id ? "#eff6ff" : "#e2e8f0", color: taskView === id ? "#2563eb" : "#64748b" }}>{count}</span>
                </button>
              ))}
            </div>

            {/* Individual Tasks */}
            {taskView === "individual" && (
              loading ? (
                <div className="card"><p>Loading tasks...</p></div>
              ) : tasks.filter((t) => !t.isTeamTask).length === 0 ? (
                <div className="card">
                  <div className="empty-state">
                    <p>No individual tasks assigned yet.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="individual-task-grid">
                    {tasks
                      .filter((t) => !t.isTeamTask)
                      .map((task) => {
                        const latestUpdate = getLatestTaskUpdate(task);
                        const recentUpdates = getRecentTaskUpdates(task, 3);

                        return (
                          <article key={task._id} className="individual-task-card">
                            <header className="individual-task-card-header">
                              <div>
                                <h3 className="individual-task-title">{task.title}</h3>
                                <p className="individual-task-deadline">
                                  Deadline: {formatDeadline(task.deadline)}
                                  {isOverdue(task.deadline) && task.status !== "Completed" && (
                                    <span className="individual-task-overdue">Overdue</span>
                                  )}
                                </p>
                              </div>
                              <span
                                className="individual-task-status"
                                style={{
                                  backgroundColor: `${getStatusColor(task.status)}20`,
                                  color: getStatusColor(task.status),
                                }}
                              >
                                {task.status}
                              </span>
                            </header>

                            <p className="individual-task-description">{task.description}</p>

                            {task.taskDocument?.filename && (
                              <a
                                href={`${UPLOADS_BASE}/uploads/tasks/${task.taskDocument.filename}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="individual-task-doc-link"
                              >
                                View task document (PDF)
                              </a>
                            )}

                            <section className="individual-task-progress-wrap">
                              <div className="individual-task-progress-head">
                                <span>Progress</span>
                                <strong>{task.progress}%</strong>
                              </div>
                              <div className="progress-bar-container" style={{ marginBottom: 0 }}>
                                <div
                                  className="progress-bar-fill"
                                  style={{ width: `${task.progress}%` }}
                                ></div>
                              </div>
                            </section>

                            <section
                              className={`individual-task-updates ${task.hasUnreadFeedback ? "has-unread" : ""}`}
                            >
                              <div className="individual-task-updates-head">
                                <span>{task.hasUnreadFeedback ? "New Feedback" : "Recent Updates"}</span>
                                {latestUpdate && (
                                  <small>{formatTaskUpdateTime(latestUpdate.sentAt)}</small>
                                )}
                              </div>

                              {recentUpdates.length > 0 ? (
                                <div className="individual-task-update-list">
                                  {recentUpdates.map((update, index) => (
                                    <div key={`${task._id}-update-${index}`} className="individual-task-update-item">
                                      <p className="individual-task-update-source">{update.source}</p>
                                      <p className="individual-task-update-message">{update.message}</p>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="individual-task-update-empty">No updates yet.</p>
                              )}
                            </section>

                            {task.status !== "Completed" && (
                              <div className="individual-task-action">
                                <label htmlFor={`progress-${task._id}`}>Update Progress</label>
                                <select
                                  id={`progress-${task._id}`}
                                  value={task.progress}
                                  onChange={(e) =>
                                    handleProgressUpdate(task._id, parseInt(e.target.value))
                                  }
                                  className="progress-select"
                                >
                                  <option value={0}>Not Started</option>
                                  <option value={25}>25%</option>
                                  <option value={50}>50%</option>
                                  <option value={75}>75%</option>
                                  <option value={100}>Submit for Approval</option>
                                </select>
                              </div>
                            )}
                          </article>
                        );
                      })}
                  </div>
                </>
              )
            )}

            {/* Squad Tasks */}
            {taskView === "squad" && (
              <TeamTasks
                user={user}
                tasks={tasks}
                loading={loading}
                error={error}
                onProgressUpdate={handleProgressUpdate}
                onTasksRefresh={async () => {
                  const res = await taskAPI.getInternTasks();
                  if (res.data.success) { setTasks(res.data.tasks); return res.data.tasks; }
                  return null;
                }}
              />
            )}
          </>
        )}



        {/* Certificates/Documents Section */}
        {activeSection === "documents" && (
          <>
            <div className="content-header">
              <h1>Certificates / Documents</h1>
              <p>Your official documents and certificates</p>
            </div>

            <div className="card">
              {(() => {
                const coreLabelMap = {
                  offerLetter: "Offer Letter",
                  welcomeLetter: "Welcome Letter",
                  paymentReceipt: "Payment Receipt",
                  smsProgramEnrollmentLetter: "SMS Program Enrollment Letter",
                  completionLetter: "Completion Letter",
                  completionCertificate: "Completion Certificate",
                  experienceLetter: "Experience Letter",
                };

                const directDocuments = Object.entries(documents || {})
                  .filter(([key, value]) => key !== "otherCertificates" && value?.filename)
                  .map(([key, value]) => ({
                    key,
                    label: coreLabelMap[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()),
                    filename: value.filename,
                  }));

                const otherCertificates = documents?.otherCertificates || [];
                const hasAny = directDocuments.length > 0 || otherCertificates.length > 0;

                if (!hasAny) {
                  return (
                    <div className="empty-state">
                      <p>No documents available yet.</p>
                    </div>
                  );
                }

                return (
                  <div style={{ display: "grid", gap: "16px" }}>
                    {directDocuments.map((doc) => (
                      <div
                        key={doc.key}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "16px",
                          background: "#f9fafb",
                          borderRadius: "10px",
                          border: "1px solid #e5e7eb",
                        }}
                      >
                        <div>
                          <strong style={{ color: "#374151", fontSize: "15px" }}>
                            {doc.label}
                          </strong>
                        </div>
                        <a
                          href={UPLOADS_BASE + "/uploads/students/" + doc.filename}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            padding: "8px 16px",
                            background: "#10b981",
                            color: "white",
                            borderRadius: "6px",
                            textDecoration: "none",
                            fontSize: "13px",
                            fontWeight: "600",
                          }}
                        >
                          View
                        </a>
                      </div>
                    ))}

                    {otherCertificates.length > 0 && otherCertificates.map((cert, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "16px",
                          background: "#f9fafb",
                          borderRadius: "10px",
                          border: "1px solid #e5e7eb",
                        }}
                      >
                        <div>
                          <strong style={{ color: "#374151", fontSize: "15px" }}>
                            {cert.name || cert.filename}
                          </strong>
                        </div>
                        <a
                          href={UPLOADS_BASE + "/uploads/students/" + cert.filename}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            padding: "8px 16px",
                            background: "#10b981",
                            color: "white",
                            borderRadius: "6px",
                            textDecoration: "none",
                            fontSize: "13px",
                            fontWeight: "600",
                          }}
                        >
                          View
                        </a>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Assigned Certificates */}
              {assignedCerts.length > 0 && (
                <div style={{ padding: "16px", background: "#f0fdf4", borderRadius: "10px", border: "2px solid #86efac", marginTop: "20px" }}>
                  <div style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <strong style={{ color: "#15803d", fontSize: "15px" }}>🏆 Assigned Certificates ({assignedCerts.length})</strong>
                    <span style={{ fontSize: "12px", color: "#16a34a", background: "#dcfce7", padding: "2px 8px", borderRadius: "10px" }}>5-day download window</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {assignedCerts.map(cert => {
                      const timeLeft = new Date(cert.expiresAt) - new Date();
                      const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
                      const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                      const expired = timeLeft <= 0;
                      return (
                        <div key={cert._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "white", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                          <div>
                            <div style={{ fontWeight: "600", color: "#0f172a" }}>{cert.name}</div>
                            <div style={{ fontSize: "12px", color: expired ? "#dc2626" : days >= 2 ? "#16a34a" : "#d97706", marginTop: "2px" }}>
                              {expired ? "Expired" : `${days}d ${hours}h remaining`}
                            </div>
                          </div>
                          {!expired && (
                            <a
                              href={`${UPLOADS_BASE}/uploads/certificates/${cert.filename}`}
                              download
                              target="_blank"
                              rel="noreferrer"
                              style={{ padding: "8px 16px", background: "#22c55e", color: "white", borderRadius: "6px", textDecoration: "none", fontWeight: "600", fontSize: "13px" }}
                            >
                              Download
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Notifications Section */}
        {activeSection === "notifications" && (
          <>
            <div className="content-header">
              <h1>Notifications</h1>
              <p>Important announcements and updates</p>
            </div>

            <div className="card">
              {notifications.length === 0 ? (
                <div className="empty-state">
                  <p>No notifications at this time.</p>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "15px",
                  }}
                >
                  {notifications.map((notif) => (
                    <div
                      key={notif._id}
                      style={{
                        padding: "16px",
                        background:
                          notif.notificationType === "General/Announcement"
                            ? "#f9fafb"
                            : "#eff6ff",
                        borderRadius: "10px",
                        border:
                          "1px solid " +
                          (notif.notificationType === "General/Announcement"
                            ? "#e5e7eb"
                            : "#bfdbfe"),
                        borderLeft:
                          "4px solid " +
                          (notif.notificationType === "Interview"
                            ? "#f59e0b"
                            : notif.notificationType === "Test/Assessment"
                              ? "#3b82f6"
                              : notif.notificationType === "Certificate"
                                ? "#10b981"
                                : "#6b7280"),
                      }}
                    >
                      <div style={{ marginBottom: "8px" }}>
                        <h4
                          style={{
                            margin: "0 0 4px 0",
                            color: "#0f172a",
                            fontSize: "15px",
                            fontWeight: 600,
                          }}
                        >
                          {notif.title}
                        </h4>
                        <span style={{ fontSize: "12px", color: "#6b7280" }}>
                          {new Date(notif.createdAt).toLocaleDateString()} at{" "}
                          {new Date(notif.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <p
                        style={{
                          margin: "8px 0",
                          color: "#374151",
                          fontSize: "14px",
                          lineHeight: "1.5",
                        }}
                      >
                        {notif.message}
                      </p>
                      {notif.attachment?.filename && (
                        <a
                          href={
                            UPLOADS_BASE +
                            "/uploads/notifications/" +
                            notif.attachment.filename
                          }
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            fontSize: "13px",
                            color: "#3b82f6",
                            marginTop: "8px",
                            display: "inline-block",
                          }}
                        >
                          Download Attachment
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Groups Section */}
        {activeSection === "groups" && (
          <>
            <div className="content-header">
              <h1>Groups</h1>
              <p>Your group, trainer, and member details</p>
            </div>

            <div className="card">
              {groupsLoading ? (
                <div className="empty-state">
                  <p>Loading group details...</p>
                </div>
              ) : groups.length === 0 ? (
                <div className="empty-state">
                  <p>No group assigned yet.</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="data-table groups-info-table" style={{ minWidth: "1100px" }}>
                    <thead>
                      <tr>
                        <th>Group No</th>
                        <th>Group Name</th>
                        <th>Type</th>
                        <th>Description</th>
                        <th>Trainer(s)</th>
                        <th>Members</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groups.map((group) => (
                        <tr key={group._id}>
                          <td>{group.groupNumber || "-"}</td>
                          <td>
                            <div style={{ fontWeight: 600, color: "#0f172a" }}>
                              {group.groupName || "Unnamed Group"}
                            </div>
                          </td>
                          <td>{group.studentType || "All"}</td>
                          <td>
                            <div style={{ maxWidth: "260px", whiteSpace: "normal", lineHeight: "1.45" }}>
                              {group.groupDescription || "-"}
                            </div>
                          </td>
                          <td>
                            {Array.isArray(group.assignedTrainerDetails) &&
                            group.assignedTrainerDetails.length > 0 ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {group.assignedTrainerDetails.map((trainer) => (
                                  <div key={trainer._id}>
                                    <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "13px" }}>
                                      {trainer.name}
                                    </div>
                                    <div style={{ fontSize: "12px", color: "#475569" }}>
                                      {trainer.email || "No email"}
                                    </div>
                                    <div style={{ fontSize: "12px", color: "#475569" }}>
                                      {trainer.mobile || "No mobile"}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : Array.isArray(group.assignedEmployees) &&
                              group.assignedEmployees.length > 0 ? (
                              <span>{group.assignedEmployees.join(", ")}</span>
                            ) : (
                              <span>-</span>
                            )}
                          </td>
                          <td>
                            {Array.isArray(group.students) && group.students.length > 0 ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                {group.students.map((member) => (
                                  <div key={member._id} style={{ fontSize: "13px" }}>
                                    <span style={{ fontWeight: 600, color: "#0f172a" }}>
                                      {member.name || "Unnamed"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span>-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Job & Internship Updates Section */}
        {activeSection === "jobs" && (
          <>
            <div className="content-header">
              <h1>Job & Internship Updates</h1>
              <p>Available opportunities and updates</p>
            </div>

            <div className="card">
              {jobPostings.length === 0 ? (
                <div className="empty-state">
                  <p>
                    No job or internship opportunities at this time. Check back
                    later!
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                  }}
                >
                  {jobPostings.map((posting) => (
                    <div
                      key={posting._id}
                      style={{
                        padding: "20px",
                        background: "#f9fafb",
                        borderRadius: "10px",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", marginBottom: "16px", flexWrap: "wrap" }}>
                        <div>
                          <h3 style={{ margin: "0 0 8px 0", color: "#0f172a", fontSize: "18px", fontWeight: 700 }}>
                            {posting.title}
                          </h3>
                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            {hasDisplayValue(posting.opportunityType) && (
                              <span style={{ display: "inline-block", padding: "4px 10px", backgroundColor: posting.opportunityType === "Job" ? "#dbeafe" : "#f0fdf4", color: posting.opportunityType === "Job" ? "#0c4a6e" : "#166534", borderRadius: "12px", fontSize: "12px", fontWeight: 600 }}>
                                {posting.opportunityType}
                              </span>
                            )}
                            {hasDisplayValue(posting.status) && (
                              <span style={{ display: "inline-block", padding: "4px 10px", backgroundColor: posting.status === "closed" ? "#fee2e2" : "#dcfce7", color: posting.status === "closed" ? "#991b1b" : "#166534", borderRadius: "12px", fontSize: "12px", fontWeight: 600 }}>
                                {posting.status}
                              </span>
                            )}
                          </div>
                        </div>
                        {hasDisplayValue(posting.applicationLink) && (
                          <a href={posting.applicationLink} target="_blank" rel="noreferrer" style={{ display: "inline-block", padding: "10px 18px", background: "#0f172a", color: "white", borderRadius: "6px", textDecoration: "none", fontWeight: 600, fontSize: "14px", alignSelf: "flex-start" }}>
                            Apply Now →
                          </a>
                        )}
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", marginBottom: "15px" }}>
                        {[
                          { label: "Company", value: posting.company },
                          { label: "Domain", value: posting.domain },
                          { label: "Location", value: posting.location },
                          { label: "Salary / Stipend", value: posting.salary },
                          { label: "Deadline", value: formatPostingDate(posting.deadline) },
                          { label: "Posted By", value: posting.postedBy?.name || posting.postedBy?.email },
                          { label: "Posted On", value: formatPostingDate(posting.createdAt) },
                        ].filter((field) => hasDisplayValue(field.value)).map((field) => (
                          <div key={field.label} style={{ padding: "12px", background: "white", borderRadius: "8px" }}>
                            <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>{field.label}</div>
                            <div style={{ fontSize: "13px", color: "#0f172a", fontWeight: 600, wordBreak: "break-word" }}>{field.value}</div>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px" }}>
                        {[
                          { label: "Eligibility Criteria", value: posting.eligibilityCriteria },
                          { label: "Requirements", value: posting.requirements },
                          { label: "Description", value: posting.description },
                          { label: "Application Instructions", value: posting.applicationInstructions },
                          { label: "Application Link", value: posting.applicationLink, link: true },
                        ].filter((field) => hasDisplayValue(field.value)).map((field) => (
                          <div key={field.label} style={{ padding: "12px", background: "white", borderRadius: "8px" }}>
                            <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "6px", fontWeight: 600 }}>{field.label}</div>
                            <div style={{ fontSize: "13px", color: "#374151", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                              {field.link ? (
                                <a href={field.value} target="_blank" rel="noreferrer" style={{ color: "#2563eb", fontWeight: 600, wordBreak: "break-word" }}>
                                  {field.value}
                                </a>
                              ) : (
                                field.value
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Progress Report Section */}
        {activeSection === "progress-report" && (
          <div className="am-page" style={{ padding: 0 }}>
            <div className="premium-page-header" style={{ marginBottom: "24px" }}>
              <div className="header-left">
                <h1 style={{ color: "#0f172a", fontSize: "24px", fontWeight: 700, margin: "0 0 6px 0" }}>Progress Report</h1>
                <p className="header-subtitle" style={{ margin: 0 }}>Track your learning journey, task completion, and performance metrics</p>
              </div>
              <div className="header-right" style={{ display: "flex", gap: "10px" }}>
                <button className="premium-btn-secondary" onClick={() => navigate("/intern/reports", { state: { activeSection: "progress-report" } })}>
                  Reports
                </button>
                <button className="premium-btn-secondary" onClick={downloadCompleteReportPDF} disabled={reportDownloading}>
                  {reportDownloading ? "Generating..." : "Download Report"}
                </button>
              </div>
            </div>

            <div className="am-actions" style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "30px" }}>
              <button className={`am-card ${progressFilter === "interviews" ? "active" : ""}`} onClick={() => handleProgressCardClick("interviews")}>
                <div className="am-card-title">Interviews</div>
              </button>
              <button className={`am-card ${progressFilter === "aptitude" ? "active" : ""}`} onClick={() => handleProgressCardClick("aptitude")}>
                <div className="am-card-title">Aptitude</div>
              </button>
              <button className={`am-card ${progressFilter === "assessments" ? "active" : ""}`} onClick={() => handleProgressCardClick("assessments")}>
                <div className="am-card-title">Assessments</div>
              </button>
              <button className={`am-card ${progressFilter === "training" ? "active" : ""}`} onClick={() => handleProgressCardClick("training")}>
                <div className="am-card-title">Training</div>
              </button>
            </div>

            <div className="am-content">
              {progressFilter === "interviews" && renderInterviews()}
              {progressFilter === "aptitude" && renderAptitude()}
              {progressFilter === "assessments" && renderAssessments()}
              {progressFilter === "training" && renderTraining()}
            </div>
          </div>
        )}

        {/* Activity Management Section Direct Rendering */}
        {activeSection === "scheduled-interviews" && renderScheduledInterviews()}
        {activeSection === "scheduled-gds" && renderScheduledGds()}
        {activeSection === "scheduled-assignments" && renderScheduledAssessments()}

      </main>

    </div>
  );
}

export default InternDashboard;
