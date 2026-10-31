const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', settingsController.getSettings);
router.put('/', settingsController.updateSettings);
router.get('/suppressions', settingsController.listSuppressions);
router.post('/suppressions', settingsController.addSuppression);
router.delete('/suppressions/:id', settingsController.removeSuppression);

module.exports = router;

