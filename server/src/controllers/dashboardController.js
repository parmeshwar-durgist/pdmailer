const campaignRepository = require('../repositories/campaignRepository');
const emailService = require('../services/emailService');

async function getStats(req, res, next) {
  try {
    const userId = req.user.id;
    const stats = await campaignRepository.getDashboardStats(userId);
    const smtpHealth = await emailService.checkSmtpHealth(userId);

    return res.json({
      success: true,
      data: {
        ...stats,
        smtpConfigured: smtpHealth.configured,
        smtpConnected: smtpHealth.success,
        smtpMessage: smtpHealth.message
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getStats
};
