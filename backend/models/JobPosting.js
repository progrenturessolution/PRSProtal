const mongoose = require('mongoose');

const jobPostingSchema = new mongoose.Schema({
  opportunityType: {
    type: String,
    required: true,
    enum: ['Job', 'Internship']
  },
  domain: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  eligibilityCriteria: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  applicationLink: {
    type: String,
    trim: true
  },
  applicationInstructions: {
    type: String,
    trim: true
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'postedByModel',
    required: true
  },
  postedByModel: {
    type: String,
    enum: ['Admin', 'Trainer']
  },
  status: {
    type: String,
    default: 'active',
    enum: ['active', 'closed']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('JobPosting', jobPostingSchema);
