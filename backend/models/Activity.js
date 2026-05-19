const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  type: { type: String, required: true }, // Interview / GD / Task / Assessment
  title: { type: String },
  dateTime: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, refPath: 'createdByModel', required: false },
  createdByModel: { type: String, enum: ['Admin','Trainer','Intern'], default: 'Admin' },
  status: { type: String, default: 'Scheduled' },
  details: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

module.exports = mongoose.model('Activity', ActivitySchema);
