import { PolicyConfig } from "@/lib/policy-types";
import { NhomCode, BienDongCode } from "@/lib/reference";
import { mucDong, sanToiThieu } from "@/lib/calc";

// §5.2 — chức danh nghề chung chung: danh sách từ chặn (so khớp không phân biệt hoa/thường)
export const CHUC_DANH_BLOCKLIST = [
  "nhân viên",
  "công nhân",
  "lao động",
  "người lao động",
  "nhân viên công ty",
  "làm việc",
  "khác",
  "chuyên viên",
  "quản lý",
  "giám đốc",
  "nv",
  "cnv",
  "nhân sự",
  "thợ",
  "viên chức",
];

export type ParticipantCandidate = {
  hoTen: string;
  nhom: NhomCode | "" | undefined;
  chucDanh: string;
  tienLuong: number;
  phuCap: number;
  cccd?: string;
  ngaySinh?: string | Date | null;
  loaiBienDong: BienDongCode | "" | undefined;
};

export type ExistingParticipant = {
  hoTen: string;
  cccd?: string | null;
  ngaySinh?: string | Date | null;
  loaiBienDong: string;
};

export type ValidationResult = { ok: boolean; errors: string[] };

function normalizeName(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function sameDate(a?: string | Date | null, b?: string | Date | null): boolean {
  if (!a || !b) return false;
  const da = new Date(a).toISOString().slice(0, 10);
  const db = new Date(b).toISOString().slice(0, 10);
  return da === db;
}

export function isChucDanhChungChung(chucDanh: string): boolean {
  const norm = chucDanh.trim().toLowerCase();
  if (!norm) return true;
  const words = norm.split(/\s+/).filter(Boolean);
  if (words.length === 1) return true;
  return CHUC_DANH_BLOCKLIST.includes(norm);
}

export function validateParticipant(
  candidate: ParticipantCandidate,
  existing: ExistingParticipant[],
  policy: PolicyConfig,
  vung: 1 | 2 | 3 | 4
): ValidationResult {
  const errors: string[] = [];

  // 1. Thiếu bắt buộc
  if (!candidate.hoTen || !candidate.hoTen.trim()) {
    errors.push("Thiếu họ tên.");
  }
  if (!candidate.nhom) {
    errors.push("Chưa chọn nhóm đối tượng.");
  }

  // 2. Chức danh nghề chung chung
  if (isChucDanhChungChung(candidate.chucDanh || "")) {
    errors.push(
      `Chức danh nghề "${candidate.chucDanh || ""}" quá chung chung — cần ghi rõ công việc cụ thể (VD: "Nhân viên kinh doanh", "Kế toán tổng hợp", "Thợ hàn bậc 3").`
    );
  }

  // 3. Mức đóng sai theo nhóm
  if (candidate.nhom) {
    const md = mucDong(candidate.tienLuong, candidate.phuCap);
    const san = sanToiThieu(candidate.nhom, policy, vung);
    if (md < san) {
      errors.push(
        `Mức đóng ${md.toLocaleString("vi-VN")} đ thấp hơn sàn tối thiểu của nhóm ${candidate.nhom} (${san.toLocaleString("vi-VN")} đ).`
      );
    }
  }

  // 4. Trùng người — chỉ áp dụng khi loaiBienDong = TM
  if (candidate.loaiBienDong === "TM" && candidate.hoTen) {
    const nameNorm = normalizeName(candidate.hoTen);
    const trung = existing.some((p) => {
      if (p.loaiBienDong !== "TM") return false;
      if (normalizeName(p.hoTen) !== nameNorm) return false;
      const cccdTrung =
        !!candidate.cccd && !!p.cccd && candidate.cccd.trim() === p.cccd.trim();
      const ngaySinhTrung = sameDate(candidate.ngaySinh, p.ngaySinh);
      return cccdTrung || ngaySinhTrung;
    });
    if (trung) {
      errors.push("TRÙNG NGƯỜI: đã có người cùng họ tên + (CCCD hoặc ngày sinh) với loại Tăng mới (TM) trong danh sách.");
    }
  }

  return { ok: errors.length === 0, errors };
}

export type ImportRowResult = {
  row: number;
  hoTen: string;
  ok: boolean;
  errors: string[];
};
