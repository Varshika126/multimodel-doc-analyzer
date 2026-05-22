const User = require('../models/User');
const Document = require('../models/Document');
const Analysis = require('../models/Analysis');
const path = require('path');
const fs = require('fs');

// @desc    Get user profile
// @route   GET /api/users/profile
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('favorites', 'originalName fileType createdAt');
    const docCount = await Document.countDocuments({ user: req.user.id });
    const analysisCount = await Analysis.countDocuments({ user: req.user.id });

    res.json({
      success: true,
      user,
      stats: { documents: docCount, analyses: analysisCount }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, avatar } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (avatar !== undefined) updateData.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
      runValidators: true
    });

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update password
// @route   PUT /api/users/password
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Update settings
// @route   PUT /api/users/settings
exports.updateSettings = async (req, res, next) => {
  try {
    const { theme, notifications, language } = req.body;
    const settings = {};
    if (theme) settings['settings.theme'] = theme;
    if (notifications !== undefined) settings['settings.notifications'] = notifications;
    if (language) settings['settings.language'] = language;

    const user = await User.findByIdAndUpdate(req.user.id, { $set: settings }, { new: true });
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user stats
// @route   GET /api/users/stats
exports.getUserStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [docCount, analysisCount, docs] = await Promise.all([
      Document.countDocuments({ user: userId }),
      Analysis.countDocuments({ user: userId }),
      Document.find({ user: userId }).select('fileType fileSize createdAt status')
    ]);

    const byType = docs.reduce((acc, doc) => {
      acc[doc.fileType] = (acc[doc.fileType] || 0) + 1;
      return acc;
    }, {});

    const totalSize = docs.reduce((sum, doc) => sum + (doc.fileSize || 0), 0);

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      const count = docs.filter(d => d.createdAt >= dayStart && d.createdAt <= dayEnd).length;
      last7Days.push({ date: dayStart.toISOString().split('T')[0], count });
    }

    res.json({
      success: true,
      stats: {
        totalDocuments: docCount,
        totalAnalyses: analysisCount,
        byType,
        totalSize,
        last7Days
      }
    });
  } catch (error) {
    next(error);
  }
};
