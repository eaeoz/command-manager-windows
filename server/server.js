require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const cookieParser = require('cookie-parser');
const path = require('path');
const { exec } = require('child_process');

const { apiLimiter } = require('./middleware/rateLimiter');
const { checkMaintenanceMode } = require('./middleware/maintenance');

const app = express();

// Trust proxy - Required when behind a reverse proxy (Zeabur, Heroku, nginx, etc.)
// This allows Express to read X-Forwarded-* headers for correct client IP detection
app.set('trust proxy', 1);

// Database connection with retry logic
const mongoUri = `${process.env.MONGODB_URI}${process.env.DATABASE_NAME}`;

let isMongoConnected = false;
let isReconnecting = false;

// MongoDB connection options for better stability
const mongooseOptions = {
  serverSelectionTimeoutMS: 30000, // Give more time for server selection
  socketTimeoutMS: 0, // Disable socket timeout (keep sockets alive)
  connectTimeoutMS: 30000, // 30 seconds to establish connection
  heartbeatFrequencyMS: 10000, // Check connection every 10 seconds
  maxPoolSize: 10, // Maintain up to 10 socket connections
  minPoolSize: 2, // Maintain at least 2 socket connections
  retryWrites: true,
  retryReads: true,
  family: 4, // Use IPv4, skip trying IPv6
};

async function connectToMongoDB(retryCount = 0) {
  const maxRetries = 5;
  const retryDelay = 5000; // 5 seconds

  // Prevent multiple simultaneous reconnection attempts
  if (isReconnecting && retryCount > 0) {
    return;
  }

  isReconnecting = true;

  try {
    await mongoose.connect(mongoUri, mongooseOptions);
    console.log('✅ MongoDB connected successfully');
    isMongoConnected = true;
    isReconnecting = false;
  } catch (err) {
    isMongoConnected = false;
    console.error('❌ MongoDB connection error:', err.message);
    
    if (retryCount < maxRetries) {
      console.log(`🔄 Retrying MongoDB connection in ${retryDelay/1000} seconds... (Attempt ${retryCount + 1}/${maxRetries})`);
      setTimeout(() => {
        isReconnecting = false;
        connectToMongoDB(retryCount + 1);
      }, retryDelay);
    } else {
      console.error('❌ MongoDB connection failed after maximum retries.');
      console.error('⚠️  Server will continue running but database operations will fail.');
      console.error('💡 Please check:');
      console.error('   1. MongoDB Atlas IP whitelist includes your current IP (or use 0.0.0.0/0 for testing)');
      console.error('   2. MongoDB URI is correct in environment variables');
      console.error('   3. MongoDB cluster is running and accessible');
      console.error('   4. Network/firewall is not blocking MongoDB Atlas connection');
      isReconnecting = false;
    }
  }
}

// Start initial connection attempt
connectToMongoDB();

// MongoDB connection event handlers
mongoose.connection.on('connected', () => {
  console.log('🔗 MongoDB connection established');
  isMongoConnected = true;
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected.');
  isMongoConnected = false;
  
  // Mongoose will automatically reconnect, so we don't need to manually trigger it
  // Only log that we're waiting for automatic reconnection
  console.log('⏳ Waiting for automatic reconnection...');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message);
  isMongoConnected = false;
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected successfully');
  isMongoConnected = true;
});

// Security middleware - Enhanced Configuration
app.use(helmet({
  // X-Frame-Options: DENY (prevent clickjacking)
  frameguard: { action: 'deny' },
  
  // X-Content-Type-Options: nosniff
  contentTypeNosniff: true,
  
  // Strict-Transport-Security (HTTPS only in production)
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true
  },
  
  // Content-Security-Policy (more permissive for admin panel)
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-hashes'", "https://www.google.com", "https://www.gstatic.com"],
      scriptSrcAttr: ["'unsafe-hashes'", "'unsafe-inline'"], // Allow inline event handlers
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://www.google.com", "https://www.gstatic.com"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'", "https://www.google.com"],
    },
  },
  
  // Permissions-Policy (formerly Feature-Policy)
  permissionsPolicy: {
    features: {
      geolocation: ["'none'"],
      microphone: ["'none'"],
      camera: ["'none'"],
      payment: ["'none'"],
      usb: ["'none'"],
    },
  },
  
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "same-site" },
  crossOriginOpenerPolicy: { policy: "same-origin" },
}));

// Explicitly set X-XSS-Protection header (helmet v7 removed xssFilter option)
// Setting to "1; mode=block" to enable XSS filtering
app.use((req, res, next) => {
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

app.use(mongoSanitize());

// CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : ['http://localhost:3000', 'http://localhost:5000'],
  credentials: true
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate limiting
app.use('/api', apiLimiter);

// Maintenance mode check (applies to all routes except admin)
app.use(checkMaintenanceMode);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/config', require('./routes/config'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/settings', require('./routes/settings'));

// Serve admin panel static files
app.use(express.static(path.join(__dirname, 'public')));

// Favicon route - Serve terminal/command prompt icon as SVG
app.get('/favicon.ico', (req, res) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <text y="75" font-size="65" font-family="monospace" font-weight="bold">>_</text>
    </svg>
  `;
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=31536000');
  res.send(svg);
});

// Email verification route - serves the user dashboard with token in URL
app.get('/verify-email', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Email change verification route - serves the user dashboard with token in URL
app.get('/verify-email-change', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// User dashboard route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Admin panel route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// API info route
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Command Manager API Server',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      config: '/api/config',
      admin: '/api/admin',
      userDashboard: '/',
      adminPanel: '/admin'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;

// Function to get public IP address
async function getPublicIP() {
  return new Promise((resolve, reject) => {
    exec('npx checkmyip', (error, stdout, stderr) => {
      if (error) {
        console.error('⚠️ Could not retrieve public IP:', error.message);
        resolve(null);
        return;
      }
      if (stderr) {
        console.error('⚠️ checkmyip stderr:', stderr);
      }
      // Parse the output to get just the IP address
      const output = stdout.trim();
      const ipMatch = output.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/);
      resolve(ipMatch ? ipMatch[0] : output);
    });
  });
}

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Admin panel: http://localhost:${PORT}/admin`);
  console.log(`🔐 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Get and display public IP for MongoDB whitelist
  console.log('\n🌐 Fetching public IP address...');
  const publicIP = await getPublicIP();
  if (publicIP) {
    console.log('┌─────────────────────────────────────────────────┐');
    console.log('│  📍 PUBLIC IP ADDRESS (for MongoDB whitelist)  │');
    console.log('├─────────────────────────────────────────────────┤');
    console.log(`│  ${publicIP.padEnd(45)} │`);
    console.log('└─────────────────────────────────────────────────┘');
    console.log('💡 Add this IP to your MongoDB Atlas Network Access\n');
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});
