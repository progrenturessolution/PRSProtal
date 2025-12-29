const mongoose = require('mongoose');

const aptitudeSchema = new mongoose.Schema({
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
  roundNumber: {
    type: Number,
    required: true,
    default: 1
  },
  score: {
    type: Number,
    required: true
  },
  result: {
    type: String,
    required: true,
    enum: ['Pass', 'Improve']
  },
  remarks: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Aptitude', aptitudeSchema);
