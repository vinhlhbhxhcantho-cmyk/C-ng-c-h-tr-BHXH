"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Unit, LedgerEntrySummary, LuyKe } from "@/lib/types";
import { DraftWarning } from "@/components/WarningBanner";

function LedgerContent() {
  const sp = useSearchParams();
  const router = useRouter();
  const unitId = sp.get("unitId") || "";
  const [units, setUnits] = useState<Unit[]>([]);
  const [entries, setEntries] = useState<LedgerEntrySummary[]>([]);
  const [luyKe, setLuyKe] = useState<LuyKe>({ soKy: 0, tangMoi: 0, giam: 0, tongQuyLuong: 0 });
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<null | { entry: LedgerEntrySummary; participants: Record<string, unknown>[] }>(null);

  async function load() {
    setLoading(true);
    const [unitsRes, ledgerRes] = await Promise.all([
      fetch("/api/units"),
      fetch(`/api/ledger${unitId ? `?unitId=${unitId}` : ""}`),
    ]);
    setUnits(await unitsRes.json());
    const j = await ledgerRes.json();
    setEntries(j.entries);
    setLuyKe(j.luyKe);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitId]);

  async function viewDetail(id: string) {
    const res = await fetch(`/api/ledger/${id}`);
    const j = await res.json();
    setDetail({ entry: j, participants: j.participants });
  }

  async function remove(id: string) {
    if (!confirm("Xoá kỳ đã lưu này khỏi Sổ theo dõi?")) return;
    await fetch(`/api/ledger/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <DraftWarning />
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-brown-dark">Sổ theo dõi lao động &amp; quỹ lương</h1>
        <div className="flex items-center gap-2">
          <select
            value={unitId}
            onChange={(e) => router.push(e.target.value ? `/ledger?unitId=${e.target.value}` : "/ledger")}
            className="rounded border border-brown/30 px-2 py-1.5 text-sm"
          >
            <option value="">Tất cả đơn vị</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>{u.tenDonVi}</option>
            ))}
          </select>
          <a href={`/api/ledger/export${unitId ? `?unitId=${unitId}` : ""}`} className="rounded border border-brown-dark text-brown-dark px-3 py-1.5 text-xs font-semibold">
            Xuất Excel
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Số kỳ đã lưu", value: luyKe.soKy },
          { label: "Luỹ kế Tăng mới (TM)", value: luyKe.tangMoi },
          { label: "Luỹ kế Giảm (GH)", value: luyKe.giam },
          { label: "Tổng quỹ lương luỹ kế", value: `${Math.round(luyKe.tongQuyLuong).toLocaleString("vi-VN")} đ` },
        ].map((c) => (
          <div key={c.label} className="rounded-lg border border-brown/30 bg-white/60 p-3">
            <p className="text-xs text-ink/60">{c.label}</p>
            <p className="font-[family-name:var(--font-space-mono)] font-bold text-lg text-brown-dark">{c.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-ink/60">Đang tải...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-brown/30 bg-white/60">
          <table className="w-full text-sm">
            <thead className="bg-paper-dark text-left">
              <tr>
                <th className="px-2 py-2">Kỳ</th>
                <th className="px-2 py-2">Đơn vị</th>
                <th className="px-2 py-2">Số lao động</th>
                <th className="px-2 py-2">Tổng quỹ lương</th>
                <th className="px-2 py-2">Ngày lưu</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-2 py-4 text-center text-ink/50">Chưa có kỳ nào được lưu.</td>
                </tr>
              )}
              {entries.map((e) => (
                <tr key={e.id} className="border-t border-brown/15">
                  <td className="px-2 py-2 font-medium">{e.giaTriKy} ({e.loaiKy})</td>
                  <td className="px-2 py-2">{e.tenDonVi}</td>
                  <td className="px-2 py-2">{e.soLaoDong}</td>
                  <td className="px-2 py-2 font-[family-name:var(--font-space-mono)]">{Math.round(e.tongQuyLuong).toLocaleString("vi-VN")} đ</td>
                  <td className="px-2 py-2">{new Date(e.savedAt).toLocaleString("vi-VN")}</td>
                  <td className="px-2 py-2 text-right whitespace-nowrap">
                    <button onClick={() => viewDetail(e.id)} className="text-brown-dark hover:underline mr-2">Xem</button>
                    <a href={`/api/ledger/${e.id}/export`} className="text-brown-dark hover:underline mr-2">Xuất</a>
                    <button onClick={() => remove(e.id)} className="text-seal hover:underline">Xoá</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={() => setDetail(null)}>
          <div className="bg-paper rounded-lg max-w-3xl w-full max-h-[80vh] overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-brown-dark">
                {detail.entry.tenDonVi} — Kỳ {detail.entry.giaTriKy} ({detail.entry.loaiKy})
              </h3>
              <button onClick={() => setDetail(null)} className="text-ink/50">✕</button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-brown/30">
                  <th className="py-1">Họ tên</th>
                  <th className="py-1">Nhóm</th>
                  <th className="py-1">Mức đóng</th>
                  <th className="py-1">Biến động</th>
                </tr>
              </thead>
              <tbody>
                {detail.participants.map((p, i) => (
                  <tr key={i} className="border-b border-brown/10">
                    <td className="py-1">{String(p.hoTen)}</td>
                    <td className="py-1">{String(p.nhom)}</td>
                    <td className="py-1 font-[family-name:var(--font-space-mono)]">
                      {(Number(p.tienLuong) + Number(p.phuCap)).toLocaleString("vi-VN")} đ
                    </td>
                    <td className="py-1">{String(p.loaiBienDong)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LedgerPage() {
  return (
    <Suspense fallback={<p className="text-sm text-ink/60">Đang tải...</p>}>
      <LedgerContent />
    </Suspense>
  );
}
