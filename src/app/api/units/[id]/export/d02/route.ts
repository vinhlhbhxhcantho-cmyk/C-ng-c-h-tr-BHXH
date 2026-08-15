import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildD02, D02Person } from "@/lib/export/d02";
import { bienDongName, hospitalName } from "@/lib/server-helpers";
import { contentDisposition } from "@/lib/export/common";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const unit = await prisma.unit.findUnique({ where: { id } });
  if (!unit) return NextResponse.json({ error: "Không tìm thấy đơn vị." }, { status: 404 });

  const sp = req.nextUrl.searchParams;
  const giaTriKy = sp.get("giaTriKy") || "";
  const loaiKy = sp.get("loaiKy") || "";

  const participants = await prisma.participant.findMany({ where: { unitId: id }, orderBy: { createdAt: "asc" } });
  if (participants.length === 0) {
    return NextResponse.json({ error: "Danh sách người tham gia đang trống." }, { status: 400 });
  }

  const persons: D02Person[] = participants.map((p) => ({
    hoTen: p.hoTen,
    chucDanh: p.chucDanh,
    tienLuong: p.tienLuong,
    phuCap: p.phuCap,
    ngayHDLDHieuLuc: p.ngayHDLDHieuLuc,
    tuThang: p.tuThang,
    noiDangKyKCBTen: hospitalName(p.noiDangKyKCB),
    loaiBienDongText: bienDongName(p.loaiBienDong),
  }));

  const buf = await buildD02({
    tenDonVi: unit.tenDonVi,
    maDonVi: unit.maDonVi || "",
    giaTriKy: `${giaTriKy} (${loaiKy})`,
    persons,
  });

  return new NextResponse(new Blob([new Uint8Array(buf)]), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": contentDisposition(`D02-LT_${unit.tenDonVi}.xlsx`),
    },
  });
}
