const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const pool = require('./db/pool');

/**
 * Chạy khi server khởi động, để không phụ thuộc vào việc có truy cập được
 * Shell của nền tảng hosting hay không (ví dụ gói miễn phí của Render có
 * thể khoá tính năng Shell).
 *
 * 1. Áp dụng schema.sql (idempotent nhờ CREATE TABLE IF NOT EXISTS).
 * 2. Nếu có đủ 3 biến môi trường ADMIN_BOOTSTRAP_USERNAME/PASSWORD/FULL_NAME
 *    và tài khoản đó chưa tồn tại, tự tạo tài khoản admin đầu tiên.
 */
async function runStartupBootstrap() {
  const schemaSql = fs.readFileSync(path.join(__dirname, 'db', 'schema.sql'), 'utf8');
  await pool.query(schemaSql);
  console.log('[bootstrap] Đã áp dụng schema.');

  const username = process.env.ADMIN_BOOTSTRAP_USERNAME;
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  const fullName = process.env.ADMIN_BOOTSTRAP_FULL_NAME;

  if (!username || !password || !fullName) {
    console.log('[bootstrap] Thiếu ADMIN_BOOTSTRAP_* — bỏ qua tạo tài khoản admin tự động.');
    return;
  }

  const { rows } = await pool.query(
    'SELECT id FROM admin_users WHERE LOWER(username) = LOWER($1)',
    [username]
  );
  if (rows.length > 0) {
    console.log(`[bootstrap] Tài khoản "${username}" đã tồn tại — bỏ qua.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await pool.query(
    'INSERT INTO admin_users (username, password_hash, full_name) VALUES ($1, $2, $3)',
    [username, passwordHash, fullName]
  );
  console.log(`[bootstrap] Đã tự tạo tài khoản admin "${username}".`);
}

module.exports = { runStartupBootstrap };
