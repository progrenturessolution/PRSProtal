import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { trainerAPI } from "../services/api";
import logo from "../assets/logo.png";
import TrainerSidebar from "../components/TrainerSidebar";
import StudentRecordsSidebar from "../components/StudentRecordsSidebar";

function TrainerDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [trainerProfile, setTrainerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedStudentTab, setSelectedStudentTab] = useState(null);
  const [studentFilter, setStudentFilter] = useState("all");
  const [studentSearch, setStudentSearch] = useState("");
  const [openStudentMenuId, setOpenStudentMenuId] = useState(null);
  const [openAssignmentMenuId, setOpenAssignmentMenuId] = useState(null);
  const [groupSearchQuery, setGroupSearchQuery] = useState("");
  const [groupStudentSearch, setGroupStudentSearch] = useState({});
  const [expandedGroups, setExpandedGroups] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [recordError, setRecordError] = useState("");
  const [recordSuccess, setRecordSuccess] = useState("");
  const [recordHistorySearch, setRecordHistorySearch] = useState("");
  const [recordSubmitting, setRecordSubmitting] = useState(false);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [interviews, setInterviews] = useState([]);
  const [scheduledInterviews, setScheduledInterviews] = useState([]);
  const [aptitudes, setAptitudes] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [interviewFormData, setInterviewFormData] = useState({
    interviewType: "HR",
    attendanceStatus: "Present",
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
  const [aptitudeFormData, setAptitudeFormData] = useState({
    attendanceStatus: "Present",
    roundNumber: 1,
    score: "",
    result: "Pass",
    remarks: "",
  });
  const [assessmentFormData, setAssessmentFormData] = useState({
    attendanceStatus: "Present",
    assessmentType: "Domain",
    score: "",
    status: "Pending",
    feedback: "",
  });
  const [trainingFormData, setTrainingFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    attendance: "Present",
    skillImprovementNote: "",
    engagementLevel: "Medium",
    trainerRemarks: "",
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    joiningDate: "",
    customRole: "",
    password: "",
    confirmPassword: "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");


  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [location.search, setActiveTab]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const userRole = localStorage.getItem("userRole");

    if (!storedUser || userRole !== "trainer") {
      navigate("/");
      return;
    }

    setUser(JSON.parse(storedUser));
    setLoading(false); // Show page immediately
    
    // Load data in background
    fetchDashboardData();
  }, [navigate]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (openAssignmentMenuId) {
        if (e.target.closest("[data-assignment-menu]") || e.target.closest("[data-assignment-menu-toggle]")) {
          return;
        }
        setOpenAssignmentMenuId(null);
      }

      if (openStudentMenuId) {
        if (e.target.closest("[data-student-menu]") || e.target.closest("[data-student-menu-toggle]")) {
          return;
        }
        setOpenStudentMenuId(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openAssignmentMenuId, openStudentMenuId]);

  const fetchDashboardData = async () => {
    try {
      const [profileResult, studentsResult, scheduledInterviewsResult] = await Promise.allSettled([
        trainerAPI.getProfile(),
        trainerAPI.getAssignedStudents(),
        trainerAPI.getScheduledInterviews(),
      ]);

      if (profileResult.status === "fulfilled" && profileResult.value.data.success) {
        const profileUser = profileResult.value.data.user;
        setTrainerProfile(profileUser);
        setUser((prev) => ({
          ...(prev || {}),
          ...profileUser,
        }));

        if (Array.isArray(profileUser.assignedStudents)) {
          setStudents(profileUser.assignedStudents);
        }
      }

      if (studentsResult.status === "fulfilled" && studentsResult.value.data.success) {
        setStudents(studentsResult.value.data.students || []);
      }

      if (scheduledInterviewsResult.status === "fulfilled" && scheduledInterviewsResult.value.data.success) {
        setScheduledInterviews(scheduledInterviewsResult.value.data.interviews || []);
      }
    } catch (error) {
      console.error("Error fetching trainer dashboard data:", error);
    }
  };

  const fetchStudentRecords = async (studentId) => {
    try {
      setRecordsLoading(true);
      const response = await trainerAPI.getStudentRecords(studentId);
      if (response.data.success) {
        const data = response.data.data || {};
        setInterviews(data.interviews || []);
        setAptitudes(data.aptitudes || []);
        setAssessments(data.assessments || []);
        setTrainings(data.trainings || []);
      }
    } catch (error) {
      console.error("Error fetching student records:", error);
      setRecordError("Failed to load student records");
    } finally {
      setRecordsLoading(false);
    }
  };

  const clearRecordMessages = () => {
    setRecordError("");
    setRecordSuccess("");
  };

  const handleInterviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent?._id) return;
    
    // Validate required fields
    if (!interviewFormData.date || interviewFormData.date === "") {
      setRecordError("Date is required for interview record");
      setRecordSubmitting(false);
      return;
    }
    
    setRecordSubmitting(true);
    clearRecordMessages();
    try {
      const cleanedData = {
        studentId: selectedStudent._id,
        interviewType: interviewFormData.interviewType,
        attendanceStatus: interviewFormData.attendanceStatus,
        date: interviewFormData.date,
        attemptNumber: interviewFormData.attemptNumber,
        levelCrossed: interviewFormData.levelCrossed,
      };
      // Add optional fields only if they have values
      if (interviewFormData.communicationLevel) cleanedData.communicationLevel = interviewFormData.communicationLevel;
      if (interviewFormData.confidenceLevel) cleanedData.confidenceLevel = interviewFormData.confidenceLevel;
      if (interviewFormData.bodyLanguage) cleanedData.bodyLanguage = interviewFormData.bodyLanguage;
      if (interviewFormData.clarityOfAnswer) cleanedData.clarityOfAnswer = interviewFormData.clarityOfAnswer;
      if (interviewFormData.technicalKnowledge) cleanedData.technicalKnowledge = interviewFormData.technicalKnowledge;
      if (interviewFormData.problemSolving) cleanedData.problemSolving = interviewFormData.problemSolving;
      if (interviewFormData.codingAbility) cleanedData.codingAbility = interviewFormData.codingAbility;
      if (interviewFormData.logicAndApproach) cleanedData.logicAndApproach = interviewFormData.logicAndApproach;
      if (interviewFormData.overallHRLevel) cleanedData.overallHRLevel = interviewFormData.overallHRLevel;
      if (interviewFormData.overallTechnicalLevel) cleanedData.overallTechnicalLevel = interviewFormData.overallTechnicalLevel;
      if (interviewFormData.hrRemarks) cleanedData.hrRemarks = interviewFormData.hrRemarks;
      if (interviewFormData.technicalRemarks) cleanedData.technicalRemarks = interviewFormData.technicalRemarks;
      const response = await trainerAPI.addInterview(cleanedData);
      if (response.data.success) {
        setRecordSuccess("Interview record added successfully!");
        setInterviewFormData({
          interviewType: "HR",
          attendanceStatus: "Present",
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
        fetchStudentRecords(selectedStudent._id);
      }
    } catch (error) {
      setRecordError(error.response?.data?.message || "Failed to add interview record");
    } finally {
      setRecordSubmitting(false);
    }
  };

  const handleAptitudeSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent?._id) return;
    
    // Validate required fields
    if (!aptitudeFormData.score || aptitudeFormData.score === "") {
      setRecordError("Score is required for aptitude record");
      setRecordSubmitting(false);
      return;
    }
    
    setRecordSubmitting(true);
    clearRecordMessages();
    try {
      const cleanedData = {
        studentId: selectedStudent._id,
        attendanceStatus: aptitudeFormData.attendanceStatus,
        roundNumber: aptitudeFormData.roundNumber,
        score: parseFloat(aptitudeFormData.score),
        result: aptitudeFormData.result,
      };
      // Only add remarks if present
      if (aptitudeFormData.remarks) {
        cleanedData.remarks = aptitudeFormData.remarks;
      }
      const response = await trainerAPI.addAptitude(cleanedData);
      if (response.data.success) {
        setRecordSuccess("Aptitude record added successfully!");
        setAptitudeFormData({
          attendanceStatus: "Present",
          roundNumber: 1,
          score: "",
          result: "Pass",
          remarks: "",
        });
        fetchStudentRecords(selectedStudent._id);
      }
    } catch (error) {
      setRecordError(error.response?.data?.message || "Failed to add aptitude record");
    } finally {
      setRecordSubmitting(false);
    }
  };

  const handleAssessmentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent?._id) return;
    setRecordSubmitting(true);
    clearRecordMessages();
    try {
      const cleanedData = {
        studentId: selectedStudent._id,
        attendanceStatus: assessmentFormData.attendanceStatus,
        assessmentType: assessmentFormData.assessmentType,
        status: assessmentFormData.status,
      };
      // Only add score if present and is a valid number
      if (assessmentFormData.score && assessmentFormData.score !== "") {
        cleanedData.score = parseFloat(assessmentFormData.score);
      }
      // Only add feedback if present
      if (assessmentFormData.feedback) {
        cleanedData.feedback = assessmentFormData.feedback;
      }
      const response = await trainerAPI.addAssessment(cleanedData);
      if (response.data.success) {
        setRecordSuccess("Assessment record added successfully!");
        setAssessmentFormData({
          attendanceStatus: "Present",
          assessmentType: "Domain",
          score: "",
          status: "Pending",
          feedback: "",
        });
        fetchStudentRecords(selectedStudent._id);
      }
    } catch (error) {
      setRecordError(error.response?.data?.message || "Failed to add assessment record");
    } finally {
      setRecordSubmitting(false);
    }
  };

  const handleTrainingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent?._id) return;
    setRecordSubmitting(true);
    clearRecordMessages();
    try {
      const cleanedData = {
        studentId: selectedStudent._id,
        ...trainingFormData,
      };
      // Clean up empty notes and remarks
      if (!cleanedData.skillImprovementNote) delete cleanedData.skillImprovementNote;
      if (!cleanedData.trainerRemarks) delete cleanedData.trainerRemarks;
      const response = await trainerAPI.addTraining(cleanedData);
      if (response.data.success) {
        setRecordSuccess("Training record added successfully!");
        setTrainingFormData({
          date: new Date().toISOString().split("T")[0],
          attendance: "Present",
          skillImprovementNote: "",
          engagementLevel: "Medium",
          trainerRemarks: "",
        });
        fetchStudentRecords(selectedStudent._id);
      }
    } catch (error) {
      setRecordError(error.response?.data?.message || "Failed to add training record");
    } finally {
      setRecordSubmitting(false);
    }
  };

  const handleUpdateStatus = async (studentId, newStatus) => {
    try {
      await trainerAPI.updateStudentStatus(studentId, newStatus);
      // Update local state
      setStudents(
        students.map((student) =>
          student._id === studentId
            ? { ...student, status: newStatus }
            : student,
        ),
      );
      setSuccessMessage(`Student marked as ${newStatus}`);
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (error) {
      console.error("Error updating student status:", error);
      alert("Failed to update student status");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const handleEditClick = () => {
    setEditFormData({
      name: user?.name || "",
      email: user?.email || "",
      mobile: user?.mobile || "",
      joiningDate: user?.joiningDate ? new Date(user.joiningDate).toISOString().split("T")[0] : "",
      customRole: user?.customRole || "",
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

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError("");
    setEditLoading(true);

    // Validation
    if (!editFormData.name.trim()) {
      setEditError("Name is required");
      setEditLoading(false);
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (editFormData.email && !emailRegex.test(editFormData.email)) {
      setEditError("Please enter a valid email address");
      setEditLoading(false);
      return;
    }

    if (!editFormData.email.trim()) {
      setEditError("Email is required");
      setEditLoading(false);
      return;
    }

    // If password is provided, check if passwords match
    if (
      editFormData.password &&
      editFormData.password !== editFormData.confirmPassword
    ) {
      setEditError("Passwords do not match");
      setEditLoading(false);
      return;
    }

    try {
      const updateData = {
        name: editFormData.name,
        email: editFormData.email,
        mobile: editFormData.mobile,
        joiningDate: editFormData.joiningDate,
        customRole: editFormData.customRole,
      };

      // Only include password if provided
      if (editFormData.password) {
        updateData.password = editFormData.password;
      }

      const response = await trainerAPI.updateProfile(updateData);

      if (response.data.success) {
        // Update user in local state
        const updatedUser = response.data.user;
        setUser(updatedUser);
        setTrainerProfile((prev) => ({
          ...(prev || {}),
          ...updatedUser,
        }));

        // Update localStorage with new user data
        localStorage.setItem("user", JSON.stringify(updatedUser));

        setSuccessMessage("Profile updated successfully!");
        setTimeout(() => setSuccessMessage(""), 4000);
        setShowEditModal(false);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setEditError(error.response?.data?.message || "Failed to update profile");
    } finally {
      setEditLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setEditError("");
    setEditFormData({
      name: "",
      email: "",
      mobile: "",
      joiningDate: "",
      customRole: "",
      password: "",
      confirmPassword: "",
    });
  };

  const handleToggleGroup = (groupId) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const openStudentRecords = (student, sourceMenuSetter) => {
    if (!student?._id) return;
    clearRecordMessages();
    setRecordHistorySearch("");
    setSelectedStudent(student);
    setSelectedStudentTab("interviews");
    setActiveTab("student-records");
    fetchStudentRecords(student._id);
    if (sourceMenuSetter) {
      sourceMenuSetter(null);
    }
  };

  const handleGroupStudentSearchChange = (groupId, value) => {
    setGroupStudentSearch((prev) => ({
      ...prev,
      [groupId]: value,
    }));
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  const assignedGroups = trainerProfile?.assignedGroups || [];
  const workAssignments = trainerProfile?.workAssignments || [];
  const currentStudentTab = selectedStudentTab || "interviews";

  const normalizedGroupSearch = groupSearchQuery.trim().toLowerCase();
  const filteredAssignedGroups = assignedGroups.filter((group) => {
    if (!normalizedGroupSearch) return true;

    const baseMatch = [group?.groupName, group?.groupNumber]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedGroupSearch));

    if (baseMatch) return true;

    const groupStudents = Array.isArray(group?.students) ? group.students : [];
    return groupStudents.some((student) => {
      if (!student || typeof student !== "object") return false;
      return [
        student.name,
        student.internId,
        student.email,
        student.mobile,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedGroupSearch));
    });
  });

  const normalizedHistorySearch = recordHistorySearch.trim().toLowerCase();
  const matchesHistorySearch = (...values) => {
    if (!normalizedHistorySearch) return true;
    return values
      .filter((value) => value !== undefined && value !== null)
      .some((value) => String(value).toLowerCase().includes(normalizedHistorySearch));
  };

  const filteredInterviews = interviews.filter((interview) =>
    matchesHistorySearch(
      interview.date ? new Date(interview.date).toLocaleDateString() : "",
      interview.interviewType,
      interview.attendanceStatus,
      interview.attemptNumber,
      interview.communicationLevel,
      interview.confidenceLevel,
      interview.clarityLevel,
      interview.overallLevel,
      interview.levelCrossed ? "yes" : "no",
    ),
  );

  const filteredAptitudes = aptitudes.filter((apt) =>
    matchesHistorySearch(
      apt.attendanceStatus,
      apt.roundNumber,
      apt.score,
      apt.result,
      apt.remarks,
      apt.createdAt ? new Date(apt.createdAt).toLocaleDateString() : "",
    ),
  );

  const filteredAssessments = assessments.filter((assessment) =>
    matchesHistorySearch(
      assessment.attendanceStatus,
      assessment.assessmentType,
      assessment.score,
      assessment.status,
      assessment.feedback,
      assessment.createdAt ? new Date(assessment.createdAt).toLocaleDateString() : "",
    ),
  );

  const filteredTrainings = trainings.filter((training) =>
    matchesHistorySearch(
      training.date ? new Date(training.date).toLocaleDateString() : "",
      training.attendance,
      training.engagementLevel,
      training.skillImprovementNote,
      training.trainerRemarks,
    ),
  );

  return (
    <div className="dashboard">
      {/* Mobile Menu Button */}
      <button 
        className="mobile-menu-btn" 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle Menu"
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <TrainerSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Clean Enterprise Content */}
      <main className="main-content">
        <div className="dashboard-content">
          {activeTab === "overview" && (
            <>
              <div className="premium-page-header">
                <div className="header-left">
                  <h1>Dashboard</h1>
                  <p className="header-subtitle">Welcome back, {user?.name}</p>
                </div>
                <div className="header-right">
                  <div className="date-badge">
                    {new Date().toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>
              </div>

              {/* Premium Stats Cards */}
              <div className="premium-stats-grid">
                <div
                  className="premium-stat-card accent-blue"
                  onClick={() => {
                    setActiveTab("students");
                    setStudentFilter("all");
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <div className="stat-icon-wrapper">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </div>
                  <div className="stat-content">
                    <div className="stat-label">Total Students</div>
                    <div className="stat-value">{students.length}</div>
                    <div className="stat-meta">Assigned to you</div>
                  </div>
                </div>

                <div
                  className="premium-stat-card accent-teal"
                  onClick={() => {
                    setActiveTab("students");
                    setStudentFilter("active");
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <div className="stat-icon-wrapper">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <div className="stat-content">
                    <div className="stat-label">Active Training</div>
                    <div className="stat-value">
                      {students.filter((s) => s.status === "active").length}
                    </div>
                    <div className="stat-meta">Currently enrolled</div>
                  </div>
                </div>

                <div
                  className="premium-stat-card accent-indigo"
                  onClick={() => {
                    setActiveTab("students");
                    setStudentFilter("completed");
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <div className="stat-icon-wrapper">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                      />
                    </svg>
                  </div>
                  <div className="stat-content">
                    <div className="stat-label">Completed</div>
                    <div className="stat-value">
                      {students.filter((s) => s.status === "completed").length}
                    </div>
                    <div className="stat-meta">Training finished</div>
                  </div>
                </div>

                <div
                  className="premium-stat-card accent-emerald"
                  onClick={() => setActiveTab("assignments")}
                  style={{ cursor: "pointer" }}
                >
                  <div className="stat-icon-wrapper">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 100-4H5a2 2 0 100 4m14 0a2 2 0 110 4H5a2 2 0 110-4m0 0v6a2 2 0 002 2h10a2 2 0 002-2v-6"
                      />
                    </svg>
                  </div>
                  <div className="stat-content">
                    <div className="stat-label">Assigned Groups</div>
                    <div className="stat-value">{assignedGroups.length}</div>
                    <div className="stat-meta">Click to view details</div>
                  </div>
                </div>

                <div className="premium-stat-card accent-slate">
                  <div className="stat-icon-wrapper">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="stat-content">
                    <div className="stat-label">Pending Reviews</div>
                    <div className="stat-value">0</div>
                    <div className="stat-meta">Awaiting feedback</div>
                  </div>
                </div>
              </div>

              {/* Premium Action Cards */}
              <div className="premium-action-grid">
                <div className="premium-action-card">
                  <div className="action-card-icon blue">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </div>
                  <div className="action-card-content">
                    <h3>Manage Students</h3>
                    <p>View and track student progress</p>
                  </div>
                  <button
                    className="action-card-btn"
                    onClick={() => setActiveTab("students")}
                  >
                    View
                  </button>
                </div>

                <div className="premium-action-card">
                  <div className="action-card-icon teal">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 1.567-3 3.5S10.343 15 12 15s3-1.567 3-3.5S13.657 8 12 8zm0 0V5m0 10v4m7-7h-3M8 12H5"
                      />
                    </svg>
                  </div>
                  <div className="action-card-content">
                    <h3>Assign Groups</h3>
                    <p>Check assigned groups and work tasks</p>
                  </div>
                  <button
                    className="action-card-btn"
                    onClick={() => setActiveTab("assignments")}
                  >
                    Open
                  </button>
                </div>
              </div>

              {/* Scheduled Interviews Section */}
              <div className="premium-card" style={{ marginTop: "24px" }}>
                <div className="premium-card-header">
                  <h2>Upcoming Scheduled Interviews</h2>
                </div>
                <div style={{ padding: "16px 20px" }}>
                  {scheduledInterviews.length === 0 ? (
                    <p className="record-history-empty">No scheduled interviews yet</p>
                  ) : (
                    <div className="table-container">
                      <table className="data-table view-students-table interview-schedule-table">
                        <thead>
                          <tr>
                            <th>Student Name</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Interview Type</th>
                            <th>Mode</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {scheduledInterviews.slice(0, 5).map((interview) => (
                            <tr key={interview._id}>
                              <td>{interview.studentId?.name || "-"}</td>
                              <td>{interview.date ? new Date(interview.date).toLocaleDateString() : "-"}</td>
                              <td>{interview.startTime || "-"}</td>
                              <td>{interview.interviewType || "-"}</td>
                              <td>{interview.mode || "Individual"}</td>
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
                  {scheduledInterviews.length > 5 && (
                    <div style={{ textAlign: "center", marginTop: "12px" }}>
                      <small>Showing 5 of {scheduledInterviews.length} scheduled interviews</small>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === "assignments" && (
            <>
              <div className="premium-page-header">
                <div className="header-left">
                  <h1>Assign Groups</h1>
                  <p className="header-subtitle">
                    All students, groups, and work assigned by admin
                  </p>
                </div>
              </div>

              <div className="premium-stats-grid" style={{ marginBottom: "20px" }}>
                <div className="premium-stat-card accent-blue">
                  <div className="stat-content">
                    <div className="stat-label">Assigned Students</div>
                    <div className="stat-value">{students.length}</div>
                  </div>
                </div>
                <div className="premium-stat-card accent-emerald">
                  <div className="stat-content">
                    <div className="stat-label">Assigned Groups</div>
                    <div className="stat-value">{assignedGroups.length}</div>
                  </div>
                </div>
                <div className="premium-stat-card accent-indigo">
                  <div className="stat-content">
                    <div className="stat-label">Work Items</div>
                    <div className="stat-value">{workAssignments.length}</div>
                  </div>
                </div>
              </div>

              <div className="premium-card" style={{ marginBottom: "16px" }}>
                <div className="premium-card-header">
                  <h2>Assigned Groups</h2>
                </div>
                <div style={{ padding: "0 20px 16px 20px" }}>
                  <input
                    type="text"
                    value={groupSearchQuery}
                    onChange={(e) => setGroupSearchQuery(e.target.value)}
                    placeholder="Search groups by name, group number, student name, ID, email..."
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      border: "1px solid #d1d5db",
                      borderRadius: "10px",
                      fontSize: "14px",
                      background: "#ffffff",
                    }}
                  />
                </div>
                {assignedGroups.length === 0 ? (
                  <div className="premium-empty-state">
                    <p className="empty-title">No groups assigned yet</p>
                  </div>
                ) : filteredAssignedGroups.length === 0 ? (
                  <div className="premium-empty-state">
                    <p className="empty-title">No groups match this search</p>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    {filteredAssignedGroups.map((group) => {
                      const groupStudents = Array.isArray(group.students) ? group.students : [];
                      const groupId = group._id || String(group.groupNumber || group.groupName || "group");
                      const isExpanded = !!expandedGroups[groupId];
                      const groupStudentQuery = (groupStudentSearch[groupId] || "").trim().toLowerCase();
                      const visibleGroupStudents = groupStudents.filter((student) => {
                        if (!groupStudentQuery) return true;
                        if (!student || typeof student !== "object") return false;
                        return [
                          student.name,
                          student.internId,
                          student.email,
                          student.mobile,
                          student.studentType,
                          student.status,
                        ]
                          .filter(Boolean)
                          .some((value) => String(value).toLowerCase().includes(groupStudentQuery));
                      });
                      
                      return (
                        <div key={group._id} style={{ marginBottom: "16px", border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
                          <div
                            style={{
                              padding: "16px",
                              background: "#f9fafb",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              transition: "all 0.2s ease",
                              borderBottom: isExpanded ? "1px solid #e5e7eb" : "none",
                              cursor: "pointer",
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "#f3f4f6"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "#f9fafb"}
                            onClick={() => handleToggleGroup(groupId)}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1 }}>
                              <svg
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                style={{
                                  width: "20px",
                                  height: "20px",
                                  color: "#324158",
                                  transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                                  transition: "transform 0.2s ease"
                                }}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                              <div>
                                <div style={{ fontWeight: "600", color: "#1f2937", fontSize: "15px" }}>
                                  {group.groupName || "Unnamed Group"}
                                </div>
                                <div style={{ fontSize: "13px", color: "#9ca3af", marginTop: "2px" }}>
                                  Group #: {group.groupNumber || "-"}
                                </div>
                              </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "13px", color: "#6b7280" }}>
                              <span style={{ background: "#dbeafe", color: "#1e40af", padding: "4px 12px", borderRadius: "999px", fontWeight: "600" }}>
                                {groupStudents.length} Student{groupStudents.length !== 1 ? 's' : ''}
                              </span>
                              <span style={{ color: "#324158", fontSize: "12px", fontWeight: "700" }}>
                                {isExpanded ? "Hide" : "View"}
                              </span>
                            </div>
                          </div>

                          {isExpanded && (
                            <div style={{ padding: "16px", background: "#fff" }}>
                              <div style={{ marginBottom: "12px" }}>
                                <input
                                  type="text"
                                  value={groupStudentSearch[groupId] || ""}
                                  onChange={(e) => handleGroupStudentSearchChange(groupId, e.target.value)}
                                  placeholder="Search students in this group by name, ID, email, mobile..."
                                  style={{
                                    width: "100%",
                                    padding: "10px 12px",
                                    border: "1px solid #d1d5db",
                                    borderRadius: "8px",
                                    fontSize: "13px",
                                    background: "#ffffff",
                                  }}
                                />
                              </div>

                              {groupStudents.length === 0 ? (
                              <div style={{ textAlign: "center", color: "#9ca3af", padding: "20px" }}>
                                <p>No students in this group</p>
                              </div>
                            ) : visibleGroupStudents.length === 0 ? (
                              <div style={{ textAlign: "center", color: "#9ca3af", padding: "20px" }}>
                                <p>No students match this search</p>
                              </div>
                            ) : (
                              <div style={{ overflowX: "auto" }}>
                                <table className="data-table view-students-table" style={{ minWidth: "920px", marginBottom: 0 }}>
                                  <thead>
                                    <tr>
                                      <th>#</th>
                                      <th>ID</th>
                                      <th>Student</th>
                                      <th>Email</th>
                                      <th>Mobile</th>
                                      <th>Type</th>
                                      <th>Status</th>
                                      <th>Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {visibleGroupStudents.map((student, index) => {
                                      const isStudentObject = student && typeof student === "object";
                                      const studentId = isStudentObject ? student._id : String(student || "");
                                      const menuId = `${group._id || "group"}-${studentId || index}`;
                                      const studentName = isStudentObject ? student.name : "Unknown";
                                      const internId = isStudentObject ? student.internId : "-";
                                      const studentEmail = isStudentObject ? student.email : "-";
                                      const studentMobile = isStudentObject ? student.mobile : "-";
                                      const studentType = isStudentObject ? student.studentType : "-";
                                      const studentStatus = isStudentObject ? student.status : "-";
                                      return (
                                        <tr key={studentId}>
                                          <td>{index + 1}</td>
                                          <td>{internId}</td>
                                          <td>
                                            {studentName}
                                          </td>
                                          <td>
                                            <span style={{ wordBreak: "break-word" }}>{studentEmail}</span>
                                          </td>
                                          <td>
                                            {studentMobile || "-"}
                                          </td>
                                          <td>
                                            {studentType}
                                          </td>
                                          <td>
                                            <span
                                              className={`status-badge ${
                                                (studentStatus || "").toLowerCase() === "active"
                                                  ? "status-active"
                                                  : (studentStatus || "").toLowerCase() === "completed"
                                                    ? "status-completed"
                                                    : "status-inactive"
                                              }`}
                                            >
                                              {studentStatus
                                                ? studentStatus.charAt(0).toUpperCase() + studentStatus.slice(1)
                                                : "-"}
                                            </span>
                                          </td>
                                          <td style={{ position: "relative" }}>
                                            <button
                                              data-assignment-menu-toggle
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (!isStudentObject || !student._id) return;
                                                setOpenAssignmentMenuId((prev) => (prev === menuId ? null : menuId));
                                              }}
                                              style={{
                                                background: "transparent",
                                                color: "#0f172a",
                                                border: "1px solid #d1d5db",
                                                borderRadius: "8px",
                                                width: "36px",
                                                height: "36px",
                                                cursor: !isStudentObject || !student._id ? "not-allowed" : "pointer",
                                                fontSize: "20px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                              }}
                                              disabled={!isStudentObject || !student._id}
                                              aria-label="Open actions"
                                            >
                                              ⋮
                                            </button>

                                            {openAssignmentMenuId === menuId && (
                                              <div
                                                data-assignment-menu
                                                style={{
                                                  position: "absolute",
                                                  right: 0,
                                                  top: "42px",
                                                  background: "white",
                                                  border: "1px solid #e5e7eb",
                                                  borderRadius: "12px",
                                                  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
                                                  zIndex: 1000,
                                                  minWidth: "160px",
                                                  overflow: "hidden",
                                                }}
                                              >
                                                <button
                                                  onClick={() => {
                                                    openStudentRecords(student, setOpenAssignmentMenuId);
                                                  }}
                                                  style={{
                                                    width: "100%",
                                                    padding: "12px 16px",
                                                    background: "white",
                                                    border: "none",
                                                    textAlign: "left",
                                                    cursor: "pointer",
                                                    fontSize: "14px",
                                                    fontWeight: "500",
                                                    color: "#0f172a",
                                                  }}
                                                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                                                  onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                                                >
                                                  View Details
                                                </button>
                                              </div>
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="premium-card">
                <div className="premium-card-header">
                  <h2>Assigned Work</h2>
                </div>
                {workAssignments.length === 0 ? (
                  <div className="premium-empty-state">
                    <p className="empty-title">No work assigned yet</p>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table className="premium-table">
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Description</th>
                          <th>Work Date</th>
                          <th>Students</th>
                          <th>Groups</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workAssignments && workAssignments.map((item) => (
                          <tr key={item._id}>
                            <td>{item.title || "-"}</td>
                            <td>{item.description || "-"}</td>
                            <td>{item.workDate ? new Date(item.workDate).toLocaleDateString() : "-"}</td>
                            <td>{Array.isArray(item.assignedStudents) ? item.assignedStudents.length : 0}</td>
                            <td>{Array.isArray(item.assignedGroups) ? item.assignedGroups.length : 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === "students" && (
            <>
              <div className="premium-page-header">
                <div className="header-left">
                  <h1 style={{ color: "#324158" }}>My Students</h1>
                  <p className="header-subtitle">
                    Search and manage your assigned students
                  </p>
                </div>
              </div>

              {successMessage && (
                <div className="success-message" style={{ marginBottom: "20px" }}>
                  {successMessage}
                </div>
              )}

              {/* Search + Filter Bar */}
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  marginBottom: "20px",
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                {/* Search Input */}
                <div
                  style={{
                    flex: "1",
                    minWidth: "220px",
                    position: "relative",
                  }}
                >
                  <svg
                    fill="none"
                    stroke="#9ca3af"
                    viewBox="0 0 24 24"
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "18px",
                      height: "18px",
                      pointerEvents: "none",
                    }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by name or student ID..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px 10px 38px",
                      borderRadius: "8px",
                      border: "1px solid #d1d5db",
                      fontSize: "14px",
                      background: "#fff",
                      boxSizing: "border-box",
                      outline: "none",
                    }}
                  />
                </div>

                {/* Status Filter */}
                <div style={{ position: "relative" }}>
                  <svg
                    fill="none"
                    stroke="#9ca3af"
                    viewBox="0 0 24 24"
                    style={{
                      position: "absolute",
                      left: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "16px",
                      height: "16px",
                      pointerEvents: "none",
                    }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"
                    />
                  </svg>
                  <select
                    value={studentFilter}
                    onChange={(e) => setStudentFilter(e.target.value)}
                    style={{
                      padding: "10px 12px 10px 32px",
                      borderRadius: "8px",
                      border: "1px solid #d1d5db",
                      fontSize: "14px",
                      background: "#fff",
                      cursor: "pointer",
                      appearance: "none",
                      minWidth: "160px",
                    }}
                  >
                    <option value="all">All Students</option>
                    <option value="active">Active Training</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                {/* Clear search button */}
                {studentSearch && (
                  <button
                    onClick={() => setStudentSearch("")}
                    style={{
                      padding: "10px 16px",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      background: "#f3f4f6",
                      color: "#6b7280",
                      fontSize: "13px",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    ✕ Clear
                  </button>
                )}
              </div>

              <div className="premium-card record-workspace">
                {(() => {
                  const q = studentSearch.trim().toLowerCase();
                  const filteredStudents = students.filter((student) => {
                    const matchesFilter =
                      studentFilter === "all" ||
                      student.status === (studentFilter === "active" ? "active" : "completed");
                    const matchesSearch =
                      !q ||
                      student.name?.toLowerCase().includes(q) ||
                      student.internId?.toLowerCase().includes(q) ||
                      student.email?.toLowerCase().includes(q);
                    return matchesFilter && matchesSearch;
                  });

                  return filteredStudents.length === 0 ? (
                    <div className="premium-empty-state">
                      <div className="empty-icon">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                          />
                        </svg>
                      </div>
                      <p className="empty-title">
                        {q ? `No students match "${studentSearch}"` : "No students assigned"}
                      </p>
                      <p className="empty-subtitle">
                        {q
                          ? "Try a different name or student ID"
                          : "Students assigned to you will appear here"}
                      </p>
                      {q && (
                        <button
                          onClick={() => setStudentSearch("")}
                          style={{
                            marginTop: "12px",
                            padding: "8px 20px",
                            borderRadius: "6px",
                            border: "none",
                            background: "linear-gradient(135deg, #667eea, #764ba2)",
                            color: "#fff",
                            cursor: "pointer",
                            fontSize: "14px",
                          }}
                        >
                          Clear Search
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Result count */}
                      <div
                        style={{
                          padding: "12px 20px",
                          borderBottom: "1px solid #f3f4f6",
                          fontSize: "13px",
                          color: "#6b7280",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "15px", height: "15px" }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        Showing <strong style={{ color: "#374151" }}>{filteredStudents.length}</strong> of{" "}
                        <strong style={{ color: "#374151" }}>{students.length}</strong> students
                        {q && (
                          <span style={{ marginLeft: "4px" }}>
                            for <em>"{studentSearch}"</em>
                          </span>
                        )}
                      </div>

                      <div style={{ overflowX: "auto" }}>
                        <table className="premium-table view-students-table">
                          <thead>
                            <tr>
                              <th>Student</th>
                              <th>Student ID</th>
                              <th>Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredStudents.map((student) => {
                              const isCompleted = student.status === "completed";
                              return (
                                <tr key={student._id}>
                                  {/* Student details */}
                                  <td>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                      <div>
                                        <div
                                          style={{ fontWeight: "600", color: "#1f2937", fontSize: "14px" }}
                                          dangerouslySetInnerHTML={{
                                            __html: q
                                              ? student.name?.replace(
                                                  new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"),
                                                  '<mark style="background:#fef08a;padding:0 2px;border-radius:2px">$1</mark>'
                                                )
                                              : student.name,
                                          }}
                                        />
                                        {student.email && (
                                          <div style={{ fontSize: "12px", color: "#9ca3af" }}>
                                            {student.email}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </td>

                                  {/* Student ID with highlight */}
                                  <td>
                                    <span
                                      className="mono-text"
                                      style={{ fontSize: "13px" }}
                                      dangerouslySetInnerHTML={{
                                        __html: q
                                          ? student.internId?.replace(
                                              new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"),
                                              '<mark style="background:#fef08a;padding:0 2px;border-radius:2px">$1</mark>'
                                            )
                                          : student.internId,
                                      }}
                                    />
                                  </td>

                                  {/* Status badge */}
                                  <td>
                                    <span
                                      style={{
                                        display: "inline-block",
                                        padding: "3px 10px",
                                        borderRadius: "999px",
                                        fontSize: "12px",
                                        fontWeight: "600",
                                        background: isCompleted ? "#d1fae5" : "#dbeafe",
                                        color: isCompleted ? "#065f46" : "#1e40af",
                                      }}
                                    >
                                      {isCompleted ? "Completed" : "Active"}
                                    </span>
                                  </td>

                                  {/* Actions */}
                                  <td style={{ position: "relative" }}>
                                    <button
                                      data-student-menu-toggle
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenStudentMenuId((prev) =>
                                          prev === student._id ? null : student._id,
                                        );
                                      }}
                                      style={{
                                        background: "transparent",
                                        color: "#0f172a",
                                        border: "1px solid #d1d5db",
                                        borderRadius: "8px",
                                        width: "36px",
                                        height: "36px",
                                        cursor: "pointer",
                                        fontSize: "20px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        lineHeight: 1,
                                      }}
                                      aria-label={`Open actions for ${student.name || "student"}`}
                                    >
                                      ⋮
                                    </button>

                                    {openStudentMenuId === student._id && (
                                      <div
                                        data-student-menu
                                        style={{
                                          position: "absolute",
                                          right: 0,
                                          top: "42px",
                                          background: "#ffffff",
                                          border: "1px solid #e5e7eb",
                                          borderRadius: "12px",
                                          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
                                          zIndex: 1000,
                                          minWidth: "180px",
                                          overflow: "hidden",
                                        }}
                                      >
                                      <button
                                        onClick={() => {
                                          openStudentRecords(student, setOpenStudentMenuId);
                                        }}
                                        style={{
                                          width: "100%",
                                          padding: "12px 16px",
                                          background: "#ffffff",
                                          border: "none",
                                          textAlign: "left",
                                          cursor: "pointer",
                                          fontSize: "14px",
                                          fontWeight: "500",
                                          color: "#0f172a",
                                        }}
                                        onMouseEnter={(e) => (e.target.style.background = "#f9fafb")}
                                        onMouseLeave={(e) => (e.target.style.background = "#ffffff")}
                                      >
                                        View Student
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (!isCompleted) {
                                            handleUpdateStatus(student._id, "completed");
                                          }
                                          setOpenStudentMenuId(null);
                                        }}
                                        disabled={isCompleted}
                                        style={{
                                          width: "100%",
                                          padding: "12px 16px",
                                          background: "#ffffff",
                                          border: "none",
                                          borderTop: "1px solid #f3f4f6",
                                          textAlign: "left",
                                          cursor: isCompleted ? "not-allowed" : "pointer",
                                          fontSize: "14px",
                                          fontWeight: "500",
                                          color: isCompleted ? "#9ca3af" : "#0f172a",
                                        }}
                                        onMouseEnter={(e) => {
                                          if (!isCompleted) {
                                            e.target.style.background = "#f9fafb";
                                          }
                                        }}
                                        onMouseLeave={(e) => (e.target.style.background = "#ffffff")}
                                      >
                                        Mark Completed
                                      </button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  );
                })()}
              </div>
            </>
          )}

          {activeTab === "student-records" && selectedStudent && (
            <>
              <div className="premium-page-header">
                <div className="header-left">
                  <h1>{selectedStudent.name}</h1>
                  <p className="header-subtitle">
                    Student ID: {selectedStudent.internId} | {selectedStudent.email}
                  </p>
                </div>
                <div className="header-right">
                  <button
                    onClick={() => {
                      setSelectedStudent(null);
                      setSelectedStudentTab(null);
                      setRecordHistorySearch("");
                      setActiveTab("students");
                    }}
                    className="premium-btn-secondary"
                  >
                    ← Back to Students
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="premium-card record-workspace">
                <div className="student-records-shell">
                  <aside className="student-records-sidepanel">
                    <StudentRecordsSidebar
                      studentId={selectedStudent._id}
                      activeTab={currentStudentTab}
                      studentInfo={selectedStudent}
                      onTabChange={(tabKey) => {
                        setSelectedStudentTab(tabKey);
                        setRecordHistorySearch("");
                        clearRecordMessages();
                      }}
                    />
                  </aside>
                  <div className="student-records-content">
                {recordsLoading && (
                  <div className="premium-empty-state">
                    <p className="empty-title">Loading records...</p>
                  </div>
                )}

                {!recordsLoading && recordError && (
                  <div className="error-message" style={{ margin: "20px" }}>{recordError}</div>
                )}

                {!recordsLoading && recordSuccess && (
                  <div className="success-message" style={{ margin: "20px" }}>{recordSuccess}</div>
                )}

                {!recordsLoading && currentStudentTab === "interviews" && (
                  <div className="record-section">
                    <h2 className="record-form-title">Add Interview Record</h2>
                    <div className="record-intro-card">
                      <strong>Interview Evaluation</strong>
                      <p>Fill detailed interview performance for this student and save it to history.</p>
                    </div>
                    <form onSubmit={handleInterviewSubmit} className="record-form-grid">
                      <div className="form-group">
                        <label>PSMS ID</label>
                        <input type="text" value={selectedStudent?.internId || ""} readOnly />
                      </div>

                      <div className="form-group">
                        <label>Student Name</label>
                        <input type="text" value={selectedStudent?.name || ""} readOnly />
                      </div>

                      <div className="form-group">
                        <label>Interview Type *</label>
                        <select
                          name="interviewType"
                          value={interviewFormData.interviewType}
                          onChange={(e) => {
                            const interviewType = e.target.value;
                            setInterviewFormData((prev) => ({
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
                          value={interviewFormData.attemptNumber}
                          onChange={(e) => setInterviewFormData({ ...interviewFormData, [e.target.name]: e.target.value })}
                          placeholder="4/24"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Date *</label>
                        <input
                          type="date"
                          name="date"
                          value={interviewFormData.date}
                          onChange={(e) => setInterviewFormData({ ...interviewFormData, [e.target.name]: e.target.value })}
                          required
                        />
                      </div>

                      {interviewFormData.interviewType === "HR" ? (
                        <>
                          <div className="form-group">
                            <label>Communication Level (B/I/A/E) *</label>
                            <select
                              name="communicationLevel"
                              value={interviewFormData.communicationLevel}
                              onChange={(e) => setInterviewFormData({ ...interviewFormData, [e.target.name]: e.target.value })}
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
                              value={interviewFormData.confidenceLevel}
                              onChange={(e) => setInterviewFormData({ ...interviewFormData, [e.target.name]: e.target.value })}
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
                              value={interviewFormData.bodyLanguage}
                              onChange={(e) => setInterviewFormData({ ...interviewFormData, [e.target.name]: e.target.value })}
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
                              value={interviewFormData.clarityOfAnswer}
                              onChange={(e) => setInterviewFormData({ ...interviewFormData, [e.target.name]: e.target.value })}
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
                              value={interviewFormData.overallHRLevel}
                              onChange={(e) => setInterviewFormData({ ...interviewFormData, [e.target.name]: e.target.value })}
                              required
                            >
                              <option value="">Select Level</option>
                              <option value="B">B - Beginner</option>
                              <option value="I">I - Intermediate</option>
                              <option value="A">A - Advanced</option>
                              <option value="E">E - Expert</option>
                            </select>
                          </div>
                          <div className="form-group left-align">
                            <label>Level Crossed? (Yes/No) *</label>
                            <select
                              name="levelCrossed"
                              value={String(interviewFormData.levelCrossed)}
                              onChange={(e) => setInterviewFormData({ ...interviewFormData, levelCrossed: e.target.value === "true" })}
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
                              value={interviewFormData.hrRemarks}
                              onChange={(e) => setInterviewFormData({ ...interviewFormData, [e.target.name]: e.target.value })}
                              rows="4"
                              placeholder="Add HR feedback and notes"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="form-group">
                            <label>Technical Knowledge (B/I/A/E) *</label>
                            <select
                              name="technicalKnowledge"
                              value={interviewFormData.technicalKnowledge}
                              onChange={(e) => setInterviewFormData({ ...interviewFormData, [e.target.name]: e.target.value })}
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
                              value={interviewFormData.problemSolving}
                              onChange={(e) => setInterviewFormData({ ...interviewFormData, [e.target.name]: e.target.value })}
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
                              value={interviewFormData.codingAbility}
                              onChange={(e) => setInterviewFormData({ ...interviewFormData, [e.target.name]: e.target.value })}
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
                              value={interviewFormData.logicAndApproach}
                              onChange={(e) => setInterviewFormData({ ...interviewFormData, [e.target.name]: e.target.value })}
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
                              value={interviewFormData.overallTechnicalLevel}
                              onChange={(e) => setInterviewFormData({ ...interviewFormData, [e.target.name]: e.target.value })}
                              required
                            >
                              <option value="">Select Level</option>
                              <option value="B">B - Beginner</option>
                              <option value="I">I - Intermediate</option>
                              <option value="A">A - Advanced</option>
                              <option value="E">E - Expert</option>
                            </select>
                          </div>
                          <div className="form-group left-align">
                            <label>Level Crossed? (Yes/No) *</label>
                            <select
                              name="levelCrossed"
                              value={String(interviewFormData.levelCrossed)}
                              onChange={(e) => setInterviewFormData({ ...interviewFormData, levelCrossed: e.target.value === "true" })}
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
                              value={interviewFormData.technicalRemarks}
                              onChange={(e) => setInterviewFormData({ ...interviewFormData, [e.target.name]: e.target.value })}
                              rows="4"
                              placeholder="Add technical feedback and notes"
                            />
                          </div>
                        </>
                      )}
                      <button type="submit" className="submit-btn record-submit-btn record-submit-btn-compact full-width" disabled={recordSubmitting}>
                        {recordSubmitting ? "Saving..." : "Save Interview Record"}
                      </button>
                    </form>

                  </div>
                )}

                {!recordsLoading && currentStudentTab === "aptitude" && (
                  <div className="record-section">
                    <h2 className="record-form-title">Add Aptitude Record</h2>
                    <div className="record-intro-card">
                      <strong>Aptitude Round Entry</strong>
                      <p>Capture round score, result, and trainer remarks in one place.</p>
                    </div>
                    <form onSubmit={handleAptitudeSubmit} className="record-form-grid">
                      <div className="form-group">
                        <label>Attendance *</label>
                        <select
                          name="attendanceStatus"
                          value={aptitudeFormData.attendanceStatus}
                          onChange={(e) => setAptitudeFormData({ ...aptitudeFormData, [e.target.name]: e.target.value })}
                          required
                        >
                          <option value="Present">Present</option>
                          <option value="Absent">Absent</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Aptitude Round Number *</label>
                        <input
                          type="number"
                          name="roundNumber"
                          value={aptitudeFormData.roundNumber}
                          onChange={(e) => setAptitudeFormData({ ...aptitudeFormData, [e.target.name]: e.target.value })}
                          min="1"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Score *</label>
                        <input
                          type="number"
                          name="score"
                          value={aptitudeFormData.score}
                          onChange={(e) => setAptitudeFormData({ ...aptitudeFormData, [e.target.name]: e.target.value })}
                          min="0"
                          max="100"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Result *</label>
                        <select
                          name="result"
                          value={aptitudeFormData.result}
                          onChange={(e) => setAptitudeFormData({ ...aptitudeFormData, [e.target.name]: e.target.value })}
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
                          value={aptitudeFormData.remarks}
                          onChange={(e) => setAptitudeFormData({ ...aptitudeFormData, [e.target.name]: e.target.value })}
                          rows="4"
                        />
                      </div>
                      <button type="submit" className="submit-btn record-submit-btn record-submit-btn-compact" disabled={recordSubmitting}>
                        {recordSubmitting ? "Saving..." : "Save Aptitude Record"}
                      </button>
                    </form>

                  </div>
                )}

                {!recordsLoading && currentStudentTab === "assessments" && (
                  <div className="record-section">
                    <h2 className="record-form-title">Add Assessment Record</h2>
                    <div className="record-intro-card">
                      <strong>Assessment Review</strong>
                      <p>Record assessment type, score, status, and actionable feedback.</p>
                    </div>
                    <form onSubmit={handleAssessmentSubmit} className="record-form-grid">
                      <div className="form-group">
                        <label>Attendance *</label>
                        <select
                          name="attendanceStatus"
                          value={assessmentFormData.attendanceStatus}
                          onChange={(e) => setAssessmentFormData({ ...assessmentFormData, [e.target.name]: e.target.value })}
                          required
                        >
                          <option value="Present">Present</option>
                          <option value="Absent">Absent</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Assessment Type *</label>
                        <select
                          name="assessmentType"
                          value={assessmentFormData.assessmentType}
                          onChange={(e) => setAssessmentFormData({ ...assessmentFormData, [e.target.name]: e.target.value })}
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
                          value={assessmentFormData.score}
                          onChange={(e) => setAssessmentFormData({ ...assessmentFormData, [e.target.name]: e.target.value })}
                          min="0"
                          max="100"
                        />
                      </div>
                      <div className="form-group">
                        <label>Status *</label>
                        <select
                          name="status"
                          value={assessmentFormData.status}
                          onChange={(e) => setAssessmentFormData({ ...assessmentFormData, [e.target.name]: e.target.value })}
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
                          value={assessmentFormData.feedback}
                          onChange={(e) => setAssessmentFormData({ ...assessmentFormData, [e.target.name]: e.target.value })}
                          rows="4"
                        />
                      </div>
                      <button type="submit" className="submit-btn record-submit-btn record-submit-btn-compact" disabled={recordSubmitting}>
                        {recordSubmitting ? "Saving..." : "Save Assessment Record"}
                      </button>
                    </form>

                  </div>
                )}

                {!recordsLoading && currentStudentTab === "training" && (
                  <div className="record-section">
                    <h2 className="record-form-title">Add Training Record</h2>
                    <div className="record-intro-card">
                      <strong>Training Session Update</strong>
                      <p>Log attendance, engagement, improvement notes, and session remarks.</p>
                    </div>
                    <form onSubmit={handleTrainingSubmit} className="record-form-grid">
                      <div className="form-group">
                        <label>Date *</label>
                        <input
                          type="date"
                          name="date"
                          value={trainingFormData.date}
                          onChange={(e) => setTrainingFormData({ ...trainingFormData, [e.target.name]: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Attendance *</label>
                        <select
                          name="attendance"
                          value={trainingFormData.attendance}
                          onChange={(e) => setTrainingFormData({ ...trainingFormData, [e.target.name]: e.target.value })}
                          required
                        >
                          <option value="Present">Present</option>
                          <option value="Absent">Absent</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Skill Improvement Note</label>
                        <textarea
                          name="skillImprovementNote"
                          value={trainingFormData.skillImprovementNote}
                          onChange={(e) => setTrainingFormData({ ...trainingFormData, [e.target.name]: e.target.value })}
                          rows="3"
                        />
                      </div>
                      <div className="form-group">
                        <label>Engagement Level *</label>
                        <select
                          name="engagementLevel"
                          value={trainingFormData.engagementLevel}
                          onChange={(e) => setTrainingFormData({ ...trainingFormData, [e.target.name]: e.target.value })}
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
                          value={trainingFormData.trainerRemarks}
                          onChange={(e) => setTrainingFormData({ ...trainingFormData, [e.target.name]: e.target.value })}
                          rows="4"
                        />
                      </div>
                      <button type="submit" className="submit-btn record-submit-btn record-submit-btn-compact" disabled={recordSubmitting}>
                        {recordSubmitting ? "Saving..." : "Save Training Record"}
                      </button>
                    </form>

                  </div>
                )}
                  </div>
                </div>

                {!recordsLoading && currentStudentTab && (
                  <div className="record-history record-history-below">
                    <div className="record-history-toolbar" style={{ marginBottom: "10px" }}>
                      <h2 className="record-history-title" style={{ marginBottom: 0 }}>
                        {currentStudentTab === "interviews"
                          ? "Interview History"
                          : currentStudentTab === "aptitude"
                            ? "Aptitude Test History"
                            : currentStudentTab === "assessments"
                              ? "Assessment History"
                              : "Training History"}
                      </h2>
                      <input
                        type="text"
                        placeholder="Search in history records..."
                        value={recordHistorySearch}
                        onChange={(e) => setRecordHistorySearch(e.target.value)}
                        className="interview-history-search"
                        style={{ maxWidth: "360px" }}
                      />
                    </div>

                    {currentStudentTab === "interviews" && (
                      filteredInterviews.length === 0 ? (
                        <p>{interviews.length === 0 ? "No interview records yet" : "No interview records match this search"}</p>
                      ) : (
                        <div className="record-table-wrap">
                          <table className="premium-table view-students-table student-records-history-table">
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Attendance</th>
                                <th>Attempt</th>
                                <th>Communication</th>
                                <th>Confidence</th>
                                <th>Clarity</th>
                                <th>Overall</th>
                                <th>Level Crossed</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredInterviews.map((interview, index) => (
                                <tr key={index}>
                                  <td>{new Date(interview.date).toLocaleDateString()}</td>
                                  <td>{interview.interviewType}</td>
                                  <td>{interview.attendanceStatus || "-"}</td>
                                  <td>{interview.attemptNumber}</td>
                                  <td>{interview.communicationLevel}</td>
                                  <td>{interview.confidenceLevel}</td>
                                  <td>{interview.clarityLevel}</td>
                                  <td>{interview.overallLevel}</td>
                                  <td>{interview.levelCrossed ? "Crossed" : "Not Crossed"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )
                    )}

                    {currentStudentTab === "aptitude" && (
                      filteredAptitudes.length === 0 ? (
                        <p>{aptitudes.length === 0 ? "No aptitude records yet" : "No aptitude records match this search"}</p>
                      ) : (
                        <div className="record-table-wrap">
                          <table className="premium-table view-students-table student-records-history-table">
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
                              {filteredAptitudes.map((apt, index) => (
                                <tr key={index}>
                                  <td>{apt.attendanceStatus || "-"}</td>
                                  <td>{apt.roundNumber}</td>
                                  <td>{apt.score}</td>
                                  <td>{apt.result}</td>
                                  <td>{apt.remarks || "-"}</td>
                                  <td>{new Date(apt.createdAt).toLocaleDateString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )
                    )}

                    {currentStudentTab === "assessments" && (
                      filteredAssessments.length === 0 ? (
                        <p>{assessments.length === 0 ? "No assessment records yet" : "No assessment records match this search"}</p>
                      ) : (
                        <div className="record-table-wrap">
                          <table className="premium-table view-students-table student-records-history-table">
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
                              {filteredAssessments.map((assessment, index) => (
                                <tr key={index}>
                                  <td>{assessment.attendanceStatus || "-"}</td>
                                  <td>{assessment.assessmentType}</td>
                                  <td>{assessment.score || "-"}</td>
                                  <td>{assessment.status}</td>
                                  <td>{assessment.feedback || "-"}</td>
                                  <td>{new Date(assessment.createdAt).toLocaleDateString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )
                    )}

                    {currentStudentTab === "training" && (
                      filteredTrainings.length === 0 ? (
                        <p>{trainings.length === 0 ? "No training records yet" : "No training records match this search"}</p>
                      ) : (
                        <div className="record-table-wrap">
                          <table className="premium-table view-students-table student-records-history-table">
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
                              {filteredTrainings.map((training, index) => (
                                <tr key={index}>
                                  <td>{new Date(training.date).toLocaleDateString()}</td>
                                  <td>{training.attendance}</td>
                                  <td>{training.engagementLevel}</td>
                                  <td>{training.skillImprovementNote || "-"}</td>
                                  <td>{training.trainerRemarks || "-"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === "notifications" && (
            <>
              <div className="premium-page-header">
                <div className="header-left">
                  <h1>Notifications</h1>
                  <p className="header-subtitle">
                    Stay updated with recent activities
                  </p>
                </div>
              </div>

              <div className="premium-card">
                <div className="premium-empty-state">
                  <div className="empty-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                  </div>
                  <p className="empty-title">No notifications</p>
                  <p className="empty-subtitle">
                    You're all caught up! New updates will appear here
                  </p>
                </div>
              </div>
            </>
          )}

          {activeTab === "profile" && (
            <>
              <div className="premium-page-header">
                <div className="header-left">
                  <h1>My Profile</h1>
                  <p className="header-subtitle">
                    Manage your personal information
                  </p>
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

              {successMessage && (
                <div
                  className="success-message"
                  style={{ marginBottom: "20px" }}
                >
                  {successMessage}
                </div>
              )}

              <div className="premium-card">
                <div className="premium-card-header">
                  <h2>Personal Information</h2>
                </div>

                <div className="profile-info-grid">
                  <div className="profile-field">
                    <label>Full Name</label>
                    <div className="field-value">{user?.name}</div>
                  </div>
                  <div className="profile-field">
                    <label>Email Address</label>
                    <div className="field-value mono-text">{user?.email}</div>
                  </div>
                  <div className="profile-field">
                    <label>Mobile Number</label>
                    <div className="field-value mono-text">
                      {user?.mobile || "Not available"}
                    </div>
                  </div>
                  <div className="profile-field">
                    <label>Role</label>
                    <div className="field-value">
                      <span className="badge-neutral">
                        {user?.role || "Trainer"}
                      </span>
                    </div>
                  </div>
                  <div className="profile-field">
                    <label>Custom Role</label>
                    <div className="field-value">{user?.customRole || "Not available"}</div>
                  </div>
                  <div className="profile-field">
                    <label>Joining Date</label>
                    <div className="field-value">{user?.joiningDate ? new Date(user.joiningDate).toLocaleDateString() : "Not available"}</div>
                  </div>
                  <div className="profile-field">
                    <label>Account Status</label>
                    <div className="field-value">
                      <span className="badge-neutral">{user?.status || "active"}</span>
                    </div>
                  </div>
                  <div className="profile-field">
                    <label>Total Students</label>
                    <div className="field-value">{students.length}</div>
                  </div>
                  <div className="profile-field">
                    <label>Assigned Groups</label>
                    <div className="field-value">{assignedGroups.length}</div>
                  </div>
                  <div className="profile-field">
                    <label>Work Assignments</label>
                    <div className="field-value">{workAssignments.length}</div>
                  </div>
                  <div className="profile-field">
                    <label>Profile Created</label>
                    <div className="field-value">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Not available"}</div>
                  </div>
                  <div className="profile-field">
                    <label>Last Updated</label>
                    <div className="field-value">{user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : "Not available"}</div>
                  </div>
                </div>

                <div className="info-banner">
                  <strong>Update Your Information</strong>
                  <p>
                    Click the "Edit Profile" button above to update your name,
                    email, mobile, joining date, custom role, or password.
                  </p>
                </div>
              </div>

              {/* Edit Profile Modal */}
              {showEditModal && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                  <div
                    className="modal-content"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="modal-header">
                      <h2>Edit Profile</h2>
                      <button
                        className="modal-close-btn"
                        onClick={handleCloseModal}
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleEditSubmit}>
                      {editError && (
                        <div
                          className="error-message"
                          style={{ marginBottom: "15px" }}
                        >
                          {editError}
                        </div>
                      )}

                      <div className="form-group">
                        <label htmlFor="edit-name">Full Name *</label>
                        <input
                          id="edit-name"
                          type="text"
                          name="name"
                          value={editFormData.name}
                          onChange={handleEditInputChange}
                          placeholder="Enter your full name"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="edit-email">Email Address *</label>
                        <input
                          id="edit-email"
                          type="email"
                          name="email"
                          value={editFormData.email}
                          onChange={handleEditInputChange}
                          placeholder="Enter your email address"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="edit-mobile">Mobile Number</label>
                        <input
                          id="edit-mobile"
                          type="tel"
                          name="mobile"
                          value={editFormData.mobile}
                          onChange={handleEditInputChange}
                          placeholder="Enter your mobile number"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="edit-joining-date">Joining Date</label>
                        <input
                          id="edit-joining-date"
                          type="date"
                          name="joiningDate"
                          value={editFormData.joiningDate}
                          onChange={handleEditInputChange}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="edit-custom-role">Custom Role</label>
                        <input
                          id="edit-custom-role"
                          type="text"
                          name="customRole"
                          value={editFormData.customRole}
                          onChange={handleEditInputChange}
                          placeholder="e.g. Senior Trainer"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="edit-password">
                          New Password (Optional)
                        </label>
                        <input
                          id="edit-password"
                          type="password"
                          name="password"
                          value={editFormData.password}
                          onChange={handleEditInputChange}
                          placeholder="Leave blank to keep current password"
                        />
                      </div>

                      {editFormData.password && (
                        <div className="form-group">
                          <label htmlFor="edit-confirm-password">
                            Confirm Password *
                          </label>
                          <input
                            id="edit-confirm-password"
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
                        <button
                          type="submit"
                          className="btn-primary"
                          disabled={editLoading}
                        >
                          {editLoading ? "Saving..." : "Save Changes"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default TrainerDashboard;
