import { NextRequest, NextResponse } from "next/server";
import { getPolicyConfig, updatePolicyConfig } from "@/lib/policy";
import { PolicyConfigSchema } from "@/lib/policy-types";

export async function GET() {
  const config = await getPolicyConfig();
  return NextResponse.json(config);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const parsed = PolicyConfigSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Tham số không hợp lệ.", details: parsed.error.flatten() }, { status: 400 });
  }
  const saved = await updatePolicyConfig(parsed.data);
  return NextResponse.json(saved);
}
