const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Admin Login
router.post('/admin-login', authController.adminLogin);

// Intern Login
router.post('/intern-login', authController.internLogin);

module.exports = router;
