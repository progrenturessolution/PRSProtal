const mongoose = require('mongoose');

const PaymentNoteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    default: 'Untitled Note'
  },
  text: {
    type: String,
    trim: true,
    default: ''
  },
  color: {
    type: String,
    default: '#324158'
  },
  textColor: {
    type: String,
    default: '#ffffff'
  },
  borderColor: {
    type: String,
    default: '#1f293b'
  },
  isPinned: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PaymentNote', PaymentNoteSchema);
