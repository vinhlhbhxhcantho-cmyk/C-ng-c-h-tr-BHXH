"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAgencyUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const unitSchema = z.object({
  name: z.string().min(2, "Tên đơn vị phải có ít nhất 2 ký tự"),
  code: z.string().optional(),
  taxCode: z.string().optional(),
  address: z.string().optional(),
  bhxhOfficeName: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
});

export type UnitFormState = { error?: string };

export async function createUnitAction(
  _prevState: UnitFormState,
  formData: FormData,
): Promise<UnitFormState> {
  const session = await requireAgencyUser();

  const parsed = unitSchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code") || undefined,
    taxCode: formData.get("taxCode") || undefined,
    address: formData.get("address") || undefined,
    bhxhOfficeName: formData.get("bhxhOfficeName") || undefined,
    contactName: formData.get("contactName") || undefined,
    contactPhone: formData.get("contactPhone") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const data = parsed.data;

  if (data.taxCode) {
    const existing = await prisma.unit.findFirst({
      where: { agencyId: session.agencyId, taxCode: data.taxCode },
    });
    if (existing) {
      return { error: "Mã số thuế này đã tồn tại trong danh sách đơn vị." };
    }
  }

  const unit = await prisma.unit.create({
    data: {
      agencyId: session.agencyId,
      name: data.name,
      code: data.code,
      taxCode: data.taxCode,
      address: data.address,
      bhxhOfficeName: data.bhxhOfficeName,
      contactName: data.contactName,
      contactPhone: data.contactPhone,
    },
  });

  revalidatePath("/don-vi");
  redirect(`/don-vi/${unit.id}`);
}
