const mongoose = require('mongoose');

const trainerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  mobile: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    default: 'trainer',
    enum: ['trainer', 'hr']
  },
  assignedStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Intern'
  }],
  status: {
    type: String,
    default: 'active',
    enum: ['active', 'inactive']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Trainer', trainerSchema);
