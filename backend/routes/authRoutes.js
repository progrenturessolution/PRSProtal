const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const trainerController = require('../controllers/trainerController');

// Admin Login
router.post('/admin-login', authController.adminLogin);

// Intern Login
router.post('/intern-login', authController.internLogin);

// Trainer Login
router.post('/trainer-login', trainerController.trainerLogin);

// Representative Login
const repController = require('../controllers/representativeController');
router.post('/representative-login', repController.representativeLogin);

// Verify Identity
router.post('/verify-identity', authController.verifyIdentity);

module.exports = router;
