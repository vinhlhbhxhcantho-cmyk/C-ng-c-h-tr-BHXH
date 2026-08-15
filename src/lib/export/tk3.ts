import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, BorderStyle } from "docx";
import { FONT, pQuocHieu, pHeaderMauPhaiTrai, pTitle, pWarning, normalText } from "./common";

export type TK3UnitInput = {
  tenDonVi: string;
  mst: string;
  diaChiTruSo?: string | null;
  diaChiLienHe?: string | null;
  email?: string | null;
  dienThoai?: string | null;
  nguoiDaiDien?: string | null;
  soDinhDanhCaNhan?: string | null;
  loaiHinhDonVi?: string | null;
  nganhKinhTe?: string | null;
  noiDangKyBHXHTen?: string | null;
  nhomThamGia: string[]; // tên các nhóm đã chọn
  phuongThucDong: string; // "1 tháng" | "3 tháng" | "6 tháng"
  noiDungYeuCau: string;
};

const noBorder = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

function twoCol(rows: [string, string][]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noBorder,
    rows: rows.map(
      ([label, value]) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 40, type: WidthType.PERCENTAGE },
              borders: noBorder,
              children: [new Paragraph({ children: [normalText(label, { bold: true })] })],
            }),
            new TableCell({
              width: { size: 60, type: WidthType.PERCENTAGE },
              borders: noBorder,
              children: [new Paragraph({ children: [normalText(value || "..........................................")] })],
            }),
          ],
        })
    ),
  });
}

export async function buildTK3(unit: TK3UnitInput): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          pHeaderMauPhaiTrai("TK3-TS"),
          ...pQuocHieu(),
          ...pTitle("TỜ KHAI", "ĐƠN VỊ ĐĂNG KÝ, ĐIỀU CHỈNH THÔNG TIN THAM GIA\nBẢO HIỂM XÃ HỘI, BẢO HIỂM Y TẾ"),
          ...pWarning(),
          new Paragraph({ spacing: { before: 200 }, children: [normalText("I. THÔNG TIN ĐƠN VỊ", { bold: true, size: 24 })] }),
          twoCol([
            ["[01] Tên đơn vị", unit.tenDonVi],
            ["[02] Mã số thuế", unit.mst],
            ["[03] Địa chỉ trụ sở chính", unit.diaChiTruSo || ""],
            ["[04] Địa chỉ liên hệ", unit.diaChiLienHe || ""],
            ["[05] Email", unit.email || ""],
            ["[06] Điện thoại", unit.dienThoai || ""],
            ["[07] Người đại diện theo pháp luật", unit.nguoiDaiDien || ""],
            ["[08] Số định danh cá nhân", unit.soDinhDanhCaNhan || ""],
            ["[09] Loại hình đơn vị", unit.loaiHinhDonVi || ""],
            ["[10] Ngành kinh tế", unit.nganhKinhTe || ""],
            ["[11] Đối tượng tham gia", unit.nhomThamGia.join(", ")],
            ["[12] Phương thức đóng", unit.phuongThucDong],
            ["[13] Nơi đăng ký tham gia BHXH", unit.noiDangKyBHXHTen || ""],
          ]),
          new Paragraph({ spacing: { before: 200 }, children: [normalText("[14] Nội dung yêu cầu:", { bold: true })] }),
          new Paragraph({ spacing: { after: 200 }, children: [normalText(unit.noiDungYeuCau || "Đăng ký tham gia BHXH, BHYT, BHTN lần đầu cho đơn vị và người lao động thuộc đơn vị.")] }),
          new Paragraph({ spacing: { before: 400 }, children: [normalText("Tôi cam đoan những nội dung kê khai trên là đúng và chịu trách nhiệm trước pháp luật về những nội dung đã kê khai.", { size: 20 })] }),
        ],
      },
    ],
    styles: { default: { document: { run: { font: FONT } } } },
  });
  return Packer.toBuffer(doc);
}
