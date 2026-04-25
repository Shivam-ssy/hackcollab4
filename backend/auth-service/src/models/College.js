const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  isApproved: { type: Boolean, default: false },
  subscriptionStatus: { type: String, enum: ['PENDING', 'ACTIVE', 'EXPIRED'], default: 'PENDING' }
}, { timestamps: true });

module.exports = mongoose.model('College', collegeSchema);