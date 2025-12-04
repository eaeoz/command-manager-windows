const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  host: {
    type: String,
    required: true
  },
  port: {
    type: Number,
    default: 22
  }
}, { _id: false });

const commandSchema = new mongoose.Schema({
  lineNumber: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  command: {
    type: String,
    required: true
  },
  url: {
    type: String,
    default: ''
  },
  profile: {
    type: String,
    required: true
  }
}, { _id: false });

const configurationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  profiles: [profileSchema],
  commands: [commandSchema],
  lastSyncedAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index is defined in schema field with unique: true

// Update timestamp
configurationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to get profile count
configurationSchema.methods.getProfileCount = function() {
  return this.profiles.length;
};

// Method to get command count
configurationSchema.methods.getCommandCount = function() {
  return this.commands.length;
};

// Method to sync data
configurationSchema.methods.syncData = function(profiles, commands) {
  this.profiles = profiles;
  this.commands = commands;
  this.lastSyncedAt = Date.now();
  return this.save();
};

module.exports = mongoose.model('Configuration', configurationSchema);
