const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const adminController = require('../controllers/adminController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads/tasks folder exists
const tasksUploadDir = path.join(__dirname, '..', 'uploads', 'tasks');
if (!fs.existsSync(tasksUploadDir)) {
	fs.mkdirSync(tasksUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, tasksUploadDir);
	},
	filename: function (req, file, cb) {
		const ext = path.extname(file.originalname);
		const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
		cb(null, name);
	}
});

const upload = multer({ 
	storage,
	fileFilter: function (req, file, cb) {
		// Accept only PDF files
		if (file.mimetype === 'application/pdf') {
			cb(null, true);
		} else {
			cb(new Error('Only PDF files are allowed'), false);
		}
	}
});

// Admin routes
router.post('/admin/create-task', verifyToken, verifyAdmin, upload.single('taskDocument'), taskController.createAndAssignTask);
router.get('/admin/tasks', verifyToken, verifyAdmin, taskController.getAllTasks);
router.get('/admin/task-stats', verifyToken, verifyAdmin, taskController.getTaskStats);
router.put('/admin/approve-task/:taskId', verifyToken, verifyAdmin, taskController.approveTask);
router.post('/admin/task-feedback/:taskId', verifyToken, verifyAdmin, taskController.sendTaskFeedback);
router.put('/admin/edit-task/:taskId', verifyToken, verifyAdmin, taskController.editTask);
router.delete('/admin/delete-task/:taskId', verifyToken, verifyAdmin, taskController.deleteTask);

// Intern routes
router.get('/intern/tasks', verifyToken, taskController.getInternTasks);
router.put('/intern/update-task/:taskId', verifyToken, taskController.updateTaskProgress);
router.post('/intern/team-message/:taskId', verifyToken, taskController.sendTeamMessage);

// Intern: fetch own uploaded documents
router.get('/intern/my-documents', verifyToken, adminController.getStudentDocuments);

module.exports = router;
