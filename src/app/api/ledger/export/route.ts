import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildLedgerExport } from "@/lib/export/ledger";

export async function GET(req: NextRequest) {
  const unitId = req.nextUrl.searchParams.get("unitId");
  const entries = await prisma.ledgerEntry.findMany({
    where: unitId ? { unitId } : undefined,
    orderBy: { savedAt: "desc" },
  });

  const buf = await buildLedgerExport(
    entries.map((e) => ({
      tenDonVi: e.tenDonVi,
      maDonVi: e.maDonVi,
      loaiKy: e.loaiKy,
      giaTriKy: e.giaTriKy,
      savedAt: e.savedAt,
      soLaoDong: e.soLaoDong,
      tongQuyLuong: e.tongQuyLuong,
      soLuotTangMoi: e.soLuotTangMoi,
      soLuotGiam: e.soLuotGiam,
    }))
  );

  return new NextResponse(new Blob([new Uint8Array(buf)]), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="So-theo-doi.xlsx"`,
    },
  });
}
