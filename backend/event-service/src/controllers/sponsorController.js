const Event = require('../models/Event');

exports.sponsorEvent = async (req, res) => {
  try {
    if (req.user.role !== 'COMPANY_ADMIN') {
      return res.status(403).json({ message: 'Only Company Admins can sponsor events' });
    }

    const { eventId } = req.params;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid sponsorship amount is required' });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Assuming companyId is stored in user token for COMPANY_ADMIN
    const companyId = req.user.companyId || req.user.userId;

    // Check if already a sponsor, if so add to amount
    const existingSponsorIndex = event.sponsors.findIndex(s => s.companyId && s.companyId.toString() === companyId.toString());
    
    if (existingSponsorIndex >= 0) {
      event.sponsors[existingSponsorIndex].amount += amount;
    } else {
      event.sponsors.push({
        companyId,
        amount
      });
    }

    await event.save();

    res.json({ message: 'Sponsorship pledged successfully', event });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
