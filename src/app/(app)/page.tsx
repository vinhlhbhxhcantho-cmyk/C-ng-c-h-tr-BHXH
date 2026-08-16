import { requireSession } from "@/lib/auth";
import { formatCurrency } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader } from "@/components/ui";

async function getAgencySummary(agencyId: string) {
  const [unitCount, employeeCount, pendingDeclarations, periods] =
    await Promise.all([
      prisma.unit.count({ where: { agencyId, status: "ACTIVE" } }),
      prisma.employee.count({
        where: { unit: { agencyId }, status: "ACTIVE" },
      }),
      prisma.declaration.count({
        where: {
          unit: { agencyId },
          status: { in: ["DRAFT", "READY", "SUBMITTED"] },
        },
      }),
      prisma.contributionPeriod.findMany({
        where: { unit: { agencyId } },
        select: { amountDue: true, amountPaid: true },
      }),
    ]);

  const totalDue = periods.reduce((sum, p) => sum + Number(p.amountDue), 0);
  const totalPaid = periods.reduce((sum, p) => sum + Number(p.amountPaid), 0);

  return { unitCount, employeeCount, pendingDeclarations, totalDue, totalPaid };
}

async function getPlatformSummary() {
  const [agencyCount, unitCount, employeeCount] = await Promise.all([
    prisma.agency.count({ where: { status: "ACTIVE" } }),
    prisma.unit.count(),
    prisma.employee.count(),
  ]);
  return { agencyCount, unitCount, employeeCount };
}

export default async function DashboardPage() {
  const session = await requireSession();

  if (session.role === "SUPER_ADMIN") {
    const summary = await getPlatformSummary();
    return (
      <div>
        <PageHeader
          title="Tổng quan nền tảng"
          description="Số liệu toàn hệ thống, tất cả các đại lý"
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <p className="text-sm text-slate-500">Đại lý đang hoạt động</p>
            <p className="mt-2 text-2xl font-semibold">
              {summary.agencyCount}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-slate-500">Tổng số đơn vị</p>
            <p className="mt-2 text-2xl font-semibold">{summary.unitCount}</p>
          </Card>
          <Card>
            <p className="text-sm text-slate-500">Tổng số lao động</p>
            <p className="mt-2 text-2xl font-semibold">
              {summary.employeeCount}
            </p>
          </Card>
        </div>
      </div>
    );
  }

  const agencyId = session.agencyId!;
  const summary = await getAgencySummary(agencyId);
  const outstanding = summary.totalDue - summary.totalPaid;

  return (
    <div>
      <PageHeader
        title="Tổng quan"
        description={`Số liệu của ${session.agencyName ?? "đại lý"}`}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-sm text-slate-500">Đơn vị đang quản lý</p>
          <p className="mt-2 text-2xl font-semibold">{summary.unitCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Lao động đang tham gia</p>
          <p className="mt-2 text-2xl font-semibold">
            {summary.employeeCount}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Hồ sơ đang xử lý</p>
          <p className="mt-2 text-2xl font-semibold">
            {summary.pendingDeclarations}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Còn phải thu (đối chiếu)</p>
          <p
            className={`mt-2 text-2xl font-semibold ${
              outstanding > 0 ? "text-amber-600" : "text-emerald-600"
            }`}
          >
            {formatCurrency(outstanding)}
          </p>
        </Card>
      </div>
    </div>
  );
}
