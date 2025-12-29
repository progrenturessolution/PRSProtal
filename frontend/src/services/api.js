import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Authentication APIs
export const authAPI = {
  adminLogin: (credentials) => api.post('/auth/admin-login', credentials),
  internLogin: (credentials) => api.post('/auth/intern-login', credentials),
  trainerLogin: (credentials) => api.post('/auth/trainer-login', credentials)
};

// Admin APIs
export const adminAPI = {
  addIntern: (internData) => api.post('/admin/add-intern', internData),
  getAllInterns: () => api.get('/admin/interns'),
  getStats: () => api.get('/admin/stats'),
  deleteIntern: (id) => api.delete(`/admin/intern/${id}`),
  updateInternStatus: (id, status) => api.patch(`/admin/intern/${id}/status`, { status }),
  updateIntern: (id, data) => api.patch(`/admin/intern/${id}`, data),
  deleteAllInterns: () => api.delete('/admin/delete-all-interns'),
  
  // Trainer management
  addTrainer: (trainerData) => api.post('/admin/add-trainer', trainerData),
  getAllTrainers: () => api.get('/admin/trainers'),
  assignStudents: (trainerId, studentIds) => api.post('/admin/assign-students', { trainerId, studentIds }),
  
  // Notifications
  createNotification: (notificationData) => api.post('/admin/notifications', notificationData),
  getAllNotifications: () => api.get('/admin/notifications'),
  
  // Job postings
  createJobPosting: (jobData) => api.post('/admin/job-postings', jobData),
  getAllJobPostings: () => api.get('/admin/job-postings'),
  
  // Documents
  uploadStudentDocument: (studentId, formData) => api.post(`/admin/students/${studentId}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getStudentDocuments: (studentId) => api.get(`/admin/students/${studentId}/documents`)
};

// Trainer APIs
export const trainerAPI = {
  getAssignedStudents: () => api.get('/trainer/students'),
  getStudentRecords: (studentId) => api.get(`/trainer/students/${studentId}/records`),
  addInterview: (interviewData) => api.post('/trainer/interviews', interviewData),
  addAptitude: (aptitudeData) => api.post('/trainer/aptitude', aptitudeData),
  addAssessment: (assessmentData) => api.post('/trainer/assessments', assessmentData),
  addTraining: (trainingData) => api.post('/trainer/training', trainingData),
  updateTaskProgress: (taskId, data) => api.patch(`/trainer/tasks/${taskId}/progress`, data)
};

// Task APIs
export const taskAPI = {
  // Admin task APIs
  createTask: (taskData) => api.post('/task/admin/create-task', taskData),
  getAllTasks: () => api.get('/task/admin/tasks'),
  getTaskStats: () => api.get('/task/admin/task-stats'),
  approveTask: (taskId) => api.put(`/task/admin/approve-task/${taskId}`),
  sendTaskFeedback: (taskId, message) => api.post(`/task/admin/task-feedback/${taskId}`, { message }),
  editTask: (taskId, taskData) => api.put(`/task/admin/edit-task/${taskId}`, taskData),
  deleteTask: (taskId) => api.delete(`/task/admin/delete-task/${taskId}`),
  
  // Intern task APIs
  getInternTasks: () => api.get('/task/intern/tasks'),
  updateTaskProgress: (taskId, progress) => api.put(`/task/intern/update-task/${taskId}`, { progress })
};

export default api;
