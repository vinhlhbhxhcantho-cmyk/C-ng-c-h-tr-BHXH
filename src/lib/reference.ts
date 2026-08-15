import bhxhOfficesRaw from "@/data/bhxh-offices.json";
import hospitalsRaw from "@/data/hospitals.json";

export type RefItem = { code: string; name: string };

export const BHXH_OFFICES: RefItem[] = bhxhOfficesRaw;

// Danh mục mẫu — CẦN thay bằng danh mục chính thức do đơn vị cung cấp (xem đặc tả §6.2).
export const HOSPITALS: RefItem[] = hospitalsRaw;
export const HOSPITALS_IS_PLACEHOLDER = true;

export const NHOM_OPTIONS = [
  { code: "TZ", name: "NLĐ & Giám đốc (chủ DN) hưởng lương", hasBHTN: true },
  { code: "Q6", name: "Giám đốc (chủ DN) không hưởng lương", hasBHTN: false },
  { code: "KQ", name: "Chủ hộ kinh doanh", hasBHTN: false },
  { code: "CZ", name: "Nhân viên của hộ kinh doanh", hasBHTN: true },
] as const;

export type NhomCode = (typeof NHOM_OPTIONS)[number]["code"];

export const BIEN_DONG_OPTIONS = [
  { code: "TM", name: "Tăng mới lao động" },
  { code: "GH", name: "Giảm hẳn (nghỉ việc/chấm dứt tham gia)" },
  { code: "DC", name: "Điều chỉnh tiền lương" },
  { code: "CD", name: "Điều chỉnh chức danh nghề" },
] as const;

export type BienDongCode = (typeof BIEN_DONG_OPTIONS)[number]["code"];

export const LOAI_HINH_DON_VI = [
  "Cty TNHH",
  "Cty cổ phần",
  "DN tư nhân",
  "Hộ kinh doanh",
  "Hợp tác xã",
  "DN vốn nước ngoài",
] as const;

export const LOAI_KY_OPTIONS = ["Tháng", "Quý", "Năm"] as const;

export const VUNG_OPTIONS = [1, 2, 3, 4] as const;
