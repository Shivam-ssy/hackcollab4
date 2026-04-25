const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }],
  collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', default: null } // null for global roles
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);