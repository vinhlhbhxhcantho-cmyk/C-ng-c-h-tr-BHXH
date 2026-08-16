import "server-only";

import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SESSION_COOKIE_NAME } from "@/lib/session-constants";

export { SESSION_COOKIE_NAME };
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 ngày

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("Thiếu biến môi trường AUTH_SECRET");
  }
  return new TextEncoder().encode(secret);
}

export type UserRole = "SUPER_ADMIN" | "AGENCY_ADMIN" | "AGENCY_STAFF";

export type SessionPayload = {
  userId: string;
  agencyId: string | null;
  role: UserRole;
  fullName: string;
  agencyName: string | null;
};

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/** Bắt buộc đăng nhập; điều hướng về /login nếu chưa có phiên hợp lệ. */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/** Bắt buộc vai trò SUPER_ADMIN (quản trị nền tảng). */
export async function requireSuperAdmin(): Promise<SessionPayload> {
  const session = await requireSession();
  if (session.role !== "SUPER_ADMIN") redirect("/");
  return session;
}

/**
 * Bắt buộc người dùng thuộc một đại lý (không phải SUPER_ADMIN nền tảng).
 * Trả về agencyId để scoping mọi truy vấn dữ liệu nghiệp vụ.
 */
export async function requireAgencyUser(): Promise<
  SessionPayload & { agencyId: string }
> {
  const session = await requireSession();
  if (!session.agencyId) redirect("/");
  return session as SessionPayload & { agencyId: string };
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
