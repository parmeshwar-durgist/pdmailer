const campaignService = require('../services/campaignService');
const { campaignCreateSchema } = require('../validators/schemas');

async function list(req, res, next) {
  try {
    const { page, limit } = req.query;
    const result = await campaignService.listCampaigns(req.user.id, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20
    });
    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const campaign = await campaignService.getCampaignById(req.user.id, req.params.id);
    return res.json({ success: true, data: campaign });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const validated = campaignCreateSchema.parse(req.body);
    const campaign = await campaignService.createCampaign(req.user.id, {
      campaignName: validated.campaign_name,
      templateId: validated.template_id,
      resumeId: validated.resume_id,
      subjectTemplate: validated.subject_template,
      bodyTemplate: validated.body_template,
      contactIds: validated.contact_ids
    });

    return res.status(201).json({
      success: true,
      message: 'Campaign created and recipients queued successfully.',
      data: campaign
    });
  } catch (err) {
    next(err);
  }
}

async function start(req, res, next) {
  try {
    const result = await campaignService.startCampaign(req.user.id, req.params.id);
    return res.json({
      success: true,
      message: result.message
    });
  } catch (err) {
    next(err);
  }
}

async function pause(req, res, next) {
  try {
    const result = await campaignService.pauseCampaign(req.user.id, req.params.id);
    return res.json({
      success: true,
      message: result.message
    });
  } catch (err) {
    next(err);
  }
}

async function resume(req, res, next) {
  try {
    const result = await campaignService.resumeCampaign(req.user.id, req.params.id);
    return res.json({
      success: true,
      message: result.message
    });
  } catch (err) {
    next(err);
  }
}

async function cancel(req, res, next) {
  try {
    const result = await campaignService.cancelCampaign(req.user.id, req.params.id);
    return res.json({
      success: true,
      message: result.message
    });
  } catch (err) {
    next(err);
  }
}

async function getRecipients(req, res, next) {
  try {
    const { page, limit, status, search } = req.query;
    const result = await campaignService.getCampaignRecipients(req.user.id, req.params.id, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
      status: status || '',
      search: search || ''
    });
    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getAllLogs(req, res, next) {
  try {
    const { page, limit, status, campaignId, company, search } = req.query;
    const result = await campaignService.getAllRecipientLogs(req.user.id, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
      status: status || '',
      campaignId: campaignId || '',
      company: company || '',
      search: search || ''
    });
    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function retryFailed(req, res, next) {
  try {
    const result = await campaignService.retryFailed(req.user.id, req.params.id);
    return res.json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

async function exportRecipientsCsv(req, res, next) {
  try {
    const csvContent = await campaignService.exportCampaignRecipientsCsv(req.user.id, req.params.id);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="Campaign_${req.params.id}_Report.csv"`);
    return res.send(csvContent);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  getById,
  create,
  start,
  pause,
  resume,
  cancel,
  getRecipients,
  getAllLogs,
  retryFailed,
  exportRecipientsCsv
};
