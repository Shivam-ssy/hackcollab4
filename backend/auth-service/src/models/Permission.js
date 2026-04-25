const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true } // e.g. CREATE_EVENT, DELETE_EVENT, MANAGE_USERS
}, { timestamps: true });

module.exports = mongoose.model('Permission', permissionSchema);