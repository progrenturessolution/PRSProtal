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
  progressUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'progressUpdatedByModel'
  },
  progressUpdatedByModel: {
    type: String,
    enum: ['Admin', 'Trainer']
  },
  status: {
    type: String,
    enum: ['Assigned', 'In Progress', 'Pending Approval', 'Completed', 'Needs Improvement', 'Reviewed'],
    default: 'Assigned'
  },
  trainerFeedback: {
    type: String,
    trim: true
  },
  trainerReviewStatus: {
    type: String,
    enum: ['Pending', 'Reviewed', 'Needs Improvement', 'Approved'],
    default: 'Pending'
  },
  submissionLink: {
    type: String,
    trim: true
  },
  submissionFiles: [{
    filename: String,
    filepath: String,
    uploadedAt: Date
  }],
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
  },
  isTeamTask: {
    type: Boolean,
    default: false
  },
  teamMembers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Intern'
  }],
  taskDocument: {
    filename: String,
    filepath: String,
    uploadedAt: Date
  },
  teamMessages: [{
    message: {
      type: String,
      required: true
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Intern',
      required: true
    },
    senderName: {
      type: String,
      required: true
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    // Reply-to fields (set when this message is a reply to another)
    replyToSnippet: {
      type: String,
      default: null
    },
    replyToSenderName: {
      type: String,
      default: null
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Task', taskSchema);
