const User = require('../models/User');
const Role = require('../models/Role');
const College = require('../models/College');
const Otp = require('../models/Otp');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Simple util for OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, collegeId } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Get default STUDENT role
    const defaultRole = await Role.findOne({ name: 'STUDENT' });
    const roleId = defaultRole ? defaultRole._id : undefined;

    // Create user
    user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      collegeId,
      roleId, // default role
      status: 'ACTIVE',
      isVerified: false
    });

    await user.save();

    res.status(201).json({ message: 'User registered successfully. Please verify your email.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email }).populate({
      path: 'roleId',
      populate: { path: 'permissions' }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if verified
    if (!user.isVerified) {
      return res.status(403).json({ message: 'Please verify your email first' });
    }

    // Check if blocked
    if (user.status === 'BLOCKED') {
      return res.status(403).json({ message: 'User is blocked' });
    }

    // Check if college is approved (if user belongs to a college)
    if (user.collegeId) {
      const college = await College.findById(user.collegeId);
      if (!college) return res.status(400).json({ message: 'College not found' });
      if (!college.isApproved) return res.status(403).json({ message: 'College is pending approval' });
    }

    // Map permissions
    const permissions = user.roleId && user.roleId.permissions ? user.roleId.permissions.map(p => p.name) : [];
    const roleName = user.roleId ? user.roleId.name : 'USER';

    // Generate JWT
    const payload = {
      userId: user._id,
      role: roleName,
      collegeId: user.collegeId,
      permissions
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1d' });

    res.json({ token, user: { id: user._id, email: user.email, role: roleName } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.sendVerificationOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'Already verified' });

    // Mark previous OTPs as used
    await Otp.updateMany({ email, type: 'VERIFY_EMAIL', isUsed: false }, { isUsed: true });

    const otp = generateOTP();
    const newOtp = new Otp({
      email,
      otp,
      type: 'VERIFY_EMAIL',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 mins
    });
    await newOtp.save();

    // In a real app, send email via nodemailer here
    console.log(`[Email Mock] Verification OTP for ${email}: ${otp}`);

    res.json({ message: 'OTP sent to email (check server logs for mock)' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const otpRecord = await Otp.findOne({ email, otp, type: 'VERIFY_EMAIL', isUsed: false, expiresAt: { $gt: new Date() } });
    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    otpRecord.isUsed = true;
    await otpRecord.save();

    await User.updateOne({ email }, { isVerified: true });

    res.json({ message: 'Email verified successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.forgotPasswordOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    await Otp.updateMany({ email, type: 'RESET_PASSWORD', isUsed: false }, { isUsed: true });

    const otp = generateOTP();
    const newOtp = new Otp({
      email,
      otp,
      type: 'RESET_PASSWORD',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });
    await newOtp.save();

    console.log(`[Email Mock] Password Reset OTP for ${email}: ${otp}`);

    res.json({ message: 'OTP sent for password reset' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const otpRecord = await Otp.findOne({ email, otp, type: 'RESET_PASSWORD', isUsed: false, expiresAt: { $gt: new Date() } });
    if (!otpRecord) return res.status(400).json({ message: 'Invalid or expired OTP' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.updateOne({ email }, { password: hashedPassword });
    otpRecord.isUsed = true;
    await otpRecord.save();

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.seedDatabase = async (req, res) => {
  try {
    const Permission = require('../models/Permission');

    // Create a generic test college
    let college = await College.findOne({ email: 'info@starkuniversity.edu' });
    if (!college) {
      college = new College({
        name: 'Stark University',
        email: 'info@starkuniversity.edu',
        isApproved: true,
        subscriptionStatus: 'ACTIVE'
      });
      await college.save();
    }

    // Create permissions
    const perms = ['MANAGE_PLATFORM', 'MANAGE_COLLEGE', 'MANAGE_USERS', 'CREATE_EVENT', 'DELETE_EVENT'];
    const permMap = {};
    for (const p of perms) {
      let perm = await Permission.findOne({ name: p });
      if (!perm) {
        perm = new Permission({ name: p });
        await perm.save();
      }
      permMap[p] = perm._id;
    }

    // Create SUPER_ADMIN role
    let superAdminRole = await Role.findOne({ name: 'SUPER_ADMIN' });
    if (!superAdminRole) {
      superAdminRole = new Role({
        name: 'SUPER_ADMIN',
        permissions: [permMap['MANAGE_PLATFORM'], permMap['MANAGE_COLLEGE'], permMap['MANAGE_USERS'], permMap['CREATE_EVENT'], permMap['DELETE_EVENT']]
      });
      await superAdminRole.save();
    }

    // Create COLLEGE_ADMIN role
    let collegeAdminRole = await Role.findOne({ name: 'COLLEGE_ADMIN' });
    if (!collegeAdminRole) {
      collegeAdminRole = new Role({
        name: 'COLLEGE_ADMIN',
        permissions: [permMap['MANAGE_COLLEGE'], permMap['MANAGE_USERS'], permMap['CREATE_EVENT'], permMap['DELETE_EVENT']]
      });
      await collegeAdminRole.save();
    }

    // Create STUDENT role
    let studentRole = await Role.findOne({ name: 'STUDENT' });
    if (!studentRole) {
      studentRole = new Role({
        name: 'STUDENT',
        permissions: [] // default empty or specific
      });
      await studentRole.save();
    }

    // Check if test users exist, if not, optionally create them here or leave to user

    res.json({ message: 'Seeding completed successfully', collegeId: college._id, roles: { superAdmin: superAdminRole._id, collegeAdmin: collegeAdminRole._id, student: studentRole._id } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
