const test = require('node:test');
const assert = require('node:assert/strict');
const ExcelJS = require('exceljs');
const { parseC12Workbook } = require('../src/services/excelImport');

const SOURCE_HEADERS = [
  'madvi',
  'makhoi',
  'tendvi',
  'sld',
  '_tien_dk',
  'du_dk',
  'tongbhck',
  'tongbst',
  '_laiqh',
  'tongbsg',
  '_tien_unc',
  '_tien_ck',
  'thanght',
  'tyleno',
  'dsnv',
];

async function buildWorkbookBuffer({ headers = SOURCE_HEADERS, dataRows = [], sheetName = '09200' } = {}) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);
  sheet.addRow(headers);
  for (const row of dataRows) sheet.addRow(row);
  return workbook.xlsx.writeBuffer();
}

test('dò đúng cột theo tên kỹ thuật dù thứ tự cột đảo lộn', async () => {
  // Đảo ngược thứ tự cột so với bảng đặc tả để chứng minh không phụ thuộc vị trí.
  const shuffledHeaders = [...SOURCE_HEADERS].reverse();
  const row = new Array(shuffledHeaders.length);
  const set = (name, value) => {
    row[shuffledHeaders.indexOf(name)] = value;
  };
  set('madvi', 'YN0054Z');
  set('makhoi', 'TZ');
  set('tendvi', 'CONG TY TNHH ABC');
  set('sld', 10);
  set('_tien_dk', 1000000);
  set('du_dk', 0);
  set('tongbhck', 500000);
  set('tongbst', 0);
  set('_laiqh', 0);
  set('tongbsg', 0);
  set('_tien_unc', 1200000);
  set('_tien_ck', 300000);
  set('thanght', 202508);
  set('tyleno', 2.5);
  set('dsnv', 'a@bhxh.gov.vn, b@bhxh.gov.vn');

  const buffer = await buildWorkbookBuffer({ headers: shuffledHeaders, dataRows: [row] });
  const result = await parseC12Workbook(buffer);

  assert.equal(result.rows.length, 1);
  const dv = result.rows[0];
  assert.equal(dv.ma_don_vi, 'YN0054Z');
  assert.equal(dv.so_dau_ky, 1000000); // _tien_dk - du_dk = 1000000 - 0
  assert.equal(dv.so_ky_nay, 500000); // tongbhck + tongbst + laiqh - tongbsg
  assert.equal(dv.so_da_nop, 1200000);
  assert.equal(dv.so_cuoi_ky, 300000);
  assert.equal(dv.thang_hoan_thanh, '202508');
  assert.equal(dv.chuyen_quan, 'a@bhxh.gov.vn, b@bhxh.gov.vn');
});

test('công thức Số đầu kỳ dùng đúng khi du_dk khác 0 thay vì _tien_dk', async () => {
  const row = new Array(SOURCE_HEADERS.length).fill(0);
  row[SOURCE_HEADERS.indexOf('madvi')] = 'TW0015Z';
  row[SOURCE_HEADERS.indexOf('_tien_dk')] = 0;
  row[SOURCE_HEADERS.indexOf('du_dk')] = 250000;
  row[SOURCE_HEADERS.indexOf('dsnv')] = 'c@bhxh.gov.vn';

  const buffer = await buildWorkbookBuffer({ dataRows: [row] });
  const result = await parseC12Workbook(buffer);
  assert.equal(result.rows[0].so_dau_ky, -250000);
});

test('chấp nhận số dạng chuỗi có dấu phẩy/khoảng trắng', async () => {
  const row = new Array(SOURCE_HEADERS.length).fill(0);
  row[SOURCE_HEADERS.indexOf('madvi')] = 'KQ0001Z';
  row[SOURCE_HEADERS.indexOf('_tien_ck')] = '22,600,000,000 ';
  row[SOURCE_HEADERS.indexOf('dsnv')] = 'd@bhxh.gov.vn';

  const buffer = await buildWorkbookBuffer({ dataRows: [row] });
  const result = await parseC12Workbook(buffer);
  assert.equal(result.rows[0].so_cuoi_ky, 22600000000);
});

test('bỏ qua dòng không có madvi', async () => {
  const rowGood = new Array(SOURCE_HEADERS.length).fill(0);
  rowGood[SOURCE_HEADERS.indexOf('madvi')] = 'CZ0009Z';
  rowGood[SOURCE_HEADERS.indexOf('dsnv')] = 'e@bhxh.gov.vn';
  const rowBad = new Array(SOURCE_HEADERS.length).fill('');

  const buffer = await buildWorkbookBuffer({ dataRows: [rowGood, rowBad] });
  const result = await parseC12Workbook(buffer);
  assert.equal(result.rows.length, 1);
  assert.equal(result.skippedNoMaDvi, 1);
  assert.equal(result.totalDataRows, 2);
});

test('báo lỗi rõ tên cột khi thiếu cột bắt buộc', async () => {
  const headersThieuCot = SOURCE_HEADERS.filter((h) => h !== 'tyleno');
  const buffer = await buildWorkbookBuffer({ headers: headersThieuCot, dataRows: [] });
  await assert.rejects(() => parseC12Workbook(buffer), /tyleno/);
});

test('dò đúng sheet dù tên sheet không cố định và có nhiều sheet', async () => {
  const workbook = new ExcelJS.Workbook();
  workbook.addWorksheet('Ghi chu').addRow(['Đây là sheet ghi chú, không có dữ liệu']);
  const dataSheet = workbook.addWorksheet('Sheet1');
  dataSheet.addRow(SOURCE_HEADERS);
  const row = new Array(SOURCE_HEADERS.length).fill(0);
  row[SOURCE_HEADERS.indexOf('madvi')] = 'ZZ0001Z';
  row[SOURCE_HEADERS.indexOf('dsnv')] = 'f@bhxh.gov.vn';
  dataSheet.addRow(row);

  const buffer = await workbook.xlsx.writeBuffer();
  const result = await parseC12Workbook(buffer);
  assert.equal(result.sheetName, 'Sheet1');
  assert.equal(result.rows.length, 1);
});
