import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildTK1, TK1Person } from "@/lib/export/tk1";
import { hospitalName } from "@/lib/server-helpers";
import { mucDong } from "@/lib/calc";
import { contentDisposition } from "@/lib/export/common";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const unit = await prisma.unit.findUnique({ where: { id } });
  if (!unit) return NextResponse.json({ error: "Không tìm thấy đơn vị." }, { status: 404 });

  const sp = req.nextUrl.searchParams;
  const flow = sp.get("flow") || "new";
  const phuongThucDong = sp.get("phuongThucDong") || "";

  let participants = await prisma.participant.findMany({ where: { unitId: id }, orderBy: { createdAt: "asc" } });
  if (flow === "update") {
    participants = participants.filter((p) => p.loaiBienDong === "TM");
  }

  if (participants.length === 0) {
    return NextResponse.json(
      { error: flow === "update" ? "Không có người Tăng mới (TM) nào để lập TK1-TS." : "Danh sách người tham gia đang trống." },
      { status: 400 }
    );
  }

  const persons: TK1Person[] = participants.map((p) => ({
    hoTen: p.hoTen,
    gioiTinh: p.gioiTinh,
    ngaySinh: p.ngaySinh,
    cccd: p.cccd,
    nhom: p.nhom,
    noiDangKyKCBTen: hospitalName(p.noiDangKyKCB),
    mucDong: mucDong(p.tienLuong, p.phuCap),
    phuongThucDong,
  }));

  const buf = await buildTK1(persons);
  return new NextResponse(new Blob([new Uint8Array(buf)]), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": contentDisposition(`TK1-TS_${unit.tenDonVi}.docx`),
    },
  });
}
