const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');
const { authenticateToken } = require('../middleware/auth');

// All WhatsApp routes require authentication
router.use(authenticateToken);

// Device Linking & Session status
router.post('/session/init', whatsappController.initSession);
router.get('/session/status', whatsappController.getStatus);
router.post('/session/disconnect', whatsappController.disconnectSession);

// 1-Click Direct Send
router.post('/send-direct', whatsappController.sendDirect);

// WhatsApp Templates
router.get('/templates', whatsappController.getTemplates);
router.post('/templates', whatsappController.createTemplate);
router.put('/templates/:id', whatsappController.updateTemplate);
router.delete('/templates/:id', whatsappController.deleteTemplate);

// WhatsApp Campaigns
router.get('/campaigns', whatsappController.getCampaigns);
router.get('/campaigns/:id', whatsappController.getCampaignById);

module.exports = router;

