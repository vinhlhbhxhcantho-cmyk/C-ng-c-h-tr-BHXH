"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { FormError, inputClass, labelClass } from "@/components/ui";

import { addPaymentAction, type PaymentFormState } from "../actions";

const initialState: PaymentFormState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Đang lưu..." : "Ghi nhận khoản nộp"}
    </button>
  );
}

export function PaymentForm({
  contributionPeriodId,
}: {
  contributionPeriodId: string;
}) {
  const [state, formAction] = useActionState(addPaymentAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input
        type="hidden"
        name="contributionPeriodId"
        value={contributionPeriodId}
      />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="amount">
            Số tiền (VNĐ)
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            min={0}
            step={1000}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="paidAt">
            Ngày nộp
          </label>
          <input
            id="paidAt"
            name="paidAt"
            type="date"
            required
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label className={labelClass} htmlFor="method">
          Hình thức
        </label>
        <input
          id="method"
          name="method"
          placeholder="Chuyển khoản, tiền mặt..."
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="note">
          Ghi chú
        </label>
        <input id="note" name="note" className={inputClass} />
      </div>

      <FormError message={state.error} />
      <SubmitButton />
    </form>
  );
}
