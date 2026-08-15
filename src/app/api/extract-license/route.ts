import { NextRequest, NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";

// §11 — Trích xuất thông tin từ PDF Giấy phép kinh doanh (chỉ PDF dạng chữ thật).
const LABELS: Record<string, RegExp> = {
  tenDonVi: /(Tên doanh nghiệp|Tên hộ kinh doanh|Tên đơn vị)\s*[:.]?\s*(.+)/i,
  mst: /(Mã số doanh nghiệp|Mã số thuế)\s*[:.]?\s*([0-9]{10,13})/i,
  diaChi: /(Địa chỉ trụ sở chính|Địa chỉ hộ kinh doanh)\s*[:.]?\s*(.+)/i,
  nguoiDaiDien: /(Đại diện theo pháp luật|Chủ hộ kinh doanh)\s*[:.]?\s*(.+)/i,
};

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "Thiếu file PDF." }, { status: 400 });
  }

  const buf = new Uint8Array(await file.arrayBuffer());
  let text = "";
  try {
    const parser = new PDFParse({ data: buf });
    const parsed = await parser.getText();
    text = parsed.text || "";
  } catch {
    return NextResponse.json({ error: "Không đọc được nội dung PDF." }, { status: 400 });
  }

  if (!text.trim()) {
    return NextResponse.json({
      error: "Không trích xuất được văn bản — file có thể là ảnh chụp/scan. Công cụ chỉ hỗ trợ PDF gốc (dạng chữ thật), không đọc được ảnh chụp.",
    }, { status: 422 });
  }

  const result: Record<string, string> = {};
  for (const [key, regex] of Object.entries(LABELS)) {
    const m = text.match(regex);
    if (m) result[key] = m[2].trim().split("\n")[0].slice(0, 300);
  }

  return NextResponse.json({
    fields: result,
    warning: "Đã trích xuất tự động từ PDF — vui lòng kiểm tra lại toàn bộ trước khi dùng.",
  });
}
