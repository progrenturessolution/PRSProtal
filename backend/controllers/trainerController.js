const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Trainer = require('../models/Trainer');
const Intern = require('../models/Intern');
const Interview = require('../models/Interview');
const Aptitude = require('../models/Aptitude');
const Assessment = require('../models/Assessment');
const Training = require('../models/Training');
const Notification = require('../models/Notification');
const JobPosting = require('../models/JobPosting');
const StudentGroup = require('../models/StudentGroup');

const getAccessibleStudentIds = async (trainerId) => {
  const trainer = await Trainer.findById(trainerId)
    .select('assignedStudents assignedGroups')
    .lean();

  if (!trainer) return [];

  const ids = new Set();

  const directStudents = await Intern.find({ assignedTrainer: trainerId })
    .select('_id')
    .lean();
  directStudents.forEach((student) => ids.add(String(student._id)));

  (trainer.assignedStudents || []).forEach((studentId) => ids.add(String(studentId)));

  if (Array.isArray(trainer.assignedGroups) && trainer.assignedGroups.length > 0) {
    const groups = await StudentGroup.find({ _id: { $in: trainer.assignedGroups } })
      .select('students')
      .lean();

    groups.forEach((group) => {
      (group.students || []).forEach((studentId) => ids.add(String(studentId)));
    });
  }

  return Array.from(ids);
};

const isStudentAccessibleToTrainer = async (trainerId, studentId) => {
  if (!studentId) return false;
  const accessibleStudentIds = await getAccessibleStudentIds(trainerId);
  return accessibleStudentIds.includes(String(studentId));
};

