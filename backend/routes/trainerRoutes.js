const express = require('express');
const router = express.Router();
const trainerController = require('../controllers/trainerController');
const { protect } = require('../middleware/authMiddleware');

// Trainer login (no auth required)
router.post('/login', trainerController.trainerLogin);

// Protected routes (require authentication)
router.use(protect); // All routes below require authentication

// Profile routes
router.get('/profile', trainerController.getProfile);
router.patch('/profile', trainerController.updateProfile);

// Assigned students
router.get('/students', trainerController.getAssignedStudents);
router.get('/students/:studentId/records', trainerController.getStudentRecords);
router.patch('/students/:studentId/status', trainerController.updateStudentStatus);

// Get scheduled interviews
router.get('/scheduled-interviews', trainerController.getScheduledInterviews);

// Get trainer work assignments
router.get('/work-assignments', trainerController.getMyWorkAssignmentsForTrainer);
// Get trainer notifications (includes Test/Assessment)
router.get('/notifications', trainerController.getMyNotifications);

// Add evaluation records
router.post('/interviews', trainerController.addInterview);
router.post('/aptitude', trainerController.addAptitude);
router.post('/assessments', trainerController.addAssessment);
router.post('/training', trainerController.addTraining);

// Update task progress
router.patch('/tasks/:taskId/progress', trainerController.updateTaskProgress);

module.exports = router;
