const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const pool = require('../db/pool');
const config = require('../config');

const router = express.Router();

// Hạn chế dò mật khẩu: tối đa 10 lần thử đăng nhập / 15 phút / IP.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Thiếu tên đăng nhập hoặc mật khẩu.' });
  }

  const { rows } = await pool.query(
    'SELECT id, username, password_hash, full_name FROM admin_users WHERE LOWER(username) = LOWER($1) AND is_active = TRUE',
    [username]
  );
  const user = rows[0];
  const passwordMatches = user ? await bcrypt.compare(password, user.password_hash) : false;

  if (!user || !passwordMatches) {
    return res.status(401).json({ error: 'Sai tên đăng nhập hoặc mật khẩu.' });
  }

  const token = jwt.sign({ sub: user.id, username: user.username }, config.jwtSecret, {
    expiresIn: config.adminTokenTtlSeconds,
  });

  res.json({ token, fullName: user.full_name, username: user.username });
});

module.exports = router;
