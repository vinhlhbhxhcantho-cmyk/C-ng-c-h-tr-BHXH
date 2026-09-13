/**
 * Tạo (hoặc cập nhật mật khẩu) một tài khoản admin riêng biệt.
 * Dùng để mỗi chuyên quản có tài khoản đăng nhập của riêng mình, phục vụ
 * truy vết ai đã nạp/sửa dữ liệu (thay vì dùng chung 1 mật khẩu).
 *
 * Cách dùng:
 *   node src/scripts/createAdmin.js <username> <password> "<Họ tên đầy đủ>"
 */
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');

async function main() {
  const [username, password, fullName] = process.argv.slice(2);
  if (!username || !password || !fullName) {
    console.error(
      'Cách dùng: node src/scripts/createAdmin.js <username> <password> "<Họ tên đầy đủ>"'
    );
    process.exitCode = 1;
    return;
  }
  if (password.length < 8) {
    console.error('Mật khẩu phải có ít nhất 8 ký tự.');
    process.exitCode = 1;
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await pool.query(
    `INSERT INTO admin_users (username, password_hash, full_name)
     VALUES ($1, $2, $3)
     ON CONFLICT (username) DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       full_name = EXCLUDED.full_name,
       is_active = TRUE`,
    [username, passwordHash, fullName]
  );

  console.log(`Đã tạo/cập nhật tài khoản admin: ${username} (${fullName})`);
  await pool.end();
}

main().catch((err) => {
  console.error('Lỗi:', err);
  process.exit(1);
});
