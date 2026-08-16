import { requireSuperAdmin } from "@/lib/auth";
import { Card, PageHeader } from "@/components/ui";

import { AgencyForm } from "./agency-form";

export default async function NewAgencyPage() {
  await requireSuperAdmin();

  return (
    <div>
      <PageHeader
        title="Thêm đại lý mới"
        description="Tạo đại lý và tài khoản quản trị viên đầu tiên cho đại lý đó"
      />
      <Card className="max-w-xl">
        <AgencyForm />
      </Card>
    </div>
  );
}
