const fs = require('fs');
const path = require('path');
const pool = require('./pool');

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('Đã áp dụng schema thành công.');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Lỗi khi áp dụng schema:', err);
  process.exit(1);
});
