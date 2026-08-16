import { notFound } from "next/navigation";

import { requireAgencyUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader } from "@/components/ui";

import { EmployeeForm } from "./employee-form";

export default async function NewEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAgencyUser();
  const { id } = await params;

  const unit = await prisma.unit.findFirst({
    where: { id, agencyId: session.agencyId },
    select: { id: true, name: true },
  });
  if (!unit) notFound();

  return (
    <div>
      <PageHeader
        title="Thêm lao động"
        description={`Thêm lao động mới cho đơn vị ${unit.name}`}
      />
      <Card className="max-w-xl">
        <EmployeeForm unitId={unit.id} />
      </Card>
    </div>
  );
}
