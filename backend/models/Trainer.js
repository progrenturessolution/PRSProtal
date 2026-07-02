const mongoose = require('mongoose');

const workAssignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  workDate: {
    type: Date,
    required: true
  },
  assignedStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Intern'
  }],
  assignedGroups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudentGroup'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

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
  plainPassword: {
    type: String,
    default: ''
  },
  mobile: {
    type: String,
    trim: true
  },
  joiningDate: {
    type: Date,
    default: null
  },
  role: {
    type: String,
    default: 'trainer',
    enum: ['trainer', 'hr', 'other']
  },
  customRole: {
    type: String,
    trim: true,
    default: ''
  },
  assignedStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Intern'
  }],
  assignedGroups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudentGroup'
  }],
  workAssignments: [workAssignmentSchema],
  status: {
    type: String,
    default: 'active',
    enum: ['active', 'inactive']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Trainer', trainerSchema);
