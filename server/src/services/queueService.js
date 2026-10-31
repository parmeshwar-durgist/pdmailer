const campaignRepository = require('../repositories/campaignRepository');
const suppressionRepository = require('../repositories/suppressionRepository');
const settingsRepository = require('../repositories/settingsRepository');
const emailService = require('./emailService');

const activeCampaignWorkers = new Map();

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function startCampaignWorker(campaignId) {
  if (activeCampaignWorkers.has(campaignId) && activeCampaignWorkers.get(campaignId).isRunning) {
    return { success: false, message: 'Campaign is already currently running.' };
  }

  const campaign = await campaignRepository.getCampaignByIdInternal(campaignId);
  if (!campaign) {
    throw new Error('Campaign not found');
  }

  if (campaign.status === 'completed' || campaign.status === 'cancelled') {
    throw new Error(`Cannot start campaign with status "${campaign.status}".`);
  }

  const workerState = {
    isRunning: true,
    isPaused: false,
    isCancelled: false
  };
  activeCampaignWorkers.set(campaignId, workerState);

  await campaignRepository.updateCampaignStatus(
    campaignId, 
    'processing', 
    { startedAt: campaign.started_at ? undefined : new Date() }
  );

  processQueue(campaignId, campaign.user_id, workerState).catch(err => {
    console.error(`[Queue Worker Error - Campaign ${campaignId}]`, err);
  });

  return { success: true, message: 'Campaign sending started.' };
}

async function pauseCampaignWorker(campaignId) {
  if (activeCampaignWorkers.has(campaignId)) {
    const state = activeCampaignWorkers.get(campaignId);
    state.isPaused = true;
    state.isRunning = false;
  }
  await campaignRepository.updateCampaignStatus(campaignId, 'paused');
  return { success: true, message: 'Campaign paused.' };
}

async function resumeCampaignWorker(campaignId) {
  const campaign = await campaignRepository.getCampaignByIdInternal(campaignId);
  if (!campaign) {
    throw new Error('Campaign not found');
  }
  if (campaign.status !== 'paused') {
    throw new Error(`Campaign is not paused (current status: ${campaign.status})`);
  }
  return await startCampaignWorker(campaignId);
}

async function cancelCampaignWorker(campaignId) {
  if (activeCampaignWorkers.has(campaignId)) {
    const state = activeCampaignWorkers.get(campaignId);
    state.isCancelled = true;
    state.isRunning = false;
    activeCampaignWorkers.delete(campaignId);
  }
  await campaignRepository.cancelRemainingRecipients(campaignId);
  await campaignRepository.updateCampaignStatus(campaignId, 'cancelled', { completedAt: new Date() });
  await campaignRepository.refreshCampaignCounters(campaignId);
  return { success: true, message: 'Campaign cancelled.' };
}

async function processQueue(campaignId, userId, state) {
  console.log(`[Queue Worker] Starting processing for campaign #${campaignId} (User #${userId})...`);

  const campaign = await campaignRepository.getCampaignByIdInternal(campaignId);
  const settings = await settingsRepository.getUserSettings(userId);
  const delayMs = parseInt(settings.send_delay_seconds || '2', 10) * 1000;

  try {
    while (state.isRunning && !state.isPaused && !state.isCancelled) {
      const recipient = await campaignRepository.getNextPendingRecipient(campaignId);

      if (!recipient) {
        console.log(`[Queue Worker] No more pending recipients for campaign #${campaignId}.`);
        break;
      }

      // Check suppression list scoped to this user
      const isBlocked = await suppressionRepository.isSuppressed(userId, recipient.recipient_email);
      if (isBlocked) {
        await campaignRepository.markRecipientSkipped(recipient.id, 'Email address is on your suppression list');
        await campaignRepository.refreshCampaignCounters(campaignId);
        continue;
      }

      try {
        await emailService.sendSingleEmail({
          userId,
          to: recipient.recipient_email,
          subject: recipient.rendered_subject,
          htmlBody: recipient.rendered_body,
          resumePath: campaign.resume_path,
          resumeOriginalName: campaign.resume_filename
        });

        await campaignRepository.markRecipientSuccess(recipient.id);
        console.log(`[Queue Worker] Successfully sent email to ${recipient.recipient_email}`);
      } catch (err) {
        console.error(`[Queue Worker] Failed to send email to ${recipient.recipient_email}:`, err.message);

        if (err.isAuthError) {
          await campaignRepository.markRecipientFailure(recipient.id, `Authentication failure: ${err.message}`);
          await campaignRepository.updateCampaignStatus(campaignId, 'failed');
          state.isRunning = false;
          activeCampaignWorkers.delete(campaignId);
          console.error(`[Queue Worker] Halting campaign #${campaignId} due to SMTP authentication error.`);
          return;
        }

        if (err.isRateLimit) {
          await campaignRepository.markRecipientFailure(recipient.id, `Provider rate limit exceeded: ${err.message}`);
          await campaignRepository.updateCampaignStatus(campaignId, 'paused');
          state.isRunning = false;
          activeCampaignWorkers.delete(campaignId);
          console.error(`[Queue Worker] Pausing campaign #${campaignId} due to provider quota/rate limit.`);
          return;
        }

        await campaignRepository.markRecipientFailure(recipient.id, err.message);
      }

      await campaignRepository.refreshCampaignCounters(campaignId);

      if (delayMs > 0 && state.isRunning && !state.isPaused) {
        await sleep(delayMs);
      }
    }
  } finally {
    state.isRunning = false;
    activeCampaignWorkers.delete(campaignId);
    await campaignRepository.refreshCampaignCounters(campaignId);
    console.log(`[Queue Worker] Finished or stopped worker for campaign #${campaignId}.`);
  }
}

function getWorkerStatus(campaignId) {
  if (activeCampaignWorkers.has(campaignId)) {
    return activeCampaignWorkers.get(campaignId);
  }
  return { isRunning: false, isPaused: false, isCancelled: false };
}

module.exports = {
  startCampaignWorker,
  pauseCampaignWorker,
  resumeCampaignWorker,
  cancelCampaignWorker,
  getWorkerStatus
};
