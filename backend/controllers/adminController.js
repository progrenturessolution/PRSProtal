const bcrypt = require('bcryptjs');
const Intern = require('../models/Intern');
const Trainer = require('../models/Trainer');
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
      gender,
      paymentDoneBy,
      dateOfPayment,
      transactionId,
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
    if (studentType === 'Internship' && (!domain || !joiningDate || !endingDate || !duration)) {
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
      internData.endingDate = endingDate;
      internData.duration = duration;
    } else if (studentType === 'SMS Program') {
      internData.gender = gender;
      internData.paymentDoneBy = paymentDoneBy;
      internData.dateOfPayment = dateOfPayment;
      internData.transactionId = transactionId;
      internData.currentDesignation = currentDesignation || 'Student';
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

// Get all interns
exports.getAllInterns = async (req, res) => {
  try {
    const interns = await Intern.find().select('-password');
    
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

// Delete single intern
exports.deleteIntern = async (req, res) => {
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
      message: 'Intern deleted successfully'
    });

  } catch (error) {
    console.error('Delete intern error:', error);
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

    if (!['active', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "active" or "completed"'
      });
    }

    const intern = await Intern.findByIdAndUpdate(
      id,
      { status },
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
    const { trainerId, studentIds } = req.body;

    const trainer = await Trainer.findById(trainerId);
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    // Update trainer's assigned students
    trainer.assignedStudents = [...new Set([...trainer.assignedStudents, ...studentIds])];
    await trainer.save();

    // Update students' assigned trainer
    await Intern.updateMany(
      { _id: { $in: studentIds } },
      { assignedTrainer: trainerId }
    );

    res.status(200).json({
      success: true,
      message: 'Students assigned successfully'
    });

  } catch (error) {
    console.error('Assign students error:', error);
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
    const { title, message, notificationType, sendTo, recipientIds, recipientModel } = req.body;

    const notification = new Notification({
      title,
      message,
      notificationType,
      sendTo,
      recipientIds: sendTo === 'Individual' || sendTo === 'Group' ? recipientIds : [],
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
      notification
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
    const { studentId, documentType } = req.body;

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
      student.documents.offerLetter = docData;
    } else if (documentType === 'welcomeLetter') {
      student.documents.welcomeLetter = docData;
    } else if (documentType === 'paymentReceipt') {
      student.documents.paymentReceipt = docData;
    } else {
      // Other certificates
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
exports.getStudentDocuments = async (req, res) => {
  try {
    const { studentId } = req.params;

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
