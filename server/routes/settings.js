const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/settings
// @desc    Get site settings
// @access  Public
router.get('/', async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching settings',
      error: error.message
    });
  }
});

// @route   PUT /api/settings
// @desc    Update site settings
// @access  Admin only
router.put('/', protect, authorize('admin'), async (req, res) => {
  try {
    const {
      siteName,
      siteDescription,
      siteUrl,
      seoTitle,
      seoDescription,
      seoKeywords,
      facebookUrl,
      twitterUrl,
      linkedinUrl,
      githubUrl,
      contactEmail,
      supportEmail,
      maintenanceMode,
      allowRegistration
    } = req.body;
    
    let settings = await Settings.getSettings();
    
    // Update fields
    if (siteName !== undefined) settings.siteName = siteName;
    if (siteDescription !== undefined) settings.siteDescription = siteDescription;
    if (siteUrl !== undefined) settings.siteUrl = siteUrl;
    if (seoTitle !== undefined) settings.seoTitle = seoTitle;
    if (seoDescription !== undefined) settings.seoDescription = seoDescription;
    if (seoKeywords !== undefined) settings.seoKeywords = seoKeywords;
    if (facebookUrl !== undefined) settings.facebookUrl = facebookUrl;
    if (twitterUrl !== undefined) settings.twitterUrl = twitterUrl;
    if (linkedinUrl !== undefined) settings.linkedinUrl = linkedinUrl;
    if (githubUrl !== undefined) settings.githubUrl = githubUrl;
    if (contactEmail !== undefined) settings.contactEmail = contactEmail;
    if (supportEmail !== undefined) settings.supportEmail = supportEmail;
    if (maintenanceMode !== undefined) settings.maintenanceMode = maintenanceMode;
    if (allowRegistration !== undefined) settings.allowRegistration = allowRegistration;
    
    settings.updatedBy = req.user._id;
    
    await settings.save();
    
    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating settings',
      error: error.message
    });
  }
});

module.exports = router;
