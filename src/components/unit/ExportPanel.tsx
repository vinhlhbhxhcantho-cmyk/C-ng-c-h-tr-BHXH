"use client";

import { useState } from "react";
import { DeclarationMeta } from "./DeclarationPanel";

function downloadUrl(url: string) {
  window.open(url, "_blank");
}

export function ExportPanel({
  unitId,
  flow,
  meta,
  participantCount,
  onSaved,
}: {
  unitId: string;
  flow: "new" | "update";
  meta: DeclarationMeta;
  participantCount: number;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const qs = new URLSearchParams({
    flow,
    giaTriKy: meta.giaTriKy,
    loaiKy: meta.loaiKy,
    vung: String(meta.vung),
    soThang: String(meta.soThang),
    phuongThucDong: meta.phuongThucDong,
    noiDungYeuCau: meta.noiDungYeuCau,
    nhoms: meta.selectedNhoms.join(","),
  }).toString();

  async function chotKy() {
    setError("");
    setOk("");
    if (!meta.giaTriKy) {
      setError("Vui lòng nhập Giá trị kỳ trước khi chốt kỳ.");
      return;
    }
    if (participantCount === 0) {
      setError("Danh sách người tham gia đang trống.");
      return;
    }
    if (!confirm(`Chốt kỳ ${meta.giaTriKy} (${meta.loaiKy}) với ${participantCount} người? Dữ liệu sẽ được lưu vào Sổ theo dõi.`)) return;
    setSaving(true);
    const res = await fetch(`/api/units/${unitId}/ledger`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loaiKy: meta.loaiKy, giaTriKy: meta.giaTriKy }),
    });
    setSaving(false);
    if (!res.ok) {
      setError((await res.json()).error || "Lỗi khi chốt kỳ.");
      return;
    }
    setOk("Đã chốt kỳ và lưu vào Sổ theo dõi.");
    onSaved();
  }

  return (
    <div className="rounded-lg border border-brown/30 bg-white/60 p-4 space-y-3">
      <h2 className="font-bold text-brown-dark">Xuất hồ sơ (bản nháp dữ liệu)</h2>
      {error && <p className="text-seal text-sm">{error}</p>}
      {ok && <p className="text-emerald-700 text-sm">{ok}</p>}

      <div className="flex flex-wrap gap-2">
        {flow === "new" && (
          <button onClick={() => downloadUrl(`/api/units/${unitId}/export/tk3?${qs}`)} className="rounded border border-brown-dark text-brown-dark px-3 py-1.5 text-xs font-semibold">
            TK3-TS (.docx)
          </button>
        )}
        <button onClick={() => downloadUrl(`/api/units/${unitId}/export/tk1?${qs}`)} className="rounded border border-brown-dark text-brown-dark px-3 py-1.5 text-xs font-semibold">
          TK1-TS (.docx) {flow === "update" && "— chỉ người TM"}
        </button>
        <button onClick={() => downloadUrl(`/api/units/${unitId}/export/d02?${qs}`)} className="rounded border border-brown-dark text-brown-dark px-3 py-1.5 text-xs font-semibold">
          D02-LT (.xlsx)
        </button>
        <button onClick={() => downloadUrl(`/api/units/${unitId}/export/dutoan?${qs}`)} className="rounded border border-brown-dark text-brown-dark px-3 py-1.5 text-xs font-semibold">
          Bảng dự toán (.xlsx)
        </button>
        <button onClick={() => downloadUrl(`/api/units/${unitId}/export/mucdong?${qs}`)} className="rounded border border-brown-dark text-brown-dark px-3 py-1.5 text-xs font-semibold">
          Bảng tính mức đóng (.xlsx)
        </button>
      </div>

      <div className="pt-2 border-t border-brown/20">
        <button onClick={chotKy} disabled={saving} className="rounded bg-brown-dark text-paper px-4 py-2 text-sm font-semibold disabled:opacity-50">
          {saving ? "Đang chốt kỳ..." : "Chốt kỳ → lưu vào Sổ theo dõi"}
        </button>
        <p className="text-xs text-ink/50 mt-1">Chốt kỳ sẽ snapshot toàn bộ danh sách người tham gia hiện tại vào Sổ theo dõi cho kỳ đã chọn ở trên.</p>
      </div>
    </div>
  );
}
