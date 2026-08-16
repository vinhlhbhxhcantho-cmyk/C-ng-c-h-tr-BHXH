"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { FormError, inputClass, labelClass } from "@/components/ui";

import { createEmployeeAction, type EmployeeFormState } from "../actions";

const initialState: EmployeeFormState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Đang lưu..." : "Lưu lao động"}
    </button>
  );
}

export function EmployeeForm({ unitId }: { unitId: string }) {
  const [state, formAction] = useActionState(
    createEmployeeAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="unitId" value={unitId} />
      <div>
        <label className={labelClass} htmlFor="fullName">
          Họ và tên
        </label>
        <input id="fullName" name="fullName" required className={inputClass} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="idNumber">
            Số CCCD
          </label>
          <input id="idNumber" name="idNumber" className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="socialInsuranceNo">
            Mã số BHXH
          </label>
          <input
            id="socialInsuranceNo"
            name="socialInsuranceNo"
            className={inputClass}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="dateOfBirth">
            Ngày sinh
          </label>
          <input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="gender">
            Giới tính
          </label>
          <select id="gender" name="gender" className={inputClass} defaultValue="">
            <option value="">Không xác định</option>
            <option value="MALE">Nam</option>
            <option value="FEMALE">Nữ</option>
            <option value="OTHER">Khác</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="position">
            Chức danh / công việc
          </label>
          <input id="position" name="position" className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="salaryBase">
            Mức lương làm căn cứ đóng (VNĐ)
          </label>
          <input
            id="salaryBase"
            name="salaryBase"
            type="number"
            min={0}
            step={1000}
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label className={labelClass} htmlFor="startDate">
          Ngày bắt đầu tham gia tại đơn vị
        </label>
        <input
          id="startDate"
          name="startDate"
          type="date"
          className={inputClass}
        />
      </div>

      <FormError message={state.error} />
      <SubmitButton />
    </form>
  );
}
