"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createSession, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export type LoginState = {
  error?: string;
};

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Vui lòng nhập đầy đủ email và mật khẩu hợp lệ." };
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { agency: true },
  });

  if (!user || user.status !== "ACTIVE") {
    return { error: "Email hoặc mật khẩu không đúng." };
  }

  const passwordOk = await verifyPassword(password, user.passwordHash);
  if (!passwordOk) {
    return { error: "Email hoặc mật khẩu không đúng." };
  }

  if (user.agency && user.agency.status !== "ACTIVE") {
    return { error: "Tài khoản đại lý của bạn đang bị tạm khóa." };
  }

  await createSession({
    userId: user.id,
    agencyId: user.agencyId,
    role: user.role,
    fullName: user.fullName,
    agencyName: user.agency?.name ?? null,
  });

  redirect("/");
}
