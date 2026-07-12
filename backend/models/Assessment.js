const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
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
  attendanceStatus: {
    type: String,
    enum: ['Present', 'Absent', 'Late'],
    default: 'Present'
  },
  date: {
    type: Date,
    default: Date.now
  },
  assessmentType: {
    type: String,
    required: true
  },
  score: {
    type: Number
  },
  status: {
    type: String,
    required: true,
    enum: ['Pass', 'Fail', 'Pending', 'In Progress']
  },
  feedback: {
    type: String,
    trim: true
  },
  outOf: {
    type: Number
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Assessment', assessmentSchema);
