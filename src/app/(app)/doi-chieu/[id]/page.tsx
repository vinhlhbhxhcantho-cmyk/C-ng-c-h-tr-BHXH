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

import { PaymentForm } from "./payment-form";

export default async function ContributionPeriodDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAgencyUser();
  const { id } = await params;

  const period = await prisma.contributionPeriod.findFirst({
    where: { id, unit: { agencyId: session.agencyId } },
    include: {
      unit: true,
      payments: { orderBy: { paidAt: "desc" } },
    },
  });

  if (!period) notFound();

  const outstanding = Number(period.amountDue) - Number(period.amountPaid);

  return (
    <div>
      <PageHeader
        title={`Đối chiếu kỳ ${formatPeriod(period.period)}`}
        description={period.unit.name}
        action={
          period.status === "PAID" ? (
            <Badge color="green">Đã đóng đủ</Badge>
          ) : period.status === "PARTIAL" ? (
            <Badge color="yellow">Đóng một phần</Badge>
          ) : (
            <Badge color="red">Chưa đóng</Badge>
          )
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Phải đóng</p>
                <p className="mt-1 text-lg font-semibold">
                  {formatCurrency(period.amountDue)}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Đã đóng</p>
                <p className="mt-1 text-lg font-semibold text-emerald-600">
                  {formatCurrency(period.amountPaid)}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Còn lại</p>
                <p
                  className={`mt-1 text-lg font-semibold ${
                    outstanding > 0 ? "text-amber-600" : "text-slate-900"
                  }`}
                >
                  {formatCurrency(Math.max(outstanding, 0))}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="mb-3 text-sm font-semibold text-slate-900">
              Lịch sử nộp tiền
            </h2>
            {period.payments.length === 0 ? (
              <EmptyState message="Chưa ghi nhận khoản nộp nào cho kỳ này." />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="py-2 font-medium">Ngày nộp</th>
                    <th className="py-2 font-medium">Số tiền</th>
                    <th className="py-2 font-medium">Hình thức</th>
                    <th className="py-2 font-medium">Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {period.payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-2">{formatDate(payment.paidAt)}</td>
                      <td className="py-2">{formatCurrency(payment.amount)}</td>
                      <td className="py-2 text-slate-600">
                        {payment.method ?? "—"}
                      </td>
                      <td className="py-2 text-slate-600">
                        {payment.note ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-slate-900">
            Ghi nhận khoản nộp
          </h2>
          <PaymentForm contributionPeriodId={period.id} />
        </Card>
      </div>

      <div className="mt-6">
        <ButtonLink href={`/don-vi/${period.unitId}`} variant="secondary">
          ← Quay lại đơn vị
        </ButtonLink>
      </div>
    </div>
  );
}
