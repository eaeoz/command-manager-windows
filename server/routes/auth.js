const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const Configuration = require('../models/Configuration');
const Settings = require('../models/Settings');
const { sendTokenResponse, auth } = require('../middleware/auth');
const { authLimiter, registerLimiter } = require('../middleware/rateLimiter');
const { verifyRecaptcha } = require('../middleware/recaptcha');
require('dotenv').config();

// Email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Send verification email
async function sendVerificationEmail(user, token) {
  const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:5000'}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: `"Command Manager" <${process.env.SMTP_USER}>`,
    to: user.email,
    subject: '>_ Verify Your Email - Command Manager',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-family: monospace;">>_ Command Manager</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Email Verification</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px;">
          <h2 style="color: #333; margin-top: 0;">Welcome, ${user.username}!</h2>
          <p style="color: #666; line-height: 1.6;">
            Thank you for registering with Command Manager. To complete your registration and start managing your SSH commands, please verify your email address.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
              ✅ Verify Email Address
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            Or copy and paste this link into your browser:
          </p>
          <p style="color: #667eea; font-size: 12px; word-break: break-all; background: white; padding: 10px; border-radius: 4px;">
            ${verificationUrl}
          </p>
          
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            ⏰ This link will expire in 24 hours.
          </p>
          <p style="color: #999; font-size: 12px;">
            🔒 If you didn't create an account, please ignore this email.
          </p>
        </div>
        
        <div style="background: #e9ecef; padding: 20px; text-align: center; font-size: 12px; color: #6c757d;">
          <p style="margin: 0; font-family: monospace;">>_ Command Manager - SSH Command Management</p>
          <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} All rights reserved</p>
        </div>
      </div>
    `
  };
  
  await transporter.sendMail(mailOptions);
}

// Send password reset email
async function sendPasswordResetEmail(user, code) {
  const mailOptions = {
    from: `"Command Manager" <${process.env.SMTP_USER}>`,
    to: user.email,
    subject: '>_ Password Reset Code - Command Manager',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-family: monospace;">>_ Command Manager</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Password Reset Request</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px;">
          <h2 style="color: #333; margin-top: 0;">Hello, ${user.username}!</h2>
          <p style="color: #666; line-height: 1.6;">
            You requested to reset your password. Use the 4-digit code below to complete the password reset process:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="background: white; display: inline-block; padding: 20px 40px; border-radius: 12px; border: 2px solid #667eea;">
              <span style="font-size: 48px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: monospace;">${code}</span>
            </div>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            Enter this code on the password reset page to set your new password.
          </p>
          
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            ⏰ This code will expire in 15 minutes.
          </p>
          <p style="color: #999; font-size: 12px;">
            ⚠️ You have 3 attempts to enter the correct code.
          </p>
          <p style="color: #999; font-size: 12px;">
            🔒 If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
          </p>
        </div>
        
        <div style="background: #e9ecef; padding: 20px; text-align: center; font-size: 12px; color: #6c757d;">
          <p style="margin: 0; font-family: monospace;">>_ Command Manager - SSH Command Management</p>
          <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} All rights reserved</p>
        </div>
      </div>
    `
  };
  
  await transporter.sendMail(mailOptions);
}

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', 
  registerLimiter,
  verifyRecaptcha,
  [
    body('username')
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      // Check if registration is allowed
      const settings = await Settings.getSettings();
      if (!settings.allowRegistration) {
        return res.status(403).json({
          success: false,
          message: 'New user registrations are currently disabled. Please contact the administrator.'
        });
      }

      const { username, email, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { username }]
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email or username already exists'
        });
      }

      // Create user (not verified yet)
      const user = await User.create({
        username,
        email,
        password,
        role: 'user',
        isEmailVerified: false
      });

      // Generate verification token
      const verificationToken = user.generateEmailVerificationToken();
      await user.save();

      // Create empty configuration for user
      await Configuration.create({
        userId: user._id,
        profiles: [],
        commands: []
      });

      // Send verification email
      try {
        await sendVerificationEmail(user, verificationToken);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Continue with registration even if email fails
      }

      // Return success with message about email verification
      res.status(201).json({
        success: true,
        message: 'Registration successful! Please check your email to verify your account.',
        requiresVerification: true,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating user',
        error: error.message
      });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login',
  authLimiter,
  verifyRecaptcha,
  [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { email, password } = req.body;

      // Find user with password field
      const user = await User.findOne({ email }).select('+password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check if account is locked
      if (user.isLocked) {
        return res.status(423).json({
          success: false,
          message: 'Account is locked due to too many failed login attempts. Please try again later.'
        });
      }

      // Check if account is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated'
        });
      }

      // Validate password
      const isMatch = await user.comparePassword(password);

      if (!isMatch) {
        await user.incLoginAttempts();
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check if email is verified
      if (!user.isEmailVerified) {
        return res.status(403).json({
          success: false,
          message: 'Please verify your email address before logging in. Check your inbox for the verification link.',
          requiresVerification: true,
          email: user.email
        });
      }

      // Reset login attempts on successful login
      await user.resetLoginAttempts();

      sendTokenResponse(user, 200, res);
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Error logging in',
        error: error.message
      });
    }
  }
);

