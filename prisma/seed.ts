import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function hash(password: string) {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log("Đang tạo dữ liệu mẫu...");

  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@nentang.local" },
    update: {},
    create: {
      email: "admin@nentang.local",
      fullName: "Quản trị nền tảng",
      passwordHash: await hash("Admin@123"),
      role: "SUPER_ADMIN",
    },
  });

  const agency = await prisma.agency.upsert({
    where: { taxCode: "0100000000-DEMO" },
    update: {},
    create: {
      name: "Đại lý Dịch vụ Thuế - BHXH Demo",
      taxCode: "0100000000-DEMO",
      phone: "0290 3xxx xxx",
      email: "lienhe@dailydemo.vn",
      address: "123 Đường Mẫu, Ninh Kiều, Cần Thơ",
    },
  });

  const agencyAdmin = await prisma.user.upsert({
    where: { email: "quantri@dailydemo.vn" },
    update: {},
    create: {
      agencyId: agency.id,
      email: "quantri@dailydemo.vn",
      fullName: "Nguyễn Văn Quản Trị",
      passwordHash: await hash("Agency@123"),
      role: "AGENCY_ADMIN",
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: "nhanvien@dailydemo.vn" },
    update: {},
    create: {
      agencyId: agency.id,
      email: "nhanvien@dailydemo.vn",
      fullName: "Trần Thị Nhân Viên",
      passwordHash: await hash("Agency@123"),
      role: "AGENCY_STAFF",
    },
  });

  const existingUnit = await prisma.unit.findFirst({
    where: { agencyId: agency.id, taxCode: "1800000001" },
  });

  const unit1 =
    existingUnit ??
    (await prisma.unit.create({
      data: {
        agencyId: agency.id,
        name: "Công ty TNHH Thương mại An Bình",
        taxCode: "1800000001",
        address: "45 Nguyễn Văn Cừ, Ninh Kiều, Cần Thơ",
        bhxhOfficeName: "BHXH Quận Ninh Kiều",
        contactName: "Lê Văn A",
        contactPhone: "0909 111 222",
        employees: {
          create: [
            {
              fullName: "Phạm Văn Hùng",
              idNumber: "092123456789",
              socialInsuranceNo: "0123456789",
              position: "Nhân viên kinh doanh",
              salaryBase: 6500000,
              startDate: new Date("2024-01-15"),
            },
            {
              fullName: "Nguyễn Thị Lan",
              idNumber: "092987654321",
              socialInsuranceNo: "0987654321",
              position: "Kế toán",
              salaryBase: 8000000,
              startDate: new Date("2023-06-01"),
            },
            {
              fullName: "Trần Văn Bình",
              idNumber: "092111222333",
              socialInsuranceNo: "0111222333",
              position: "Bảo vệ",
              salaryBase: 4680000,
              startDate: new Date("2022-03-10"),
            },
          ],
        },
      },
    }));

  const existingUnit2 = await prisma.unit.findFirst({
    where: { agencyId: agency.id, taxCode: "1800000002" },
  });

  if (!existingUnit2) {
    await prisma.unit.create({
      data: {
        agencyId: agency.id,
        name: "Hộ kinh doanh Cà phê Tân An",
        taxCode: "1800000002",
        address: "12 Trần Hưng Đạo, Ninh Kiều, Cần Thơ",
        bhxhOfficeName: "BHXH Quận Ninh Kiều",
        contactName: "Chủ hộ kinh doanh",
        contactPhone: "0909 333 444",
        employees: {
          create: [
            {
              fullName: "Võ Thị Hương",
              idNumber: "092444555666",
              position: "Pha chế",
              salaryBase: 4680000,
              startDate: new Date("2024-05-01"),
            },
            {
              fullName: "Đặng Văn Khoa",
              idNumber: "092777888999",
              position: "Phục vụ",
              salaryBase: 4680000,
              startDate: new Date("2024-05-01"),
            },
          ],
        },
      },
    });
  }

  const unit1Employees = await prisma.employee.findMany({
    where: { unitId: unit1.id },
  });

  const existingDeclaration = await prisma.declaration.findFirst({
    where: { unitId: unit1.id, period: "2026-01" },
  });

  if (!existingDeclaration && unit1Employees.length > 0) {
    await prisma.declaration.create({
      data: {
        unitId: unit1.id,
        createdById: agencyAdmin.id,
        type: "INCREASE",
        formCode: "D02-LT",
        period: "2026-01",
        status: "ACCEPTED",
        note: "Báo tăng lao động mới tuyển tháng 1/2026 (dữ liệu mẫu)",
        submittedAt: new Date("2026-01-05"),
        ivanProvider: "Giả lập (chưa kết nối I-VAN thật)",
        ivanReferenceCode: "MOCK-DEMO-0001",
        ivanResponseMessage: "Đã tiếp nhận (dữ liệu mẫu)",
        items: {
          create: unit1Employees.slice(0, 2).map((employee) => ({
            employeeId: employee.id,
            effectiveDate: new Date("2026-01-01"),
            salaryBase: employee.salaryBase,
            reason: "Tuyển mới",
          })),
        },
      },
    });
  }

  const existingPeriod = await prisma.contributionPeriod.findFirst({
    where: { unitId: unit1.id, period: "2026-06" },
  });

  if (!existingPeriod) {
    await prisma.contributionPeriod.create({
      data: {
        unitId: unit1.id,
        period: "2026-06",
        employeeCount: unit1Employees.length,
        amountDue: 5_500_000,
        amountPaid: 3_000_000,
        status: "PARTIAL",
        payments: {
          create: [
            {
              amount: 3_000_000,
              paidAt: new Date("2026-06-10"),
              method: "Chuyển khoản",
              note: "Nộp đợt 1 (dữ liệu mẫu)",
            },
          ],
        },
      },
    });
  }

  console.log("Xong. Tài khoản đăng nhập mẫu:");
  console.log(`- Quản trị nền tảng: ${superAdmin.email} / Admin@123`);
  console.log(`- Quản trị đại lý:   ${agencyAdmin.email} / Agency@123`);
  console.log(`- Nhân viên đại lý:  ${staff.email} / Agency@123`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
