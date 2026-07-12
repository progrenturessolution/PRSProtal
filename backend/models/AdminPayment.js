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
  },
  connectedBy: {
    type: String,
    trim: true
  },
  paymentType: {
    type: String,
    trim: true,
    default: 'Receive'
  },
  totalPayment: {
    type: Number,
    default: 0
  },
  firstPayment: {
    type: Number,
    default: 0
  },
  firstPaymentSendDate: {
    type: Date
  },
  firstPaymentReceiveDate: {
    type: Date
  },
  secondPayment: {
    type: Number,
    default: 0
  },
  secondPaymentSendDate: {
    type: Date
  },
  secondPaymentReceiveDate: {
    type: Date
  },
  finalPayment: {
    type: Number,
    default: 0
  },
  finalPaymentSendDate: {
    type: Date
  },
  finalPaymentReceiveDate: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AdminPayment', AdminPaymentSchema);
