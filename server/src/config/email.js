const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const settingsRepository = require('../repositories/settingsRepository');

dotenv.config();

/**
 * Creates an SMTP transporter configured specifically for the given user.
 * If user has their own Gmail App Password stored in user_settings, uses it.
 * Falls back to server environment variables if user is the admin or customConfig provided.
 */
async function getTransporterForUser(userId = null, customConfig = null) {
  let userEmail = customConfig?.user;
  let pass = customConfig?.pass;

  if (!pass && userId) {
    const settings = await settingsRepository.getUserSettings(userId);
    userEmail = settings.sender_email || userEmail;
    pass = settings.gmail_app_password;

    // Only user 1 (platform admin) falls back to .env if not explicitly set in DB
    if (!pass && Number(userId) === 1) {
      pass = process.env.GMAIL_APP_PASSWORD;
      if (!userEmail) userEmail = process.env.GMAIL_USER || 'durgistparmeshwar@gmail.com';
    }
  } else if (!userId) {
    if (!userEmail) userEmail = process.env.GMAIL_USER || 'durgistparmeshwar@gmail.com';
    if (!pass) pass = process.env.GMAIL_APP_PASSWORD;
  }

  if (!pass || !userEmail) {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: userEmail.trim(),
      pass: pass.trim().replace(/\s+/g, '') // remove spaces from 16-char app password
    },
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 5
  });
}

async function verifyTransporterForUser(userId = null, customConfig = null) {
  const transporter = await getTransporterForUser(userId, customConfig);
  if (!transporter) {
    return {
      success: false,
      configured: false,
      message: 'Gmail App Password is not configured for your account. Please set it in Settings.'
    };
  }

  try {
    await transporter.verify();
    return {
      success: true,
      configured: true,
      message: 'SMTP connection verified successfully.'
    };
  } catch (err) {
    return {
      success: false,
      configured: true,
      message: `SMTP verification failed: ${err.message}`
    };
  }
}

module.exports = {
  getTransporterForUser,
  verifyTransporterForUser
};
