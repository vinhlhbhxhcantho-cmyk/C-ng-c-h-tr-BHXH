"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { FormError, inputClass, labelClass } from "@/components/ui";

import {
  createContributionPeriodAction,
  type ContributionPeriodFormState,
} from "../actions";

const initialState: ContributionPeriodFormState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Đang lưu..." : "Tạo kỳ đối chiếu"}
    </button>
  );
}

export function ContributionPeriodForm({
  unitId,
  suggestedEmployeeCount,
}: {
  unitId: string;
  suggestedEmployeeCount: number;
}) {
  const [state, formAction] = useActionState(
    createContributionPeriodAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="unitId" value={unitId} />
      <div>
        <label className={labelClass} htmlFor="period">
          Kỳ
        </label>
        <input
          id="period"
          name="period"
          type="month"
          required
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="employeeCount">
          Số lao động tham gia trong kỳ
        </label>
        <input
          id="employeeCount"
          name="employeeCount"
          type="number"
          min={0}
          defaultValue={suggestedEmployeeCount}
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="amountDue">
          Số tiền phải đóng (VNĐ)
        </label>
        <input
          id="amountDue"
          name="amountDue"
          type="number"
          min={0}
          step={1000}
          required
          className={inputClass}
        />
      </div>

      <FormError message={state.error} />
      <SubmitButton />
    </form>
  );
}
