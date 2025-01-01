const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Get all events (filtered by role)
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = {};
    
    // Students can only see approved events
    if (req.user.role === 'student') {
      query = {
        status: 'approved',
        date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } // Start of today
      };
    }
    // Officers can only see their own events
    else if (req.user.role === 'officer') {
      query.createdBy = req.user.id;
    }
    // Admins can see all events

    const events = await Event.find(query)
      .populate('createdBy', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email')
      .sort({ date: 1 }); // Sort by date ascending for students to see upcoming events first

    // Format the response based on role
    const formattedEvents = events.map(event => {
      const eventObj = event.toObject();
      eventObj.date = new Date(eventObj.date).toISOString();
      return eventObj;
    });

    res.json(formattedEvents);
  } catch (error) {
    console.error('Error fetching events:', error);
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
      status: 'pending' // All new events start as pending
    });

    const newEvent = await event.save();
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

    // Officers can only update their own events
    if (req.user.role === 'officer' && event.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this event' });
    }

    // Don't allow status changes through this route
    const { status, ...updateData } = req.body;
    Object.assign(event, updateData);
    
    const updatedEvent = await event.save();
    await updatedEvent.populate('createdBy', 'firstName lastName email');
    if (updatedEvent.approvedBy) {
      await updatedEvent.populate('approvedBy', 'firstName lastName email');
    }
    
    res.json(updatedEvent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update event status (Admin only)
router.post('/:id/status', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'archived', 'pending'].includes(status)) {
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
    } else if (status === 'pending') {
      event.approvedBy = null;
      event.approvedAt = null;
    }

    const updatedEvent = await event.save();
    await updatedEvent.populate('createdBy', 'firstName lastName email');
    if (updatedEvent.approvedBy) {
      await updatedEvent.populate('approvedBy', 'firstName lastName email');
    }
    
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

    // Officers can only delete their own events
    if (req.user.role === 'officer' && event.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this event' });
    }

    await event.deleteOne();
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 