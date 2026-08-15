import ExcelJS from "exceljs";
import { fmtMoney } from "./common";

export type LedgerRow = {
  tenDonVi: string;
  maDonVi: string;
  loaiKy: string;
  giaTriKy: string;
  savedAt: Date;
  soLaoDong: number;
  tongQuyLuong: number;
  soLuotTangMoi: number;
  soLuotGiam: number;
};

export async function buildLedgerExport(rows: LedgerRow[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Sổ theo dõi");

  ws.mergeCells("A1:H1");
  ws.getCell("A1").value = "SỔ THEO DÕI LAO ĐỘNG VÀ QUỸ LƯƠNG (BẢN NHÁP NỘI BỘ)";
  ws.getCell("A1").font = { bold: true, size: 13 };

  const headers = ["Đơn vị", "Mã đơn vị", "Loại kỳ", "Kỳ", "Ngày lưu", "Số lao động", "Tổng quỹ lương", "Lượt tăng mới (TM)", "Lượt giảm (GH)"];
  headers.forEach((h, i) => {
    const cell = ws.getRow(3).getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true };
    cell.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
  });

  rows.forEach((row, idx) => {
    const r = ws.getRow(4 + idx);
    const values = [
      row.tenDonVi,
      row.maDonVi || "(chưa cấp)",
      row.loaiKy,
      row.giaTriKy,
      row.savedAt.toLocaleDateString("vi-VN"),
      row.soLaoDong,
      fmtMoney(row.tongQuyLuong),
      row.soLuotTangMoi,
      row.soLuotGiam,
    ];
    values.forEach((v, i) => {
      const cell = r.getCell(i + 1);
      cell.value = v;
      cell.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
    });
  });

  ws.columns.forEach((c, i) => {
    c.width = [24, 14, 10, 12, 14, 12, 16, 16, 14][i] || 14;
  });

  return Buffer.from(await wb.xlsx.writeBuffer());
}
