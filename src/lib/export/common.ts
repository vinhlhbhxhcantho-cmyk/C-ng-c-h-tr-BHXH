import { AlignmentType, Paragraph, TextRun } from "docx";

export const FONT = "Times New Roman";

export function pQuocHieu(): Paragraph[] {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM",
          bold: true,
          font: FONT,
          size: 24,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "Độc lập - Tự do - Hạnh phúc",
          bold: true,
          font: FONT,
          size: 24,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "———————————", font: FONT, size: 20 })],
    }),
  ];
}

export function pHeaderMauPhaiTrai(tenMau: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.RIGHT,
    children: [
      new TextRun({
        text: `Mẫu ${tenMau} (Ban hành kèm theo Quyết định số: 366/QĐ-BHXH ngày 29/4/2026 của BHXH Việt Nam)`,
        italics: true,
        font: FONT,
        size: 20,
      }),
    ],
  });
}

export function pTitle(text: string, sub?: string): Paragraph[] {
  const out = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: sub ? 0 : 200 },
      children: [new TextRun({ text, bold: true, font: FONT, size: 28 })],
    }),
  ];
  if (sub) {
    out.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({ text: sub, bold: true, font: FONT, size: 28 })],
      })
    );
  }
  return out;
}

export function pWarning(): Paragraph[] {
  return [
    new Paragraph({
      spacing: { before: 200, after: 100 },
      children: [
        new TextRun({
          text:
            "LƯU Ý: Đây là BẢN NHÁP DỮ LIỆU do công cụ nội bộ hỗ trợ soạn thảo, KHÔNG phải kênh nộp hồ sơ chính thức. " +
            "Hồ sơ đăng ký tham gia BHXH/BHYT/BHTN hiện phải nộp qua Cổng Dịch vụ công Quốc gia hoặc phần mềm I-VAN kết nối Cổng tiếp nhận hồ sơ (TNHS) của cơ quan BHXH. " +
            "Vui lòng kiểm tra, đối chiếu lại toàn bộ số liệu trước khi sử dụng.",
          italics: true,
          font: FONT,
          size: 18,
          color: "B22222",
        }),
      ],
    }),
  ];
}

export function normalText(text: string, opts: { bold?: boolean; size?: number } = {}) {
  return new TextRun({ text, font: FONT, size: opts.size ?? 22, bold: opts.bold });
}

export function fieldLine(label: string, value: string): Paragraph {
  return new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({ text: `${label}: `, bold: true, font: FONT, size: 22 }),
      new TextRun({ text: value || "..........................................", font: FONT, size: 22 }),
    ],
  });
}

export function fmtDate(d?: string | Date | null): string {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
}

export function fmtMoney(n: number): string {
  return Math.round(n || 0).toLocaleString("vi-VN");
}

/** Tạo header Content-Disposition an toàn cho tên file có dấu tiếng Việt (RFC 5987). */
export function contentDisposition(filename: string): string {
  const ascii = filename
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^\x20-\x7E]/g, "_");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}
