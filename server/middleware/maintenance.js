const Settings = require('../models/Settings');
const path = require('path');

// Middleware to check if site is in maintenance mode
const checkMaintenanceMode = async (req, res, next) => {
  try {
    // Skip maintenance check for:
    // - Admin routes and panel
    // - Settings API (needed to check maintenance status)
    // - Maintenance page itself
    // - Static assets (CSS, JS, images)
    if (req.path.startsWith('/api/admin') || 
        req.path.startsWith('/api/settings') ||
        req.path === '/admin' ||
        req.path === '/admin.html' ||
        req.path === '/maintenance.html' ||
        req.path.endsWith('.css') ||
        req.path.endsWith('.js') ||
        req.path.endsWith('.ico') ||
        req.path.endsWith('.png') ||
        req.path.endsWith('.jpg') ||
        req.path === '/api/auth/login') {
      return next();
    }
    
    const settings = await Settings.getSettings();
    
    if (settings.maintenanceMode) {
      // Serve the maintenance HTML page
      return res.sendFile(path.join(__dirname, '../public/maintenance.html'));
    }
    
    next();
  } catch (error) {
    // If there's an error checking maintenance mode, allow the request to proceed
    console.error('Maintenance check error:', error);
    next();
  }
};

module.exports = { checkMaintenanceMode };
