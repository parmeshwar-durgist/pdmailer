const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { authenticateToken } = require('../middleware/auth');
const { excelUpload } = require('../config/multer');

router.use(authenticateToken);

router.get('/', contactController.list);
router.post('/', contactController.create);
router.get('/filters', contactController.getFilters);
router.get('/export', contactController.exportContacts);
router.get('/sample-template', contactController.downloadSampleTemplate);
router.post('/import/preview', excelUpload.single('file'), contactController.previewImport);
router.post('/import/confirm', contactController.confirmImport);
router.get('/:id', contactController.getById);
router.put('/:id', contactController.update);
router.delete('/:id', contactController.remove);

module.exports = router;

