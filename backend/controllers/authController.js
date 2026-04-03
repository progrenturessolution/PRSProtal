const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Intern = require('../models/Intern');

const normalizeCredentialValue = (value) => {
  if (typeof value !== 'string') {
    return value;
  }
  const trimmed = value.trim();
  // Accept values pasted with surrounding quotes.
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
};

// Admin Login
exports.adminLogin = async (req, res) => {
  try {
    const normalizedBody = req.body || {};
    const email = normalizeCredentialValue(
      normalizedBody.email ?? normalizedBody['email:']
    );
    const password = normalizeCredentialValue(
      normalizedBody.password ?? normalizedBody['password:']
    );
    const blockedAdminEmails = new Set(['admin@progrentures.com']);

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide email and password' 
      });
    }

    if (blockedAdminEmails.has(String(email).toLowerCase().trim())) {
      return res.status(403).json({
        success: false,
        message: 'This admin account is disabled.'
      });
    }

    // Check if admin exists
    const normalizedEmail = String(email).toLowerCase().trim();
    const admin = await Admin.findOne({ email: normalizedEmail });
    if (!admin) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Verify password
    const isPasswordMatch = await bcrypt.compare(password, admin.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: admin._id,
        email: admin.email,
        role: admin.role
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// Intern Login
exports.internLogin = async (req, res) => {
  try {
    const { internId, password } = req.body;

    // Validation
    if (!internId || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide intern ID and password' 
      });
    }

    // Check if intern exists
    const intern = await Intern.findOne({ internId });
    if (!intern) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Verify password
    const isPasswordMatch = await bcrypt.compare(password, intern.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: intern._id, internId: intern.internId, role: intern.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: intern._id,
        name: intern.name,
        email: intern.email,
        mobile: intern.mobile,
        internId: intern.internId,
        studentType: intern.studentType,
        currentDesignation: intern.currentDesignation,
        status: intern.status,
        role: intern.role
      }
    });

  } catch (error) {
    console.error('Intern login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};
