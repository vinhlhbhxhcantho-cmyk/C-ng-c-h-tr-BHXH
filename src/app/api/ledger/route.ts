import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const unitId = req.nextUrl.searchParams.get("unitId");
  const entries = await prisma.ledgerEntry.findMany({
    where: unitId ? { unitId } : undefined,
    orderBy: { savedAt: "desc" },
    select: {
      id: true,
      unitId: true,
      maDonVi: true,
      tenDonVi: true,
      loaiKy: true,
      giaTriKy: true,
      savedAt: true,
      soLaoDong: true,
      tongQuyLuong: true,
      soLuotTangMoi: true,
      soLuotGiam: true,
    },
  });

  const luyKe = entries.reduce(
    (acc, e) => {
      acc.soKy += 1;
      acc.tangMoi += e.soLuotTangMoi;
      acc.giam += e.soLuotGiam;
      acc.tongQuyLuong += e.tongQuyLuong;
      return acc;
    },
    { soKy: 0, tangMoi: 0, giam: 0, tongQuyLuong: 0 }
  );

  return NextResponse.json({ entries, luyKe });
}
