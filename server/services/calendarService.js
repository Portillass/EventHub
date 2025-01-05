const { google } = require('googleapis');

// Configure Google Calendar API
const calendar = google.calendar({
  version: 'v3',
  auth: new google.auth.JWT(
    process.env.GOOGLE_CLIENT_EMAIL,
    null,
    process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/calendar']
  )
});

// Validate Google Calendar credentials
const validateCredentials = () => {
  if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    throw new Error('Google Calendar credentials are not configured');
  }
};

const createCalendarEvent = async (event) => {
  try {
    validateCredentials();
    
    if (!event.title || !event.description || !event.date) {
      throw new Error('Missing required event details');
    }

    console.log('Creating calendar event for:', event.title);

    // Ensure date is valid
    const startDate = new Date(event.date);
    if (isNaN(startDate.getTime())) {
      throw new Error('Invalid event date');
    }

    // Calculate end date (2 hours after start)
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

    const calendarEvent = {
      summary: event.title,
      description: event.description,
      location: event.location || event.venue,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'Asia/Manila',
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'Asia/Manila',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 60 }, // 1 hour before
        ],
      },
      colorId: '1',
      transparency: 'opaque',
      visibility: 'public',
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: calendarEvent,
      sendUpdates: 'all'
    });

    console.log('Calendar event created:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw new Error(`Failed to create calendar event: ${error.message}`);
  }
};

const updateCalendarEvent = async (eventId, updatedEvent) => {
  try {
    validateCredentials();

    if (!eventId || !updatedEvent) {
      throw new Error('Missing event ID or updated event data');
    }

    console.log('Updating calendar event:', eventId);

    // Ensure date is valid
    const startDate = new Date(updatedEvent.date);
    if (isNaN(startDate.getTime())) {
      throw new Error('Invalid event date');
    }

    // Calculate end date (2 hours after start)
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

    const calendarEvent = {
      summary: updatedEvent.title,
      description: updatedEvent.description,
      location: updatedEvent.location || updatedEvent.venue,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'Asia/Manila',
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'Asia/Manila',
      },
    };

    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId: eventId,
      resource: calendarEvent,
      sendUpdates: 'all'
    });

    console.log('Calendar event updated:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating calendar event:', error);
    throw new Error(`Failed to update calendar event: ${error.message}`);
  }
};

const deleteCalendarEvent = async (eventId) => {
  try {
    validateCredentials();

    if (!eventId) {
      throw new Error('Missing event ID');
    }

    console.log('Deleting calendar event:', eventId);

    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
      sendUpdates: 'all'
    });

    console.log('Calendar event deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    throw new Error(`Failed to delete calendar event: ${error.message}`);
  }
};

module.exports = {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
}; 