const https = require('https');
const querystring = require('querystring');

// Verify reCAPTCHA v3 token
async function verifyRecaptcha(req, res, next) {
  try {
    const recaptchaToken = req.body.recaptchaToken;
    
    // Skip verification in development if token is missing
    if (!recaptchaToken && process.env.NODE_ENV === 'development') {
      console.warn('⚠️ reCAPTCHA token missing in development mode - skipping verification');
      return next();
    }
    
    if (!recaptchaToken) {
      return res.status(400).json({
        success: false,
        message: 'reCAPTCHA verification is required'
      });
    }
    
    // Verify token with Google
    const postData = querystring.stringify({
      secret: process.env.RECAPTCHA_SECRET_KEY,
      response: recaptchaToken
    });
    
    const options = {
      hostname: 'www.google.com',
      port: 443,
      path: '/recaptcha/api/siteverify',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const verificationResponse = await new Promise((resolve, reject) => {
      const request = https.request(options, (response) => {
        let data = '';
        
        response.on('data', (chunk) => {
          data += chunk;
        });
        
        response.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(error);
          }
        });
      });
      
      request.on('error', (error) => {
        reject(error);
      });
      
      request.write(postData);
      request.end();
    });
    
    const { success, score, action } = verificationResponse;
    
    // For reCAPTCHA v3, check score (0.0 - 1.0)
    // 0.0 is very likely a bot, 1.0 is very likely a human
    // We'll use 0.5 as threshold
    if (!success || score < 0.5) {
      console.log(`reCAPTCHA verification failed - Score: ${score}, Action: ${action}`);
      return res.status(400).json({
        success: false,
        message: 'reCAPTCHA verification failed. Please try again.',
        score: score
      });
    }
    
    // Store score in request for logging purposes
    req.recaptchaScore = score;
    
    next();
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    
    // In production, fail closed (reject request)
    // In development, you might want to fail open (allow request)
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({
        success: false,
        message: 'reCAPTCHA verification error. Please try again.'
      });
    }
    
    // Allow in development even if verification fails
    next();
  }
}

module.exports = { verifyRecaptcha };
