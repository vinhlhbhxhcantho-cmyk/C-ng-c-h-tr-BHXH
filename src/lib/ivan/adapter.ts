/**
 * Lớp trừu tượng (adapter) cho việc ký số & nộp hồ sơ giao dịch điện tử BHXH
 * qua một tổ chức I-VAN được BHXH Việt Nam công nhận.
 *
 * Ứng dụng CHƯA có hợp đồng/API thật với tổ chức I-VAN nào, nên hiện tại
 * dùng MockIVanAdapter để mô phỏng luồng nộp hồ sơ (giai đoạn 1).
 *
 * Khi ký hợp đồng với một I-VAN thật (ví dụ Thái Sơn, TS24, EFY, MISA...),
 * chỉ cần viết thêm một class implement IVanAdapter gọi API thật của họ,
 * rồi trỏ getIVanAdapter() sang class đó — toàn bộ phần còn lại của ứng
 * dụng (module hồ sơ, UI) không cần thay đổi.
 */

export type IVanSubmissionItem = {
  employeeName: string;
  idNumber: string | null;
  effectiveDate: Date;
  salaryBase: number | null;
  reason: string | null;
};

export type IVanSubmissionInput = {
  declarationId: string;
  formCode: string;
  declarationType: "INCREASE" | "DECREASE" | "ADJUST";
  unitName: string;
  unitTaxCode: string | null;
  period: string;
  items: IVanSubmissionItem[];
};

export type IVanSubmissionResult = {
  success: boolean;
  referenceCode?: string;
  message: string;
};

export interface IVanAdapter {
  readonly providerName: string;
  submitDeclaration(
    input: IVanSubmissionInput,
  ): Promise<IVanSubmissionResult>;
  checkStatus(referenceCode: string): Promise<IVanSubmissionResult>;
}

export class MockIVanAdapter implements IVanAdapter {
  readonly providerName = "Giả lập (chưa kết nối I-VAN thật)";

  async submitDeclaration(
    input: IVanSubmissionInput,
  ): Promise<IVanSubmissionResult> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (input.items.length === 0) {
      return {
        success: false,
        message: "Hồ sơ chưa có lao động nào, không thể nộp.",
      };
    }

    const referenceCode = `MOCK-${input.declarationId.slice(0, 8).toUpperCase()}-${Date.now()}`;
    return {
      success: true,
      referenceCode,
      message:
        "Đã ghi nhận hồ sơ (giả lập). Đây là môi trường thử nghiệm — chưa gửi thật lên cơ quan BHXH vì chưa cấu hình đối tác I-VAN.",
    };
  }

  async checkStatus(referenceCode: string): Promise<IVanSubmissionResult> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return {
      success: true,
      referenceCode,
      message: "Trạng thái giả lập: hồ sơ đã được tiếp nhận.",
    };
  }
}

export function getIVanAdapter(): IVanAdapter {
  // TODO(giai đoạn 2): đọc process.env.IVAN_PROVIDER để chọn adapter thật
  // tương ứng khi đã ký hợp đồng với một tổ chức I-VAN.
  return new MockIVanAdapter();
}
