import { notFound } from "next/navigation";

import { requireAgencyUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader } from "@/components/ui";

import { ContributionPeriodForm } from "./contribution-period-form";

export default async function NewContributionPeriodPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAgencyUser();
  const { id } = await params;

  const unit = await prisma.unit.findFirst({
    where: { id, agencyId: session.agencyId },
    select: { id: true, name: true, _count: { select: { employees: true } } },
  });
  if (!unit) notFound();

  return (
    <div>
      <PageHeader
        title="Tạo kỳ đối chiếu tiền đóng"
        description={`Đơn vị: ${unit.name}`}
      />
      <Card className="max-w-lg">
        <ContributionPeriodForm
          unitId={unit.id}
          suggestedEmployeeCount={unit._count.employees}
        />
      </Card>
    </div>
  );
}
