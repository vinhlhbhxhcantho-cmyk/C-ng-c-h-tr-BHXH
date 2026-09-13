const express = require('express');
const rateLimit = require('express-rate-limit');
const pool = require('../db/pool');
const { timDonViTraCuu } = require('../services/donViService');

const router = express.Router();

const GENERIC_ERROR = 'Không tìm thấy đơn vị khớp với thông tin đã nhập.';

// Chặn dò quét hàng loạt mã đơn vị / email: tối đa 15 lần tra cứu / 10 phút / IP.
const lookupLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Bạn đã tra cứu quá nhiều lần. Vui lòng thử lại sau ít phút.' },
});

router.get('/ky', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT DISTINCT ky FROM donvi_ky ORDER BY ky DESC'
  );
  res.json(rows.map((r) => r.ky));
});

router.post('/tra-cuu', lookupLimiter, async (req, res) => {
  const { maDonVi, email, ky } = req.body || {};

  if (!maDonVi || !email || typeof maDonVi !== 'string' || typeof email !== 'string') {
    // Cùng một thông báo lỗi chung cho mọi trường hợp không khớp/thiếu thông tin.
    return res.status(404).json({ error: GENERIC_ERROR });
  }

  const donVi = await timDonViTraCuu({
    maDonVi: maDonVi.trim(),
    email: email.trim(),
    ky: ky ? String(ky).trim() : undefined,
  });

  if (!donVi) {
    return res.status(404).json({ error: GENERIC_ERROR });
  }

  res.json({
    maDonVi: donVi.ma_don_vi,
    maKhoi: donVi.ma_khoi,
    tenDonVi: donVi.ten_don_vi,
    ky: donVi.ky,
    soLaoDong: Number(donVi.so_lao_dong),
    soDauKy: Number(donVi.so_dau_ky),
    soKyNay: Number(donVi.so_ky_nay),
    soDaNop: Number(donVi.so_da_nop),
    soCuoiKy: Number(donVi.so_cuoi_ky),
    thangHoanThanh: donVi.thang_hoan_thanh,
    tyLeNo: Number(donVi.ty_le_no),
    capNhatLuc: donVi.updated_at,
  });
});

module.exports = router;
