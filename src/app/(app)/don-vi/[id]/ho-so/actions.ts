"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAgencyUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const declarationSchema = z.object({
  unitId: z.string().min(1),
  type: z.enum(["INCREASE", "DECREASE", "ADJUST"]),
  formCode: z.string().min(1, "Vui lòng nhập mã mẫu biểu"),
  period: z.string().min(1, "Vui lòng chọn kỳ áp dụng"),
  effectiveDate: z.string().min(1, "Vui lòng chọn ngày hiệu lực"),
  reason: z.string().optional(),
  note: z.string().optional(),
  employeeIds: z.array(z.string()).min(1, "Vui lòng chọn ít nhất một lao động"),
});

export type DeclarationFormState = { error?: string };

export async function createDeclarationAction(
  _prevState: DeclarationFormState,
  formData: FormData,
): Promise<DeclarationFormState> {
  const session = await requireAgencyUser();

  const parsed = declarationSchema.safeParse({
    unitId: formData.get("unitId"),
    type: formData.get("type"),
    formCode: formData.get("formCode"),
    period: formData.get("period"),
    effectiveDate: formData.get("effectiveDate"),
    reason: formData.get("reason") || undefined,
    note: formData.get("note") || undefined,
    employeeIds: formData.getAll("employeeIds"),
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

  const employees = await prisma.employee.findMany({
    where: { id: { in: data.employeeIds }, unitId: unit.id },
    select: { id: true, salaryBase: true },
  });

  if (employees.length === 0) {
    return { error: "Danh sách lao động đã chọn không hợp lệ." };
  }

  const declaration = await prisma.declaration.create({
    data: {
      unitId: unit.id,
      createdById: session.userId,
      type: data.type,
      formCode: data.formCode,
      period: data.period,
      note: data.note,
      items: {
        create: employees.map((employee) => ({
          employeeId: employee.id,
          effectiveDate: new Date(data.effectiveDate),
          salaryBase: employee.salaryBase,
          reason: data.reason,
        })),
      },
    },
  });

  revalidatePath(`/don-vi/${unit.id}`);
  revalidatePath("/ho-so");
  redirect(`/ho-so/${declaration.id}`);
}
