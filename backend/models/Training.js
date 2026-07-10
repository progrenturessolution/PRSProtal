const mongoose = require('mongoose');

const trainingSchema = new mongoose.Schema({
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
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  attendance: {
    type: String,
    required: true,
    enum: ['Present', 'Absent', 'Late']
  },
  skillImprovementNote: {
    type: String,
    trim: true
  },
  engagementLevel: {
    type: String,
    required: true,
    enum: ['Low', 'Medium', 'High', 'Excellent']
  },
  trainerRemarks: {
    type: String,
    trim: true
  },
  score: {
    type: Number
  },
  outOf: {
    type: Number
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Training', trainingSchema);
