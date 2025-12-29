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
    required: true,
    enum: ['B', 'I', 'A', 'E'] // Beginner, Intermediate, Advanced, Expert
  },
  confidenceLevel: {
    type: String,
    required: true,
    enum: ['B', 'I', 'A', 'E']
  },
  clarityLevel: {
    type: String,
    required: true,
    enum: ['B', 'I', 'A', 'E']
  },
  overallLevel: {
    type: String,
    required: true,
    enum: ['F', 'C', 'P', 'E'] // Fail, Clear, Pass, Excellent
  },
  levelCrossed: {
    type: Boolean,
    required: true
  },
  remarks: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Interview', interviewSchema);
