import ExcelJS from "exceljs";
import { fmtDate, fmtMoney } from "./common";

export type D02Person = {
  hoTen: string;
  chucDanh: string;
  tienLuong: number;
  phuCap: number;
  ngayHDLDHieuLuc?: string | Date | null;
  tuThang: string;
  noiDangKyKCBTen?: string | null;
  loaiBienDongText: string;
};

export type D02Input = {
  tenDonVi: string;
  maDonVi: string;
  giaTriKy: string;
  persons: D02Person[];
};

const HEADERS = [
  "(1) STT",
  "(2) Họ và tên",
  "(3) Chức vụ, chức danh nghề, nơi làm việc",
  "(4) Tiền lương",
  "(5) Hệ số/mức lương theo NĐ 204/2004",
  "(6) % phụ cấp chức vụ",
  "(7) % phụ cấp thâm niên vượt khung",
  "(8) % phụ cấp thâm niên nghề",
  "(9) Phụ cấp lương + khoản bổ sung",
  "(10) Loại HĐLĐ",
  "(11) Số HĐLĐ",
  "(12) Ngày ký HĐLĐ",
  "(13) Ngày QĐ/HĐLĐ có hiệu lực",
  "(14) Từ tháng/năm",
  "(15) Đến tháng/năm",
  "(16) Nơi đăng ký KCB ban đầu",
  "(17) Hình thức nhận kết quả",
  "(18) Loại tăng/giảm/điều chỉnh",
  "(19) Ghi chú",
];

const EMPTY_COLS = new Set([5, 6, 7, 8, 10, 11, 12, 15, 17, 19]);

export async function buildD02(input: D02Input): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("D02-LT");

  ws.mergeCells("A1:F1");
  ws.getCell("A1").value = `Đơn vị: ${input.tenDonVi}     Mã đơn vị: ${input.maDonVi || "(chưa cấp)"}`;
  ws.getCell("A1").font = { bold: true, size: 12 };

  ws.mergeCells("A2:S2");
  ws.getCell("A2").value = "Mẫu D02-LT — Danh sách lao động tham gia BHXH, BHYT, BHTN (Quyết định 366/QĐ-BHXH ngày 29/4/2026)";
  ws.getCell("A2").font = { italic: true, size: 10 };

  ws.mergeCells("A3:S3");
  ws.getCell("A3").value = `Kỳ: ${input.giaTriKy}   —   BẢN NHÁP DỮ LIỆU, không thay thế hồ sơ nộp qua Cổng DVC Quốc gia / I-VAN.`;
  ws.getCell("A3").font = { italic: true, size: 10, color: { argb: "FFB22222" } };

  const headerRowIdx = 5;
  const headerRow = ws.getRow(headerRowIdx);
  HEADERS.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true, size: 9 };
    cell.alignment = { wrapText: true, vertical: "middle", horizontal: "center" };
    cell.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
  });
  ws.columns.forEach((c, i) => {
    c.width = [6, 22, 26, 14, 12, 10, 10, 10, 16, 10, 10, 12, 14, 12, 12, 26, 12, 22, 14][i] || 12;
  });

  input.persons.forEach((p, idx) => {
    const row = ws.getRow(headerRowIdx + 1 + idx);
    const values: (string | number)[] = [
      idx + 1,
      p.hoTen,
      p.chucDanh,
      fmtMoney(p.tienLuong),
      "",
      "",
      "",
      "",
      fmtMoney(p.phuCap),
      "",
      "",
      "",
      fmtDate(p.ngayHDLDHieuLuc),
      p.tuThang,
      "",
      p.noiDangKyKCBTen || "",
      "",
      p.loaiBienDongText,
      "",
    ];
    values.forEach((v, i) => {
      const cell = row.getCell(i + 1);
      cell.value = v;
      cell.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
      cell.font = { size: 10 };
    });
  });

  const noteRowIdx = headerRowIdx + 1 + input.persons.length + 1;
  ws.mergeCells(`A${noteRowIdx}:S${noteRowIdx}`);
  const emptyList = [...EMPTY_COLS].sort((a, b) => a - b).join(", ");
  ws.getCell(`A${noteRowIdx}`).value = `Ghi chú: các cột (${emptyList}) chưa được thu thập trong công cụ — người dùng tự bổ sung khi nộp hồ sơ chính thức.`;
  ws.getCell(`A${noteRowIdx}`).font = { italic: true, size: 9 };

  return Buffer.from(await wb.xlsx.writeBuffer());
}
