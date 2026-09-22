const jwt = require('jsonwebtoken');

// 1. Verify if the user is authenticated (has a valid token)
const protect = (req, res, next) => {
  let token;

  // Check for 'Authorization: Bearer <token>' in request headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach decoded user payload (id, role) to the request object
      req.user = decoded;

      next(); // Pass control to the next route handler
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

// 2. Restrict access strictly to Admin users
const adminOnly = (req, res, next) => {
  const role = req.user && req.user.role ? req.user.role.toLowerCase() : '';

  if (req.user && (role === 'admin' || role === 'superadmin')) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admin role required' });
  }
};

module.exports = { protect, adminOnly };