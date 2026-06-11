const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const certificateController = require('../controllers/certificateController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads/students folder exists
const studentsUploadDir = path.join(__dirname, '..', 'uploads', 'students');
if (!fs.existsSync(studentsUploadDir)) {
	fs.mkdirSync(studentsUploadDir, { recursive: true });
}

// Ensure uploads/certificates folder exists
const certsUploadDir = path.join(__dirname, '..', 'uploads', 'certificates');
if (!fs.existsSync(certsUploadDir)) {
	fs.mkdirSync(certsUploadDir, { recursive: true });
}

// Ensure uploads/notifications folder exists
const notificationsUploadDir = path.join(__dirname, '..', 'uploads', 'notifications');
if (!fs.existsSync(notificationsUploadDir)) {
	fs.mkdirSync(notificationsUploadDir, { recursive: true });
}

// Ensure uploads/representatives folder exists
const repsUploadDir = path.join(__dirname, '..', 'uploads', 'representatives');
if (!fs.existsSync(repsUploadDir)) {
	fs.mkdirSync(repsUploadDir, { recursive: true });
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

// Separate multer config for assigned certificates
const certStorage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, certsUploadDir);
	},
	filename: function (req, file, cb) {
		const ext = path.extname(file.originalname);
		const name = `cert-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
		cb(null, name);
	}
});

const uploadCert = multer({ storage: certStorage });

// Separate multer config for notifications attachments
const notificationStorage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, notificationsUploadDir);
	},
	filename: function (req, file, cb) {
		const ext = path.extname(file.originalname);
		const name = `notification-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
		cb(null, name);
	}
});

const uploadNotification = multer({ storage: notificationStorage });

// Representative docs upload
const representativeStorage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, repsUploadDir);
	},
	filename: function (req, file, cb) {
		const ext = path.extname(file.originalname);
		const name = `rep-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
		cb(null, name);
	}
});

const uploadRepresentativeDocs = multer({ storage: representativeStorage });

// ========== INTERN/STUDENT MANAGEMENT ==========

// Add new intern (Admin only) - support uploading required SMS Program documents
router.post(
	'/add-intern',
	verifyToken,
	verifyAdmin,
	upload.fields([
		{ name: 'welcomeLetter', maxCount: 1 },
		{ name: 'smsProgramEnrollmentLetter', maxCount: 1 },
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
router.patch('/trainer/:id', verifyToken, verifyAdmin, adminController.updateTrainer);

// Get all trainers
router.get('/trainers', verifyToken, verifyAdmin, adminController.getAllTrainers);

// Assign students to trainer
router.post('/assign-students', verifyToken, verifyAdmin, adminController.assignStudentsToTrainer);
router.post('/assign-groups', verifyToken, verifyAdmin, adminController.assignGroupsToTrainer);
router.post('/assign-work', verifyToken, verifyAdmin, adminController.assignWorkToTrainer);

// Delete trainer
router.delete('/trainer/:id', verifyToken, verifyAdmin, adminController.deleteTrainer);

// Delete student performance records
router.delete('/student-performance/:studentId', verifyToken, verifyAdmin, adminController.deleteStudentPerformanceRecords);

// Get student activity records for admin report page
router.get('/students/:studentId/records', verifyToken, verifyAdmin, adminController.getStudentRecords);

// ========== NOTIFICATIONS ==========

// Create notification
router.post('/notifications', verifyToken, verifyAdmin, uploadNotification.single('attachment'), adminController.createNotification);

// Get all notifications
router.get('/notifications', verifyToken, verifyAdmin, adminController.getAllNotifications);

// ========== JOB POSTINGS ==========

// Create job posting
router.post('/job-postings', verifyToken, verifyAdmin, adminController.createJobPosting);

// Get all job postings
router.get('/job-postings', verifyToken, verifyAdmin, adminController.getAllJobPostings);

// Update a job posting
router.patch('/job-postings/:id', verifyToken, verifyAdmin, adminController.updateJobPosting);

// Delete a job posting
router.delete('/job-postings/:id', verifyToken, verifyAdmin, adminController.deleteJobPosting);

// Repost / reopen a job posting
router.post('/job-postings/:id/repost', verifyToken, verifyAdmin, adminController.repostJobPosting);

// ========== CERTIFICATES & DOCUMENTS ==========

// Upload student document (accepts field name 'file')
router.post('/students/:studentId/documents', verifyToken, verifyAdmin, upload.single('file'), adminController.uploadStudentDocument);

// Get student documents
router.get('/students/:studentId/documents', verifyToken, verifyAdmin, adminController.getStudentDocuments);

// ========== ASSIGNED CERTIFICATES (5-day expiry) ==========

// Assign multiple certificates to a student
router.post('/certificates/assign', verifyToken, verifyAdmin, uploadCert.array('certificates', 10), certificateController.assignCertificates);

// Get all active assigned certificates
router.get('/certificates', verifyToken, verifyAdmin, certificateController.getCertificates);

// Revoke / delete a specific certificate
router.delete('/certificates/:id', verifyToken, verifyAdmin, certificateController.deleteCertificate);

// ========== REPRESENTATIVE MANAGEMENT ==========

// Add representative
router.post(
	'/add-representative',
	verifyToken,
	verifyAdmin,
	uploadRepresentativeDocs.fields([
		{ name: 'upiScanner', maxCount: 1 },
		{ name: 'pgirSelectionLetter', maxCount: 1 },
		{ name: 'internshipOfferLetter', maxCount: 1 }
	]),
	adminController.addRepresentative
);

// Get all representatives
router.get('/representatives', verifyToken, verifyAdmin, adminController.getAllRepresentatives);

// Get representative details
router.get('/representatives/:id/details', verifyToken, verifyAdmin, adminController.getRepresentativeDetails);

// Update representative
router.patch(
	'/representative/:id',
	verifyToken,
	verifyAdmin,
	uploadRepresentativeDocs.fields([
		{ name: 'upiScanner', maxCount: 1 },
		{ name: 'pgirSelectionLetter', maxCount: 1 },
		{ name: 'internshipOfferLetter', maxCount: 1 }
	]),
	adminController.updateRepresentative
);

// Delete representative
router.delete('/representative/:id', verifyToken, verifyAdmin, adminController.deleteRepresentative);

// Representative payout management
router.post('/representatives/payouts', verifyToken, verifyAdmin, adminController.upsertRepresentativePayout);
router.get('/representatives/payouts', verifyToken, verifyAdmin, adminController.getRepresentativePayouts);

// Group management
router.post('/groups', verifyToken, verifyAdmin, adminController.createStudentGroup);
router.get('/groups', verifyToken, verifyAdmin, adminController.getStudentGroups);
router.get('/groups/:id', verifyToken, verifyAdmin, adminController.getStudentGroupDetails);
router.patch('/groups/:id', verifyToken, verifyAdmin, adminController.updateStudentGroup);
router.delete('/groups/:id', verifyToken, verifyAdmin, adminController.deleteStudentGroup);

// Schedule interview
router.post('/schedule-interview', verifyToken, verifyAdmin, adminController.scheduleInterview);
router.post('/schedule-assessment', verifyToken, verifyAdmin, adminController.scheduleAssessment);

// Activities: create and list recent activities
router.post('/activities', verifyToken, verifyAdmin, adminController.createActivity);
router.get('/activities', verifyToken, verifyAdmin, adminController.getRecentActivities);
router.patch('/activities/:id', verifyToken, verifyAdmin, adminController.updateActivity);
router.delete('/activities/:id', verifyToken, verifyAdmin, adminController.deleteActivity);

module.exports = router;

