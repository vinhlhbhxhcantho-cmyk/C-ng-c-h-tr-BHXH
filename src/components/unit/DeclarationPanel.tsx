"use client";

import { NHOM_OPTIONS, LOAI_KY_OPTIONS, VUNG_OPTIONS } from "@/lib/reference";

export type DeclarationMeta = {
  selectedNhoms: string[];
  loaiKy: string;
  giaTriKy: string;
  vung: number;
  soThang: number;
  phuongThucDong: string;
  noiDungYeuCau: string;
};

export function DeclarationPanel({
  flow,
  onFlowChange,
  meta,
  onMetaChange,
  canUseTk3,
}: {
  flow: "new" | "update";
  onFlowChange: (f: "new" | "update") => void;
  meta: DeclarationMeta;
  onMetaChange: (m: DeclarationMeta) => void;
  canUseTk3: boolean;
}) {
  function set<K extends keyof DeclarationMeta>(k: K, v: DeclarationMeta[K]) {
    onMetaChange({ ...meta, [k]: v });
  }

  function toggleNhom(code: string) {
    const has = meta.selectedNhoms.includes(code);
    set("selectedNhoms", has ? meta.selectedNhoms.filter((c) => c !== code) : [...meta.selectedNhoms, code]);
  }

  return (
    <div className="rounded-lg border border-brown/30 bg-white/60 p-4 space-y-4">
      <div>
        <h2 className="font-bold text-brown-dark mb-2">Luồng nghiệp vụ</h2>
        <div className="flex gap-3 text-sm">
          <label className="flex items-center gap-1.5">
            <input type="radio" checked={flow === "new"} onChange={() => onFlowChange("new")} />
            ① Đăng ký tham gia lần đầu
          </label>
          <label className="flex items-center gap-1.5">
            <input type="radio" checked={flow === "update"} onChange={() => onFlowChange("update")} />
            ② Đơn vị đã tham gia — Báo tăng/giảm/điều chỉnh
          </label>
        </div>
        {!canUseTk3 && flow === "new" && (
          <p className="text-xs text-seal mt-1">Đơn vị đã có Mã đơn vị — cân nhắc chuyển sang luồng ② nếu đây là kỳ báo tăng/giảm.</p>
        )}
      </div>

      <div>
        <h2 className="font-bold text-brown-dark mb-2">Bước 1 — Nhóm đối tượng áp dụng cho lần khai báo này</h2>
        <div className="flex flex-wrap gap-2">
          {NHOM_OPTIONS.map((n) => (
            <label
              key={n.code}
              className={`text-xs rounded-full border px-3 py-1.5 cursor-pointer font-semibold ${
                meta.selectedNhoms.includes(n.code) ? "bg-brown text-paper border-brown" : "border-brown/40 text-brown-dark"
              }`}
            >
              <input type="checkbox" className="hidden" checked={meta.selectedNhoms.includes(n.code)} onChange={() => toggleNhom(n.code)} />
              {n.code} — {n.name}
            </label>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <label className="text-sm">
          Loại kỳ
          <select value={meta.loaiKy} onChange={(e) => set("loaiKy", e.target.value)} className="mt-1 w-full rounded border border-brown/30 px-2 py-1.5">
            {LOAI_KY_OPTIONS.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Giá trị kỳ
          <input value={meta.giaTriKy} onChange={(e) => set("giaTriKy", e.target.value)} placeholder="08/2026, Q3/2026, 2026" className="mt-1 w-full rounded border border-brown/30 px-2 py-1.5 font-[family-name:var(--font-space-mono)]" />
        </label>
        <label className="text-sm">
          Vùng lương tối thiểu
          <select value={meta.vung} onChange={(e) => set("vung", Number(e.target.value))} className="mt-1 w-full rounded border border-brown/30 px-2 py-1.5">
            {VUNG_OPTIONS.map((v) => (
              <option key={v} value={v}>Vùng {v}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Số tháng của kỳ đóng
          <select value={meta.soThang} onChange={(e) => set("soThang", Number(e.target.value))} className="mt-1 w-full rounded border border-brown/30 px-2 py-1.5">
            {[1, 3, 6].map((v) => (
              <option key={v} value={v}>{v} tháng</option>
            ))}
          </select>
        </label>
        <label className="text-sm sm:col-span-2">
          Phương thức đóng (hiển thị trên TK3-TS/TK1-TS)
          <input value={meta.phuongThucDong} onChange={(e) => set("phuongThucDong", e.target.value)} placeholder="VD: Đóng hằng tháng" className="mt-1 w-full rounded border border-brown/30 px-2 py-1.5" />
        </label>
      </div>

      {flow === "new" && (
        <label className="text-sm block">
          Nội dung yêu cầu (TK3-TS)
          <textarea value={meta.noiDungYeuCau} onChange={(e) => set("noiDungYeuCau", e.target.value)} rows={2} className="mt-1 w-full rounded border border-brown/30 px-2 py-1.5" />
        </label>
      )}
    </div>
  );
}
