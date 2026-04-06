const bcrypt = require('bcryptjs');
const Intern = require('../models/Intern');
const Trainer = require('../models/Trainer');
const Representative = require('../models/Representative');
const RepresentativePayout = require('../models/RepresentativePayout');
const StudentGroup = require('../models/StudentGroup');
const Notification = require('../models/Notification');
const JobPosting = require('../models/JobPosting');
const { sendInternCredentials, sendRepresentativeCredentials, sendTrainerCredentials, sendTrainerAssignmentNotification, sendStudentAssignmentNotification, sendCertificateAssignmentEmail } = require('../config/emailService');

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
      finalPaymentDate
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
    const { status } = req.body;

      // Accept valid statuses (case-insensitive)
      const allowed = ['active', 'completed', 'inactive'];
      if (!status || !allowed.includes(String(status).toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Allowed: active, completed, inactive'
        });
      }

      const normalizedStatus = String(status).toLowerCase();

    const intern = await Intern.findByIdAndUpdate(
      id,
      { status: normalizedStatus },
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
      'currentDesignation'
    ];

    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
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
      mobile,
      role: normalized.role,
      customRole: normalized.customRole,
      joiningDate: joiningDate || null
    });

    await trainer.save();

    if (trainer.email) {
      sendTrainerCredentials({
        trainerName: trainer.name,
        trainerEmail: trainer.email,
        password
      })
        .then((emailResult) => {
          if (!emailResult.success) {
            console.error(`Background employee credential email failed for ${trainer.email}:`, emailResult.error);
          }
        })
        .catch((emailError) => {
          console.error(`Background employee credential email error for ${trainer.email}:`, emailError.message);
        });
    }

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
      },
      emailSent: false,
      emailQueued: true
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
    const { name, email, mobile, status, role, customRole, joiningDate } = req.body;

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

    await trainer.save();

    const updatedTrainer = await Trainer.findById(trainer._id)
      .select('-password')
      .populate('assignedStudents', 'name email internId studentType status assignedTrainer')
      .populate('assignedGroups', 'groupName groupNumber students createdAt')
      .populate('workAssignments.assignedStudents', 'name email internId')
      .populate('workAssignments.assignedGroups', 'groupName groupNumber');

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

    // Queue emails in background so API returns quickly.
    sendTrainerAssignmentNotification({
      trainerName: trainer.name,
      trainerEmail: trainer.email,
      studentsList: students.map(s => ({ name: s.name, email: s.email, internId: s.internId }))
    })
      .then((emailResult) => {
        if (!emailResult.success) {
          console.error(`Background trainer assignment email failed for ${trainer.email}:`, emailResult.error);
        }
      })
      .catch((emailError) => {
        console.error(`Background trainer assignment email error for ${trainer.email}:`, emailError.message);
      });

    Promise.allSettled(
      students.map(s => sendStudentAssignmentNotification({
        studentName: s.name,
        studentEmail: s.email,
        trainerName: trainer.name,
        trainerEmail: trainer.email,
        trainerMobile: trainer.mobile
      }))
    )
      .then((results) => {
        const failed = results.filter((r) => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;
        if (failed > 0) {
          console.error(`Background student assignment emails failed: ${failed}/${results.length}`);
        }
      })
      .catch((emailError) => {
        console.error('Background student assignment email batch error:', emailError.message);
      });

    res.status(200).json({
      success: true,
      message: `${uniqueStudentIds.length} student(s) assigned successfully to ${trainer.name}`,
      emailSent: false,
      emailQueued: true
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
      .populate('workAssignments.assignedStudents', 'name email internId')
      .populate('workAssignments.assignedGroups', 'groupName groupNumber');

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

// ========== JOB POSTINGS ==========

// Create job posting
exports.createJobPosting = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { opportunityType, domain, title, eligibilityCriteria, description, applicationLink, applicationInstructions } = req.body;

    const jobPosting = new JobPosting({
      opportunityType,
      domain,
      title,
      eligibilityCriteria,
      description,
      applicationLink,
      applicationInstructions,
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

    if (student.email) {
      Promise.resolve()
        .then(() => sendCertificateAssignmentEmail({
          internName: student.name,
          internEmail: student.email,
          certificateNames: [resolvedCertificateName],
          certificateFiles: [{
            filename: docData.filename,
            filepath: docData.filepath
          }]
        }))
        .then((emailResult) => {
          if (!emailResult?.success) {
            console.error(`Certificate assignment email failed for student ${student._id}:`, emailResult?.error || 'Unknown email error');
          }
        })
        .catch((emailError) => {
          console.error(`Certificate assignment email error for student ${student._id}:`, emailError);
        });
    }

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

    let emailSent = false;
    let emailError = null;
    if (rep.email) {
      // Do not block account creation on email transport issues.
      sendRepresentativeCredentials({
        repName: rep.name,
        repEmail: rep.email,
        password: normalizedPassword
      })
        .then((emailResult) => {
          if (!emailResult?.success) {
            console.error('Representative credentials email failed:', emailResult?.error || 'Unknown email error');
          }
        })
        .catch((mailErr) => {
          console.error('Representative credentials email exception:', mailErr?.message || mailErr);
        });
      emailError = 'Credentials email queued in background';
    } else {
      emailError = 'Representative email not found';
    }

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
      },
      emailSent,
      emailError
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
      .populate('representative', 'name pgirId email upiId upiMobileNumber')
      .sort({ weekStartDate: -1 });

    return res.status(200).json({ success: true, count: payouts.length, payouts });
  } catch (error) {
    console.error('Get representative payouts error:', error);
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

    return res.status(200).json({ success: true, group });
  } catch (error) {
    console.error('Update student group error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete group
exports.deleteStudentGroup = async (req, res) => {
  try {
    const deleted = await StudentGroup.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }
    return res.status(200).json({ success: true, message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Delete student group error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};






