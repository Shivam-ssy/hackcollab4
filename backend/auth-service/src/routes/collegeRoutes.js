const express = require('express');
const router = express.Router();
const collegeController = require('../controllers/collegeController');

const { protect, authorize } = require('../middleware/auth.middleware');

router.post('/register', collegeController.registerCollege);
router.put('/:collegeId/approve', protect, authorize('SUPER_ADMIN', 'MANAGE_PLATFORM'), collegeController.approveCollege);
router.put('/:collegeId/subscription', protect, authorize('SUPER_ADMIN', 'MANAGE_PLATFORM'), collegeController.updateSubscription);
router.get('/', collegeController.getColleges);

module.exports = router;
