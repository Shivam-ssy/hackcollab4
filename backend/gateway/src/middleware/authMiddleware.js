const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  // Get auth header value
  const bearerHeader = req.headers['authorization'];
  
  if (bearerHeader) {
    const bearer = bearerHeader.split(' ');
    const bearerToken = bearer[1];
    
    try {
      const decoded = jwt.verify(bearerToken, process.env.JWT_SECRET || 'fallback_secret');
      req.user = decoded;
    } catch (err) {
      // Invalid token, just proceed as unauthenticated
      req.user = null;
    }
    next();
  } else {
    // Some routes might be public (like login/register), so we just continue without req.user
    next();
  }
};

module.exports = verifyToken;
