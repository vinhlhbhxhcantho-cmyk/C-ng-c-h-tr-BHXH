"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAgencyUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const paymentSchema = z.object({
  contributionPeriodId: z.string().min(1),
  amount: z.coerce.number().positive("Số tiền phải lớn hơn 0"),
  paidAt: z.string().min(1, "Vui lòng chọn ngày nộp"),
  method: z.string().optional(),
  note: z.string().optional(),
});

export type PaymentFormState = { error?: string };

export async function addPaymentAction(
  _prevState: PaymentFormState,
  formData: FormData,
): Promise<PaymentFormState> {
  const session = await requireAgencyUser();

  const parsed = paymentSchema.safeParse({
    contributionPeriodId: formData.get("contributionPeriodId"),
    amount: formData.get("amount"),
    paidAt: formData.get("paidAt"),
    method: formData.get("method") || undefined,
    note: formData.get("note") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const data = parsed.data;

  const period = await prisma.contributionPeriod.findFirst({
    where: { id: data.contributionPeriodId, unit: { agencyId: session.agencyId } },
  });
  if (!period) {
    return { error: "Không tìm thấy kỳ đối chiếu." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        contributionPeriodId: period.id,
        amount: data.amount,
        paidAt: new Date(data.paidAt),
        method: data.method,
        note: data.note,
      },
    });

    const paidAgg = await tx.payment.aggregate({
      where: { contributionPeriodId: period.id },
      _sum: { amount: true },
    });
    const amountPaid = Number(paidAgg._sum.amount ?? 0);
    const amountDue = Number(period.amountDue);

    await tx.contributionPeriod.update({
      where: { id: period.id },
      data: {
        amountPaid,
        status:
          amountPaid <= 0 ? "UNPAID" : amountPaid >= amountDue ? "PAID" : "PARTIAL",
      },
    });
  });

  revalidatePath(`/doi-chieu/${period.id}`);
  revalidatePath("/doi-chieu");
  revalidatePath(`/don-vi/${period.unitId}`);
  return {};
}
