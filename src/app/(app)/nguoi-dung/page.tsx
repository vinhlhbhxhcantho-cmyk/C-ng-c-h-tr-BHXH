import { requireAgencyUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge, ButtonLink, Card, EmptyState, PageHeader } from "@/components/ui";

import { toggleUserStatusAction } from "./actions";

const ROLE_LABELS: Record<string, string> = {
  AGENCY_ADMIN: "Quản trị đại lý",
  AGENCY_STAFF: "Nhân viên",
};

export default async function AgencyUsersPage() {
  const session = await requireAgencyUser();

  const users = await prisma.user.findMany({
    where: { agencyId: session.agencyId },
    orderBy: { createdAt: "asc" },
  });

  const canManage = session.role === "AGENCY_ADMIN";

  return (
    <div>
      <PageHeader
        title="Người dùng"
        description="Tài khoản nhân viên trong đại lý của bạn"
        action={
          canManage ? (
            <ButtonLink href="/nguoi-dung/moi">+ Thêm người dùng</ButtonLink>
          ) : undefined
        }
      />

      {users.length === 0 ? (
        <EmptyState message="Chưa có người dùng nào." />
      ) : (
        <Card className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-4 py-3 font-medium">Họ tên</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Vai trò</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                {canManage ? <th className="px-4 py-3 font-medium"></th> : null}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {user.fullName}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{user.email}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {ROLE_LABELS[user.role] ?? user.role}
                  </td>
                  <td className="px-4 py-3">
                    {user.status === "ACTIVE" ? (
                      <Badge color="green">Hoạt động</Badge>
                    ) : (
                      <Badge color="red">Đã khóa</Badge>
                    )}
                  </td>
                  {canManage ? (
                    <td className="px-4 py-3 text-right">
                      {user.id !== session.userId ? (
                        <form action={toggleUserStatusAction}>
                          <input type="hidden" name="userId" value={user.id} />
                          <input
                            type="hidden"
                            name="status"
                            value={user.status === "ACTIVE" ? "DISABLED" : "ACTIVE"}
                          />
                          <button
                            type="submit"
                            className="text-sm text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline"
                          >
                            {user.status === "ACTIVE" ? "Khóa" : "Mở khóa"}
                          </button>
                        </form>
                      ) : null}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