// Trainer Login
exports.trainerLogin = async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = req.body?.password;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check if trainer exists
    const trainer = await Trainer.findOne({ email }).lean();
    if (!trainer) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, trainer.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: trainer._id, role: trainer.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: trainer._id,
        name: trainer.name,
        email: trainer.email,
        role: trainer.role
      }
    });

  } catch (error) {
    console.error('Trainer login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get assigned students
exports.getAssignedStudents = async (req, res) => {
  try {
    const trainerId = req.user.id;

    const accessibleStudentIds = await getAccessibleStudentIds(trainerId);

    if (accessibleStudentIds.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        students: []
      });
    }

    const students = await Intern.find({ _id: { $in: accessibleStudentIds } })
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: students.length,
      students
    });

  } catch (error) {
    console.error('Get assigned students error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Add Interview Record
exports.addInterview = async (req, res) => {
  try {
    const trainerId = req.user.id;
    const {
      studentId,
      interviewType,
      attendanceStatus,
      date,
      attemptNumber,
      communicationLevel,
      confidenceLevel,
      bodyLanguage,
      clarityLevel,
      clarityOfAnswer,
      technicalKnowledge,
      problemSolving,
      codingAbility,
      logicAndApproach,
      overallLevel,
      overallHRLevel,
      overallTechnicalLevel,
      levelCrossed,
      remarks,
      hrRemarks,
      technicalRemarks
    } = req.body;
    const normalizedLevelCrossed =
      levelCrossed === true || levelCrossed === 'true' || levelCrossed === '1' || levelCrossed === 1;

    // Verify student is assigned to trainer
    const hasAccess = await isStudentAccessibleToTrainer(trainerId, studentId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You can only add interviews for assigned students'
      });
    }

    // Get trainer details for email
    const trainer = await Trainer.findById(trainerId);

    const selectedOverallLevel = interviewType === 'Technical' ? overallTechnicalLevel : overallHRLevel || overallLevel;
    const selectedRemarks = interviewType === 'Technical' ? technicalRemarks : hrRemarks || remarks;

    const interview = new Interview({
      studentId,
      trainerId,
      interviewType,
      attendanceStatus,
      date,
      attemptNumber,
      communicationLevel,
      confidenceLevel,
      bodyLanguage,
      clarityLevel,
      clarityOfAnswer,
      technicalKnowledge,
      problemSolving,
      codingAbility,
      logicAndApproach,
      overallLevel: selectedOverallLevel,
      overallHRLevel,
      overallTechnicalLevel,
      levelCrossed: normalizedLevelCrossed,
      remarks: selectedRemarks,
      hrRemarks,
      technicalRemarks
    });

    await interview.save();

    res.status(201).json({
      success: true,
      message: 'Interview record added successfully',
      interview
    });

  } catch (error) {
    console.error('Add interview error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Add Aptitude Record
exports.addAptitude = async (req, res) => {
  try {
    const trainerId = req.user.id;
    const { studentId, attendanceStatus, roundNumber, score, result, remarks } = req.body;

    // Verify student is assigned to trainer
    const hasAccess = await isStudentAccessibleToTrainer(trainerId, studentId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You can only add aptitude records for assigned students'
      });
    }

    // Get trainer details for email
    const trainer = await Trainer.findById(trainerId);

    const aptitude = new Aptitude({
      studentId,
      trainerId,
      attendanceStatus,
      roundNumber,
      score,
      result,
      remarks
    });

    await aptitude.save();

    res.status(201).json({
      success: true,
      message: 'Aptitude record added successfully',
      aptitude
    });

  } catch (error) {
    console.error('Add aptitude error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Add Assessment Record
exports.addAssessment = async (req, res) => {
  try {
    const trainerId = req.user.id;
    const { studentId, attendanceStatus, assessmentType, score, status, feedback } = req.body;

    // Verify student is assigned to trainer
    const hasAccess = await isStudentAccessibleToTrainer(trainerId, studentId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You can only add assessments for assigned students'
      });
    }

    // Get trainer details for email
    const trainer = await Trainer.findById(trainerId);

    const assessment = new Assessment({
      studentId,
      trainerId,
      attendanceStatus,
      assessmentType,
      score,
      status,
      feedback
    });

    await assessment.save();

    res.status(201).json({
      success: true,
      message: 'Assessment record added successfully',
      assessment
    });

  } catch (error) {
    console.error('Add assessment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Add Training Record
exports.addTraining = async (req, res) => {
  try {
    const trainerId = req.user.id;
    const { studentId, date, attendance, skillImprovementNote, engagementLevel, trainerRemarks } = req.body;

    // Verify student is assigned to trainer
    const hasAccess = await isStudentAccessibleToTrainer(trainerId, studentId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You can only add training records for assigned students'
      });
    }

    // Get trainer details for email
    const trainer = await Trainer.findById(trainerId);

    const training = new Training({
      studentId,
      trainerId,
      date,
      attendance,
      skillImprovementNote,
      engagementLevel,
      trainerRemarks
    });

    await training.save();

    res.status(201).json({
      success: true,
      message: 'Training record added successfully',
      training
    });

  } catch (error) {
    console.error('Add training error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Update Task Progress (Trainer can update)
exports.updateTaskProgress = async (req, res) => {
  try {
    const trainerId = req.user.id;
    const { taskId } = req.params;
    const { progress, trainerFeedback, trainerReviewStatus } = req.body;

    const Task = require('../models/Task');
    const task = await Task.findById(taskId).populate('assignedTo');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Verify student is assigned to trainer
    if (task.assignedTo.assignedTrainer && task.assignedTo.assignedTrainer.toString() !== trainerId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update tasks for assigned students'
      });
    }

    if (progress !== undefined) {
      task.progress = progress;
      task.progressUpdatedBy = trainerId;
      task.progressUpdatedByModel = 'Trainer';

      // Auto update status based on progress
      if (progress === 100) {
        task.status = 'Completed';
        task.completedAt = new Date();
      } else if (progress > 0) {
        task.status = 'In Progress';
      }
    }

    if (trainerFeedback) task.trainerFeedback = trainerFeedback;
    if (trainerReviewStatus) task.trainerReviewStatus = trainerReviewStatus;

    await task.save();

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      task
    });

  } catch (error) {
    console.error('Update task progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get student records (interviews, aptitude, etc.)
exports.getStudentRecords = async (req, res) => {
  try {
    const { studentId } = req.params;
    const trainerId = req.user.id;

    // Verify student is assigned to trainer
    const hasAccess = await isStudentAccessibleToTrainer(trainerId, studentId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const interviews = await Interview.find({ studentId }).sort({ date: -1 });
    const aptitudes = await Aptitude.find({ studentId }).sort({ createdAt: -1 });
    const assessments = await Assessment.find({ studentId }).sort({ createdAt: -1 });
    const trainings = await Training.find({ studentId }).sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: {
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

// Update student status
exports.updateStudentStatus = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { status } = req.body;
    const trainerId = req.user.id;

    // Check if the student is assigned to this trainer
    const hasAccess = await isStudentAccessibleToTrainer(trainerId, studentId);
    if (!hasAccess) {
      return res.status(404).json({
        success: false,
        message: 'Student not found or not assigned to you'
      });
    }

    const student = await Intern.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found or not assigned to you'
      });
    }

    student.status = status.toLowerCase();
    await student.save();

    res.status(200).json({
      success: true,
      message: 'Status updated successfully'
    });
  } catch (error) {
    console.error('Update student status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Update trainer/HR profile
exports.updateProfile = async (req, res) => {
  try {
    const trainerId = req.user.id;
    const { name, email, mobile, joiningDate, customRole, password } = req.body;

    // Find the trainer
    const trainer = await Trainer.findById(trainerId);
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    // Update fields
    if (name !== undefined) trainer.name = String(name).trim();
    if (mobile !== undefined) trainer.mobile = String(mobile).trim();
    if (customRole !== undefined) trainer.customRole = String(customRole).trim();
    if (joiningDate !== undefined) {
      trainer.joiningDate = joiningDate ? new Date(joiningDate) : null;
    }
    
    // Update email if provided
    if (email !== undefined) {
      const normalizedEmail = String(email).trim().toLowerCase();
      // Check if email already exists (and it's not the same trainer's current email)
      const existingTrainer = await Trainer.findOne({ 
        email: normalizedEmail,
        _id: { $ne: trainerId }
      });
      
      if (existingTrainer) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use by another trainer'
        });
      }
      
      trainer.email = normalizedEmail;
    }
    
    // Update password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      trainer.password = await bcrypt.hash(password, salt);
    }

    await trainer.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: trainer._id,
        name: trainer.name,
        email: trainer.email,
        mobile: trainer.mobile,
        role: trainer.role,
        customRole: trainer.customRole,
        joiningDate: trainer.joiningDate,
        status: trainer.status,
        createdAt: trainer.createdAt,
        updatedAt: trainer.updatedAt
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get trainer profile
exports.getProfile = async (req, res) => {
  try {
    const trainerId = req.user.id;

    const trainer = await Trainer.findById(trainerId)
      .select('-password')
      .populate('assignedStudents', 'name email internId studentType status assignedTrainer')
      .populate({
        path: 'assignedGroups',
        select: 'groupName groupNumber students createdAt',
        populate: {
          path: 'students',
          select: '_id name email mobile internId studentType status',
        },
      })
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
    
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    res.status(200).json({
      success: true,
      user: trainer
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get Intern's Interview History (Intern portal view)
exports.getMyInterviews = async (req, res) => {
  try {
    const studentId = req.user.id; // This will be the intern's ID

    const interviews = await Interview.find({ studentId })
      .populate('trainerId', 'name email')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: interviews.length,
      interviews
    });

  } catch (error) {
    console.error('Get interviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get Intern's Aptitude Records (Intern portal view)
exports.getMyAptitude = async (req, res) => {
  try {
    const studentId = req.user.id; // This will be the intern's ID

    const aptitudeRecords = await Aptitude.find({ studentId })
      .populate('trainerId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: aptitudeRecords.length,
      aptitudeRecords
    });

  } catch (error) {
    console.error('Get aptitude records error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get Intern's Assessment Records (Intern portal view)
exports.getMyAssessments = async (req, res) => {
  try {
    const studentId = req.user.id; // This will be the intern's ID

    const assessments = await Assessment.find({ studentId })
      .populate('trainerId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: assessments.length,
      assessments
    });

  } catch (error) {
    console.error('Get assessments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get Intern's Training Records (Intern portal view)
exports.getMyTraining = async (req, res) => {
  try {
    const studentId = req.user.id; // This will be the intern's ID

    const trainings = await Training.find({ studentId })
      .populate('trainerId', 'name email')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: trainings.length,
      trainings
    });

  } catch (error) {
    console.error('Get training records error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get Intern's Profile (for intern dashboard)
exports.getMyProfile = async (req, res) => {
  try {
    const studentId = req.user.id;

    const intern = await Intern.findById(studentId)
      .select('-password')
      .populate('assignedTrainer', 'name email mobile');

    if (!intern) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    res.status(200).json({
      success: true,
      user: intern
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get Intern's Assigned Groups with member and trainer details
exports.getMyGroups = async (req, res) => {
  try {
    const studentId = req.user.id;

    const groups = await StudentGroup.find({ students: studentId })
      .populate('students', 'name internId email studentType')
      .sort({ createdAt: -1 });

    const groupIds = groups.map((group) => group._id);
    const trainers = groupIds.length
      ? await Trainer.find({ assignedGroups: { $in: groupIds } })
          .select('_id name email mobile assignedGroups')
          .lean()
      : [];

    const groupData = groups.map((groupDoc) => {
      const group = groupDoc.toObject();

      const assignedTrainerDetails = trainers
        .filter((trainer) =>
          (trainer.assignedGroups || []).some(
            (groupId) => String(groupId) === String(group._id)
          )
        )
        .map((trainer) => ({
          _id: trainer._id,
          name: trainer.name,
          email: trainer.email,
          mobile: trainer.mobile,
        }));

      const assignedEmployees = [...new Set([
        ...(Array.isArray(group.assignedEmployees) ? group.assignedEmployees : []),
        ...assignedTrainerDetails.map((trainer) => trainer.name),
      ])];

      return {
        ...group,
        assignedEmployees,
        assignedTrainerDetails,
      };
    });

    res.status(200).json({
      success: true,
      count: groupData.length,
      groups: groupData,
    });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// Update Intern's Profile (for intern dashboard)
exports.updateMyProfile = async (req, res) => {
  try {
    if (req.user.role !== 'intern') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const updateData = {};
    const editableFields = [
      'name',
      'email',
      'mobile',
      'internId',
      'studentType',
      'domain',
      'joiningDate',
      'endingDate',
      'duration',
      'collegeName',
      'branch',
      'yearOfStudy',
      'gender',
      'paymentDoneBy',
      'dateOfPayment',
      'transactionId',
      'paymentAmount',
      'completedFees',
      'pendingFees',
      'lastPaymentDate',
      'currentDesignation',
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
      'finalPaymentDate'
    ];

    editableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        const value = req.body[field];
        if (typeof value === 'string') {
          updateData[field] = value.trim();
        } else {
          updateData[field] = value;
        }
      }
    });

    if (updateData.email) {
      updateData.email = updateData.email.toLowerCase();
    }

    if (req.body.password && String(req.body.password).trim()) {
      updateData.password = await bcrypt.hash(String(req.body.password), 10);
    }

    const intern = await Intern.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password').populate('assignedTrainer', 'name email mobile');

    if (!intern) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    res.status(200).json({
      success: true,
      user: intern
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get Notifications for Intern
exports.getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role; // 'intern' or 'trainer'

    let notifications;

    if (userRole === 'intern') {
      // For interns
      notifications = await Notification.find({
        $or: [
          { sendTo: 'All' },
          { 
            sendTo: 'Group',
            recipientModel: 'Intern',
            recipientIds: userId
          },
          {
            sendTo: 'Individual',
            recipientModel: 'Intern',
            recipientIds: userId
          }
        ]
      })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    } else if (userRole === 'trainer') {
      // For trainers
      notifications = await Notification.find({
        $or: [
          { sendTo: 'All' },
          { 
            sendTo: 'Group',
            recipientModel: 'Trainer',
            recipientIds: userId
          },
          {
            sendTo: 'Individual',
            recipientModel: 'Trainer',
            recipientIds: userId
          }
        ]
      })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid user role'
      });
    }

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

// Get Job & Internship Postings for Intern
exports.getMyJobPostings = async (req, res) => {
  try {
    const postings = await JobPosting.find({ status: 'active' })
      .populate('postedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: postings.length,
      postings
    });

  } catch (error) {
    console.error('Get job postings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = exports;
