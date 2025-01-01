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
    const { fullName, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'Email already registered' 
      });
    }

    // Check if it's the admin email
    const isAdmin = email === process.env.ADMIN_EMAIL;

    // Create new user with appropriate status and role
    const user = new User({
      fullName,
      email,
      password,
      status: isAdmin ? 'active' : 'pending',
      role: isAdmin ? 'admin' : 'student'
    });

    await user.save();

    // If it's not admin, send notification emails
    if (!isAdmin) {
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
          </ul>
          <p>Please log in to the admin dashboard to review this registration.</p>
        `
      };

      await transporter.sendMail(adminMailOptions);

      // Send confirmation email to user
      const userMailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Welcome to EventHub - Registration Received',
        html: `
          <h1>Welcome to EventHub!</h1>
          <p>Dear ${fullName},</p>
          <p>Your registration has been received and is pending admin approval.</p>
          <p>You will receive another email once your account has been reviewed.</p>
          <p>Thank you for your patience!</p>
        `
      };

      await transporter.sendMail(userMailOptions);

      return res.status(201).json({ 
        message: 'Registration successful. Please wait for admin approval.' 
      });
    }

    // For admin account
    res.status(201).json({ 
      message: 'Admin account created successfully. You can now log in.' 
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      message: 'Registration failed', 
      error: error.message 
    });
  }
});

module.exports = router;