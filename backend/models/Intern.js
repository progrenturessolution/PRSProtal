const mongoose = require('mongoose');

const internSchema = new mongoose.Schema({
  // Student Type Selection
  studentType: {
    type: String,
    required: true,
    enum: ['Internship', 'SMS Program']
  },
  // Common fields for both
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
  mobile: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  // ID based on type
  internId: {
    type: String,
    required: true,
    unique: true
  },
  // Internship specific fields
  domain: {
    type: String,
    trim: true
  },
  joiningDate: {
    type: Date
  },
  endingDate: {
    type: Date
  },
  duration: {
    type: String,
    trim: true
  },
  // SMS Program specific fields
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', '']
  },
  paymentDoneBy: {
    type: String,
    trim: true
  },
  dateOfPayment: {
    type: Date
  },
  transactionId: {
    type: String,
    trim: true
  },
  currentDesignation: {
    type: String,
    trim: true,
    default: 'Student'
  },
  // Document uploads (synced across profile & certificates)
  documents: {
    offerLetter: {
      filename: String,
      filepath: String,
      uploadedAt: Date
    },
    welcomeLetter: {
      filename: String,
      filepath: String,
      uploadedAt: Date
    },
    paymentReceipt: {
      filename: String,
      filepath: String,
      uploadedAt: Date
    },
    otherCertificates: [{
      name: String,
      filename: String,
      filepath: String,
      uploadedAt: Date
    }]
  },
  // Trainer assignment
  assignedTrainer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trainer'
  },
  role: {
    type: String,
    default: 'intern',
    enum: ['intern']
  },
  status: {
    type: String,
    default: 'active',
    enum: ['active', 'completed', 'inactive']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Intern', internSchema);
