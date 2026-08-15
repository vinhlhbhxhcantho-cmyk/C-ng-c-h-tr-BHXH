"use client";

import { useState } from "react";
import { Participant } from "@/lib/types";
import { NHOM_OPTIONS, BIEN_DONG_OPTIONS, HOSPITALS, NhomCode, BienDongCode } from "@/lib/reference";

const emptyForm = {
  hoTen: "",
  gioiTinh: "Nam",
  ngaySinh: "",
  cccd: "",
  nhom: "" as NhomCode | "",
  chucDanh: "",
  tienLuong: "",
  phuCap: "",
  tuThang: "",
  ngayHDLDHieuLuc: "",
  noiDangKyKCB: "",
  loaiBienDong: "" as BienDongCode | "",
};

export function ParticipantForm({
  unitId,
  vung,
  allowedNhoms,
  editing,
  onDone,
  onCancelEdit,
}: {
  unitId: string;
  vung: number;
  allowedNhoms: string[];
  editing: Participant | null;
  onDone: () => void;
  onCancelEdit: () => void;
}) {
  const [form, setForm] = useState(
    editing
      ? {
          hoTen: editing.hoTen,
          gioiTinh: editing.gioiTinh,
          ngaySinh: editing.ngaySinh ? editing.ngaySinh.slice(0, 10) : "",
          cccd: editing.cccd || "",
          nhom: editing.nhom as NhomCode,
          chucDanh: editing.chucDanh,
          tienLuong: String(editing.tienLuong),
          phuCap: String(editing.phuCap),
          tuThang: editing.tuThang,
          ngayHDLDHieuLuc: editing.ngayHDLDHieuLuc ? editing.ngayHDLDHieuLuc.slice(0, 10) : "",
          noiDangKyKCB: editing.noiDangKyKCB || "",
          loaiBienDong: editing.loaiBienDong as BienDongCode,
        }
      : emptyForm
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const options = NHOM_OPTIONS.filter((n) => allowedNhoms.length === 0 || allowedNhoms.includes(n.code));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);
    setSaving(true);
    const url = editing ? `/api/units/${unitId}/participants/${editing.id}` : `/api/units/${unitId}/participants`;
    const res = await fetch(url, {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, vung }),
    });
    setSaving(false);
    if (!res.ok) {
      const j = await res.json();
      setErrors(j.errors || [j.error || "Có lỗi xảy ra."]);
      return;
    }
    setForm(emptyForm);
    onDone();
  }

  const mucDong = (Number(form.tienLuong) || 0) + (Number(form.phuCap) || 0);

  return (
    <form onSubmit={submit} className="rounded-lg border border-brown/30 bg-white/70 p-4 space-y-3">
      <h3 className="font-semibold text-brown-dark text-sm">{editing ? `Sửa: ${editing.hoTen}` : "Thêm người tham gia"}</h3>
      {errors.length > 0 && (
        <ul className="text-sm text-seal list-disc pl-5 space-y-0.5">
          {errors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}
      <div className="grid sm:grid-cols-3 gap-3">
        <label className="text-sm sm:col-span-2">
          Họ tên *
          <input required value={form.hoTen} onChange={(e) => set("hoTen", e.target.value)} className="mt-1 w-full rounded border border-brown/30 px-2 py-1.5" />
        </label>
        <label className="text-sm">
          Giới tính
          <select value={form.gioiTinh} onChange={(e) => set("gioiTinh", e.target.value)} className="mt-1 w-full rounded border border-brown/30 px-2 py-1.5">
            <option>Nam</option>
            <option>Nữ</option>
          </select>
        </label>
        <label className="text-sm">
          Ngày sinh
          <input type="date" value={form.ngaySinh} onChange={(e) => set("ngaySinh", e.target.value)} className="mt-1 w-full rounded border border-brown/30 px-2 py-1.5 font-[family-name:var(--font-space-mono)]" />
        </label>
        <label className="text-sm">
          Số CCCD
          <input value={form.cccd} onChange={(e) => set("cccd", e.target.value)} className="mt-1 w-full rounded border border-brown/30 px-2 py-1.5 font-[family-name:var(--font-space-mono)]" />
        </label>
        <label className="text-sm">
          Nhóm *
          <select required value={form.nhom} onChange={(e) => set("nhom", e.target.value)} className="mt-1 w-full rounded border border-brown/30 px-2 py-1.5">
            <option value="">— Chọn —</option>
            {options.map((n) => (
              <option key={n.code} value={n.code}>{n.code} — {n.name}</option>
            ))}
          </select>
        </label>
        <label className="text-sm sm:col-span-2">
          Chức danh nghề (ghi cụ thể) *
          <input required value={form.chucDanh} onChange={(e) => set("chucDanh", e.target.value)} placeholder='VD: "Nhân viên kinh doanh", "Kế toán tổng hợp"' className="mt-1 w-full rounded border border-brown/30 px-2 py-1.5" />
        </label>
        <label className="text-sm">
          Tiền lương (đ/tháng) *
          <input required type="number" min={0} value={form.tienLuong} onChange={(e) => set("tienLuong", e.target.value)} className="mt-1 w-full rounded border border-brown/30 px-2 py-1.5 font-[family-name:var(--font-space-mono)]" />
        </label>
        <label className="text-sm">
          Phụ cấp (đ/tháng)
          <input type="number" min={0} value={form.phuCap} onChange={(e) => set("phuCap", e.target.value)} className="mt-1 w-full rounded border border-brown/30 px-2 py-1.5 font-[family-name:var(--font-space-mono)]" />
        </label>
        <div className="text-sm flex flex-col justify-end">
          <span className="text-ink/60 text-xs">Mức đóng</span>
          <span className="font-[family-name:var(--font-space-mono)] font-bold">{mucDong.toLocaleString("vi-VN")} đ</span>
          {Number(form.phuCap) > 0 && <span className="text-xs text-ink/50">(trong đó PC: {Number(form.phuCap).toLocaleString("vi-VN")} đ)</span>}
        </div>
        <label className="text-sm">
          Từ tháng/năm (MM/YYYY) *
          <input required value={form.tuThang} onChange={(e) => set("tuThang", e.target.value)} placeholder="08/2026" className="mt-1 w-full rounded border border-brown/30 px-2 py-1.5 font-[family-name:var(--font-space-mono)]" />
        </label>
        <label className="text-sm">
          Ngày HĐLĐ hiệu lực
          <input type="date" value={form.ngayHDLDHieuLuc} onChange={(e) => set("ngayHDLDHieuLuc", e.target.value)} className="mt-1 w-full rounded border border-brown/30 px-2 py-1.5 font-[family-name:var(--font-space-mono)]" />
        </label>
        <label className="text-sm sm:col-span-2">
          Nơi đăng ký KCB ban đầu
          <input list="hospitals-list" value={form.noiDangKyKCB} onChange={(e) => set("noiDangKyKCB", e.target.value)} className="mt-1 w-full rounded border border-brown/30 px-2 py-1.5" />
          <datalist id="hospitals-list">
            {HOSPITALS.map((h) => (
              <option key={h.code} value={h.code}>{h.name}</option>
            ))}
          </datalist>
        </label>
        <label className="text-sm">
          Loại biến động *
          <select required value={form.loaiBienDong} onChange={(e) => set("loaiBienDong", e.target.value)} className="mt-1 w-full rounded border border-brown/30 px-2 py-1.5">
            <option value="">— Chọn —</option>
            {BIEN_DONG_OPTIONS.map((b) => (
              <option key={b.code} value={b.code}>{b.code} — {b.name}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex gap-2">
        <button disabled={saving} className="rounded bg-brown text-paper px-4 py-2 text-sm font-semibold disabled:opacity-50">
          {saving ? "Đang lưu..." : editing ? "Cập nhật" : "+ Thêm vào danh sách"}
        </button>
        {editing && (
          <button type="button" onClick={onCancelEdit} className="rounded border border-brown/40 px-4 py-2 text-sm">
            Huỷ sửa
          </button>
        )}
      </div>
    </form>
  );
}
