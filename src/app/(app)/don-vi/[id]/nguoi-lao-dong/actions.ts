"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAgencyUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const employeeSchema = z.object({
  unitId: z.string().min(1),
  fullName: z.string().min(2, "Họ tên phải có ít nhất 2 ký tự"),
  idNumber: z.string().optional(),
  socialInsuranceNo: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  position: z.string().optional(),
  salaryBase: z.string().optional(),
  startDate: z.string().optional(),
});

export type EmployeeFormState = { error?: string };

export async function createEmployeeAction(
  _prevState: EmployeeFormState,
  formData: FormData,
): Promise<EmployeeFormState> {
  const session = await requireAgencyUser();

  const parsed = employeeSchema.safeParse({
    unitId: formData.get("unitId"),
    fullName: formData.get("fullName"),
    idNumber: formData.get("idNumber") || undefined,
    socialInsuranceNo: formData.get("socialInsuranceNo") || undefined,
    dateOfBirth: formData.get("dateOfBirth") || undefined,
    gender: formData.get("gender") || undefined,
    position: formData.get("position") || undefined,
    salaryBase: formData.get("salaryBase") || undefined,
    startDate: formData.get("startDate") || undefined,
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

  await prisma.employee.create({
    data: {
      unitId: unit.id,
      fullName: data.fullName,
      idNumber: data.idNumber,
      socialInsuranceNo: data.socialInsuranceNo,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      gender: data.gender,
      position: data.position,
      salaryBase: data.salaryBase ? Number(data.salaryBase) : undefined,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
    },
  });

  revalidatePath(`/don-vi/${unit.id}`);
  redirect(`/don-vi/${unit.id}`);
}
