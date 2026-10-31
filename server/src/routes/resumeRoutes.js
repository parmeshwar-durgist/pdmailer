const express = require('express');
const router = express.Router();
const resumeController = require('../controllers/resumeController');
const { authenticateToken } = require('../middleware/auth');
const { resumeUpload } = require('../config/multer');

router.use(authenticateToken);

router.get('/', resumeController.list);
router.post('/', resumeUpload.single('resume'), resumeController.upload);
router.put('/:id/activate', resumeController.activate);
router.delete('/:id', resumeController.remove);
router.get('/:id/download', resumeController.download);

module.exports = router;

