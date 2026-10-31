const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');

router.post('/register', loginLimiter, authController.register);
router.post('/login', loginLimiter, authController.login);
router.post('/logout', authController.logout);
router.get('/me', authenticateToken, authController.getCurrentUser);

module.exports = router;
