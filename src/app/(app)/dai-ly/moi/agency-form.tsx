"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { FormError, inputClass, labelClass } from "@/components/ui";

import { createAgencyAction, type CreateAgencyState } from "../actions";

const initialState: CreateAgencyState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Đang tạo..." : "Tạo đại lý"}
    </button>
  );
}

export function AgencyForm() {
  const [state, formAction] = useActionState(createAgencyAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className={labelClass} htmlFor="name">
          Tên đại lý
        </label>
        <input id="name" name="name" required className={inputClass} />
      </div>
      <div>
        <label className={labelClass} htmlFor="taxCode">
          Mã số thuế (nếu có)
        </label>
        <input id="taxCode" name="taxCode" className={inputClass} />
      </div>
      <div>
        <label className={labelClass} htmlFor="phone">
          Số điện thoại
        </label>
        <input id="phone" name="phone" className={inputClass} />
      </div>

      <hr className="border-slate-200" />
      <p className="text-sm font-medium text-slate-700">
        Tài khoản quản trị viên đại lý
      </p>

      <div>
        <label className={labelClass} htmlFor="adminFullName">
          Họ tên
        </label>
        <input
          id="adminFullName"
          name="adminFullName"
          required
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="adminEmail">
          Email đăng nhập
        </label>
        <input
          id="adminEmail"
          name="adminEmail"
          type="email"
          required
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="adminPassword">
          Mật khẩu ban đầu
        </label>
        <input
          id="adminPassword"
          name="adminPassword"
          type="password"
          required
          minLength={6}
          className={inputClass}
        />
      </div>

      <FormError message={state.error} />
      <SubmitButton />
    </form>
  );
}
