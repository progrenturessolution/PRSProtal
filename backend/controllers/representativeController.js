const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Representative = require('../models/Representative');
const Intern = require('../models/Intern');
const { sendInternCredentials } = require('../config/emailService');

// Generate unique Intern ID based on type
const generateInternId = async (studentType) => {
  const year = new Date().getFullYear();
  const prefix = studentType === 'SMS Program' ? `PSMS${year}` : `PIID${year}`;

  const lastIntern = await Intern.findOne({
    internId: { $regex: `^${prefix}` }
  })
    .sort({ internId: -1 })
    .select('internId');

  let nextNumber = 1;
  if (lastIntern?.internId) {
    const tail = Number(lastIntern.internId.slice(prefix.length));
    if (Number.isFinite(tail)) {
      nextNumber = tail + 1;
    }
  }

  let internId = `${prefix}${String(nextNumber).padStart(4, '0')}`;
  while (await Intern.exists({ internId })) {
    nextNumber += 1;
    internId = `${prefix}${String(nextNumber).padStart(4, '0')}`;
  }

  return internId;
};

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
    const {
      studentType,
      name,
      email,
      password,
      mobile,
      domain,
      joiningDate,
      endingDate,
      duration,
      paymentDoneBy,
      dateOfPayment,
      transactionId,
      paymentAmount,
      currentDesignation
    } = req.body;

    if (!studentType || !name || !email || !password || !mobile) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    if (studentType === 'Internship' && (!domain || !joiningDate || !duration)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all internship required fields'
      });
    }

    const existingIntern = await Intern.findOne({ email });
    if (existingIntern) {
      return res.status(400).json({ success: false, message: 'Student with this email already exists' });
    }

    const internId = await generateInternId(studentType);
    const hashedPassword = await bcrypt.hash(password, 10);

    const internData = {
      studentType,
      name,
      email,
      mobile,
      internId,
      password: hashedPassword,
      role: 'intern',
      addedByRepresentative: req.user.id
    };

    if (studentType === 'Internship') {
      internData.domain = domain;
      internData.joiningDate = joiningDate;
      internData.duration = duration;
      if (endingDate) {
        internData.endingDate = endingDate;
      }
    } else if (studentType === 'SMS Program') {
      internData.paymentDoneBy = paymentDoneBy;
      internData.dateOfPayment = dateOfPayment;
      internData.transactionId = transactionId;
      internData.paymentAmount = paymentAmount;
      internData.currentDesignation = currentDesignation || 'Student';
    }

    const intern = new Intern(internData);
    await intern.save();

    // Send email in background so API responds immediately
    sendInternCredentials(name, email, internId, password)
      .then((emailResult) => {
        if (!emailResult.success) {
          console.error(`Background credential email failed for ${email}:`, emailResult.error);
        }
      })
      .catch((emailError) => {
        console.error(`Background credential email error for ${email}:`, emailError.message);
      });

    res.status(201).json({
      success: true,
      message: 'Student added successfully',
      intern: {
        id: intern._id,
        name: intern.name,
        email: intern.email,
        internId: intern.internId,
        studentType: intern.studentType
      },
      emailSent: false,
      emailQueued: true
    });
  } catch (error) {
    console.error('Add student error:', error);

    if (error?.code === 11000) {
      if (error?.keyPattern?.email) {
        return res.status(409).json({ success: false, message: 'Student with this email already exists' });
      }
      if (error?.keyPattern?.internId) {
        return res.status(409).json({ success: false, message: 'Could not generate unique intern ID. Please retry.' });
      }
    }

    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get my students (with filters)
exports.getMyStudents = async (req, res) => {
  try {
    const { name, mobile, dateFrom, dateTo } = req.query;

    const filter = { addedByRepresentative: req.user.id, isDeleted: { $ne: true } };

    if (name) {
      filter.name = { $regex: name, $options: 'i' };
    }

    if (mobile) {
      filter.mobile = { $regex: mobile, $options: 'i' };
    }

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    const students = await Intern.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: students.length, students });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete a student
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Intern.findOneAndUpdate(
      {
        _id: req.params.id,
        addedByRepresentative: req.user.id,
        isDeleted: { $ne: true }
      },
      {
        isDeleted: true,
        deletedAt: new Date()
      },
      { new: true }
    );

    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    res.status(200).json({ success: true, message: 'Student deleted' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get my student stats
exports.getMyStudentStats = async (req, res) => {
  try {
    const repId = req.user.id;
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const baseFilter = { addedByRepresentative: repId, isDeleted: { $ne: true } };

    const [totalStudents, weeklyStudents, monthlyStudents, typeBreakdown] = await Promise.all([
      Intern.countDocuments(baseFilter),
      Intern.countDocuments({ ...baseFilter, createdAt: { $gte: weekStart } }),
      Intern.countDocuments({ ...baseFilter, createdAt: { $gte: monthStart } }),
      Intern.aggregate([
        { $match: baseFilter },
        { $group: { _id: '$studentType', count: { $sum: 1 } } }
      ])
    ]);

    const byType = {
      internship: 0,
      smsProgram: 0
    };

    typeBreakdown.forEach((item) => {
      if (item._id === 'Internship') {
        byType.internship = item.count;
      }
      if (item._id === 'SMS Program') {
        byType.smsProgram = item.count;
      }
    });

    res.status(200).json({
      success: true,
      stats: {
        totalStudents,
        weeklyStudents,
        monthlyStudents,
        byType
      }
    });
  } catch (error) {
    console.error('Get representative stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
