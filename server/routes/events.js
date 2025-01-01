const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Get all events (filtered by status and role)
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = {};
    
    // Students can only see approved events
    if (req.user.role === 'student') {
      query.status = 'approved';
    }
    // Officers can only see their own events
    else if (req.user.role === 'officer') {
      query.createdBy = req.user.id;
    }
    // Admins can see all events

    const events = await Event.find(query)
      .populate('createdBy', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create event (Officers only)
router.post('/', authenticateToken, authorizeRoles(['officer']), async (req, res) => {
  try {
    // Validate required fields
    const { title, description, date, location } = req.body;
    if (!title || !description || !date || !location) {
      return res.status(400).json({
        message: 'Missing required fields',
        required: ['title', 'description', 'date', 'location'],
        received: req.body
      });
    }

    // Create new event
    const event = new Event({
      title: title,
      description: description,
      date: new Date(date),
      location: location,
      createdBy: req.user.id,
      status: 'pending'
    });

    const newEvent = await event.save();
    
    // Populate creator details before sending response
    await newEvent.populate('createdBy', 'firstName lastName email');
    
    res.status(201).json(newEvent);
  } catch (error) {
    console.error('Event creation error:', error);
    res.status(400).json({
      message: error.message,
      details: error.errors || error
    });
  }
});

// Update event (Officers can update their own events, Admins can update any event)
router.put('/:id', authenticateToken, authorizeRoles(['officer', 'admin']), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (req.user.role === 'officer' && event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this event' });
    }

    Object.assign(event, req.body);
    const updatedEvent = await event.save();
    res.json(updatedEvent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Approve/Archive event (Admin only)
router.post('/:id/status', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'archived'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    event.status = status;
    if (status === 'approved') {
      event.approvedBy = req.user._id;
      event.approvedAt = new Date();
    }

    const updatedEvent = await event.save();
    res.json(updatedEvent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete event (Officers can delete their own events, Admins can delete any event)
router.delete('/:id', authenticateToken, authorizeRoles(['officer', 'admin']), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (req.user.role === 'officer' && event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this event' });
    }

    await event.deleteOne();
    res.json({ message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 