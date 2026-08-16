"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { hashPassword, requireAgencyUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const userSchema = z.object({
  fullName: z.string().min(2, "Vui lòng nhập họ tên"),
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
  role: z.enum(["AGENCY_ADMIN", "AGENCY_STAFF"]),
});

export type UserFormState = { error?: string };

export async function createAgencyUserAction(
  _prevState: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const session = await requireAgencyUser();
  if (session.role !== "AGENCY_ADMIN") {
    return { error: "Chỉ quản trị đại lý mới có thể thêm người dùng." };
  }

  const parsed = userSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const data = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });
  if (existing) {
    return { error: "Email này đã được sử dụng." };
  }

  const passwordHash = await hashPassword(data.password);

  await prisma.user.create({
    data: {
      agencyId: session.agencyId,
      fullName: data.fullName,
      email: data.email.toLowerCase(),
      passwordHash,
      role: data.role,
    },
  });

  revalidatePath("/nguoi-dung");
  redirect("/nguoi-dung");
}

const toggleUserStatusSchema = z.object({
  userId: z.string().min(1),
  status: z.enum(["ACTIVE", "DISABLED"]),
});

export async function toggleUserStatusAction(formData: FormData) {
  const session = await requireAgencyUser();
  if (session.role !== "AGENCY_ADMIN") return;

  const parsed = toggleUserStatusSchema.safeParse({
    userId: formData.get("userId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;

  const target = await prisma.user.findFirst({
    where: { id: parsed.data.userId, agencyId: session.agencyId },
  });
  if (!target || target.id === session.userId) return;

  await prisma.user.update({
    where: { id: target.id },
    data: { status: parsed.data.status },
  });

  revalidatePath("/nguoi-dung");
}
