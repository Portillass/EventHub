const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { authenticateToken, checkRole } = require('../middleware/auth');

// Get all events
router.get('/', async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get event by ID
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create event (officers only)
router.post('/', authenticateToken, checkRole(['officer']), async (req, res) => {
  try {
    const event = new Event({
      title: req.body.title,
      description: req.body.description,
      date: req.body.date,
      time: req.body.time,
      venue: req.body.venue,
      status: req.body.status || 'upcoming',
      createdBy: req.user._id
    });

    const newEvent = await event.save();
    res.status(201).json(newEvent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update event status (admin only)
router.post('/:id/status', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected', 'archived'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    event.status = status;
    if (status === 'approved') {
      event.approvedBy = req.user.id;
      event.approvedAt = new Date();
    }

    const updatedEvent = await event.save();
    res.json(updatedEvent);
  } catch (error) {
    console.error('Error updating event status:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update event (officers only)
router.patch('/:id', authenticateToken, checkRole(['officer']), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (req.body.title) event.title = req.body.title;
    if (req.body.description) event.description = req.body.description;
    if (req.body.date) event.date = req.body.date;
    if (req.body.time) event.time = req.body.time;
    if (req.body.venue) event.venue = req.body.venue;
    if (req.body.status) event.status = req.body.status;

    const updatedEvent = await event.save();
    res.json(updatedEvent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete event (officers only)
router.delete('/:id', authenticateToken, checkRole(['officer']), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    await event.deleteOne();
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 