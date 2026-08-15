import { NextRequest, NextResponse } from "next/server";

// §10 — Tra cứu MST qua các API công khai hợp pháp. KHÔNG spoof header để né chặn.
type LookupResult = {
  tenDonVi?: string;
  diaChi?: string;
  dienThoai?: string;
  nguoiDaiDien?: string;
  source: string;
};

async function tryVietQR(mst: string): Promise<LookupResult | null> {
  try {
    const res = await fetch(`https://api.vietqr.io/v2/business/${encodeURIComponent(mst)}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const data = json?.data;
    if (!data?.name) return null;
    return { tenDonVi: data.name, diaChi: data.address, source: "VietQR" };
  } catch {
    return null;
  }
}

async function tryThongTinDoanhNghiep(mst: string): Promise<LookupResult | null> {
  try {
    const res = await fetch(`https://thongtindoanhnghiep.co/api/company/${encodeURIComponent(mst)}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const d = await res.json();
    const ten = d?.Title || d?.name || d?.ten;
    if (!ten) return null;
    return {
      tenDonVi: ten,
      diaChi: d?.DiaChiCongTy || d?.address || d?.dc,
      dienThoai: d?.Phone || d?.DienThoai,
      nguoiDaiDien: d?.NguoiDaiDien || d?.daidien,
      source: "thongtindoanhnghiep.co",
    };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const mst = String(body?.mst || "").trim();
  if (!/^\d{10}(\d{3})?$/.test(mst)) {
    return NextResponse.json({ error: "Mã số thuế phải gồm 10 hoặc 13 chữ số." }, { status: 400 });
  }

  const result = (await tryVietQR(mst)) || (await tryThongTinDoanhNghiep(mst));

  if (!result) {
    return NextResponse.json({
      found: false,
      manualLinks: [
        `https://masothue.com/Search/?q=${encodeURIComponent(mst)}&type=auto`,
        `https://thongtindoanhnghiep.co/${encodeURIComponent(mst)}`,
      ],
      note: "Không tra cứu được tự động (có thể do CORS/API tạm ngưng). Vui lòng dùng liên kết tra cứu thủ công bên dưới.",
    });
  }

  return NextResponse.json({ found: true, ...result });
}
