"use client";

import { useEffect, useState } from "react";
import { PolicyConfig } from "@/lib/policy-types";
import { DraftWarning } from "@/components/WarningBanner";

export default function PolicyPage() {
  const [config, setConfig] = useState<PolicyConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/policy").then((r) => r.json()).then(setConfig);
  }, []);

  if (!config) return <p className="text-sm text-ink/60">Đang tải...</p>;

  async function save() {
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/policy", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(config) });
    setSaving(false);
    setMsg(res.ok ? "Đã lưu tham số chính sách." : "Có lỗi khi lưu.");
  }

  return (
    <div className="space-y-6">
      <DraftWarning />
      <h1 className="text-2xl font-bold text-brown-dark">Cấu hình tham số chính sách</h1>
      <p className="text-sm text-ink/70">
        Các con số dưới đây (mức tham chiếu, lương tối thiểu vùng, tỷ lệ đóng) do văn bản pháp luật quy định và thay đổi định kỳ —
        KHÔNG hard-code trong logic tính toán, chỉnh sửa trực tiếp tại đây khi có văn bản mới.
      </p>

      <div className="rounded-lg border border-brown/30 bg-white/60 p-4 space-y-3">
        <label className="text-sm block">
          Căn cứ pháp lý hiện hành
          <input value={config.canCu} onChange={(e) => setConfig({ ...config, canCu: e.target.value })} className="mt-1 w-full rounded border border-brown/30 px-2 py-1.5" />
        </label>
        <label className="text-sm block max-w-xs">
          Mức tham chiếu (đ/tháng)
          <input
            type="number"
            value={config.mucThamChieu}
            onChange={(e) => setConfig({ ...config, mucThamChieu: Number(e.target.value) })}
            className="mt-1 w-full rounded border border-brown/30 px-2 py-1.5 font-[family-name:var(--font-space-mono)]"
          />
        </label>

        <div>
          <h3 className="font-semibold text-brown-dark text-sm mb-1">Lương tối thiểu vùng (đ/tháng)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(["1", "2", "3", "4"] as const).map((v) => (
              <label key={v} className="text-sm">
                Vùng {v}
                <input
                  type="number"
                  value={config.luongToiThieuVung[v]}
                  onChange={(e) =>
                    setConfig({ ...config, luongToiThieuVung: { ...config.luongToiThieuVung, [v]: Number(e.target.value) } })
                  }
                  className="mt-1 w-full rounded border border-brown/30 px-2 py-1.5 font-[family-name:var(--font-space-mono)]"
                />
              </label>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 max-w-md">
          <label className="text-sm">
            Bội số trần BHXH/BHYT (× mức tham chiếu)
            <input type="number" value={config.boiSoTranBHXH_BHYT} onChange={(e) => setConfig({ ...config, boiSoTranBHXH_BHYT: Number(e.target.value) })} className="mt-1 w-full rounded border border-brown/30 px-2 py-1.5 font-[family-name:var(--font-space-mono)]" />
          </label>
          <label className="text-sm">
            Bội số trần BHTN (× lương tối thiểu vùng)
            <input type="number" value={config.boiSoTranBHTN} onChange={(e) => setConfig({ ...config, boiSoTranBHTN: Number(e.target.value) })} className="mt-1 w-full rounded border border-brown/30 px-2 py-1.5 font-[family-name:var(--font-space-mono)]" />
          </label>
        </div>

        {(["TZ_CZ", "Q6_KQ"] as const).map((grp) => (
          <div key={grp}>
            <h3 className="font-semibold text-brown-dark text-sm mb-1">
              Tỷ lệ đóng — Nhóm {grp === "TZ_CZ" ? "TZ/CZ (đơn vị + NLĐ)" : "Q6/KQ (tự đóng)"}
            </h3>
            <div className="overflow-x-auto">
              <table className="text-xs w-full">
                <thead>
                  <tr className="text-left">
                    <th className="py-1 pr-2">Quỹ</th>
                    <th className="py-1 pr-2">NLĐ</th>
                    <th className="py-1 pr-2">Đơn vị</th>
                  </tr>
                </thead>
                <tbody>
                  {(["oDauThaiSan", "huuTriTuTuat", "bhyt", "bhtn", "tnldBnn"] as const).map((fund) => (
                    <tr key={fund}>
                      <td className="py-1 pr-2">{fund}</td>
                      {(["nld", "donVi"] as const).map((who) => (
                        <td key={who} className="py-1 pr-2">
                          <input
                            type="number"
                            step="0.001"
                            value={config.tyLe[grp][fund][who]}
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                tyLe: {
                                  ...config.tyLe,
                                  [grp]: {
                                    ...config.tyLe[grp],
                                    [fund]: { ...config.tyLe[grp][fund], [who]: Number(e.target.value) },
                                  },
                                },
                              })
                            }
                            className="w-24 rounded border border-brown/30 px-2 py-1 font-[family-name:var(--font-space-mono)]"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {msg && <p className="text-sm text-emerald-700">{msg}</p>}
        <button onClick={save} disabled={saving} className="rounded bg-brown-dark text-paper px-4 py-2 text-sm font-semibold disabled:opacity-50">
          {saving ? "Đang lưu..." : "Lưu cấu hình"}
        </button>
      </div>
    </div>
  );
}
