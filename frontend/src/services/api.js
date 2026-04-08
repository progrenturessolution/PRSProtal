import axios from "axios";

const RAW_API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000/api";

const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, "").endsWith("/api")
  ? RAW_API_BASE_URL.replace(/\/+$/, "")
  : `${RAW_API_BASE_URL.replace(/\/+$/, "")}/api`;

// Base URL for uploaded files (backend origin)
export const UPLOADS_BASE = API_BASE_URL.replace("/api", "");

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
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
      if (typeof config.headers?.set === "function") {
        config.headers.set("Content-Type", undefined);
        config.headers.set("content-type", undefined);
      }
      delete config.headers["Content-Type"];
      delete config.headers["content-type"];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const requestUrl = originalRequest.url || "";
    const isAuthRequest =
      typeof requestUrl === "string" && requestUrl.startsWith("/auth/");
    const isRetryableStatus =
      error.response && error.response.status >= 500 && error.response.status < 600;
    const shouldRetryOnce =
      isAuthRequest &&
      !originalRequest.__isRetryRequest &&
      isRetryableStatus;

    if (shouldRetryOnce) {
      originalRequest.__isRetryRequest = true;
      return api(originalRequest);
    }

    return Promise.reject(error);
  }
);

// Authentication APIs
export const authAPI = {
  adminLogin: (credentials) => api.post("/auth/admin-login", credentials, { timeout: 60000 }),
  internLogin: (credentials) => api.post("/auth/intern-login", credentials, { timeout: 60000 }),
  trainerLogin: (credentials) => api.post("/auth/trainer-login", credentials, { timeout: 60000 }),
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
  updateTrainer: (id, data) => api.patch(`/admin/trainer/${id}`, data),
  assignGroupsToTrainer: (data) => api.post("/admin/assign-groups", data),
  assignWorkToTrainer: (data) => api.post("/admin/assign-work", data),
  getGroups: () => api.get("/admin/groups"),
  deleteTrainer: (id) => api.delete(`/admin/trainer/${id}`),

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
    api.post("/admin/certificates/assign", formData, { timeout: 60000 }),
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
  createTask: (taskData) =>
    api.post("/task/admin/create-task", taskData, { timeout: 60000 }),
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
  updateMyProfile: (data) => api.patch("/task/intern/my-profile", data),
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
  login: (credentials) => api.post("/auth/representative-login", credentials, { timeout: 60000 }),
  getProfile: () => api.get("/representative/profile"),
  updateProfile: (data) => api.patch("/representative/profile", data),
  addStudent: (data) => api.post("/representative/students", data),
  getMyStudents: (params) => api.get("/representative/students", { params }),
  getMyStudentStats: () => api.get("/representative/students/stats"),
  deleteStudent: (id) => api.delete(`/representative/students/${id}`),
  getMyPayouts: () => api.get("/representative/payouts"),
};

// Admin representative management APIs (added to adminAPI)
export const adminRepAPI = {
  addRepresentative: (data) => api.post("/admin/add-representative", data, { timeout: 60000 }),
  getAllRepresentatives: (params) => api.get("/admin/representatives", { params }),
  getRepresentativeDetails: (id) => api.get(`/admin/representatives/${id}/details`),
  deleteRepresentative: (id) => api.delete(`/admin/representative/${id}`),
  getRepresentativePayouts: (params) =>
    api.get("/admin/representatives/payouts", { params }),
  upsertRepresentativePayout: (data) =>
    api.post("/admin/representatives/payouts", data),
  createGroup: (data) => api.post("/admin/groups", data),
  getGroups: () => api.get("/admin/groups"),
  getGroupDetails: (id) => api.get(`/admin/groups/${id}`),
  updateGroup: (id, data) => api.patch(`/admin/groups/${id}`, data),
  deleteGroup: (id) => api.delete(`/admin/groups/${id}`),
};

export default api;
