const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

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

module.exports = router;
