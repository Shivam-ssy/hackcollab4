const Submission = require('../models/Submission');
const Team = require('../models/Team');

exports.createSubmission = async (req, res) => {
  try {
    const { eventId, teamId, githubUrl, videoUrl, description } = req.body;
    const userId = req.user.userId;

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });
    
    if (team.leaderId !== userId) {
      return res.status(403).json({ message: 'Only team leader can submit the project' });
    }

    if (team.eventId.toString() !== eventId) {
      return res.status(400).json({ message: 'Team does not belong to this event' });
    }

    const existing = await Submission.findOne({ teamId, eventId });
    if (existing) {
      existing.githubUrl = githubUrl;
      existing.videoUrl = videoUrl;
      existing.description = description;
      await existing.save();
      return res.json({ message: 'Submission updated', submission: existing });
    }

    const submission = new Submission({
      teamId,
      eventId,
      githubUrl,
      videoUrl,
      description
    });
    await submission.save();

    res.status(201).json({ message: 'Project submitted successfully', submission });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getSubmissionsForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const submissions = await Submission.find({ eventId }).populate('teamId');
    res.json(submissions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.scoreSubmission = async (req, res) => {
  try {
    const { eventId, submissionId } = req.params;
    const { score, feedback } = req.body;
    
    // Allow COLLEGE_ADMIN, SUPER_ADMIN, or assigned JUDGE
    const submission = await Submission.findOne({ _id: submissionId, eventId });
    if (!submission) return res.status(404).json({ message: 'Submission not found' });
    
    if (req.user.role === 'JUDGE') {
      const Event = require('../models/Event');
      const event = await Event.findById(eventId);
      if (!event || !event.collegeId || event.collegeId.toString() !== req.user.collegeId) {
        return res.status(403).json({ message: 'Not authorized to score this event' });
      }
    }
    
    submission.score = score;
    submission.feedback = feedback;
    await submission.save();

    // Update leaderboard directly for all team members (since we share the DB)
    const team = await Team.findById(submission.teamId);
    if (team && team.members) {
      const mongoose = require('mongoose');
      for (const member of team.members) {
        const userDoc = await mongoose.connection.db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(member.userId) });
        const collegeDoc = userDoc?.collegeId ? await mongoose.connection.db.collection('colleges').findOne({ _id: userDoc.collegeId }) : null;

        const leaderboardEntry = await mongoose.connection.db.collection('leaderboards').findOne({ 
          eventId: new mongoose.Types.ObjectId(eventId), 
          userId: member.userId 
        });
        
        if (leaderboardEntry) {
          await mongoose.connection.db.collection('leaderboards').updateOne(
            { _id: leaderboardEntry._id },
            { $set: { score: Number(score), lastUpdated: new Date() } }
          );
        } else {
          await mongoose.connection.db.collection('leaderboards').insertOne({
            eventId: new mongoose.Types.ObjectId(eventId),
            userId: member.userId,
            userName: userDoc ? `${userDoc.firstName} ${userDoc.lastName}` : 'Unknown Participant',
            score: Number(score),
            achievements: ['Project Submitted'],
            college: collegeDoc ? collegeDoc.name : 'Unknown College',
            createdAt: new Date(),
            lastUpdated: new Date(),
            __v: 0
          });
        }
      }
    }
    
    res.json({ message: 'Submission scored successfully and leaderboard updated', submission });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
