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

// Middleware to check if user is admin or officer
const isAdminOrOfficer = (req, res, next) => {
  if (req.session?.user?.role === 'admin' || req.session?.user?.role === 'officer') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied' });
  }
};

// Get all users
router.get('/all', isAdminOrOfficer, async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
});

// Get all pending users
router.get('/pending', isAdminOrOfficer, async (req, res) => {
  try {
    const pendingUsers = await User.find({ status: 'pending' });
    res.json(pendingUsers);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch pending users', error: error.message });
  }
});

// Get user statistics
router.get('/stats', isAdminOrOfficer, async (req, res) => {
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
router.post('/:userId/approve', isAdminOrOfficer, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Only admin can approve officers
    if (role === 'officer' && req.session.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can approve officers' });
    }

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
router.post('/:userId/archive', isAdminOrOfficer, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if target user is admin or officer
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only admin can archive officers
    if (targetUser.role === 'officer' && req.session.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can archive officers' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { status: 'archived' },
      { new: true }
    );

    res.json({ message: 'User archived successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to archive user', error: error.message });
  }
});

// Delete user
router.post('/:userId/delete', isAdminOrOfficer, async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if target user is admin or officer
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only admin can delete officers
    if (targetUser.role === 'officer' && req.session.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can delete officers' });
    }

    const user = await User.findByIdAndDelete(userId);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
});

module.exports = router; 