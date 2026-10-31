const settingsRepository = require('../repositories/settingsRepository');
const suppressionRepository = require('../repositories/suppressionRepository');
const emailService = require('../services/emailService');
const { suppressionSchema } = require('../validators/schemas');

async function getSettings(req, res, next) {
  try {
    const userId = req.user.id;
    const settings = await settingsRepository.getUserSettings(userId);
    const smtpHealth = await emailService.checkSmtpHealth(userId);

    return res.json({
      success: true,
      data: {
        sender_name: settings.sender_name || '',
        sender_email: settings.sender_email || '',
        send_delay_seconds: settings.send_delay_seconds || '2',
        batch_size: settings.batch_size || '5',
        max_retries: settings.max_retries || '2',
        portfolio_url: settings.portfolio_url || '',
        github_url: settings.github_url || '',
        hasAppPassword: !!settings.gmail_app_password,
        smtpConfigured: smtpHealth.configured,
        smtpConnected: smtpHealth.success,
        smtpMessage: smtpHealth.message
      }
    });
  } catch (err) {
    next(err);
  }
}

async function updateSettings(req, res, next) {
  try {
    const userId = req.user.id;
    const { 
      sender_name, 
      sender_email, 
      send_delay_seconds, 
      batch_size, 
      max_retries, 
      portfolio_url, 
      github_url, 
      gmail_app_password 
    } = req.body;
    
    await settingsRepository.updateUserSettings(userId, {
      sender_name,
      sender_email,
      send_delay_seconds,
      batch_size,
      max_retries,
      portfolio_url,
      github_url,
      gmail_app_password
    });

    return res.json({
      success: true,
      message: 'Settings updated successfully.'
    });
  } catch (err) {
    next(err);
  }
}

async function listSuppressions(req, res, next) {
  try {
    const suppressions = await suppressionRepository.getAllSuppressions(req.user.id);
    return res.json({
      success: true,
      data: suppressions
    });
  } catch (err) {
    next(err);
  }
}

async function addSuppression(req, res, next) {
  try {
    const validated = suppressionSchema.parse(req.body);
    const id = await suppressionRepository.addSuppression(req.user.id, validated.email, validated.reason);
    return res.status(201).json({
      success: true,
      message: `Suppressed "${validated.email}" from all your campaigns.`,
      data: { id, email: validated.email, reason: validated.reason }
    });
  } catch (err) {
    next(err);
  }
}

async function removeSuppression(req, res, next) {
  try {
    await suppressionRepository.removeSuppression(req.user.id, req.params.id);
    return res.json({
      success: true,
      message: 'Email removed from suppression list.'
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSettings,
  updateSettings,
  listSuppressions,
  addSuppression,
  removeSuppression
};
