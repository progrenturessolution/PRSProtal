const express = require('express');
const router = express.Router();
const repController = require('../controllers/representativeController');
const { verifyToken } = require('../middleware/authMiddleware');
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

router.post(
  '/students',
  verifyToken,
  verifyRep,
  upload.fields([
    { name: 'smsProgramEnrollmentLetter', maxCount: 1 },
    { name: 'offerLetter', maxCount: 1 },
    { name: 'paymentReceipt', maxCount: 1 }
  ]),
  repController.addStudent
);
router.get('/students', verifyToken, verifyRep, repController.getMyStudents);
router.get('/students/stats', verifyToken, verifyRep, repController.getMyStudentStats);
router.patch('/students/:id', verifyToken, verifyRep, repController.updateStudent);
router.delete('/students/:id', verifyToken, verifyRep, repController.deleteStudent);
router.get('/payouts', verifyToken, verifyRep, repController.getMyPayouts);

module.exports = router;
