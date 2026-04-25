const Event = require('../models/Event');
const Participation = require('../models/Participation');

exports.createEvent = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    // Check permission logic
    if (!req.user.permissions.includes('CREATE_EVENT')) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }

    const { title, description, startDate, endDate, registrationFee } = req.body;
    
    // We enforce that the event belongs to the same college as the creator
    if (!req.user.collegeId) {
      return res.status(400).json({ message: 'User does not belong to any college' });
    }

    const event = new Event({
      title,
      description,
      startDate,
      endDate,
      registrationFee,
      collegeId: req.user.collegeId,
      createdBy: req.user.userId
    });

    await event.save();
    res.status(201).json({ message: 'Event created', event });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getEvents = async (req, res) => {
  try {
    // If not logged in, they can't access this (or we could allow public access)
    // Assume we filter by user's collegeId so it's a multi-tenant isolation
    if (!req.user || !req.user.collegeId) {
      return res.status(403).json({ message: 'Access denied. Context required.' });
    }

    const events = await Event.find({ collegeId: req.user.collegeId });
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.joinEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Enforce multi-tenancy: user can only join events of their own college
    if (event.collegeId.toString() !== req.user.collegeId) {
      return res.status(403).json({ message: 'Cannot join events from other colleges' });
    }

    let participation = await Participation.findOne({ userId: req.user.userId, eventId });
    if (participation) {
      return res.status(400).json({ message: 'You have already joined this event' });
    }

    participation = new Participation({
      userId: req.user.userId,
      eventId,
      paymentStatus: event.registrationFee > 0 ? 'PENDING' : 'PAID',
      amountPaid: 0
    });

    await participation.save();
    res.status(201).json({ message: 'Successfully joined event', participation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.handlePayment = async (req, res) => {
  try {
    const { participationId } = req.params;
    const { amount } = req.body;

    const participation = await Participation.findById(participationId);
    if (!participation) return res.status(404).json({ message: 'Participation not found' });

    const event = await Event.findById(participation.eventId);
    
    // Simple logic: if they pay the required fee
    if (amount >= event.registrationFee) {
      participation.paymentStatus = 'PAID';
      participation.amountPaid = amount;
      await participation.save();
      return res.json({ message: 'Payment successful', participation });
    } else {
      return res.status(400).json({ message: 'Insufficient amount' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
