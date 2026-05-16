const User = require('../models/User');
const Role = require('../models/Role');

exports.getTalentPool = async (req, res) => {
  try {
    if (req.user.role !== 'COMPANY_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: 'Not authorized to view talent pool' });
    }

    const studentRole = await Role.findOne({ name: 'STUDENT' });
    if (!studentRole) return res.status(404).json({ message: 'Student role not found' });

    // Fetch students. Exclude sensitive data.
    const students = await User.find({ roleId: studentRole._id, status: 'ACTIVE' })
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .populate('collegeId', 'name');

    // In a microservices architecture, we would ideally fetch the scores from the Leaderboard service.
    // For this prototype, we'll return the user info and mock their scores on the frontend, or rely on leaderboard API.
    res.json({ data: students });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
