const express = require('express');
const {
  getAllUsers,
  getUserById,
  updateUserRole,
  blockUser,
  unblockUser
} = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes are protected and require admin role
router.use(protect);
router.use(authorize('SUPER_ADMIN'));

// User management routes
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/block', blockUser);
router.put('/users/:id/unblock', unblockUser);

module.exports = router;