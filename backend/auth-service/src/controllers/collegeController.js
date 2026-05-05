const College = require('../models/College');

exports.registerCollege = async (req, res) => {
  try {
    const { name, email } = req.body;
    
    const exists = await College.findOne({ email });
    if (exists) return res.status(400).json({ message: 'College already registered' });
    
    const college = new College({
      name,
      email,
      isApproved: false, // Wait for super admin approval
      subscriptionStatus: 'PENDING'
    });
    
    await college.save();
    
    res.status(201).json({ message: 'College registered. Waiting for admin approval.', college });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.approveCollege = async (req, res) => {
  try {
    const { collegeId } = req.params;
    
    const college = await College.findById(collegeId);
    if (!college) return res.status(404).json({ message: 'College not found' });
    
    college.isApproved = true;
    college.subscriptionStatus = 'ACTIVE';
    
    await college.save();
    
    res.json({ message: 'College approved successfully', college });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateSubscription = async (req, res) => {
  try {
    const { collegeId } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['PENDING', 'ACTIVE', 'EXPIRED'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid subscription status' });
    }

    const college = await College.findById(collegeId);
    if (!college) return res.status(404).json({ message: 'College not found' });
    
    college.subscriptionStatus = status;
    await college.save();
    
    res.json({ message: 'College subscription updated', college });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMyCollege = async (req, res) => {
  try {
    const { collegeId } = req.user;
    if (!collegeId) {
      return res.status(400).json({ message: 'User is not associated with a college' });
    }
    const college = await College.findById(collegeId);
    if (!college) {
      return res.status(404).json({ message: 'College not found' });
    }
    res.json(college);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getColleges = async (req, res) => {
  try {
    const colleges = await College.find();
    res.json(colleges);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
