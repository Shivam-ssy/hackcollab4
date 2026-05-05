const Role = require('../models/Role');
const Permission = require('../models/Permission');
const User = require('../models/User');

exports.createPermission = async (req, res) => {
  try {
    const { name } = req.body;
    let permission = await Permission.findOne({ name });
    if (permission) return res.status(400).json({ message: 'Permission already exists' });
    
    permission = new Permission({ name });
    await permission.save();
    
    res.status(201).json(permission);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPermissions = async (req, res) => {
  try {
    const permissions = await Permission.find();
    res.json(permissions);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createRole = async (req, res) => {
  try {
    const { name, permissionIds, collegeId } = req.body;
    // permissionIds should be an array of Permission _ids
    const role = new Role({
      name,
      permissions: permissionIds || [],
      collegeId: collegeId || null
    });
    
    await role.save();
    res.status(201).json(role);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.assignRole = async (req, res) => {
  try {
    const { userId, roleId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.roleId = roleId;
    await user.save();
    
    res.json({ message: 'Role assigned successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getRoles = async (req, res) => {
  try {
    const { collegeId } = req.query; // optional filter
    const query = {};
    if (collegeId) query.collegeId = collegeId;
    
    const roles = await Role.find(query).populate('permissions');
    res.json(roles);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
