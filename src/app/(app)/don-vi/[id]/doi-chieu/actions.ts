"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAgencyUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const contributionPeriodSchema = z.object({
  unitId: z.string().min(1),
  period: z.string().min(1, "Vui lòng chọn kỳ"),
  employeeCount: z.coerce.number().int().min(0),
  amountDue: z.coerce.number().min(0),
});

export type ContributionPeriodFormState = { error?: string };

export async function createContributionPeriodAction(
  _prevState: ContributionPeriodFormState,
  formData: FormData,
): Promise<ContributionPeriodFormState> {
  const session = await requireAgencyUser();

  const parsed = contributionPeriodSchema.safeParse({
    unitId: formData.get("unitId"),
    period: formData.get("period"),
    employeeCount: formData.get("employeeCount"),
    amountDue: formData.get("amountDue"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const data = parsed.data;

  const unit = await prisma.unit.findFirst({
    where: { id: data.unitId, agencyId: session.agencyId },
    select: { id: true },
  });
  if (!unit) {
    return { error: "Không tìm thấy đơn vị." };
  }

  const existing = await prisma.contributionPeriod.findFirst({
    where: { unitId: unit.id, period: data.period },
  });
  if (existing) {
    return { error: "Kỳ đối chiếu này đã tồn tại cho đơn vị." };
  }

  const contributionPeriod = await prisma.contributionPeriod.create({
    data: {
      unitId: unit.id,
      period: data.period,
      employeeCount: data.employeeCount,
      amountDue: data.amountDue,
    },
  });

  revalidatePath(`/don-vi/${unit.id}`);
  revalidatePath("/doi-chieu");
  redirect(`/doi-chieu/${contributionPeriod.id}`);
}
