const pool = require('../db/pool');

const UPSERT_SQL = `
  INSERT INTO donvi_ky (
    ma_don_vi, ky, ma_khoi, ten_don_vi, so_lao_dong,
    so_dau_ky, so_ky_nay, so_da_nop, so_cuoi_ky,
    thang_hoan_thanh, ty_le_no, chuyen_quan, updated_at, updated_by
  ) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now(), $13
  )
  ON CONFLICT (ma_don_vi, ky) DO UPDATE SET
    ma_khoi = EXCLUDED.ma_khoi,
    ten_don_vi = EXCLUDED.ten_don_vi,
    so_lao_dong = EXCLUDED.so_lao_dong,
    so_dau_ky = EXCLUDED.so_dau_ky,
    so_ky_nay = EXCLUDED.so_ky_nay,
    so_da_nop = EXCLUDED.so_da_nop,
    so_cuoi_ky = EXCLUDED.so_cuoi_ky,
    thang_hoan_thanh = EXCLUDED.thang_hoan_thanh,
    ty_le_no = EXCLUDED.ty_le_no,
    chuyen_quan = EXCLUDED.chuyen_quan,
    updated_at = now(),
    updated_by = EXCLUDED.updated_by
`;

/**
 * Nạp (upsert) danh sách đơn vị cho một kỳ. Không xoá các đơn vị khác đã có
 * sẵn trong kỳ đó — nhiều người có thể nạp nối tiếp nhau mà không mất dữ liệu.
 */
async function upsertDonViKy(rows, ky, adminUserId) {
  const client = await pool.connect();
  let upserted = 0;
  try {
    await client.query('BEGIN');
    for (const row of rows) {
      await client.query(UPSERT_SQL, [
        row.ma_don_vi,
        ky,
        row.ma_khoi,
        row.ten_don_vi,
        row.so_lao_dong,
        row.so_dau_ky,
        row.so_ky_nay,
        row.so_da_nop,
        row.so_cuoi_ky,
        row.thang_hoan_thanh,
        row.ty_le_no,
        row.chuyen_quan,
        adminUserId,
      ]);
      upserted += 1;
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  return upserted;
}

/**
 * Tra cứu công khai: chỉ trả về khi CẢ mã đơn vị và email chuyên quản cùng khớp.
 * So khớp không phân biệt hoa/thường cho cả hai. Nếu không truyền `ky`, dùng
 * kỳ mới nhất có dữ liệu cho đơn vị đó.
 */
async function timDonViTraCuu({ maDonVi, email, ky }) {
  const params = [maDonVi];
  let kyFilter = '';
  if (ky) {
    kyFilter = 'AND ky = $2';
    params.push(ky);
  }

  const sql = `
    SELECT *
    FROM donvi_ky
    WHERE LOWER(ma_don_vi) = LOWER($1)
    ${kyFilter}
    ORDER BY ky DESC
    LIMIT 1
  `;
  const { rows } = await pool.query(sql, params);
  if (rows.length === 0) return null;

  const donVi = rows[0];
  const emails = (donVi.chuyen_quan || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (!emails.includes(email.trim().toLowerCase())) {
    return null;
  }

  return donVi;
}

async function danhSachKy() {
  const { rows } = await pool.query(
    'SELECT ky, COUNT(*)::int AS so_don_vi FROM donvi_ky GROUP BY ky ORDER BY ky DESC'
  );
  return rows;
}

async function danhSachDonViTheoKy({ ky, search, limit = 50, offset = 0 }) {
  const params = [ky];
  let searchFilter = '';
  if (search) {
    searchFilter = 'AND (LOWER(ma_don_vi) LIKE $2 OR LOWER(ten_don_vi) LIKE $2)';
    params.push(`%${search.trim().toLowerCase()}%`);
  }
  params.push(limit, offset);
  const limitIdx = params.length - 1;
  const offsetIdx = params.length;

  const sql = `
    SELECT ma_don_vi, ma_khoi, ten_don_vi, so_lao_dong, so_dau_ky, so_ky_nay,
           so_da_nop, so_cuoi_ky, thang_hoan_thanh, ty_le_no, chuyen_quan, updated_at
    FROM donvi_ky
    WHERE ky = $1
    ${searchFilter}
    ORDER BY ma_don_vi
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;
  const { rows } = await pool.query(sql, params);
  return rows;
}

module.exports = { upsertDonViKy, timDonViTraCuu, danhSachKy, danhSachDonViTheoKy };
