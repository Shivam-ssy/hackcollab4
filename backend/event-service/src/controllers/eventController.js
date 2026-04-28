const Event = require('../models/Event');
const Participation = require('../models/Participation');

exports.createEvent = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    // Check permission logic
    if (!req.user.permissions.includes('CREATE_EVENT')) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }

    const { title, description, startDate, endDate, registrationFee, maxTeamSize, location, image, tags } = req.body;
    
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
      maxTeamSize: maxTeamSize || 4,
      location,
      image: image || '',
      tags: tags || [],
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
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    let query = {};
    
    // If the user is a college admin, organizer, or student, they only see their college's events
    if (req.user.role === 'COLLEGE_ADMIN' || req.user.role === 'organizer' || req.user.role === 'STUDENT') {
      if (!req.user.collegeId) {
        return res.status(403).json({ message: 'Access denied. College context required.' });
      }
      query.collegeId = req.user.collegeId;
    }
    // SUPER_ADMIN and COMPANY_ADMIN can see all events (or we could filter public ones)
    
    const events = await Event.find(query);
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

exports.getMyRegistrations = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    // Find all participations for this user
    const participations = await Participation.find({ userId: req.user.userId });
    
    // Get the event details for those participations
    const eventIds = participations.map(p => p.eventId);
    const events = await Event.find({ _id: { $in: eventIds } });

    // Combine them
    const combined = events.map(event => {
      const p = participations.find(part => part.eventId.toString() === event._id.toString());
      return {
        event,
        participation: p
      };
    });

    res.json(combined);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json({ data: event });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    
    if (event.createdBy.toString() !== req.user.userId && !req.user.permissions.includes('MANAGE_PLATFORM')) {
      return res.status(403).json({ message: 'Not authorized to update this event' });
    }

    const updatedEvent = await Event.findByIdAndUpdate(req.params.eventId, req.body, { new: true });
    res.json(updatedEvent);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    
    if (event.createdBy.toString() !== req.user.userId && !req.user.permissions.includes('MANAGE_PLATFORM')) {
      return res.status(403).json({ message: 'Not authorized to delete this event' });
    }

    await Event.findByIdAndDelete(req.params.eventId);
    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.cancelRegistration = async (req, res) => {
  try {
    const { eventId } = req.params;
    const participation = await Participation.findOneAndDelete({ eventId, userId: req.user.userId });
    if (!participation) return res.status(404).json({ message: 'Registration not found' });
    res.json({ message: 'Registration cancelled' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getEventParticipants = async (req, res) => {
  try {
    const { eventId } = req.params;
    const participations = await Participation.find({ eventId });
    // In a real scenario we might fetch user details using a User service or model, 
    // but returning participations will give the count at least.
    res.json({ data: participations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getOrganizerStats = async (req, res) => {
  try {
    if (!req.user || !req.user.collegeId) {
      return res.status(401).json({ message: 'Unauthorized or missing college context' });
    }

    const events = await Event.find({ collegeId: req.user.collegeId });
    const eventIds = events.map(e => e._id);
    
    const participations = await Participation.find({ eventId: { $in: eventIds } });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const activeEvents = events.filter(e => {
      if(!e.startDate) return false;
      const d = new Date(e.startDate);
      return d >= today && d < tomorrow;
    }).length;

    const upcomingEvents = events.filter(e => {
      if(!e.startDate) return false;
      return new Date(e.startDate) >= tomorrow;
    }).length;

    const totalRegistrations = participations.length;
    const revenue = participations.reduce((sum, p) => p.paymentStatus === 'PAID' ? sum + p.amountPaid : sum, 0);

    res.json({
      totalEvents: events.length,
      activeEvents,
      upcomingEvents,
      totalRegistrations,
      revenue
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAdminEventStats = async (req, res) => {
  try {
    const events = await Event.find({});
    const participations = await Participation.find({});

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const activeEvents = events.filter(e => {
      if(!e.startDate) return false;
      const d = new Date(e.startDate);
      return d >= today && d < tomorrow;
    }).length;

    const upcomingEvents = events.filter(e => {
      if(!e.startDate) return false;
      return new Date(e.startDate) >= tomorrow;
    }).length;

    const totalRegistrations = participations.length;
    const revenue = participations.reduce((sum, p) => p.paymentStatus === 'PAID' ? sum + p.amountPaid : sum, 0);

    res.json({
      totalEvents: events.length,
      activeEvents,
      upcomingEvents,
      totalRegistrations,
      revenue
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
