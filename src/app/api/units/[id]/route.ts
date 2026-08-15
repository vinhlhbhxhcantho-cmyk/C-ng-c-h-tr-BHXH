import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const unit = await prisma.unit.findUnique({ where: { id } });
  if (!unit) return NextResponse.json({ error: "Không tìm thấy đơn vị." }, { status: 404 });
  return NextResponse.json(unit);
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json();
  if (body.maDonVi) {
    const dup = await prisma.unit.findFirst({ where: { maDonVi: body.maDonVi, NOT: { id } } });
    if (dup) {
      return NextResponse.json({ error: `Mã đơn vị "${body.maDonVi}" đã tồn tại ở đơn vị khác.` }, { status: 409 });
    }
  }
  const unit = await prisma.unit.update({
    where: { id },
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
  return NextResponse.json(unit);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  await prisma.unit.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
