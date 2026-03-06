const mongoose = require('mongoose');

const representativeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  mobile: {
    type: String,
    trim: true
  },
  college: {
    type: String,
    trim: true
  },
  course: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  year: {
    type: String,
    trim: true
  },
  upiId: {
    type: String,
    trim: true
  },
  designation: {
    type: String,
    default: 'Campus Representative',
    trim: true
  },
  sheetLinks: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    default: 'representative'
  },
  status: {
    type: String,
    default: 'active',
    enum: ['active', 'inactive']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Representative', representativeSchema);
