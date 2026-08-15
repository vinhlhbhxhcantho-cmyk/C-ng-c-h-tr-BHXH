import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildTK3 } from "@/lib/export/tk3";
import { officeName, nhomName } from "@/lib/server-helpers";
import { contentDisposition } from "@/lib/export/common";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const unit = await prisma.unit.findUnique({ where: { id } });
  if (!unit) return NextResponse.json({ error: "Không tìm thấy đơn vị." }, { status: 404 });

  const sp = req.nextUrl.searchParams;
  const flow = sp.get("flow") || "new";
  if (flow !== "new") {
    return NextResponse.json(
      { error: "TK3-TS chỉ áp dụng cho luồng Đăng ký tham gia lần đầu — đơn vị đã có mã không xuất lại mẫu này." },
      { status: 400 }
    );
  }

  const nhoms = (sp.get("nhoms") || "").split(",").filter(Boolean).map(nhomName);
  const phuongThucDong = sp.get("phuongThucDong") || "";
  const noiDungYeuCau = sp.get("noiDungYeuCau") || "";

  const buf = await buildTK3({
    tenDonVi: unit.tenDonVi,
    mst: unit.mst,
    diaChiTruSo: unit.diaChiTruSo,
    diaChiLienHe: unit.diaChiLienHe,
    email: unit.email,
    dienThoai: unit.dienThoai,
    nguoiDaiDien: unit.nguoiDaiDien,
    soDinhDanhCaNhan: unit.soDinhDanhCaNhan,
    loaiHinhDonVi: unit.loaiHinhDonVi,
    nganhKinhTe: unit.nganhKinhTe,
    noiDangKyBHXHTen: officeName(unit.noiDangKyBHXH),
    nhomThamGia: nhoms,
    phuongThucDong,
    noiDungYeuCau,
  });

  return new NextResponse(new Blob([new Uint8Array(buf)]), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": contentDisposition(`TK3-TS_${unit.tenDonVi}.docx`),
    },
  });
}
