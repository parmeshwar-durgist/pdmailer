const fs = require('fs');
const { getTransporterForUser, verifyTransporterForUser } = require('../config/email');
const settingsRepository = require('../repositories/settingsRepository');
const resumeRepository = require('../repositories/resumeRepository');
const { renderTemplate, cleanHtml, formatEmailHtml } = require('../utils/sanitize');

async function getSenderProfile(userId = null) {
  if (userId) {
    const settings = await settingsRepository.getUserSettings(userId);
    const name = settings.sender_name || 'Hiring Candidate';
    const email = settings.sender_email || process.env.GMAIL_USER || 'durgistparmeshwar@gmail.com';
    return {
      name,
      email,
      fromHeader: `"${name}" <${email}>`
    };
  }
  const name = process.env.SENDER_NAME || 'Parmeshwar Durgist';
  const email = process.env.GMAIL_USER || 'durgistparmeshwar@gmail.com';
  return {
    name,
    email,
    fromHeader: `"${name}" <${email}>`
  };
}

async function sendSingleEmail({ userId = null, to, subject, htmlBody, textBody = null, resumeId = null, resumePath = null, resumeOriginalName = null }) {
  const transporter = await getTransporterForUser(userId);

  if (!transporter) {
    throw new Error('Gmail SMTP credentials are not configured. Please set your 16-character Google App Password in Settings.');
  }

  const sender = await getSenderProfile(userId);
  const attachments = [];

  let filePath = resumePath;
  let filename = resumeOriginalName;

  if (resumeId && (!filePath || !filename)) {
    const resume = await resumeRepository.findById(userId, resumeId);
    if (resume && fs.existsSync(resume.storage_path)) {
      filePath = resume.storage_path;
      filename = resume.original_filename;
    }
  }

  if (filePath && fs.existsSync(filePath)) {
    attachments.push({
      filename: filename || 'Resume.pdf',
      path: filePath,
      contentType: 'application/pdf'
    });
  }

  const mailOptions = {
    from: sender.fromHeader,
    to: to.trim(),
    subject: subject.trim(),
    html: formatEmailHtml(cleanHtml(htmlBody)),
    text: textBody || htmlBody.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
    attachments
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return {
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      response: info.response
    };
  } catch (err) {
    const errorMsg = err.message || 'SMTP transmission error';
    const isAuthError = err.code === 'EAUTH' || err.responseCode === 535;
    const isRateLimit = err.code === 'EMAXLIMIT' || /quota|limit|exceeded/i.test(errorMsg);

    const error = new Error(errorMsg);
    error.code = err.code;
    error.isAuthError = isAuthError;
    error.isRateLimit = isRateLimit;
    throw error;
  }
}

async function sendTestEmail({ userId, recipientEmail, subject, body, resumeId, contactSample }) {
  const sample = {
    name: contactSample?.name || 'Hiring Manager',
    title: contactSample?.title || 'Software Engineer',
    company: contactSample?.company || 'Leading Tech Corp'
  };

  const renderedSub = renderTemplate(subject, sample);
  const renderedHtml = renderTemplate(body, sample);

  return await sendSingleEmail({
    userId,
    to: recipientEmail,
    subject: `[TEST] ${renderedSub}`,
    htmlBody: renderedHtml,
    resumeId
  });
}

async function checkSmtpHealth(userId = null) {
  return await verifyTransporterForUser(userId);
}

module.exports = {
  getSenderProfile,
  sendSingleEmail,
  sendTestEmail,
  checkSmtpHealth
};
