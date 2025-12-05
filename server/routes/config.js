const express = require('express');
const router = express.Router();
const Configuration = require('../models/Configuration');
const { protect } = require('../middleware/auth');

// @route   GET /api/config
// @desc    Get user's configuration (profiles and commands)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let config = await Configuration.findOne({ userId: req.user._id });

    if (!config) {
      // Create empty config if doesn't exist
      config = await Configuration.create({
        userId: req.user._id,
        profiles: [],
        commands: []
      });
    }

    res.status(200).json({
      success: true,
      data: {
        profiles: config.profiles,
        commands: config.commands,
        profileCount: config.getProfileCount(),
        commandCount: config.getCommandCount(),
        lastSyncedAt: config.lastSyncedAt
      }
    });
  } catch (error) {
    console.error('Get config error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching configuration',
      error: error.message
    });
  }
});

// @route   GET /api/config/stats
// @desc    Get configuration statistics
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const config = await Configuration.findOne({ userId: req.user._id });

    if (!config) {
      return res.status(200).json({
        success: true,
        data: {
          remote: { profiles: 0, commands: 0 },
          lastSynced: null
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        remote: {
          profiles: config.getProfileCount(),
          commands: config.getCommandCount()
        },
        lastSynced: config.lastSyncedAt
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

// @route   POST /api/config/sync
// @desc    Sync profiles and commands to remote
// @access  Private
router.post('/sync', protect, async (req, res) => {
  try {
    const { profiles, commands } = req.body;

    if (!profiles || !commands) {
      return res.status(400).json({
        success: false,
        message: 'Profiles and commands are required'
      });
    }

    let config = await Configuration.findOne({ userId: req.user._id });

    if (!config) {
      config = new Configuration({
        userId: req.user._id,
        profiles: [],
        commands: []
      });
    }

    await config.syncData(profiles, commands);

    res.status(200).json({
      success: true,
      message: 'Configuration synced successfully',
      data: {
        profileCount: config.getProfileCount(),
        commandCount: config.getCommandCount(),
        lastSyncedAt: config.lastSyncedAt
      }
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({
      success: false,
      message: 'Error syncing configuration',
      error: error.message
    });
  }
});

// @route   PUT /api/config/profiles
// @desc    Update profiles
// @access  Private
router.put('/profiles', protect, async (req, res) => {
  try {
    const { profiles } = req.body;

    const config = await Configuration.findOne({ userId: req.user._id });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found'
      });
    }

    config.profiles = profiles;
    await config.save();

    res.status(200).json({
      success: true,
      message: 'Profiles updated successfully',
      data: config.profiles
    });
  } catch (error) {
    console.error('Update profiles error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profiles',
      error: error.message
    });
  }
});

// @route   PUT /api/config/commands
// @desc    Update commands
// @access  Private
router.put('/commands', protect, async (req, res) => {
  try {
    const { commands } = req.body;

    const config = await Configuration.findOne({ userId: req.user._id });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found'
      });
    }

    config.commands = commands;
    await config.save();

    res.status(200).json({
      success: true,
      message: 'Commands updated successfully',
      data: config.commands
    });
  } catch (error) {
    console.error('Update commands error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating commands',
      error: error.message
    });
  }
});

// @route   POST /api/config/push-to-devices
// @desc    Push cloud configuration to selected local devices
// @access  Private
router.post('/push-to-devices', protect, async (req, res) => {
  try {
    const { deviceIds } = req.body;

    if (!deviceIds || !Array.isArray(deviceIds) || deviceIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Device IDs array is required'
      });
    }

    // Get cloud configuration
    const config = await Configuration.findOne({ userId: req.user._id });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found'
      });
    }

    // In a real implementation, you would:
    // 1. Use WebSockets or Server-Sent Events to push to devices
    // 2. Or store push requests in database for devices to poll
    // For now, we'll store a "pending push" that devices can check
    
    const User = require('../models/User');
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Mark selected devices as having pending updates
    deviceIds.forEach(deviceId => {
      const device = user.devices.find(d => d.deviceId === deviceId);
      if (device) {
        device.pendingPush = true;
        device.pushData = {
          profiles: config.profiles,
          commands: config.commands,
          timestamp: Date.now()
        };
      }
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: `Configuration queued for push to ${deviceIds.length} device(s)`,
      data: {
        profileCount: config.getProfileCount(),
        commandCount: config.getCommandCount(),
        deviceCount: deviceIds.length
      }
    });
  } catch (error) {
    console.error('Push to devices error:', error);
    res.status(500).json({
      success: false,
      message: 'Error pushing to devices',
      error: error.message
    });
  }
});

// @route   POST /api/config/clear-pending-push
// @desc    Clear pending push flag after device receives configuration
// @access  Private
router.post('/clear-pending-push', protect, async (req, res) => {
  try {
    const { deviceId } = req.body;

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: 'Device ID is required'
      });
    }

    const User = require('../models/User');
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find and clear the pending push for this device
    const device = user.devices.find(d => d.deviceId === deviceId);
    if (device) {
      device.pendingPush = false;
      device.pushData = null;
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Pending push cleared'
    });
  } catch (error) {
    console.error('Clear pending push error:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing pending push',
      error: error.message
    });
  }
});

module.exports = router;
