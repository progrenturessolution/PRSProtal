const express = require('express');
const router = express.Router();
const repController = require('../controllers/representativeController');
const { verifyToken } = require('../middleware/authMiddleware');

// Middleware to verify representative role
const verifyRep = (req, res, next) => {
  if (req.user.role !== 'representative') {
    return res.status(403).json({ success: false, message: 'Access denied. Representatives only.' });
  }
  next();
};

// Auth
router.post('/login', repController.representativeLogin);

// Protected routes (representative only)
router.get('/profile', verifyToken, verifyRep, repController.getProfile);
router.patch('/profile', verifyToken, verifyRep, repController.updateProfile);

router.post('/students', verifyToken, verifyRep, repController.addStudent);
router.get('/students', verifyToken, verifyRep, repController.getMyStudents);
router.get('/students/stats', verifyToken, verifyRep, repController.getMyStudentStats);
router.delete('/students/:id', verifyToken, verifyRep, repController.deleteStudent);
router.get('/payouts', verifyToken, verifyRep, repController.getMyPayouts);

module.exports = router;
