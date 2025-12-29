const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

// ========== INTERN/STUDENT MANAGEMENT ==========

// Add new intern (Admin only)
router.post('/add-intern', verifyToken, verifyAdmin, adminController.addIntern);

// Get all interns (Admin only)
router.get('/interns', verifyToken, verifyAdmin, adminController.getAllInterns);

// Get dashboard statistics (Admin only)
router.get('/stats', verifyToken, verifyAdmin, adminController.getStats);

// Delete single intern (Admin only)
router.delete('/intern/:id', verifyToken, verifyAdmin, adminController.deleteIntern);

// Update intern status (Admin only)
router.patch('/intern/:id/status', verifyToken, verifyAdmin, adminController.updateInternStatus);

// Delete all interns (Admin only)
router.delete('/delete-all-interns', verifyToken, verifyAdmin, adminController.deleteAllInterns);

// ========== TRAINER MANAGEMENT ==========

// Add trainer
router.post('/add-trainer', verifyToken, verifyAdmin, adminController.addTrainer);

// Get all trainers
router.get('/trainers', verifyToken, verifyAdmin, adminController.getAllTrainers);

// Assign students to trainer
router.post('/assign-students', verifyToken, verifyAdmin, adminController.assignStudentsToTrainer);

// ========== NOTIFICATIONS ==========

// Create notification
router.post('/notifications', verifyToken, verifyAdmin, adminController.createNotification);

// Get all notifications
router.get('/notifications', verifyToken, verifyAdmin, adminController.getAllNotifications);

// ========== JOB POSTINGS ==========

// Create job posting
router.post('/job-postings', verifyToken, verifyAdmin, adminController.createJobPosting);

// Get all job postings
router.get('/job-postings', verifyToken, verifyAdmin, adminController.getAllJobPostings);

// ========== CERTIFICATES & DOCUMENTS ==========

// Upload student document
router.post('/students/:studentId/documents', verifyToken, verifyAdmin, adminController.uploadStudentDocument);

// Get student documents
router.get('/students/:studentId/documents', verifyToken, verifyAdmin, adminController.getStudentDocuments);

module.exports = router;

