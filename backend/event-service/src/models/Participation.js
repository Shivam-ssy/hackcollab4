const mongoose = require('mongoose');

const participationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  paymentStatus: { type: String, enum: ['PENDING', 'PAID'], default: 'PENDING' },
  amountPaid: { type: Number, default: 0 }
}, { timestamps: true });

// Prevent duplicate participation
participationSchema.index({ userId: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.model('Participation', participationSchema);
