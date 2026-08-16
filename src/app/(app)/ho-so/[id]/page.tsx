import { notFound } from "next/navigation";

import { requireAgencyUser } from "@/lib/auth";
import { formatCurrency, formatDate, formatPeriod } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { Badge, ButtonLink, Card, PageHeader } from "@/components/ui";

import {
  markDeclarationReadyAction,
  recordDeclarationDecisionAction,
  submitDeclarationAction,
} from "../actions";

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

export default async function DeclarationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAgencyUser();
  const { id } = await params;

  const declaration = await prisma.declaration.findFirst({
    where: { id, unit: { agencyId: session.agencyId } },
    include: {
      unit: true,
      createdBy: { select: { fullName: true } },
      items: { include: { employee: true } },
    },
  });

  if (!declaration) notFound();

  const statusInfo = DECLARATION_STATUS_BADGE[declaration.status];

  return (
    <div>
      <PageHeader
        title={`${DECLARATION_TYPE_LABEL[declaration.type]} · ${declaration.unit.name}`}
        description={`Mẫu ${declaration.formCode} · Kỳ ${formatPeriod(declaration.period)} · Tạo bởi ${declaration.createdBy.fullName} ngày ${formatDate(declaration.createdAt)}`}
        action={<Badge color={statusInfo.color}>{statusInfo.label}</Badge>}
      />

      <Card className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Danh sách lao động ({declaration.items.length})
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="py-2 font-medium">Họ tên</th>
              <th className="py-2 font-medium">Số CCCD</th>
              <th className="py-2 font-medium">Ngày hiệu lực</th>
              <th className="py-2 font-medium">Mức lương đóng</th>
              <th className="py-2 font-medium">Lý do</th>
            </tr>
          </thead>
          <tbody>
            {declaration.items.map((item) => (
              <tr key={item.id} className="border-b border-slate-100 last:border-0">
                <td className="py-2 font-medium text-slate-900">
                  {item.employee.fullName}
                </td>
                <td className="py-2 text-slate-600">
                  {item.employee.idNumber ?? "—"}
                </td>
                <td className="py-2 text-slate-600">
                  {formatDate(item.effectiveDate)}
                </td>
                <td className="py-2 text-slate-600">
                  {item.salaryBase ? formatCurrency(item.salaryBase) : "—"}
                </td>
                <td className="py-2 text-slate-600">{item.reason ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {declaration.note ? (
          <p className="mt-3 text-sm text-slate-500">
            Ghi chú: {declaration.note}
          </p>
        ) : null}
      </Card>

      <Card className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Nộp hồ sơ điện tử
        </h2>

        {declaration.status === "DRAFT" ? (
          <form action={markDeclarationReadyAction}>
            <input type="hidden" name="declarationId" value={declaration.id} />
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Đánh dấu sẵn sàng nộp
            </button>
          </form>
        ) : null}

        {declaration.status === "READY" ? (
          <div className="space-y-3">
            <p className="text-sm text-amber-700">
              Chưa có đối tác I-VAN được cấu hình. Việc nộp bên dưới chạy ở chế
              độ giả lập để kiểm thử luồng nghiệp vụ, hồ sơ chưa được gửi thật
              lên cơ quan BHXH.
            </p>
            <form action={submitDeclarationAction}>
              <input
                type="hidden"
                name="declarationId"
                value={declaration.id}
              />
              <button
                type="submit"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
              >
                Nộp qua I-VAN (giả lập)
              </button>
            </form>
          </div>
        ) : null}

        {declaration.status === "SUBMITTED" ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Nhà cung cấp: {declaration.ivanProvider} <br />
              Mã tham chiếu: {declaration.ivanReferenceCode} <br />
              Phản hồi: {declaration.ivanResponseMessage}
            </p>
            <div className="flex gap-2">
              <form action={recordDeclarationDecisionAction}>
                <input
                  type="hidden"
                  name="declarationId"
                  value={declaration.id}
                />
                <input type="hidden" name="decision" value="ACCEPTED" />
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
                >
                  Đánh dấu đã được BHXH chấp nhận
                </button>
              </form>
              <form action={recordDeclarationDecisionAction}>
                <input
                  type="hidden"
                  name="declarationId"
                  value={declaration.id}
                />
                <input type="hidden" name="decision" value="REJECTED" />
                <button
                  type="submit"
                  className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                >
                  Đánh dấu bị từ chối
                </button>
              </form>
            </div>
          </div>
        ) : null}

        {declaration.status === "ACCEPTED" || declaration.status === "REJECTED" ? (
          <p className="text-sm text-slate-500">
            Hồ sơ đã được xử lý, không còn thao tác nào khác.
          </p>
        ) : null}
      </Card>

      <ButtonLink href={`/don-vi/${declaration.unitId}`} variant="secondary">
        ← Quay lại đơn vị
      </ButtonLink>
    </div>
  );
}
