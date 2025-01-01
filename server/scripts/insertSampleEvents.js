const mongoose = require('mongoose');
const Event = require('../models/Event');
const User = require('../models/User');

async function insertSampleEvents() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/eventManagement', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Find or create an admin user
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      adminUser = await User.create({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin',
        status: 'active'
      });
    }

    // Sample events data
    const sampleEvents = [
      {
        title: 'Annual Student Assembly',
        description: 'Join us for the annual student assembly where we will discuss upcoming plans and activities.',
        date: new Date('2024-03-15'),
        location: 'Main Auditorium',
        status: 'approved',
        createdBy: adminUser._id,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      },
      {
        title: 'Career Fair 2024',
        description: 'Connect with top companies and explore career opportunities.',
        date: new Date('2024-03-20'),
        location: 'University Gymnasium',
        status: 'approved',
        createdBy: adminUser._id,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      },
      {
        title: 'Tech Workshop Series',
        description: 'Learn the latest technologies through hands-on workshops.',
        date: new Date('2024-03-25'),
        location: 'Computer Laboratory',
        status: 'pending',
        createdBy: adminUser._id
      },
      {
        title: 'Sports Festival',
        description: 'Annual sports competition featuring various sports events.',
        date: new Date('2024-04-01'),
        location: 'Sports Complex',
        status: 'approved',
        createdBy: adminUser._id,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      },
      {
        title: 'Cultural Night',
        description: 'Celebrate diversity through cultural performances and exhibitions.',
        date: new Date('2024-04-05'),
        location: 'University Theater',
        status: 'approved',
        createdBy: adminUser._id,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      }
    ];

    // Clear existing events
    await Event.deleteMany({});
    console.log('Cleared existing events');

    // Insert sample events
    const insertedEvents = await Event.insertMany(sampleEvents);
    console.log('Inserted sample events:', insertedEvents);

    console.log('Sample data insertion complete!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

insertSampleEvents(); 