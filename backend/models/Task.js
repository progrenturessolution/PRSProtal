const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
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
  deadline: {
    type: Date,
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Intern',
    required: true
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['Assigned', 'In Progress', 'Pending Approval', 'Completed'],
    default: 'Assigned'
  },
  completedAt: {
    type: Date,
    default: null
  },
  comments: [{
    message: {
      type: String,
      required: true
    },
    sentBy: {
      type: String,
      enum: ['admin', 'intern'],
      required: true
    },
    sentAt: {
      type: Date,
      default: Date.now
    }
  }],
  hasUnreadFeedback: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Task', taskSchema);
