import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAgencyUser } from "@/lib/auth";
import { formatCurrency, formatDate, formatPeriod } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import {
  Badge,
  ButtonLink,
  Card,
  EmptyState,
  PageHeader,
} from "@/components/ui";

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

export default async function UnitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAgencyUser();
  const { id } = await params;

  const unit = await prisma.unit.findFirst({
    where: { id, agencyId: session.agencyId },
    include: {
      employees: { orderBy: { createdAt: "desc" }, take: 20 },
      declarations: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { _count: { select: { items: true } } },
      },
      contributionPeriods: {
        orderBy: { period: "desc" },
        take: 6,
      },
      _count: { select: { employees: true } },
    },
  });

  if (!unit) notFound();

  return (
    <div>
      <PageHeader
        title={unit.name}
        description={`Mã số thuế: ${unit.taxCode ?? "—"} · ${unit._count.employees} lao động`}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Lao động gần đây
            </h2>
            <Link
              href={`/don-vi/${unit.id}/nguoi-lao-dong/moi`}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 hover:underline"
            >
              + Thêm lao động
            </Link>
          </div>
          {unit.employees.length === 0 ? (
            <EmptyState message="Đơn vị chưa có lao động nào." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {unit.employees.map((employee) => (
                <li key={employee.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <p className="font-medium text-slate-900">{employee.fullName}</p>
                    <p className="text-xs text-slate-500">
                      {employee.position ?? "Chưa có chức danh"}
                    </p>
                  </div>
                  {employee.status === "ACTIVE" ? (
                    <Badge color="green">Đang tham gia</Badge>
                  ) : (
                    <Badge color="slate">Đã báo giảm</Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Hồ sơ gần đây</h2>
            <Link
              href={`/don-vi/${unit.id}/ho-so/moi`}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 hover:underline"
            >
              + Tạo hồ sơ
            </Link>
          </div>
          {unit.declarations.length === 0 ? (
            <EmptyState message="Chưa có hồ sơ báo tăng/giảm/điều chỉnh nào." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {unit.declarations.map((declaration) => {
                const statusInfo =
                  DECLARATION_STATUS_BADGE[declaration.status];
                return (
                  <li key={declaration.id} className="py-2 text-sm">
                    <Link
                      href={`/ho-so/${declaration.id}`}
                      className="flex items-center justify-between hover:underline"
                    >
                      <div>
                        <p className="font-medium text-slate-900">
                          {DECLARATION_TYPE_LABEL[declaration.type]} ·{" "}
                          {formatPeriod(declaration.period)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {declaration._count.items} lao động · {declaration.formCode}
                        </p>
                      </div>
                      <Badge color={statusInfo.color}>{statusInfo.label}</Badge>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            Đối chiếu tiền đóng theo kỳ
          </h2>
          <Link
            href={`/don-vi/${unit.id}/doi-chieu/moi`}
            className="text-sm font-medium text-slate-600 hover:text-slate-900 hover:underline"
          >
            + Tạo kỳ đối chiếu
          </Link>
        </div>
        {unit.contributionPeriods.length === 0 ? (
          <EmptyState message="Chưa có dữ liệu đối chiếu tiền đóng." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2 font-medium">Kỳ</th>
                <th className="py-2 font-medium">Số lao động</th>
                <th className="py-2 font-medium">Phải đóng</th>
                <th className="py-2 font-medium">Đã đóng</th>
                <th className="py-2 font-medium">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {unit.contributionPeriods.map((period) => (
                <tr key={period.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-2">
                    <Link
                      href={`/doi-chieu/${period.id}`}
                      className="font-medium text-slate-900 hover:underline"
                    >
                      {formatPeriod(period.period)}
                    </Link>
                  </td>
                  <td className="py-2">{period.employeeCount}</td>
                  <td className="py-2">{formatCurrency(period.amountDue)}</td>
                  <td className="py-2">{formatCurrency(period.amountPaid)}</td>
                  <td className="py-2">
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
        )}
      </Card>

      <div className="mt-4 text-xs text-slate-400">
        Tạo lúc {formatDate(unit.createdAt)}
      </div>
      <div className="mt-4">
        <ButtonLink href="/don-vi" variant="secondary">
          ← Quay lại danh sách đơn vị
        </ButtonLink>
      </div>
    </div>
  );
}
