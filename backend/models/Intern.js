const mongoose = require('mongoose');

const internSchema = new mongoose.Schema({
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
  internId: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: 'intern',
    enum: ['intern']
  },
  status: {
    type: String,
    default: 'active',
    enum: ['active', 'completed']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Intern', internSchema);
