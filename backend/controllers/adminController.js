const bcrypt = require('bcryptjs');
const Intern = require('../models/Intern');
const Trainer = require('../models/Trainer');
const Representative = require('../models/Representative');
const RepresentativePayout = require('../models/RepresentativePayout');
const StudentGroup = require('../models/StudentGroup');
const Notification = require('../models/Notification');
const JobPosting = require('../models/JobPosting');
const Interview = require('../models/Interview');
const Aptitude = require('../models/Aptitude');
const Assessment = require('../models/Assessment');
const Training = require('../models/Training');
const Activity = require('../models/Activity');
const { createRepresentativeNotification } = require('../utils/representativeNotification');

const createActivityNotification = async ({ title, message, type, studentIds, adminId, activityId }) => {
  if (!studentIds || studentIds.length === 0) return;
  try {
    let notifType = 'General/Announcement';
    const lowerType = String(type).toLowerCase();
    if (lowerType.includes('interview')) {
      notifType = 'Interview';
    } else if (lowerType.includes('gd')) {
      notifType = 'GD';
    } else if (lowerType.includes('assessment')) {
      notifType = 'Test/Assessment';
    }

    const notification = new Notification({
      title,
      message,
      notificationType: notifType,
      sendTo: studentIds.length === 1 ? 'Individual' : 'Group',
      recipientIds: studentIds,
      recipientModel: 'Intern',
      createdBy: adminId,
      activityId
    });
    await notification.save();
  } catch (error) {
    console.error('Failed to create student activity notification:', error);
  }
};

const PASSWORD_SALT_ROUNDS = (() => {
  const defaultRounds = process.env.NODE_ENV === 'production' ? 10 : 4;
  const parsed = Number.parseInt(process.env.PASSWORD_SALT_ROUNDS || String(defaultRounds), 10);
  if (Number.isNaN(parsed)) return defaultRounds;
  return Math.min(Math.max(parsed, 4), 12);
})();

const generateRepresentativeId = async () => {
  const baseCount = await Representative.countDocuments({});
  let sequence = baseCount + 1;

  while (true) {
    const candidate = `PGIR${String(sequence).padStart(4, '0')}`;
    const exists = await Representative.findOne({ pgirId: candidate }).select('_id');
    if (!exists) return candidate;
    sequence += 1;
  }
};

const generateFallbackRepresentativeId = () =>
  `PGIR${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)
    .toString()
    .padStart(2, '0')}`;

const resolveRewardPercent = (totalEnrollmentCount = 0) => {
  const slabs = [
    { min: 100, value: 21 },
    { min: 20, value: 20 },
    { min: 16, value: 19 },
    { min: 15, value: 18 },
    { min: 11, value: 17 },
    { min: 10, value: 15 },
    { min: 6, value: 15 },
    { min: 5, value: 13 },
    { min: 3, value: 13 },
    { min: 2, value: 12 },
    { min: 1, value: 10 },
  ];

  const match = slabs.find((slab) => totalEnrollmentCount >= slab.min);
  return match ? match.value : 0;
};

const computePayoutFields = (totalEnrollmentCount = 0, studentsWith3000Paid = 0) => {
  const normalizedTotal = Number(totalEnrollmentCount) || 0;
  const normalizedPaid = Number(studentsWith3000Paid) || 0;
  const payoutEligible = normalizedTotal === normalizedPaid ? 'Yes' : 'No';
  const rewardPercent = resolveRewardPercent(normalizedTotal);
  const payoutAmount =
    payoutEligible === 'Yes'
      ? (normalizedTotal * 5500 * rewardPercent) / 100
      : 0;

  return { payoutEligible, rewardPercent, payoutAmount };
};

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

