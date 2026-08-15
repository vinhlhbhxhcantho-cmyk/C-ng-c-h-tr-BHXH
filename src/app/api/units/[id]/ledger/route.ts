import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

// "Chốt kỳ": snapshot toàn bộ danh sách người tham gia hiện tại của đơn vị vào Sổ theo dõi.
export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json();
  const { loaiKy, giaTriKy } = body;
  if (!loaiKy || !giaTriKy) {
    return NextResponse.json({ error: "Thiếu Loại kỳ hoặc Giá trị kỳ." }, { status: 400 });
  }

  const unit = await prisma.unit.findUnique({ where: { id } });
  if (!unit) return NextResponse.json({ error: "Không tìm thấy đơn vị." }, { status: 404 });

  const participants = await prisma.participant.findMany({ where: { unitId: id }, orderBy: { createdAt: "asc" } });
  if (participants.length === 0) {
    return NextResponse.json({ error: "Danh sách người tham gia đang trống, không thể chốt kỳ." }, { status: 400 });
  }

  const soLuotTangMoi = participants.filter((p) => p.loaiBienDong === "TM").length;
  const soLuotGiam = participants.filter((p) => p.loaiBienDong === "GH").length;
  const tongQuyLuong = participants.reduce((s, p) => s + p.tienLuong + p.phuCap, 0);

  const entry = await prisma.ledgerEntry.create({
    data: {
      unitId: id,
      maDonVi: unit.maDonVi || "",
      tenDonVi: unit.tenDonVi,
      loaiKy,
      giaTriKy,
      soLaoDong: participants.length,
      tongQuyLuong,
      soLuotTangMoi,
      soLuotGiam,
      participantsJson: JSON.stringify(participants),
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
