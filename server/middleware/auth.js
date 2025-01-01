// Authentication middleware
const authenticateToken = (req, res, next) => {
  // Check if user is authenticated through session
  if (req.session && req.session.user) {
    // Attach user to req.user for compatibility with existing code
    req.user = req.session.user;
    return next();
  }
  return res.status(401).json({ message: 'Not authenticated' });
};

// Role-based authorization middleware
const authorizeRoles = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles
}; 