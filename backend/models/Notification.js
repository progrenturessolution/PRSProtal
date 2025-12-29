const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
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
    enum: ['Interview', 'Test/Assessment', 'Certificate', 'General/Announcement']
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
