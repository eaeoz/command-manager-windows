const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Configuration = require('../models/Configuration');
const { protect, authorize } = require('../middleware/auth');

// Apply auth middleware to all admin routes
router.use(protect);
router.use(authorize('admin'));

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Admin only
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// @route   GET /api/admin/users/:id
// @desc    Get single user with configurations
// @access  Admin only
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const config = await Configuration.findOne({ userId: user._id });

    res.status(200).json({
      success: true,
      data: {
        user,
        configuration: config || { profiles: [], commands: [] }
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user
// @access  Admin only
router.put('/users/:id', async (req, res) => {
  try {
    const { username, email, role, isActive, isEmailVerified, password } = req.body;
    
    const user = await User.findById(req.params.id).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    if (username) user.username = username;
    if (email) user.email = email;
    if (role) user.role = role;
    if (typeof isActive !== 'undefined') user.isActive = isActive;
    if (typeof isEmailVerified !== 'undefined') user.isEmailVerified = isEmailVerified;
    
    // Update password if provided
    if (password && password.trim() !== '') {
      user.password = password;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user and their configurations
// @access  Admin only
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't allow deleting yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Delete user's configuration
    await Configuration.deleteOne({ userId: user._id });
    
    // Delete user
    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
});

// @route   GET /api/admin/configurations
// @desc    Get all configurations
// @access  Admin only
router.get('/configurations', async (req, res) => {
  try {
    const configurations = await Configuration.find()
      .populate('userId', 'username email');

    res.status(200).json({
      success: true,
      count: configurations.length,
      data: configurations
    });
  } catch (error) {
    console.error('Get configurations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching configurations',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/configurations/:id
// @desc    Update user's configuration by configuration ID
// @access  Admin only
router.put('/configurations/:id', async (req, res) => {
  try {
    const { profiles, commands } = req.body;
    
    let config = await Configuration.findById(req.params.id);
    
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found'
      });
    }

    if (profiles !== undefined) config.profiles = profiles;
    if (commands !== undefined) config.commands = commands;
    config.lastSyncedAt = new Date();
    
    await config.save();

    res.status(200).json({
      success: true,
      message: 'Configuration updated successfully',
      data: config
    });
  } catch (error) {
    console.error('Update configuration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating configuration',
      error: error.message
    });
  }
});

// @route   GET /api/admin/stats
// @desc    Get system statistics
// @access  Admin only
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const totalConfigs = await Configuration.countDocuments();

    const allConfigs = await Configuration.find();
    const totalProfiles = allConfigs.reduce((sum, config) => sum + config.profiles.length, 0);
    const totalCommands = allConfigs.reduce((sum, config) => sum + config.commands.length, 0);

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          admins: adminUsers
        },
        configurations: {
          total: totalConfigs,
          totalProfiles,
          totalCommands
        }
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

module.exports = router;
