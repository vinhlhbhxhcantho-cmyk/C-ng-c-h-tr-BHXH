import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/db";
import { getPolicyConfig } from "@/lib/policy";
import { validateParticipant, ParticipantCandidate, ExistingParticipant } from "@/lib/validate";
import { NHOM_OPTIONS, BIEN_DONG_OPTIONS } from "@/lib/reference";

type Ctx = { params: Promise<{ id: string }> };

function parseVNDate(v: unknown): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  const s = String(v).trim();
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function cellText(v: ExcelJS.CellValue): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "object" && "text" in (v as { text?: string })) return String((v as { text?: string }).text ?? "");
  if (typeof v === "object" && "result" in (v as { result?: unknown })) return String((v as { result?: unknown }).result ?? "");
  return String(v);
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const form = await req.formData();
  const file = form.get("file");
  const vung = Number(form.get("vung") || 1) as 1 | 2 | 3 | 4;

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "Thiếu file Excel." }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf as unknown as ExcelJS.Buffer);
  const ws = wb.worksheets[0];
  if (!ws) return NextResponse.json({ error: "File Excel không có sheet dữ liệu." }, { status: 400 });

  const policy = await getPolicyConfig();
  const existingDb = await prisma.participant.findMany({ where: { unitId: id } });
  const existing: ExistingParticipant[] = existingDb.map((p) => ({
    hoTen: p.hoTen,
    cccd: p.cccd,
    ngaySinh: p.ngaySinh,
    loaiBienDong: p.loaiBienDong,
  }));

  const nhomCodes = new Set(NHOM_OPTIONS.map((n) => n.code));
  const bienDongCodes = new Set(BIEN_DONG_OPTIONS.map((b) => b.code));

  const errors: { row: number; hoTen: string; ly_do: string }[] = [];
  const toCreate: Array<Record<string, unknown>> = [];

  const rowCount = ws.rowCount;
  for (let r = 2; r <= rowCount; r++) {
    const row = ws.getRow(r);
    const hoTen = cellText(row.getCell(1).value).trim();
    const nhomRaw = cellText(row.getCell(2).value).trim().toUpperCase();
    const chucDanh = cellText(row.getCell(3).value).trim();
    const gioiTinh = cellText(row.getCell(4).value).trim() || "Nam";
    const ngaySinh = parseVNDate(row.getCell(5).value);
    const cccd = cellText(row.getCell(6).value).trim();
    const tienLuong = Number(row.getCell(7).value) || 0;
    const phuCap = Number(row.getCell(8).value) || 0;
    const tuThang = cellText(row.getCell(9).value).trim();
    const ngayHDLDHieuLuc = parseVNDate(row.getCell(10).value);
    const noiDangKyKCB = cellText(row.getCell(11).value).trim();
    const loaiBienDongRaw = cellText(row.getCell(12).value).trim().toUpperCase();

    if (!hoTen && !nhomRaw && !chucDanh) continue; // dòng trống, bỏ qua âm thầm

    const rowErrors: string[] = [];
    if (nhomRaw && !nhomCodes.has(nhomRaw as never)) rowErrors.push(`Nhóm "${nhomRaw}" không hợp lệ (chỉ nhận TZ/Q6/KQ/CZ).`);
    if (loaiBienDongRaw && !bienDongCodes.has(loaiBienDongRaw as never)) rowErrors.push(`Loại biến động "${loaiBienDongRaw}" không hợp lệ (chỉ nhận TM/GH/DC/CD).`);

    const candidate: ParticipantCandidate = {
      hoTen,
      nhom: nhomCodes.has(nhomRaw as never) ? (nhomRaw as ParticipantCandidate["nhom"]) : undefined,
      chucDanh,
      tienLuong,
      phuCap,
      cccd,
      ngaySinh,
      loaiBienDong: bienDongCodes.has(loaiBienDongRaw as never) ? (loaiBienDongRaw as ParticipantCandidate["loaiBienDong"]) : undefined,
    };

    const result = validateParticipant(candidate, existing, policy, vung);
    const allErrors = [...rowErrors, ...result.errors];

    if (allErrors.length > 0) {
      errors.push({ row: r, hoTen: hoTen || "(không có tên)", ly_do: allErrors.join(" | ") });
      continue;
    }

    const created = {
      unitId: id,
      hoTen,
      gioiTinh,
      ngaySinh,
      cccd: cccd || null,
      nhom: nhomRaw,
      chucDanh,
      tienLuong,
      phuCap,
      tuThang,
      ngayHDLDHieuLuc,
      noiDangKyKCB: noiDangKyKCB || null,
      loaiBienDong: loaiBienDongRaw,
    };
    toCreate.push(created);
    // cho phép các dòng sau trong cùng file so trùng với dòng vừa thêm
    existing.push({ hoTen, cccd, ngaySinh, loaiBienDong: loaiBienDongRaw });
  }

  let created: Awaited<ReturnType<typeof prisma.participant.create>>[] = [];
  if (toCreate.length > 0) {
    await prisma.$transaction(
      toCreate.map((data) =>
        prisma.participant.create({ data: data as Parameters<typeof prisma.participant.create>[0]["data"] })
      )
    ).then((res) => (created = res));
  }

  return NextResponse.json({ createdCount: created.length, created, errors });
}
