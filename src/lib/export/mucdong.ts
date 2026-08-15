import ExcelJS from "exceljs";
import { fmtMoney } from "./common";
import { ContributionBreakdown } from "@/lib/calc";

export type MucDongPerson = {
  hoTen: string;
  nhom: string;
  tienLuong: number;
  phuCap: number;
  breakdown: ContributionBreakdown;
  errors: string[];
};

export type MucDongInput = {
  tenDonVi: string;
  maDonVi: string;
  giaTriKy: string;
  persons: MucDongPerson[];
};

export async function buildMucDong(input: MucDongInput): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Bảng tính mức đóng");

  let r = 1;
  ws.mergeCells(`A${r}:K${r}`);
  ws.getCell(`A${r}`).value = "BẢNG TÍNH MỨC ĐÓNG BHXH, BHYT, BHTN (NỘI BỘ — không phải mẫu chính thức)";
  ws.getCell(`A${r}`).font = { bold: true, size: 13 };
  r++;
  ws.mergeCells(`A${r}:K${r}`);
  ws.getCell(`A${r}`).value = `Đơn vị: ${input.tenDonVi}   Mã đơn vị: ${input.maDonVi || "(chưa cấp)"}   Kỳ: ${input.giaTriKy}`;
  ws.getCell(`A${r}`).font = { bold: true, size: 11 };
  r += 2;

  const headers = ["STT", "Họ và tên", "Nhóm", "Tiền lương", "Phụ cấp", "Mức đóng", "NLĐ đóng", "Đơn vị đóng", "Tổng cộng", "Lỗi/Ghi chú"];
  headers.forEach((h, i) => {
    const cell = ws.getRow(r).getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true, size: 10 };
    cell.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
  });
  const headerRow = r;
  r++;

  let sumNld = 0;
  let sumDonVi = 0;
  let sumTong = 0;
  input.persons.forEach((p, idx) => {
    const nldTong = p.breakdown.nld.tong * p.breakdown.soThang;
    const dvTong = p.breakdown.donVi.tong * p.breakdown.soThang;
    sumNld += nldTong;
    sumDonVi += dvTong;
    sumTong += p.breakdown.tongCong;
    const row = ws.getRow(headerRow + idx + 1);
    const values: (string | number)[] = [
      idx + 1,
      p.hoTen,
      p.nhom,
      fmtMoney(p.tienLuong),
      fmtMoney(p.phuCap),
      fmtMoney(p.tienLuong + p.phuCap),
      fmtMoney(nldTong),
      fmtMoney(dvTong),
      fmtMoney(p.breakdown.tongCong),
      p.errors.join("; "),
    ];
    values.forEach((v, i) => {
      const cell = row.getCell(i + 1);
      cell.value = v;
      cell.font = { size: 10, color: p.errors.length ? { argb: "FFB22222" } : undefined };
      cell.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
    });
  });

  const totalRowIdx = headerRow + input.persons.length + 1;
  const totalRow = ws.getRow(totalRowIdx);
  totalRow.getCell(2).value = "TỔNG CỘNG";
  totalRow.getCell(2).font = { bold: true };
  [sumNld, sumDonVi, sumTong].forEach((v, i) => {
    const cell = totalRow.getCell(7 + i);
    cell.value = fmtMoney(v);
    cell.font = { bold: true };
    cell.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
  });

  const noteRow = totalRowIdx + 2;
  ws.mergeCells(`A${noteRow}:K${noteRow}`);
  ws.getCell(`A${noteRow}`).value =
    "Tỷ lệ đóng: Nhóm TZ/CZ — NLĐ 10,5% + Đơn vị 21,5% (ÔĐ,TS 3% đơn vị; HTTT 22%; BHYT 4,5%; BHTN 2% trên trần riêng; TNLĐ-BNN 0,5% đơn vị). " +
    "Nhóm Q6/KQ — tự đóng 29,5% (ÔĐ,TS 3% + HTTT 22% + BHYT 4,5%), KHÔNG có BHTN/TNLĐ-BNN. Xem chi tiết & chỉnh sửa tham số tại màn hình Cấu hình chính sách.";
  ws.getCell(`A${noteRow}`).font = { italic: true, size: 9 };
  ws.getCell(`A${noteRow}`).alignment = { wrapText: true };
  ws.getRow(noteRow).height = 30;

  ws.columns.forEach((c, i) => {
    c.width = [6, 22, 8, 13, 12, 13, 13, 13, 14, 30][i] || 13;
  });

  return Buffer.from(await wb.xlsx.writeBuffer());
}
