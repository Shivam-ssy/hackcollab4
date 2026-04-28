const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/register-college', authController.registerCollegeAdmin);
router.post('/register-company', authController.registerCompanyAdmin);
router.post('/login', authController.login);
router.post('/verify-email/send', authController.sendVerificationOtp);
router.post('/verify-email/verify', authController.verifyEmail);
router.post('/forgot-password/send', authController.forgotPasswordOtp);
router.post('/forgot-password/reset', authController.resetPassword);

// Profile routes
router.get('/me', authController.getCurrentUser);
router.put('/profile', authController.updateProfile);

// Secret temporary endpoint
router.post('/seed', authController.seedDatabase);

module.exports = router;
