import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { taskAPI, internAPI, UPLOADS_BASE } from "../services/api";
import TeamTasks from "./TeamTasks";
import logo from "../assets/logo.png";

function InternDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("profile");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [documents, setDocuments] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [aptitude, setAptitude] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [jobPostings, setJobPostings] = useState([]);
  const [assignedCerts, setAssignedCerts] = useState([]);
  const [taskView, setTaskView] = useState('individual');
  const [error, setError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
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
    
    // Load tasks in the background without blocking the UI
    fetchTasks();
    
    // Refresh profile in background (don't block UI)
    fetchProfileDetails();
  }, [navigate]);

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

  const handleSectionClick = async (section) => {
    setActiveSection(section);
    setSidebarOpen(false);

    // Fetch data when clicking on sections
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
        case "assessments":
          const aptResp = await internAPI.getMyAptitude();
          const assResp = await internAPI.getMyAssessments();
          if (aptResp.data && aptResp.data.success) {
            setAptitude(aptResp.data.aptitudeRecords || []);
          }
          if (assResp.data && assResp.data.success) {
            setAssessments(assResp.data.assessments || []);
          }
          break;
        case "notifications":
          const notifResp = await internAPI.getMyNotifications();
          if (notifResp.data && notifResp.data.success) {
            setNotifications(notifResp.data.notifications || []);
          }
          break;
        case "jobs":
          const jobsResp = await internAPI.getMyJobPostings();
          if (jobsResp.data && jobsResp.data.success) {
            setJobPostings(jobsResp.data.postings || []);
          }
          break;
      }
    } catch (err) {
      console.error(`Failed to fetch ${section}:`, err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
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
      joiningDate: user?.joiningDate ? new Date(user.joiningDate).toISOString().split("T")[0] : "",
      endingDate: user?.endingDate ? new Date(user.endingDate).toISOString().split("T")[0] : "",
      duration: user?.duration || "",
      collegeName: user?.collegeName || "",
      branch: user?.branch || "",
      yearOfStudy: user?.yearOfStudy || "",
      suggestedDomain: user?.suggestedDomain || "",
      currentQualification: user?.currentQualification || "",
      instituteName: user?.instituteName || "",
      instituteLocation: user?.instituteLocation || "",
      enrolmentDate: user?.enrolmentDate ? new Date(user.enrolmentDate).toISOString().split("T")[0] : "",
      enrolBatchMonth: user?.enrolBatchMonth || "",
      totalFees: user?.totalFees || "",
      firstPaymentAmount: user?.firstPaymentAmount || "",
      firstPaymentDate: user?.firstPaymentDate ? new Date(user.firstPaymentDate).toISOString().split("T")[0] : "",
      secondPaymentAmount: user?.secondPaymentAmount || "",
      secondPaymentDate: user?.secondPaymentDate ? new Date(user.secondPaymentDate).toISOString().split("T")[0] : "",
      finalPaymentAmount: user?.finalPaymentAmount || "",
      finalPaymentDate: user?.finalPaymentDate ? new Date(user.finalPaymentDate).toISOString().split("T")[0] : "",
      completedFees: user?.completedFees || "",
      pendingFees: user?.pendingFees || "",
      password: "",
      confirmPassword: "",
    });
    setEditError("");
    setShowEditModal(true);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setEditError("");
    setEditFormData({
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
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError("");
    setEditLoading(true);

    if (!editFormData.name.trim()) {
      setEditError("Name is required");
      setEditLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!editFormData.email.trim() || !emailRegex.test(editFormData.email)) {
      setEditError("Please enter a valid email address");
      setEditLoading(false);
      return;
    }

    if (
      editFormData.password &&
      editFormData.password !== editFormData.confirmPassword
    ) {
      setEditError("Passwords do not match");
      setEditLoading(false);
      return;
    }

    try {
      const payload = {
        studentType: editFormData.studentType,
        internId: editFormData.internId,
        name: editFormData.name,
        email: editFormData.email,
        mobile: editFormData.mobile,
        currentDesignation: editFormData.currentDesignation,
        domain: editFormData.domain,
        joiningDate: editFormData.joiningDate,
        endingDate: editFormData.endingDate,
        duration: editFormData.duration,
        collegeName: editFormData.collegeName,
        branch: editFormData.branch,
        yearOfStudy: editFormData.yearOfStudy,
        suggestedDomain: editFormData.suggestedDomain,
        currentQualification: editFormData.currentQualification,
        instituteName: editFormData.instituteName,
        instituteLocation: editFormData.instituteLocation,
        enrolmentDate: editFormData.enrolmentDate,
        enrolBatchMonth: editFormData.enrolBatchMonth,
        totalFees: editFormData.totalFees,
        firstPaymentAmount: editFormData.firstPaymentAmount,
        firstPaymentDate: editFormData.firstPaymentDate,
        secondPaymentAmount: editFormData.secondPaymentAmount,
        secondPaymentDate: editFormData.secondPaymentDate,
        finalPaymentAmount: editFormData.finalPaymentAmount,
        finalPaymentDate: editFormData.finalPaymentDate,
        completedFees: editFormData.completedFees,
        pendingFees: editFormData.pendingFees,
      };

      if (editFormData.password) {
        payload.password = editFormData.password;
      }

      const response = await internAPI.updateMyProfile(payload);
      if (response.data.success) {
        const updatedUser = response.data.user;
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setProfileSuccess("Profile updated successfully!");
        setTimeout(() => setProfileSuccess(""), 4000);
        setShowEditModal(false);
      }
    } catch (err) {
      setEditError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setEditLoading(false);
    }
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
          <p>Intern Portal</p>
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
          <li
            className={activeSection === "program" ? "active" : ""}
            onClick={() => handleSectionClick("program")}
            style={{ cursor: "pointer" }}
          >
            My Program
          </li>
          <li
            className={activeSection === "tasks" ? "active" : ""}
            onClick={() => handleSectionClick("tasks")}
            style={{ cursor: "pointer" }}
          >
            Tasks/Projects
          </li>
          <li
            className={activeSection === "interviews" ? "active" : ""}
            onClick={() => handleSectionClick("interviews")}
            style={{ cursor: "pointer" }}
          >
            Interviews
          </li>
          <li
            className={activeSection === "assessments" ? "active" : ""}
            onClick={() => handleSectionClick("assessments")}
            style={{ cursor: "pointer" }}
          >
            Aptitude & Assessments
          </li>
          <li
            className={activeSection === "documents" ? "active" : ""}
            onClick={() => handleSectionClick("documents")}
            style={{ cursor: "pointer" }}
          >
            Certificates/Documents
          </li>
          <li
            className={activeSection === "notifications" ? "active" : ""}
            onClick={() => handleSectionClick("notifications")}
            style={{ cursor: "pointer" }}
          >
            Notifications
          </li>
          <li
            className={activeSection === "jobs" ? "active" : ""}
            onClick={() => handleSectionClick("jobs")}
            style={{ cursor: "pointer" }}
          >
            Job & Internship Updates
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

            <div className="premium-card">
              <div className="premium-card-header">
                <h2>Personal Information</h2>
              </div>

              <div className="profile-info-grid">
                <div className="profile-field">
                  <label>Full Name</label>
                  <div className="field-value">{user.name}</div>
                </div>
                <div className="profile-field">
                  <label>Email Address</label>
                  <div className="field-value mono-text">{user.email}</div>
                </div>
                <div className="profile-field">
                  <label>Mobile Number</label>
                  <div className="field-value mono-text">{user.mobile || "Not available"}</div>
                </div>
                <div className="profile-field">
                  <label>Student ID</label>
                  <div className="field-value mono-text">{user.internId || "Not available"}</div>
                </div>
                <div className="profile-field">
                  <label>Student Type</label>
                  <div className="field-value">
                    <span className="badge-neutral">{user.studentType || "Internship"}</span>
                  </div>
                </div>
                <div className="profile-field">
                  <label>Current Designation</label>
                  <div className="field-value">{user.currentDesignation || "Not Set"}</div>
                </div>
                <div className="profile-field">
                  <label>Status</label>
                  <div className="field-value">
                    <span className="badge-neutral">{user.status || "active"}</span>
                  </div>
                </div>
                <div className="profile-field">
                  <label>Joined On</label>
                  <div className="field-value">{user.joiningDate ? new Date(user.joiningDate).toLocaleDateString() : "Not set"}</div>
                </div>
                <div className="profile-field">
                  <label>Ending Date</label>
                  <div className="field-value">{user.endingDate ? new Date(user.endingDate).toLocaleDateString() : "Not set"}</div>
                </div>
                <div className="profile-field">
                  <label>Duration</label>
                  <div className="field-value">{user.duration || "Not set"}</div>
                </div>

                {user.studentType === "Internship" ? (
                  <>
                    <div className="profile-field">
                      <label>Domain</label>
                      <div className="field-value">{user.domain || "Not set"}</div>
                    </div>
                    <div className="profile-field">
                      <label>College Name</label>
                      <div className="field-value">{user.collegeName || "Not set"}</div>
                    </div>
                    <div className="profile-field">
                      <label>Branch</label>
                      <div className="field-value">{user.branch || "Not set"}</div>
                    </div>
                    <div className="profile-field">
                      <label>Year of Study</label>
                      <div className="field-value">{user.yearOfStudy || "Not set"}</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="profile-field">
                      <label>Suggested Domain</label>
                      <div className="field-value">{user.suggestedDomain || "Not set"}</div>
                    </div>
                    <div className="profile-field">
                      <label>Current Qualification</label>
                      <div className="field-value">{user.currentQualification || "Not set"}</div>
                    </div>
                    <div className="profile-field">
                      <label>Institute Name</label>
                      <div className="field-value">{user.instituteName || "Not set"}</div>
                    </div>
                    <div className="profile-field">
                      <label>Institute Location</label>
                      <div className="field-value">{user.instituteLocation || "Not set"}</div>
                    </div>
                    <div className="profile-field">
                      <label>Enrolment Date</label>
                      <div className="field-value">{user.enrolmentDate ? new Date(user.enrolmentDate).toLocaleDateString() : "Not set"}</div>
                    </div>
                    <div className="profile-field">
                      <label>Batch Month</label>
                      <div className="field-value">{user.enrolBatchMonth || "Not set"}</div>
                    </div>
                    <div className="profile-field">
                      <label>Total Fees</label>
                      <div className="field-value">{user.totalFees || "0"}</div>
                    </div>
                    <div className="profile-field">
                      <label>Completed Fees</label>
                      <div className="field-value">{user.completedFees || "0"}</div>
                    </div>
                    <div className="profile-field">
                      <label>Pending Fees</label>
                      <div className="field-value">{user.pendingFees || "0"}</div>
                    </div>
                  </>
                )}
              </div>

              <div className="info-banner">
                <strong>Update Your Information</strong>
                <p>
                  Click the "Edit Profile" button above to update your name,
                  email, mobile number, or password.
                </p>
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
                      <label htmlFor="intern-edit-studentType">Student Type</label>
                      <select
                        id="intern-edit-studentType"
                        name="studentType"
                        value={editFormData.studentType}
                        onChange={handleEditInputChange}
                      >
                        <option value="Internship">Internship</option>
                        <option value="SMS Program">SMS Program</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="intern-edit-internId">{editFormData.studentType === "SMS Program" ? "PSMS ID" : "PIID"}</label>
                      <input
                        id="intern-edit-internId"
                        type="text"
                        name="internId"
                        value={editFormData.internId}
                        onChange={handleEditInputChange}
                        placeholder="Enter student ID"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="intern-edit-name">Full Name *</label>
                      <input
                        id="intern-edit-name"
                        type="text"
                        name="name"
                        value={editFormData.name}
                        onChange={handleEditInputChange}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="intern-edit-email">Email Address *</label>
                      <input
                        id="intern-edit-email"
                        type="email"
                        name="email"
                        value={editFormData.email}
                        onChange={handleEditInputChange}
                        placeholder="Enter your email address"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="intern-edit-mobile">Mobile Number</label>
                      <input
                        id="intern-edit-mobile"
                        type="tel"
                        name="mobile"
                        value={editFormData.mobile}
                        onChange={handleEditInputChange}
                        placeholder="Enter your mobile number"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="intern-edit-designation">Current Designation</label>
                      <input
                        id="intern-edit-designation"
                        type="text"
                        name="currentDesignation"
                        value={editFormData.currentDesignation}
                        onChange={handleEditInputChange}
                        placeholder="Current designation"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="intern-edit-joiningDate">Joining Date</label>
                      <input
                        id="intern-edit-joiningDate"
                        type="date"
                        name="joiningDate"
                        value={editFormData.joiningDate}
                        onChange={handleEditInputChange}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="intern-edit-endingDate">Ending Date</label>
                      <input
                        id="intern-edit-endingDate"
                        type="date"
                        name="endingDate"
                        value={editFormData.endingDate}
                        onChange={handleEditInputChange}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="intern-edit-duration">Duration</label>
                      <input
                        id="intern-edit-duration"
                        type="text"
                        name="duration"
                        value={editFormData.duration}
                        onChange={handleEditInputChange}
                        placeholder="e.g. 3 months"
                      />
                    </div>

                    {editFormData.studentType === "Internship" ? (
                      <>
                        <div className="form-group">
                          <label htmlFor="intern-edit-domain">Domain</label>
                          <input
                            id="intern-edit-domain"
                            type="text"
                            name="domain"
                            value={editFormData.domain}
                            onChange={handleEditInputChange}
                            placeholder="Enter domain"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="intern-edit-collegeName">College Name</label>
                          <input
                            id="intern-edit-collegeName"
                            type="text"
                            name="collegeName"
                            value={editFormData.collegeName}
                            onChange={handleEditInputChange}
                            placeholder="Enter college name"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="intern-edit-branch">Branch</label>
                          <input
                            id="intern-edit-branch"
                            type="text"
                            name="branch"
                            value={editFormData.branch}
                            onChange={handleEditInputChange}
                            placeholder="Enter branch"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="intern-edit-yearOfStudy">Year of Study</label>
                          <input
                            id="intern-edit-yearOfStudy"
                            type="text"
                            name="yearOfStudy"
                            value={editFormData.yearOfStudy}
                            onChange={handleEditInputChange}
                            placeholder="e.g. 2nd Year"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="form-group">
                          <label htmlFor="intern-edit-suggestedDomain">Suggested Domain</label>
                          <input
                            id="intern-edit-suggestedDomain"
                            type="text"
                            name="suggestedDomain"
                            value={editFormData.suggestedDomain}
                            onChange={handleEditInputChange}
                            placeholder="Suggested domain"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="intern-edit-currentQualification">Current Qualification</label>
                          <input
                            id="intern-edit-currentQualification"
                            type="text"
                            name="currentQualification"
                            value={editFormData.currentQualification}
                            onChange={handleEditInputChange}
                            placeholder="Current qualification"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="intern-edit-instituteName">Institute Name</label>
                          <input
                            id="intern-edit-instituteName"
                            type="text"
                            name="instituteName"
                            value={editFormData.instituteName}
                            onChange={handleEditInputChange}
                            placeholder="Institute name"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlF
                          or="intern-edit-instituteLocation">Institute Location</label>
                          <input
                            id="intern-edit-instituteLocation"
                            type="text"
                            name="instituteLocation"
                            value={editFormData.instituteLocation}
                            onChange={handleEditInputChange}
                            placeholder="Institute location"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="intern-edit-enrolmentDate">Enrolment Date</label>
                          <input
                            id="intern-edit-enrolmentDate"
                            type="date"
                            name="enrolmentDate"
                            value={editFormData.enrolmentDate}
                            onChange={handleEditInputChange}
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="intern-edit-enrolBatchMonth">Batch Month</label>
                          <input
                            id="intern-edit-enrolBatchMonth"
                            type="month"
                            name="enrolBatchMonth"
                            value={editFormData.enrolBatchMonth}
                            onChange={handleEditInputChange}
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="intern-edit-totalFees">Total Fees</label>
                          <input
                            id="intern-edit-totalFees"
                            type="number"
                            name="totalFees"
                            value={editFormData.totalFees}
                            onChange={handleEditInputChange}
                            placeholder="Total fees"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="intern-edit-completedFees">Completed Fees</label>
                          <input
                            id="intern-edit-completedFees"
                            type="number"
                            name="completedFees"
                            value={editFormData.completedFees}
                            onChange={handleEditInputChange}
                            placeholder="Completed fees"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="intern-edit-pendingFees">Pending Fees</label>
                          <input
                            id="intern-edit-pendingFees"
                            type="number"
                            name="pendingFees"
                            value={editFormData.pendingFees}
                            onChange={handleEditInputChange}
                            placeholder="Pending fees"
                          />
                        </div>
                      </>
                    )}

                    <div className="form-group">
                      <label htmlFor="intern-edit-password">New Password (Optional)</label>
                      <input
                        id="intern-edit-password"
                        type="password"
                        name="password"
                        value={editFormData.password}
                        onChange={handleEditInputChange}
                        placeholder="Leave blank to keep current password"
                      />
                    </div>

                    {editFormData.password && (
                      <div className="form-group">
                        <label htmlFor="intern-edit-confirm-password">Confirm Password *</label>
                        <input
                          id="intern-edit-confirm-password"
                          type="password"
                          name="confirmPassword"
                          value={editFormData.confirmPassword}
                          onChange={handleEditInputChange}
                          placeholder="Confirm your new password"
                          required={!!editFormData.password}
                        />
                      </div>
                    )}

                    <div className="modal-actions">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={handleCloseModal}
                        disabled={editLoading}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn-primary" disabled={editLoading}>
                        {editLoading ? "Updating..." : "Update Profile"}
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
                        background: "#f0fdf4",
                        borderRadius: "10px",
                        border: "1px solid #b7e4c7",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#166534",
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
                        background: "#f0fdf4",
                        borderRadius: "10px",
                        border: "1px solid #b7e4c7",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#166534",
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
                        background: "#f0fdf4",
                        borderRadius: "10px",
                        border: "1px solid #b7e4c7",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#166534",
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
                        background: "#f0fdf4",
                        borderRadius: "10px",
                        border: "1px solid #b7e4c7",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#166534",
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
                        background: "#f0fdf4",
                        borderRadius: "10px",
                        border: "1px solid #b7e4c7",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#166534",
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
                        background: "#f0fdf4",
                        borderRadius: "10px",
                        border: "1px solid #b7e4c7",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#166534",
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
                        background: "#f0fdf4",
                        borderRadius: "10px",
                        border: "1px solid #b7e4c7",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#166534",
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

        {/* Interviews Section */}
        {activeSection === "interviews" && (
          <>
            <div className="content-header">
              <h1>Interviews</h1>
              <p>Your interview attempt history and HR remarks</p>
            </div>

            <div className="card">
              {interviews.length === 0 ? (
                <div className="empty-state">
                  <p>No interview records yet.</p>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                  }}
                >
                  {interviews.map((interview, idx) => (
                    <div
                      key={interview._id}
                      style={{
                        padding: "20px",
                        background: "#f9fafb",
                        borderRadius: "10px",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "start",
                          marginBottom: "15px",
                        }}
                      >
                        <div>
                          <h3
                            style={{
                              margin: "0 0 5px 0",
                              color: "#0f172a",
                              fontSize: "16px",
                            }}
                          >
                            Attempt #{interview.attemptNumber} -{" "}
                            {interview.interviewType} Interview
                          </h3>
                          <span style={{ fontSize: "12px", color: "#6b7280" }}>
                            {new Date(interview.date).toLocaleDateString()}
                          </span>
                        </div>
                        <span
                          style={{
                            padding: "6px 12px",
                            borderRadius: "20px",
                            fontSize: "13px",
                            fontWeight: 600,
                            backgroundColor: interview.levelCrossed
                              ? "#d1fae5"
                              : "#fee2e2",
                            color: interview.levelCrossed
                              ? "#065f46"
                              : "#991b1b",
                          }}
                        >
                          {interview.levelCrossed ? "Passed" : "Not Passed"}
                        </span>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(150px, 1fr))",
                          gap: "12px",
                          marginBottom: "15px",
                        }}
                      >
                        <div
                          style={{
                            padding: "12px",
                            background: "white",
                            borderRadius: "8px",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#6b7280",
                              marginBottom: "4px",
                            }}
                          >
                            Communication
                          </div>
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: 600,
                              color: "#0f172a",
                            }}
                          >
                            {interview.communicationLevel === "B"
                              ? "Beginner"
                              : interview.communicationLevel === "I"
                                ? "Intermediate"
                                : interview.communicationLevel === "A"
                                  ? "Advanced"
                                  : "Expert"}
                          </div>
                        </div>
                        <div
                          style={{
                            padding: "12px",
                            background: "white",
                            borderRadius: "8px",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#6b7280",
                              marginBottom: "4px",
                            }}
                          >
                            Confidence
                          </div>
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: 600,
                              color: "#0f172a",
                            }}
                          >
                            {interview.confidenceLevel === "B"
                              ? "Beginner"
                              : interview.confidenceLevel === "I"
                                ? "Intermediate"
                                : interview.confidenceLevel === "A"
                                  ? "Advanced"
                                  : "Expert"}
                          </div>
                        </div>
                        <div
                          style={{
                            padding: "12px",
                            background: "white",
                            borderRadius: "8px",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#6b7280",
                              marginBottom: "4px",
                            }}
                          >
                            Clarity
                          </div>
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: 600,
                              color: "#0f172a",
                            }}
                          >
                            {interview.clarityLevel === "B"
                              ? "Beginner"
                              : interview.clarityLevel === "I"
                                ? "Intermediate"
                                : interview.clarityLevel === "A"
                                  ? "Advanced"
                                  : "Expert"}
                          </div>
                        </div>
                        <div
                          style={{
                            padding: "12px",
                            background: "white",
                            borderRadius: "8px",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#6b7280",
                              marginBottom: "4px",
                            }}
                          >
                            Overall Level
                          </div>
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: 600,
                              color: "#0f172a",
                            }}
                          >
                            {interview.overallLevel === "F"
                              ? "Fail"
                              : interview.overallLevel === "C"
                                ? "Clear"
                                : interview.overallLevel === "P"
                                  ? "Pass"
                                  : "Excellent"}
                          </div>
                        </div>
                      </div>

                      {interview.remarks && (
                        <div
                          style={{
                            padding: "12px",
                            background: "#eff6ff",
                            borderRadius: "8px",
                            borderLeft: "3px solid #3b82f6",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "12px",
                              fontWeight: 600,
                              color: "#1e40af",
                              marginBottom: "6px",
                            }}
                          >
                            HR Remarks (Read-only)
                          </div>
                          <div style={{ fontSize: "13px", color: "#1f2937" }}>
                            {interview.remarks}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Aptitude & Assessments Section */}
        {activeSection === "assessments" && (
          <>
            <div className="content-header">
              <h1>Aptitude & Assessments</h1>
              <p>Your scores and feedback analysis</p>
            </div>

            {/* Aptitude Section */}
            <div className="card" style={{ marginBottom: "30px" }}>
              <h3
                style={{
                  marginBottom: "20px",
                  fontSize: "18px",
                  color: "#0f172a",
                }}
              >
                Aptitude Test Results
              </h3>
              {aptitude.length === 0 ? (
                <div className="empty-state">
                  <p>No aptitude records yet.</p>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "15px",
                  }}
                >
                  {aptitude.map((apt) => (
                    <div
                      key={apt._id}
                      style={{
                        padding: "16px",
                        background: "#f0fdf4",
                        borderRadius: "10px",
                        border: "1px solid #b7e4c7",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "start",
                          marginBottom: "10px",
                        }}
                      >
                        <div>
                          <h4
                            style={{
                              margin: "0 0 3px 0",
                              color: "#0f172a",
                              fontSize: "15px",
                              fontWeight: 600,
                            }}
                          >
                            Round {apt.roundNumber}
                          </h4>
                          <span style={{ fontSize: "12px", color: "#6b7280" }}>
                            {new Date(apt.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <span
                          style={{
                            padding: "6px 12px",
                            borderRadius: "20px",
                            fontSize: "13px",
                            fontWeight: 600,
                            backgroundColor:
                              apt.result === "Pass" ? "#d1fae5" : "#fef3c7",
                            color:
                              apt.result === "Pass" ? "#065f46" : "#92400e",
                          }}
                        >
                          {apt.result}
                        </span>
                      </div>
                      <div
                        style={{
                          padding: "12px",
                          background: "white",
                          borderRadius: "8px",
                          marginBottom: "10px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "13px",
                            color: "#6b7280",
                            marginBottom: "4px",
                          }}
                        >
                          Score
                        </div>
                        <div
                          style={{
                            fontSize: "20px",
                            fontWeight: 700,
                            color: "#059669",
                          }}
                        >
                          {apt.score}
                        </div>
                      </div>
                      {apt.remarks && (
                        <div
                          style={{
                            padding: "10px",
                            background: "#f0fdf4",
                            borderRadius: "6px",
                            borderLeft: "3px solid #10b981",
                          }}
                        >
                          <div style={{ fontSize: "13px", color: "#166534" }}>
                            <strong>Feedback:</strong> {apt.remarks}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Assessment Section */}
            <div className="card">
              <h3
                style={{
                  marginBottom: "20px",
                  fontSize: "18px",
                  color: "#0f172a",
                }}
              >
                Assessment Results
              </h3>
              {assessments.length === 0 ? (
                <div className="empty-state">
                  <p>No assessment records yet.</p>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "15px",
                  }}
                >
                  {assessments.map((assess) => (
                    <div
                      key={assess._id}
                      style={{
                        padding: "16px",
                        background: "#eff6ff",
                        borderRadius: "10px",
                        border: "1px solid #bfdbfe",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "start",
                          marginBottom: "10px",
                        }}
                      >
                        <div>
                          <h4
                            style={{
                              margin: "0 0 3px 0",
                              color: "#0f172a",
                              fontSize: "15px",
                              fontWeight: 600,
                            }}
                          >
                            {assess.assessmentType} Assessment
                          </h4>
                          <span style={{ fontSize: "12px", color: "#6b7280" }}>
                            {new Date(assess.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <span
                          style={{
                            padding: "6px 12px",
                            borderRadius: "20px",
                            fontSize: "13px",
                            fontWeight: 600,
                            backgroundColor:
                              assess.status === "Pass"
                                ? "#d1fae5"
                                : assess.status === "Fail"
                                  ? "#fee2e2"
                                  : "#fef3c7",
                            color:
                              assess.status === "Pass"
                                ? "#065f46"
                                : assess.status === "Fail"
                                  ? "#991b1b"
                                  : "#92400e",
                          }}
                        >
                          {assess.status}
                        </span>
                      </div>
                      <div
                        style={{
                          padding: "12px",
                          background: "white",
                          borderRadius: "8px",
                          marginBottom: "10px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "13px",
                            color: "#6b7280",
                            marginBottom: "4px",
                          }}
                        >
                          Score
                        </div>
                        <div
                          style={{
                            fontSize: "20px",
                            fontWeight: 700,
                            color: "#3b82f6",
                          }}
                        >
                          {assess.score || "N/A"}
                        </div>
                      </div>
                      {assess.feedback && (
                        <div
                          style={{
                            padding: "10px",
                            background: "#eff6ff",
                            borderRadius: "6px",
                            borderLeft: "3px solid #3b82f6",
                          }}
                        >
                          <div style={{ fontSize: "13px", color: "#1e40af" }}>
                            <strong>Feedback:</strong> {assess.feedback}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
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
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "start",
                          marginBottom: "15px",
                        }}
                      >
                        <div>
                          <h3
                            style={{
                              margin: "0 0 5px 0",
                              color: "#0f172a",
                              fontSize: "16px",
                              fontWeight: 600,
                            }}
                          >
                            {posting.title}
                          </h3>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "4px 10px",
                              backgroundColor:
                                posting.opportunityType === "Job"
                                  ? "#dbeafe"
                                  : "#f0fdf4",
                              color:
                                posting.opportunityType === "Job"
                                  ? "#0c4a6e"
                                  : "#166534",
                              borderRadius: "12px",
                              fontSize: "12px",
                              fontWeight: 600,
                              marginRight: "8px",
                            }}
                          >
                            {posting.opportunityType}
                          </span>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "4px 10px",
                              backgroundColor: "#f3e8ff",
                              color: "#6b21a8",
                              borderRadius: "12px",
                              fontSize: "12px",
                              fontWeight: 600,
                            }}
                          >
                            {posting.domain}
                          </span>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(200px, 1fr))",
                          gap: "12px",
                          marginBottom: "15px",
                        }}
                      >
                        <div
                          style={{
                            padding: "12px",
                            background: "white",
                            borderRadius: "8px",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#6b7280",
                              marginBottom: "4px",
                            }}
                          >
                            Eligibility
                          </div>
                          <div style={{ fontSize: "13px", color: "#0f172a" }}>
                            {posting.eligibilityCriteria}
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          padding: "12px",
                          background: "white",
                          borderRadius: "8px",
                          marginBottom: "15px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "13px",
                            color: "#374151",
                            lineHeight: "1.6",
                          }}
                        >
                          {posting.description}
                        </div>
                      </div>

                      {posting.applicationLink && (
                        <a
                          href={posting.applicationLink}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: "inline-block",
                            padding: "10px 20px",
                            background: "#3b82f6",
                            color: "white",
                            borderRadius: "6px",
                            textDecoration: "none",
                            fontWeight: 600,
                            fontSize: "14px",
                          }}
                        >
                          Apply Now →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

    </div>
  );
}

export default InternDashboard;
