const ExcelJS = require('exceljs');

// Ánh xạ tên trường nội bộ -> tên cột kỹ thuật trong file C12 (không phân biệt hoa/thường).
// LUÔN dò theo tên cột, không theo vị trí, vì thứ tự cột có thể đổi giữa các lần xuất từ TST.
const SOURCE_COLUMNS = {
  ma_don_vi: 'madvi',
  ma_khoi: 'makhoi',
  ten_don_vi: 'tendvi',
  so_lao_dong: 'sld',
  tien_dk: '_tien_dk',
  du_dk: 'du_dk',
  tongbhck: 'tongbhck',
  tongbst: 'tongbst',
  laiqh: '_laiqh',
  tongbsg: 'tongbsg',
  tien_unc: '_tien_unc',
  tien_ck: '_tien_ck',
  thanght: 'thanght',
  tyleno: 'tyleno',
  dsnv: 'dsnv',
};

const MAX_HEADER_SCAN_ROWS = 30;

function normalizeHeader(text) {
  return String(text ?? '').trim().toLowerCase();
}

function parseNumber(value) {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'object' && value.result !== undefined) {
    // Ô công thức của ExcelJS: { formula, result }
    return parseNumber(value.result);
  }
  const cleaned = String(value)
    .replace(/[,\s%]/g, '')
    .trim();
  if (cleaned === '' || cleaned === '-') return 0;
  const n = parseFloat(cleaned);
  return Number.isNaN(n) ? 0 : n;
}

function cellText(cell) {
  if (cell === null || cell === undefined) return '';
  const value = cell.value !== undefined ? cell.value : cell;
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if (value.result !== undefined) return String(value.result);
    if (value.richText) return value.richText.map((r) => r.text).join('');
    if (value.text) return String(value.text);
  }
  return String(value);
}

function normalizeYyyymm(value) {
  const text = cellText({ value }).trim();
  if (!text) return null;
  // Có thể tới dưới dạng số (202508) hoặc số có phần thập phân do Excel (202508.0)
  const digits = text.replace(/\D/g, '');
  if (digits.length === 6) return digits;
  return text || null;
}

function findHeaderLocation(workbook) {
  for (const worksheet of workbook.worksheets) {
    const maxRow = Math.min(worksheet.rowCount || 0, MAX_HEADER_SCAN_ROWS);
    for (let r = 1; r <= maxRow; r += 1) {
      const row = worksheet.getRow(r);
      let foundMaDvi = false;
      const columnByHeader = {};
      row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        const normalized = normalizeHeader(cellText(cell));
        if (!normalized) return;
        // Chỉ giữ lần xuất hiện đầu tiên của mỗi tên cột.
        if (!(normalized in columnByHeader)) {
          columnByHeader[normalized] = colNumber;
        }
        if (normalized === 'madvi') foundMaDvi = true;
      });
      if (foundMaDvi) {
        return { worksheet, headerRowNumber: r, columnByHeader };
      }
    }
  }
  return null;
}

/**
 * Đọc file C12 (.xlsx) và trích xuất đúng 11 trường theo đặc tả.
 * @param {Buffer} buffer nội dung file xlsx
 * @returns {Promise<{ rows: object[], totalDataRows: number, skippedNoMaDvi: number, sheetName: string, headerRowNumber: number }>}
 */
async function parseC12Workbook(buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const location = findHeaderLocation(workbook);
  if (!location) {
    throw new Error(
      'Không tìm thấy dòng tiêu đề có cột "madvi" trong bất kỳ sheet nào của file. ' +
        'Vui lòng kiểm tra lại file C12 xuất từ TST.'
    );
  }

  const { worksheet, headerRowNumber, columnByHeader } = location;

  const missingColumns = Object.entries(SOURCE_COLUMNS)
    .filter(([, sourceName]) => !(sourceName in columnByHeader))
    .map(([, sourceName]) => sourceName);

  if (missingColumns.length > 0) {
    throw new Error(
      `File thiếu (các) cột bắt buộc: ${missingColumns.join(', ')}. ` +
        'Vui lòng kiểm tra lại tên cột trong file C12 (dòng tiêu đề kỹ thuật).'
    );
  }

  const colIndex = {};
  for (const [field, sourceName] of Object.entries(SOURCE_COLUMNS)) {
    colIndex[field] = columnByHeader[sourceName];
  }

  const rows = [];
  let totalDataRows = 0;
  let skippedNoMaDvi = 0;

  const lastRow = worksheet.rowCount;
  for (let r = headerRowNumber + 1; r <= lastRow; r += 1) {
    const row = worksheet.getRow(r);
    if (row.cellCount === 0) continue;

    totalDataRows += 1;
    const maDonVi = cellText(row.getCell(colIndex.ma_don_vi)).trim();
    if (!maDonVi) {
      // Bỏ qua dòng không có mã đơn vị (dòng trắng, dòng tổng cộng, v.v.)
      skippedNoMaDvi += 1;
      continue;
    }

    const tienDk = parseNumber(row.getCell(colIndex.tien_dk).value);
    const duDk = parseNumber(row.getCell(colIndex.du_dk).value);
    const tongbhck = parseNumber(row.getCell(colIndex.tongbhck).value);
    const tongbst = parseNumber(row.getCell(colIndex.tongbst).value);
    const laiqh = parseNumber(row.getCell(colIndex.laiqh).value);
    const tongbsg = parseNumber(row.getCell(colIndex.tongbsg).value);
    const tienUnc = parseNumber(row.getCell(colIndex.tien_unc).value);
    const tienCk = parseNumber(row.getCell(colIndex.tien_ck).value);

    rows.push({
      ma_don_vi: maDonVi,
      ma_khoi: cellText(row.getCell(colIndex.ma_khoi)).trim() || null,
      ten_don_vi: cellText(row.getCell(colIndex.ten_don_vi)).trim() || null,
      so_lao_dong: Math.round(parseNumber(row.getCell(colIndex.so_lao_dong).value)),
      so_dau_ky: tienDk - duDk,
      so_ky_nay: tongbhck + tongbst + laiqh - tongbsg,
      so_da_nop: tienUnc,
      so_cuoi_ky: tienCk,
      thang_hoan_thanh: normalizeYyyymm(row.getCell(colIndex.thanght).value),
      ty_le_no: parseNumber(row.getCell(colIndex.tyleno).value),
      chuyen_quan: cellText(row.getCell(colIndex.dsnv)).trim() || null,
    });
  }

  return {
    rows,
    totalDataRows,
    skippedNoMaDvi,
    sheetName: worksheet.name,
    headerRowNumber,
  };
}

module.exports = { parseC12Workbook, SOURCE_COLUMNS, parseNumber, normalizeYyyymm };
