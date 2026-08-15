"use client";

import { useState } from "react";
import { Unit } from "@/lib/types";
import { LOAI_HINH_DON_VI, BHXH_OFFICES } from "@/lib/reference";

type Flow = "new" | "update";

export function UnitInfoForm({
  unit,
  flow,
  onSaved,
}: {
  unit: Unit;
  flow: Flow;
  onSaved: (u: Unit) => void;
}) {
  const [form, setForm] = useState({
    maDonVi: unit.maDonVi || "",
    tenDonVi: unit.tenDonVi,
    mst: unit.mst,
    diaChiTruSo: unit.diaChiTruSo || "",
    diaChiLienHe: unit.diaChiLienHe || "",
    email: unit.email || "",
    dienThoai: unit.dienThoai || "",
    nguoiDaiDien: unit.nguoiDaiDien || "",
    soDinhDanhCaNhan: unit.soDinhDanhCaNhan || "",
    loaiHinhDonVi: unit.loaiHinhDonVi || LOAI_HINH_DON_VI[0],
    nganhKinhTe: unit.nganhKinhTe || "",
    noiDangKyBHXH: unit.noiDangKyBHXH || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [manualLinks, setManualLinks] = useState<string[] | null>(null);
  const [extracting, setExtracting] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    setSaving(true);
    setError("");
    setMsg("");
    const res = await fetch(`/api/units/${unit.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      setError((await res.json()).error || "Lỗi khi lưu.");
      return;
    }
    const updated = await res.json();
    onSaved(updated);
    setMsg("Đã lưu thông tin đơn vị.");
  }

  async function lookupMst() {
    if (!form.mst) return;
    setLookingUp(true);
    setManualLinks(null);
    setError("");
    const res = await fetch("/api/mst-lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mst: form.mst }),
    });
    const j = await res.json();
    setLookingUp(false);
    if (!res.ok) {
      setError(j.error || "Không tra cứu được.");
      return;
    }
    if (!j.found) {
      setManualLinks(j.manualLinks);
      setError(j.note);
      return;
    }
    setForm((f) => ({
      ...f,
      tenDonVi: f.tenDonVi || j.tenDonVi || f.tenDonVi,
      diaChiTruSo: f.diaChiTruSo || j.diaChi || f.diaChiTruSo,
      diaChiLienHe: f.diaChiLienHe || j.diaChi || f.diaChiLienHe,
      dienThoai: f.dienThoai || j.dienThoai || f.dienThoai,
      nguoiDaiDien: f.nguoiDaiDien || j.nguoiDaiDien || f.nguoiDaiDien,
    }));
    setMsg(`Đã điền tự động từ ${j.source} — vui lòng kiểm tra lại.`);
  }

  async function uploadLicense(file: File) {
    setExtracting(true);
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/extract-license", { method: "POST", body: fd });
    const j = await res.json();
    setExtracting(false);
    if (!res.ok) {
      setError(j.error || "Không trích xuất được.");
      return;
    }
    const f = j.fields || {};
    setForm((prev) => ({
      ...prev,
      tenDonVi: prev.tenDonVi || f.tenDonVi || prev.tenDonVi,
      mst: prev.mst || f.mst || prev.mst,
      diaChiTruSo: prev.diaChiTruSo || f.diaChi || prev.diaChiTruSo,
      nguoiDaiDien: prev.nguoiDaiDien || f.nguoiDaiDien || prev.nguoiDaiDien,
    }));
    setMsg(j.warning);
  }

  const isUpdate = flow === "update";

  return (
    <div className="rounded-lg border border-brown/30 bg-white/60 p-4 space-y-3">
      <h2 className="font-bold text-brown-dark">Thông tin đơn vị</h2>
      {error && <p className="text-seal text-sm">{error}</p>}
      {manualLinks && (
        <ul className="text-sm text-brown-dark list-disc pl-5">
          {manualLinks.map((l) => (
            <li key={l}>
              <a href={l} target="_blank" rel="noreferrer" className="underline">{l}</a>
            </li>
          ))}
        </ul>
      )}
      {msg && <p className="text-sm text-emerald-700">{msg}</p>}

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="text-sm sm:col-span-2">
          Mã đơn vị {isUpdate && <span className="text-seal">*</span>}
          <input
            value={form.maDonVi}
            onChange={(e) => set("maDonVi", e.target.value)}
            placeholder={isUpdate ? "Bắt buộc — mã do cơ quan BHXH cấp" : "Để trống nếu đăng ký lần đầu"}
            className="mt-1 w-full rounded border border-brown/30 px-2 py-1.5 font-[family-name:var(--font-space-mono)]"
          />
        </label>
        <label className="text-sm">
          Tên đơn vị
          <input value={form.tenDonVi} onChange={(e) => set("tenDonVi", e.target.value)} className="mt-1 w-full rounded border border-brown/30 px-2 py-1.5 font-[family-name:var(--font-space-mono)]" />
        </label>
        <label className="text-sm">
          Nơi đăng ký tham gia BHXH
          <select value={form.noiDangKyBHXH} onChange={(e) => set("noiDangKyBHXH", e.target.value)} className="mt-1 w-full rounded border border-brown/30 px-2 py-1.5">
            <option value="">— Chọn —</option>
            {BHXH_OFFICES.map((o) => (
              <option key={o.code} value={o.code}>{o.code} — {o.name}</option>
            ))}
          </select>
        </label>

        {!isUpdate && (
          <>
            <label className="text-sm flex items-end gap-2">
              <span className="flex-1">
                Mã số thuế
                <input value={form.mst} onChange={(e) => set("mst", e.target.value)} className="mt-1 w-full rounded border border-brown/30 px-2 py-1.5 font-[family-name:var(--font-space-mono)]" />
              </span>
              <button type="button" onClick={lookupMst} disabled={lookingUp} className="rounded border border-brown-dark text-brown-dark px-2 py-1.5 text-xs font-semibold whitespace-nowrap disabled:opacity-50">
                {lookingUp ? "Đang tra..." : "Tra cứu MST"}
              </button>
            </label>
            <label className="text-sm">
              Đại lý tra mã đơn vị đã có
              <a href="https://baohiemxahoi.gov.vn/tracuu/Pages/don-vi-tham-gia-bhxh.aspx" target="_blank" rel="noreferrer" className="mt-1 block rounded border border-brown/30 px-2 py-1.5 text-brown-dark underline text-center">
                Mở Cổng tra cứu BHXH Việt Nam ↗
              </a>
            </label>
            <label className="text-sm">
              Địa chỉ trụ sở chính
              <input value={form.diaChiTruSo} onChange={(e) => set("diaChiTruSo", e.target.value)} className="mt-1 w-full rounded border border-brown/30 px-2 py-1.5" />
            </label>
            <label className="text-sm">
              Địa chỉ liên hệ
              <input value={form.diaChiLienHe} onChange={(e) => set("diaChiLienHe", e.target.value)} className="mt-1 w-full rounded border border-brown/30 px-2 py-1.5" />
            </label>
            <label className="text-sm">
              Email
              <input value={form.email} onChange={(e) => set("email", e.target.value)} className="mt-1 w-full rounded border border-brown/30 px-2 py-1.5" />
            </label>
            <label className="text-sm">
              Điện thoại
              <input value={form.dienThoai} onChange={(e) => set("dienThoai", e.target.value)} className="mt-1 w-full rounded border border-brown/30 px-2 py-1.5" />
            </label>
            <label className="text-sm">
              Người đại diện theo pháp luật
              <input value={form.nguoiDaiDien} onChange={(e) => set("nguoiDaiDien", e.target.value)} className="mt-1 w-full rounded border border-brown/30 px-2 py-1.5" />
            </label>
            <label className="text-sm">
              Số định danh cá nhân
              <input value={form.soDinhDanhCaNhan} onChange={(e) => set("soDinhDanhCaNhan", e.target.value)} className="mt-1 w-full rounded border border-brown/30 px-2 py-1.5 font-[family-name:var(--font-space-mono)]" />
            </label>
            <label className="text-sm">
              Loại hình đơn vị
              <select value={form.loaiHinhDonVi} onChange={(e) => set("loaiHinhDonVi", e.target.value)} className="mt-1 w-full rounded border border-brown/30 px-2 py-1.5">
                {LOAI_HINH_DON_VI.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Ngành kinh tế
              <input value={form.nganhKinhTe} onChange={(e) => set("nganhKinhTe", e.target.value)} className="mt-1 w-full rounded border border-brown/30 px-2 py-1.5" />
            </label>
            <label className="text-sm sm:col-span-2">
              Trích xuất từ Giấy phép kinh doanh (PDF gốc, không phải ảnh scan)
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => e.target.files?.[0] && uploadLicense(e.target.files[0])}
                className="mt-1 w-full rounded border border-brown/30 px-2 py-1.5 text-xs"
              />
              {extracting && <span className="text-xs text-ink/60">Đang trích xuất...</span>}
            </label>
          </>
        )}
      </div>

      <button onClick={save} disabled={saving} className="rounded bg-brown-dark text-paper px-4 py-2 text-sm font-semibold disabled:opacity-50">
        {saving ? "Đang lưu..." : "Lưu thông tin đơn vị"}
      </button>
    </div>
  );
}
