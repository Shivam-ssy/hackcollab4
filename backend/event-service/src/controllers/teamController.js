const Team = require('../models/Team');
const Event = require('../models/Event');
const Participation = require('../models/Participation');
const Submission = require('../models/Submission');
const mongoose = require('mongoose');

exports.createTeam = async (req, res) => {
  try {
    const { name, eventId } = req.body;
    const userId = req.user.userId;

    // Check participation and payment
    const participation = await Participation.findOne({ userId, eventId, paymentStatus: 'PAID' });
    if (!participation) return res.status(403).json({ message: 'You must pay for the hackathon before creating a team' });

    // Check if user is already in a team for this event
    const existingTeam = await Team.findOne({
      eventId,
      $or: [{ leaderId: userId }, { 'members.userId': userId }]
    });
    if (existingTeam) return res.status(400).json({ message: 'You are already in a team for this event' });

    const team = new Team({
      name,
      eventId,
      leaderId: userId,
      members: [{ userId }] // leader is automatically a member
    });

    await team.save();
    res.status(201).json({ message: 'Team created', team });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.requestJoin = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.userId;

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    const existingSubmission = await Submission.findOne({ teamId });
    if (existingSubmission) {
      return res.status(400).json({ message: 'Cannot join a team that has already submitted their project' });
    }

    const participation = await Participation.findOne({ userId, eventId: team.eventId, paymentStatus: 'PAID' });
    if (!participation) return res.status(403).json({ message: 'You must register and pay for the hackathon first' });

    // Check if already in this team or requested
    if (team.members.some(m => m.userId === userId)) return res.status(400).json({ message: 'Already a member' });
    if (team.pendingRequests.some(r => r.userId === userId)) return res.status(400).json({ message: 'Request already sent' });

    // Check max team size
    const event = await Event.findById(team.eventId);
    if (team.members.length >= (event.maxTeamSize || 4)) return res.status(400).json({ message: 'Team is full' });

    team.pendingRequests.push({ userId });
    await team.save();

    res.json({ message: 'Join request sent', team });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.approveJoin = async (req, res) => {
  try {
    const { teamId, targetUserId } = req.params;
    const userId = req.user.userId;

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    if (team.leaderId !== userId) return res.status(403).json({ message: 'Only team leader can approve requests' });

    const existingSubmission = await Submission.findOne({ teamId });
    if (existingSubmission) {
      return res.status(400).json({ message: 'Cannot approve members after the project has been submitted' });
    }

    const requestIndex = team.pendingRequests.findIndex(r => r.userId === targetUserId);
    if (requestIndex === -1) return res.status(404).json({ message: 'Request not found' });

    const event = await Event.findById(team.eventId);
    if (team.members.length >= (event.maxTeamSize || 4)) return res.status(400).json({ message: 'Team is full' });

    // Move to members
    team.pendingRequests.splice(requestIndex, 1);
    team.members.push({ userId: targetUserId });
    
    await team.save();
    res.json({ message: 'Request approved', team });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addMember = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { email } = req.body;
    const userId = req.user.userId;

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    if (team.leaderId !== userId) return res.status(403).json({ message: 'Only team leader can add members' });

    const existingSubmission = await Submission.findOne({ teamId });
    if (existingSubmission) {
      return res.status(400).json({ message: 'Cannot add members after the project has been submitted' });
    }

    if (!email) return res.status(400).json({ message: 'Target email is required' });

    // Look up user by email directly in the auth collection since they share the same DB
    const userDoc = await mongoose.connection.db.collection('users').findOne({ email });
    if (!userDoc) return res.status(404).json({ message: 'User not found with this email' });

    const targetUserId = userDoc._id.toString();

    // Ensure target user is registered and paid
    const participation = await Participation.findOne({ userId: targetUserId, eventId: team.eventId, paymentStatus: 'PAID' });
    if (!participation) return res.status(400).json({ message: 'Target user must register and pay for the hackathon first' });

    // Check if target user is already in another team
    const existingTeam = await Team.findOne({
      eventId: team.eventId,
      $or: [{ leaderId: targetUserId }, { 'members.userId': targetUserId }]
    });
    if (existingTeam) return res.status(400).json({ message: 'Target user is already in a team for this event' });

    // Check max team size
    const event = await Event.findById(team.eventId);
    if (team.members.length >= (event.maxTeamSize || 4)) return res.status(400).json({ message: 'Team is full' });

    team.members.push({ userId: targetUserId });
    
    // Remove from pending requests if they were there
    team.pendingRequests = team.pendingRequests.filter(r => r.userId !== targetUserId);

    await team.save();
    res.json({ message: 'Member added successfully', team });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getTeamsForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const teams = await Team.find({ eventId });
    res.json(teams);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
