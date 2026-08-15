"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Unit } from "@/lib/types";
import { DraftWarning } from "@/components/WarningBanner";
import { LOAI_HINH_DON_VI, BHXH_OFFICES } from "@/lib/reference";

export default function HomePage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ tenDonVi: "", mst: "", maDonVi: "", loaiHinhDonVi: LOAI_HINH_DON_VI[0] as string, noiDangKyBHXH: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/units");
    setUnits(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  async function createUnit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const res = await fetch("/api/units", { method: "POST", body: JSON.stringify(form), headers: { "Content-Type": "application/json" } });
    setSaving(false);
    if (!res.ok) {
      const j = await res.json();
      setError(j.error || "Có lỗi xảy ra.");
      return;
    }
    setForm({ tenDonVi: "", mst: "", maDonVi: "", loaiHinhDonVi: LOAI_HINH_DON_VI[0], noiDangKyBHXH: "" });
    setShowForm(false);
    load();
  }

  return (
    <div className="space-y-6">
      <DraftWarning />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brown-dark">Danh sách đơn vị (khách hàng)</h1>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="rounded bg-brown text-paper px-4 py-2 text-sm font-semibold hover:bg-brown-dark"
        >
          {showForm ? "Đóng" : "+ Thêm đơn vị"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={createUnit} className="rounded-lg border border-brown/30 bg-white/60 p-4 space-y-3">
          {error && <p className="text-seal text-sm font-medium">{error}</p>}
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-sm">
              Tên đơn vị *
              <input required value={form.tenDonVi} onChange={(e) => setForm({ ...form, tenDonVi: e.target.value })} className="mt-1 w-full rounded border border-brown/30 px-2 py-1.5 font-[family-name:var(--font-space-mono)]" />
            </label>
            <label className="text-sm">
              Mã số thuế *
              <input required value={form.mst} onChange={(e) => setForm({ ...form, mst: e.target.value })} className="mt-1 w-full rounded border border-brown/30 px-2 py-1.5 font-[family-name:var(--font-space-mono)]" />
            </label>
            <label className="text-sm">
              Mã đơn vị (nếu đã có)
              <input value={form.maDonVi} onChange={(e) => setForm({ ...form, maDonVi: e.target.value })} placeholder="Để trống nếu đăng ký lần đầu" className="mt-1 w-full rounded border border-brown/30 px-2 py-1.5 font-[family-name:var(--font-space-mono)]" />
            </label>
            <label className="text-sm">
              Loại hình đơn vị
              <select value={form.loaiHinhDonVi} onChange={(e) => setForm({ ...form, loaiHinhDonVi: e.target.value })} className="mt-1 w-full rounded border border-brown/30 px-2 py-1.5">
                {LOAI_HINH_DON_VI.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </label>
            <label className="text-sm sm:col-span-2">
              Nơi đăng ký tham gia BHXH
              <select value={form.noiDangKyBHXH} onChange={(e) => setForm({ ...form, noiDangKyBHXH: e.target.value })} className="mt-1 w-full rounded border border-brown/30 px-2 py-1.5">
                <option value="">— Chọn —</option>
                {BHXH_OFFICES.map((o) => (
                  <option key={o.code} value={o.code}>{o.code} — {o.name}</option>
                ))}
              </select>
            </label>
          </div>
          <button disabled={saving} className="rounded bg-brown-dark text-paper px-4 py-2 text-sm font-semibold disabled:opacity-50">
            {saving ? "Đang lưu..." : "Lưu đơn vị"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-ink/60">Đang tải...</p>
      ) : units.length === 0 ? (
        <p className="text-sm text-ink/60">Chưa có đơn vị nào. Bấm &quot;+ Thêm đơn vị&quot; để bắt đầu.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-brown/30 bg-white/60">
          <table className="w-full text-sm">
            <thead className="bg-paper-dark text-left">
              <tr>
                <th className="px-3 py-2">Tên đơn vị</th>
                <th className="px-3 py-2">Mã đơn vị</th>
                <th className="px-3 py-2">MST</th>
                <th className="px-3 py-2">Người tham gia</th>
                <th className="px-3 py-2">Kỳ đã lưu</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {units.map((u) => (
                <tr key={u.id} className="border-t border-brown/15">
                  <td className="px-3 py-2 font-medium">{u.tenDonVi}</td>
                  <td className="px-3 py-2 font-[family-name:var(--font-space-mono)]">
                    {u.maDonVi || <span className="text-ink/40 italic">chưa cấp</span>}
                  </td>
                  <td className="px-3 py-2 font-[family-name:var(--font-space-mono)]">{u.mst}</td>
                  <td className="px-3 py-2">{u._count?.participants ?? 0}</td>
                  <td className="px-3 py-2">{u._count?.ledgerEntries ?? 0}</td>
                  <td className="px-3 py-2 text-right">
                    <Link href={`/units/${u.id}`} className="text-brown-dark font-semibold hover:underline">
                      Mở →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
