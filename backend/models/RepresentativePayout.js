const mongoose = require('mongoose');

const representativePayoutSchema = new mongoose.Schema(
  {
    monthLabel: {
      type: String,
      required: true,
      trim: true,
    },
    weekLabel: {
      type: String,
      required: true,
      trim: true,
    },
    weekStartDate: {
      type: Date,
      required: true,
    },
    weekEndDate: {
      type: Date,
      required: true,
    },
    representative: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Representative',
      required: true,
      index: true,
    },
    upiQrDriveLink: {
      type: String,
      trim: true,
    },
    totalEnrollmentCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    studentsWith3000Paid: {
      type: Number,
      default: 0,
      min: 0,
    },
    payoutEligible: {
      type: String,
      enum: ['Yes', 'No'],
      default: 'No',
    },
    rewardPercent: {
      type: Number,
      default: 0,
      min: 0,
    },
    payoutAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    payoutStatus: {
      type: String,
      enum: ['Paid', 'Hold'],
      default: 'Hold',
    },
    payoutReleaseDate: {
      type: Date,
    },
    promotionalDocumentsLink: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

representativePayoutSchema.index(
  { representative: 1, weekStartDate: 1, weekEndDate: 1 },
  { unique: true },
);

module.exports = mongoose.model('RepresentativePayout', representativePayoutSchema);
