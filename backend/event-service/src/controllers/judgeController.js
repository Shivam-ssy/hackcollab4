const Event = require('../models/Event');
const Submission = require('../models/Submission');
const mongoose = require('mongoose');

exports.assignJudge = async (req, res) => {
  try {
    if (req.user.role !== 'COLLEGE_ADMIN') {
      return res.status(403).json({ message: 'Only College Admins can assign judges' });
    }

    const { eventId } = req.params;
    const { judgeEmail } = req.body;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.collegeId && req.user.collegeId && event.collegeId.toString() !== req.user.collegeId) {
      return res.status(403).json({ message: 'Not authorized to modify this event' });
    }

    if (!judgeEmail) return res.status(400).json({ message: 'Judge email is required' });

    // Look up user by email directly in the auth collection since they share the same DB
    const userDoc = await mongoose.connection.db.collection('users').findOne({ email: judgeEmail });
    if (!userDoc) return res.status(404).json({ message: 'User not found with this email' });

    // Check if the user has the JUDGE role
    const roleDoc = await mongoose.connection.db.collection('roles').findOne({ _id: userDoc.roleId });
    if (!roleDoc || roleDoc.name !== 'JUDGE') {
      return res.status(400).json({ message: 'The specified user is not a Judge' });
    }

    const judgeId = userDoc._id.toString();

    if (!event.judges.includes(judgeId)) {
      event.judges.push(judgeId);
      await event.save();
    }

    res.json({ message: 'Judge assigned successfully', event });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAssignedEvents = async (req, res) => {
  try {
    if (req.user.role !== 'JUDGE') {
      return res.status(403).json({ message: 'Only Judges can access this route' });
    }

    const events = await Event.find({ collegeId: req.user.collegeId });
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.scoreSubmission = async (req, res) => {
  try {
    if (req.user.role !== 'JUDGE') {
      return res.status(403).json({ message: 'Only Judges can score submissions' });
    }

    const { submissionId } = req.params;
    const { score, feedback } = req.body;

    const submission = await Submission.findById(submissionId);
    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    // Validate if the judge is assigned to this event
    const event = await Event.findById(submission.eventId);
    if (!event || !event.judges.includes(req.user.userId)) {
      return res.status(403).json({ message: 'Not assigned to this event' });
    }

    submission.score = score;
    submission.feedback = feedback;
    await submission.save();

    res.json({ message: 'Score saved successfully', submission });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
