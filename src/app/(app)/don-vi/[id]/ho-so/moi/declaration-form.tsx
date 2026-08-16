"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { FormError, inputClass, labelClass } from "@/components/ui";

import {
  createDeclarationAction,
  type DeclarationFormState,
} from "../actions";

const initialState: DeclarationFormState = {};

const FORM_CODE_HINTS: Record<string, string> = {
  INCREASE: "Gợi ý: D02-LT (danh sách lao động tham gia)",
  DECREASE: "Gợi ý: D02-LT (danh sách lao động tham gia)",
  ADJUST: "Gợi ý: TK1-TS (điều chỉnh thông tin tham gia)",
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Đang tạo..." : "Tạo hồ sơ (bản nháp)"}
    </button>
  );
}

export function DeclarationForm({
  unitId,
  employees,
}: {
  unitId: string;
  employees: Array<{
    id: string;
    fullName: string;
    position: string | null;
    status: string;
  }>;
}) {
  const [state, formAction] = useActionState(
    createDeclarationAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="unitId" value={unitId} />

      <div>
        <label className={labelClass} htmlFor="type">
          Loại hồ sơ
        </label>
        <select id="type" name="type" required className={inputClass} defaultValue="INCREASE">
          <option value="INCREASE">Báo tăng</option>
          <option value="DECREASE">Báo giảm</option>
          <option value="ADJUST">Điều chỉnh mức đóng / thông tin</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="formCode">
            Mã mẫu biểu
          </label>
          <input
            id="formCode"
            name="formCode"
            required
            placeholder="D02-LT"
            className={inputClass}
          />
          <p className="mt-1 text-xs text-slate-400">
            {FORM_CODE_HINTS.INCREASE}
          </p>
        </div>
        <div>
          <label className={labelClass} htmlFor="period">
            Kỳ áp dụng
          </label>
          <input
            id="period"
            name="period"
            type="month"
            required
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="effectiveDate">
          Ngày hiệu lực
        </label>
        <input
          id="effectiveDate"
          name="effectiveDate"
          type="date"
          required
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="reason">
          Lý do (áp dụng cho tất cả lao động chọn bên dưới)
        </label>
        <input
          id="reason"
          name="reason"
          placeholder="Ví dụ: tuyển mới, chấm dứt HĐLĐ, nghỉ thai sản..."
          className={inputClass}
        />
      </div>

      <div>
        <span className={labelClass}>Chọn lao động</span>
        <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
          {employees.map((employee) => (
            <label
              key={employee.id}
              className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-slate-50"
            >
              <input
                type="checkbox"
                name="employeeIds"
                value={employee.id}
                className="h-4 w-4 rounded border-slate-300"
              />
              <span className="font-medium text-slate-900">
                {employee.fullName}
              </span>
              <span className="text-slate-400">
                {employee.position ?? "—"}
              </span>
              <span className="ml-auto text-xs text-slate-400">
                {employee.status === "ACTIVE" ? "Đang tham gia" : "Đã báo giảm"}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="note">
          Ghi chú
        </label>
        <textarea
          id="note"
          name="note"
          rows={2}
          className={inputClass}
        />
      </div>

      <FormError message={state.error} />
      <SubmitButton />
    </form>
  );
}