// Add new intern
exports.addIntern = async (req, res) => {
  try {
    const {
      studentType,
      internId,
      name,
      email,
      password,
      mobile,
      // Internship fields
      domain,
      joiningDate,
      endingDate,
      duration,
      collegeName,
      branch,
      yearOfStudy,
      // SMS Program fields
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
      finalPaymentDate,
      groupId
    } = req.body;

    // Validation
    if (!studentType || !name || !email || !password || !mobile) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Type-specific validation
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

    // Check if intern already exists
    const existingIntern = await Intern.findOne({ email });
    if (existingIntern) {
      return res.status(400).json({
        success: false,
        message: 'Student with this email already exists'
      });
    }

    // Use admin-provided ID for both Internship (PIID) and SMS Program (PSMS ID).
    const resolvedInternId = String(internId || '').trim();

    if (!resolvedInternId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid intern ID'
      });
    }

    const existingInternId = await Intern.findOne({ internId: resolvedInternId });
    if (existingInternId) {
      return res.status(400).json({
        success: false,
        message: 'Student with this intern ID already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new intern
    const internData = {
      studentType,
      name,
      email,
      mobile,
      internId: resolvedInternId,
      password: hashedPassword,
      plainPassword: password,
      role: 'intern'
    };

    // Add type-specific fields
    if (studentType === 'Internship') {
      internData.domain = domain;
      internData.joiningDate = joiningDate;
      internData.duration = duration;
      internData.collegeName = collegeName;
      internData.branch = branch;
      internData.yearOfStudy = yearOfStudy;
      internData.stipendType = req.body.stipendType || 'Unstipend';
      if (req.body.stipendType === 'Stipend' && req.body.stipendAmount) internData.stipendAmount = String(req.body.stipendAmount);
      // endingDate is optional, can be calculated later if needed
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

    // If files were uploaded via multipart/form-data (welcomeLetter, offerLetter, paymentReceipt), attach to documents
    const files = req.files || {};
    if (Object.keys(files).length > 0) {
      internData.documents = internData.documents || {};

      if (files.welcomeLetter && files.welcomeLetter[0]) {
        internData.documents.welcomeLetter = {
          filename: files.welcomeLetter[0].filename,
          filepath: files.welcomeLetter[0].path,
          uploadedAt: new Date()
        };
      }

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

    // If groupId is provided, assign the intern to that group
    if (groupId) {
      await StudentGroup.findByIdAndUpdate(groupId, {
        $addToSet: { students: intern._id }
      });
    }

    // Return saved intern (without password) so frontend gets all persisted fields
    const saved = await Intern.findById(intern._id).select('-password').populate('addedByRepresentative', 'name');
    res.status(201).json({
      success: true,
      message: 'Student added successfully',
      intern: saved
    });

  } catch (error) {
    console.error('Add intern error:', error);

    if (error?.code === 11000) {
      if (error?.keyPattern?.email) {
        return res.status(409).json({ success: false, message: 'Student with this email already exists' });
      }
      if (error?.keyPattern?.internId) {
        return res.status(409).json({ success: false, message: 'Could not generate unique intern ID. Please retry.' });
      }
    }

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get all interns (exclude soft-deleted)
exports.getAllInterns = async (req, res) => {
  try {
    const interns = await Intern.find({ isDeleted: { $ne: true } })
      .select('-password')
      .populate('assignedTrainer', 'name email')
      .populate('addedByRepresentative', 'name');
    
    res.status(200).json({
      success: true,
      count: interns.length,
      interns
    });

  } catch (error) {
    console.error('Get interns error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Delete all interns
exports.deleteAllInterns = async (req, res) => {
  try {
    const result = await Intern.deleteMany({});
    
    res.status(200).json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} interns`,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('Delete all interns error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Soft delete single intern (move to recycle bin)
exports.deleteIntern = async (req, res) => {
  try {
    const { id } = req.params;

    const intern = await Intern.findByIdAndUpdate(
      id,
      { 
        isDeleted: true,
        deletedAt: new Date()
      },
      { new: true }
    );

    if (!intern) {
      return res.status(404).json({
        success: false,
        message: 'Intern not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Intern moved to recycle bin successfully'
    });

  } catch (error) {
    console.error('Delete intern error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get deleted interns (Recycle Bin)
exports.getDeletedInterns = async (req, res) => {
  try {
    const deletedInterns = await Intern.find({ isDeleted: true })
      .select('-password')
      .sort({ deletedAt: -1 });

    res.status(200).json({
      success: true,
      data: deletedInterns
    });
  } catch (error) {
    console.error('Get deleted interns error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Restore intern from recycle bin
exports.restoreIntern = async (req, res) => {
  try {
    const { id } = req.params;

    const intern = await Intern.findByIdAndUpdate(
      id,
      { 
        isDeleted: false,
        deletedAt: null
      },
      { new: true }
    ).select('-password');

    if (!intern) {
      return res.status(404).json({
        success: false,
        message: 'Intern not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Intern restored successfully',
      intern
    });

  } catch (error) {
    console.error('Restore intern error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Permanently delete intern
exports.permanentlyDeleteIntern = async (req, res) => {
  try {
    const { id } = req.params;

    const intern = await Intern.findByIdAndDelete(id);

    if (!intern) {
      return res.status(404).json({
        success: false,
        message: 'Intern not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Intern permanently deleted'
    });

  } catch (error) {
    console.error('Permanent delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get dashboard statistics
exports.getStats = async (req, res) => {
  try {
    const totalInterns = await Intern.countDocuments();
    const activeInterns = await Intern.countDocuments({ status: 'active' });
    const completedInterns = await Intern.countDocuments({ status: 'completed' });

    // Get interns added this month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthInterns = await Intern.countDocuments({
      createdAt: { $gte: firstDayOfMonth }
    });

    res.status(200).json({
      success: true,
      stats: {
        totalInterns,
        activeInterns,
        completedInterns,
        thisMonthInterns
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Update intern status
exports.updateInternStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, message } = req.body;

    // Accept valid statuses (case-insensitive)
    const allowed = ['active', 'completed', 'inactive'];
    if (!status || !allowed.includes(String(status).toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Allowed: active, completed, inactive'
      });
    }

    const normalizedStatus = String(status).toLowerCase();

    const updates = { status: normalizedStatus };
    if (normalizedStatus === 'inactive') {
      updates.inactiveMessage = String(message || '').trim();
    } else {
      // Clear inactive message when activating or completing
      updates.inactiveMessage = '';
    }

    const intern = await Intern.findByIdAndUpdate(id, updates, { new: true }).select('-password');

    if (!intern) {
      return res.status(404).json({
        success: false,
        message: 'Intern not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Intern status updated successfully',
      intern
    });

  } catch (error) {
    console.error('Update intern status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Update intern details
exports.updateIntern = async (req, res) => {
  try {
    const { id } = req.params;

    // Only allow updating of specific fields
    const allowed = [
      'name',
      'email',
      'mobile',
      'studentType',
      'domain',
      'joiningDate',
      'endingDate',
      'duration',
      'collegeName',
      'branch',
      'yearOfStudy',
      'suggestedDomain',
      'currentQualification',
      'instituteName',
      'instituteLocation',
      'enrolmentDate',
      'enrolBatchMonth',
      'totalFees',
      'firstPaymentAmount',
      'firstPaymentDate',
      'secondPaymentAmount',
      'secondPaymentDate',
      'finalPaymentAmount',
      'finalPaymentDate',
      'gender',
      'paymentDoneBy',
      'dateOfPayment',
      'transactionId',
      'paymentAmount',
      'completedFees',
      'pendingFees',
      'lastPaymentDate',
      'currentDesignation',
      'stipendType',
      'stipendAmount',
      'password',
      'status'
    ];

    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined && key !== 'password') updates[key] = req.body[key];
    }

    if (req.body.password !== undefined && String(req.body.password).trim() !== '') {
      updates.password = await bcrypt.hash(req.body.password, 10);
      updates.plainPassword = req.body.password;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    const intern = await Intern.findByIdAndUpdate(id, updates, { new: true }).select('-password');

    if (!intern) {
      return res.status(404).json({ success: false, message: 'Intern not found' });
    }

    res.status(200).json({ success: true, message: 'Intern updated successfully', intern });

  } catch (error) {
    console.error('Update intern error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ========== TRAINER MANAGEMENT ==========

const normalizeEmployeeRole = (role, customRole) => {
  const normalizedRole = String(role || 'trainer').toLowerCase();
  if (normalizedRole === 'other') {
    return {
      role: 'other',
      customRole: String(customRole || '').trim(),
    };
  }

  if (normalizedRole === 'hr') {
    return { role: 'hr', customRole: '' };
  }

  return { role: 'trainer', customRole: '' };
};

// Add new trainer / employee
exports.addTrainer = async (req, res) => {
  try {
    const { name, email, password, mobile, role, customRole, joiningDate } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const normalizedEmail = String(email).toLowerCase();

    const [existingTrainer, hashedPassword] = await Promise.all([
      Trainer.findOne({ email: normalizedEmail }).select('_id'),
      bcrypt.hash(password, PASSWORD_SALT_ROUNDS)
    ]);

    if (existingTrainer) {
      return res.status(400).json({
        success: false,
        message: 'Trainer with this email already exists'
      });
    }

    const normalized = normalizeEmployeeRole(role, customRole);

    const trainer = new Trainer({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      plainPassword: password,
      mobile,
      role: normalized.role,
      customRole: normalized.customRole,
      joiningDate: joiningDate || null
    });

    await trainer.save();

    res.status(201).json({
      success: true,
      message: 'Employee added successfully',
      trainer: {
        id: trainer._id,
        name: trainer.name,
        email: trainer.email,
        role: trainer.role,
        customRole: trainer.customRole,
        joiningDate: trainer.joiningDate
      }
    });

  } catch (error) {
    console.error('Add trainer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Update trainer / employee
exports.updateTrainer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, mobile, status, role, customRole, joiningDate, password } = req.body;

    const trainer = await Trainer.findById(id);
    if (!trainer) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    if (email && email.toLowerCase() !== trainer.email) {
      const existingTrainer = await Trainer.findOne({ email: email.toLowerCase(), _id: { $ne: id } });
      if (existingTrainer) {
        return res.status(400).json({ success: false, message: 'Email already in use by another employee' });
      }
      trainer.email = email.toLowerCase();
    }

    if (name !== undefined) trainer.name = name;
    if (mobile !== undefined) trainer.mobile = mobile;
    if (joiningDate !== undefined) trainer.joiningDate = joiningDate || null;
    if (status !== undefined) trainer.status = String(status).toLowerCase();

    if (role !== undefined || customRole !== undefined) {
      const normalized = normalizeEmployeeRole(role ?? trainer.role, customRole ?? trainer.customRole);
      trainer.role = normalized.role;
      trainer.customRole = normalized.customRole;
    }

    if (password !== undefined && String(password || '').trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      trainer.password = await bcrypt.hash(String(password).trim(), salt);
      trainer.plainPassword = String(password).trim();
    }

    if (req.body.assignedStudents !== undefined && Array.isArray(req.body.assignedStudents)) {
      const prevStudents = trainer.assignedStudents || [];
      await Intern.updateMany(
        { _id: { $in: prevStudents }, assignedTrainer: id },
        { $unset: { assignedTrainer: 1 } }
      );
      const newStudentIds = [...new Set(req.body.assignedStudents.map(sId => String(sId)))].filter(Boolean);
      trainer.assignedStudents = newStudentIds;
      await Intern.updateMany(
        { _id: { $in: newStudentIds } },
        { assignedTrainer: id }
      );
    }

    if (req.body.assignedGroups !== undefined && Array.isArray(req.body.assignedGroups)) {
      const newGroupIds = [...new Set(req.body.assignedGroups.map(gId => String(gId)))].filter(Boolean);
      trainer.assignedGroups = newGroupIds;
    }

    await trainer.save();

    const updatedTrainer = await Trainer.findById(trainer._id)
      .select('-password')
      .populate('assignedStudents', 'name email internId studentType status assignedTrainer')
      .populate('assignedGroups', 'groupName groupNumber students createdAt')
      .populate({
        path: 'workAssignments.assignedStudents',
        select: '_id name email internId',
        options: { lean: false }
      })
      .populate({
        path: 'workAssignments.assignedGroups',
        select: '_id groupName groupNumber',
        options: { lean: false }
      });

    res.status(200).json({ success: true, message: 'Employee updated successfully', trainer: updatedTrainer });
  } catch (error) {
    console.error('Update trainer error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete trainer
exports.deleteTrainer = async (req, res) => {
  try {
    const trainer = await Trainer.findByIdAndDelete(req.params.id);
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Trainer deleted successfully'
    });
  } catch (error) {
    console.error('Delete trainer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Delete all performance records for a student
exports.deleteStudentPerformanceRecords = async (req, res) => {
  try {
    const { studentId } = req.params;

    const [interviewsResult, aptitudeResult, assessmentsResult, trainingsResult] = await Promise.all([
      Interview.deleteMany({ studentId }),
      Aptitude.deleteMany({ studentId }),
      Assessment.deleteMany({ studentId }),
      Training.deleteMany({ studentId }),
    ]);

    res.status(200).json({
      success: true,
      message: 'Student performance records deleted successfully',
      deletedCounts: {
        interviews: interviewsResult.deletedCount,
        aptitude: aptitudeResult.deletedCount,
        assessments: assessmentsResult.deletedCount,
        trainings: trainingsResult.deletedCount,
      },
    });
  } catch (error) {
    console.error('Delete student performance records error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Assign students to trainer
exports.assignStudentsToTrainer = async (req, res) => {
  try {
    console.log('Assign students request received:', req.body);
    console.log('User from token:', req.user);

    const { trainerId, studentIds } = req.body;
    const uniqueStudentIds = [...new Set((studentIds || []).map((id) => String(id)))];

    // Validation
    if (!trainerId || !studentIds || !Array.isArray(studentIds) || uniqueStudentIds.length === 0) {
      console.log('Validation failed: missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Trainer ID and student IDs are required'
      });
    }

    // Check if trainer exists (minimal fields only)
    const trainer = await Trainer.findById(trainerId).select('name email mobile');
    if (!trainer) {
      console.log('Trainer not found:', trainerId);
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    // Check if all students exist
    const students = await Intern.find({ _id: { $in: uniqueStudentIds } })
      .select('name email internId');
    if (students.length !== uniqueStudentIds.length) {
      console.log('Some students not found. Requested:', uniqueStudentIds.length, 'Found:', students.length);
      return res.status(404).json({
        success: false,
        message: 'One or more students not found'
      });
    }

    console.log('Assigning students to trainer:', trainer.name);

    // Update assignments with atomic operators for better performance on large datasets.
    await Promise.all([
      Trainer.updateOne(
        { _id: trainerId },
        { $addToSet: { assignedStudents: { $each: uniqueStudentIds } } }
      ),
      Intern.updateMany(
        { _id: { $in: uniqueStudentIds } },
        { assignedTrainer: trainerId }
      )
    ]);

    console.log('Assignment successful');

    res.status(200).json({
      success: true,
      message: `${uniqueStudentIds.length} student(s) assigned successfully to ${trainer.name}`
    });

  } catch (error) {
    console.error('Assign students error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid trainer or student ID format'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Assign groups to employee
exports.assignGroupsToTrainer = async (req, res) => {
  try {
    const { trainerId, groupIds } = req.body;

    if (!trainerId || !Array.isArray(groupIds) || groupIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Employee ID and group IDs are required' });
    }

    const trainer = await Trainer.findById(trainerId);
    if (!trainer) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const groups = await StudentGroup.find({ _id: { $in: groupIds } });
    if (groups.length !== groupIds.length) {
      return res.status(404).json({ success: false, message: 'One or more groups not found' });
    }

    trainer.assignedGroups = [...new Set([...trainer.assignedGroups.map((id) => String(id)), ...groupIds.map((id) => String(id))])];
    await trainer.save();

    // Keep group-level assigned employee names in sync for Group Management UI.
    await StudentGroup.updateMany(
      { _id: { $in: groupIds } },
      { $addToSet: { assignedEmployees: trainer.name } },
    );

    res.status(200).json({ success: true, message: `${groupIds.length} group(s) assigned successfully` });
  } catch (error) {
    console.error('Assign groups error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Assign work to employee
exports.assignWorkToTrainer = async (req, res) => {
  try {
    const { trainerId, title, description, workDate, studentIds, groupIds } = req.body;
    const adminId = req.user.id;

    if (!trainerId || !title || !description || !workDate) {
      return res.status(400).json({ success: false, message: 'Employee, title, description, and work date are required' });
    }

    const trainer = await Trainer.findById(trainerId);
    if (!trainer) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const workItem = {
      title,
      description,
      workDate,
      assignedStudents: Array.isArray(studentIds) ? studentIds : [],
      assignedGroups: Array.isArray(groupIds) ? groupIds : [],
      createdAt: new Date()
    };

    trainer.workAssignments = trainer.workAssignments || [];
    trainer.workAssignments.push(workItem);
    await trainer.save();

    // Create notifications for trainer and affected students
    try {
      const recipientInternIds = new Set();

      if (Array.isArray(studentIds) && studentIds.length > 0) {
        studentIds.forEach((id) => recipientInternIds.add(String(id)));
      }

      if (Array.isArray(groupIds) && groupIds.length > 0) {
        const groups = await StudentGroup.find({ _id: { $in: groupIds } }).select('students').lean();
        groups.forEach((g) => {
          (g.students || []).forEach((s) => recipientInternIds.add(String(s)));
        });
      }

      const internRecipients = Array.from(recipientInternIds);

      const notifDateStr = workDate ? new Date(workDate).toLocaleString() : new Date().toLocaleString();

      // Notify interns (individual or group)
      if (internRecipients.length > 0) {
        const internNotification = new Notification({
          title: `New Work Assignment: ${title}`,
          message: `${description}\nDate: ${notifDateStr}`,
          notificationType: 'General/Announcement',
          sendTo: internRecipients.length === 1 ? 'Individual' : 'Group',
          recipientIds: internRecipients,
          recipientModel: 'Intern',
          createdBy: adminId
        });
        await internNotification.save();
      }

      // Notify trainer as individual
      const trainerNotification = new Notification({
        title: `Assigned Work: ${title}`,
        message: `${description}\nDate: ${notifDateStr}`,
        notificationType: 'General/Announcement',
        sendTo: 'Individual',
        recipientIds: [trainerId],
        recipientModel: 'Trainer',
        createdBy: adminId
      });
      await trainerNotification.save();
    } catch (notifyErr) {
      console.error('Assign work — notification creation error:', notifyErr);
      // continue without failing the main request
    }

    res.status(201).json({ success: true, message: 'Work assigned successfully', workItem });
  } catch (error) {
    console.error('Assign work error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get all trainers
exports.getAllTrainers = async (req, res) => {
  try {
    const trainers = await Trainer.find()
      .select('-password')
      .populate('assignedStudents', 'name email internId studentType status')
      .populate('assignedGroups', 'groupName groupNumber students createdAt')
      .populate({
        path: 'workAssignments.assignedStudents',
        select: '_id name email internId',
        options: { lean: false }
      })
      .populate({
        path: 'workAssignments.assignedGroups',
        select: '_id groupName groupNumber',
        options: { lean: false }
      });

    res.status(200).json({
      success: true,
      count: trainers.length,
      trainers
    });

  } catch (error) {
    console.error('Get trainers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ========== NOTIFICATIONS ==========

// Create notification
exports.createNotification = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { 
      notificationType, 
      recipientType, 
      subject, 
      message, 
      recipientIds, 
      selectedGroups 
    } = req.body;

    // Validation
    if (!subject || !message || !notificationType) {
      return res.status(400).json({
        success: false,
        message: 'Subject, message, and notification type are required'
      });
    }

    let parsedRecipientIds = [];
    let finalRecipientType = notificationType;
    let sendTo = notificationType;
    let recipientModel = recipientType === 'Student' ? 'Intern' : 'Trainer';

    // Parse recipient IDs if provided
    if (recipientIds) {
      try {
        parsedRecipientIds = typeof recipientIds === 'string' ? JSON.parse(recipientIds) : recipientIds;
      } catch (e) {
        parsedRecipientIds = [];
      }
    }

    // Handle Group notifications - fetch recipients based on selected groups
    if (notificationType === 'Group') {
      try {
        const selectedGroupsArray = typeof selectedGroups === 'string' ? JSON.parse(selectedGroups) : selectedGroups || [];
        
        if (recipientType === 'Student') {
          // Fetch students from selected groups
          const selectedInterns = await Intern.find({
            studentType: { $in: selectedGroupsArray }
          }).select('_id');
          parsedRecipientIds = selectedInterns.map(intern => intern._id);
        } else if (recipientType === 'Trainer') {
          // Fetch trainers (or all trainers based on selected groups)
          const trainers = await Trainer.find({}).select('_id');
          parsedRecipientIds = trainers.map(trainer => trainer._id);
        }
      } catch (e) {
        console.error('Error parsing selected groups:', e);
      }
    }

    const notification = new Notification({
      title: subject,
      message,
      notificationType: 'General/Announcement',
      sendTo,
      recipientIds: parsedRecipientIds,
      recipientModel,
      createdBy: adminId
    });

    // Handle file attachment if present
    if (req.file) {
      notification.attachment = {
        filename: req.file.filename,
        filepath: req.file.path,
        mimetype: req.file.mimetype
      };
    }

    await notification.save();

    if (notificationType === 'All') {
      try {
        const representatives = await Representative.find({}).select('_id');
        await Promise.all(
          representatives.map((rep) =>
            createRepresentativeNotification({
              representativeId: rep._id,
              title: subject,
              message,
              notificationType: 'General/Announcement',
              createdBy: adminId,
            }),
          ),
        );
      } catch (repNotifyError) {
        console.error('Create representative notifications error:', repNotifyError);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      notification: {
        _id: notification._id,
        subject: notification.title,
        message: notification.message,
        recipientCount: parsedRecipientIds.length,
        type: notificationType,
        createdAt: notification.createdAt
      }
    });

  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get a student's activity records for the admin report page
exports.getStudentRecords = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Intern.findById(studentId).select('_id name internId email studentType status joiningDate mobile');
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const interviews = await Interview.find({ studentId }).sort({ date: -1 });
    const aptitudes = await Aptitude.find({ studentId }).sort({ createdAt: -1 });
    const assessments = await Assessment.find({ studentId }).sort({ createdAt: -1 });
    const trainings = await Training.find({ studentId }).sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: {
        student,
        interviews,
        aptitudes,
        assessments,
        trainings
      }
    });
  } catch (error) {
    console.error('Get student records error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get all notifications
exports.getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: notifications.length,
      notifications
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Try deleting the attachment file if it exists
    if (notification.attachment && notification.attachment.filename) {
      try {
        const fs = require('fs');
        const path = require('path');
        const filePath = path.join(__dirname, '..', 'uploads', 'notifications', notification.attachment.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.error('Failed to delete notification attachment file:', err);
      }
    }

    await Notification.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ========== JOB POSTINGS ==========

// Create job posting
exports.createJobPosting = async (req, res) => {
  try {
    const adminId = req.user.id;
    const {
      opportunityType,
      company,
      location,
      domain,
      title,
      eligibilityCriteria,
      eligibility,
      description,
      requirements,
      applicationLink,
      applicationInstructions,
      salary,
      deadline
    } = req.body;

    const normalizedEligibility = eligibilityCriteria || eligibility || requirements;
    const normalizedDescription = description || requirements;

    const jobPosting = new JobPosting({
      opportunityType,
      company,
      location,
      domain,
      title,
      eligibilityCriteria: normalizedEligibility,
      description: normalizedDescription,
      requirements,
      applicationLink,
      applicationInstructions,
      salary,
      deadline,
      postedBy: adminId,
      postedByModel: 'Admin'
    });

    await jobPosting.save();

    res.status(201).json({
      success: true,
      message: 'Job posting created successfully',
      jobPosting
    });

  } catch (error) {
    console.error('Create job posting error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get all job postings
exports.getAllJobPostings = async (req, res) => {
  try {
    const jobPostings = await JobPosting.find()
      .populate('postedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: jobPostings.length,
      jobPostings
    });

  } catch (error) {
    console.error('Get job postings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Update job posting
exports.updateJobPosting = async (req, res) => {
  try {
    const postingId = req.params.id;
    const updatePayload = {
      opportunityType: req.body.opportunityType,
      company: req.body.company,
      location: req.body.location,
      domain: req.body.domain,
      title: req.body.title,
      eligibilityCriteria: req.body.eligibilityCriteria,
      description: req.body.description,
      requirements: req.body.requirements,
      applicationLink: req.body.applicationLink,
      applicationInstructions: req.body.applicationInstructions,
      salary: req.body.salary,
      status: req.body.status,
      deadline: req.body.deadline || undefined,
    };

    const updatedPosting = await JobPosting.findByIdAndUpdate(
      postingId,
      { $set: updatePayload },
      { new: true, runValidators: true }
    );

    if (!updatedPosting) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Job posting updated successfully',
      jobPosting: updatedPosting
    });
  } catch (error) {
    console.error('Update job posting error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Delete job posting
exports.deleteJobPosting = async (req, res) => {
  try {
    const postingId = req.params.id;
    const deletedPosting = await JobPosting.findByIdAndDelete(postingId);

    if (!deletedPosting) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Job posting deleted successfully'
    });
  } catch (error) {
    console.error('Delete job posting error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Repost job posting
exports.repostJobPosting = async (req, res) => {
  try {
    const postingId = req.params.id;
    const repostedPosting = await JobPosting.findByIdAndUpdate(
      postingId,
      { status: 'active' },
      { new: true }
    );

    if (!repostedPosting) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Job posting reposted successfully',
      jobPosting: repostedPosting
    });
  } catch (error) {
    console.error('Repost job posting error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ========== CERTIFICATES & DOCUMENTS ==========

const CERTIFICATE_TYPE_LABELS = {
  offerLetter: 'Internship Offer Letter',
  welcomeLetter: 'Welcome Letter',
  smsProgramEnrollmentLetter: 'SMS Program Enrollment Letter',
  paymentReceipt: 'Payment Receipt',
  completionLetter: 'Completion Letter',
  completionCertificate: 'Completion Certificate',
  experienceLetter: 'Experience Letter',
  designationLevel1Foundation: 'Designation Certificate - Level 1 (Foundation)',
  designationLevel2Competent: 'Designation Certificate - Level 2 (Competent)',
  designationLevel3Proficient: 'Designation Certificate - Level 3 (Proficient)',
  designationLevel4Expert: 'Designation Certificate - Level 4 (Expert)',
  programCompletionCertificate: 'Program Completion Certificate',
  domainTrainingCourseCompletion: 'Domain Training / Course Completion Certificate',
  recommendationsLetter: 'Recommendations Letter',
  appreciationLetter: 'Appreciation Letter',
  finalDesignationCertificate: 'Final Designation Certificate',
  representativeDesignationCertificate: 'Representative Designation Certificate'
};

// Upload document for student
exports.uploadStudentDocument = async (req, res) => {
  try {
    // Support studentId from either body or route param
    const studentId = req.body.studentId || req.params.studentId;
    const { documentType, certificateName } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const student = await Intern.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const docData = {
      filename: req.file.filename,
      filepath: req.file.path,
      uploadedAt: new Date()
    };

    const resolvedType = String(documentType || 'other').trim();
    const resolvedCertificateName = (certificateName || CERTIFICATE_TYPE_LABELS[resolvedType] || resolvedType || 'Certificate').trim();

    // Update specific document type
    if (resolvedType === 'offerLetter') {
      student.documents = student.documents || {};
      student.documents.offerLetter = docData;
    } else if (resolvedType === 'welcomeLetter') {
      student.documents = student.documents || {};
      student.documents.welcomeLetter = docData;
    } else if (resolvedType === 'smsProgramEnrollmentLetter') {
      student.documents = student.documents || {};
      student.documents.smsProgramEnrollmentLetter = docData;
    } else if (resolvedType === 'paymentReceipt') {
      student.documents = student.documents || {};
      student.documents.paymentReceipt = docData;
    } else if (resolvedType === 'completionCertificate' || resolvedType === 'completionLetter') {
      student.documents = student.documents || {};
      // Keep compatibility with existing UI keys.
      student.documents.completionLetter = docData;
      student.documents.completionCertificate = docData;
    } else if (resolvedType === 'experienceLetter') {
      student.documents = student.documents || {};
      student.documents.experienceLetter = docData;
    } else {
      // Store every non-core certificate in otherCertificates so intern dashboard always shows it.
      student.documents = student.documents || {};
      if (!student.documents.otherCertificates) {
        student.documents.otherCertificates = [];
      }
      student.documents.otherCertificates.push({
        name: resolvedCertificateName,
        ...docData
      });
    }

    await student.save();

    res.status(200).json({
      success: true,
      message: 'Document uploaded successfully',
      document: docData
    });

  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get student documents
// Allows admin to fetch any student's documents via params
// and allows an authenticated intern to fetch their own documents when no param provided
exports.getStudentDocuments = async (req, res) => {
  try {
    // Accept studentId from either params or fallback to the authenticated user id
    const studentId = req.params.studentId || req.user?.id;

    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student ID not provided' });
    }

    const student = await Intern.findById(studentId).select('documents name email internId studentType');
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.status(200).json({
      success: true,
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        internId: student.internId,
        studentType: student.studentType
      },
      documents: student.documents
    });

  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ========== REPRESENTATIVE MANAGEMENT ==========

// Add representative (Admin only)
exports.addRepresentative = async (req, res) => {
  try {
    const {
      pgirId,
      name,
      email,
      password,
      mobile,
      college,
      course,
      department,
      year,
      designation,
      sheetLinks,
      upiId,
      internshipApplicationFormLink,
      internshipSheetLink,
      internshipPromotionalMessage,
      smsPromotionalMessage,
      smsApplicationFormLink,
      smsSheetLink,
      joiningDate,
      instagramProfile,
      linkedinProfile,
      upiMobileNumber,
    } = req.body;

    const normalizedName = String(name || '').trim();
    const normalizedPgirId = String(pgirId || '').trim().toUpperCase();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedPassword = String(password || '').trim();

    if (!normalizedPgirId || !normalizedName || !normalizedEmail || !normalizedPassword) {
      return res.status(400).json({ success: false, message: 'PGIR ID, name, email and password are required' });
    }

    const existing = await Representative.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Representative with this email already exists' });
    }

    const existingPgir = await Representative.findOne({ pgirId: normalizedPgirId }).select('_id');
    if (existingPgir) {
      return res.status(409).json({ success: false, message: 'Representative with this PGIR ID already exists' });
    }

    const hashedPassword = await bcrypt.hash(normalizedPassword, 10);

    const rep = await Representative.create({
      pgirId: normalizedPgirId,
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
      plainPassword: normalizedPassword,
      mobile,
      college,
      course,
      department,
      year,
      designation: designation || 'Campus Representative',
      sheetLinks,
      internshipApplicationFormLink,
      internshipSheetLink,
      internshipPromotionalMessage,
      smsPromotionalMessage,
      smsApplicationFormLink,
      smsSheetLink,
      joiningDate: joiningDate || undefined,
      instagramProfile,
      linkedinProfile,
      upiId,
      upiMobileNumber,
      docs: {
        upiScanner: req.files?.upiScanner?.[0]
          ? {
              filename: req.files.upiScanner[0].filename,
              filepath: req.files.upiScanner[0].path,
              uploadedAt: new Date(),
            }
          : undefined,
        pgirSelectionLetter: req.files?.pgirSelectionLetter?.[0]
          ? {
              filename: req.files.pgirSelectionLetter[0].filename,
              filepath: req.files.pgirSelectionLetter[0].path,
              uploadedAt: new Date(),
            }
          : undefined,
        internshipOfferLetter: req.files?.internshipOfferLetter?.[0]
          ? {
              filename: req.files.internshipOfferLetter[0].filename,
              filepath: req.files.internshipOfferLetter[0].path,
              uploadedAt: new Date(),
            }
          : undefined,
      },
      role: 'representative'
    });

    res.status(201).json({
      success: true,
      message: 'Representative added successfully',
      representative: {
        id: rep._id,
        pgirId: rep.pgirId,
        name: rep.name,
        email: rep.email,
        college: rep.college,
        designation: rep.designation
      }
    });
  } catch (error) {
    console.error('Add representative error:', error);

    if (error?.code === 11000) {
      if (error?.keyPattern?.email) {
        return res.status(409).json({ success: false, message: 'Representative with this email already exists' });
      }
      if (error?.keyPattern?.pgirId) {
        return res.status(409).json({ success: false, message: 'Could not generate a unique representative ID. Please retry.' });
      }
      return res.status(409).json({ success: false, message: 'Duplicate representative data found. Please verify details.' });
    }

    res.status(500).json({
      success: false,
      message: error?.message ? `Server error: ${error.message}` : 'Server error'
    });
  }
};

// Get all representatives
exports.getAllRepresentatives = async (req, res) => {
  try {
    const { joiningMonth, batchMonth, name } = req.query;

    const repFilter = {};

    if (name) {
      repFilter.name = { $regex: name, $options: 'i' };
    }

    if (joiningMonth) {
      const parsed = new Date(joiningMonth);
      if (!Number.isNaN(parsed.getTime())) {
        const start = new Date(parsed.getFullYear(), parsed.getMonth(), 1);
        const end = new Date(parsed.getFullYear(), parsed.getMonth() + 1, 1);
        repFilter.joiningDate = { $gte: start, $lt: end };
      }
    }

    const reps = await Representative.find(repFilter).select('-password').sort({ createdAt: -1 });

    const counts = await Intern.aggregate([
      {
        $match: {
          addedByRepresentative: { $ne: null },
          isDeleted: { $ne: true }
        }
      },
      {
        $group: {
          _id: '$addedByRepresentative',
          totalStudents: { $sum: 1 }
        }
      }
    ]);

    const countMap = new Map(counts.map((item) => [String(item._id), item.totalStudents]));

    const representatives = reps
      .map((rep) => ({
        ...rep.toObject(),
        totalStudents: countMap.get(String(rep._id)) || 0
      }))
      .filter((rep) => {
        if (!batchMonth) return true;
        const sourceDate = rep.joiningDate ? new Date(rep.joiningDate) : new Date(rep.createdAt);
        const formatted = `${sourceDate.getFullYear()}-${String(sourceDate.getMonth() + 1).padStart(2, '0')}`;
        return formatted === batchMonth;
      });

    res.status(200).json({ success: true, count: representatives.length, representatives });
  } catch (error) {
    console.error('Get representatives error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get representative student details
exports.getRepresentativeDetails = async (req, res) => {
  try {
    const repId = req.params.id;
    const representative = await Representative.findById(repId).select('-password');

    if (!representative) {
      return res.status(404).json({ success: false, message: 'Representative not found' });
    }

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const baseFilter = { addedByRepresentative: representative._id, isDeleted: { $ne: true } };

    const [
      totalStudents,
      weeklyStudents,
      monthlyStudents,
      typeBreakdown,
      recentStudents,
      payouts
    ] = await Promise.all([
      Intern.countDocuments(baseFilter),
      Intern.countDocuments({ ...baseFilter, createdAt: { $gte: weekStart } }),
      Intern.countDocuments({ ...baseFilter, createdAt: { $gte: monthStart } }),
      Intern.aggregate([
        { $match: baseFilter },
        { $group: { _id: '$studentType', count: { $sum: 1 } } }
      ]),
      Intern.find(baseFilter)
        .select('name email internId studentType mobile createdAt paymentAmount completedFees pendingFees dateOfPayment lastPaymentDate currentDesignation paymentDoneBy transactionId domain joiningDate endingDate duration status')
        .sort({ createdAt: -1 })
        .limit(20),
      RepresentativePayout.find({ representative: representative._id })
        .sort({ weekStartDate: -1 })
        .limit(20)
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
      representative,
      stats: {
        totalStudents,
        weeklyStudents,
        monthlyStudents,
        byType
      },
      recentStudents,
      payouts
    });
  } catch (error) {
    console.error('Get representative details error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update representative (Admin only)
exports.updateRepresentative = async (req, res) => {
  try {
    const repId = req.params.id;
    const representative = await Representative.findById(repId);

    if (!representative) {
      return res.status(404).json({ success: false, message: 'Representative not found' });
    }

    const {
      pgirId,
      name,
      email,
      password,
      mobile,
      college,
      course,
      department,
      year,
      designation,
      sheetLinks,
      upiId,
      internshipApplicationFormLink,
      internshipSheetLink,
      internshipPromotionalMessage,
      smsPromotionalMessage,
      smsApplicationFormLink,
      smsSheetLink,
      joiningDate,
      instagramProfile,
      linkedinProfile,
      upiMobileNumber,
    } = req.body;

    const normalizedEmail = email !== undefined ? String(email || '').trim().toLowerCase() : undefined;
    const normalizedPgirId = pgirId !== undefined ? String(pgirId || '').trim().toUpperCase() : undefined;

    if (normalizedEmail) {
      const emailExists = await Representative.findOne({
        _id: { $ne: repId },
        email: normalizedEmail,
      }).select('_id');

      if (emailExists) {
        return res.status(409).json({ success: false, message: 'Representative with this email already exists' });
      }
    }

    if (normalizedPgirId) {
      const pgirExists = await Representative.findOne({
        _id: { $ne: repId },
        pgirId: normalizedPgirId,
      }).select('_id');

      if (pgirExists) {
        return res.status(409).json({ success: false, message: 'Representative with this PGIR ID already exists' });
      }
    }

    const allowedUpdates = {
      pgirId: normalizedPgirId,
      name: name !== undefined ? String(name || '').trim() : undefined,
      email: normalizedEmail,
      mobile,
      college,
      course,
      department,
      year,
      designation,
      sheetLinks,
      upiId,
      internshipApplicationFormLink,
      internshipSheetLink,
      internshipPromotionalMessage,
      smsPromotionalMessage,
      smsApplicationFormLink,
      smsSheetLink,
      joiningDate: joiningDate || undefined,
      instagramProfile,
      linkedinProfile,
      upiMobileNumber,
    };

    Object.entries(allowedUpdates).forEach(([key, value]) => {
      if (value !== undefined) {
        representative[key] = value;
      }
    });

    if (password !== undefined && String(password || '').trim() !== '') {
      representative.password = await bcrypt.hash(String(password).trim(), 10);
      representative.plainPassword = String(password).trim();
    }

    if (!representative.docs) representative.docs = {};

    if (req.files?.upiScanner?.[0]) {
      representative.docs.upiScanner = {
        filename: req.files.upiScanner[0].filename,
        filepath: req.files.upiScanner[0].path,
        uploadedAt: new Date(),
      };
    }

    if (req.files?.pgirSelectionLetter?.[0]) {
      representative.docs.pgirSelectionLetter = {
        filename: req.files.pgirSelectionLetter[0].filename,
        filepath: req.files.pgirSelectionLetter[0].path,
        uploadedAt: new Date(),
      };
    }

    if (req.files?.internshipOfferLetter?.[0]) {
      representative.docs.internshipOfferLetter = {
        filename: req.files.internshipOfferLetter[0].filename,
        filepath: req.files.internshipOfferLetter[0].path,
        uploadedAt: new Date(),
      };
    }

    await representative.save();

    res.status(200).json({
      success: true,
      message: 'Representative updated successfully',
      representative: {
        id: representative._id,
        pgirId: representative.pgirId,
        name: representative.name,
        email: representative.email,
        college: representative.college,
        designation: representative.designation,
      },
    });
  } catch (error) {
    console.error('Update representative error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete representative
exports.deleteRepresentative = async (req, res) => {
  try {
    const rep = await Representative.findByIdAndDelete(req.params.id);
    if (!rep) return res.status(404).json({ success: false, message: 'Representative not found' });
    res.status(200).json({ success: true, message: 'Representative deleted successfully' });
  } catch (error) {
    console.error('Delete representative error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create or update representative payout
exports.upsertRepresentativePayout = async (req, res) => {
  try {
    const {
      id,
      representativeId,
      monthLabel,
      weekLabel,
      weekStartDate,
      weekEndDate,
      upiQrDriveLink,
      totalEnrollmentCount,
      studentsWith3000Paid,
      payoutStatus,
      payoutReleaseDate,
      promotionalDocumentsLink,
      notes,
    } = req.body;

    if (!representativeId || !monthLabel || !weekLabel || !weekStartDate || !weekEndDate) {
      return res.status(400).json({
        success: false,
        message: 'Representative, month, week label and week date range are required',
      });
    }

    const computed = computePayoutFields(totalEnrollmentCount, studentsWith3000Paid);

    const payload = {
      representative: representativeId,
      monthLabel,
      weekLabel,
      weekStartDate,
      weekEndDate,
      upiQrDriveLink,
      totalEnrollmentCount: Number(totalEnrollmentCount) || 0,
      studentsWith3000Paid: Number(studentsWith3000Paid) || 0,
      payoutEligible: computed.payoutEligible,
      rewardPercent: computed.rewardPercent,
      payoutAmount: computed.payoutAmount,
      payoutStatus: payoutStatus || 'Hold',
      payoutReleaseDate: payoutReleaseDate || undefined,
      promotionalDocumentsLink,
      notes,
    };

    let payout;

    if (id) {
      payout = await RepresentativePayout.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
      }).populate('representative', 'name pgirId email');
    } else {
      const existing = await RepresentativePayout.findOne({
        representative: representativeId,
        weekStartDate: new Date(weekStartDate),
        weekEndDate: new Date(weekEndDate),
      }).select('_id');

      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Payout entry already exists for this representative and week. Use Edit to update it.',
        });
      }

      payout = await RepresentativePayout.create(payload);
      payout = await RepresentativePayout.findById(payout._id).populate('representative', 'name pgirId email');
    }

    createRepresentativeNotification({
      representativeId: payout.representative?._id || representativeId,
      title: id ? 'Payout updated' : 'New payout entry',
      message: id
        ? `Your payout entry for ${payout.monthLabel} (${payout.weekLabel}) was updated.`
        : `A new payout entry for ${payout.monthLabel} (${payout.weekLabel}) is available.`,
      notificationType: 'Payout',
    }).catch((notifyErr) => {
      console.error('Create representative payout notification error:', notifyErr);
    });

    return res.status(200).json({ success: true, payout });
  } catch (error) {
    console.error('Upsert representative payout error:', error);
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate payout entry for the same representative week range',
      });
    }
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get payout list for admin
exports.getRepresentativePayouts = async (req, res) => {
  try {
    const { month, representativeId, status, fromDate, toDate } = req.query;
    const filter = {};

    if (representativeId) filter.representative = representativeId;
    if (status) filter.payoutStatus = status;
    if (month) filter.monthLabel = { $regex: month, $options: 'i' };

    if (fromDate || toDate) {
      filter.weekStartDate = {};
      if (fromDate) filter.weekStartDate.$gte = new Date(fromDate);
      if (toDate) filter.weekStartDate.$lte = new Date(toDate);
    }

    const payouts = await RepresentativePayout.find(filter)
      .populate('representative', 'name pgirId email upiId upiMobileNumber docs.upiScanner')
      .sort({ weekStartDate: -1 });

    return res.status(200).json({ success: true, count: payouts.length, payouts });
  } catch (error) {
    console.error('Get representative payouts error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete representative payout (Admin only)
exports.deleteRepresentativePayout = async (req, res) => {
  try {
    const payoutId = req.params.id;
    const payout = await RepresentativePayout.findByIdAndDelete(payoutId);

    if (!payout) {
      return res.status(404).json({ success: false, message: 'Payout not found' });
    }

    return res.status(200).json({ success: true, message: 'Payout deleted successfully' });
  } catch (error) {
    console.error('Delete representative payout error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get all groups
exports.getStudentGroups = async (req, res) => {
  try {
    const groups = await StudentGroup.find()
      .populate('students', 'name internId studentType email mobile')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: groups.length, groups });
  } catch (error) {
    console.error('Get student groups error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create group
exports.createStudentGroup = async (req, res) => {
  try {
    const { groupNumber, groupName, groupDescription, studentType, students, assignedEmployees } = req.body;

    if (!groupNumber || !groupName) {
      return res.status(400).json({ success: false, message: 'Group number and name are required' });
    }

    const parsedStudents = Array.isArray(students)
      ? students
      : typeof students === 'string' && students.trim()
        ? JSON.parse(students)
        : [];

    const parsedEmployees = Array.isArray(assignedEmployees)
      ? assignedEmployees
      : typeof assignedEmployees === 'string' && assignedEmployees.trim()
        ? JSON.parse(assignedEmployees)
        : [];

    const group = await StudentGroup.create({
      groupNumber,
      groupName,
      groupDescription,
      studentType: studentType || 'All',
      students: parsedStudents,
      assignedEmployees: parsedEmployees,
      createdBy: req.user.id,
    });

    const populated = await StudentGroup.findById(group._id).populate(
      'students',
      'name internId studentType email mobile',
    );

    return res.status(201).json({ success: true, group: populated });
  } catch (error) {
    console.error('Create student group error:', error);
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: 'Group number already exists' });
    }
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get group details
exports.getStudentGroupDetails = async (req, res) => {
  try {
    const group = await StudentGroup.findById(req.params.id).populate(
      'students',
      'name internId studentType email mobile createdAt',
    );

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Derive assigned employees from trainer-to-group assignment mapping as fallback.
    const assignedTrainers = await Trainer.find({ assignedGroups: group._id })
      .select('name email role customRole')
      .lean();

    const assignedFromGroup = Array.isArray(group.assignedEmployees)
      ? group.assignedEmployees
      : [];
    const assignedFromTrainer = assignedTrainers
      .map((trainer) => trainer.name)
      .filter(Boolean);

    const mergedAssignedEmployees = [...new Set([...assignedFromGroup, ...assignedFromTrainer])];
    const groupPayload = group.toObject();
    groupPayload.assignedEmployees = mergedAssignedEmployees;
    groupPayload.assignedEmployeeDetails = assignedTrainers;

    return res.status(200).json({ success: true, group: groupPayload });
  } catch (error) {
    console.error('Get student group details error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update group
exports.updateStudentGroup = async (req, res) => {
  try {
    const { groupNumber, groupName, groupDescription, studentType, students, assignedEmployees } = req.body;

    const updatePayload = {
      groupNumber,
      groupName,
      groupDescription,
      studentType,
    };

    if (students !== undefined) {
      updatePayload.students = Array.isArray(students)
        ? students
        : typeof students === 'string' && students.trim()
          ? JSON.parse(students)
          : [];
    }

    if (assignedEmployees !== undefined) {
      updatePayload.assignedEmployees = Array.isArray(assignedEmployees)
        ? assignedEmployees
        : typeof assignedEmployees === 'string' && assignedEmployees.trim()
          ? JSON.parse(assignedEmployees)
          : [];
    }

    const group = await StudentGroup.findByIdAndUpdate(req.params.id, updatePayload, {
      new: true,
      runValidators: true,
    }).populate('students', 'name internId studentType email mobile');

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Propagation:
    const groupId = req.params.id;

    // 1. If groupName changed, update cached groupName in Interview and Notification models
    if (groupName) {
      await Promise.all([
        Interview.updateMany({ groupId }, { $set: { groupName } }),
        Notification.updateMany({ 'assessmentMeta.groupId': groupId }, { $set: { 'assessmentMeta.groupName': groupName } })
      ]);
    }

    // 2. If assignedEmployees list changed, sync Trainer assignedGroups bidirectionally
    if (updatePayload.assignedEmployees !== undefined) {
      const parsedEmployees = updatePayload.assignedEmployees;

      // Pull this group from all Trainers who are NOT in the assignedEmployees list anymore
      await Trainer.updateMany(
        { assignedGroups: groupId, name: { $nin: parsedEmployees } },
        { $pull: { assignedGroups: groupId } }
      );

      // Add this group to Trainers who are in the assignedEmployees list
      if (parsedEmployees.length > 0) {
        await Trainer.updateMany(
          { name: { $in: parsedEmployees } },
          { $addToSet: { assignedGroups: groupId } }
        );
      }
    }

    return res.status(200).json({ success: true, group });
  } catch (error) {
    console.error('Update student group error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete group
exports.deleteStudentGroup = async (req, res) => {
  try {
    const groupId = req.params.id;
    const deleted = await StudentGroup.findByIdAndDelete(groupId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Pull from all Trainer assignedGroups and workAssignments.assignedGroups fields
    await Trainer.updateMany(
      {},
      { 
        $pull: { 
          assignedGroups: groupId,
          'workAssignments.$[].assignedGroups': groupId
        } 
      }
    );

    return res.status(200).json({ success: true, message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Delete student group error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Schedule interview for students
exports.scheduleInterview = async (req, res) => {
  try {
    // DEBUG: log incoming payload for troubleshooting
    try { console.debug('scheduleInterview payload:', req.body); } catch (e) {}
    const {
      studentIds,
      trainerId,
      interviewType,
      mode,
      date,
      startTime,
      perGap,
      groupId
    } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Student IDs required' });
    }

    // Allow resolving trainer by name/email when trainerId not provided (some group assignments store names)
    let resolvedTrainerId = trainerId;
    if (!resolvedTrainerId && req.body.interviewerName) {
      const nameOrEmail = String(req.body.interviewerName || '').trim();
      if (nameOrEmail) {
        // try to find trainer by exact email or name (case-insensitive)
        const trainerByEmail = await Trainer.findOne({ email: { $regex: new RegExp(`^${nameOrEmail}$`, 'i') } });
        const trainerByName = await Trainer.findOne({ name: { $regex: new RegExp(`^${nameOrEmail}$`, 'i') } });
        const found = trainerByEmail || trainerByName;
        if (found) resolvedTrainerId = found._id;
      }
    }

    if (!resolvedTrainerId) {
      return res.status(400).json({ success: false, message: 'Trainer ID required (or provide an exact interviewer name/email that matches a trainer)' });
    }

    if (!interviewType || !date || !startTime) {
      return res.status(400).json({ success: false, message: 'Interview type, date, and start time required' });
    }

    // Record a summary activity for the admin activity feed first to get an ID
    let savedActivity;
    let interviewerName = '';
    try {
      try {
        const trainerObj = await Trainer.findById(resolvedTrainerId).select('name email customRole');
        if (trainerObj) interviewerName = trainerObj.customRole ? `${trainerObj.name} (${trainerObj.customRole})` : trainerObj.name;
      } catch (er) { /* ignore */ }

      const activityDetails = {
        mode,
        interviewType,
        trainerId: resolvedTrainerId,
        interviewerId: resolvedTrainerId,
        interviewerName,
        studentIds,
        assigned: studentIds
      };
      if (groupId) activityDetails.groupId = groupId;

      const activity = new Activity({
        type: 'Interview',
        title: `${interviewType} Interview (${mode})`,
        dateTime: new Date(`${date}T${startTime}:00`),
        createdBy: req.user?.id || null,
        createdByModel: 'Admin',
        status: 'Scheduled',
        details: activityDetails
      });
      savedActivity = await activity.save();
      // Interview red dot is triggered automatically via Interview model docs (getMyScheduledInterviews)
    } catch (e) {
      console.error('Failed to save activity record for interviews', e);
      return res.status(500).json({ success: false, message: 'Failed to create activity record' });
    }

    const createdInterviews = [];
    const perGapMinutes = perGap || 15;

    const baseTime = new Date(`${date}T${startTime}:00`);

    for (let idx = 0; idx < studentIds.length; idx++) {
      const studentId = studentIds[idx];
      
      // Calculate slot time for this student
      const slotTime = new Date(baseTime.getTime() + idx * perGapMinutes * 60000);

      // Get current attempt number for this student
      const lastInterview = await Interview.findOne({
        studentId,
        interviewType,
        status: 'Completed'
      }).sort({ attemptNumber: -1 });

      const attemptNumber = lastInterview ? lastInterview.attemptNumber + 1 : 1;

      const interviewData = {
        studentId,
        trainerId: resolvedTrainerId,
        interviewType,
        status: 'Scheduled',
        mode,
        date: slotTime,
        startTime: slotTime.toTimeString().slice(0, 5),
        attemptNumber,
        levelCrossed: false,
        activityId: savedActivity._id // Link to Activity!
      };

      // If this scheduling call provided a groupId (group mode), attach it to the interview
      if (groupId) {
        interviewData.groupId = groupId;
        // Try to attach a human-readable groupName to make trainer UI clearer
        try {
          const group = await StudentGroup.findById(groupId).select('groupName groupNumber');
          if (group) interviewData.groupName = group.groupName || group.groupNumber || '';
        } catch (err) {
          // ignore group lookup errors; groupName is optional
        }
      }

      const interview = new Interview(interviewData);

      const saved = await interview.save();
      createdInterviews.push(saved);
    }

    // Update Activity details with the created interview slots and counts
    try {
      savedActivity.details.interviewCount = createdInterviews.length;
      savedActivity.details.slots = createdInterviews.map(i => ({ studentId: i.studentId, date: i.date, startTime: i.startTime }));
      savedActivity.markModified('details');
      await savedActivity.save();
    } catch (e) {
      console.error('Failed to update activity slots details', e);
    }

    return res.status(201).json({
      success: true,
      message: `${createdInterviews.length} interview(s) scheduled successfully`,
      interviews: createdInterviews
    });
  } catch (error) {
    console.error('Schedule interview error:', error && (error.stack || error));
    return res.status(500).json({ success: false, message: error?.message || 'Server error', stack: error?.stack });
  }
};

// Create an activity record (generic)
exports.createActivity = async (req, res) => {
  try {
    const { type, title, dateTime, status, details } = req.body;
    if (!type) return res.status(400).json({ success: false, message: 'Activity type required' });
    const createdBy = req.user && req.user.id ? req.user.id : null;
    const createdByModel = req.user && req.user.role ? (req.user.role === 'admin' ? 'Admin' : req.user.role === 'trainer' ? 'Trainer' : 'Intern') : 'Admin';
    const activity = new Activity({ type, title, dateTime: dateTime ? new Date(dateTime) : undefined, createdBy, createdByModel, status: status || 'Scheduled', details: details || {} });
    const saved = await activity.save();

    // GD red dot is triggered automatically via Activity model docs (getMyScheduledGDs)

    return res.status(201).json({ success: true, activity: saved });
  } catch (error) {
    console.error('Create activity error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get recent activities (admin)
exports.getRecentActivities = async (req, res) => {
  try {
    const limit = Math.min(50, Number(req.query.limit) || 20);
    const activities = await Activity.find({}).sort({ createdAt: -1 }).limit(limit).lean();
    return res.status(200).json({ success: true, count: activities.length, activities });
  } catch (error) {
    console.error('Get recent activities error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update an activity (admin)
exports.updateActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};

    const originalActivity = await Activity.findById(id);
    if (!originalActivity) return res.status(404).json({ success: false, message: 'Activity not found' });

    const activityType = String(updates.type || originalActivity.type).toLowerCase();

    if (activityType.includes('interview')) {
      // 1. Delete existing interviews linked to this activity
      await Interview.deleteMany({ activityId: id });

      // Fallback for legacy records
      const oldStudentIds = originalActivity.details?.studentIds || [];
      const oldTrainerId = originalActivity.details?.trainerId || originalActivity.details?.interviewerId;
      if (oldStudentIds.length > 0) {
        await Interview.deleteMany({
          studentId: { $in: oldStudentIds },
          trainerId: oldTrainerId,
          status: 'Scheduled'
        });
      }

      // 2. Re-create interview documents
      const mergedDetails = { ...(originalActivity.details || {}), ...(updates.details || {}) };
      const studentIds = mergedDetails.studentIds || [];
      const resolvedTrainerId = mergedDetails.trainerId || mergedDetails.interviewerId;
      const interviewType = mergedDetails.interviewType || 'HR';
      const mode = mergedDetails.mode || 'Individual';
      const perGapMinutes = mergedDetails.perGap || 15;
      const groupId = mergedDetails.groupId;

      let date = mergedDetails.date;
      let startTime = mergedDetails.startTime;
      if (!date || !startTime) {
        const dtStr = updates.dateTime || originalActivity.dateTime;
        if (dtStr) {
          const parsedDt = new Date(dtStr);
          if (!isNaN(parsedDt.getTime())) {
            date = parsedDt.toISOString().slice(0, 10);
            startTime = parsedDt.toTimeString().slice(0, 5);
          }
        }
      }

      const createdInterviews = [];
      if (studentIds.length > 0 && resolvedTrainerId && date && startTime) {
        const baseTime = new Date(`${date}T${startTime}:00`);
        for (let idx = 0; idx < studentIds.length; idx++) {
          const studentId = studentIds[idx];
          const slotTime = new Date(baseTime.getTime() + idx * perGapMinutes * 60000);
          const lastInterview = await Interview.findOne({
            studentId,
            interviewType,
            status: 'Completed'
          }).sort({ attemptNumber: -1 });

          const attemptNumber = lastInterview ? lastInterview.attemptNumber + 1 : 1;

          const interviewData = {
            studentId,
            trainerId: resolvedTrainerId,
            interviewType,
            status: updates.status || originalActivity.status || 'Scheduled',
            mode,
            date: slotTime,
            startTime: slotTime.toTimeString().slice(0, 5),
            attemptNumber,
            levelCrossed: false,
            activityId: id
          };

          if (groupId) {
            interviewData.groupId = groupId;
            try {
              const group = await StudentGroup.findById(groupId).select('groupName groupNumber');
              if (group) interviewData.groupName = group.groupName || group.groupNumber || '';
            } catch (err) {}
          }

          const interview = new Interview(interviewData);
          const saved = await interview.save();
          createdInterviews.push(saved);
        }
      }

      // 3. Update updates payload details with new slots
      if (createdInterviews.length > 0) {
        mergedDetails.slots = createdInterviews.map(i => ({ studentId: i.studentId, date: i.date, startTime: i.startTime }));
        mergedDetails.interviewCount = createdInterviews.length;
        // try to resolve trainer name
        try {
          const trainerObj = await Trainer.findById(resolvedTrainerId).select('name customRole');
          if (trainerObj) {
            mergedDetails.interviewerName = trainerObj.customRole ? `${trainerObj.name} (${trainerObj.customRole})` : trainerObj.name;
          }
        } catch (e) {}
      }
      updates.details = mergedDetails;

    } else if (activityType.includes('assessment')) {
      // 1. Delete old notifications linked to this activity
      await Notification.deleteMany({ activityId: id });

      // 2. Create new notifications
      const mergedDetails = { ...(originalActivity.details || {}), ...(updates.details || {}) };
      const studentIds = mergedDetails.assigned || mergedDetails.students || [];
      const trainerId = mergedDetails.trainerId;
      const groupId = mergedDetails.groupId;
      const title = updates.title || originalActivity.title;
      const description = mergedDetails.description || '';
      const link = mergedDetails.link || '';
      const type = mergedDetails.type || 'Assessment';
      
      let date = mergedDetails.date;
      let time = mergedDetails.time;
      if (!date || !time) {
        const dtStr = updates.dateTime || originalActivity.dateTime;
        if (dtStr) {
          const parsedDt = new Date(dtStr);
          if (!isNaN(parsedDt.getTime())) {
            date = parsedDt.toISOString().slice(0, 10);
            time = parsedDt.toTimeString().slice(0, 5);
          }
        }
      }

      const assessmentMode = groupId ? 'Group' : 'Individual';
      let groupName = '';
      if (groupId) {
        try {
          const group = await StudentGroup.findById(groupId).select('groupName').lean();
          groupName = group?.groupName || '';
        } catch (e) {}
      }
      let assignedLabels = [];
      if (assessmentMode === 'Group') {
        assignedLabels = [groupName || `Group ${groupId || ''}`.trim()].filter(Boolean);
      } else {
        try {
          const interns = await Intern.find({ _id: { $in: studentIds } }).select('name').lean();
          const internMap = {};
          interns.forEach(i => { internMap[String(i._id)] = i.name; });
          assignedLabels = studentIds.map(id => internMap[String(id)] || String(id));
        } catch (e) {
          assignedLabels = studentIds.map(String);
        }
      }

      const when = date ? `${date}${time ? ' ' + time : ''}` : (time || '');
      const baseMessage = `${description || ''}${when ? '\nWhen: ' + when : ''}${link ? '\nLink: ' + link : ''}`;
      const adminId = req.user.id;

      if (studentIds.length > 0) {
        try {
          const studentNotification = new Notification({
            title: `You are scheduled for: ${title || (type || 'Assessment')}`,
            message: baseMessage,
            notificationType: 'Test/Assessment',
            sendTo: studentIds.length === 1 ? 'Individual' : 'Group',
            recipientIds: studentIds,
            recipientModel: 'Intern',
            assessmentMeta: {
              assessmentMode,
              groupId: groupId || undefined,
              groupName,
              assignedLabels,
              assignedIds: studentIds
            },
            createdBy: adminId,
            activityId: id
          });
          await studentNotification.save();
        } catch (err) {
          console.error('Failed to update student notification', err);
        }
      }

      if (trainerId && String(trainerId).trim() !== '') {
        try {
          const trainerNotification = new Notification({
            title: `Scheduled Assessment: ${title || (type || 'Assessment')}`,
            message: baseMessage,
            notificationType: 'Test/Assessment',
            sendTo: 'Individual',
            recipientIds: [trainerId],
            recipientModel: 'Trainer',
            assessmentMeta: {
              assessmentMode,
              groupId: groupId || undefined,
              groupName,
              assignedLabels,
              assignedIds: studentIds
            },
            createdBy: adminId,
            activityId: id
          });
          await trainerNotification.save();
        } catch (err) {
          console.error('Failed to update trainer notification', err);
        }
      }
      updates.details = mergedDetails;
    }

    const isCompletedNow = updates.status === 'Completed' && originalActivity.status !== 'Completed';
    const isRescheduled = updates.dateTime && originalActivity.dateTime && new Date(updates.dateTime).getTime() !== new Date(originalActivity.dateTime).getTime();

    const activity = await Activity.findByIdAndUpdate(id, updates, { new: true }).lean();

    // Send notifications to students on reschedule or completion
    try {
      // Collect student IDs from multiple possible fields (covers Interview, Assessment, GD)
      const rawStudentIds = [
        ...(updates.details?.studentIds || []),
        ...(updates.details?.assigned || []),
        ...(originalActivity.details?.studentIds || []),
        ...(originalActivity.details?.assigned || []),
      ];

      // Also extract from GD groups structure
      const extractFromGroups = (details) => {
        const members = [];
        if (!Array.isArray(details?.groups)) return members;
        details.groups.forEach(group => {
          const groupMembers = Array.isArray(group) ? group : (group.members || []);
          groupMembers.forEach(m => {
            const mid = String(m?._id || m?.id || m?.studentId || m?.internId || m?.psmsId || m || '');
            if (mid) members.push(mid);
          });
        });
        return members;
      };

      const groupMembers = [
        ...extractFromGroups(updates.details || {}),
        ...extractFromGroups(originalActivity.details || {}),
      ];

      const studentIds = Array.from(new Set([...rawStudentIds.map(String), ...groupMembers].filter(Boolean)));

      if (studentIds.length > 0) {
        const adminId = req.user.id;
        const typeStr = updates.type || originalActivity.type;
        const titleStr = updates.title || originalActivity.title;

        if (isCompletedNow) {
          const notifTitle = `Completed ${typeStr}: ${titleStr}`;
          const notifMessage = `Your scheduled ${typeStr} "${titleStr}" has been marked as Completed.`;
          await createActivityNotification({
            title: notifTitle,
            message: notifMessage,
            type: typeStr,
            studentIds,
            adminId,
            activityId: id
          });
        } else if (isRescheduled) {
          const notifTitle = `Rescheduled ${typeStr}: ${titleStr}`;
          const whenStr = updates.dateTime ? new Date(updates.dateTime).toLocaleString() : '';
          const notifMessage = `Your scheduled ${typeStr} "${titleStr}" has been rescheduled.${whenStr ? ' New Schedule: ' + whenStr : ''}`;
          await createActivityNotification({
            title: notifTitle,
            message: notifMessage,
            type: typeStr,
            studentIds,
            adminId,
            activityId: id
          });
        }
      }
    } catch (e) {
      console.error('Failed to send update notifications', e);
    }

    return res.status(200).json({ success: true, activity });
  } catch (error) {
    console.error('Update activity error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete an activity (admin)
exports.deleteActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const activity = await Activity.findById(id).lean();
    if (!activity) return res.status(404).json({ success: false, message: 'Activity not found' });

    const adminId = req.user?.id;
    const activityType = String(activity.type || '').toLowerCase();

    // Collect all student IDs (from assigned field + GD groups structure)
    const rawStudentIds = [...(activity.details?.studentIds || []), ...(activity.details?.assigned || [])];
    const groupMembers = [];
    if (Array.isArray(activity.details?.groups)) {
      activity.details.groups.forEach(group => {
        const members = Array.isArray(group) ? group : (group.members || []);
        members.forEach(m => {
          const mid = String(m?._id || m?.id || m?.studentId || m?.internId || m?.psmsId || m || '');
          if (mid) groupMembers.push(mid);
        });
      });
    }
    const studentIds = Array.from(new Set([...rawStudentIds.map(String), ...groupMembers].filter(Boolean)));

    // 1. Send cancellation notifications to assigned students
    if (studentIds.length > 0) {
      const titleStr = activity.title || activity.type;
      await createActivityNotification({
        title: `Cancelled: ${titleStr}`,
        message: `Your scheduled ${activity.type || 'activity'} "${titleStr}" has been cancelled by the admin.`,
        type: activity.type,
        studentIds,
        adminId,
        activityId: id
      });
    }

    // 2. Cleanup linked Interview docs if type is Interview
    if (activityType.includes('interview')) {
      await Interview.deleteMany({ activityId: id });
    }

    // 3. Cleanup linked Notification docs if type is Assessment
    if (activityType.includes('assessment')) {
      await Notification.deleteMany({ activityId: id });
    }

    // 4. Delete the activity itself
    await Activity.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: 'Activity deleted' });
  } catch (error) {
    console.error('Delete activity error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Schedule assessment (admin) - creates notifications for trainer and students
exports.scheduleAssessment = async (req, res) => {
  try {
    const { assigned = [], trainerId, type, title, description, date, time, link, groupId } = req.body;
    const adminId = req.user.id;

    // Normalize assigned student ids (array may be passed as string)
    let studentIds = Array.isArray(assigned) ? assigned.slice() : [];
    if (typeof assigned === 'string' && assigned.length) {
      try { studentIds = JSON.parse(assigned); } catch (e) { studentIds = assigned.split(',').map(s => s.trim()).filter(Boolean); }
    }

    // If groupId provided, expand to member students
    if (groupId) {
      try {
        const group = await StudentGroup.findById(groupId).select('students').lean();
        if (group && Array.isArray(group.students)) {
          group.students.forEach(s => studentIds.push(String(s)));
        }
      } catch (e) { /* ignore */ }
    }

    // Deduplicate
    studentIds = Array.from(new Set((studentIds || []).map(String)));

    const assessmentMode = groupId ? 'Group' : 'Individual';
    let groupName = '';

    if (groupId) {
      try {
        const group = await StudentGroup.findById(groupId).select('groupName').lean();
        groupName = group?.groupName || '';
      } catch (e) { /* ignore */ }
    }

    let assignedLabels = [];
    if (assessmentMode === 'Group') {
      assignedLabels = [groupName || `Group ${groupId || ''}`.trim()].filter(Boolean);
    } else {
      try {
        const interns = await Intern.find({ _id: { $in: studentIds } }).select('name').lean();
        const internMap = {};
        interns.forEach(i => { internMap[String(i._id)] = i.name; });
        assignedLabels = studentIds.map(id => internMap[String(id)] || String(id));
      } catch (e) {
        assignedLabels = studentIds.map(String);
      }
    }

    // Validate trainer (optional)
    let trainer = null;
    if (trainerId && String(trainerId).trim() !== '') {
      trainer = await Trainer.findById(trainerId).select('name email');
      if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found' });
    }

    // Build message text
    const when = date ? `${date}${time ? ' ' + time : ''}` : (time || '');
    const baseMessage = `${description || ''}${when ? '\nWhen: ' + when : ''}${link ? '\nLink: ' + link : ''}`;

    // Create activity record for admin feed first to get an ID
    let savedActivity;
    try {
      const activity = new Activity({
        type: 'Assessment',
        title: title || (type || 'Assessment'),
        dateTime: date ? new Date(`${date}T${time || '00:00'}:00`) : undefined,
        createdBy: req.user?.id || null,
        createdByModel: 'Admin',
        status: 'Scheduled',
        details: { type, title, description, link, assigned: studentIds, trainerId, groupId }
      });
      savedActivity = await activity.save();
    } catch (e) {
      console.error('Failed to save activity record for assessment', e);
      return res.status(500).json({ success: false, message: 'Failed to save activity record' });
    }

    // Create notification for trainer (if trainer is specified)
    if (trainerId && String(trainerId).trim() !== '') {
      try {
        const trainerNotification = new Notification({
          title: `Scheduled Assessment: ${title || (type || 'Assessment')}`,
          message: baseMessage,
          notificationType: 'Test/Assessment',
          sendTo: 'Individual',
          recipientIds: [trainerId],
          recipientModel: 'Trainer',
          assessmentMeta: {
            assessmentMode,
            groupId: groupId || undefined,
            groupName,
            assignedLabels,
            assignedIds: studentIds
          },
          createdBy: adminId,
          activityId: savedActivity._id // Link to Activity!
        });
        await trainerNotification.save();
      } catch (err) {
        console.error('Failed to create trainer notification', err);
      }
    }

    // Create notification(s) for students (if any)
    if (studentIds.length > 0) {
      try {
        const studentNotification = new Notification({
          title: `You are scheduled for: ${title || (type || 'Assessment')}`,
          message: baseMessage,
          notificationType: 'Test/Assessment',
          sendTo: studentIds.length === 1 ? 'Individual' : 'Group',
          recipientIds: studentIds,
          recipientModel: 'Intern',
          assessmentMeta: {
            assessmentMode,
            groupId: groupId || undefined,
            groupName,
            assignedLabels,
            assignedIds: studentIds
          },
          createdBy: adminId,
          activityId: savedActivity._id // Link to Activity!
        });
        await studentNotification.save();
      } catch (err) {
        console.error('Failed to create student notification', err);
      }
    }

    return res.status(201).json({ success: true, message: 'Assessment scheduled and notifications created' });
  } catch (error) {
    console.error('Schedule assessment error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};







