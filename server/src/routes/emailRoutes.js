const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.post('/test', emailController.sendTest);
router.get('/health', emailController.verifyConnection);
router.get('/sender', emailController.getSender);

module.exports = router;

