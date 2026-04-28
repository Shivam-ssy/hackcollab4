const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  githubUrl: { type: String, required: true },
  videoUrl: { type: String },
  description: { type: String, required: true },
  score: { type: Number, default: 0 },
  feedback: { type: String },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// One submission per team per event
submissionSchema.index({ teamId: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.model('Submission', submissionSchema);
