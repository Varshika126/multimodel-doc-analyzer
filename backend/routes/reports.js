const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { generatePDFReport, generateTXTReport } = require('../controllers/reportController');

router.use(protect);

router.post('/pdf/:documentId', generatePDFReport);
router.post('/txt/:documentId', generateTXTReport);

module.exports = router;
