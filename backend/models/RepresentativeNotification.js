const mongoose = require('mongoose');

const representativeNotificationSchema = new mongoose.Schema(
  {
    representative: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Representative',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    notificationType: {
      type: String,
      enum: ['Student', 'Payout', 'General/Announcement'],
      default: 'General/Announcement',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('RepresentativeNotification', representativeNotificationSchema);
