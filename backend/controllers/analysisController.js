const Analysis = require('../models/Analysis');
const Document = require('../models/Document');

// @desc    Get analysis for a document
// @route   GET /api/analysis/:documentId
exports.getAnalysis = async (req, res, next) => {
  try {
    const doc = await Document.findOne({ _id: req.params.documentId, user: req.user.id });
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    const analysis = await Analysis.findOne({ document: req.params.documentId });
    if (!analysis) {
      return res.status(404).json({ success: false, error: 'Analysis not found. Please process the document first.' });
    }

    res.json({ success: true, analysis });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all analyses for user
// @route   GET /api/analysis
exports.getAllAnalyses = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, category } = req.query;
    const query = { user: req.user.id };
    if (category) query.category = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [analyses, total] = await Promise.all([
      Analysis.find(query)
        .populate('document', 'originalName fileType fileSize createdAt status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Analysis.countDocuments(query)
    ]);

    res.json({
      success: true,
      analyses,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get analytics overview
// @route   GET /api/analysis/overview
exports.getAnalyticsOverview = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const analyses = await Analysis.find({ user: userId })
      .populate('document', 'fileType fileSize originalName createdAt');

    // Category distribution
    const categoryDist = {};
    analyses.forEach(a => {
      categoryDist[a.category] = (categoryDist[a.category] || 0) + 1;
    });

    // Sentiment distribution
    const sentimentDist = { positive: 0, negative: 0, neutral: 0 };
    analyses.forEach(a => {
      if (a.sentiment && a.sentiment.label) {
        sentimentDist[a.sentiment.label]++;
      }
    });

    // File type distribution
    const fileTypeDist = {};
    analyses.forEach(a => {
      if (a.document && a.document.fileType) {
        fileTypeDist[a.document.fileType] = (fileTypeDist[a.document.fileType] || 0) + 1;
      }
    });

    // Top keywords across all documents
    const allKeywords = {};
    analyses.forEach(a => {
      (a.keywords || []).forEach(kw => {
        allKeywords[kw.word] = (allKeywords[kw.word] || 0) + kw.frequency;
      });
    });
    const topKeywords = Object.entries(allKeywords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([word, frequency]) => ({ word, frequency }));

    // Average stats
    const avgStats = analyses.reduce((acc, a) => {
      if (a.statistics) {
        acc.wordCount += a.statistics.wordCount || 0;
        acc.readingTime += a.statistics.readingTime || 0;
      }
      return acc;
    }, { wordCount: 0, readingTime: 0 });

    const count = analyses.length || 1;

    res.json({
      success: true,
      overview: {
        totalAnalyses: analyses.length,
        categoryDistribution: Object.entries(categoryDist).map(([name, value]) => ({ name, value })),
        sentimentDistribution: Object.entries(sentimentDist).map(([name, value]) => ({ name, value })),
        fileTypeDistribution: Object.entries(fileTypeDist).map(([name, value]) => ({ name, value })),
        topKeywords,
        averages: {
          wordCount: Math.round(avgStats.wordCount / count),
          readingTime: Math.round(avgStats.readingTime / count)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
