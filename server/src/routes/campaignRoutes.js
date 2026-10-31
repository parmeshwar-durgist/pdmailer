const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', campaignController.list);
router.post('/', campaignController.create);
router.get('/logs', campaignController.getAllLogs);
router.get('/:id', campaignController.getById);
router.post('/:id/start', campaignController.start);
router.post('/:id/pause', campaignController.pause);
router.post('/:id/resume', campaignController.resume);
router.post('/:id/cancel', campaignController.cancel);
router.get('/:id/recipients', campaignController.getRecipients);
router.post('/:id/retry-failed', campaignController.retryFailed);
router.get('/:id/export', campaignController.exportRecipientsCsv);

module.exports = router;

