const jwt = require('jsonwebtoken');
const config = require('../config');

// Checks the "Authorization: Bearer <token>" header.
// If the token is valid, the logged-in user's id is put on req.user
// so every route can filter data by the current user.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Please log in first.' });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = { id: payload.userId };
    next();
  } catch {
    return res.status(401).json({ error: 'Your session has expired. Please log in again.' });
  }
}

module.exports = requireAuth;
