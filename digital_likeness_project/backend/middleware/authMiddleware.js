const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your-very-secure-and-long-secret-key-12345'; // IMPORTANT: Use environment variable in production

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access denied. No token provided or malformed token.' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded.user; // Attach user payload (e.g., { id: user.id, username: user.username }) to request
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token.' });
    }
    // For other errors, pass to the main error handler
    console.error('JWT verification error:', error);
    next(error); // Or return a generic 401/403
    // return res.status(403).json({ message: 'Token is not valid.' }); // General fallback
  }
};

module.exports = { verifyToken };
