const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getProfile, updateProfile, updatePassword, updateSettings, getUserStats } = require('../controllers/userController');

router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/password', updatePassword);
router.put('/settings', updateSettings);
router.get('/stats', getUserStats);

module.exports = router;
