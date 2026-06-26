const mongoose = require('mongoose');

const AdminPaymentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    required: true,
    trim: true
  },
  paymentGoal: {
    type: String,
    required: true,
    default: 'Pending'
  },
  payment: {
    type: Number,
    required: true,
    default: 0
  },
  pendingPayment: {
    type: Number,
    required: true,
    default: 0
  },
  receiveDate: {
    type: Date
  },
  sendDate: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AdminPayment', AdminPaymentSchema);
