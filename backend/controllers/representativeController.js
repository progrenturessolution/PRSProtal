const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Representative = require('../models/Representative');
const RepStudent = require('../models/RepStudent');

// Representative Login
exports.representativeLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const rep = await Representative.findOne({ email });
    if (!rep) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (rep.status === 'inactive') {
      return res.status(403).json({ success: false, message: 'Account is inactive. Contact admin.' });
    }

    const isMatch = await bcrypt.compare(password, rep.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: rep._id, role: rep.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: rep._id,
        name: rep.name,
        email: rep.email,
        role: rep.role,
        college: rep.college,
        designation: rep.designation
      }
    });
  } catch (error) {
    console.error('Representative login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get my profile
exports.getProfile = async (req, res) => {
  try {
    const rep = await Representative.findById(req.user.id).select('-password');
    if (!rep) return res.status(404).json({ success: false, message: 'Representative not found' });

    res.status(200).json({ success: true, representative: rep });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update profile (editable fields only)
exports.updateProfile = async (req, res) => {
  try {
    const { college, course, department, year, mobile, email, upiId, password } = req.body;

    const updateData = {};
    if (college !== undefined) updateData.college = college;
    if (course !== undefined) updateData.course = course;
    if (department !== undefined) updateData.department = department;
    if (year !== undefined) updateData.year = year;
    if (mobile !== undefined) updateData.mobile = mobile;
    if (email !== undefined) updateData.email = email;
    if (upiId !== undefined) updateData.upiId = upiId;

    if (password && password.trim()) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const rep = await Representative.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!rep) return res.status(404).json({ success: false, message: 'Representative not found' });

    res.status(200).json({ success: true, representative: rep });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Add a student
exports.addStudent = async (req, res) => {
  try {
    const { studentName, college, branch, mobile, email, domain, batchJoiningDate, totalAmount, firstInstallment, secondInstallment } = req.body;

    if (!studentName) {
      return res.status(400).json({ success: false, message: 'Student name is required' });
    }

    const student = await RepStudent.create({
      representative: req.user.id,
      studentName,
      college,
      branch,
      mobile,
      email,
      domain,
      batchJoiningDate: batchJoiningDate || null,
      totalAmount: Number(totalAmount) || 0,
      firstInstallment: Number(firstInstallment) || 0,
      secondInstallment: Number(secondInstallment) || 0
    });

    res.status(201).json({ success: true, student });
  } catch (error) {
    console.error('Add student error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get my students (with filters)
exports.getMyStudents = async (req, res) => {
  try {
    const { name, mobile, dateFrom, dateTo } = req.query;

    const filter = { representative: req.user.id };

    if (name) {
      filter.studentName = { $regex: name, $options: 'i' };
    }

    if (mobile) {
      filter.mobile = { $regex: mobile, $options: 'i' };
    }

    if (dateFrom || dateTo) {
      filter.batchJoiningDate = {};
      if (dateFrom) filter.batchJoiningDate.$gte = new Date(dateFrom);
      if (dateTo) filter.batchJoiningDate.$lte = new Date(dateTo);
    }

    const students = await RepStudent.find(filter).sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: students.length, students });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete a student
exports.deleteStudent = async (req, res) => {
  try {
    const student = await RepStudent.findOneAndDelete({ _id: req.params.id, representative: req.user.id });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    res.status(200).json({ success: true, message: 'Student deleted' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
