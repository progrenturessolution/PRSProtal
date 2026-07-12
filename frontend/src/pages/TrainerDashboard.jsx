import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { trainerAPI } from "../services/api";
import logo from "../assets/logo.png";
import TrainerSidebar from "../components/TrainerSidebar";
import StudentRecordsSidebar from "../components/StudentRecordsSidebar";
import ErrorBoundary from "../components/ErrorBoundary";
import GdConductModal from "../components/GdConductModal";
import GdStudentConductModal from "../components/GdStudentConductModal";
import { renderNotificationMessage } from "../utils/notificationMessageFormatter";
import {
  NOTIFICATION_TYPE_GROUPS,
  markNotificationsReadLocally,
} from "../utils/notificationBadges";

function TrainerDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const notificationStorageKey = "trainer-notifications-last-seen";
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [trainerProfile, setTrainerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showTrainerPassword, setShowTrainerPassword] = useState(false);
  const [showTrainerConfirmPassword, setShowTrainerConfirmPassword] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedStudentTab, setSelectedStudentTab] = useState(null);
  const [studentFilter, setStudentFilter] = useState("all");
  const [studentSearch, setStudentSearch] = useState("");
  const [openStudentMenuId, setOpenStudentMenuId] = useState(null);
  const [openAssignmentMenuId, setOpenAssignmentMenuId] = useState(null);
  const [openGdMenuId, setOpenGdMenuId] = useState(null);
  const [openScheduledInterviewMenuId, setOpenScheduledInterviewMenuId] = useState(null);
  const [openScheduledGroupMenuId, setOpenScheduledGroupMenuId] = useState(null);
  const [openScheduledAssessmentMenuId, setOpenScheduledAssessmentMenuId] = useState(null);
  const [groupSearchQuery, setGroupSearchQuery] = useState("");
  const [groupStudentSearch, setGroupStudentSearch] = useState({});
  const [expandedGroups, setExpandedGroups] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [recordError, setRecordError] = useState("");
  const [recordSuccess, setRecordSuccess] = useState("");
  const [recordHistorySearch, setRecordHistorySearch] = useState("");
  const [recordSubmitting, setRecordSubmitting] = useState(false);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsSourceTab, setRecordsSourceTab] = useState("students");
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, openUpward: false });
  const [interviews, setInterviews] = useState([]);
  const [scheduledInterviews, setScheduledInterviews] = useState([]);
  const [scheduledGds, setScheduledGds] = useState([]);
  const [scheduledAssignments, setScheduledAssignments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [selectedGd, setSelectedGd] = useState(null);
  const [showGdModal, setShowGdModal] = useState(false);
  const [selectedGdStudentContext, setSelectedGdStudentContext] = useState(null);
  const [showGdStudentModal, setShowGdStudentModal] = useState(false);
  const [aptitudes, setAptitudes] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [workAssignmentsState, setWorkAssignmentsState] = useState([]);
  const [interviewFormData, setInterviewFormData] = useState({
    interviewType: "",
    attendanceStatus: "Present",
    date: new Date().toISOString().split("T")[0],
    attemptNumber: "",
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
    score: "",
    outOf: "",
  });
  const [aptitudeFormData, setAptitudeFormData] = useState({
    attendanceStatus: "Present",
    date: new Date().toISOString().split("T")[0],
    roundNumber: 1,
    score: "",
    outOf: "",
    result: "Pass",
    remarks: "",
  });
  const [assessmentFormData, setAssessmentFormData] = useState({
    attendanceStatus: "Present",
    date: new Date().toISOString().split("T")[0],
    assessmentType: "Domain",
    score: "",
    outOf: "",
    status: "Pending",
    feedback: "",
  });
  const [trainingFormData, setTrainingFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    attendance: "Present",
    skillImprovementNote: "",
    engagementLevel: "Medium",
    trainerRemarks: "",
    score: "",
    outOf: "",
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [isCustomInterviewType, setIsCustomInterviewType] = useState(false);
  const [isCustomAssessmentType, setIsCustomAssessmentType] = useState(false);
  const [gdFormData, setGdFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    attendanceStatus: "Present",
    participation: "",
    communication: "",
    confidence: "",
    topicUnderstanding: "",
    leadership: "",
    overallRemark: "",
    strengths: "",
    improvementAreas: "",
    score: "",
    outOf: "",
  });
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
  const [globalError, setGlobalError] = useState(null);
  const [interviewOnlyMode, setInterviewOnlyMode] = useState(false);
  const [lockedRecordTab, setLockedRecordTab] = useState(null); // when set, only this tab is available in student records
  const [hasUnreadTrainerIndividuals, setHasUnreadTrainerIndividuals] = useState(false);
  const [hasUnreadTrainerGroups, setHasUnreadTrainerGroups] = useState(false);
  const [hasUnreadTrainerGds, setHasUnreadTrainerGds] = useState(false);
  const [hasUnreadTrainerAssignments, setHasUnreadTrainerAssignments] = useState(false);

  const getLatestNotificationTimestamp = (items = []) => {
    return items.reduce((latest, item) => {
      const value = item?.createdAt ? new Date(item.createdAt).getTime() : 0;
      return value > latest ? value : latest;
    }, 0);
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

  useEffect(() => {
    const individuals = (scheduledInterviews || []).filter((s) => getScheduledInterviewMode(s) === 'Individual');
    const latestIndiv = getLatestActivityTimestamp(individuals);
    const lastSeenIndiv = Number(localStorage.getItem("trainer-scheduled-individuals-last-seen") || 0);
    setHasUnreadTrainerIndividuals(latestIndiv > lastSeenIndiv);
  }, [scheduledInterviews]);

  useEffect(() => {
    const groups = (scheduledInterviews || []).filter((s) => getScheduledInterviewMode(s) === 'Group');
    const latestGroup = getLatestActivityTimestamp(groups);
    const lastSeenGroup = Number(localStorage.getItem("trainer-scheduled-groups-last-seen") || 0);
    setHasUnreadTrainerGroups(latestGroup > lastSeenGroup);
  }, [scheduledInterviews]);

  useEffect(() => {
    const latestGd = getLatestActivityTimestamp(scheduledGds || []);
    const lastSeenGd = Number(localStorage.getItem("trainer-scheduled-gds-last-seen") || 0);
    setHasUnreadTrainerGds(latestGd > lastSeenGd);
  }, [scheduledGds]);

  useEffect(() => {
    const latestAssess = getLatestActivityTimestamp(scheduledAssignments || []);
    const lastSeenAssess = Number(localStorage.getItem("trainer-scheduled-assignments-last-seen") || 0);
    setHasUnreadTrainerAssignments(latestAssess > lastSeenAssess);
  }, [scheduledAssignments]);

  useEffect(() => {
    if (activeTab === "scheduled-individuals") {
      const individuals = (scheduledInterviews || []).filter((s) => getScheduledInterviewMode(s) === 'Individual');
      const latestIndiv = getLatestActivityTimestamp(individuals);
      localStorage.setItem("trainer-scheduled-individuals-last-seen", String(latestIndiv || Date.now()));
      setHasUnreadTrainerIndividuals(false);
    }
    if (activeTab === "scheduled-groups") {
      const groups = (scheduledInterviews || []).filter((s) => getScheduledInterviewMode(s) === 'Group');
      const latestGroup = getLatestActivityTimestamp(groups);
      localStorage.setItem("trainer-scheduled-groups-last-seen", String(latestGroup || Date.now()));
      setHasUnreadTrainerGroups(false);
    }
    if (activeTab === "scheduled-gds") {
      const latestGd = getLatestActivityTimestamp(scheduledGds || []);
      localStorage.setItem("trainer-scheduled-gds-last-seen", String(latestGd || Date.now()));
      setHasUnreadTrainerGds(false);
    }
    if (activeTab === "scheduled-assignments") {
      const latestAssess = getLatestActivityTimestamp(scheduledAssignments || []);
      localStorage.setItem("trainer-scheduled-assignments-last-seen", String(latestAssess || Date.now()));
      setHasUnreadTrainerAssignments(false);
    }
  }, [activeTab, scheduledInterviews, scheduledGds, scheduledAssignments]);
  


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

    try {
      setUser(JSON.parse(storedUser));
    } catch (err) {
      console.error('Failed to parse stored user', err);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      navigate('/');
      return;
    }

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

      if (openGdMenuId) {
        if (e.target.closest("[data-gd-menu]") || e.target.closest("[data-gd-menu-toggle]")) {
          return;
        }
        setOpenGdMenuId(null);
      }

      if (openScheduledInterviewMenuId) {
        if (e.target.closest("[data-scheduled-interview-menu]") || e.target.closest("[data-scheduled-interview-menu-toggle]")) {
          return;
        }
        setOpenScheduledInterviewMenuId(null);
      }

      if (openScheduledGroupMenuId) {
        if (e.target.closest("[data-scheduled-group-menu]") || e.target.closest("[data-scheduled-group-menu-toggle]")) {
          return;
        }
        setOpenScheduledGroupMenuId(null);
      }

      if (openScheduledAssessmentMenuId) {
        if (e.target.closest("[data-scheduled-assessment-menu]") || e.target.closest("[data-scheduled-assessment-menu-toggle]")) {
          return;
        }
        setOpenScheduledAssessmentMenuId(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openAssignmentMenuId, openStudentMenuId, openGdMenuId, openScheduledInterviewMenuId, openScheduledGroupMenuId, openScheduledAssessmentMenuId]);

  useEffect(() => {
    const onError = (event) => {
      const message = event?.message || (event?.reason && event.reason.message) || String(event);
      console.error('Global error captured:', event);
      setGlobalError({ message, stack: event?.error?.stack || (event?.reason && event.reason.stack) || '' });
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onError);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onError);
    };
  }, []);

  const refreshNotificationBadge = async () => {
    try {
      const response = await trainerAPI.getNotifications();
      if (!response.data?.success) return;

      const notes = response.data.notifications || [];
      setNotifications(notes);
      const unreadCount = response.data.unreadCount ?? response.data.unreadCounts?.general ?? 0;

      if (activeTab === "notifications") {
        await trainerAPI.markNotificationsRead(NOTIFICATION_TYPE_GROUPS.GENERAL);
        setHasUnreadNotifications(false);
        setNotifications((prev) => markNotificationsReadLocally(prev, NOTIFICATION_TYPE_GROUPS.GENERAL));
        return;
      }

      setHasUnreadNotifications(unreadCount > 0);
    } catch (error) {
      console.error("Failed to refresh trainer notification badge:", error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const [profileResult, studentsResult, scheduledInterviewsResult, workAssignmentsResult, notificationsResult, scheduledGdsResult] = await Promise.allSettled([
        trainerAPI.getProfile(),
        trainerAPI.getAssignedStudents(),
        trainerAPI.getScheduledInterviews(),
        trainerAPI.getWorkAssignments(),
        trainerAPI.getNotifications(),
        trainerAPI.getScheduledGDs(),
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

      if (workAssignmentsResult.status === 'fulfilled' && workAssignmentsResult.value.data.success) {
        setWorkAssignmentsState(workAssignmentsResult.value.data.workAssignments || []);
      }

      // Merge Test/Assessment notifications into scheduledAssignments so they show under Schedule Assessment
      if (notificationsResult.status === 'fulfilled' && notificationsResult.value.data.success) {
        try {
          const notes = notificationsResult.value.data.notifications || [];
          setNotifications(notes);
          const unreadCount = notificationsResult.value.data.unreadCount
            ?? notificationsResult.value.data.unreadCounts?.general
            ?? 0;
          setHasUnreadNotifications(unreadCount > 0);
          const assessments = notes.filter(n => n.notificationType === 'Test/Assessment');
          // map to activity-like objects used by the dashboard recentActivities logic
          const mapped = assessments.map(n => ({ type: 'Assessment', title: n.title, dateTime: new Date(n.createdAt).toLocaleString(), createdBy: n.createdBy?.email || 'Admin', status: n.activityId?.status || 'Scheduled', details: { notification: n } }));
          // Append these to scheduledAssignments (avoid duplicates)
          setScheduledAssignments(prev => {
            const existingKeys = new Set(prev.map(a => JSON.stringify(a.details?.notification?._id || a)));
            const toAdd = mapped.filter(m => !existingKeys.has(JSON.stringify(m.details?.notification?._id || m)));
            return [...toAdd, ...(prev || [])];
          });
        } catch (e) { console.debug('Failed to merge notifications', e); }
      }
      try {
        const raw = JSON.parse(localStorage.getItem('recentActivities') || '[]');
        console.debug('TrainerDashboard: recentActivities raw', raw);
        const trainerIdCandidates = [profileResult.status === 'fulfilled' && profileResult.value.data.user?._id, profileResult.status === 'fulfilled' && profileResult.value.data.user?.id, user?._id, user?.id].map(String).filter(Boolean);
        const myAssignments = (raw || []).filter(act => {
          // Allow flexible matching for type (case-insensitive, contains 'assign')
          const atype = String(act.type || '').toLowerCase();
          if (!atype.includes('assign')) return false; // skip non-assignment-like items
          try {
            // candidate ids and names for matching
            const trainerNames = [];
            if (profileResult.status === 'fulfilled' && profileResult.value.data.user?.name) trainerNames.push(String(profileResult.value.data.user.name).toLowerCase());
            if (user && user.name) trainerNames.push(String(user.name).toLowerCase());

            // check common fields that may contain trainer id
            const possibleTrainerIds = new Set();
            const f = act.details?.form || {};
            [f.trainerId, f.interviewer, f.interviewerId, f.assignedTrainerId, act.trainerId, act.interviewer, act.interviewerId, act.assignedTrainerId].forEach(x => { if (x) possibleTrainerIds.add(String(x)); });

            for (const pid of possibleTrainerIds) {
              if (trainerIdCandidates.includes(String(pid))) return true;
            }

            // check interviewer/trainer name fields
            const interviewerName = (f.interviewerName || f.otherInterviewerName || act.details?.interviewerName || act.details?.otherInterviewerName || f.trainerName || act.trainerName || '');
            if (interviewerName && trainerNames.includes(String(interviewerName).toLowerCase())) return true;

            // fallback: check assigned students intersection with trainer's assigned students
            if (Array.isArray(act.details?.assigned) && act.details.assigned.length) {
              const assignedIds = act.details.assigned.map(String);
              const trainerStudents = (profileResult.status === 'fulfilled' && Array.isArray(profileResult.value.data.user?.assignedStudents)) ? (profileResult.value.data.user.assignedStudents || []).map(s => String(s._id || s.id || s)) : [];
              if (trainerStudents.some(ts => assignedIds.includes(ts))) return true;
            }

            // last resort: stringify the activity and search for trainer id or name
            const text = JSON.stringify(act).toLowerCase();
            for (const tid of trainerIdCandidates) {
              if (text.includes(String(tid).toLowerCase())) return true;
            }
            for (const tn of trainerNames) {
              if (text.includes(tn)) return true;
            }
          } catch (e) { console.debug('TrainerDashboard: assignment match error', e); }
          return false;
        });
        console.debug('TrainerDashboard: trainerIdCandidates', trainerIdCandidates, 'myAssignments count', myAssignments.length);
        // Merge local recentActivities assignments with any existing assignments (notifications)
        setScheduledAssignments(prev => {
          const existing = Array.isArray(prev) ? prev : [];
          const combined = Array.isArray(myAssignments) ? [...myAssignments, ...existing] : [...existing];
          // dedupe by a simple key: title + dateTime or notification id if present
          const seen = new Set();
          const deduped = [];
          for (const a of combined) {
            const notifId = a.details?.notification?._id;
            const key = notifId ? `n:${notifId}` : `${(a.title||'')}_${(a.dateTime||a.details?.form?.date||'')}`;
            if (!seen.has(key)) { seen.add(key); deduped.push(a); }
          }
          return deduped;
        });
      } catch (e) { console.debug('TrainerDashboard: failed reading recentActivities', e); setScheduledAssignments([]); }
      // merge scheduled GDs into the view area if any
      // (we will render both scheduledInterviews and scheduledGds together where appropriate)

      const trainerIdCandidates = [profileResult.status === 'fulfilled' && profileResult.value.data.user?._id, profileResult.status === 'fulfilled' && profileResult.value.data.user?.id, user?._id, user?.id].map(String).filter(Boolean);
      const trainerNames = [];
      if (profileResult.status === 'fulfilled' && profileResult.value.data.user?.name) trainerNames.push(String(profileResult.value.data.user.name).toLowerCase());
      if (user && user.name) trainerNames.push(String(user.name).toLowerCase());

      // Prefer backend scheduled GDs, with a localStorage fallback for older records.
      try {
        if (scheduledGdsResult.status === 'fulfilled' && scheduledGdsResult.value.data.success) {
          setScheduledGds(scheduledGdsResult.value.data.activities || []);
        } else {
          const raw = JSON.parse(localStorage.getItem('scheduledGDs') || '[]');
          const myGds = (raw || []).filter((act) => {
            try {
              const details = act?.details || {};
              const form = details.form || {};
              const possibleTrainerIds = [
                details.interviewerId,
                details.trainerId,
                details.assignedTrainerId,
                form.interviewer,
                form.interviewerId,
                form.trainerId,
                form.assignedTrainerId,
                act.createdBy,
              ].filter(Boolean).map(String);
              if (possibleTrainerIds.some((value) => trainerIdCandidates.includes(String(value)))) return true;

              const possibleTrainerNames = [
                details.interviewerName,
                details.trainerName,
                details.otherInterviewerName,
                form.interviewerName,
                form.trainerName,
                form.otherInterviewerName,
              ].filter(Boolean).map((value) => String(value).toLowerCase());
              if (possibleTrainerNames.some((value) => trainerNames.includes(value))) return true;
            } catch (error) {}
            return false;
          });
          setScheduledGds(myGds || []);
        }
      } catch (e) { setScheduledGds([]); }
    } catch (error) {
      console.error("Error fetching trainer dashboard data:", error);
    }
  };

  useEffect(() => {
    if ((['scheduled-assignments', 'scheduled-gds', 'notifications', 'scheduled-individuals', 'scheduled-groups'].includes(activeTab)) && user) {
      fetchDashboardData();
    }
  }, [activeTab, user]);

  useEffect(() => {
    if (!user) return undefined;

    refreshNotificationBadge();
    const interval = setInterval(refreshNotificationBadge, 15000);
    return () => clearInterval(interval);
  }, [activeTab, user]);

  useEffect(() => {
    const markGeneralNotificationsRead = async () => {
      if (activeTab !== "notifications") return;

      try {
        await trainerAPI.markNotificationsRead(NOTIFICATION_TYPE_GROUPS.GENERAL);
        setHasUnreadNotifications(false);
        setNotifications((prev) => markNotificationsReadLocally(prev, NOTIFICATION_TYPE_GROUPS.GENERAL));
        const refreshed = await trainerAPI.getNotifications();
        if (refreshed.data?.success) {
          setNotifications(refreshed.data.notifications || []);
        }
      } catch (error) {
        console.error("Failed to mark trainer notifications read:", error);
      }
    };

    markGeneralNotificationsRead();
  }, [activeTab]);

  // clear any locked tab when leaving the student-records view
  useEffect(() => {
    if (activeTab !== 'student-records' && lockedRecordTab) {
      setLockedRecordTab(null);
    }
  }, [activeTab, lockedRecordTab]);

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
      if (interviewFormData.score) cleanedData.score = parseFloat(interviewFormData.score);
      if (interviewFormData.outOf) cleanedData.outOf = parseFloat(interviewFormData.outOf);
      const response = await trainerAPI.addInterview(cleanedData);
      if (response.data.success) {
        setRecordSuccess("Interview record added successfully!");
        setIsCustomInterviewType(false);
        setInterviewFormData({
          interviewType: "",
          attendanceStatus: "Present",
          date: new Date().toISOString().split("T")[0],
          attemptNumber: "",
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
          score: "",
          outOf: "",
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
        date: aptitudeFormData.date,
        roundNumber: aptitudeFormData.roundNumber,
        score: parseFloat(aptitudeFormData.score),
        result: aptitudeFormData.result,
      };
      if (aptitudeFormData.outOf) {
        cleanedData.outOf = parseFloat(aptitudeFormData.outOf);
      }
      // Only add remarks if present
      if (aptitudeFormData.remarks) {
        cleanedData.remarks = aptitudeFormData.remarks;
      }
      const response = await trainerAPI.addAptitude(cleanedData);
      if (response.data.success) {
        setRecordSuccess("Aptitude record added successfully!");
        setAptitudeFormData({
          attendanceStatus: "Present",
          date: new Date().toISOString().split("T")[0],
          roundNumber: "",
          score: "",
          outOf: "",
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
        date: assessmentFormData.date,
        assessmentType: assessmentFormData.assessmentType,
        status: assessmentFormData.status,
      };
      // Only add score if present and is a valid number
       if (assessmentFormData.score && assessmentFormData.score !== "") {
        cleanedData.score = parseFloat(assessmentFormData.score);
      }
      if (assessmentFormData.outOf && assessmentFormData.outOf !== "") {
        cleanedData.outOf = parseFloat(assessmentFormData.outOf);
      }
      // Only add feedback if present
      if (assessmentFormData.feedback) {
        cleanedData.feedback = assessmentFormData.feedback;
      }
      const response = await trainerAPI.addAssessment(cleanedData);
      if (response.data.success) {
        setRecordSuccess("Assessment record added successfully!");
        setIsCustomAssessmentType(false);
        setAssessmentFormData({
          attendanceStatus: "Present",
          date: new Date().toISOString().split("T")[0],
          assessmentType: "Domain",
          score: "",
          outOf: "",
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
      if (cleanedData.score) cleanedData.score = parseFloat(cleanedData.score);
      if (cleanedData.outOf) cleanedData.outOf = parseFloat(cleanedData.outOf);
      const response = await trainerAPI.addTraining(cleanedData);
      if (response.data.success) {
        setRecordSuccess("Training record added successfully!");
        setTrainingFormData({
          date: new Date().toISOString().split("T")[0],
          attendance: "Present",
          skillImprovementNote: "",
          engagementLevel: "Medium",
          trainerRemarks: "",
          score: "",
          outOf: "",
        });
        fetchStudentRecords(selectedStudent._id);
      }
    } catch (error) {
      setRecordError(error.response?.data?.message || "Failed to add training record");
    } finally {
      setRecordSubmitting(false);
    }
  };

  const handleGdSubmit = (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    try {
      const gdId = (selectedGd && (selectedGd._id || selectedGd.title)) || 'general';
      const storageKey = `gdStudentEvaluations:${String(gdId)}`;
      const studentIdVal = selectedStudent._id || selectedStudent.internId || selectedStudent.id;
      const current = JSON.parse(localStorage.getItem(storageKey) || "[]");
      const next = current.filter((item) => String(item.studentId) !== String(studentIdVal));
      next.push({
        studentId: studentIdVal,
        studentName: selectedStudent.name || selectedStudent.internId || "Student",
        gdId: gdId,
        gdTitle: (selectedGd && (selectedGd.title || selectedGd.details?.form?.title)) || "GD",
        savedAt: new Date().toISOString(),
        form: gdFormData,
      });
      localStorage.setItem(storageKey, JSON.stringify(next));
      setRecordSuccess("GD evaluation saved locally");
      setGdFormData({
        date: new Date().toISOString().split("T")[0],
        attendanceStatus: "Present",
        participation: "",
        communication: "",
        confidence: "",
        topicUnderstanding: "",
        leadership: "",
        overallRemark: "",
        strengths: "",
        improvementAreas: "",
        score: "",
        outOf: "",
      });
      setTimeout(() => setRecordSuccess(""), 3000);
      // refresh records if needed
      fetchStudentRecords(selectedStudent._id).catch(() => {});
    } catch (error) {
      console.error('Failed to save GD record', error);
      setRecordError('Failed to save GD record');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
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

    if (!editFormData.password || !editFormData.confirmPassword) {
      setEditError("Please enter and confirm your new password");
      setEditLoading(false);
      return;
    }

    if (editFormData.password !== editFormData.confirmPassword) {
      setEditError("Passwords do not match");
      setEditLoading(false);
      return;
    }

    try {
      const updateData = {
        password: editFormData.password,
      };

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

        setSuccessMessage("Password changed successfully!");
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

  const handleToggleSingleGroup = (groupId) => {
    setExpandedGroups((prev) => (prev[groupId] ? {} : { [groupId]: true }));
  };

  const getScheduledGdGroupKey = (gd, group, groupIdx) => {
    const gdKey = gd?._id || gd?.id || gd?.title || gd?.details?.form?.title || "gd";
    const groupKey = group?._id || group?.id || group?.groupNumber || group?.groupName || groupIdx;
    return `scheduled-gd-${String(gdKey)}-group-${String(groupKey)}-${groupIdx}`;
  };

  const openStudentRecords = (student, sourceMenuSetter, options = {}) => {
    try {
      setRecordsSourceTab(activeTab);
      // openStudentRecords called
      if (!student || typeof student !== "object" || !student._id) {
        console.warn("openStudentRecords: invalid student", student);
        setRecordError("Invalid student selected");
        if (sourceMenuSetter) sourceMenuSetter(null);
        return;
      }

      // Determine interview-only mode:
      // - If explicitly forced via options.forceInterviewOnly => true
      // - Else if a defaultTab is provided, only set to true when it's 'interviews'
      // - Otherwise, keep legacy behavior for activity management tabs
      const defaultTab = options.defaultTab;
      const interviewOnly = Boolean(options.forceInterviewOnly) || (defaultTab ? defaultTab === "interviews" : (activeTab === "activity-individuals" || activeTab === "activity-groups"));
      setInterviewOnlyMode(interviewOnly);
      // allow locking the records sidebar to a specific tab (e.g. 'gd' or 'assessments')
      setLockedRecordTab(options.lockedTab || null);
      // allow passing a GD context when opening student records (so the GD tab can be preselected)
      setSelectedGd(options.gd || null);
      clearRecordMessages();
      setRecordHistorySearch("");
      setSelectedStudent(student);
      setSelectedStudentTab(options.defaultTab || "interviews");
      setActiveTab("student-records");
      // fetch and handle errors internally
      fetchStudentRecords(student._id).catch((err) => {
        console.error("fetchStudentRecords failed for", student._id, err);
        setRecordError("Failed to load student records");
      });
    } catch (err) {
    console.error("Error in openStudentRecords", err);
    setRecordError("Something went wrong while opening student records");
    } finally {
      if (sourceMenuSetter) {
        try { sourceMenuSetter(null); } catch (e) { /* ignore */ }
      }
    }
  };

  const handleGroupStudentSearchChange = (groupId, value) => {
    setGroupStudentSearch((prev) => ({
      ...prev,
      [groupId]: value,
    }));
  };

  const calculateMenuPosition = (event, width = 160) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const menuHeight = 150; 
    const openUpward = spaceBelow < menuHeight && spaceAbove > spaceBelow;

    setMenuPosition({
      top: openUpward ? rect.top + window.scrollY - 4 : rect.bottom + window.scrollY + 4,
      left: rect.right - width + window.scrollX,
      openUpward,
    });
  };

  // Helper function to enrich student data with full details from the students array
  const enrichStudentData = (student) => {
    let studentObj = student;
    if (student && typeof student !== "object") {
      // It's a string ID, username, or email. Search in students array!
      const found = (students || []).find(s => String(s._id || s.id) === String(student) || String(s.internId) === String(student) || String(s.email) === String(student));
      if (found) {
        studentObj = found;
      } else {
        // Return a fallback object so isStudentObject is true and we can still conduct the activity!
        return { _id: String(student), name: "Intern", internId: "-", email: "-", mobile: "-", studentType: "-", status: "Active" };
      }
    }
    
    if (!studentObj || typeof studentObj !== "object") return studentObj;

    // If student already has email, mobile, studentType, and status, return as-is
    if (studentObj.email && studentObj.mobile && studentObj.studentType && studentObj.status) return studentObj;
    
    // Try to find matching student by _id or internId in the students array
    const studentId = studentObj._id || studentObj.id;
    const internId = studentObj.internId;
    
    let matchedStudent = null;
    if (studentId) {
      matchedStudent = (students || []).find(s => s._id === studentId || s.id === studentId);
    }
    if (!matchedStudent && internId) {
      matchedStudent = (students || []).find(s => s.internId === internId);
    }
    
    // If we found a match, merge the data
    if (matchedStudent) {
      return {
        ...studentObj,
        ...matchedStudent,
        email: studentObj.email || matchedStudent.email || "-",
        mobile: studentObj.mobile || matchedStudent.mobile || "-",
        studentType: studentObj.studentType || matchedStudent.studentType || "-",
        status: studentObj.status || matchedStudent.status || "Active",
      };
    }
    
    return {
      ...studentObj,
      email: studentObj.email || "-",
      mobile: studentObj.mobile || "-",
      studentType: studentObj.studentType || "-",
      status: studentObj.status || "Active",
    };
  };

  const resolveAssessmentStudent = (assessment) => {
    const candidateList = [];
    if (Array.isArray(assessment?.details?.assigned)) candidateList.push(...assessment.details.assigned);
    if (Array.isArray(assessment?.details?.notification?.assessmentMeta?.assignedIds)) candidateList.push(...assessment.details.notification.assessmentMeta.assignedIds);

    for (const candidate of candidateList) {
      if (candidate && typeof candidate === "object") {
        const enriched = enrichStudentData(candidate);
        if (enriched?._id) return enriched;
      }

      const candidateId = String(candidate || "").trim();
      if (!candidateId) continue;

      const found = (students || []).find((student) => {
        const studentId = String(student?._id || student?.id || "");
        const internId = String(student?.internId || "");
        const name = String(student?.name || "").toLowerCase();
        return studentId === candidateId || internId === candidateId || name === candidateId.toLowerCase();
      });

      if (found) return enrichStudentData(found);
    }

    return null;
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  const assignedGroups = trainerProfile?.assignedGroups || [];
  // prefer explicit workAssignments state fetched from API; fallback to profile data
  const workAssignments = (workAssignmentsState && workAssignmentsState.length ? workAssignmentsState : (trainerProfile?.workAssignments || []));
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

  const getScheduledInterviewMode = (interview) => {
    const rawMode = interview?.mode || interview?.details?.form?.mode || interview?.details?.mode || (interview?.groupId || interview?.details?.groupId ? "Group" : "Individual");
    return String(rawMode).toLowerCase() === "group" ? "Group" : "Individual";
  };

  const getScheduledAssessmentMode = (assessment) => {
    const hasGroupId = assessment?.details?.notification?.assessmentMeta?.groupId || 
                       assessment?.details?.groupId || 
                       assessment?.details?.form?.groupId || 
                       assessment?.groupId;
    return hasGroupId ? "Group" : "Individual";
  };

  const filteredInterviews = interviews.filter((interview) =>
    matchesHistorySearch(
      interview.date ? new Date(interview.date).toLocaleDateString() : "",
      interview.interviewType,
      interview.attendanceStatus,
      interview.attemptNumber,
      interview.communicationLevel,
      interview.confidenceLevel,
      interview.clarityLevel || interview.clarityOfAnswer,
      interview.overallLevel || (interview.interviewType === "Technical" ? interview.overallTechnicalLevel : interview.overallHRLevel),
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
      apt.date ? new Date(apt.date).toLocaleDateString() : apt.createdAt ? new Date(apt.createdAt).toLocaleDateString() : "",
    ),
  );

  const filteredAssessments = assessments.filter((assessment) =>
    matchesHistorySearch(
      assessment.attendanceStatus,
      assessment.assessmentType,
      assessment.score,
      assessment.status,
      assessment.feedback,
      assessment.date ? new Date(assessment.date).toLocaleDateString() : assessment.createdAt ? new Date(assessment.createdAt).toLocaleDateString() : "",
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

  const filteredGdEvaluations = (() => {
    if (!selectedStudent) return [];

    const studentIdVal = selectedStudent._id || selectedStudent.internId || selectedStudent.id;
    if (!studentIdVal) return [];

    const allEvaluations = [];

    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key || !key.startsWith("gdStudentEvaluations:")) continue;

      try {
        const raw = JSON.parse(localStorage.getItem(key) || "[]");
        if (!Array.isArray(raw)) continue;

        raw.forEach((item) => {
          if (String(item?.studentId) !== String(studentIdVal)) return;
          allEvaluations.push(item);
        });
      } catch {
        // Ignore malformed localStorage entries.
      }
    }

    return allEvaluations
      .filter((item) =>
        matchesHistorySearch(
          item?.gdTitle,
          item?.form?.date ? new Date(item.form.date).toLocaleDateString() : item?.savedAt ? new Date(item.savedAt).toLocaleDateString() : "",
          item?.form?.participation,
          item?.form?.communication,
          item?.form?.confidence,
          item?.form?.topicUnderstanding,
          item?.form?.leadership,
          item?.form?.overallRemark,
          item?.form?.strengths,
          item?.form?.improvementAreas,
        ),
      )
      .sort((a, b) => {
        const aTime = a?.form?.date ? new Date(a.form.date).getTime() : a?.savedAt ? new Date(a.savedAt).getTime() : 0;
        const bTime = b?.form?.date ? new Date(b.form.date).getTime() : b?.savedAt ? new Date(b.savedAt).getTime() : 0;
        return bTime - aTime;
      });
  })();

  const profileDisplayName = user?.name || "Trainer";
  const profileRole = user?.customRole || user?.role || "Trainer";
  const profileStatus = user?.status || "active";
  const profileInitial = profileDisplayName.charAt(0).toUpperCase();
  const hasDisplayValue = (value) => value !== null && value !== undefined && String(value).trim() !== "";

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
        showNotificationDot={hasUnreadNotifications}
        hasUnreadTrainerIndividuals={hasUnreadTrainerIndividuals}
        hasUnreadTrainerGroups={hasUnreadTrainerGroups}
        hasUnreadTrainerGds={hasUnreadTrainerGds}
        hasUnreadTrainerAssignments={hasUnreadTrainerAssignments}
        openConductGd={() => {
          const gd = {
            _id: `live-gd-${Date.now()}`,
            title: 'Live Group Discussion',
            details: {
              form: {
                title: 'Live Group Discussion',
                date: new Date().toISOString().split('T')[0],
                startTime: '',
                groups: trainerProfile?.assignedGroups || []
              }
            }
          };
          setSelectedGd(gd);
          setShowGdModal(true);
        }}
      />

      {globalError && (
        <div style={{ position: 'fixed', top: 80, right: 20, zIndex: 9999, background: '#fee2e2', color: '#b91c1c', padding: 12, borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.12)', maxWidth: 480 }}>
          <strong>Runtime error:</strong>
          <div style={{ fontSize: 13, marginTop: 6 }}>{globalError.message}</div>
          {globalError.stack && <details style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{globalError.stack}</details>}
        </div>
      )}

      

      {/* Clean Enterprise Content */}
      <ErrorBoundary>
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
                  <h2>Upcoming Scheduled Activities</h2>
                </div>
                <div style={{ padding: "16px 20px" }}>
                  {((scheduledInterviews.length === 0) && (scheduledGds.length === 0)) ? (
                    <p className="record-history-empty">No scheduled interviews or GDs yet</p>
                  ) : (
                    <div className="table-container">
                      <table className="data-table view-students-table interview-schedule-table">
                        <thead>
                          <tr>
                            <th>Student / Group</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Interview Type</th>
                            <th>Mode</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...scheduledInterviews, ...scheduledGds].slice(0,5).map((interview, idx) => (
                            <tr key={interview._id || interview.title || idx}>
                              <td>
                                {(interview.type === 'GD' || interview.details?.form?.groupMode || interview.mode === 'Group')
                                  ? (interview.title || interview.groupName || 'Group Discussion')
                                  : (interview.studentId?.name || '-')}
                              </td>
                              <td>{(interview.date || interview.dateTime || interview.details?.form?.date) ? new Date(interview.date || interview.dateTime || interview.details?.form?.date).toLocaleDateString() : '-'}</td>
                              <td>{interview.startTime || interview.details?.form?.startTime || '-'}</td>
                              <td>{interview.interviewType || (interview.type === 'GD' ? 'GD' : '-')}</td>
                              <td>{interview.mode || (interview.type === 'GD' ? 'Group' : 'Individual')}</td>
                              <td>
                                <span className={`status-badge ${
                                  String(interview.status).toLowerCase() === 'completed'
                                    ? 'status-completed'
                                    : String(interview.status).toLowerCase() === 'cancelled'
                                      ? 'status-inactive'
                                      : 'status-pending'
                                }`}>
                                  {interview.status || 'Scheduled'}
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

          {activeTab === "scheduled-individuals" && (
            <div className="premium-card" style={{ marginTop: "24px" }}>
              <div className="premium-card-header">
                <h2>Scheduled — Individual Interviews</h2>
              </div>
              <div style={{ padding: "16px 20px" }}>
                {scheduledInterviews.filter((s) => getScheduledInterviewMode(s) === 'Individual').length === 0 ? (
                  <p className="record-history-empty">No individual scheduled interviews yet</p>
                ) : (
                  <div className="table-container">
                    <table className="data-table view-students-table interview-schedule-table">
                      <thead>
                        <tr>
                          <th>Student Name</th>
                          <th>Date</th>
                          <th>Time</th>
                          <th>Interview Type</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scheduledInterviews.filter((s) => getScheduledInterviewMode(s) === 'Individual').map((interview) => (
                          <tr key={interview._id}>
                            <td>{interview.studentId?.name || '-'}</td>
                            <td>{interview.date ? new Date(interview.date).toLocaleDateString() : '-'}</td>
                            <td>{interview.startTime || '-'}</td>
                            <td>{interview.interviewType || '-'}</td>
                            <td>
                              <span className={`status-badge ${
                                String(interview.status).toLowerCase() === 'completed'
                                  ? 'status-completed'
                                  : String(interview.status).toLowerCase() === 'cancelled'
                                    ? 'status-inactive'
                                    : 'status-pending'
                              }`}>{interview.status || 'Scheduled'}</span>
                            </td>
                            <td style={{ position: "relative" }}>
                              <button
                                data-scheduled-interview-menu-toggle
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenScheduledInterviewMenuId((prev) => (prev === interview._id ? null : interview._id));
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
                                aria-label={`Open actions for ${interview.studentId?.name || "student"}`}
                              >
                                ⋮
                              </button>

                              {openScheduledInterviewMenuId === interview._id && (
                                <div
                                  data-scheduled-interview-menu
                                  style={{
                                    position: "absolute",
                                    right: 0,
                                    top: "42px",
                                    background: "#ffffff",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "12px",
                                    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
                                    zIndex: 1000,
                                    minWidth: "170px",
                                    overflow: "hidden",
                                  }}
                                >
                                  <button
                                    onClick={() => {
                                      openStudentRecords(interview.studentId, setOpenScheduledInterviewMenuId, { forceInterviewOnly: true });
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
                                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
                                  >
                                    Conduct Interview
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
          {showGdModal && selectedGd && (
            <GdConductModal gd={selectedGd} onClose={() => setShowGdModal(false)} onSave={() => { setShowGdModal(false); fetchDashboardData(); }} />
          )}

          {showGdStudentModal && selectedGdStudentContext && (
            <GdStudentConductModal
              gd={selectedGdStudentContext.gd}
              student={selectedGdStudentContext.student}
              onClose={() => {
                setShowGdStudentModal(false);
                setSelectedGdStudentContext(null);
              }}
              onSave={() => {
                setShowGdStudentModal(false);
                setSelectedGdStudentContext(null);
              }}
            />
          )}

          {activeTab === "scheduled-groups" && (
            <div className="premium-card" style={{ marginTop: "24px" }}>
              <div className="premium-card-header">
                <h2>Scheduled — Group Interviews</h2>
              </div>
              <div style={{ padding: "16px 20px" }}>
                {(() => {
                  const scheduledGroupInterviews = scheduledInterviews.filter((s) => getScheduledInterviewMode(s) === "Group");
                  const groupedScheduledInterviews = scheduledGroupInterviews.reduce((acc, interview) => {
                    const groupKey = String(interview.groupId || interview.details?.groupId || interview.groupName || interview.details?.form?.groupName || interview.title || "group");
                    if (!acc[groupKey]) {
                      acc[groupKey] = {
                        id: groupKey,
                        groupName: interview.groupName || interview.details?.form?.groupName || interview.title || "Unnamed Group",
                        groupNumber: interview.groupNumber || interview.details?.form?.groupNumber || null,
                        interviews: [],
                      };
                    }
                    acc[groupKey].interviews.push(interview);
                    return acc;
                  }, {});

                  const scheduledGroupCards = Object.values(groupedScheduledInterviews);

                  const scheduledGroupQuery = groupSearchQuery.trim().toLowerCase();
                  const filteredScheduledGroupCards = scheduledGroupCards.filter((group) => {
                    if (!scheduledGroupQuery) return true;
                    const baseMatch = [group.groupName, group.groupNumber]
                      .filter(Boolean)
                      .some((value) => String(value).toLowerCase().includes(scheduledGroupQuery));
                    if (baseMatch) return true;
                    return group.interviews.some((interview) => {
                      const student = interview.studentId;
                      return [student?.name, student?.internId, student?.email, student?.mobile, interview.interviewType, interview.status]
                        .filter(Boolean)
                        .some((value) => String(value).toLowerCase().includes(scheduledGroupQuery));
                    });
                  });

                  if (scheduledGroupCards.length === 0) {
                    return <p className="record-history-empty">No group scheduled interviews yet</p>;
                  }

                  if (filteredScheduledGroupCards.length === 0) {
                    return <p className="record-history-empty">No group scheduled interviews match this search</p>;
                  }

                  return (
                    <div style={{ overflowX: "auto" }}>
                      <div style={{ marginBottom: "12px" }}>
                        <input
                          type="text"
                          value={groupSearchQuery}
                          onChange={(e) => setGroupSearchQuery(e.target.value)}
                          placeholder="Search scheduled groups by group name, student name, ID, email..."
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

                      {filteredScheduledGroupCards.map((group) => {
                        const groupInterviews = Array.isArray(group.interviews) ? group.interviews : [];
                        const groupId = group.id;
                        const isExpanded = !!expandedGroups[groupId];
                        const groupStudentQuery = (groupStudentSearch[groupId] || "").trim().toLowerCase();
                        const visibleGroupInterviews = groupInterviews.filter((interview) => {
                          if (!groupStudentQuery) return true;
                          const student = interview.studentId || {};
                          return [student.name, student.internId, student.email, student.mobile, interview.interviewType, interview.status]
                            .filter(Boolean)
                            .some((value) => String(value).toLowerCase().includes(groupStudentQuery));
                        });

                        return (
                          <div key={groupId} style={{ marginBottom: "16px", border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
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
                              onClick={() => handleToggleGroup(groupId)}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1 }}>
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
                                  {groupInterviews.length} Student{groupInterviews.length !== 1 ? "s" : ""}
                                </span>
                                <span style={{ color: "#344158", fontSize: "12px", fontWeight: "700" }}>
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
                                    placeholder="Search students in this scheduled group by name, ID, email, mobile..."
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

                                {groupInterviews.length === 0 ? (
                                  <div style={{ textAlign: "center", color: "#9ca3af", padding: "20px" }}>
                                    <p>No students in this scheduled group</p>
                                  </div>
                                ) : visibleGroupInterviews.length === 0 ? (
                                  <div style={{ textAlign: "center", color: "#9ca3af", padding: "20px" }}>
                                    <p>No students match this search</p>
                                  </div>
                                ) : (
                                  <div style={{ overflowX: "auto" }}>
                                    <table className="data-table view-students-table" style={{ minWidth: "1100px", marginBottom: 0 }}>
                                      <thead>
                                        <tr>
                                          <th style={{ minWidth: "40px", width: "40px" }}>#</th>
                                          <th style={{ minWidth: "80px", width: "80px" }}>ID</th>
                                          <th style={{ minWidth: "120px", width: "120px" }}>Student</th>
                                          <th style={{ minWidth: "150px", width: "150px" }}>Email</th>
                                          <th style={{ minWidth: "100px", width: "100px" }}>Mobile</th>
                                          <th style={{ minWidth: "90px", width: "90px" }}>Date</th>
                                          <th style={{ minWidth: "80px", width: "80px" }}>Time</th>
                                          <th style={{ minWidth: "100px", width: "100px" }}>Type</th>
                                          <th style={{ minWidth: "80px", width: "80px" }}>Status</th>
                                          <th style={{ minWidth: "60px", width: "60px" }}>Actions</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {visibleGroupInterviews.map((interview, index) => {
                                          const student = enrichStudentData(interview.studentId || {});
                                          const isStudentObject = student && typeof student === "object";
                                          const studentId = isStudentObject ? student._id : String(student || "");
                                          const menuId = `${groupId}-${studentId || index}`;
                                          return (
                                            <tr key={menuId}>
                                              <td>{index + 1}</td>
                                              <td>{isStudentObject ? student.internId || "-" : "-"}</td>
                                              <td>{isStudentObject ? student.name || "-" : "-"}</td>
                                              <td><span style={{ wordBreak: "break-word" }}>{isStudentObject ? student.email || "-" : "-"}</span></td>
                                              <td>{isStudentObject ? student.mobile || "-" : "-"}</td>
                                              <td>{interview.date ? new Date(interview.date).toLocaleDateString() : interview.dateTime ? new Date(interview.dateTime).toLocaleDateString() : "-"}</td>
                                              <td>{interview.startTime || interview.details?.form?.startTime || "-"}</td>
                                              <td>{interview.interviewType || "-"}</td>
                                              <td>
                                                <span className={`status-badge ${
                                                  String(interview.status).toLowerCase() === 'completed'
                                                    ? 'status-completed'
                                                    : String(interview.status).toLowerCase() === 'cancelled'
                                                      ? 'status-inactive'
                                                      : 'status-pending'
                                                }`}>{interview.status || "Scheduled"}</span>
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
                                                        openStudentRecords(student, setOpenAssignmentMenuId, { forceInterviewOnly: true });
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
                                                        Conduct Interview
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
                  );
                })()}
              </div>
            </div>
          )}

          {activeTab === "scheduled-assignments" && (
            <div style={{ marginTop: "24px" }}>
              <div className="premium-card" style={{ marginBottom: "16px" }}>
                <div className="premium-card-header">
                  <h2>Schedule Assessment — Individual</h2>
                </div>
                <div style={{ padding: "16px 20px" }}>
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
                            <th>Assigned To</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {scheduledAssignments.filter((a) => getScheduledAssessmentMode(a) === "Individual").map((a, idx) => (
                            <tr key={a._id || a.title || idx}>
                              <td>{a.title || a.details?.form?.title || 'Assignment'}</td>
                              <td>{(a.dateTime || a.details?.form?.date) ? new Date(a.dateTime || a.details?.form?.date).toLocaleDateString() : '-'}</td>
                              <td>{(a.details?.form?.dueDate) ? new Date(a.details.form.dueDate + ' ' + (a.details.form.dueTime || '00:00')).toLocaleString() : (a.dateTime ? new Date(a.dateTime).toLocaleString() : '-')}</td>
                              <td>{a.details?.notification?.assessmentMeta?.assignedLabels?.join(', ') || a.details?.form?.groupName || (Array.isArray(a.details?.assigned) ? a.details.assigned.join(', ') : '-')}</td>
                              <td><span className={`status-badge ${
                                String(a.status).toLowerCase() === 'completed'
                                  ? 'status-completed'
                                  : String(a.status).toLowerCase() === 'cancelled'
                                    ? 'status-inactive'
                                    : 'status-pending'
                              }`}>{a.status || 'Scheduled'}</span></td>
                              <td style={{ position: "relative" }}>
                                <button
                                  data-scheduled-assessment-menu-toggle
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenScheduledAssessmentMenuId((prev) => (prev === (a._id || idx) ? null : (a._id || idx)));
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
                                  aria-label={`Open actions for ${a.title || 'assessment'}`}
                                >
                                  ⋮
                                </button>

                                {openScheduledAssessmentMenuId === (a._id || idx) && (
                                  <div
                                    data-scheduled-assessment-menu
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
                                        const student = resolveAssessmentStudent(a);
                                        if (!student) {
                                          alert("No specific student found for this assessment.");
                                          setOpenScheduledAssessmentMenuId(null);
                                          return;
                                        }
                                        openStudentRecords(student, setOpenScheduledAssessmentMenuId, { defaultTab: "assessments", lockedTab: "assessments" });
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
                                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                                      onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
                                    >
                                      Conduct Assessment
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              <div className="premium-card" style={{ marginTop: "0" }}>
                <div className="premium-card-header">
                  <h2>Schedule Assessment — Group</h2>
                </div>
                <div style={{ padding: "16px 20px" }}>
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
                            <th>Assigned To</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {scheduledAssignments.filter((a) => getScheduledAssessmentMode(a) === "Group").map((a, idx) => (
                            <tr key={a._id || a.title || idx}>
                              <td>{a.title || a.details?.form?.title || 'Assignment'}</td>
                              <td>{(a.dateTime || a.details?.form?.date) ? new Date(a.dateTime || a.details?.form?.date).toLocaleDateString() : '-'}</td>
                              <td>{(a.details?.form?.dueDate) ? new Date(a.details.form.dueDate + ' ' + (a.details.form.dueTime || '00:00')).toLocaleString() : (a.dateTime ? new Date(a.dateTime).toLocaleString() : '-')}</td>
                              <td>{a.details?.notification?.assessmentMeta?.assignedLabels?.join(', ') || a.details?.form?.groupName || (Array.isArray(a.details?.assigned) ? a.details.assigned.join(', ') : '-')}</td>
                              <td><span className={`status-badge ${
                                String(a.status).toLowerCase() === 'completed'
                                  ? 'status-completed'
                                  : String(a.status).toLowerCase() === 'cancelled'
                                    ? 'status-inactive'
                                    : 'status-pending'
                              }`}>{a.status || 'Scheduled'}</span></td>
                              <td style={{ position: "relative" }}>
                                <button
                                  data-scheduled-assessment-menu-toggle
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenScheduledAssessmentMenuId((prev) => (prev === (a._id || idx) ? null : (a._id || idx)));
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
                                  aria-label={`Open actions for ${a.title || 'assessment'}`}
                                >
                                  ⋮
                                </button>

                                {openScheduledAssessmentMenuId === (a._id || idx) && (
                                  <div
                                    data-scheduled-assessment-menu
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
                                        const student = resolveAssessmentStudent(a);
                                        if (!student) {
                                          alert("No specific student found for this assessment.");
                                          setOpenScheduledAssessmentMenuId(null);
                                          return;
                                        }
                                        openStudentRecords(student, setOpenScheduledAssessmentMenuId, { defaultTab: "assessments", lockedTab: "assessments" });
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
                                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                                      onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
                                    >
                                      Conduct Assessment
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "activity-individuals" && (
            <>
              <div className="premium-page-header">
                <div className="header-left">
                  <h1 style={{ color: "#344158" }}>Activity Management — Individual Interviews</h1>
                  <p className="header-subtitle">Conduct interviews for students assigned to you</p>
                </div>
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
                        Showing <strong style={{ color: "#374151" }}>{filteredStudents.length}</strong> of {" "}
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
                            {filteredStudents.map((student, idx) => {
                              const isCompleted = student.status === "completed";
                              const menuId = student._id || `student-${idx}`;
                              return (
                                <tr key={student._id || menuId}>
                                  <td>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                      <div>
                                        <div style={{ fontWeight: "600", color: "#1f2937", fontSize: "14px" }}>
                                          {student.name}
                                        </div>
                                        {student.email && (
                                          <div style={{ fontSize: "12px", color: "#9ca3af" }}>{student.email}</div>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  <td>
                                    <span className="mono-text" style={{ fontSize: "13px" }}>{student.internId}</span>
                                  </td>
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
                                  <td style={{ position: "relative" }}>
                                    <button
                                      data-student-menu-toggle
                                      onClick={(e) => {
                                        e.stopPropagation();
                                          setOpenStudentMenuId((prev) => (prev === student._id ? null : student._id));
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
                                      aria-label={`Open actions for ${student.name || "student"}`}>
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
                                          minWidth: "160px",
                                          overflow: "hidden",
                                        }}
                                      >
                                        <button
                                          onClick={() => openStudentRecords(student, setOpenStudentMenuId)}
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
                                          onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                                          onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
                                        >
                                          Conduct Interview
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

          {activeTab === "activity-groups" && (
            <>
              <div className="premium-page-header">
                <div className="header-left">
                  <h1>Activity Management — Group Interviews</h1>
                  <p className="header-subtitle">Conduct interviews for students inside your assigned groups</p>
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
                            onClick={() => handleToggleGroup(groupId)}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1 }}>
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
                              
                              <span style={{ color: "#344158", fontSize: "12px", fontWeight: "700" }}>
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
                                  <table className="data-table view-students-table" style={{ minWidth: "1100px", marginBottom: 0 }}>
                                    <thead>
                                      <tr>
                                        <th style={{ minWidth: "40px", width: "40px" }}>#</th>
                                        <th style={{ minWidth: "80px", width: "80px" }}>ID</th>
                                        <th style={{ minWidth: "120px", width: "120px" }}>Student</th>
                                        <th style={{ minWidth: "150px", width: "150px" }}>Email</th>
                                        <th style={{ minWidth: "100px", width: "100px" }}>Mobile</th>
                                        <th style={{ minWidth: "80px", width: "80px" }}>Type</th>
                                        <th style={{ minWidth: "80px", width: "80px" }}>Status</th>
                                        <th style={{ minWidth: "60px", width: "60px" }}>Actions</th>
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
                                            <td>{studentName}</td>
                                            <td><span style={{ wordBreak: "break-word" }}>{studentEmail}</span></td>
                                            <td>{studentMobile || "-"}</td>
                                            <td>{studentType}</td>
                                            <td>
                                              {studentStatus && studentStatus !== "-" ? (
                                                <span className={`status-badge ${(studentStatus || "").toLowerCase() === "active" ? "status-active" : (studentStatus || "").toLowerCase() === "completed" ? "status-completed" : "status-inactive"}`}>
                                                  {studentStatus.charAt(0).toUpperCase() + studentStatus.slice(1)}
                                                </span>
                                              ) : (
                                                "-"
                                              )}
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
                                                    Conduct Interview
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
            </>
          )}

          {/* 'Schedule GD' render removed — trainers use Conduct (activity-groups) view instead */}

          {activeTab === "scheduled-gds" && (
            <div>
              <div className="premium-page-header">
                <div className="header-left">
                  <h1>Scheduled — Group Discussion</h1>
                  <p className="header-subtitle">Conduct assigned GDs and record feedback</p>
                </div>
              </div>

              <div className="premium-card" style={{ marginTop: 12 }}>
                <div className="premium-card-header">
                  <h2>{selectedGd ? (selectedGd.title || 'Group Discussion') : 'Assigned GDs'}</h2>
                </div>
                <div style={{ padding: 16 }}>
                  {!selectedGd ? (
                    (() => {
                      // Extract all groups from scheduled GDs (only GDs admin assigned to this trainer)
                      const allScheduledGdGroups = [];
                      (scheduledGds || []).forEach((gd) => {
                        const rawGroups = gd.details?.groups || gd.details?.form?.groups || [];
                          (rawGroups || []).forEach((group, groupIdx) => {
                          if (Array.isArray(group)) {
                            allScheduledGdGroups.push({
                              id: getScheduledGdGroupKey(gd, group, groupIdx),
                              groupName: gd.title || gd.details?.form?.title || `GD Group ${groupIdx + 1}`,
                              groupNumber: groupIdx + 1,
                              students: group,
                              parentGd: gd,
                            });
                          } else if (group && typeof group === 'object') {
                            allScheduledGdGroups.push({
                              id: getScheduledGdGroupKey(gd, group, groupIdx),
                              groupName: group.groupName || gd.title || `GD Group ${groupIdx + 1}`,
                              groupNumber: group.groupNumber || groupIdx + 1,
                              students: Array.isArray(group.students) ? group.students : (Array.isArray(group.members) ? group.members : []),
                              parentGd: gd,
                            });
                          }
                        });
                      });

                      // Sort groups: Scheduled/Active first, Completed last.
                      // Within each status, sort by parentGd date/dateTime/createdAt descending (newest on top).
                      allScheduledGdGroups.sort((a, b) => {
                        const statusA = String(a.parentGd?.status || 'Scheduled').toLowerCase();
                        const statusB = String(b.parentGd?.status || 'Scheduled').toLowerCase();
                        
                        if (statusA === 'completed' && statusB !== 'completed') return 1;
                        if (statusA !== 'completed' && statusB === 'completed') return -1;
                        
                        const dateA = new Date(a.parentGd?.dateTime || a.parentGd?.date || a.parentGd?.details?.form?.date || a.parentGd?.createdAt || 0).getTime();
                        const dateB = new Date(b.parentGd?.dateTime || b.parentGd?.date || b.parentGd?.details?.form?.date || b.parentGd?.createdAt || 0).getTime();
                        return dateB - dateA; // Descending (newest first)
                      });

                      if (allScheduledGdGroups.length === 0) {
                        return <p className="record-history-empty">No GD groups scheduled for you</p>;
                      }

                      return (
                        <div style={{ overflowX: 'auto' }}>
                          {allScheduledGdGroups.map((group) => {
                          const groupStudents = Array.isArray(group.students) ? group.students : [];
                          const groupId = group.id || group._id || String(group.groupNumber || group.groupName || Math.random());
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
                            <div key={groupId} style={{ marginBottom: "16px", border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
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
                                onClick={() => handleToggleSingleGroup(groupId)}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1 }}>
                                  <div>
                                    <div style={{ fontWeight: "600", color: "#1f2937", fontSize: "15px" }}>
                                      {group.groupName || "Unnamed Group"}
                                    </div>
                                    <div style={{ fontSize: "13px", color: "#9ca3af", marginTop: "2px", display: "flex", alignItems: "center", gap: "8px" }}>
                                      <span>Group #: {group.groupNumber || "-"}</span>
                                      <span style={{ color: "#cbd5e1" }}>|</span>
                                      <span className={`status-badge ${
                                        String(group.parentGd?.status).toLowerCase() === 'completed'
                                          ? 'status-completed'
                                          : String(group.parentGd?.status).toLowerCase() === 'cancelled'
                                            ? 'status-inactive'
                                            : 'status-pending'
                                      }`} style={{ fontSize: "11px", padding: "2px 8px", margin: 0, textTransform: "capitalize" }}>
                                        {group.parentGd?.status || 'Scheduled'}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "13px", color: "#6b7280" }}>
                                  <span style={{ background: "#dbeafe", color: "#1e40af", padding: "4px 12px", borderRadius: "999px", fontWeight: "600" }}>
                                    {groupStudents.length} Student{groupStudents.length !== 1 ? "s" : ""}
                                  </span>
                                  <span style={{ color: "#344158", fontSize: "12px", fontWeight: "700" }}>
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
                                      <table className="data-table view-students-table" style={{ minWidth: "1100px", marginBottom: 0 }}>
                                        <thead>
                                          <tr>
                                            <th style={{ minWidth: "40px", width: "40px" }}>#</th>
                                            <th style={{ minWidth: "80px", width: "80px" }}>ID</th>
                                            <th style={{ minWidth: "120px", width: "120px" }}>Student</th>
                                            <th style={{ minWidth: "150px", width: "150px" }}>Email</th>
                                            <th style={{ minWidth: "100px", width: "100px" }}>Mobile</th>
                                            <th style={{ minWidth: "80px", width: "80px" }}>Type</th>
                                            <th style={{ minWidth: "80px", width: "80px" }}>Status</th>
                                            <th style={{ minWidth: "60px", width: "60px" }}>Actions</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {visibleGroupStudents.map((student, index) => {
                                            const enrichedStudent = enrichStudentData(student);
                                            const isStudentObject = enrichedStudent && typeof enrichedStudent === "object";
                                            const studentId = isStudentObject ? enrichedStudent._id : String(enrichedStudent || "");
                                            const menuId = `${group.id || group._id || "group"}-${studentId || index}`;
                                            const studentName = isStudentObject ? enrichedStudent.name : "Unknown";
                                            const internId = isStudentObject ? enrichedStudent.internId : "-";
                                            const studentEmail = isStudentObject ? enrichedStudent.email : "-";
                                            const studentMobile = isStudentObject ? enrichedStudent.mobile : "-";
                                            const studentType = isStudentObject ? enrichedStudent.studentType : "-";
                                            const studentStatus = isStudentObject ? enrichedStudent.status : "-";
                                            return (
                                              <tr key={studentId}>
                                                <td>{index + 1}</td>
                                                <td>{internId}</td>
                                                <td>{studentName}</td>
                                                <td><span style={{ wordBreak: "break-word" }}>{studentEmail}</span></td>
                                                <td>{studentMobile || "-"}</td>
                                                <td>{studentType}</td>
                                                <td>
                                                  {studentStatus && studentStatus !== "-" ? (
                                                    <span className={`status-badge ${(studentStatus || "").toLowerCase() === "active" ? "status-active" : (studentStatus || "").toLowerCase() === "completed" ? "status-completed" : "status-inactive"}`}>
                                                      {studentStatus.charAt(0).toUpperCase() + studentStatus.slice(1)}
                                                    </span>
                                                  ) : (
                                                    "-"
                                                  )}
                                                </td>
                                                <td style={{ position: "relative" }}>
                                                  <button
                                                    data-assignment-menu-toggle
                                                    onClick={(e) => {
                                                      e.stopPropagation();

                                                      if (!isStudentObject || !enrichedStudent._id) return;
                                                      if (openAssignmentMenuId === menuId) {
                                                        setOpenAssignmentMenuId(null);
                                                      } else {
                                                        calculateMenuPosition(e, 160);
                                                        setOpenAssignmentMenuId(menuId);
                                                      }
                                                    }}
                                                    style={{
                                                      background: "transparent",
                                                      color: "#0f172a",
                                                      border: "1px solid #d1d5db",
                                                      borderRadius: "8px",
                                                      width: "36px",
                                                      height: "36px",
                                                      cursor: !isStudentObject || !enrichedStudent._id ? "not-allowed" : "pointer",
                                                      fontSize: "20px",
                                                      display: "flex",
                                                      alignItems: "center",
                                                      justifyContent: "center",
                                                    }}
                                                    disabled={!isStudentObject || !enrichedStudent._id}
                                                    aria-label="Open actions"
                                                  >
                                                    ⋮
                                                  </button>

                                                  {openAssignmentMenuId === menuId &&
                                                    createPortal(
                                                      <div
                                                        data-assignment-menu
                                                        onClick={() => setOpenAssignmentMenuId(null)}
                                                        style={{
                                                          position: "absolute",
                                                          left: `${menuPosition.left}px`,
                                                          top: `${menuPosition.top}px`,
                                                          transform: menuPosition.openUpward ? "translateY(-100%)" : "none",
                                                          background: "white",
                                                          border: "1px solid #e5e7eb",
                                                          borderRadius: "12px",
                                                          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
                                                          zIndex: 11000,
                                                          minWidth: "160px",
                                                          overflow: "hidden",
                                                        }}
                                                      >
                                                        <button
                                                          onClick={() => {
                                                            // Open student records and select GD tab, providing GD context
                                                            openStudentRecords(enrichedStudent, setOpenAssignmentMenuId, { defaultTab: 'gd', gd: group.parentGd || null, lockedTab: 'gd' });
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
                                                          Conduct GD
                                                        </button>
                                                      </div>,
                                                      document.body
                                                    )
                                                  }
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
                      );
                    })()
                  ) : (
                    <div>

                      <div style={{ padding: '0 20px 16px 20px' }}>
                        <input
                          type="text"
                          value={groupSearchQuery}
                          onChange={(e) => setGroupSearchQuery(e.target.value)}
                          placeholder="Search GD groups by name, group number, student name, ID, email..."
                          style={{
                            width: '100%',
                            padding: '11px 14px',
                            border: '1px solid #d1d5db',
                            borderRadius: '10px',
                            fontSize: '14px',
                            background: '#ffffff',
                          }}
                        />
                      </div>

                      {(() => {
                        const rawGroups = selectedGd.details?.groups || selectedGd.details?.form?.groups || [];
                        const gdGroups = (rawGroups || []).map((group, index) => {
                          if (Array.isArray(group)) {
                            return {
                              id: getScheduledGdGroupKey(selectedGd, group, index),
                              groupName: `GD Group ${index + 1}`,
                              groupNumber: index + 1,
                              students: group,
                            };
                          }

                          if (group && typeof group === 'object') {
                            return {
                              id: getScheduledGdGroupKey(selectedGd, group, index),
                              groupName: group.groupName || `GD Group ${index + 1}`,
                              groupNumber: group.groupNumber || index + 1,
                              students: Array.isArray(group.students)
                                ? group.students
                                : Array.isArray(group.members)
                                  ? group.members
                                  : [],
                            };
                          }

                          return {
                            id: getScheduledGdGroupKey(selectedGd, group, index),
                            groupName: `GD Group ${index + 1}`,
                            groupNumber: index + 1,
                            students: [],
                          };
                        });

                        const gdGroupQuery = (groupSearchQuery || '').trim().toLowerCase();
                        const filteredGdGroups = gdGroups.filter((group) => {
                          if (!gdGroupQuery) return true;
                          return [group.groupName, group.groupNumber, ...(group.students || []).flatMap((student) => {
                            if (!student || typeof student !== 'object') return [];
                            return [student.name, student.internId, student.email, student.mobile, student.studentType, student.status];
                          })]
                            .filter(Boolean)
                            .some((value) => String(value).toLowerCase().includes(gdGroupQuery));
                        });

                        if (gdGroups.length === 0) {
                          return (
                            <div className="premium-empty-state">
                              <p className="empty-title">No GD groups found</p>
                            </div>
                          );
                        }

                        if (filteredGdGroups.length === 0) {
                          return (
                            <div className="premium-empty-state">
                              <p className="empty-title">No GD groups match this search</p>
                            </div>
                          );
                        }

                        return (
                          <div style={{ overflowX: 'auto' }}>
                            {filteredGdGroups.map((group) => {
                              const groupStudents = Array.isArray(group.students) ? group.students : [];
                              const groupId = group.id;
                              const isExpanded = !!expandedGroups[groupId];
                              const groupStudentQuery = (groupStudentSearch[groupId] || '').trim().toLowerCase();
                              const visibleGroupStudents = groupStudents.filter((student) => {
                                if (!groupStudentQuery) return true;
                                if (!student || typeof student !== 'object') return false;
                                return [student.name, student.internId, student.email, student.mobile, student.studentType, student.status]
                                  .filter(Boolean)
                                  .some((value) => String(value).toLowerCase().includes(groupStudentQuery));
                              });

                              return (
                                <div key={group.id} style={{ marginBottom: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                                  <div
                                    style={{
                                      padding: '16px',
                                      background: '#f9fafb',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      transition: 'all 0.2s ease',
                                      borderBottom: isExpanded ? '1px solid #e5e7eb' : 'none',
                                      cursor: 'pointer',
                                    }}
                                    onClick={() => handleToggleSingleGroup(groupId)}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                                      <div>
                                        <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '15px' }}>
                                          {group.groupName || 'GD Group'}
                                        </div>
                                         <div style={{ fontSize: '13px', color: '#9ca3af', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                           <span>Group #: {group.groupNumber || '-'}</span>
                                           <span style={{ color: '#cbd5e1' }}>|</span>
                                           <span className={`status-badge ${
                                             String(selectedGd?.status).toLowerCase() === 'completed'
                                               ? 'status-completed'
                                               : String(selectedGd?.status).toLowerCase() === 'cancelled'
                                                 ? 'status-inactive'
                                                 : 'status-pending'
                                           }`} style={{ fontSize: '11px', padding: '2px 8px', margin: 0, textTransform: 'capitalize' }}>
                                             {selectedGd?.status || 'Scheduled'}
                                           </span>
                                         </div>
                                      </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#6b7280' }}>
                                      <span style={{ background: '#dbeafe', color: '#1e40af', padding: '4px 12px', borderRadius: '999px', fontWeight: '600' }}>
                                        {groupStudents.length} Student{groupStudents.length !== 1 ? 's' : ''}
                                      </span>
                                      <span style={{ color: '#344158', fontSize: '12px', fontWeight: '700' }}>
                                        {isExpanded ? 'Hide' : 'View'}
                                      </span>
                                    </div>
                                  </div>

                                  {isExpanded && (
                                    <div style={{ padding: '16px', background: '#fff' }}>
                                      <div style={{ marginBottom: '12px' }}>
                                        <input
                                          type="text"
                                          value={groupStudentSearch[groupId] || ''}
                                          onChange={(e) => handleGroupStudentSearchChange(groupId, e.target.value)}
                                          placeholder="Search students in this GD group by name, ID, email, mobile..."
                                          style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '8px',
                                            fontSize: '13px',
                                            background: '#ffffff',
                                          }}
                                        />
                                      </div>

                                      {groupStudents.length === 0 ? (
                                        <div style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>
                                          <p>No students in this GD group</p>
                                        </div>
                                      ) : visibleGroupStudents.length === 0 ? (
                                        <div style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>
                                          <p>No students match this search</p>
                                        </div>
                                      ) : (
                                        <div style={{ overflowX: 'auto' }}>
                                          <table className="data-table view-students-table" style={{ minWidth: '920px', marginBottom: 0 }}>
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
                                                const isStudentObject = student && typeof student === 'object';
                                                const studentId = isStudentObject ? student._id : String(student || '');
                                                const menuId = `${group.id || 'gd-group'}-${studentId || index}`;
                                                const studentName = isStudentObject ? student.name : 'Unknown';
                                                const internId = isStudentObject ? student.internId : '-';
                                                const studentEmail = isStudentObject ? student.email : '-';
                                                const studentMobile = isStudentObject ? student.mobile : '-';
                                                const studentType = isStudentObject ? student.studentType : '-';
                                                const studentStatus = isStudentObject ? student.status : '-';
                                                return (
                                                  <tr key={studentId}>
                                                    <td>{index + 1}</td>
                                                    <td>{internId}</td>
                                                    <td>{studentName}</td>
                                                    <td><span style={{ wordBreak: 'break-word' }}>{studentEmail}</span></td>
                                                    <td>{studentMobile || '-'}</td>
                                                    <td>{studentType}</td>
                                                    <td>
                                                      {studentStatus && studentStatus !== '-' ? (
                                                        <span className={`status-badge ${(studentStatus || '').toLowerCase() === 'active' ? 'status-active' : (studentStatus || '').toLowerCase() === 'completed' ? 'status-completed' : 'status-inactive'}`}>
                                                          {studentStatus.charAt(0).toUpperCase() + studentStatus.slice(1)}
                                                        </span>
                                                      ) : (
                                                        '-'
                                                      )}
                                                    </td>
                                                    <td style={{ position: 'relative' }}>
                                                      <button
                                                        data-assignment-menu-toggle
                                                        onClick={(e) => {
                                                          e.stopPropagation();

                                                          if (!isStudentObject || !student._id) return;
                                                          setOpenAssignmentMenuId((prev) => (prev === menuId ? null : menuId));
                                                        }}
                                                        style={{
                                                          background: 'transparent',
                                                          color: '#0f172a',
                                                          border: '1px solid #d1d5db',
                                                          borderRadius: '8px',
                                                          width: '36px',
                                                          height: '36px',
                                                          cursor: !isStudentObject || !student._id ? 'not-allowed' : 'pointer',
                                                          fontSize: '20px',
                                                          display: 'flex',
                                                          alignItems: 'center',
                                                          justifyContent: 'center',
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
                                                            position: 'absolute',
                                                            right: 0,
                                                            top: '42px',
                                                            background: 'white',
                                                            border: '1px solid #e5e7eb',
                                                            borderRadius: '12px',
                                                            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                                                            zIndex: 1000,
                                                            minWidth: '160px',
                                                            overflow: 'hidden',
                                                          }}
                                                        >
                                                          <button
                                                            onClick={() => {
                                                              openStudentRecords(student, setOpenAssignmentMenuId);
                                                            }}
                                                            style={{
                                                              width: '100%',
                                                              padding: '12px 16px',
                                                              background: 'white',
                                                              border: 'none',
                                                              textAlign: 'left',
                                                              cursor: 'pointer',
                                                              fontSize: '14px',
                                                              fontWeight: '500',
                                                              color: '#0f172a',
                                                            }}
                                                            onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
                                                            onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                                                          >
                                                            Conduct Interview
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
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>
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
                                  color: "#344158",
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
                              <span style={{ color: "#344158", fontSize: "12px", fontWeight: "700" }}>
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
                                            {studentStatus && studentStatus !== "-" ? (
                                              <span
                                                className={`status-badge ${
                                                  (studentStatus || "").toLowerCase() === "active"
                                                    ? "status-active"
                                                    : (studentStatus || "").toLowerCase() === "completed"
                                                      ? "status-completed"
                                                      : "status-inactive"
                                                }`}
                                              >
                                                {studentStatus.charAt(0).toUpperCase() + studentStatus.slice(1)}
                                              </span>
                                            ) : (
                                              "-"
                                            )}
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
                                                {activeTab === "activity-individuals" || activeTab === "activity-groups" ? (
                                                  <button
                                                    onClick={() => openStudentRecords(student, setOpenAssignmentMenuId)}
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
                                                    Conduct Interview
                                                  </button>
                                                ) : (
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
                                                    Take activity
                                                  </button>
                                                )}
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
                  <h1 style={{ color: "#344158" }}>Assigned Students</h1>
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
                                        Take Activity
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
                      setActiveTab(recordsSourceTab || "students");
                    }}
                    className="premium-btn-secondary"
                  >
                    ← Back
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
                      interviewOnly={interviewOnlyMode}
                      lockedTab={lockedRecordTab}
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
                          value={
                            interviewFormData.interviewType === "HR" || interviewFormData.interviewType === "Technical" || interviewFormData.interviewType === ""
                              ? interviewFormData.interviewType
                              : "Other"
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "Other") {
                              setIsCustomInterviewType(true);
                              setInterviewFormData((prev) => ({
                                ...prev,
                                interviewType: "",
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
                            } else {
                              setIsCustomInterviewType(false);
                              setInterviewFormData((prev) => ({
                                ...prev,
                                interviewType: val,
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
                            }
                          }}
                          required
                        >
                          <option value="" disabled>Select Interview Type</option>
                          <option value="HR">HR</option>
                          <option value="Technical">Technical</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      {isCustomInterviewType && (
                        <div className="form-group">
                          <label>Specify Custom Interview Type *</label>
                          <input
                            type="text"
                            value={interviewFormData.interviewType}
                            onChange={(e) => setInterviewFormData(prev => ({ ...prev, interviewType: e.target.value }))}
                            placeholder="Enter custom interview type"
                            required
                          />
                        </div>
                      )}

                      <div className="form-group">
                        <label>Attendance *</label>
                        <select
                          name="attendanceStatus"
                          value={interviewFormData.attendanceStatus}
                          onChange={(e) => setInterviewFormData({ ...interviewFormData, [e.target.name]: e.target.value })}
                          required
                        >
                          <option value="Present">Present</option>
                          <option value="Absent">Absent</option>
                          <option value="Late">Late</option>
                        </select>
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

                      <div className="form-group">
                        <label>Score</label>
                        <input
                          type="number"
                          name="score"
                          value={interviewFormData.score}
                          onChange={(e) => setInterviewFormData({ ...interviewFormData, [e.target.name]: e.target.value })}
                          placeholder="Score"
                        />
                      </div>

                      <div className="form-group">
                        <label>Out Of</label>
                        <input
                          type="number"
                          name="outOf"
                          value={interviewFormData.outOf}
                          onChange={(e) => setInterviewFormData({ ...interviewFormData, [e.target.name]: e.target.value })}
                          placeholder="Out Of"
                        />
                      </div>

                      {interviewFormData.interviewType === "HR" && (
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
                              onChange={(e) =>
                                setInterviewFormData({
                                  ...interviewFormData,
                                  levelCrossed: e.target.value === "" ? "" : e.target.value === "true",
                                })
                              }
                              required
                            >
                              <option value="">Select Option</option>
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
                      )}
                      {interviewFormData.interviewType === "Technical" && (
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
                              onChange={(e) =>
                                setInterviewFormData({
                                  ...interviewFormData,
                                  levelCrossed: e.target.value === "true",
                                })
                              }
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
                        <label>PSMS ID</label>
                        <input type="text" value={selectedStudent?.internId || ""} readOnly />
                      </div>
                      <div className="form-group">
                        <label>Student Name</label>
                        <input type="text" value={selectedStudent?.name || ""} readOnly />
                      </div>
                      <div className="form-group">
                        <label>Date *</label>
                        <input
                          type="date"
                          name="date"
                          value={aptitudeFormData.date}
                          onChange={(e) => setAptitudeFormData({ ...aptitudeFormData, [e.target.name]: e.target.value })}
                          required
                        />
                      </div>
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
                      <div className="form-group" style={{ display: 'none' }}>
                        <label style={{ display: 'none' }}>Aptitude Round Number *</label>
                        <input
                          type="number"
                          name="roundNumber"
                          value={aptitudeFormData.roundNumber}
                          onChange={(e) => setAptitudeFormData({ ...aptitudeFormData, [e.target.name]: e.target.value })}
                          min="1"
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
                        <label>Out Of</label>
                        <input
                          type="number"
                          name="outOf"
                          value={aptitudeFormData.outOf}
                          onChange={(e) => setAptitudeFormData({ ...aptitudeFormData, [e.target.name]: e.target.value })}
                          min="0"
                          placeholder="Out Of"
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
                        <label>PSMS ID</label>
                        <input type="text" value={selectedStudent?.internId || ""} readOnly />
                      </div>
                      <div className="form-group">
                        <label>Student Name</label>
                        <input type="text" value={selectedStudent?.name || ""} readOnly />
                      </div>
                      <div className="form-group">
                        <label>Date *</label>
                        <input
                          type="date"
                          name="date"
                          value={assessmentFormData.date}
                          onChange={(e) => setAssessmentFormData({ ...assessmentFormData, [e.target.name]: e.target.value })}
                          required
                        />
                      </div>
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
                          value={
                            assessmentFormData.assessmentType === "Domain" || assessmentFormData.assessmentType === "Coding" || assessmentFormData.assessmentType === ""
                              ? assessmentFormData.assessmentType
                              : "Other"
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "Other") {
                              setIsCustomAssessmentType(true);
                              setAssessmentFormData((prev) => ({ ...prev, assessmentType: "" }));
                            } else {
                              setIsCustomAssessmentType(false);
                              setAssessmentFormData((prev) => ({ ...prev, assessmentType: val }));
                            }
                          }}
                          required
                        >
                          <option value="Domain">Domain</option>
                          <option value="Coding">Coding</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      {isCustomAssessmentType && (
                        <div className="form-group">
                          <label>Specify Custom Assessment Type *</label>
                          <input
                            type="text"
                            value={assessmentFormData.assessmentType}
                            onChange={(e) => setAssessmentFormData(prev => ({ ...prev, assessmentType: e.target.value }))}
                            placeholder="Enter custom assessment type"
                            required
                          />
                        </div>
                      )}
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
                        <label>Out Of</label>
                        <input
                          type="number"
                          name="outOf"
                          value={assessmentFormData.outOf}
                          onChange={(e) => setAssessmentFormData({ ...assessmentFormData, [e.target.name]: e.target.value })}
                          min="0"
                          placeholder="Out Of"
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
                        <label>PSMS ID</label>
                        <input type="text" value={selectedStudent?.internId || ""} readOnly />
                      </div>
                      <div className="form-group">
                        <label>Student Name</label>
                        <input type="text" value={selectedStudent?.name || ""} readOnly />
                      </div>
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
                        <label>Score</label>
                        <input
                          type="number"
                          name="score"
                          value={trainingFormData.score}
                          onChange={(e) => setTrainingFormData({ ...trainingFormData, [e.target.name]: e.target.value })}
                          min="0"
                          placeholder="Score"
                        />
                      </div>
                      <div className="form-group">
                        <label>Out Of</label>
                        <input
                          type="number"
                          name="outOf"
                          value={trainingFormData.outOf}
                          onChange={(e) => setTrainingFormData({ ...trainingFormData, [e.target.name]: e.target.value })}
                          min="0"
                          placeholder="Out Of"
                        />
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

                {!recordsLoading && currentStudentTab === "gd" && (
                  <div className="record-section">
                    <h2 className="record-form-title">Conduct GD — Student</h2>
                    <div className="record-intro-card">
                      <strong>GD Evaluation</strong>
                      <p>Rate student's participation, communication, confidence and add feedback.</p>
                    </div>
                     <form onSubmit={handleGdSubmit} className="record-form-grid">
                      <div className="form-group">
                        <label>PSMS ID</label>
                        <input type="text" value={selectedStudent?.internId || ""} readOnly />
                      </div>
                      <div className="form-group">
                        <label>Date *</label>
                        <input
                          type="date"
                          name="date"
                          value={gdFormData.date}
                          onChange={(e) => setGdFormData({ ...gdFormData, date: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Attendance *</label>
                        <select
                          value={gdFormData.attendanceStatus}
                          onChange={(e) => setGdFormData({ ...gdFormData, attendanceStatus: e.target.value })}
                          required
                        >
                          <option value="Present">Present</option>
                          <option value="Absent">Absent</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Score</label>
                        <input
                          type="number"
                          name="score"
                          value={gdFormData.score}
                          onChange={(e) => setGdFormData({ ...gdFormData, score: e.target.value })}
                          min="0"
                          placeholder="Score"
                        />
                      </div>
                      <div className="form-group">
                        <label>Out Of</label>
                        <input
                          type="number"
                          name="outOf"
                          value={gdFormData.outOf}
                          onChange={(e) => setGdFormData({ ...gdFormData, outOf: e.target.value })}
                          min="0"
                          placeholder="Out Of"
                        />
                      </div>
                      <div className="form-group">
                        <label>Participation *</label>
                        <select value={gdFormData.participation} onChange={(e) => setGdFormData({ ...gdFormData, participation: e.target.value })} required>
                          <option value="">Select Rating</option>
                          <option value="1">1 - Very Low</option>
                          <option value="2">2 - Low</option>
                          <option value="3">3 - Average</option>
                          <option value="4">4 - Good</option>
                          <option value="5">5 - Excellent</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Communication *</label>
                        <select value={gdFormData.communication} onChange={(e) => setGdFormData({ ...gdFormData, communication: e.target.value })} required>
                          <option value="">Select Rating</option>
                          <option value="1">1 - Very Low</option>
                          <option value="2">2 - Low</option>
                          <option value="3">3 - Average</option>
                          <option value="4">4 - Good</option>
                          <option value="5">5 - Excellent</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Confidence *</label>
                        <select value={gdFormData.confidence} onChange={(e) => setGdFormData({ ...gdFormData, confidence: e.target.value })} required>
                          <option value="">Select Rating</option>
                          <option value="1">1 - Very Low</option>
                          <option value="2">2 - Low</option>
                          <option value="3">3 - Average</option>
                          <option value="4">4 - Good</option>
                          <option value="5">5 - Excellent</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Topic Understanding *</label>
                        <select value={gdFormData.topicUnderstanding} onChange={(e) => setGdFormData({ ...gdFormData, topicUnderstanding: e.target.value })} required>
                          <option value="">Select Rating</option>
                          <option value="1">1 - Very Low</option>
                          <option value="2">2 - Low</option>
                          <option value="3">3 - Average</option>
                          <option value="4">4 - Good</option>
                          <option value="5">5 - Excellent</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Leadership *</label>
                        <select value={gdFormData.leadership} onChange={(e) => setGdFormData({ ...gdFormData, leadership: e.target.value })} required>
                          <option value="">Select Rating</option>
                          <option value="1">1 - Very Low</option>
                          <option value="2">2 - Low</option>
                          <option value="3">3 - Average</option>
                          <option value="4">4 - Good</option>
                          <option value="5">5 - Excellent</option>
                        </select>
                      </div>
                      <div className="form-group full-width">
                        <label>Strengths</label>
                        <textarea rows={3} value={gdFormData.strengths} onChange={(e) => setGdFormData({ ...gdFormData, strengths: e.target.value })} />
                      </div>
                      <div className="form-group full-width">
                        <label>Improvement Areas</label>
                        <textarea rows={3} value={gdFormData.improvementAreas} onChange={(e) => setGdFormData({ ...gdFormData, improvementAreas: e.target.value })} />
                      </div>
                      <div className="form-group full-width">
                        <label>Overall Remark</label>
                        <textarea rows={4} value={gdFormData.overallRemark} onChange={(e) => setGdFormData({ ...gdFormData, overallRemark: e.target.value })} />
                      </div>
                      <button type="submit" className="submit-btn record-submit-btn record-submit-btn-compact">
                        Save GD Evaluation
                      </button>
                    </form>
                  </div>
                )}
                  </div>
                </div>

                {!recordsLoading && currentStudentTab && (
                  <div className="record-history record-history-below">
                    <div className="record-history-toolbar" style={{ marginBottom: "16px" }}>
                      <h2 className="record-history-title" style={{ marginBottom: 0 }}>
                            {currentStudentTab === "interviews"
                              ? "Interview History"
                              : currentStudentTab === "aptitude"
                                ? "Aptitude Test History"
                                : currentStudentTab === "assessments"
                                  ? "Assessment History"
                                  : currentStudentTab === "gd"
                                    ? "GD Evaluations"
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
                                <th>Score</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredInterviews.map((interview, index) => (
                                <tr key={index}>
                                  <td>{new Date(interview.date).toLocaleDateString()}</td>
                                  <td>{interview.interviewType}</td>
                                  <td>{interview.attendanceStatus || "-"}</td>
                                  <td>{interview.attemptNumber}</td>
                                  <td>{interview.communicationLevel || "-"}</td>
                                  <td>{interview.confidenceLevel || "-"}</td>
                                  <td>{interview.clarityLevel || interview.clarityOfAnswer || "-"}</td>
                                  <td>{interview.overallLevel || (interview.interviewType === "Technical" ? interview.overallTechnicalLevel : interview.overallHRLevel) || "-"}</td>
                                  <td>{interview.levelCrossed ? "Crossed" : "Not Crossed"}</td>
                                  <td>{interview.score !== undefined && interview.score !== null ? `${interview.score}${interview.outOf ? '/' + interview.outOf : ''}` : "-"}</td>
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
                                  <td>{apt.score}{apt.outOf ? '/' + apt.outOf : ''}</td>
                                  <td>{apt.result}</td>
                                  <td>{apt.remarks || "-"}</td>
                                  <td>{apt.date ? new Date(apt.date).toLocaleDateString() : new Date(apt.createdAt).toLocaleDateString()}</td>
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
                                  <td>{assessment.score !== undefined && assessment.score !== null ? `${assessment.score}${assessment.outOf ? '/' + assessment.outOf : ''}` : "-"}</td>
                                  <td>{assessment.status}</td>
                                  <td>{assessment.feedback || "-"}</td>
                                  <td>{assessment.date ? new Date(assessment.date).toLocaleDateString() : new Date(assessment.createdAt).toLocaleDateString()}</td>
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
                                <th>Score</th>
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
                                  <td>{training.score !== undefined && training.score !== null ? `${training.score}${training.outOf ? '/' + training.outOf : ''}` : "-"}</td>
                                  <td>{training.skillImprovementNote || "-"}</td>
                                  <td>{training.trainerRemarks || "-"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )
                    )}

                    {currentStudentTab === "gd" && (
                      filteredGdEvaluations.length === 0 ? (
                        <p>No GD evaluation records yet</p>
                      ) : (
                        <div className="record-table-wrap">
                          <table className="premium-table view-students-table student-records-history-table">
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>GD</th>
                                <th>Attendance</th>
                                <th>Score</th>
                                <th>Participation</th>
                                <th>Communication</th>
                                <th>Confidence</th>
                                <th>Topic</th>
                                <th>Leadership</th>
                                <th>Overall Remark</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredGdEvaluations.map((gd, index) => (
                                <tr key={`${gd.gdId || gd.gdTitle || "gd"}-${gd.savedAt || index}`}>
                                  <td>{gd.savedAt ? new Date(gd.savedAt).toLocaleDateString() : "-"}</td>
                                  <td>{gd.gdTitle || "GD"}</td>
                                  <td>{gd.form?.attendanceStatus || "-"}</td>
                                  <td>{gd.form?.score !== undefined && gd.form?.score !== null ? `${gd.form.score}${gd.form.outOf ? '/' + gd.form.outOf : ''}` : "-"}</td>
                                  <td>{gd.form?.participation || "-"}</td>
                                  <td>{gd.form?.communication || "-"}</td>
                                  <td>{gd.form?.confidence || "-"}</td>
                                  <td>{gd.form?.topicUnderstanding || "-"}</td>
                                  <td>{gd.form?.leadership || "-"}</td>
                                  <td>{gd.form?.overallRemark || "-"}</td>
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
              <div className="content-header">
                <h1>Notifications</h1>
                <p>Important announcements and updates</p>
              </div>

              <div className="card">
                {notifications.filter((notif) => NOTIFICATION_TYPE_GROUPS.GENERAL.includes(notif.notificationType)).length === 0 ? (
                  <div className="empty-state">
                    <p>No notifications at this time.</p>
                  </div>
                ) : (
                  <div className="notification-list">
                    {notifications
                      .filter((notif) => NOTIFICATION_TYPE_GROUPS.GENERAL.includes(notif.notificationType))
                      .map((notif) => {
                      const createdAt = notif.createdAt || notif.updatedAt || notif.date;
                      const message = notif.message || notif.description || notif.body || "";
                      const title = notif.title || notif.subject || notif.notificationType || "Notification";
                      const attachmentUrl = notif.attachment?.filename
                        ? `/uploads/notifications/${notif.attachment.filename}`
                        : notif.attachment || notif.file || notif.image || "";

                      return (
                        <div
                          key={notif._id || `${title}-${createdAt}`}
                          className={`notification-card ${notif.isRead ? 'read' : 'unread'}`}
                        >
                          <div className="notification-card-header">
                            <div>
                              <h3>{title}</h3>
                              <div className="notification-message-formatted">
                                {renderNotificationMessage(message)}
                              </div>
                            </div>
                            {!notif.isRead && <span className="notification-read-pill">New</span>}
                          </div>

                          {attachmentUrl ? (
                            <div className="notification-attachment-wrap">
                              <a
                                href={attachmentUrl.startsWith("/") ? attachmentUrl : attachmentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="notification-attachment-link"
                              >
                                View Attachment
                              </a>
                            </div>
                          ) : null}

                          <div className="notification-card-meta">
                            <span className="notification-type-pill">{notif.notificationType || "General"}</span>
                            <span>{createdAt ? new Date(createdAt).toLocaleString("en-IN") : "-"}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
                    Change Password
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

              <div className="profile-summary-card" style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div className="profile-top-avatar" style={{ width: 72, height: 72, fontSize: 32, background: "#324158" }}>
                      {profileInitial}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 20, fontWeight: 700 }}>{profileDisplayName}</div>
                        <div style={{ color: "#64748b", marginTop: 4 }}>
                          {user?.trainerId || user?.employeeId || ""} • {profileRole || "Trainer"}
                          <span style={{ marginLeft: 10, fontSize: 12, color: "#475569", fontWeight: 700 }}>
                            {(profileStatus || "active").toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="section-card">
                  <h3>Personal Details</h3>
                  <div className="section-grid">
                    <div className="field-col"><label>Full Name</label><div className="field-value">{user?.name || "-"}</div></div>
                    <div className="field-col"><label>Role</label><div className="field-value">{profileRole || "-"}</div></div>
                    <div className="field-col"><label>Account Status</label><div className="field-value">{profileStatus || "-"}</div></div>
                    {hasDisplayValue(user?.joiningDate) && <div className="field-col"><label>Joining Date</label><div className="field-value">{new Date(user.joiningDate).toLocaleDateString()}</div></div>}
                    {hasDisplayValue(user?.createdAt) && <div className="field-col"><label>Profile Created</label><div className="field-value">{new Date(user.createdAt).toLocaleDateString()}</div></div>}
                    {hasDisplayValue(user?.updatedAt) && <div className="field-col"><label>Last Updated</label><div className="field-value">{new Date(user.updatedAt).toLocaleDateString()}</div></div>}
                    <div className="field-col"><label>Total Students</label><div className="field-value">{students.length}</div></div>
                    <div className="field-col"><label>Assigned Groups</label><div className="field-value">{assignedGroups.length}</div></div>
                    <div className="field-col"><label>Work Assignments</label><div className="field-value">{workAssignments.length}</div></div>
                  </div>
                </div>

                {(hasDisplayValue(user?.email) || hasDisplayValue(user?.mobile)) && (
                  <div className="section-card">
                    <h3>Contact Details</h3>
                    <div className="section-grid">
                      {hasDisplayValue(user?.email) && <div className="field-col"><label>Email Address</label><div className="field-value mono-text">{user.email}</div></div>}
                      {hasDisplayValue(user?.mobile) && <div className="field-col"><label>Mobile Number</label><div className="field-value mono-text">{user.mobile}</div></div>}
                    </div>
                  </div>
                )}

                {hasDisplayValue(user?.customRole) && (
                  <div className="section-card">
                    <h3>Work Summary</h3>
                    <div className="section-grid">
                      <div className="field-col">
                        <label>Custom Role</label>
                        <div className="field-value">{user.customRole}</div>
                      </div>
                    </div>
                  </div>
                )}
              <div className="info-banner">
                <strong>Change Your Password</strong>
                <p>
                  Click the "Change Password" button above to update your account password.
                </p>
              </div>

              {/* Change Password Modal */}
              {showEditModal && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                  <div
                    className="modal-content"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="modal-header">
                      <h2>Change Password</h2>
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
                        <label htmlFor="edit-password">New Password *</label>
                        <div className="password-input-wrapper">
                          <input
                            id="edit-password"
                            type={showTrainerPassword ? "text" : "password"}
                            name="password"
                            value={editFormData.password}
                            onChange={handleEditInputChange}
                            placeholder="Enter your new password"
                            required
                          />
                          <button
                            type="button"
                            className="password-toggle-btn"
                            onClick={() => setShowTrainerPassword(!showTrainerPassword)}
                            title={showTrainerPassword ? "Hide password" : "Show password"}
                          >
                            {showTrainerPassword ? (
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: "20px", height: "20px" }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: "20px", height: "20px" }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="form-group">
                        <label htmlFor="edit-confirm-password">Confirm Password *</label>
                        <div className="password-input-wrapper">
                          <input
                            id="edit-confirm-password"
                            type={showTrainerConfirmPassword ? "text" : "password"}
                            name="confirmPassword"
                            value={editFormData.confirmPassword}
                            onChange={handleEditInputChange}
                            placeholder="Confirm your new password"
                            required
                          />
                          <button
                            type="button"
                            className="password-toggle-btn"
                            onClick={() => setShowTrainerConfirmPassword(!showTrainerConfirmPassword)}
                            title={showTrainerConfirmPassword ? "Hide password" : "Show password"}
                          >
                            {showTrainerConfirmPassword ? (
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: "20px", height: "20px" }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: "20px", height: "20px" }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            )}
                          </button>
                        </div>
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
                        <button
                          type="submit"
                          className="btn-primary btn-update-password"
                          disabled={editLoading}
                        >
                          {editLoading ? "Updating..." : "Update Password"}
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
      </ErrorBoundary>
    </div>
  );
}

export default TrainerDashboard;
