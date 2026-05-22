const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const Document = require('../models/Document');
const { askQuestion, generateSummary } = require('../services/openaiAnalyzer');

router.use(protect);

// @desc    Ask a question about a document
// @route   POST /api/ai/ask/:documentId
router.post('/ask/:documentId', [
  body('question').trim().notEmpty().withMessage('Question is required').isLength({ max: 500 })
], validate, async (req, res, next) => {
  try {
    const doc = await Document.findOne({ _id: req.params.documentId, user: req.user.id });
    if (!doc) return res.status(404).json({ success: false, error: 'Document not found' });
    if (!doc.extractedText) return res.status(400).json({ success: false, error: 'Document has no extracted text' });

    const answer = await askQuestion(doc.extractedText, req.body.question);
    res.json({ success: true, question: req.body.question, answer });
  } catch (error) {
    next(error);
  }
});

// @desc    Generate a custom summary
// @route   POST /api/ai/summarize/:documentId
router.post('/summarize/:documentId', [
  body('style').optional().isIn(['concise', 'detailed', 'bullets'])
], validate, async (req, res, next) => {
  try {
    const doc = await Document.findOne({ _id: req.params.documentId, user: req.user.id });
    if (!doc) return res.status(404).json({ success: false, error: 'Document not found' });
    if (!doc.extractedText) return res.status(400).json({ success: false, error: 'Document has no extracted text' });

    const summary = await generateSummary(doc.extractedText, req.body.style || 'concise');
    res.json({ success: true, summary, style: req.body.style || 'concise' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
