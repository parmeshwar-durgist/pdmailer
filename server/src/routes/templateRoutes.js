const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', templateController.list);
router.post('/', templateController.create);
router.post('/preview', templateController.preview);
router.get('/:id', templateController.getById);
router.put('/:id', templateController.update);
router.delete('/:id', templateController.remove);

module.exports = router;

