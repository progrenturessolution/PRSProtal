const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads/students folder exists
const studentsUploadDir = path.join(__dirname, '..', 'uploads', 'students');
if (!fs.existsSync(studentsUploadDir)) {
	fs.mkdirSync(studentsUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, studentsUploadDir);
	},
	filename: function (req, file, cb) {
		const ext = path.extname(file.originalname);
		const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
		cb(null, name);
	}
});

const upload = multer({ storage });

// ========== INTERN/STUDENT MANAGEMENT ==========

// Add new intern (Admin only) - support uploading required SMS Program documents
router.post(
	'/add-intern',
	verifyToken,
	verifyAdmin,
	upload.fields([
		{ name: 'welcomeLetter', maxCount: 1 },
		{ name: 'offerLetter', maxCount: 1 },
		{ name: 'paymentReceipt', maxCount: 1 }
	]),
	adminController.addIntern
);

// Get all interns (Admin only)
router.get('/interns', verifyToken, verifyAdmin, adminController.getAllInterns);

// Get dashboard statistics (Admin only)
router.get('/stats', verifyToken, verifyAdmin, adminController.getStats);

// Delete single intern - soft delete (Admin only)
router.delete('/intern/:id', verifyToken, verifyAdmin, adminController.deleteIntern);

// Get deleted interns - recycle bin (Admin only)
router.get('/deleted-interns', verifyToken, verifyAdmin, adminController.getDeletedInterns);

// Restore intern from recycle bin (Admin only)
router.patch('/intern/:id/restore', verifyToken, verifyAdmin, adminController.restoreIntern);

// Permanently delete intern (Admin only)
router.delete('/intern/:id/permanent', verifyToken, verifyAdmin, adminController.permanentlyDeleteIntern);

// Update intern status (Admin only)
router.patch('/intern/:id/status', verifyToken, verifyAdmin, adminController.updateInternStatus);

// Update intern details (Admin only)
router.patch('/intern/:id', verifyToken, verifyAdmin, adminController.updateIntern);

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

// Upload student document (accepts field name 'file')
router.post('/students/:studentId/documents', verifyToken, verifyAdmin, upload.single('file'), adminController.uploadStudentDocument);

// Get student documents
router.get('/students/:studentId/documents', verifyToken, verifyAdmin, adminController.getStudentDocuments);

module.exports = router;

