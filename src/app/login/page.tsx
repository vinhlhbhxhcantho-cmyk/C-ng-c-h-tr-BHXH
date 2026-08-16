import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";

import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-lg font-semibold text-slate-900">
            Công cụ hỗ trợ BHXH
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Đăng nhập vào hệ thống quản lý đại lý
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
