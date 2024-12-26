const express = require('express');
const router = express.Router();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { verifyRecaptcha } = require('../middleware/recaptcha');

// Google OAuth configuration
try {
  const googleConfig = {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    proxy: true
  };

  // Initialize Google Strategy only if credentials are available
  if (googleConfig.clientID && googleConfig.clientSecret && googleConfig.callbackURL) {
    passport.use(new GoogleStrategy(googleConfig, async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if the email matches admin email
        const isAdmin = profile.emails[0].value === process.env.ADMIN_EMAIL;
        
        const userData = {
          googleId: profile.id,
          email: profile.emails[0].value,
          name: profile.displayName,
          picture: profile.photos[0].value,
          role: isAdmin ? 'admin' : 'student' // Set role based on email
        };

        // Here you would typically save this to your database
        // For now, we'll just pass it through
        done(null, userData);
      } catch (error) {
        done(error, null);
      }
    }));
  } else {
    console.warn('Google OAuth credentials not properly configured');
  }
} catch (error) {
  console.error('Error configuring Google OAuth:', error);
}

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    try {
      const user = req.user;
      
      // Check if user is admin
      if (user.email === process.env.ADMIN_EMAIL) {
        req.session.user = {
          ...user,
          role: 'admin'
        };
        return res.redirect(`${process.env.CLIENT_URL}/admin`);
      }

      // Set regular user session data
      req.session.user = {
        ...user,
        role: 'student'
      };
      
      res.redirect(`${process.env.CLIENT_URL}/student`);
    } catch (error) {
      console.error('Error during Google callback:', error);
      res.redirect(`${process.env.CLIENT_URL}/?error=auth_failed`);
    }
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
    // Your login logic here
    res.json({ message: 'Login successful' });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

// Signup route with reCAPTCHA verification
router.post('/signup', verifyRecaptcha, async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    // Your signup logic here
    res.json({ message: 'Signup successful' });
  } catch (error) {
    res.status(500).json({ message: 'Signup failed', error: error.message });
  }
});

module.exports = router;