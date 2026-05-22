const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const Document = require('../models/Document');
const Analysis = require('../models/Analysis');
const { extractText } = require('../services/textExtractor');
const { analyzeText } = require('../services/nlpAnalyzer');
const { analyzeDocument: openAIAnalyze } = require('../services/openaiAnalyzer');

// @desc    Upload document(s)
// @route   POST /api/documents/upload
exports.uploadDocuments = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files uploaded' });
    }

    const uploadedDocs = [];

    for (const file of req.files) {
      const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
      const doc = await Document.create({
        user: req.user.id,
        originalName: file.originalname,
        fileName: file.filename,
        filePath: file.path,
        fileType: ext,
        fileSize: file.size,
        mimeType: file.mimetype,
        status: 'uploaded'
      });
      uploadedDocs.push(doc);
    }

    res.status(201).json({
      success: true,
      count: uploadedDocs.length,
      documents: uploadedDocs
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Process document (extract text + analyze)
// @route   POST /api/documents/:id/process
exports.processDocument = async (req, res, next) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, user: req.user.id });
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    if (doc.status === 'processing') {
      return res.status(400).json({ success: false, error: 'Document is already being processed' });
    }

    doc.status = 'processing';
    await doc.save();

    const startTime = Date.now();

    // Extract text
    const extractionResult = await extractText(doc.filePath, doc.fileType, doc.language || 'eng');

    if (!extractionResult.text || extractionResult.text.trim().length === 0) {
      doc.status = 'failed';
      await doc.save();
      return res.status(422).json({ success: false, error: 'Could not extract text from document' });
    }

    doc.extractedText = extractionResult.text;

    // Try OpenAI analysis first, fall back to local NLP
    let nlpResult = await openAIAnalyze(extractionResult.text, doc.originalName);
    if (!nlpResult) {
      console.log('Using local NLP fallback...');
      nlpResult = analyzeText(extractionResult.text);
      nlpResult.aiPowered = false;
    }

    // Compute statistics locally (always reliable)
    const { getStatistics } = require('../services/nlpAnalyzer');
    const stats = getStatistics(extractionResult.text);

    // Save analysis
    const existingAnalysis = await Analysis.findOne({ document: doc._id });
    let analysis;

    const analysisData = {
      document: doc._id,
      user: req.user.id,
      summary: nlpResult.summary,
      keywords: nlpResult.keywords,
      sentiment: nlpResult.sentiment,
      topics: nlpResult.topics,
      entities: nlpResult.entities,
      statistics: nlpResult.statistics || stats,
      category: nlpResult.category,
      highlights: nlpResult.highlights,
      language: nlpResult.language,
      processingDuration: Date.now() - startTime,
      aiPowered: nlpResult.aiPowered || false,
      readingLevel: nlpResult.readingLevel,
      tone: nlpResult.tone
    };

    if (existingAnalysis) {
      analysis = await Analysis.findByIdAndUpdate(existingAnalysis._id, analysisData, { new: true });
    } else {
      analysis = await Analysis.create(analysisData);
    }

    doc.status = 'completed';
    doc.analysis = analysis._id;
    doc.processingTime = Date.now() - startTime;
    doc.language = nlpResult.language;
    await doc.save();

    res.json({
      success: true,
      document: doc,
      analysis
    });
  } catch (error) {
    // Mark as failed
    try {
      await Document.findByIdAndUpdate(req.params.id, { status: 'failed' });
    } catch (e) {}
    next(error);
  }
};

// @desc    Get all documents for user
// @route   GET /api/documents
exports.getDocuments = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, fileType, status, search, sortBy = 'createdAt', order = 'desc' } = req.query;

    const query = { user: req.user.id };
    if (fileType) query.fileType = fileType;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { originalName: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [documents, total] = await Promise.all([
      Document.find(query)
        .populate('analysis', 'summary sentiment category statistics keywords')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit)),
      Document.countDocuments(query)
    ]);

    res.json({
      success: true,
      documents,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single document
// @route   GET /api/documents/:id
exports.getDocument = async (req, res, next) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, user: req.user.id })
      .populate('analysis');

    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    res.json({ success: true, document: doc });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete document
// @route   DELETE /api/documents/:id
exports.deleteDocument = async (req, res, next) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, user: req.user.id });
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    // Delete file from disk
    if (fs.existsSync(doc.filePath)) {
      fs.unlinkSync(doc.filePath);
    }

    // Delete associated analysis
    if (doc.analysis) {
      await Analysis.findByIdAndDelete(doc.analysis);
    }

    await Document.findByIdAndDelete(doc._id);

    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle favorite
// @route   PATCH /api/documents/:id/favorite
exports.toggleFavorite = async (req, res, next) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, user: req.user.id });
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    doc.isFavorite = !doc.isFavorite;
    await doc.save();

    res.json({ success: true, isFavorite: doc.isFavorite });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate share token
// @route   POST /api/documents/:id/share
exports.shareDocument = async (req, res, next) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, user: req.user.id });
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    if (!doc.shareToken) {
      doc.shareToken = uuidv4();
      await doc.save();
    }

    res.json({ success: true, shareToken: doc.shareToken, shareUrl: `${process.env.FRONTEND_URL}/shared/${doc.shareToken}` });
  } catch (error) {
    next(error);
  }
};

// @desc    Get shared document (public)
// @route   GET /api/documents/shared/:token
exports.getSharedDocument = async (req, res, next) => {
  try {
    const doc = await Document.findOne({ shareToken: req.params.token })
      .populate('analysis', 'summary sentiment category statistics keywords topics entities highlights');

    if (!doc) {
      return res.status(404).json({ success: false, error: 'Shared document not found' });
    }

    res.json({
      success: true,
      document: {
        originalName: doc.originalName,
        fileType: doc.fileType,
        createdAt: doc.createdAt,
        analysis: doc.analysis
      }
    });
  } catch (error) {
    next(error);
  }
};
