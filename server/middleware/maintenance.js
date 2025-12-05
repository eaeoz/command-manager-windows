const Settings = require('../models/Settings');

// Middleware to check if site is in maintenance mode
const checkMaintenanceMode = async (req, res, next) => {
  try {
    // Skip maintenance check for admin routes and settings API
    if (req.path.startsWith('/api/admin') || 
        req.path.startsWith('/api/settings') ||
        req.path === '/admin' ||
        req.path === '/api/auth/login') {
      return next();
    }
    
    const settings = await Settings.getSettings();
    
    if (settings.maintenanceMode) {
      return res.status(503).json({
        success: false,
        message: 'Site is currently under maintenance. Please try again later.',
        maintenanceMode: true
      });
    }
    
    next();
  } catch (error) {
    // If there's an error checking maintenance mode, allow the request to proceed
    console.error('Maintenance check error:', error);
    next();
  }
};

module.exports = { checkMaintenanceMode };
