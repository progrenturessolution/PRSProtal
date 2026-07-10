const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  activityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  notificationType: {
    type: String,
    required: true,
    enum: ['Interview', 'Test/Assessment', 'Certificate', 'General/Announcement', 'GD']
  },
  sendTo: {
    type: String,
    required: true,
    enum: ['Individual', 'Group', 'All']
  },
  recipientIds: [{
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'recipientModel'
  }],
  recipientModel: {
    type: String,
    enum: ['Intern', 'Trainer', 'Admin']
  },
  assessmentMeta: {
    assessmentMode: {
      type: String,
      enum: ['Individual', 'Group']
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentGroup'
    },
    groupName: {
      type: String,
      trim: true
    },
    assignedLabels: [String],
    assignedIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Intern'
    }]
  },
  attachment: {
    filename: String,
    filepath: String,
    mimetype: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  readBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
