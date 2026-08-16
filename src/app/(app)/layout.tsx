import { requireSession } from "@/lib/auth";

import { LogoutButton } from "./logout-button";
import { Nav } from "./nav";

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Quản trị nền tảng",
  AGENCY_ADMIN: "Quản trị đại lý",
  AGENCY_STAFF: "Nhân viên đại lý",
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 flex-shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-6">
        <div className="mb-8 px-2">
          <p className="text-sm font-semibold text-slate-900">
            Công cụ hỗ trợ BHXH
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {session.agencyName ?? "Quản trị nền tảng"}
          </p>
        </div>
        <Nav role={session.role} />
        <div className="mt-auto border-t border-slate-200 pt-4">
          <p className="px-2 text-sm font-medium text-slate-900">
            {session.fullName}
          </p>
          <p className="px-2 text-xs text-slate-500">
            {ROLE_LABELS[session.role] ?? session.role}
          </p>
          <div className="mt-2">
            <LogoutButton />
          </div>
        </div>
      </aside>
      <main className="flex-1 px-8 py-6">{children}</main>
    </div>
  );
}
