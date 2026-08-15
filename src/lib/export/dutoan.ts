import ExcelJS from "exceljs";
import { fmtMoney } from "./common";
import { ContributionBreakdown } from "@/lib/calc";

export type DuToanPerson = {
  hoTen: string;
  nhom: string;
  loaiBienDong: string;
  breakdown: ContributionBreakdown;
};

export type DuToanInput = {
  tenDonVi: string;
  maDonVi: string;
  giaTriKy: string;
  loaiKy: string;
  persons: DuToanPerson[];
};

export async function buildDuToan(input: DuToanInput): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Bảng dự toán");

  let r = 1;
  ws.mergeCells(`A${r}:I${r}`);
  ws.getCell(`A${r}`).value = "BẢNG DỰ TOÁN SỐ TIỀN ĐÓNG BHXH, BHYT, BHTN (DỰ THẢO)";
  ws.getCell(`A${r}`).font = { bold: true, size: 13 };
  ws.getCell(`A${r}`).alignment = { horizontal: "center" };
  r++;

  ws.mergeCells(`A${r}:I${r}`);
  ws.getCell(`A${r}`).value = `Đơn vị: ${input.tenDonVi}   Mã đơn vị: ${input.maDonVi || "(chưa cấp)"}   Kỳ: ${input.giaTriKy} (${input.loaiKy})`;
  ws.getCell(`A${r}`).font = { bold: true, size: 11 };
  r++;

  ws.mergeCells(`A${r}:I${r}`);
  ws.getCell(`A${r}`).value =
    "Đây là số liệu dự tính do đại lý lập, chỉ thể hiện phần B (Phát sinh trong kỳ) vì là hồ sơ đăng ký/khai báo, KHÔNG phải kết quả xử lý chính thức của cơ quan BHXH " +
    "(không có Mục A - Kỳ trước mang sang, C - Số tiền đã nộp, D - Phân bổ, Đ - Chuyển kỳ sau vì đây là dữ liệu chỉ cơ quan BHXH có sau khi nhận hồ sơ). " +
    "Bảng này không thay thế Thông báo kết quả đóng (Mẫu C12-TS) chính thức do cơ quan BHXH phát hành.";
  ws.getCell(`A${r}`).font = { italic: true, size: 9, color: { argb: "FFB22222" } };
  ws.getCell(`A${r}`).alignment = { wrapText: true };
  ws.getRow(r).height = 45;
  r += 2;

  ws.mergeCells(`A${r}:I${r}`);
  ws.getCell(`A${r}`).value = "B. PHÁT SINH TRONG KỲ";
  ws.getCell(`A${r}`).font = { bold: true, size: 11 };
  r++;

  const soTang = input.persons.filter((p) => p.loaiBienDong === "TM").length;
  const soGiam = input.persons.filter((p) => p.loaiBienDong === "GH").length;
  const quyLuong = input.persons.reduce((s, p) => s + p.breakdown.base, 0);

  ws.getCell(`A${r}`).value = "1. Số lao động";
  ws.getCell(`A${r}`).font = { bold: true };
  r++;
  ws.getCell(`B${r}`).value = `- Tăng mới (TM): ${soTang} người`;
  r++;
  ws.getCell(`B${r}`).value = `- Giảm hẳn (GH): ${soGiam} người`;
  r++;

  ws.getCell(`A${r}`).value = "2. Quỹ lương";
  ws.getCell(`A${r}`).font = { bold: true };
  r++;
  ws.getCell(`B${r}`).value = `Tổng quỹ lương làm căn cứ đóng: ${fmtMoney(quyLuong)} đ/tháng`;
  r++;

  ws.getCell(`A${r}`).value = "3. Phải đóng";
  ws.getCell(`A${r}`).font = { bold: true };
  r++;
  ws.getCell(`A${r}`).value = "3.1. Tăng";
  r++;
  ws.getCell(`A${r}`).value = "3.1.1. Tăng trong kỳ";
  ws.getCell(`A${r}`).font = { italic: true };
  r++;
  r++;

  const tableHeaderRow = r;
  const headers = ["STT", "Họ và tên", "Nhóm", "ÔĐ,TS", "HTTT", "BHYT", "BHTN", "BHTNLĐ,BNN", "CỘNG"];
  headers.forEach((h, i) => {
    const cell = ws.getRow(tableHeaderRow).getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true, size: 10 };
    cell.alignment = { horizontal: "center", wrapText: true };
    cell.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
  });
  r++;

  const totals = { odts: 0, httt: 0, bhyt: 0, bhtn: 0, tnldBnn: 0, cong: 0 };
  input.persons.forEach((p, idx) => {
    const b = p.breakdown;
    const odts = b.nld.oDauThaiSan + b.donVi.oDauThaiSan;
    const httt = b.nld.huuTriTuTuat + b.donVi.huuTriTuTuat;
    const bhyt = b.nld.bhyt + b.donVi.bhyt;
    const bhtn = b.nld.bhtn + b.donVi.bhtn;
    const tnldBnn = b.nld.tnldBnn + b.donVi.tnldBnn;
    const cong = odts + httt + bhyt + bhtn + tnldBnn;
    totals.odts += odts;
    totals.httt += httt;
    totals.bhyt += bhyt;
    totals.bhtn += bhtn;
    totals.tnldBnn += tnldBnn;
    totals.cong += cong;

    const row = ws.getRow(tableHeaderRow + 1 + idx);
    const values = [idx + 1, p.hoTen, p.nhom, fmtMoney(odts), fmtMoney(httt), fmtMoney(bhyt), fmtMoney(bhtn), fmtMoney(tnldBnn), fmtMoney(cong)];
    values.forEach((v, i) => {
      const cell = row.getCell(i + 1);
      cell.value = v;
      cell.font = { size: 10 };
      cell.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
    });
  });

  const totalRowIdx = tableHeaderRow + 1 + input.persons.length;
  const totalRow = ws.getRow(totalRowIdx);
  totalRow.getCell(2).value = "TỔNG CỘNG";
  totalRow.getCell(2).font = { bold: true };
  [totals.odts, totals.httt, totals.bhyt, totals.bhtn, totals.tnldBnn, totals.cong].forEach((v, i) => {
    const cell = totalRow.getCell(4 + i);
    cell.value = fmtMoney(v);
    cell.font = { bold: true };
    cell.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
  });

  const noteRow = totalRowIdx + 2;
  ws.mergeCells(`A${noteRow}:I${noteRow}`);
  ws.getCell(`A${noteRow}`).value =
    "Ghi chú căn cứ đóng tối thiểu: Nhóm TZ/CZ — sàn = lương tối thiểu vùng, trần BHXH/BHYT = 20 lần mức tham chiếu, trần riêng BHTN = 20 lần lương tối thiểu vùng. " +
    "Nhóm Q6/KQ — sàn = mức tham chiếu, trần = 20 lần mức tham chiếu, KHÔNG tham gia BHTN và BHTNLĐ-BNN nên hai cột này luôn bằng 0 (không phải thiếu sót).";
  ws.getCell(`A${noteRow}`).font = { italic: true, size: 9 };
  ws.getCell(`A${noteRow}`).alignment = { wrapText: true };
  ws.getRow(noteRow).height = 40;

  ws.columns.forEach((c, i) => {
    c.width = [8, 24, 8, 13, 13, 13, 13, 14, 15][i] || 13;
  });

  return Buffer.from(await wb.xlsx.writeBuffer());
}
