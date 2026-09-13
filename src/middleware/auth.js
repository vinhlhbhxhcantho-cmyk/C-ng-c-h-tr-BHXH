const jwt = require('jsonwebtoken');
const config = require('../config');

function requireAdminAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Thiếu token xác thực.' });
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.adminUser = { id: payload.sub, username: payload.username };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn.' });
  }
}

module.exports = { requireAdminAuth };
