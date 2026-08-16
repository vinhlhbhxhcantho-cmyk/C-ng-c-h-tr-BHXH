"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { FormError, inputClass, labelClass } from "@/components/ui";

import { createAgencyUserAction, type UserFormState } from "../actions";

const initialState: UserFormState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Đang tạo..." : "Tạo người dùng"}
    </button>
  );
}

export function UserForm() {
  const [state, formAction] = useActionState(
    createAgencyUserAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className={labelClass} htmlFor="fullName">
          Họ tên
        </label>
        <input id="fullName" name="fullName" required className={inputClass} />
      </div>
      <div>
        <label className={labelClass} htmlFor="email">
          Email đăng nhập
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="password">
          Mật khẩu ban đầu
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="role">
          Vai trò
        </label>
        <select id="role" name="role" className={inputClass} defaultValue="AGENCY_STAFF">
          <option value="AGENCY_STAFF">Nhân viên</option>
          <option value="AGENCY_ADMIN">Quản trị đại lý</option>
        </select>
      </div>

      <FormError message={state.error} />
      <SubmitButton />
    </form>
  );
}
