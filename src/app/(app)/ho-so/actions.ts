"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAgencyUser } from "@/lib/auth";
import { getIVanAdapter } from "@/lib/ivan/adapter";
import { prisma } from "@/lib/prisma";

async function loadOwnedDeclaration(agencyId: string, declarationId: string) {
  return prisma.declaration.findFirst({
    where: { id: declarationId, unit: { agencyId } },
    include: { unit: true, items: { include: { employee: true } } },
  });
}

export async function markDeclarationReadyAction(formData: FormData) {
  const session = await requireAgencyUser();
  const declarationId = z.string().min(1).parse(formData.get("declarationId"));

  const declaration = await loadOwnedDeclaration(
    session.agencyId,
    declarationId,
  );
  if (!declaration || declaration.status !== "DRAFT") return;

  await prisma.declaration.update({
    where: { id: declaration.id },
    data: { status: "READY" },
  });

  revalidatePath(`/ho-so/${declaration.id}`);
  revalidatePath("/ho-so");
}

export async function submitDeclarationAction(formData: FormData) {
  const session = await requireAgencyUser();
  const declarationId = z.string().min(1).parse(formData.get("declarationId"));

  const declaration = await loadOwnedDeclaration(
    session.agencyId,
    declarationId,
  );
  if (!declaration || declaration.status !== "READY") return;

  const adapter = getIVanAdapter();
  const result = await adapter.submitDeclaration({
    declarationId: declaration.id,
    formCode: declaration.formCode,
    declarationType: declaration.type,
    unitName: declaration.unit.name,
    unitTaxCode: declaration.unit.taxCode,
    period: declaration.period,
    items: declaration.items.map((item) => ({
      employeeName: item.employee.fullName,
      idNumber: item.employee.idNumber,
      effectiveDate: item.effectiveDate,
      salaryBase: item.salaryBase ? Number(item.salaryBase) : null,
      reason: item.reason,
    })),
  });

  await prisma.declaration.update({
    where: { id: declaration.id },
    data: {
      status: result.success ? "SUBMITTED" : "READY",
      submittedAt: result.success ? new Date() : undefined,
      ivanProvider: adapter.providerName,
      ivanReferenceCode: result.referenceCode,
      ivanResponseMessage: result.message,
    },
  });

  revalidatePath(`/ho-so/${declaration.id}`);
  revalidatePath("/ho-so");
}

const decisionSchema = z.object({
  declarationId: z.string().min(1),
  decision: z.enum(["ACCEPTED", "REJECTED"]),
});

export async function recordDeclarationDecisionAction(formData: FormData) {
  const session = await requireAgencyUser();
  const parsed = decisionSchema.safeParse({
    declarationId: formData.get("declarationId"),
    decision: formData.get("decision"),
  });
  if (!parsed.success) return;

  const declaration = await loadOwnedDeclaration(
    session.agencyId,
    parsed.data.declarationId,
  );
  if (!declaration || declaration.status !== "SUBMITTED") return;

  await prisma.$transaction(async (tx) => {
    await tx.declaration.update({
      where: { id: declaration.id },
      data: { status: parsed.data.decision },
    });

    if (parsed.data.decision === "ACCEPTED") {
      const employeeIds = declaration.items.map((item) => item.employeeId);
      if (declaration.type === "DECREASE") {
        await tx.employee.updateMany({
          where: { id: { in: employeeIds } },
          data: { status: "STOPPED" },
        });
      } else if (declaration.type === "INCREASE") {
        await tx.employee.updateMany({
          where: { id: { in: employeeIds } },
          data: { status: "ACTIVE" },
        });
      }
    }
  });

  revalidatePath(`/ho-so/${declaration.id}`);
  revalidatePath("/ho-so");
  revalidatePath(`/don-vi/${declaration.unitId}`);
}
