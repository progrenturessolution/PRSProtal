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
  collegeName: {
    type: String,
    trim: true
  },
  branch: {
    type: String,
    trim: true
  },
  yearOfStudy: {
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
  paymentAmount: {
    type: String,
    trim: true
  },
  completedFees: {
    type: String,
    trim: true,
    default: '0'
  },
  pendingFees: {
    type: String,
    trim: true,
    default: '0'
  },
  lastPaymentDate: {
    type: Date
  },
  currentDesignation: {
    type: String,
    trim: true,
    default: 'Student'
  },
  suggestedDomain: {
    type: String,
    trim: true
  },
  currentQualification: {
    type: String,
    trim: true
  },
  instituteName: {
    type: String,
    trim: true
  },
  instituteLocation: {
    type: String,
    trim: true
  },
  enrolmentDate: {
    type: Date
  },
  enrolBatchMonth: {
    type: String,
    trim: true
  },
  totalFees: {
    type: String,
    trim: true
  },
  firstPaymentAmount: {
    type: String,
    trim: true
  },
  firstPaymentDate: {
    type: Date
  },
  secondPaymentAmount: {
    type: String,
    trim: true
  },
  secondPaymentDate: {
    type: Date
  },
  finalPaymentAmount: {
    type: String,
    trim: true
  },
  finalPaymentDate: {
    type: Date
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
    smsProgramEnrollmentLetter: {
      filename: String,
      filepath: String,
      uploadedAt: Date
    },
    completionLetter: {
      filename: String,
      filepath: String,
      uploadedAt: Date
    },
    completionCertificate: {
      filename: String,
      filepath: String,
      uploadedAt: Date
    },
    experienceLetter: {
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
  addedByRepresentative: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Representative',
    default: null
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
  },
  inactiveMessage: {
    type: String,
    default: ''
  },
  // Soft delete fields
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Intern', internSchema);
