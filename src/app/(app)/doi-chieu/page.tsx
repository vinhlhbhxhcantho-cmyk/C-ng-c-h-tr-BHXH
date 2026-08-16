import Link from "next/link";

import { requireAgencyUser } from "@/lib/auth";
import { formatCurrency, formatPeriod } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";

export default async function ContributionsPage() {
  const session = await requireAgencyUser();

  const periods = await prisma.contributionPeriod.findMany({
    where: { unit: { agencyId: session.agencyId } },
    orderBy: [{ period: "desc" }],
    take: 100,
    include: { unit: { select: { name: true } } },
  });

  const totalDue = periods.reduce((sum, p) => sum + Number(p.amountDue), 0);
  const totalPaid = periods.reduce((sum, p) => sum + Number(p.amountPaid), 0);

  return (
    <div>
      <PageHeader
        title="Đối chiếu tiền đóng"
        description="Theo dõi số phải đóng / đã đóng theo từng kỳ, từng đơn vị"
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Tổng phải đóng</p>
          <p className="mt-2 text-2xl font-semibold">
            {formatCurrency(totalDue)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Tổng đã đóng</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-600">
            {formatCurrency(totalPaid)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Còn phải thu</p>
          <p className="mt-2 text-2xl font-semibold text-amber-600">
            {formatCurrency(totalDue - totalPaid)}
          </p>
        </Card>
      </div>

      {periods.length === 0 ? (
        <EmptyState message="Chưa có dữ liệu đối chiếu. Vào trang một đơn vị để tạo kỳ đối chiếu." />
      ) : (
        <Card className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-4 py-3 font-medium">Đơn vị</th>
                <th className="px-4 py-3 font-medium">Kỳ</th>
                <th className="px-4 py-3 font-medium">Phải đóng</th>
                <th className="px-4 py-3 font-medium">Đã đóng</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {periods.map((period) => (
                <tr
                  key={period.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/doi-chieu/${period.id}`}
                      className="font-medium text-slate-900 hover:underline"
                    >
                      {period.unit.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatPeriod(period.period)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatCurrency(period.amountDue)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatCurrency(period.amountPaid)}
                  </td>
                  <td className="px-4 py-3">
                    {period.status === "PAID" ? (
                      <Badge color="green">Đã đóng đủ</Badge>
                    ) : period.status === "PARTIAL" ? (
                      <Badge color="yellow">Đóng một phần</Badge>
                    ) : (
                      <Badge color="red">Chưa đóng</Badge>
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
