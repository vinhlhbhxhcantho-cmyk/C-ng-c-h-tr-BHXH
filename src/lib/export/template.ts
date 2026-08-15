import ExcelJS from "exceljs";

export const TEMPLATE_HEADERS = [
  "Họ và tên",
  "Nhóm (TZ/Q6/KQ/CZ)",
  "Chức vụ/chức danh nghề",
  "Giới tính",
  "Ngày sinh (dd/mm/yyyy)",
  "Số CCCD/ĐDCN",
  "Tiền lương",
  "Phụ cấp lương",
  "Từ tháng/năm (mm/yyyy)",
  "Ngày HĐLĐ hiệu lực (dd/mm/yyyy)",
  "Nơi đăng ký KCB ban đầu",
  "Loại (TM/GH/DC/CD)",
];

export async function buildImportTemplate(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Danh sách người tham gia");

  TEMPLATE_HEADERS.forEach((h, i) => {
    const cell = ws.getRow(1).getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true };
    cell.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
  });

  const example = [
    "Nguyễn Văn A",
    "TZ",
    "Nhân viên kinh doanh",
    "Nam",
    "15/03/1995",
    "092095001234",
    5310000,
    500000,
    "08/2026",
    "01/08/2026",
    "Bệnh viện Đa khoa thành phố Cần Thơ",
    "TM",
  ];
  example.forEach((v, i) => {
    const cell = ws.getRow(2).getCell(i + 1);
    cell.value = v;
    cell.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
  });

  ws.columns.forEach((c, i) => {
    c.width = [20, 18, 24, 10, 18, 16, 12, 12, 16, 20, 30, 16][i] || 16;
  });

  return Buffer.from(await wb.xlsx.writeBuffer());
}
