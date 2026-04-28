const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  leaderId: { type: String, required: true }, // from API Gateway x-user-id
  members: [{
    userId: { type: String, required: true },
    joinedAt: { type: Date, default: Date.now }
  }],
  pendingRequests: [{
    userId: { type: String, required: true },
    requestedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Prevent a user from leading/joining multiple teams in the same event
teamSchema.index({ eventId: 1, leaderId: 1 }, { unique: true });

module.exports = mongoose.model('Team', teamSchema);
