"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { FormError, inputClass, labelClass } from "@/components/ui";

import { createUnitAction, type UnitFormState } from "../actions";

const initialState: UnitFormState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Đang lưu..." : "Lưu đơn vị"}
    </button>
  );
}

export function UnitForm() {
  const [state, formAction] = useActionState(createUnitAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className={labelClass} htmlFor="name">
          Tên đơn vị
        </label>
        <input id="name" name="name" required className={inputClass} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="code">
            Mã đơn vị BHXH (nếu có)
          </label>
          <input id="code" name="code" className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="taxCode">
            Mã số thuế
          </label>
          <input id="taxCode" name="taxCode" className={inputClass} />
        </div>
      </div>
      <div>
        <label className={labelClass} htmlFor="address">
          Địa chỉ
        </label>
        <input id="address" name="address" className={inputClass} />
      </div>
      <div>
        <label className={labelClass} htmlFor="bhxhOfficeName">
          Cơ quan BHXH quản lý
        </label>
        <input id="bhxhOfficeName" name="bhxhOfficeName" className={inputClass} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="contactName">
            Người liên hệ
          </label>
          <input id="contactName" name="contactName" className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="contactPhone">
            Số điện thoại liên hệ
          </label>
          <input id="contactPhone" name="contactPhone" className={inputClass} />
        </div>
      </div>

      <FormError message={state.error} />
      <SubmitButton />
    </form>
  );
}
