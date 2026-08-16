import Link from "next/link";

import { requireAgencyUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge, ButtonLink, Card, EmptyState, PageHeader } from "@/components/ui";

export default async function UnitsPage() {
  const session = await requireAgencyUser();

  const units = await prisma.unit.findMany({
    where: { agencyId: session.agencyId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { employees: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Đơn vị"
        description="Các đơn vị sử dụng lao động do đại lý bạn quản lý"
        action={<ButtonLink href="/don-vi/moi">+ Thêm đơn vị</ButtonLink>}
      />

      {units.length === 0 ? (
        <EmptyState message="Chưa có đơn vị nào. Bấm “Thêm đơn vị” để tạo mới." />
      ) : (
        <Card className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-4 py-3 font-medium">Tên đơn vị</th>
                <th className="px-4 py-3 font-medium">Mã số thuế</th>
                <th className="px-4 py-3 font-medium">Số lao động</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {units.map((unit) => (
                <tr key={unit.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/don-vi/${unit.id}`}
                      className="font-medium text-slate-900 hover:underline"
                    >
                      {unit.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {unit.taxCode ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {unit._count.employees}
                  </td>
                  <td className="px-4 py-3">
                    {unit.status === "ACTIVE" ? (
                      <Badge color="green">Hoạt động</Badge>
                    ) : (
                      <Badge color="slate">Ngừng</Badge>
                    )}
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
