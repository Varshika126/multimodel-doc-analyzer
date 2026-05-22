const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getAnalysis, getAllAnalyses, getAnalyticsOverview } = require('../controllers/analysisController');

router.use(protect);

router.get('/overview', getAnalyticsOverview);
router.get('/', getAllAnalyses);
router.get('/:documentId', getAnalysis);

module.exports = router;
