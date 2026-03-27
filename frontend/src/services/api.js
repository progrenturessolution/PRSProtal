import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

// Base URL for uploaded files (backend origin)
export const UPLOADS_BASE = API_BASE_URL.replace("/api", "");

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Let axios auto-set Content-Type for FormData (multipart/form-data with boundary)
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Authentication APIs
export const authAPI = {
  adminLogin: (credentials) => api.post("/auth/admin-login", credentials),
  internLogin: (credentials) => api.post("/auth/intern-login", credentials),
  trainerLogin: (credentials) => api.post("/auth/trainer-login", credentials),
};

// Admin APIs
export const adminAPI = {
  addIntern: (internData) => api.post("/admin/add-intern", internData),
  getAllInterns: () => api.get("/admin/interns"),
  getStats: () => api.get("/admin/stats"),
  deleteIntern: (id) => api.delete(`/admin/intern/${id}`),
  updateInternStatus: (id, status) =>
    api.patch(`/admin/intern/${id}/status`, { status }),
  updateIntern: (id, data) => api.patch(`/admin/intern/${id}`, data),
  deleteAllInterns: () => api.delete("/admin/delete-all-interns"),

  // Recycle Bin (Archived Students)
  getDeletedInterns: () => api.get("/admin/deleted-interns"),
  restoreIntern: (id) => api.patch(`/admin/intern/${id}/restore`),
  permanentlyDeleteIntern: (id) => api.delete(`/admin/intern/${id}/permanent`),

  // Trainer management
  addTrainer: (trainerData) => api.post("/admin/add-trainer", trainerData),
  getAllTrainers: () => api.get("/admin/trainers"),
  assignStudentsToTrainer: (data) => api.post("/admin/assign-students", data),

  // Notifications
  createNotification: (notificationData) =>
    api.post("/admin/notifications", notificationData),
  getAllNotifications: () => api.get("/admin/notifications"),

  // Job postings
  createJobPosting: (jobData) => api.post("/admin/job-postings", jobData),
  getAllJobPostings: () => api.get("/admin/job-postings"),

  // Documents
  uploadStudentDocument: (studentId, formData) =>
    api.post(`/admin/students/${studentId}/documents`, formData),
  getStudentDocuments: (studentId) =>
    api.get(`/admin/students/${studentId}/documents`),

  // Assigned Certificates (5-day expiry)
  assignCertificates: (formData) =>
    api.post("/admin/certificates/assign", formData),
  getCertificates: () => api.get("/admin/certificates"),
  deleteCertificate: (id) => api.delete(`/admin/certificates/${id}`),
};

// Trainer APIs
export const trainerAPI = {
  getProfile: () => api.get("/trainer/profile"),
  updateProfile: (data) => api.patch("/trainer/profile", data),
  getAssignedStudents: () => api.get("/trainer/students"),
  getStudentRecords: (studentId) =>
    api.get(`/trainer/students/${studentId}/records`),
  addInterview: (interviewData) =>
    api.post("/trainer/interviews", interviewData),
  addAptitude: (aptitudeData) => api.post("/trainer/aptitude", aptitudeData),
  addAssessment: (assessmentData) =>
    api.post("/trainer/assessments", assessmentData),
  addTraining: (trainingData) => api.post("/trainer/training", trainingData),
  updateTaskProgress: (taskId, data) =>
    api.patch(`/trainer/tasks/${taskId}/progress`, data),
  updateStudentStatus: (studentId, status) =>
    api.patch(`/trainer/students/${studentId}/status`, { status }),
};

// Task APIs
export const taskAPI = {
  // Admin task APIs
  createTask: (taskData) => api.post("/task/admin/create-task", taskData),
  getAllTasks: () => api.get("/task/admin/tasks"),
  getTaskStats: () => api.get("/task/admin/task-stats"),
  approveTask: (taskId) => api.put(`/task/admin/approve-task/${taskId}`),
  sendTaskFeedback: (taskId, message) =>
    api.post(`/task/admin/task-feedback/${taskId}`, { message }),
  editTask: (taskId, taskData) =>
    api.put(`/task/admin/edit-task/${taskId}`, taskData),
  deleteTask: (taskId) => api.delete(`/task/admin/delete-task/${taskId}`),

  // Intern task APIs
  getInternTasks: () => api.get("/task/intern/tasks"),
  updateTaskProgress: (taskId, progress) =>
    api.put(`/task/intern/update-task/${taskId}`, { progress }),
  sendTeamMessage: (taskId, messageData) =>
    api.post(`/task/intern/team-message/${taskId}`, messageData),
  sendAdminTeamMessage: (taskId, messageData) =>
    api.post(`/task/admin/team-message/${taskId}`, messageData),
};

// Intern APIs
export const internAPI = {
  getMyDocuments: () => api.get("/task/intern/my-documents"),
  getMyProfile: () => api.get("/task/intern/my-profile"),
  getMyInterviews: () => api.get("/task/intern/my-interviews"),
  getMyAptitude: () => api.get("/task/intern/my-aptitude"),
  getMyAssessments: () => api.get("/task/intern/my-assessments"),
  getMyTraining: () => api.get("/task/intern/my-training"),
  getMyNotifications: () => api.get("/task/intern/my-notifications"),
  getMyJobPostings: () => api.get("/task/intern/my-job-postings"),
  getMyAssignedCertificates: () => api.get("/task/intern/my-certificates"),
};

// Representative APIs
export const representativeAPI = {
  login: (credentials) => api.post("/auth/representative-login", credentials),
  getProfile: () => api.get("/representative/profile"),
  updateProfile: (data) => api.patch("/representative/profile", data),
  addStudent: (data) => api.post("/representative/students", data),
  getMyStudents: (params) => api.get("/representative/students", { params }),
  getMyStudentStats: () => api.get("/representative/students/stats"),
  deleteStudent: (id) => api.delete(`/representative/students/${id}`),
};

// Admin representative management APIs (added to adminAPI)
export const adminRepAPI = {
  addRepresentative: (data) => api.post("/admin/add-representative", data),
  getAllRepresentatives: () => api.get("/admin/representatives"),
  getRepresentativeDetails: (id) => api.get(`/admin/representatives/${id}/details`),
  deleteRepresentative: (id) => api.delete(`/admin/representative/${id}`),
};

export default api;
