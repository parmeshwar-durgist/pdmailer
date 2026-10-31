const whatsappService = require('../services/whatsappService');
const whatsappRepository = require('../repositories/whatsappRepository');
const contactRepository = require('../repositories/contactRepository');
const { renderTemplate } = require('../utils/sanitize');

// ==========================================
// Device Linking & QR Code
// ==========================================

async function initSession(req, res, next) {
  try {
    const result = await whatsappService.initializeClient(req.user.id);
    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

async function getStatus(req, res, next) {
  try {
    const status = await whatsappService.getStatus(req.user.id);
    res.json({
      success: true,
      data: status
    });
  } catch (err) {
    next(err);
  }
}

async function disconnectSession(req, res, next) {
  try {
    const result = await whatsappService.disconnect(req.user.id);
    res.json({
      success: true,
      message: result.message
    });
  } catch (err) {
    next(err);
  }
}

// ==========================================
// 1-Click Direct Send
// ==========================================

async function sendDirect(req, res, next) {
  try {
    const { contactId, phone, message, resumeId } = req.body;
    let targetPhone = phone;
    let recipientName = 'Candidate';
    let targetCompany = '';
    let targetTitle = '';

    if (contactId) {
      const contact = await contactRepository.findById(req.user.id, contactId);
      if (!contact) {
        return res.status(404).json({ success: false, message: 'Contact not found' });
      }
      targetPhone = contact.phone || targetPhone;
      recipientName = contact.name;
      targetCompany = contact.company || '';
      targetTitle = contact.title || '';
    }

    if (!targetPhone) {
      return res.status(400).json({
        success: false,
        message: 'This contact does not have a phone number. Please add their phone number first.'
      });
    }

    // Render dynamic placeholders
    const rendered = renderTemplate(message, {
      name: recipientName,
      company: targetCompany,
      title: targetTitle
    });

    const result = await whatsappService.sendDirectMessage({
      userId: req.user.id,
      phone: targetPhone,
      message: rendered,
      resumeId
    });

    res.json({
      success: true,
      message: `WhatsApp message successfully sent directly to ${targetPhone}!`,
      data: result
    });
  } catch (err) {
    if (
      err.message &&
      (err.message.includes('not connected') ||
       err.message.includes('Invalid phone') ||
       err.message.includes('not registered') ||
       err.message.includes('QR code'))
    ) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
}

// ==========================================
// Templates CRUD
// ==========================================

async function getTemplates(req, res, next) {
  try {
    const templates = await whatsappRepository.getTemplates(req.user.id);
    res.json({ success: true, data: templates });
  } catch (err) {
    next(err);
  }
}

async function createTemplate(req, res, next) {
  try {
    const { name, body } = req.body;
    if (!name || !body) {
      return res.status(400).json({ success: false, message: 'Name and body are required.' });
    }
    const id = await whatsappRepository.createTemplate(req.user.id, { name, body });
    const created = await whatsappRepository.getTemplateById(req.user.id, id);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
}

async function updateTemplate(req, res, next) {
  try {
    const { name, body } = req.body;
    await whatsappRepository.updateTemplate(req.user.id, req.params.id, { name, body });
    const updated = await whatsappRepository.getTemplateById(req.user.id, req.params.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

async function deleteTemplate(req, res, next) {
  try {
    await whatsappRepository.deleteTemplate(req.user.id, req.params.id);
    res.json({ success: true, message: 'WhatsApp template deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

// ==========================================
// WhatsApp Campaigns
// ==========================================

async function getCampaigns(req, res, next) {
  try {
    const campaigns = await whatsappRepository.getCampaigns(req.user.id);
    res.json({ success: true, data: campaigns });
  } catch (err) {
    next(err);
  }
}

async function getCampaignById(req, res, next) {
  try {
    const campaign = await whatsappRepository.getCampaignById(req.user.id, req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'WhatsApp campaign not found.' });
    }
    const recipients = await whatsappRepository.getCampaignRecipients(req.params.id);
    res.json({
      success: true,
      data: {
        ...campaign,
        recipients
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  initSession,
  getStatus,
  disconnectSession,
  sendDirect,
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getCampaigns,
  getCampaignById
};
