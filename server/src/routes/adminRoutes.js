const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// All routes here strictly require a valid JWT AND role === 'admin'
router.use(authenticateToken, requireAdmin);

router.get('/stats', adminController.getStats);
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserDetails);
router.get('/users/:id/credentials', adminController.getUserCredentials);
router.post('/users/:id/reset-password', adminController.resetUserPassword);
router.patch('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);

module.exports = router;

