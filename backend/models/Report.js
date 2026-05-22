const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  document: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  analysis: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Analysis',
    required: true
  },
  reportType: {
    type: String,
    enum: ['pdf', 'txt'],
    required: true
  },
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },
  fileSize: { type: Number }
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
