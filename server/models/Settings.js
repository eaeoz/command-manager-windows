const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // Site Information
  siteName: {
    type: String,
    default: 'Command Manager'
  },
  siteDescription: {
    type: String,
    default: 'Manage your SSH commands and profiles from anywhere'
  },
  siteUrl: {
    type: String,
    default: 'http://localhost:5000'
  },
  
  // SEO
  seoTitle: {
    type: String,
    default: 'Command Manager - SSH Command Management'
  },
  seoDescription: {
    type: String,
    default: 'Manage your SSH commands and profiles efficiently with Command Manager'
  },
  seoKeywords: {
    type: String,
    default: 'ssh, command manager, terminal, devops, server management'
  },
  
  // Social Links
  facebookUrl: {
    type: String,
    default: ''
  },
  twitterUrl: {
    type: String,
    default: ''
  },
  linkedinUrl: {
    type: String,
    default: ''
  },
  githubUrl: {
    type: String,
    default: ''
  },
  
  // Contact Information
  contactEmail: {
    type: String,
    default: 'contact@commandmanager.com'
  },
  supportEmail: {
    type: String,
    default: 'support@commandmanager.com'
  },
  
  // Additional Settings
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  allowRegistration: {
    type: Boolean,
    default: true
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
