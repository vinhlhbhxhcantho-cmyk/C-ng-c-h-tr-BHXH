import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPolicyConfig } from "@/lib/policy";
import { validateParticipant, ParticipantCandidate } from "@/lib/validate";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const list = await prisma.participant.findMany({ where: { unitId: id }, orderBy: { createdAt: "asc" } });
  return NextResponse.json(list);
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json();
  const vung = (body.vung || 1) as 1 | 2 | 3 | 4;

  const policy = await getPolicyConfig();
  const existing = await prisma.participant.findMany({ where: { unitId: id } });

  const candidate: ParticipantCandidate = {
    hoTen: body.hoTen,
    nhom: body.nhom,
    chucDanh: body.chucDanh,
    tienLuong: Number(body.tienLuong) || 0,
    phuCap: Number(body.phuCap) || 0,
    cccd: body.cccd,
    ngaySinh: body.ngaySinh,
    loaiBienDong: body.loaiBienDong,
  };

  const result = validateParticipant(candidate, existing, policy, vung);
  if (!result.ok) {
    return NextResponse.json({ error: "Không hợp lệ", errors: result.errors }, { status: 422 });
  }

  const participant = await prisma.participant.create({
    data: {
      unitId: id,
      hoTen: body.hoTen,
      gioiTinh: body.gioiTinh || "Nam",
      ngaySinh: body.ngaySinh ? new Date(body.ngaySinh) : null,
      cccd: body.cccd || null,
      nhom: body.nhom,
      chucDanh: body.chucDanh,
      tienLuong: Number(body.tienLuong) || 0,
      phuCap: Number(body.phuCap) || 0,
      tuThang: body.tuThang || "",
      ngayHDLDHieuLuc: body.ngayHDLDHieuLuc ? new Date(body.ngayHDLDHieuLuc) : null,
      noiDangKyKCB: body.noiDangKyKCB || null,
      loaiBienDong: body.loaiBienDong,
    },
  });
  return NextResponse.json(participant, { status: 201 });
}
