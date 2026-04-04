const mongoose = require('mongoose');

const representativeSchema = new mongoose.Schema({
  pgirId: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },
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
  internshipApplicationFormLink: {
    type: String,
    trim: true
  },
  internshipSheetLink: {
    type: String,
    trim: true
  },
  promotionalMessage: {
    type: String,
    trim: true
  },
  joiningDate: {
    type: Date
  },
  instagramProfile: {
    type: String,
    trim: true
  },
  linkedinProfile: {
    type: String,
    trim: true
  },
  upiMobileNumber: {
    type: String,
    trim: true
  },
  docs: {
    upiScanner: {
      filename: String,
      filepath: String,
      uploadedAt: Date
    },
    pgirSelectionLetter: {
      filename: String,
      filepath: String,
      uploadedAt: Date
    },
    internshipOfferLetter: {
      filename: String,
      filepath: String,
      uploadedAt: Date
    }
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
