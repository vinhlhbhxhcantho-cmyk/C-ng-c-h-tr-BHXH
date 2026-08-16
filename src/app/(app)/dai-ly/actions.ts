"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { hashPassword, requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createAgencySchema = z.object({
  name: z.string().min(2, "Tên đại lý phải có ít nhất 2 ký tự"),
  taxCode: z.string().optional(),
  phone: z.string().optional(),
  adminFullName: z.string().min(2, "Vui lòng nhập tên quản trị viên"),
  adminEmail: z.string().email("Email quản trị viên không hợp lệ"),
  adminPassword: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

export type CreateAgencyState = { error?: string };

export async function createAgencyAction(
  _prevState: CreateAgencyState,
  formData: FormData,
): Promise<CreateAgencyState> {
  await requireSuperAdmin();

  const parsed = createAgencySchema.safeParse({
    name: formData.get("name"),
    taxCode: formData.get("taxCode") || undefined,
    phone: formData.get("phone") || undefined,
    adminFullName: formData.get("adminFullName"),
    adminEmail: formData.get("adminEmail"),
    adminPassword: formData.get("adminPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const data = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { email: data.adminEmail.toLowerCase() },
  });
  if (existing) {
    return { error: "Email quản trị viên đã được sử dụng." };
  }

  const passwordHash = await hashPassword(data.adminPassword);

  const agency = await prisma.agency.create({
    data: {
      name: data.name,
      taxCode: data.taxCode,
      phone: data.phone,
      users: {
        create: {
          fullName: data.adminFullName,
          email: data.adminEmail.toLowerCase(),
          passwordHash,
          role: "AGENCY_ADMIN",
        },
      },
    },
  });

  void agency;
  revalidatePath("/dai-ly");
  redirect("/dai-ly");
}

const toggleAgencyStatusSchema = z.object({
  agencyId: z.string().min(1),
  status: z.enum(["ACTIVE", "SUSPENDED"]),
});

export async function toggleAgencyStatusAction(formData: FormData) {
  await requireSuperAdmin();

  const parsed = toggleAgencyStatusSchema.safeParse({
    agencyId: formData.get("agencyId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;

  await prisma.agency.update({
    where: { id: parsed.data.agencyId },
    data: { status: parsed.data.status },
  });

  revalidatePath("/dai-ly");
}
