import { BHXH_OFFICES, HOSPITALS, NHOM_OPTIONS, BIEN_DONG_OPTIONS } from "@/lib/reference";

export function officeName(code?: string | null): string {
  if (!code) return "";
  return BHXH_OFFICES.find((o) => o.code === code)?.name || code;
}

export function hospitalName(code?: string | null): string {
  if (!code) return "";
  return HOSPITALS.find((h) => h.code === code)?.name || code;
}

export function nhomName(code: string): string {
  return NHOM_OPTIONS.find((n) => n.code === code)?.name || code;
}

export function bienDongName(code: string): string {
  return BIEN_DONG_OPTIONS.find((b) => b.code === code)?.name || code;
}
