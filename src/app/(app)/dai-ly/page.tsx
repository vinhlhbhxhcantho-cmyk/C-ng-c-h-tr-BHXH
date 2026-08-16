import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge, ButtonLink, Card, EmptyState, PageHeader } from "@/components/ui";

import { toggleAgencyStatusAction } from "./actions";

export default async function AgenciesPage() {
  await requireSuperAdmin();

  const agencies = await prisma.agency.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { units: true, users: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title="Đại lý"
        description="Danh sách các đại lý dịch vụ thuế - BHXH đang dùng nền tảng"
        action={<ButtonLink href="/dai-ly/moi">+ Thêm đại lý</ButtonLink>}
      />

      {agencies.length === 0 ? (
        <EmptyState message="Chưa có đại lý nào. Bấm “Thêm đại lý” để tạo mới." />
      ) : (
        <Card className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-4 py-3 font-medium">Tên đại lý</th>
                <th className="px-4 py-3 font-medium">Mã số thuế</th>
                <th className="px-4 py-3 font-medium">Số đơn vị</th>
                <th className="px-4 py-3 font-medium">Người dùng</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {agencies.map((agency) => (
                <tr key={agency.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {agency.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {agency.taxCode ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {agency._count.units}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {agency._count.users}
                  </td>
                  <td className="px-4 py-3">
                    {agency.status === "ACTIVE" ? (
                      <Badge color="green">Hoạt động</Badge>
                    ) : (
                      <Badge color="red">Tạm khóa</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form action={toggleAgencyStatusAction}>
                      <input type="hidden" name="agencyId" value={agency.id} />
                      <input
                        type="hidden"
                        name="status"
                        value={agency.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE"}
                      />
                      <button
                        type="submit"
                        className="text-sm text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline"
                      >
                        {agency.status === "ACTIVE" ? "Tạm khóa" : "Kích hoạt lại"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
