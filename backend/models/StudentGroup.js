const mongoose = require('mongoose');

const studentGroupSchema = new mongoose.Schema(
  {
    groupNumber: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    groupName: {
      type: String,
      required: true,
      trim: true,
    },
    groupDescription: {
      type: String,
      trim: true,
    },
    studentType: {
      type: String,
      enum: ['Internship', 'SMS Program', 'All'],
      default: 'All',
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Intern',
      },
    ],
    assignedEmployees: [
      {
        type: String,
        trim: true,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('StudentGroup', studentGroupSchema);
