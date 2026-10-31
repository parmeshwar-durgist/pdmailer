const campaignRepository = require('../repositories/campaignRepository');
const contactRepository = require('../repositories/contactRepository');
const suppressionRepository = require('../repositories/suppressionRepository');
const resumeRepository = require('../repositories/resumeRepository');
const templateRepository = require('../repositories/templateRepository');
const queueService = require('./queueService');
const { renderTemplate, cleanHtml, sanitizeCsvCell } = require('../utils/sanitize');

async function createCampaign(userId, { campaignName, templateId, resumeId, subjectTemplate, bodyTemplate, contactIds }) {
  if (!contactIds || contactIds.length === 0) {
    throw new Error('At least one contact must be selected for the campaign.');
  }

  let activeResumeId = resumeId;
  if (!activeResumeId) {
    const activeResume = await resumeRepository.getActiveResume(userId);
    if (activeResume) {
      activeResumeId = activeResume.id;
    }
  }

  const contacts = [];
  for (const cid of contactIds) {
    const contact = await contactRepository.findById(userId, cid);
    if (contact) {
      contacts.push(contact);
    }
  }

  if (contacts.length === 0) {
    throw new Error('None of the selected contacts were found in your database.');
  }

  const emails = contacts.map(c => c.email);
  const suppressedEmails = await suppressionRepository.findSuppressedEmails(userId, emails);
  const suppressedSet = new Set(suppressedEmails);

  const recipients = [];
  for (const c of contacts) {
    const isSuppressed = suppressedSet.has(c.email.toLowerCase());
    const renderedSubject = renderTemplate(subjectTemplate, c);
    const renderedBody = cleanHtml(renderTemplate(bodyTemplate, c));

    recipients.push({
      contact_id: c.id,
      recipient_email: c.email,
      recipient_name: c.name,
      recipient_title: c.title,
      recipient_company: c.company,
      rendered_subject: renderedSubject,
      rendered_body: renderedBody,
      status: isSuppressed ? 'skipped' : 'pending'
    });
  }

  const campaignId = await campaignRepository.createCampaignWithRecipients(userId, {
    campaignName,
    templateId,
    resumeId: activeResumeId,
    subjectTemplate,
    bodyTemplate,
    recipients
  });

  return await campaignRepository.getCampaignById(userId, campaignId);
}

async function listCampaigns(userId, params) {
  return await campaignRepository.getAllCampaigns(userId, params);
}

async function getCampaignById(userId, id) {
  const campaign = await campaignRepository.getCampaignById(userId, id);
  if (!campaign) {
    throw new Error('Campaign not found');
  }
  const workerStatus = queueService.getWorkerStatus(parseInt(id, 10));
  return {
    ...campaign,
    worker: workerStatus
  };
}

async function startCampaign(userId, id) {
  const campaign = await campaignRepository.getCampaignById(userId, id);
  if (!campaign) throw new Error('Campaign not found');
  return await queueService.startCampaignWorker(parseInt(id, 10));
}

async function pauseCampaign(userId, id) {
  const campaign = await campaignRepository.getCampaignById(userId, id);
  if (!campaign) throw new Error('Campaign not found');
  return await queueService.pauseCampaignWorker(parseInt(id, 10));
}

async function resumeCampaign(userId, id) {
  const campaign = await campaignRepository.getCampaignById(userId, id);
  if (!campaign) throw new Error('Campaign not found');
  return await queueService.resumeCampaignWorker(parseInt(id, 10));
}

async function cancelCampaign(userId, id) {
  const campaign = await campaignRepository.getCampaignById(userId, id);
  if (!campaign) throw new Error('Campaign not found');
  return await queueService.cancelCampaignWorker(parseInt(id, 10));
}

async function getCampaignRecipients(userId, id, params) {
  return await campaignRepository.getRecipientsByCampaign(userId, parseInt(id, 10), params);
}

async function getAllRecipientLogs(userId, params) {
  return await campaignRepository.getAllRecipientLogs(userId, params);
}

async function retryFailed(userId, id) {
  const count = await campaignRepository.retryFailedRecipients(userId, parseInt(id, 10));
  if (count > 0) {
    await queueService.startCampaignWorker(parseInt(id, 10));
  }
  return { count, message: `${count} failed recipient(s) queued for retry.` };
}

async function exportCampaignRecipientsCsv(userId, campaignId) {
  const campaign = await campaignRepository.getCampaignById(userId, campaignId);
  if (!campaign) {
    throw new Error('Campaign not found');
  }

  const result = await campaignRepository.getRecipientsByCampaign(userId, campaignId, { page: 1, limit: 10000 });
  const headers = ['Recipient Name', 'Recipient Email', 'Job Title', 'Company', 'Status', 'Attempt Count', 'Sent At', 'Last Error'];
  
  const rows = result.recipients.map(r => [
    sanitizeCsvCell(r.recipient_name),
    sanitizeCsvCell(r.recipient_email),
    sanitizeCsvCell(r.recipient_title || ''),
    sanitizeCsvCell(r.recipient_company || ''),
    sanitizeCsvCell(r.status),
    sanitizeCsvCell(r.attempt_count),
    sanitizeCsvCell(r.sent_at || ''),
    sanitizeCsvCell(r.last_error || '')
  ]);

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

module.exports = {
  createCampaign,
  listCampaigns,
  getCampaignById,
  startCampaign,
  pauseCampaign,
  resumeCampaign,
  cancelCampaign,
  getCampaignRecipients,
  getAllRecipientLogs,
  retryFailed,
  exportCampaignRecipientsCsv
};
