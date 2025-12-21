const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

// Admin routes
router.post('/admin/create-task', verifyToken, verifyAdmin, taskController.createAndAssignTask);
router.get('/admin/tasks', verifyToken, verifyAdmin, taskController.getAllTasks);
router.get('/admin/task-stats', verifyToken, verifyAdmin, taskController.getTaskStats);
router.put('/admin/approve-task/:taskId', verifyToken, verifyAdmin, taskController.approveTask);
router.post('/admin/task-feedback/:taskId', verifyToken, verifyAdmin, taskController.sendTaskFeedback);
router.put('/admin/edit-task/:taskId', verifyToken, verifyAdmin, taskController.editTask);
router.delete('/admin/delete-task/:taskId', verifyToken, verifyAdmin, taskController.deleteTask);

// Intern routes
router.get('/intern/tasks', verifyToken, taskController.getInternTasks);
router.put('/intern/update-task/:taskId', verifyToken, taskController.updateTaskProgress);

module.exports = router;
