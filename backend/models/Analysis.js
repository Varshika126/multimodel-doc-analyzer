const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
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
  summary: { type: String, default: '' },
  keywords: [{
    word: String,
    frequency: Number,
    relevance: Number
  }],
  sentiment: {
    label: { type: String, enum: ['positive', 'negative', 'neutral'], default: 'neutral' },
    score: { type: Number, default: 0 },
    positive: { type: Number, default: 0 },
    negative: { type: Number, default: 0 },
    neutral: { type: Number, default: 0 }
  },
  topics: [{
    name: String,
    confidence: Number,
    keywords: [String]
  }],
  entities: [{
    text: String,
    type: String,
    count: Number
  }],
  statistics: {
    wordCount: { type: Number, default: 0 },
    charCount: { type: Number, default: 0 },
    sentenceCount: { type: Number, default: 0 },
    paragraphCount: { type: Number, default: 0 },
    readingTime: { type: Number, default: 0 },
    avgWordLength: { type: Number, default: 0 },
    uniqueWords: { type: Number, default: 0 }
  },
  category: {
    type: String,
    enum: ['business', 'legal', 'medical', 'technical', 'academic', 'financial', 'news', 'personal', 'other'],
    default: 'other'
  },
  language: { type: String, default: 'en' },
  highlights: [{ type: String }],
  processingDuration: { type: Number },
  aiPowered: { type: Boolean, default: false },
  readingLevel: { type: String, default: 'intermediate' },
  tone: { type: String, default: 'informative' }
}, { timestamps: true });

analysisSchema.index({ document: 1 });
analysisSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Analysis', analysisSchema);
