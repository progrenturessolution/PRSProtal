const bcrypt = require('bcryptjs');
const Intern = require('../models/Intern');
const Trainer = require('../models/Trainer');
const Representative = require('../models/Representative');
const Notification = require('../models/Notification');
const JobPosting = require('../models/JobPosting');
const { sendInternCredentials } = require('../config/emailService');

// Generate unique Intern ID based on type
const generateInternId = async (studentType) => {
  const year = new Date().getFullYear();
  const count = await Intern.countDocuments({ studentType });
  
  let prefix = studentType === 'SMS Program' ? `PSMS${year}` : `PIID${year}`;
  const internId = `${prefix}${String(count + 1).padStart(4, '0')}`;
  return internId;
};

// Add new intern
exports.addIntern = async (req, res) => {
  try {
    const {
      studentType,
      name,
      email,
      password,
      mobile,
      // Internship fields
      domain,
      joiningDate,
      endingDate,
      duration,
      // SMS Program fields
      paymentDoneBy,
      dateOfPayment,
      transactionId,
      paymentAmount,
      currentDesignation
    } = req.body;

    // Validation
    if (!studentType || !name || !email || !password || !mobile) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Type-specific validation
    if (studentType === 'Internship' && (!domain || !joiningDate || !duration)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all internship required fields'
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

    // Generate intern ID based on type
    const internId = await generateInternId(studentType);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new intern
    const internData = {
      studentType,
      name,
      email,
      mobile,
      internId,
      password: hashedPassword,
      role: 'intern'
    };

    // Add type-specific fields
    if (studentType === 'Internship') {
      internData.domain = domain;
      internData.joiningDate = joiningDate;
      internData.duration = duration;
      // endingDate is optional, can be calculated later if needed
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

    // Send email with credentials
    const emailResult = await sendInternCredentials(name, email, internId, password);

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
      emailSent: emailResult.success
    });

  } catch (error) {
    console.error('Add intern error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get all interns (exclude soft-deleted)
exports.getAllInterns = async (req, res) => {
  try {
    const interns = await Intern.find({ isDeleted: { $ne: true } }).select('-password').populate('assignedTrainer', 'name email');
    
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
      'paymentDoneBy',
      'dateOfPayment',
      'transactionId',
      'paymentAmount',
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

// Add new trainer
exports.addTrainer = async (req, res) => {
  try {
    const { name, email, password, mobile, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const existingTrainer = await Trainer.findOne({ email });
    if (existingTrainer) {
      return res.status(400).json({
        success: false,
        message: 'Trainer with this email already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const trainer = new Trainer({
      name,
      email,
      password: hashedPassword,
      mobile,
      role: role || 'trainer'
    });

    await trainer.save();

    res.status(201).json({
      success: true,
      message: 'Trainer added successfully',
      trainer: {
        id: trainer._id,
        name: trainer.name,
        email: trainer.email,
        role: trainer.role
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

// Assign students to trainer
exports.assignStudentsToTrainer = async (req, res) => {
  try {
    console.log('Assign students request received:', req.body);
    console.log('User from token:', req.user);

    const { trainerId, studentIds } = req.body;

    // Validation
    if (!trainerId || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      console.log('Validation failed: missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Trainer ID and student IDs are required'
      });
    }

    // Check if trainer exists
    const trainer = await Trainer.findById(trainerId);
    if (!trainer) {
      console.log('Trainer not found:', trainerId);
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    // Check if all students exist
    const students = await Intern.find({ _id: { $in: studentIds } });
    if (students.length !== studentIds.length) {
      console.log('Some students not found. Requested:', studentIds.length, 'Found:', students.length);
      return res.status(404).json({
        success: false,
        message: 'One or more students not found'
      });
    }

    console.log('Assigning students to trainer:', trainer.name);

    // Update trainer's assigned students
    trainer.assignedStudents = [...new Set([...trainer.assignedStudents, ...studentIds])];
    await trainer.save();

    // Update students' assigned trainer
    await Intern.updateMany(
      { _id: { $in: studentIds } },
      { assignedTrainer: trainerId }
    );

    console.log('Assignment successful');

    res.status(200).json({
      success: true,
      message: `${studentIds.length} student(s) assigned successfully to ${trainer.name}`
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

// Get all trainers
exports.getAllTrainers = async (req, res) => {
  try {
    const trainers = await Trainer.find()
      .select('-password')
      .populate('assignedStudents', 'name email internId');

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

// Upload document for student
exports.uploadStudentDocument = async (req, res) => {
  try {
    // Support studentId from either body or route param
    const studentId = req.body.studentId || req.params.studentId;
    const { documentType } = req.body;

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

    // Update specific document type
    if (documentType === 'offerLetter') {
      student.documents = student.documents || {};
      student.documents.offerLetter = docData;
    } else if (documentType === 'welcomeLetter') {
      student.documents = student.documents || {};
      student.documents.welcomeLetter = docData;
    } else if (documentType === 'paymentReceipt') {
      student.documents = student.documents || {};
      student.documents.paymentReceipt = docData;
    } else {
      // Other certificates
      student.documents = student.documents || {};
      if (!student.documents.otherCertificates) {
        student.documents.otherCertificates = [];
      }
      student.documents.otherCertificates.push({
        name: documentType,
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
    const { name, email, password, mobile, college, course, department, year, designation, sheetLinks, upiId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    const existing = await Representative.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Representative with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const rep = await Representative.create({
      name,
      email,
      password: hashedPassword,
      mobile,
      college,
      course,
      department,
      year,
      designation: designation || 'Campus Representative',
      sheetLinks,
      upiId,
      role: 'representative'
    });

    res.status(201).json({
      success: true,
      message: 'Representative added successfully',
      representative: {
        id: rep._id,
        name: rep.name,
        email: rep.email,
        college: rep.college,
        designation: rep.designation
      }
    });
  } catch (error) {
    console.error('Add representative error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get all representatives
exports.getAllRepresentatives = async (req, res) => {
  try {
    const reps = await Representative.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: reps.length, representatives: reps });
  } catch (error) {
    console.error('Get representatives error:', error);
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
