import { NextResponse } from "next/server";
import { buildImportTemplate } from "@/lib/export/template";

export async function GET() {
  const buf = await buildImportTemplate();
  return new NextResponse(new Blob([new Uint8Array(buf)]), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="mau-nhap-lieu-nguoi-tham-gia.xlsx"`,
    },
  });
}
