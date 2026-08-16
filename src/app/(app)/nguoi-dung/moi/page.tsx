import { redirect } from "next/navigation";

import { requireAgencyUser } from "@/lib/auth";
import { Card, PageHeader } from "@/components/ui";

import { UserForm } from "./user-form";

export default async function NewAgencyUserPage() {
  const session = await requireAgencyUser();
  if (session.role !== "AGENCY_ADMIN") {
    redirect("/nguoi-dung");
  }

  return (
    <div>
      <PageHeader
        title="Thêm người dùng"
        description="Tạo tài khoản mới cho nhân viên trong đại lý"
      />
      <Card className="max-w-lg">
        <UserForm />
      </Card>
    </div>
  );
}
