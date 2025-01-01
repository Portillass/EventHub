const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const User = require('../models/User');

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.session?.user?.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied' });
  }
};

// Get all users
router.get('/all', isAdmin, async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
});

// Get all pending users
router.get('/pending', isAdmin, async (req, res) => {
  try {
    const pendingUsers = await User.find({ status: 'pending' });
    res.json(pendingUsers);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch pending users', error: error.message });
  }
});

// Get user statistics
router.get('/stats', isAdmin, async (req, res) => {
  try {
    const stats = {
      totalPending: await User.countDocuments({ status: 'pending' }),
      totalStudents: await User.countDocuments({ role: 'student', status: 'active' }),
      totalOfficers: await User.countDocuments({ role: 'officer', status: 'active' })
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user stats', error: error.message });
  }
});

// Approve user
router.post('/:userId/approve', isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { 
        status: 'active',
        role: role
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Send approval email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Account Approved - EventHub',
      html: `
        <h1>Your Account Has Been Approved!</h1>
        <p>Dear ${user.fullName},</p>
        <p>Your account has been approved as a ${role}. You can now log in to EventHub.</p>
        <p>Best regards,<br>EventHub Team</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: 'User approved successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to approve user', error: error.message });
  }
});

// Archive user
router.post('/:userId/archive', isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndUpdate(
      userId,
      { status: 'archived' },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User archived successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to archive user', error: error.message });
  }
});

// Delete user
router.post('/:userId/delete', isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
});

module.exports = router; 