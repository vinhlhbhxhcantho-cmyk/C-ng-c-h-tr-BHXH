import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const units = await prisma.unit.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { participants: true, ledgerEntries: true } } },
  });
  return NextResponse.json(units);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.tenDonVi || !body.mst) {
    return NextResponse.json({ error: "Thiếu Tên đơn vị hoặc Mã số thuế." }, { status: 400 });
  }
  if (body.maDonVi) {
    const dup = await prisma.unit.findUnique({ where: { maDonVi: body.maDonVi } });
    if (dup) {
      return NextResponse.json({ error: `Mã đơn vị "${body.maDonVi}" đã tồn tại.` }, { status: 409 });
    }
  }
  const unit = await prisma.unit.create({
    data: {
      maDonVi: body.maDonVi || null,
      tenDonVi: body.tenDonVi,
      mst: body.mst,
      diaChiTruSo: body.diaChiTruSo || null,
      diaChiLienHe: body.diaChiLienHe || null,
      email: body.email || null,
      dienThoai: body.dienThoai || null,
      nguoiDaiDien: body.nguoiDaiDien || null,
      soDinhDanhCaNhan: body.soDinhDanhCaNhan || null,
      loaiHinhDonVi: body.loaiHinhDonVi || null,
      nganhKinhTe: body.nganhKinhTe || null,
      noiDangKyBHXH: body.noiDangKyBHXH || null,
    },
  });
  return NextResponse.json(unit, { status: 201 });
}
