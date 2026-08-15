import { prisma } from "@/lib/db";
import policyDefaults from "@/data/policy-defaults.json";
import { PolicyConfig, PolicyConfigSchema } from "@/lib/policy-types";

export const DEFAULT_POLICY_CONFIG = PolicyConfigSchema.parse(policyDefaults);

/**
 * Đọc tham số chính sách hiện hành từ DB; nếu chưa có, khởi tạo bằng giá trị
 * mặc định. Đây là điểm truy cập DUY NHẤT cho các con số chính sách — không
 * hard-code mucThamChieu/lương tối thiểu vùng/tỷ lệ đóng ở nơi khác.
 */
export async function getPolicyConfig(): Promise<PolicyConfig> {
  const row = await prisma.policyConfig.findUnique({ where: { id: "current" } });
  if (!row) {
    await prisma.policyConfig.create({
      data: { id: "current", json: JSON.stringify(DEFAULT_POLICY_CONFIG) },
    });
    return DEFAULT_POLICY_CONFIG;
  }
  return PolicyConfigSchema.parse(JSON.parse(row.json));
}

export async function updatePolicyConfig(config: PolicyConfig): Promise<PolicyConfig> {
  const parsed = PolicyConfigSchema.parse(config);
  await prisma.policyConfig.upsert({
    where: { id: "current" },
    create: { id: "current", json: JSON.stringify(parsed) },
    update: { json: JSON.stringify(parsed) },
  });
  return parsed;
}
