const User = require('../models/User');

/**
 * @desc    Get all users
 * @route   GET /api/admin/users
 * @access  Private (Admin only)
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'COLLEGE_ADMIN') {
      if (!req.user.collegeId) {
        return res.status(403).json({ success: false, message: 'College Admin has no associated college' });
      }
      query = { collegeId: req.user.collegeId };
    }

    // Get all users matching the query, excluding password field
    const users = await User.find(query).select('-password').populate('roleId');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user by ID
 * @route   GET /api/admin/users/:id
 * @access  Private (Admin only)
 */
exports.getUserById = async (req, res, next) => {
  try {
    let query = { _id: req.params.id };
    if (req.user.role === 'COLLEGE_ADMIN') {
      query.collegeId = req.user.collegeId;
    }
    const user = await User.findOne(query).select('-password').populate('roleId');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user role
 * @route   PUT /api/admin/users/:id/role
 * @access  Private (Admin only)
 */
exports.updateUserRole = async (req, res, next) => {
  try {
    const { roleId } = req.body; // Changed from role string to roleId

    if (!roleId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a roleId'
      });
    }

    let query = { _id: req.params.id };
    if (req.user.role === 'COLLEGE_ADMIN') {
      query.collegeId = req.user.collegeId;
    }

    // Find user and update role
    const user = await User.findOneAndUpdate(
      query,
      { roleId },
      { new: true, runValidators: true }
    ).select('-password').populate('roleId');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};