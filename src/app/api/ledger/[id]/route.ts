import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const entry = await prisma.ledgerEntry.findUnique({ where: { id } });
  if (!entry) return NextResponse.json({ error: "Không tìm thấy kỳ đã lưu." }, { status: 404 });
  return NextResponse.json({ ...entry, participants: JSON.parse(entry.participantsJson) });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  await prisma.ledgerEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
