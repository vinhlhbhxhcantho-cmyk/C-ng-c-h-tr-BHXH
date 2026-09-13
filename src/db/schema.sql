-- Schema cho module Tra cứu & Thanh toán số tiền BHXH cần đóng
-- Chạy qua: npm run migrate

CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dữ liệu C12 theo từng đơn vị, từng kỳ (tháng). Chỉ lưu đúng 11 trường
-- cần thiết theo đặc tả, không lưu các cột nhạy cảm khác của báo cáo gốc.
CREATE TABLE IF NOT EXISTS donvi_ky (
  id SERIAL PRIMARY KEY,
  ma_don_vi TEXT NOT NULL,
  ky TEXT NOT NULL, -- định dạng YYYYMM
  ma_khoi TEXT,
  ten_don_vi TEXT,
  so_lao_dong NUMERIC,
  so_dau_ky NUMERIC NOT NULL DEFAULT 0,
  so_ky_nay NUMERIC NOT NULL DEFAULT 0,
  so_da_nop NUMERIC NOT NULL DEFAULT 0,
  so_cuoi_ky NUMERIC NOT NULL DEFAULT 0,
  thang_hoan_thanh TEXT, -- định dạng YYYYMM
  ty_le_no NUMERIC,
  chuyen_quan TEXT, -- danh sách email, phân tách dấu phẩy
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by INTEGER REFERENCES admin_users(id),
  CONSTRAINT donvi_ky_ma_don_vi_ky_key UNIQUE (ma_don_vi, ky)
);

-- Tra cứu theo mã đơn vị (không phân biệt hoa/thường) là truy vấn chính.
CREATE INDEX IF NOT EXISTS idx_donvi_ky_ma_don_vi_lower ON donvi_ky (LOWER(ma_don_vi));
CREATE INDEX IF NOT EXISTS idx_donvi_ky_ky ON donvi_ky (ky);

-- Nhật ký nạp dữ liệu, phục vụ truy vết ai đã nạp/sửa dữ liệu tháng nào.
CREATE TABLE IF NOT EXISTS import_logs (
  id SERIAL PRIMARY KEY,
  admin_user_id INTEGER REFERENCES admin_users(id),
  ky TEXT NOT NULL,
  file_name TEXT,
  rows_in_file INTEGER,
  rows_upserted INTEGER,
  rows_skipped INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
