export function formatCurrency(value: unknown) {
  const num = value == null ? 0 : Number(value as number | string);
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatPeriod(period: string) {
  const [year, month] = period.split("-");
  if (!year || !month) return period;
  return `Tháng ${Number(month)}/${year}`;
}
