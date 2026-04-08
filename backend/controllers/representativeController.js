const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Representative = require('../models/Representative');
const Intern = require('../models/Intern');
const RepresentativePayout = require('../models/RepresentativePayout');
const { sendInternCredentials } = require('../config/emailService');

// Generate unique Intern ID based on type with new format
// Format: PRS/MAR26004/DJS (PRS = internship, PSMS = SMS program)
// MAR = month, 26 = year, 004 = count in month, DJS = first 3 letters of name
const generateInternId = async (studentType, internName) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  // Get month abbreviation
  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 
                      'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const monthAbbr = monthNames[currentMonth];
  
  // Get last 2 digits of year
  const yearSuffix = String(currentYear).slice(-2);
  
  // Get first 3 letters of name (uppercase)
  const nameAbbr = (internName || 'XXX').substring(0, 3).toUpperCase();
  
  // Determine prefix
  const prefix = studentType === 'SMS Program' ? 'PSMS' : 'PRS';
  
  // Get the start and end of current month
  const monthStart = new Date(currentYear, currentMonth, 1);
  const monthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
  
  // Count interns added in current month with same studentType
  const count = await Intern.countDocuments({
    studentType: studentType,
    createdAt: { $gte: monthStart, $lte: monthEnd }
  });
  
  const nextNumber = count + 1;
  const numberPart = String(nextNumber).padStart(3, '0');
  
  // Build the ID
  let internId = `${prefix}/${monthAbbr}${yearSuffix}${numberPart}/${nameAbbr}`;
  
  // Check if this ID already exists (unlikely but possible)
  let counter = 1;
  while (await Intern.exists({ internId })) {
    const uniqueNumber = String(nextNumber + counter).padStart(3, '0');
    internId = `${prefix}/${monthAbbr}${yearSuffix}${uniqueNumber}/${nameAbbr}`;
    counter++;
  }

  return internId;
};

