const express = require('express');
const multer = require('multer');
const { requireAdminAuth } = require('../middleware/auth');
const { parseC12Workbook } = require('../services/excelImport');
const { upsertDonViKy } = require('../services/donViService');
const pool = require('../db/pool');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

const KY_REGEX = /^\d{6}$/;

router.post('/import', requireAdminAuth, upload.single('file'), async (req, res) => {
  const { ky } = req.body || {};
  if (!ky || !KY_REGEX.test(ky)) {
    return res.status(400).json({ error: 'Kỳ (ky) phải theo định dạng YYYYMM, ví dụ 202508.' });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'Thiếu file (.xlsx) để nạp dữ liệu.' });
  }

  let parsed;
  try {
    parsed = await parseC12Workbook(req.file.buffer);
  } catch (err) {
    return res.status(422).json({ error: err.message });
  }

  if (parsed.rows.length === 0) {
    return res.status(422).json({
      error: 'Không tìm thấy đơn vị hợp lệ nào (có mã đơn vị) trong file.',
    });
  }

  const upserted = await upsertDonViKy(parsed.rows, ky, req.adminUser.id);

  await pool.query(
    `INSERT INTO import_logs (admin_user_id, ky, file_name, rows_in_file, rows_upserted, rows_skipped)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [req.adminUser.id, ky, req.file.originalname, parsed.totalDataRows, upserted, parsed.skippedNoMaDvi]
  );

  res.json({
    ky,
    sheetName: parsed.sheetName,
    totalDataRows: parsed.totalDataRows,
    upserted,
    skippedNoMaDvi: parsed.skippedNoMaDvi,
  });
});

module.exports = router;
