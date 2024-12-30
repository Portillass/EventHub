const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const { verifyRecaptcha } = require('../middleware/recaptcha');

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })
);

router.get('/google/callback',
  (req, res, next) => {
    passport.authenticate('google', (err, user, info) => {
      if (err) {
        console.error('Google Auth Error:', err);
        return res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
      }
      
      if (!user) {
        console.log('No user found:', info);
        return res.redirect(`${process.env.CLIENT_URL}/login?error=unauthorized`);
      }

      req.logIn(user, (err) => {
        if (err) {
          console.error('Login Error:', err);
          return res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
        }

        // Set session data
        req.session.user = {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          status: user.status
        };

        // Save session before redirect
        req.session.save((err) => {
          if (err) {
            console.error('Session Save Error:', err);
            return res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
          }

          // Redirect based on role and status
          if (user.status === 'pending') {
            return res.redirect(`${process.env.CLIENT_URL}/pending`);
          }

          if (user.role === 'admin') {
            return res.redirect(`${process.env.CLIENT_URL}/dashboard`);
          } else if (user.role === 'officer') {
            return res.redirect(`${process.env.CLIENT_URL}/officer`);
          } else {
            return res.redirect(`${process.env.CLIENT_URL}/student`);
          }
        });
      });
    })(req, res, next);
  }
);

// Get current user
router.get('/current-user', (req, res) => {
  try {
    if (req.session && req.session.user) {
      res.json({
        isAuthenticated: true,
        user: req.session.user
      });
    } else {
      res.json({
        isAuthenticated: false,
        user: null
      });
    }
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({
      isAuthenticated: false,
      user: null,
      error: 'Failed to get user data'
    });
  }
});

// Logout route
router.post('/logout', (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Could not log out, please try again' });
      }
      res.clearCookie('connect.sid');
      res.json({ message: 'Logged out successfully' });
    });
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({ message: 'Logout failed', error: error.message });
  }
});

// Login route with reCAPTCHA verification
router.post('/login', verifyRecaptcha, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is pending
    if (user.status === 'pending') {
      return res.status(403).json({ 
        message: 'Your account is pending approval' 
      });
    }

    // Check if user is archived
    if (user.status === 'archived') {
      return res.status(403).json({ 
        message: 'Your account has been archived' 
      });
    }

    // Set session
    req.session.user = {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.status
    };

    res.json({ 
      message: 'Login successful',
      user: req.session.user
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Login failed', 
      error: error.message 
    });
  }
});

// Signup route with reCAPTCHA verification
router.post('/signup', verifyRecaptcha, async (req, res) => {
  try {
    const { fullName, email, password, studentId, course, yearLevel } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { studentId }] 
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this email or student ID already exists' 
      });
    }

    // Create new user
    const user = new User({
      fullName,
      email,
      password,
      studentId,
      course,
      yearLevel,
      status: 'pending'
    });

    await user.save();

    // Send email to admin
    const adminMailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: 'New User Registration - EventHub',
      html: `
        <h1>New User Registration</h1>
        <p>A new user has registered and is pending approval:</p>
        <ul>
          <li>Name: ${fullName}</li>
          <li>Email: ${email}</li>
          <li>Student ID: ${studentId}</li>
          <li>Course: ${course}</li>
          <li>Year Level: ${yearLevel}</li>
        </ul>
        <p>Please log in to the admin dashboard to review this registration.</p>
      `
    };

    await transporter.sendMail(adminMailOptions);

    res.status(201).json({ 
      message: 'Signup successful. Please wait for admin approval.' 
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      message: 'Signup failed', 
      error: error.message 
    });
  }
});

module.exports = router;