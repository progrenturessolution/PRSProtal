const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Intern',
    required: true
  },
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trainer',
    required: true
  },
  interviewType: {
    type: String,
    required: true,
    enum: ['HR', 'Technical']
  },
  attendanceStatus: {
    type: String,
    enum: ['Present', 'Absent', 'Late'],
    default: 'Present'
  },
  date: {
    type: Date,
    required: true
  },
  attemptNumber: {
    type: Number,
    required: true,
    default: 1
  },
  communicationLevel: {
    type: String,
    enum: ['B', 'I', 'A', 'E'] // Beginner, Intermediate, Advanced, Expert
  },
  confidenceLevel: {
    type: String,
    enum: ['B', 'I', 'A', 'E']
  },
  bodyLanguage: {
    type: String,
    enum: ['B', 'I', 'A', 'E']
  },
  clarityLevel: {
    type: String,
    enum: ['B', 'I', 'A', 'E']
  },
  clarityOfAnswer: {
    type: String,
    enum: ['B', 'I', 'A', 'E']
  },
  technicalKnowledge: {
    type: String,
    enum: ['B', 'I', 'A', 'E']
  },
  problemSolving: {
    type: String,
    enum: ['B', 'I', 'A', 'E']
  },
  codingAbility: {
    type: String,
    enum: ['B', 'I', 'A', 'E']
  },
  logicAndApproach: {
    type: String,
    enum: ['B', 'I', 'A', 'E']
  },
  overallLevel: {
    type: String,
    enum: ['F', 'C', 'P', 'E'] // Fail, Clear, Pass, Excellent
  },
  overallHRLevel: {
    type: String,
    enum: ['B', 'I', 'A', 'E']
  },
  overallTechnicalLevel: {
    type: String,
    enum: ['B', 'I', 'A', 'E']
  },
  levelCrossed: {
    type: Boolean,
    required: true
  },
  remarks: {
    type: String,
    trim: true
  },
  hrRemarks: {
    type: String,
    trim: true
  },
  technicalRemarks: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Interview', interviewSchema);
