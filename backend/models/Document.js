const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  originalName: { type: String, required: true },
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },
  fileType: {
    type: String,
    enum: ['pdf', 'docx', 'txt', 'png', 'jpg', 'jpeg'],
    required: true
  },
  fileSize: { type: Number, required: true },
  mimeType: { type: String, required: true },
  extractedText: { type: String, default: '' },
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'completed', 'failed'],
    default: 'uploaded'
  },
  tags: [{ type: String }],
  isFavorite: { type: Boolean, default: false },
  shareToken: { type: String, unique: true, sparse: true },
  analysis: { type: mongoose.Schema.Types.ObjectId, ref: 'Analysis' },
  processingTime: { type: Number },
  language: { type: String, default: 'eng' }
}, { timestamps: true });

documentSchema.index({ user: 1, createdAt: -1 });
documentSchema.index({ user: 1, fileType: 1 });
documentSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Document', documentSchema);
