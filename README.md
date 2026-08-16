# Công cụ hỗ trợ BHXH

Ứng dụng web quản lý đại lý dịch vụ thuế - BHXH: quản lý đơn vị sử dụng lao
động, lao động tham gia BHXH, hồ sơ báo tăng/báo giảm/điều chỉnh, và đối
chiếu tiền đóng theo từng kỳ. Nền tảng đa khách hàng (multi-tenant) — mỗi
đại lý chỉ thấy dữ liệu của riêng mình.

## Công nghệ

- [Next.js](https://nextjs.org) (App Router) + TypeScript + Tailwind CSS
- [Prisma](https://www.prisma.io) + PostgreSQL
- Xác thực bằng session cookie ký JWT (`jose`), mật khẩu băm bằng `bcryptjs`

## Bắt đầu

1. Cài phụ thuộc:

   ```bash
   pnpm install
   ```

2. Tạo file `.env` từ `.env.example` và chỉnh `DATABASE_URL` trỏ tới
   PostgreSQL của bạn, cùng một `AUTH_SECRET` ngẫu nhiên.

3. Khởi tạo database:

   ```bash
   npx prisma migrate dev
   pnpm db:seed
   ```

   Seed sẽ tạo 3 tài khoản mẫu (in ra ở cuối log), ví dụ quản trị đại lý:
   `quantri@dailydemo.vn` / `Agency@123`.

4. Chạy dev server:

   ```bash
   pnpm dev
   ```

## Cấu trúc nghiệp vụ chính

- **Đại lý (Agency)** — khách hàng thuê phần mềm (đơn vị bán dịch vụ
  thuế/BHXH). Chỉ vai trò `SUPER_ADMIN` (nhà cung cấp nền tảng) mới tạo
  được đại lý mới.
- **Đơn vị (Unit)** — đơn vị sử dụng lao động do một đại lý quản lý.
- **Lao động (Employee)** — người lao động thuộc một đơn vị.
- **Hồ sơ (Declaration)** — hồ sơ báo tăng / báo giảm / điều chỉnh mức
  đóng cho một nhóm lao động, tương ứng nghiệp vụ 600 và các mẫu biểu như
  D02-LT, TK1-TS.
- **Đối chiếu tiền đóng (ContributionPeriod / Payment)** — theo dõi số
  phải đóng, số đã đóng theo từng kỳ của mỗi đơn vị.

## Kết nối I-VAN (nộp hồ sơ điện tử lên BHXH)

Việc gửi hồ sơ thật lên cơ quan BHXH bắt buộc phải qua Cổng giao dịch điện
tử của BHXH Việt Nam hoặc qua một tổ chức I-VAN đã được BHXH Việt Nam công
nhận (ví dụ Thái Sơn, TS24, EFY, MISA...). Ứng dụng này **chưa có hợp đồng
với đối tác I-VAN nào**, nên lớp tích hợp được thiết kế tách biệt qua
interface `IVanAdapter` tại `src/lib/ivan/adapter.ts`.

Hiện tại `getIVanAdapter()` trả về `MockIVanAdapter` — mô phỏng luồng nộp
hồ sơ (trạng thái chuyển `READY → SUBMITTED` kèm mã tham chiếu giả) để
kiểm thử toàn bộ nghiệp vụ mà không gửi dữ liệu thật đi đâu cả.

Khi ký được hợp đồng với một tổ chức I-VAN thật:

1. Viết thêm một class implement `IVanAdapter`, gọi API thật của đối tác.
2. Trỏ `getIVanAdapter()` sang class đó (ví dụ dựa theo biến môi trường
   `IVAN_PROVIDER`).
3. Toàn bộ phần còn lại của ứng dụng (module hồ sơ, giao diện) không cần
   thay đổi.

## Vai trò người dùng

- `SUPER_ADMIN` — quản trị nền tảng, tạo/khóa đại lý.
- `AGENCY_ADMIN` — quản trị một đại lý, quản lý người dùng trong đại lý.
- `AGENCY_STAFF` — nhân viên đại lý, thao tác nghiệp vụ hàng ngày.
