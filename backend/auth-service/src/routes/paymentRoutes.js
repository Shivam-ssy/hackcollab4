const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth.middleware');

router.post('/create-order', protect, authorize('COLLEGE_ADMIN'), paymentController.createOrder);
router.post('/verify', protect, authorize('COLLEGE_ADMIN'), paymentController.verifyPayment);

module.exports = router;
