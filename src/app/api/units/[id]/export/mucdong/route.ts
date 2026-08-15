import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPolicyConfig } from "@/lib/policy";
import { calcContribution } from "@/lib/calc";
import { NhomCode } from "@/lib/reference";
import { validateParticipant } from "@/lib/validate";
import { buildMucDong, MucDongPerson } from "@/lib/export/mucdong";
import { nhomName } from "@/lib/server-helpers";
import { contentDisposition } from "@/lib/export/common";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const unit = await prisma.unit.findUnique({ where: { id } });
  if (!unit) return NextResponse.json({ error: "Không tìm thấy đơn vị." }, { status: 404 });

  const sp = req.nextUrl.searchParams;
  const giaTriKy = sp.get("giaTriKy") || "";
  const vung = (Number(sp.get("vung")) || 1) as 1 | 2 | 3 | 4;
  const soThang = Number(sp.get("soThang")) || 1;

  const participants = await prisma.participant.findMany({ where: { unitId: id }, orderBy: { createdAt: "asc" } });
  if (participants.length === 0) {
    return NextResponse.json({ error: "Danh sách người tham gia đang trống." }, { status: 400 });
  }

  const policy = await getPolicyConfig();
  const persons: MucDongPerson[] = participants.map((p) => {
    const others = participants.filter((x) => x.id !== p.id);
    const { errors } = validateParticipant(
      {
        hoTen: p.hoTen,
        nhom: p.nhom as NhomCode,
        chucDanh: p.chucDanh,
        tienLuong: p.tienLuong,
        phuCap: p.phuCap,
        cccd: p.cccd ?? undefined,
        ngaySinh: p.ngaySinh,
        loaiBienDong: p.loaiBienDong as never,
      },
      others.map((o) => ({ hoTen: o.hoTen, cccd: o.cccd, ngaySinh: o.ngaySinh, loaiBienDong: o.loaiBienDong })),
      policy,
      vung
    );
    return {
      hoTen: p.hoTen,
      nhom: nhomName(p.nhom),
      tienLuong: p.tienLuong,
      phuCap: p.phuCap,
      breakdown: calcContribution({ nhom: p.nhom as NhomCode, tienLuong: p.tienLuong, phuCap: p.phuCap, policy, vung, soThang }),
      errors,
    };
  });

  const buf = await buildMucDong({ tenDonVi: unit.tenDonVi, maDonVi: unit.maDonVi || "", giaTriKy, persons });
  return new NextResponse(new Blob([new Uint8Array(buf)]), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": contentDisposition(`Bang-tinh-muc-dong_${unit.tenDonVi}.xlsx`),
    },
  });
}
