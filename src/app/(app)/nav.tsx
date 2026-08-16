"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { UserRole } from "@/lib/auth";

type NavItem = {
  href: string;
  label: string;
  roles?: UserRole[];
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Tổng quan" },
  { href: "/don-vi", label: "Đơn vị", roles: ["AGENCY_ADMIN", "AGENCY_STAFF"] },
  { href: "/ho-so", label: "Hồ sơ", roles: ["AGENCY_ADMIN", "AGENCY_STAFF"] },
  {
    href: "/doi-chieu",
    label: "Đối chiếu tiền đóng",
    roles: ["AGENCY_ADMIN", "AGENCY_STAFF"],
  },
  { href: "/nguoi-dung", label: "Người dùng", roles: ["AGENCY_ADMIN"] },
  { href: "/dai-ly", label: "Đại lý", roles: ["SUPER_ADMIN"] },
];

export function Nav({ role }: { role: UserRole }) {
  const pathname = usePathname();

  const items = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(role),
  );

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              active
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