// @route   POST /api/auth/logout
// @desc    Logout user (web dashboard)
// @access  Private
router.post('/logout', (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

// @route   POST /api/auth/device-logout
// @desc    Logout device (Electron app) - marks device as offline
// @access  Private
router.post('/device-logout', auth, async (req, res) => {
  try {
    const { deviceId } = req.body;
    
    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: 'Device ID is required'
      });
    }
    
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const device = user.devices.find(d => d.deviceId === deviceId);
    
    if (device) {
      device.online = false;
      device.lastSeen = Date.now();
      await user.save();
    }
    
    res.json({
      success: true,
      message: 'Device logged out successfully'
    });
  } catch (error) {
    console.error('Device logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging out device'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Send email change verification email
async function sendEmailChangeVerification(user, newEmail, token) {
  const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:5000'}/verify-email-change?token=${token}`;
  
  const mailOptions = {
    from: `"Command Manager" <${process.env.SMTP_USER}>`,
    to: newEmail,
    subject: '>_ Verify Your New Email - Command Manager',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-family: monospace;">>_ Command Manager</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Email Change Verification</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px;">
          <h2 style="color: #333; margin-top: 0;">Hello, ${user.username}!</h2>
          <p style="color: #666; line-height: 1.6;">
            You requested to change your email address from <strong>${user.email}</strong> to <strong>${newEmail}</strong>.
          </p>
          <p style="color: #666; line-height: 1.6;">
            To confirm this change, please verify your new email address by clicking the button below:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
              ✅ Verify New Email Address
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            Or copy and paste this link into your browser:
          </p>
          <p style="color: #667eea; font-size: 12px; word-break: break-all; background: white; padding: 10px; border-radius: 4px;">
            ${verificationUrl}
          </p>
          
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            ⏰ This link will expire in 24 hours.
          </p>
          <p style="color: #999; font-size: 12px;">
            🔒 If you didn't request this change, please ignore this email. Your current email address will remain unchanged.
          </p>
        </div>
        
        <div style="background: #e9ecef; padding: 20px; text-align: center; font-size: 12px; color: #6c757d;">
          <p style="margin: 0; font-family: monospace;">>_ Command Manager - SSH Command Management</p>
          <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} All rights reserved</p>
        </div>
      </div>
    `
  };
  
  await transporter.sendMail(mailOptions);
}

// @route   PUT /api/auth/update-profile
// @desc    Update user profile
// @access  Private
router.put('/update-profile', 
  auth,
  [
    body('username').optional().trim().isLength({ min: 3, max: 30 }),
    body('email').optional().isEmail().normalizeEmail()
  ],
  async (req, res) => {
    try {
      const { username, email } = req.body;
      const user = await User.findById(req.userId).select('+pendingEmail +pendingEmailToken +pendingEmailExpires');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      let updateMessage = '';
      
      // Update username if provided and different
      if (username && username !== user.username) {
        const existing = await User.findOne({ username });
        if (existing) {
          return res.status(400).json({
            success: false,
            message: 'Username already taken'
          });
        }
        user.username = username;
        updateMessage = 'Username updated successfully';
      }
      
      // Handle email change - requires verification
      if (email && email !== user.email) {
        const existing = await User.findOne({ email });
        if (existing) {
          return res.status(400).json({
            success: false,
            message: 'Email already taken'
          });
        }
        
        // Generate verification token for new email
        const verificationToken = user.generateEmailChangeToken(email);
        await user.save();
        
        // Send verification email to NEW email address
        try {
          await sendEmailChangeVerification(user, email, verificationToken);
          
          return res.json({
            success: true,
            user,
            message: 'Verification email sent to your new email address. Please check your inbox and verify to complete the email change.',
            emailVerificationRequired: true,
            pendingEmail: email
          });
        } catch (emailError) {
          console.error('Failed to send email change verification:', emailError);
          return res.status(500).json({
            success: false,
            message: 'Failed to send verification email. Please try again.'
          });
        }
      }
      
      // Save if only username was updated
      if (username && username !== user.username) {
        await user.save();
      }
      
      res.json({
        success: true,
        user,
        message: updateMessage || 'Profile updated successfully'
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating profile'
      });
    }
  }
);

// @route   PUT /api/auth/change-password
// @desc    Change password
// @access  Private
router.put('/change-password',
  auth,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 })
  ],
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.userId).select('+password');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Verify current password
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
      
      user.password = newPassword;
      await user.save();
      
      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error changing password'
      });
    }
  }
);

// @route   DELETE /api/auth/delete-account
// @desc    Delete user account
// @access  Private
router.delete('/delete-account', auth, async (req, res) => {
  try {
    // Delete user's configuration
    await Configuration.findOneAndDelete({ userId: req.userId });
    
    // Delete user
    await User.findByIdAndDelete(req.userId);
    
    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting account'
    });
  }
});

// @route   POST /api/auth/register-device
// @desc    Register a device (Electron app)
// @access  Private
router.post('/register-device', auth, async (req, res) => {
  try {
    const { deviceId, deviceName } = req.body;
    
    if (!deviceId || !deviceName) {
      return res.status(400).json({
        success: false,
        message: 'Device ID and name are required'
      });
    }
    
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if device already exists
    const deviceIndex = user.devices.findIndex(d => d.deviceId === deviceId);
    
    if (deviceIndex > -1) {
      // Update existing device
      user.devices[deviceIndex].lastSeen = Date.now();
      user.devices[deviceIndex].online = true;
      user.devices[deviceIndex].deviceName = deviceName;
    } else {
      // Add new device
      user.devices.push({
        deviceId,
        deviceName,
        lastSeen: Date.now(),
        online: true
      });
    }
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Device registered successfully',
      devices: user.devices
    });
  } catch (error) {
    console.error('Register device error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering device'
    });
  }
});

// @route   GET /api/auth/devices
// @desc    Get all registered devices
// @access  Private
router.get('/devices', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get user's configuration to count profiles and commands
    const config = await Configuration.findOne({ userId: req.userId });
    const profileCount = config ? config.profiles.length : 0;
    const commandCount = config ? config.commands.length : 0;
    
    // Check if device was manually logged out OR hasn't been seen in 5 minutes
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    const devicesWithStats = user.devices.map(device => {
      // If device.online is explicitly false (logged out), keep it offline
      // Otherwise, check if it's been seen recently
      const isOnline = device.online === false ? false : device.lastSeen >= fiveMinutesAgo;
      
      return {
        ...device.toObject(),
        online: isOnline,
        profileCount,
        commandCount
      };
    });
    
    res.json({
      success: true,
      devices: devicesWithStats
    });
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching devices'
    });
  }
});

// @route   POST /api/auth/heartbeat
// @desc    Update device heartbeat (keep alive)
// @access  Private
router.post('/heartbeat', auth, async (req, res) => {
  try {
    const { deviceId } = req.body;
    
    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: 'Device ID is required'
      });
    }
    
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const device = user.devices.find(d => d.deviceId === deviceId);
    
    if (device) {
      // Only update if device is not explicitly offline (logged out)
      // If device.online is false, it means user manually logged out
      // Don't override that with heartbeat
      if (device.online !== false) {
        device.online = true;
      }
      device.lastSeen = Date.now();
      await user.save();
    }
    
    res.json({
      success: true,
      message: 'Heartbeat updated'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating heartbeat'
    });
  }
});

// @route   DELETE /api/auth/device/:deviceId
// @desc    Remove a device
// @access  Private
router.delete('/device/:deviceId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    user.devices = user.devices.filter(d => d.deviceId !== req.params.deviceId);
    await user.save();
    
    res.json({
      success: true,
      message: 'Device removed successfully',
      devices: user.devices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing device'
    });
  }
});

// @route   GET /api/auth/verify-email
// @desc    Verify email address
// @access  Public
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }
    
    // Hash the token to match stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    // Find user with matching token that hasn't expired
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    }).select('+emailVerificationToken +emailVerificationExpires');
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }
    
    // Verify the email
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();
    
    res.json({
      success: true,
      message: 'Email verified successfully! You can now log in.'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying email'
    });
  }
});

// @route   POST /api/auth/resend-verification
// @desc    Resend verification email
// @access  Public
router.post('/resend-verification',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email')
  ],
  async (req, res) => {
    try {
      const { email } = req.body;
      
      const user = await User.findOne({ email }).select('+emailVerificationToken +emailVerificationExpires');
      
      if (!user) {
        // Don't reveal if email exists
        return res.json({
          success: true,
          message: 'If the email exists and is not verified, a verification email has been sent.'
        });
      }
      
      if (user.isEmailVerified) {
        return res.status(400).json({
          success: false,
          message: 'Email is already verified'
        });
      }
      
      // Generate new verification token
      const verificationToken = user.generateEmailVerificationToken();
      await user.save();
      
      // Send verification email
      try {
        await sendVerificationEmail(user, verificationToken);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        return res.status(500).json({
          success: false,
          message: 'Failed to send verification email'
        });
      }
      
      res.json({
        success: true,
        message: 'Verification email sent successfully'
      });
    } catch (error) {
      console.error('Resend verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Error resending verification email'
      });
    }
  }
);

// @route   GET /api/auth/verify-email-change
// @desc    Verify new email address
// @access  Public
router.get('/verify-email-change', async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }
    
    // Hash the token to match stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    // Find user with matching token that hasn't expired
    const user = await User.findOne({
      pendingEmailToken: hashedToken,
      pendingEmailExpires: { $gt: Date.now() }
    }).select('+pendingEmail +pendingEmailToken +pendingEmailExpires');
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }
    
    // Update email address
    const oldEmail = user.email;
    user.email = user.pendingEmail;
    user.pendingEmail = undefined;
    user.pendingEmailToken = undefined;
    user.pendingEmailExpires = undefined;
    await user.save();
    
    res.json({
      success: true,
      message: `Email successfully changed from ${oldEmail} to ${user.email}. Please log in with your new email address.`
    });
  } catch (error) {
    console.error('Email change verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying email change'
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Request password reset code
// @access  Public
router.post('/forgot-password',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email')
  ],
  async (req, res) => {
    try {
      const { email } = req.body;
      
      const user = await User.findOne({ email }).select('+passwordResetCode +passwordResetExpires +passwordResetAttempts');
      
      if (!user) {
        // Don't reveal if email exists
        return res.json({
          success: true,
          message: 'If the email exists, a password reset code has been sent.'
        });
      }
      
      // Generate 4-digit code
      const resetCode = Math.floor(1000 + Math.random() * 9000).toString();
      
      // Hash the code before storing
      const hashedCode = crypto
        .createHash('sha256')
        .update(resetCode)
        .digest('hex');
      
      // Store hashed code with 15 minute expiration and reset attempts
      user.passwordResetCode = hashedCode;
      user.passwordResetExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
      user.passwordResetAttempts = 0; // Reset attempts
      await user.save();
      
      // Send email with code
      try {
        await sendPasswordResetEmail(user, resetCode);
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
        return res.status(500).json({
          success: false,
          message: 'Failed to send password reset email'
        });
      }
      
      res.json({
        success: true,
        message: 'Password reset code sent to your email'
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        message: 'Error processing password reset request'
      });
    }
  }
);

// @route   POST /api/auth/verify-reset-code
// @desc    Verify password reset code
// @access  Public
router.post('/verify-reset-code',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('code').isLength({ min: 4, max: 4 }).withMessage('Code must be 4 digits')
  ],
  async (req, res) => {
    try {
      const { email, code } = req.body;
      
      const user = await User.findOne({ email }).select('+passwordResetCode +passwordResetExpires +passwordResetAttempts');
      
      if (!user || !user.passwordResetCode || !user.passwordResetExpires) {
        return res.status(400).json({
          success: false,
          message: 'No password reset request found'
        });
      }
      
      // Check if code has expired
      if (user.passwordResetExpires < Date.now()) {
        user.passwordResetCode = undefined;
        user.passwordResetExpires = undefined;
        user.passwordResetAttempts = undefined;
        await user.save();
        
        return res.status(400).json({
          success: false,
          message: 'Reset code has expired. Please request a new one.'
        });
      }
      
      // Check if attempts exceeded
      if (user.passwordResetAttempts >= 3) {
        user.passwordResetCode = undefined;
        user.passwordResetExpires = undefined;
        user.passwordResetAttempts = undefined;
        await user.save();
        
        return res.status(400).json({
          success: false,
          message: 'Maximum attempts exceeded. Please request a new reset code.'
        });
      }
      
      // Hash submitted code and compare
      const hashedCode = crypto
        .createHash('sha256')
        .update(code)
        .digest('hex');
      
      if (hashedCode !== user.passwordResetCode) {
        // Increment attempts
        user.passwordResetAttempts += 1;
        await user.save();
        
        const attemptsLeft = 3 - user.passwordResetAttempts;
        return res.status(400).json({
          success: false,
          message: `Invalid code. ${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} remaining.`,
          attemptsLeft
        });
      }
      
      // Code is valid
      res.json({
        success: true,
        message: 'Code verified successfully'
      });
    } catch (error) {
      console.error('Verify reset code error:', error);
      res.status(500).json({
        success: false,
        message: 'Error verifying reset code'
      });
    }
  }
);

// @route   POST /api/auth/reset-password
// @desc    Reset password with verified code
// @access  Public
router.post('/reset-password',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('code').isLength({ min: 4, max: 4 }),
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  async (req, res) => {
    try {
      const { email, code, newPassword } = req.body;
      
      const user = await User.findOne({ email }).select('+password +passwordResetCode +passwordResetExpires +passwordResetAttempts');
      
      if (!user || !user.passwordResetCode || !user.passwordResetExpires) {
        return res.status(400).json({
          success: false,
          message: 'No password reset request found'
        });
      }
      
      // Check if code has expired
      if (user.passwordResetExpires < Date.now()) {
        user.passwordResetCode = undefined;
        user.passwordResetExpires = undefined;
        user.passwordResetAttempts = undefined;
        await user.save();
        
        return res.status(400).json({
          success: false,
          message: 'Reset code has expired'
        });
      }
      
      // Check if attempts exceeded
      if (user.passwordResetAttempts >= 3) {
        user.passwordResetCode = undefined;
        user.passwordResetExpires = undefined;
        user.passwordResetAttempts = undefined;
        await user.save();
        
        return res.status(400).json({
          success: false,
          message: 'Maximum attempts exceeded'
        });
      }
      
      // Verify code
      const hashedCode = crypto
        .createHash('sha256')
        .update(code)
        .digest('hex');
      
      if (hashedCode !== user.passwordResetCode) {
        user.passwordResetAttempts += 1;
        await user.save();
        
        return res.status(400).json({
          success: false,
          message: 'Invalid code'
        });
      }
      
      // Reset password
      user.password = newPassword;
      user.passwordResetCode = undefined;
      user.passwordResetExpires = undefined;
      user.passwordResetAttempts = undefined;
      await user.save();
      
      res.json({
        success: true,
        message: 'Password reset successfully. You can now log in with your new password.'
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        message: 'Error resetting password'
      });
    }
  }
);

module.exports = router;
