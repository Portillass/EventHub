const { createFeedbackForm, submitFeedback } = require('../services/googleForms');
const Event = require('../models/Event');
const Feedback = require('../models/Feedback');
const excel = require('exceljs');

// Store form IDs and URLs for each event
const eventForms = new Map();

exports.submitFeedback = async (req, res) => {
  try {
    const { studentId, eventId, message, rating } = req.body;

    // Validate required fields
    if (!studentId || !eventId || !message || !rating) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Get event details
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Create feedback in database
    const feedback = new Feedback({
      studentId,
      eventId,
      message,
      rating
    });

    // Save feedback to database
    await feedback.save();

    try {
      // Get or create form for this event
      let formData = eventForms.get(eventId);
      if (!formData) {
        const formId = await createFeedbackForm(`${event.title} - Feedback Form`);
        formData = { formId };
        eventForms.set(eventId, formData);
      }

      // Submit feedback to Google Form
      await submitFeedback(formData.formId, {
        studentId,
        eventTitle: event.title,
        message,
        rating: getRatingText(rating)
      });

      // Return success with form URL if available
      res.status(200).json({ 
        message: 'Feedback submitted successfully',
        formUrl: formData.formUrl
      });
    } catch (googleError) {
      console.error('Google Forms API Error:', googleError);
      // If there's a Google Forms API error, feedback is still saved in database
      res.status(200).json({ 
        message: 'Feedback recorded successfully',
        warning: 'Could not sync with Google Forms'
      });
    }
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ 
      message: 'Failed to submit feedback',
      error: error.message 
    });
  }
};

// Get all feedback records
exports.getFeedbackRecords = async (req, res) => {
  try {
    console.log('Fetching feedback records...');
    console.log('User:', req.user);

    const feedbacks = await Feedback.find()
      .populate('eventId', 'title')
      .sort({ createdAt: -1 });

    console.log('Found feedbacks:', feedbacks);

    const formattedFeedbacks = feedbacks.map(feedback => ({
      _id: feedback._id,
      studentId: feedback.studentId,
      eventId: feedback.eventId?._id,
      eventTitle: feedback.eventId?.title || 'Unknown Event',
      message: feedback.message,
      rating: feedback.rating,
      createdAt: feedback.createdAt
    }));

    console.log('Formatted feedbacks:', formattedFeedbacks);
    res.json(formattedFeedbacks);
  } catch (error) {
    console.error('Error fetching feedback records:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      message: 'Failed to fetch feedback records',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Export feedback records to Excel
exports.exportFeedbackRecords = async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .populate('eventId', 'title')
      .sort({ createdAt: -1 });

    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('Feedback Records');

    // Add headers
    worksheet.addRow([
      'Student ID',
      'Event',
      'Message',
      'Rating',
      'Date'
    ]);

    // Add data
    feedbacks.forEach(feedback => {
      worksheet.addRow([
        feedback.studentId,
        feedback.eventId?.title || 'Unknown Event',
        feedback.message,
        feedback.rating,
        new Date(feedback.createdAt).toLocaleString()
      ]);
    });

    // Style the worksheet
    worksheet.getRow(1).font = { bold: true };
    worksheet.columns.forEach(column => {
      column.width = 20;
    });

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=feedback_records.xlsx'
    );

    // Send the workbook
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting feedback records:', error);
    res.status(500).json({ message: 'Failed to export feedback records' });
  }
};

// Helper function to convert rating number to text
function getRatingText(rating) {
  switch (rating) {
    case 5:
      return '⭐⭐⭐⭐⭐ Excellent';
    case 4:
      return '⭐⭐⭐⭐ Very Good';
    case 3:
      return '⭐⭐⭐ Good';
    case 2:
      return '⭐⭐ Fair';
    case 1:
      return '⭐ Poor';
    default:
      return 'Not Rated';
  }
} 