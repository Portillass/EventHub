const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const User = require('../models/User');
const { authenticateToken, checkRole } = require('../middleware/auth');
const { sendEventNotification } = require('../services/emailService');
const { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } = require('../services/calendarService');
const { generateQRCode } = require('../services/qrService');

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
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Validate required fields
    if (!req.body.title || !req.body.description || !req.body.date || !req.body.location) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const event = new Event({
      title: req.body.title,
      description: req.body.description,
      date: new Date(req.body.date),
      location: req.body.location || req.body.venue,
      feedbackUrl: req.body.feedbackUrl || '',
      status: req.body.status || 'pending',
      createdBy: req.user.id
    });

    // Save event to database first
    const newEvent = await event.save();

    // Try to create Google Calendar event
    try {
      const calendarEvent = await createCalendarEvent(newEvent);
      if (calendarEvent && calendarEvent.id) {
        newEvent.calendarEventId = calendarEvent.id;
        await newEvent.save();
      }
    } catch (calendarError) {
      console.error('Failed to create calendar event:', calendarError);
      // Don't fail the entire request if calendar creation fails
    }

    res.status(201).json({
      message: 'Event created successfully',
      event: newEvent
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(400).json({ 
      message: 'Failed to create event',
      error: error.message 
    });
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

      // Get all active users to send notifications
      console.log('Event approved, sending notifications...');
      const activeUsers = await User.find({ status: 'active' });
      console.log('Found active users:', activeUsers.length);
      
      // Send email notifications
      const emailResult = await sendEventNotification(activeUsers, event);
      console.log('Email notification result:', emailResult);

      await event.save();

      return res.json({ 
        message: 'Event approved successfully',
        event: event,
        emailStats: emailResult
      });
    }

    const updatedEvent = await event.save();
    res.json(updatedEvent);
  } catch (error) {
    console.error('Error updating event status:', error);
    res.status(500).json({ 
      message: 'Error updating event status',
      error: error.message 
    });
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
    if (req.body.date) event.date = new Date(req.body.date);
    if (req.body.location || req.body.venue) event.location = req.body.location || req.body.venue;
    if (req.body.status) event.status = req.body.status;
    if (req.body.feedbackUrl !== undefined) event.feedbackUrl = req.body.feedbackUrl;

    // Update Google Calendar event if it exists
    if (event.calendarEventId) {
      await updateCalendarEvent(event.calendarEventId, event);
    }

    const updatedEvent = await event.save();
    res.json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete event (officers and admins)
router.delete('/:id', authenticateToken, checkRole(['officer', 'admin']), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Delete Google Calendar event if it exists
    if (event.calendarEventId) {
      await deleteCalendarEvent(event.calendarEventId);
    }

    await event.deleteOne();
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Approve event route
router.post('/:id/approve', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    event.status = 'approved';
    event.approvedBy = req.user.id;
    event.approvedAt = new Date();
    await event.save();

    console.log('Event approved successfully:', event._id);

    // Get all active users to send notifications
    const activeUsers = await User.find({ status: 'active' });
    console.log('Found active users:', activeUsers.length);
    
    // Send email notifications
    const emailResult = await sendEventNotification(activeUsers, event);
    console.log('Email notification result:', emailResult);

    res.json({ 
      message: 'Event approved successfully',
      emailStats: emailResult
    });
  } catch (error) {
    console.error('Error in event approval process:', error);
    res.status(500).json({ 
      message: 'Error approving event',
      error: error.message 
    });
  }
});

// Add this new route for QR code generation
router.get('/:id/qr', authenticateToken, checkRole(['officer']), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const qrCodeDataUrl = await generateQRCode(event._id);
    res.json({ qrCode: qrCodeDataUrl });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ message: 'Failed to generate QR code' });
  }
});

module.exports = router; 