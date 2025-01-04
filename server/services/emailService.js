const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  debug: true, // Enable debug logging
  logger: true  // Enable built-in logger
});

// Verify transporter on startup
transporter.verify(function(error, success) {
  if (error) {
    console.error('Email transporter verification failed:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

// Function to send event notification to all users
const sendEventNotification = async (users, event) => {
  try {
    console.log('Starting to send event notifications...');
    console.log('Number of users to notify:', users.length);
    console.log('Event details:', {
      title: event.title,
      description: event.description,
      date: event.date,
      location: event.location || event.venue
    });

    const emailPromises = users.map(async user => {
      try {
        console.log(`Preparing email for ${user.email}`);
        
        const formattedDate = new Date(event.date).toLocaleString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        const mailOptions = {
          from: {
            name: 'EventHub',
            address: process.env.EMAIL_USER
          },
          to: user.email,
          subject: `New Event Approved: ${event.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
                New Event: ${event.title}
              </h2>
              <div style="padding: 20px; background-color: #f9f9f9; border-radius: 5px;">
                <p><strong style="color: #2c3e50;">Description:</strong><br>
                ${event.description}</p>
                <p><strong style="color: #2c3e50;">Date:</strong><br>
                ${formattedDate}</p>
                <p><strong style="color: #2c3e50;">Location:</strong><br>
                ${event.location || event.venue}</p>
              </div>
              <div style="margin-top: 20px; padding: 20px; background-color: #e8f4f8; border-radius: 5px;">
                <p style="margin: 0;">We hope to see you there!</p>
              </div>
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="color: #7f8c8d; font-size: 14px;">Best regards,<br>EventHub Team</p>
              </div>
            </div>
          `,
          // Add text version as fallback
          text: `
            New Event: ${event.title}
            
            Description: ${event.description}
            
            Date: ${formattedDate}
            
            Location: ${event.location || event.venue}
            
            We hope to see you there!
            
            Best regards,
            EventHub Team
          `
        };

        console.log(`Sending email to ${user.email}...`);
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${user.email}:`, info.response);
        return { success: true, email: user.email, messageId: info.messageId };
      } catch (error) {
        console.error(`Failed to send email to ${user.email}:`, error);
        return { success: false, email: user.email, error: error.message };
      }
    });

    const results = await Promise.all(emailPromises);
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`
Email notification summary:
------------------------
Total attempted: ${results.length}
Successful: ${successful.length}
Failed: ${failed.length}
    `);

    if (failed.length > 0) {
      console.error('Failed email deliveries:', failed);
    }

    return {
      totalAttempted: results.length,
      successful: successful.length,
      failed: failed.length,
      failedEmails: failed,
      successfulEmails: successful
    };
  } catch (error) {
    console.error('Error in sendEventNotification:', error);
    throw error;
  }
};

module.exports = {
  sendEventNotification
}; 