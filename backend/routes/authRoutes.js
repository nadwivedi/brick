const express = require('express');
const router = express.Router();
const { login, getMe, adminAccess } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// No public sign-up: owner accounts are created from the admin panel
router.post('/login', login);
router.post('/admin-access', adminAccess);
router.get('/me', protect, getMe);

module.exports = router;
