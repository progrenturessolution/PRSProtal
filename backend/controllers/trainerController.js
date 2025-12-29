const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Trainer = require('../models/Trainer');
const Intern = require('../models/Intern');
const Interview = require('../models/Interview');
const Aptitude = require('../models/Aptitude');
const Assessment = require('../models/Assessment');
const Training = require('../models/Training');

// Trainer Login
exports.trainerLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check if trainer exists
    const trainer = await Trainer.findOne({ email });
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

    const students = await Intern.find({ assignedTrainer: trainerId })
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
      date,
      attemptNumber,
      communicationLevel,
      confidenceLevel,
      clarityLevel,
      overallLevel,
      levelCrossed,
      remarks
    } = req.body;

    // Verify student is assigned to trainer
    const student = await Intern.findOne({ _id: studentId, assignedTrainer: trainerId });
    if (!student) {
      return res.status(403).json({
        success: false,
        message: 'You can only add interviews for assigned students'
      });
    }

    const interview = new Interview({
      studentId,
      trainerId,
      interviewType,
      date,
      attemptNumber,
      communicationLevel,
      confidenceLevel,
      clarityLevel,
      overallLevel,
      levelCrossed,
      remarks
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
    const { studentId, roundNumber, score, result, remarks } = req.body;

    // Verify student is assigned to trainer
    const student = await Intern.findOne({ _id: studentId, assignedTrainer: trainerId });
    if (!student) {
      return res.status(403).json({
        success: false,
        message: 'You can only add aptitude records for assigned students'
      });
    }

    const aptitude = new Aptitude({
      studentId,
      trainerId,
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
    const { studentId, assessmentType, score, status, feedback } = req.body;

    // Verify student is assigned to trainer
    const student = await Intern.findOne({ _id: studentId, assignedTrainer: trainerId });
    if (!student) {
      return res.status(403).json({
        success: false,
        message: 'You can only add assessments for assigned students'
      });
    }

    const assessment = new Assessment({
      studentId,
      trainerId,
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
    const student = await Intern.findOne({ _id: studentId, assignedTrainer: trainerId });
    if (!student) {
      return res.status(403).json({
        success: false,
        message: 'You can only add training records for assigned students'
      });
    }

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
    const student = await Intern.findOne({ _id: studentId, assignedTrainer: trainerId });
    if (!student) {
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

module.exports = exports;
