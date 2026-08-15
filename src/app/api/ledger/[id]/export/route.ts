import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildD02, D02Person } from "@/lib/export/d02";
import { bienDongName, hospitalName } from "@/lib/server-helpers";
import { contentDisposition } from "@/lib/export/common";

type Ctx = { params: Promise<{ id: string }> };
type SnapshotParticipant = {
  hoTen: string;
  chucDanh: string;
  tienLuong: number;
  phuCap: number;
  ngayHDLDHieuLuc: string | null;
  tuThang: string;
  noiDangKyKCB: string | null;
  loaiBienDong: string;
};

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const entry = await prisma.ledgerEntry.findUnique({ where: { id } });
  if (!entry) return NextResponse.json({ error: "Không tìm thấy kỳ đã lưu." }, { status: 404 });

  const snapshot: SnapshotParticipant[] = JSON.parse(entry.participantsJson);
  const persons: D02Person[] = snapshot.map((p) => ({
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
    tenDonVi: entry.tenDonVi,
    maDonVi: entry.maDonVi,
    giaTriKy: `${entry.giaTriKy} (${entry.loaiKy})`,
    persons,
  });

  return new NextResponse(new Blob([new Uint8Array(buf)]), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": contentDisposition(`D02-LT_${entry.maDonVi || entry.tenDonVi}_${entry.giaTriKy}.xlsx`),
    },
  });
}
