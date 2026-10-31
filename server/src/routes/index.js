const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const contactRoutes = require('./contactRoutes');
const resumeRoutes = require('./resumeRoutes');
const templateRoutes = require('./templateRoutes');
const emailRoutes = require('./emailRoutes');
const campaignRoutes = require('./campaignRoutes');
const settingsRoutes = require('./settingsRoutes');
const adminRoutes = require('./adminRoutes');
const whatsappRoutes = require('./whatsappRoutes');

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/contacts', contactRoutes);
router.use('/resumes', resumeRoutes);
router.use('/templates', templateRoutes);
router.use('/email', emailRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/settings', settingsRoutes);
router.use('/admin', adminRoutes);
router.use('/whatsapp', whatsappRoutes);

module.exports = router;

