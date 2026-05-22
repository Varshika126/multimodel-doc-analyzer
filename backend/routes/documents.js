const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  uploadDocuments,
  processDocument,
  getDocuments,
  getDocument,
  deleteDocument,
  toggleFavorite,
  shareDocument,
  getSharedDocument
} = require('../controllers/documentController');

// Public route for shared documents
router.get('/shared/:token', getSharedDocument);

// Protected routes
router.use(protect);

router.post('/upload', upload.array('documents', 5), uploadDocuments);
router.post('/:id/process', processDocument);
router.get('/', getDocuments);
router.get('/:id', getDocument);
router.delete('/:id', deleteDocument);
router.patch('/:id/favorite', toggleFavorite);
router.post('/:id/share', shareDocument);

module.exports = router;
