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
    const users = await User.find(query).select('-password').populate('roleId').populate("collegeId", "name");

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

exports.blockUser = async (req, res, next) => {
  try {
    const { id: userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (user.status === "BLOCKED") {
      return res.status(400).json({
        success: false,
        message: "User already blocked"
      });
    }

    user.status = "BLOCKED";
    await user.save();

    const updatedUser = await User.findById(userId)
      .select("-password")
      .populate("roleId")
      .populate("collegeId", "name");

    return res.status(200).json({
      success: true,
      message: "User blocked successfully",
      data: updatedUser
    });

  } catch (error) {
    next(error);
  }
};

exports.unblockUser = async (req, res, next) => {
  try {
    const { id: userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (user.status === "ACTIVE") {
      return res.status(400).json({
        success: false,
        message: "User is already active"
      });
    }

    user.status = "ACTIVE";
    await user.save();

    const updatedUser = await User.findById(userId)
      .select("-password")
      .populate("roleId")
      .populate("collegeId", "name");

    return res.status(200).json({
      success: true,
      message: "User unblocked successfully",
      data: updatedUser
    });

  } catch (error) {
    next(error);
  }
};

exports.getPendingCompanies = async (req, res, next) => {
  try {
    const Company = require('../models/Company');
    const companies = await Company.find({ isApproved: false });
    
    res.status(200).json({
      success: true,
      data: companies
    });
  } catch (error) {
    next(error);
  }
};

exports.approveCompany = async (req, res, next) => {
  try {
    const Company = require('../models/Company');
    const { id } = req.params;
    
    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    
    company.isApproved = true;
    await company.save();
    
    res.status(200).json({
      success: true,
      message: 'Company approved successfully',
      data: company
    });
  } catch (error) {
    next(error);
  }
};
