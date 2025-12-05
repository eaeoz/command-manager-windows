const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const axios = require('axios');
const { contactLimiter } = require('../middleware/rateLimiter');
require('dotenv').config();

// Create email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Verify reCAPTCHA v3
async function verifyRecaptcha(token, minScore = 0.5) {
  try {
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`
    );
    
    const data = response.data;
    
    // Check if verification was successful and score meets threshold
    return data.success && data.score >= minScore;
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return false;
  }
}

// @route   POST /api/contact
// @desc    Send contact form email with reCAPTCHA v3
// @access  Public
router.post('/', contactLimiter, async (req, res) => {
  try {
    const { name, email, subject, message, recaptchaToken } = req.body;
    
    // Validate input
    if (!name || !email || !subject || !message || !recaptchaToken) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }
    
    // Verify reCAPTCHA v3 (minimum score 0.5)
    const isValidRecaptcha = await verifyRecaptcha(recaptchaToken, 0.5);
    
    if (!isValidRecaptcha) {
      return res.status(400).json({
        success: false,
        message: 'reCAPTCHA verification failed. Please try again.'
      });
    }
    
    // Send email
    const mailOptions = {
      from: `"Command Manager Contact" <${process.env.SMTP_USER}>`,
      to: process.env.RECIPIENT_EMAIL,
      replyTo: email,
      subject: `[Contact Form] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">⚡ Command Manager</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">New Contact Form Submission</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-left: 4px solid #667eea;">
            <h2 style="color: #333; margin-top: 0;">Contact Details</h2>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6;">
                  <strong style="color: #667eea;">Name:</strong>
                </td>
                <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6;">
                  ${name}
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6;">
                  <strong style="color: #667eea;">Email:</strong>
                </td>
                <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6;">
                  <a href="mailto:${email}" style="color: #667eea; text-decoration: none;">${email}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6;">
                  <strong style="color: #667eea;">Subject:</strong>
                </td>
                <td style="padding: 10px 0; border-bottom: 1px solid #dee2e6;">
                  ${subject}
                </td>
              </tr>
            </table>
            
            <div style="margin-top: 20px;">
              <h3 style="color: #667eea; margin-bottom: 10px;">Message:</h3>
              <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #dee2e6; white-space: pre-wrap; word-wrap: break-word;">
${message}
              </div>
            </div>
          </div>
          
          <div style="background: #e9ecef; padding: 20px; text-align: center; font-size: 12px; color: #6c757d;">
            <p style="margin: 0;">This email was sent from Command Manager contact form</p>
            <p style="margin: 5px 0 0 0;">Timestamp: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
    res.json({
      success: true,
      message: 'Message sent successfully'
    });
    
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again later.'
    });
  }
});

module.exports = router;
