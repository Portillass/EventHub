const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

module.exports = function(passport) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    proxy: true
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if the email matches admin email
      const isAdmin = profile.emails[0].value === process.env.ADMIN_EMAIL;
      
      // Check if user exists
      let user = await User.findOne({ email: profile.emails[0].value });
      
      if (user) {
        // If user exists, update their Google-specific info
        user.googleId = profile.id;
        if (isAdmin) {
          user.role = 'admin';
          user.status = 'active';
        }
        await user.save();
        return done(null, user);
      }
      
      if (isAdmin) {
        // Create admin user if it's the admin email
        user = await User.create({
          googleId: profile.id,
          email: profile.emails[0].value,
          fullName: profile.displayName,
          role: 'admin',
          status: 'active',
          studentId: 'ADMIN',
          course: 'ADMIN',
          yearLevel: 'ADMIN',
          password: Math.random().toString(36).slice(-8) // Random password for Google auth
        });
        return done(null, user);
      }

      // For non-admin users, they should sign up through the regular process
      return done(null, false, { message: 'Please sign up through the registration form' });
    } catch (error) {
      console.error('Google Strategy Error:', error);
      return done(error, null);
    }
  }));

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
}; 