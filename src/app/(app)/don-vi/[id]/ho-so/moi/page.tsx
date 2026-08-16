import { notFound } from "next/navigation";

import { requireAgencyUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, EmptyState, PageHeader } from "@/components/ui";

import { DeclarationForm } from "./declaration-form";

export default async function NewDeclarationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAgencyUser();
  const { id } = await params;

  const unit = await prisma.unit.findFirst({
    where: { id, agencyId: session.agencyId },
    select: {
      id: true,
      name: true,
      employees: {
        orderBy: { fullName: "asc" },
        select: { id: true, fullName: true, position: true, status: true },
      },
    },
  });
  if (!unit) notFound();

  return (
    <div>
      <PageHeader
        title="Tạo hồ sơ báo tăng / báo giảm / điều chỉnh"
        description={`Đơn vị: ${unit.name}`}
      />
      <Card className="max-w-2xl">
        {unit.employees.length === 0 ? (
          <EmptyState message="Đơn vị chưa có lao động nào. Hãy thêm lao động trước khi tạo hồ sơ." />
        ) : (
          <DeclarationForm unitId={unit.id} employees={unit.employees} />
        )}
      </Card>
    </div>
  );
}
