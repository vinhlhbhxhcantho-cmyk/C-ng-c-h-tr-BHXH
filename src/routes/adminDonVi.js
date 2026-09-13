const express = require('express');
const { requireAdminAuth } = require('../middleware/auth');
const { danhSachKy, danhSachDonViTheoKy } = require('../services/donViService');
const pool = require('../db/pool');

const router = express.Router();

router.get('/ky', requireAdminAuth, async (req, res) => {
  const rows = await danhSachKy();
  res.json(rows);
});

// Dùng để đối chiếu số liệu vài chục đơn vị cùng lúc trước khi công bố cho tra cứu công khai.
router.get('/don-vi', requireAdminAuth, async (req, res) => {
  const { ky, search, limit, offset } = req.query;
  if (!ky) {
    return res.status(400).json({ error: 'Thiếu tham số ky.' });
  }
  const rows = await danhSachDonViTheoKy({
    ky,
    search,
    limit: Math.min(parseInt(limit, 10) || 50, 200),
    offset: parseInt(offset, 10) || 0,
  });
  res.json(rows);
});

router.get('/import-logs', requireAdminAuth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT il.id, il.ky, il.file_name, il.rows_in_file, il.rows_upserted, il.rows_skipped,
            il.created_at, au.username, au.full_name
     FROM import_logs il
     LEFT JOIN admin_users au ON au.id = il.admin_user_id
     ORDER BY il.created_at DESC
     LIMIT 100`
  );
  res.json(rows);
});

module.exports = router;
