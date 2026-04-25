const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/verify-email/send', authController.sendVerificationOtp);
router.post('/verify-email/verify', authController.verifyEmail);
router.post('/forgot-password/send', authController.forgotPasswordOtp);
router.post('/forgot-password/reset', authController.resetPassword);

// Secret temporary endpoint
router.post('/seed', authController.seedDatabase);

module.exports = router;
