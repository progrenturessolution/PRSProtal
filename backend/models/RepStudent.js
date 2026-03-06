const mongoose = require('mongoose');

const repStudentSchema = new mongoose.Schema({
  representative: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Representative',
    required: true
  },
  studentName: {
    type: String,
    required: true,
    trim: true
  },
  college: {
    type: String,
    trim: true
  },
  branch: {
    type: String,
    trim: true
  },
  mobile: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  domain: {
    type: String,
    trim: true
  },
  batchJoiningDate: {
    type: Date
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  firstInstallment: {
    type: Number,
    default: 0
  },
  secondInstallment: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Virtual: paidAmount = firstInstallment + secondInstallment
repStudentSchema.virtual('paidAmount').get(function () {
  return (this.firstInstallment || 0) + (this.secondInstallment || 0);
});

// Virtual: pendingAmount = totalAmount - paidAmount
repStudentSchema.virtual('pendingAmount').get(function () {
  return (this.totalAmount || 0) - ((this.firstInstallment || 0) + (this.secondInstallment || 0));
});

repStudentSchema.set('toJSON', { virtuals: true });
repStudentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('RepStudent', repStudentSchema);
