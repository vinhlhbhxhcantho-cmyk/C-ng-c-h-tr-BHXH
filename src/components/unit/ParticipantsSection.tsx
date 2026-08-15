"use client";

import { useState } from "react";
import { Participant } from "@/lib/types";
import { ParticipantForm } from "./ParticipantForm";
import { hospitalName, nhomName, bienDongName } from "@/lib/server-helpers";

type ImportError = { row: number; hoTen: string; ly_do: string };

export function ParticipantsSection({
  unitId,
  vung,
  allowedNhoms,
  participants,
  onChanged,
}: {
  unitId: string;
  vung: number;
  allowedNhoms: string[];
  participants: Participant[];
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState<Participant | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ createdCount: number; errors: ImportError[] } | null>(null);

  async function remove(id: string) {
    if (!confirm("Xoá người này khỏi danh sách?")) return;
    await fetch(`/api/units/${unitId}/participants/${id}`, { method: "DELETE" });
    onChanged();
  }

  async function importExcel(file: File) {
    setImporting(true);
    setImportResult(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("vung", String(vung));
    const res = await fetch(`/api/units/${unitId}/participants/import`, { method: "POST", body: fd });
    const j = await res.json();
    setImporting(false);
    setImportResult(j);
    onChanged();
  }

  return (
    <div className="space-y-4">
      <ParticipantForm
        unitId={unitId}
        vung={vung}
        allowedNhoms={allowedNhoms}
        editing={editing}
        onDone={() => {
          setEditing(null);
          onChanged();
        }}
        onCancelEdit={() => setEditing(null)}
      />

      <div className="flex flex-wrap items-center gap-2">
        <a href="/api/import-template" className="rounded border border-brown-dark text-brown-dark px-3 py-1.5 text-xs font-semibold">
          Tải mẫu Excel
        </a>
        <label className="rounded border border-brown-dark text-brown-dark px-3 py-1.5 text-xs font-semibold cursor-pointer">
          {importing ? "Đang nhập..." : "Nhập từ Excel đã điền"}
          <input
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && importExcel(e.target.files[0])}
          />
        </label>
      </div>

      {importResult && (
        <div className="rounded-md border border-brown/30 bg-white/70 p-3 text-sm space-y-2">
          <p className="font-semibold text-emerald-700">Đã thêm {importResult.createdCount} người hợp lệ.</p>
          {importResult.errors.length > 0 && (
            <div>
              <p className="font-semibold text-seal">{importResult.errors.length} dòng lỗi (chưa được thêm):</p>
              <ul className="list-disc pl-5 text-seal/90">
                {importResult.errors.map((e, i) => (
                  <li key={i}>
                    Dòng {e.row} — {e.hoTen}: {e.ly_do}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-brown/30 bg-white/60">
        <table className="w-full text-sm">
          <thead className="bg-paper-dark text-left">
            <tr>
              <th className="px-2 py-2">Họ tên</th>
              <th className="px-2 py-2">Nhóm</th>
              <th className="px-2 py-2">Chức danh</th>
              <th className="px-2 py-2">Mức đóng</th>
              <th className="px-2 py-2">KCB ban đầu</th>
              <th className="px-2 py-2">Biến động</th>
              <th className="px-2 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {participants.length === 0 && (
              <tr>
                <td colSpan={7} className="px-2 py-4 text-center text-ink/50">
                  Chưa có người tham gia nào.
                </td>
              </tr>
            )}
            {participants.map((p) => {
              const md = p.tienLuong + p.phuCap;
              return (
                <tr key={p.id} className="border-t border-brown/15">
                  <td className="px-2 py-2 font-medium">{p.hoTen}</td>
                  <td className="px-2 py-2">{nhomName(p.nhom)}</td>
                  <td className="px-2 py-2">{p.chucDanh}</td>
                  <td className="px-2 py-2 font-[family-name:var(--font-space-mono)]">
                    {md.toLocaleString("vi-VN")} đ
                    {p.phuCap > 0 && <div className="text-xs text-ink/50">(trong đó PC: {p.phuCap.toLocaleString("vi-VN")} đ)</div>}
                  </td>
                  <td className="px-2 py-2">{hospitalName(p.noiDangKyKCB)}</td>
                  <td className="px-2 py-2">
                    <span className="rounded bg-paper-dark px-1.5 py-0.5 text-xs font-semibold">{bienDongName(p.loaiBienDong)}</span>
                  </td>
                  <td className="px-2 py-2 text-right whitespace-nowrap">
                    <button onClick={() => setEditing(p)} className="text-brown-dark hover:underline mr-2">Sửa</button>
                    <button onClick={() => remove(p.id)} className="text-seal hover:underline">Xoá</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
