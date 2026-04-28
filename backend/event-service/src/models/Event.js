const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  registrationFee: { type: Number, default: 0 },
  collegeId: { type: mongoose.Schema.Types.ObjectId, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, required: true },
  maxTeamSize: { type: Number, default: 4 },
  location: { type: String, required: true },
  image: { type: String, default: '' },
  tags: [{ type: String }],
  sponsors: [{
    companyId: { type: mongoose.Schema.Types.ObjectId, required: true },
    amount: { type: Number, default: 0 }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);