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
    
    // Only COLLEGE_ADMIN or SUPER_ADMIN should be able to score (handled by gateway)
    
    const submission = await Submission.findOne({ _id: submissionId, eventId });
    if (!submission) return res.status(404).json({ message: 'Submission not found' });
    
    submission.score = score;
    submission.feedback = feedback;
    await submission.save();

    // Ideally, here we would make an HTTP call to the Leaderboard microservice
    // to update the leaderboard using axios, e.g., axios.put('http://leaderboard-service/...')
    // For now, we simulate the integration since they share a DB anyway if we imported it, 
    // but sticking to microservices we return success so the frontend knows it's scored.
    
    res.json({ message: 'Submission scored successfully', submission });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
