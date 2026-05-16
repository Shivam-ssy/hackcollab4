const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth.middleware');

router.post('/register', authController.register);
router.post('/register-college', authController.registerCollegeAdmin);
router.post('/register-company', authController.registerCompanyAdmin);
router.post('/login', authController.login);
router.post('/create-judge', protect, authController.createJudge);
router.get('/college-judges', protect, authController.getCollegeJudges);
router.post('/verify-email/send', authController.sendVerificationOtp);
router.post('/verify-email/verify', authController.verifyEmail);
router.post('/forgot-password/send', authController.forgotPasswordOtp);
router.post('/forgot-password/reset', authController.resetPassword);

// Profile routes
router.get('/me', authController.getCurrentUser);
router.put('/profile', authController.updateProfile);

// Secret temporary endpoint
router.post('/seed', authController.seedDatabase);

// Talent Route
const talentController = require('../controllers/talentController');
router.get('/talent', protect, talentController.getTalentPool);

module.exports = router;
