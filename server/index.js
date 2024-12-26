const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const authRoutes = require('./routes/auth');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', authRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Event Management System API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Function to find an available port
const findAvailablePort = async (startPort) => {
  const maxPort = 65535; // Maximum valid port number
  let currentPort = parseInt(startPort);

  while (currentPort <= maxPort) {
    try {
      await new Promise((resolve, reject) => {
        const server = app.listen(currentPort)
          .once('listening', () => {
            server.close();
            resolve(currentPort);
          })
          .once('error', (err) => {
            if (err.code === 'EADDRINUSE') {
              resolve(null);
            } else {
              reject(err);
            }
          });
      });

      return currentPort;
    } catch (error) {
      console.error(`Error trying port ${currentPort}:`, error);
    }
    currentPort++;
  }

  throw new Error('No available ports found');
};

// Start server
const startServer = async () => {
  try {
    const desiredPort = process.env.PORT || 2025;
    const availablePort = await findAvailablePort(desiredPort);
    
    if (!availablePort) {
      throw new Error('No available ports found');
    }

    app.listen(availablePort, () => {
      console.log(`Server is running on port ${availablePort}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
