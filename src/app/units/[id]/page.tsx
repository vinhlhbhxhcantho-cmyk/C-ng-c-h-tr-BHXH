"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Unit, Participant } from "@/lib/types";
import { DraftWarning } from "@/components/WarningBanner";
import { UnitInfoForm } from "@/components/unit/UnitInfoForm";
import { DeclarationPanel, DeclarationMeta } from "@/components/unit/DeclarationPanel";
import { ParticipantsSection } from "@/components/unit/ParticipantsSection";
import { ExportPanel } from "@/components/unit/ExportPanel";

export default function UnitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [flow, setFlow] = useState<"new" | "update">("new");
  const [meta, setMeta] = useState<DeclarationMeta>({
    selectedNhoms: [],
    loaiKy: "Tháng",
    giaTriKy: "",
    vung: 1,
    soThang: 1,
    phuongThucDong: "Đóng hằng tháng",
    noiDungYeuCau: "Đăng ký tham gia BHXH, BHYT, BHTN lần đầu cho đơn vị và người lao động thuộc đơn vị.",
  });

  async function loadUnit() {
    const res = await fetch(`/api/units/${id}`);
    if (res.ok) {
      const u = await res.json();
      setUnit(u);
      setFlow(u.maDonVi ? "update" : "new");
    }
  }

  async function loadParticipants() {
    const res = await fetch(`/api/units/${id}/participants`);
    if (res.ok) setParticipants(await res.json());
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUnit();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadParticipants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!unit) return <p className="text-sm text-ink/60">Đang tải...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/" className="text-xs text-brown-dark hover:underline">← Danh sách đơn vị</Link>
          <h1 className="text-2xl font-bold text-brown-dark">{unit.tenDonVi}</h1>
        </div>
        <Link href={`/ledger?unitId=${unit.id}`} className="text-sm text-brown-dark font-semibold hover:underline">
          Xem Sổ theo dõi của đơn vị →
        </Link>
      </div>

      <DraftWarning />

      <DeclarationPanel flow={flow} onFlowChange={setFlow} meta={meta} onMetaChange={setMeta} canUseTk3={!unit.maDonVi} />

      <UnitInfoForm unit={unit} flow={flow} onSaved={setUnit} />

      <div>
        <h2 className="font-bold text-brown-dark mb-2">Danh sách người tham gia</h2>
        <ParticipantsSection
          unitId={unit.id}
          vung={meta.vung}
          allowedNhoms={meta.selectedNhoms}
          participants={participants}
          onChanged={loadParticipants}
        />
      </div>

      <ExportPanel unitId={unit.id} flow={flow} meta={meta} participantCount={participants.length} onSaved={loadParticipants} />
    </div>
  );
}
