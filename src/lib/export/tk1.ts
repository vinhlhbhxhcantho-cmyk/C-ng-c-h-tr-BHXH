import { Document, Packer, Paragraph, PageBreak } from "docx";
import { FONT, pQuocHieu, pHeaderMauPhaiTrai, pTitle, pWarning, fieldLine, normalText, fmtDate, fmtMoney } from "./common";

export type TK1Person = {
  hoTen: string;
  gioiTinh: string;
  ngaySinh?: string | Date | null;
  cccd?: string | null;
  nhom: string;
  noiDangKyKCBTen?: string | null;
  mucDong: number;
  phuongThucDong: string;
};

function personBlock(p: TK1Person, index: number, isKhongLuong: boolean) {
  const children: Paragraph[] = [
    new Paragraph({
      spacing: { before: 200, after: 100 },
      children: [normalText(`— Người thứ ${index}: ${p.hoTen} —`, { bold: true, size: 24 })],
    }),
    new Paragraph({ spacing: { after: 60 }, children: [normalText("I. Thông tin chung", { bold: true })] }),
    fieldLine("[01] Họ và tên", p.hoTen),
    fieldLine("[02] Giới tính", p.gioiTinh),
    fieldLine("[03] Ngày sinh", fmtDate(p.ngaySinh)),
    fieldLine("[04] Số CCCD/định danh cá nhân", p.cccd || ""),
    fieldLine("[05] Dân tộc", ""),
    fieldLine("[06] Quốc tịch", "Việt Nam"),
    fieldLine("[07] Số điện thoại", ""),
    fieldLine("[08] Email", ""),
    fieldLine("[09] Nơi đăng ký khám chữa bệnh ban đầu", p.noiDangKyKCBTen || ""),
    fieldLine("[10] Hình thức nhận kết quả", ""),
    new Paragraph({ spacing: { before: 100, after: 60 }, children: [normalText("II. Thông tin bổ sung", { bold: true })] }),
  ];

  if (isKhongLuong) {
    children.push(
      fieldLine("Mức đóng", `${fmtMoney(p.mucDong)} đ/tháng`),
      fieldLine("Phương thức đóng", p.phuongThucDong),
      fieldLine("Đối tượng tham gia", p.nhom)
    );
  } else {
    children.push(
      new Paragraph({
        spacing: { after: 100 },
        children: [normalText("Không áp dụng — mức lương/chức danh đã thể hiện tại D02-LT.", { size: 20 })],
      })
    );
  }
  return children;
}

export async function buildTK1(persons: TK1Person[]): Promise<Buffer> {
  const body: Paragraph[] = [];
  persons.forEach((p, i) => {
    if (i > 0) body.push(new Paragraph({ children: [new PageBreak()] }));
    body.push(...personBlock(p, i + 1, p.nhom === "Q6" || p.nhom === "KQ"));
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          pHeaderMauPhaiTrai("TK1-TS"),
          ...pQuocHieu(),
          ...pTitle("TỜ KHAI", "THAM GIA, ĐIỀU CHỈNH THÔNG TIN\nBẢO HIỂM XÃ HỘI, BẢO HIỂM Y TẾ"),
          ...pWarning(),
          new Paragraph({
            spacing: { after: 100 },
            children: [normalText(`Tổng số người kê khai trong tài liệu này: ${persons.length}`, { bold: true })],
          }),
          ...body,
        ],
      },
    ],
    styles: { default: { document: { run: { font: FONT } } } },
  });
  return Packer.toBuffer(doc);
}
