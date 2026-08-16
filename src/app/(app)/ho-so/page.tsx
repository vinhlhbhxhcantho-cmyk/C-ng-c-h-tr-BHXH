import Link from "next/link";

import { requireAgencyUser } from "@/lib/auth";
import { formatPeriod } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";

const DECLARATION_TYPE_LABEL: Record<string, string> = {
  INCREASE: "Báo tăng",
  DECREASE: "Báo giảm",
  ADJUST: "Điều chỉnh",
};

const DECLARATION_STATUS_BADGE: Record<
  string,
  { label: string; color: "slate" | "green" | "yellow" | "red" | "blue" }
> = {
  DRAFT: { label: "Đang soạn", color: "slate" },
  READY: { label: "Sẵn sàng nộp", color: "blue" },
  SUBMITTED: { label: "Đã nộp", color: "yellow" },
  ACCEPTED: { label: "Đã chấp nhận", color: "green" },
  REJECTED: { label: "Bị từ chối", color: "red" },
};

export default async function DeclarationsPage() {
  const session = await requireAgencyUser();

  const declarations = await prisma.declaration.findMany({
    where: { unit: { agencyId: session.agencyId } },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      unit: { select: { name: true } },
      _count: { select: { items: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title="Hồ sơ"
        description="Hồ sơ báo tăng / báo giảm / điều chỉnh của tất cả đơn vị"
      />

      {declarations.length === 0 ? (
        <EmptyState message="Chưa có hồ sơ nào. Vào trang một đơn vị để tạo hồ sơ mới." />
      ) : (
        <Card className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-4 py-3 font-medium">Đơn vị</th>
                <th className="px-4 py-3 font-medium">Loại</th>
                <th className="px-4 py-3 font-medium">Kỳ</th>
                <th className="px-4 py-3 font-medium">Số lao động</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {declarations.map((declaration) => {
                const statusInfo = DECLARATION_STATUS_BADGE[declaration.status];
                return (
                  <tr
                    key={declaration.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/ho-so/${declaration.id}`}
                        className="font-medium text-slate-900 hover:underline"
                      >
                        {declaration.unit.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {DECLARATION_TYPE_LABEL[declaration.type]}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatPeriod(declaration.period)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {declaration._count.items}
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={statusInfo.color}>{statusInfo.label}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
