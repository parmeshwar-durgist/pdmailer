const emailService = require('../services/emailService');
const { testEmailSchema } = require('../validators/schemas');

async function sendTest(req, res, next) {
  try {
    const validated = testEmailSchema.parse(req.body);
    const result = await emailService.sendTestEmail({
      userId: req.user.id,
      recipientEmail: validated.recipient_email,
      subject: validated.subject,
      body: validated.body,
      resumeId: validated.resume_id,
      contactSample: validated.contact_sample
    });

    return res.json({
      success: true,
      message: `Test email successfully sent to ${validated.recipient_email}.`,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

async function verifyConnection(req, res, next) {
  try {
    const status = await emailService.checkSmtpHealth(req.user.id);
    return res.json({
      success: status.success,
      configured: status.configured,
      message: status.message
    });
  } catch (err) {
    next(err);
  }
}

async function getSender(req, res, next) {
  try {
    const sender = await emailService.getSenderProfile(req.user.id);
    return res.json({
      success: true,
      data: sender
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  sendTest,
  verifyConnection,
  getSender
};
