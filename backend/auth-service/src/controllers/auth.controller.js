const User = require('../models/User');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt.utils');
const { sendPasswordResetEmail } = require('../utils/email.utils');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const jwt = require("jsonwebtoken");
const College = require('../models/College')
/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, collegeId } = req.body;

    // 🔴 Check college exists
    const college = await College.findById(collegeId);
    if (!college) {
      return res.status(404).json({ message: "College not found" });
    }

    // 🔴 Check if college is approved
    if (!college.isApproved) {
      return res.status(403).json({ message: "College not approved yet" });
    }

    // 🔴 Check user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // 🧑 Default role → STUDENT
    const studentRole = await Role.findOne({ name: "STUDENT", collegeId });

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      collegeId,
      roleId: studentRole?._id,
      status: "PENDING" // 🔥 needs approval
    });

    res.status(201).json({
      message: "Registered successfully, wait for admin approval"
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName } = req.body;

    // Find user by ID
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;

    // Save updated user
    await user.save();

    await user.populate('collegeId');
    await user.populate('roleId');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        college: user.collegeId ? user.collegeId.name : null,
        role: user.roleId ? user.roleId.name : null
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email })
      .select("+password")
      .populate({
        path: "roleId",
        populate: { path: "permissions" }
      });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 🔴 Check user approval
    if (user.status !== "ACTIVE") {
      return res.status(403).json({ message: "Account not approved" });
    }

    // 🔴 Check college approval
    const college = await College.findById(user.collegeId);
    if (!college.isApproved) {
      return res.status(403).json({ message: "College inactive" });
    }

    // 🔥 Extract permissions
    const permissions = user.roleId?.permissions.map(p => p.name) || [];

    const token = jwt.sign(
      {
        userId: user._id,
        collegeId: user.collegeId,
        role: user.roleId?.name,
        permissions
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.roleId?.name
      }
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('collegeId').populate('roleId');

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        college: user.collegeId ? user.collegeId.name : null,
        role: user.roleId ? user.roleId.name : null
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Refresh access token using refresh token
 * @route   POST /api/auth/refresh-token
 * @access  Public
 */
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    try {
      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);

      // Get user from database
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        });
      }

      // Generate new access token
      const newToken = generateToken(user);

      res.status(200).json({
        success: true,
        token: newToken
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user (client-side only)
 * @route   POST /api/auth/logout
 * @access  Private
 */
exports.logout = async (req, res, next) => {
  try {
    // Since JWT is stateless, logout is handled on the client side
    // by removing the token from localStorage
    // This endpoint is just for API consistency

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Forgot password - send reset email
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email address'
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      // For security reasons, don't reveal that the user doesn't exist
      return res.status(200).json({
        success: true,
        message: 'If your email is registered, you will receive a password reset link'
      });
    }

    // Generate reset token
    const resetToken = user.generateResetToken();
    await user.save({ validateBeforeSave: false });

    // Create reset URL
    // In production, this would be your frontend URL
    const resetUrl = `https://hackcollabo.vercel.app/reset-password/${resetToken}`;

    // For development, we'll also include a frontend URL for testing
    const frontendResetUrl = process.env.NODE_ENV === 'production'
      ? resetUrl
      : `http://localhost:5173/reset-password/${resetToken}`;

    try {
      // Send email with reset link
      await sendPasswordResetEmail({
        email: user.email,
        subject: 'HackCollab Password Reset',
        message: `You requested a password reset. Please click the button below to reset your password. If you didn't request this, please ignore this email.`,
        resetUrl: frontendResetUrl // Use frontend URL for reset link
      });

      res.status(200).json({
        success: true,
        message: 'Password reset email sent'
      });
    } catch (error) {
      // If email sending fails, clear the reset token
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: 'Failed to send password reset email'
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset password using token
 * @route   POST /api/auth/reset-password/:token
 * @access  Public
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a new password'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with matching token and valid expiry
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token'
      });
    }

    // Set new password and clear reset token fields
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Generate new tokens for automatic login
    const newToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
      token: newToken,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
};

// Google OAuth login/signup
exports.googleAuth = async (req, res, next) => {
  try {
    const { idToken, college } = req.body;
    if (!idToken) {
      return res.status(400).json({ success: false, message: 'Google ID token is required' });
    }

    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({ idToken });
    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({ success: false, message: 'Invalid Google token' });
    }

    const { email, given_name, family_name, picture } = payload;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Google account must have an email' });
    }

    let user = await User.findOne({ email });
    if (!user) {
      // If college is not provided, ask for it
      if (!college) {
        return res.status(200).json({
          success: false,
          message: 'College is required',
          needCollege: true,
          googleProfile: { email, firstName: given_name, lastName: family_name, photo: picture }
        });
      }
      // Create new user with a random password (not used for Google login)
      const randomPassword = crypto.randomBytes(16).toString('hex') + 'Aa1!';
      user = await User.create({
        firstName: given_name,
        lastName: family_name,
        email,
        password: randomPassword,
        college
      });
    } else if (!user.college && college) {
      user.college = college;
      await user.save();
    }

    // Generate JWT token
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    res.status(200).json({
      success: true,
      message: 'Google login successful',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        college: user.college,
        role: user.role,
        photo: picture
      },
      token,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
};