// Representative Login
exports.representativeLogin = async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = req.body?.password;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const rep = await Representative.findOne({ email }).lean();
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
    const {
      name,
      email,
      mobile,
      college,
      course,
      department,
      year,
      upiId,
      upiMobileNumber,
      designation,
      sheetLinks,
      internshipApplicationFormLink,
      internshipSheetLink,
      internshipPromotionalMessage,
      smsPromotionalMessage,
      instagramProfile,
      linkedinProfile,
      joiningDate,
      password
    } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = String(name).trim();
    if (college !== undefined) updateData.college = college;
    if (course !== undefined) updateData.course = course;
    if (department !== undefined) updateData.department = department;
    if (year !== undefined) updateData.year = year;
    if (mobile !== undefined) updateData.mobile = mobile;
    if (email !== undefined) updateData.email = String(email).trim().toLowerCase();
    if (upiId !== undefined) updateData.upiId = upiId;
    if (upiMobileNumber !== undefined) updateData.upiMobileNumber = upiMobileNumber;
    if (designation !== undefined) updateData.designation = designation;
    if (sheetLinks !== undefined) updateData.sheetLinks = sheetLinks;
    if (internshipApplicationFormLink !== undefined) updateData.internshipApplicationFormLink = internshipApplicationFormLink;
    if (internshipSheetLink !== undefined) updateData.internshipSheetLink = internshipSheetLink;
    if (internshipPromotionalMessage !== undefined) updateData.internshipPromotionalMessage = internshipPromotionalMessage;
    if (smsPromotionalMessage !== undefined) updateData.smsPromotionalMessage = smsPromotionalMessage;
    if (instagramProfile !== undefined) updateData.instagramProfile = instagramProfile;
    if (linkedinProfile !== undefined) updateData.linkedinProfile = linkedinProfile;
    if (joiningDate !== undefined) updateData.joiningDate = joiningDate;

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
      internId,
      name,
      email,
      password,
      mobile,
      domain,
      joiningDate,
      endingDate,
      duration,
      collegeName,
      branch,
      yearOfStudy,
      paymentDoneBy,
      dateOfPayment,
      transactionId,
      paymentAmount,
      completedFees,
      pendingFees,
      lastPaymentDate,
      currentDesignation,
      suggestedDomain,
      currentQualification,
      instituteName,
      instituteLocation,
      enrolmentDate,
      enrolBatchMonth,
      totalFees,
      firstPaymentAmount,
      firstPaymentDate,
      secondPaymentAmount,
      secondPaymentDate,
      finalPaymentAmount,
      finalPaymentDate
    } = req.body;

    if (!studentType || !name || !email || !password || !mobile) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    if (studentType === 'Internship' && (!internId || !domain || !joiningDate || !duration || !collegeName || !branch || !yearOfStudy)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all internship required fields'
      });
    }

    if (
      studentType === 'SMS Program' &&
      (!internId || !suggestedDomain || !instituteName || !yearOfStudy || !enrolmentDate || !enrolBatchMonth || !totalFees)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all SMS required fields'
      });
    }

    const existingIntern = await Intern.findOne({ email });
    if (existingIntern) {
      return res.status(400).json({ success: false, message: 'Student with this email already exists' });
    }

    const resolvedInternId = String(internId || '').trim();
    if (!resolvedInternId) {
      return res.status(400).json({ success: false, message: 'Please provide a valid student ID' });
    }

    const existingInternId = await Intern.findOne({ internId: resolvedInternId });
    if (existingInternId) {
      return res.status(400).json({ success: false, message: 'Student with this intern ID already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const internData = {
      studentType,
      name,
      email,
      mobile,
      internId: resolvedInternId,
      password: hashedPassword,
      role: 'intern',
      addedByRepresentative: req.user.id
    };

    if (studentType === 'Internship') {
      internData.domain = domain;
      internData.joiningDate = joiningDate;
      internData.duration = duration;
      internData.collegeName = collegeName;
      internData.branch = branch;
      internData.yearOfStudy = yearOfStudy;
      if (endingDate) {
        internData.endingDate = endingDate;
      }
    } else if (studentType === 'SMS Program') {
      internData.paymentDoneBy = paymentDoneBy;
      internData.dateOfPayment = dateOfPayment;
      internData.transactionId = transactionId;
      internData.paymentAmount = paymentAmount;
      internData.completedFees = completedFees || '0';
      internData.pendingFees = pendingFees || '0';
      internData.lastPaymentDate = lastPaymentDate || dateOfPayment || null;
      internData.currentDesignation = currentDesignation || 'Student';
      internData.suggestedDomain = suggestedDomain;
      internData.currentQualification = currentQualification;
      internData.instituteName = instituteName;
      internData.instituteLocation = instituteLocation;
      internData.yearOfStudy = yearOfStudy;
      internData.enrolmentDate = enrolmentDate;
      internData.enrolBatchMonth = enrolBatchMonth;
      internData.totalFees = totalFees;
      internData.firstPaymentAmount = firstPaymentAmount;
      internData.firstPaymentDate = firstPaymentDate;
      internData.secondPaymentAmount = secondPaymentAmount;
      internData.secondPaymentDate = secondPaymentDate;
      internData.finalPaymentAmount = finalPaymentAmount;
      internData.finalPaymentDate = finalPaymentDate;
    }

    const files = req.files || {};
    if (Object.keys(files).length > 0) {
      internData.documents = internData.documents || {};

      if (files.smsProgramEnrollmentLetter && files.smsProgramEnrollmentLetter[0]) {
        internData.documents.smsProgramEnrollmentLetter = {
          filename: files.smsProgramEnrollmentLetter[0].filename,
          filepath: files.smsProgramEnrollmentLetter[0].path,
          uploadedAt: new Date()
        };
      }

      if (files.offerLetter && files.offerLetter[0]) {
        internData.documents.offerLetter = {
          filename: files.offerLetter[0].filename,
          filepath: files.offerLetter[0].path,
          uploadedAt: new Date()
        };
      }

      if (files.paymentReceipt && files.paymentReceipt[0]) {
        internData.documents.paymentReceipt = {
          filename: files.paymentReceipt[0].filename,
          filepath: files.paymentReceipt[0].path,
          uploadedAt: new Date()
        };
      }
    }

    const intern = new Intern(internData);
    await intern.save();

    // Send email in background so API responds immediately
    sendInternCredentials(name, email, resolvedInternId, password)
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
        return res.status(409).json({ success: false, message: 'Student with this intern ID already exists' });
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
      .populate('addedByRepresentative', 'name')
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

// Get representative payout/reward history
exports.getMyPayouts = async (req, res) => {
  try {
    const payouts = await RepresentativePayout.find({ representative: req.user.id })
      .sort({ weekStartDate: -1 })
      .limit(50);

    res.status(200).json({ success: true, count: payouts.length, payouts });
  } catch (error) {
    console.error('Get representative payouts error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
