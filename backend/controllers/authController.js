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
    const admin = await Admin.findOne({ email: normalizedEmail })
      .select('_id email role password')
      .lean();
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
    const internId = normalizeCredentialValue(req.body?.internId);
    const password = normalizeCredentialValue(req.body?.password);

    // Validation
    if (!internId || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide intern ID and password' 
      });
    }

    // Check if intern exists
    const normalizedInternId = String(internId).trim();
    const intern = await Intern.findOne({ internId: normalizedInternId }).lean();
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

    // Block login for completed interns
    const internStatus = (intern.status || '').toLowerCase();
    if (internStatus === 'completed') {
      return res.status(403).json({
        success: false,
        message: 'Your internship is completed'
      });
    }
    // Block login for inactive interns and return admin-provided message if any
    if (internStatus === 'inactive') {
      const baseMsg = (intern.inactiveMessage && intern.inactiveMessage.trim()) || 'Your account is inactive';
      const appended = baseMsg + ' Contact admin to make yourself active.';
      return res.status(403).json({ success: false, message: appended });
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
        internId: intern.internId,
        status: intern.status,
        studentType: intern.studentType,
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

// Verify Identity (Public Endpoint)
exports.verifyIdentity = async (req, res) => {
  try {
    const internId = normalizeCredentialValue(req.body?.internId);
    const mobile = normalizeCredentialValue(req.body?.mobile);

    // Validation
    if (!internId || !mobile) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide both Aspirant ID and Mobile Number' 
      });
    }

    const normalizedInternId = String(internId).trim();
    const normalizedMobile = String(mobile).trim();

    // Query database for the student. Should not be soft deleted.
    const intern = await Intern.findOne({
      internId: normalizedInternId,
      mobile: normalizedMobile,
      isDeleted: { $ne: true }
    }).lean();

    if (!intern) {
      return res.status(404).json({
        success: false,
        message: 'This aspirant is not a part of Progrentures Solution Pvt. Ltd.'
      });
    }

    // Format dates nicely for displaying
    const formatBatchDate = (dateVal) => {
      if (!dateVal) return '-';
      try {
        return new Date(dateVal).toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });
      } catch (e) {
        return '-';
      }
    };

    // Return profile-like details of the student
    res.status(200).json({
      success: true,
      message: 'Identity Verified Successfully',
      student: {
        name: intern.name,
        email: intern.email,
        mobile: intern.mobile,
        internId: intern.internId,
        studentType: intern.studentType,
        domain: intern.studentType === 'SMS Program' ? (intern.suggestedDomain || '-') : (intern.domain || '-'),
        joiningDate: intern.studentType === 'SMS Program' ? formatBatchDate(intern.enrolmentDate) : formatBatchDate(intern.joiningDate),
        duration: intern.duration || 'N/A',
        collegeName: intern.studentType === 'SMS Program' ? intern.instituteName : intern.collegeName,
        status: intern.status,
        companyName: 'Progrentures Solution Pvt. Ltd.'
      }
    });

  } catch (error) {
    console.error('Verify identity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during verification'
    });
  }
};
