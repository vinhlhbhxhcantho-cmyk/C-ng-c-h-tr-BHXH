import { requireAgencyUser } from "@/lib/auth";
import { Card, PageHeader } from "@/components/ui";

import { UnitForm } from "./unit-form";

export default async function NewUnitPage() {
  await requireAgencyUser();

  return (
    <div>
      <PageHeader
        title="Thêm đơn vị mới"
        description="Đơn vị sử dụng lao động sẽ tham gia BHXH thông qua đại lý bạn"
      />
      <Card className="max-w-xl">
        <UnitForm />
      </Card>
    </div>
  );
}
