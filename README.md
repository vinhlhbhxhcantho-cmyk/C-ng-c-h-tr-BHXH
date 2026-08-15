# BHXH PRO — Tính mức đóng & Lập bộ hồ sơ đăng ký tham gia BHXH

Công cụ nội bộ cho đại lý thuế/kế toán dịch vụ quản lý nhiều đơn vị (khách hàng), tính mức đóng BHXH bắt buộc theo nhóm đối tượng, và soạn bản nháp bộ hồ sơ đăng ký tham gia (TK3-TS, TK1-TS, D02-LT).

Xây dựng bằng Next.js (App Router) + TypeScript + Tailwind CSS + Prisma/SQLite, thay cho bản HTML/localStorage gốc để nhiều người dùng/thiết bị có thể truy cập cùng dữ liệu.

## Chạy thử

```bash
npm install
cp .env.example .env
npx prisma migrate deploy   # hoặc: npx prisma migrate dev
npm run dev
```

Mở http://localhost:3000.

## Kiến trúc

- `prisma/schema.prisma` — Unit, Participant (danh sách làm việc hiện hành), LedgerEntry (snapshot Sổ theo dõi theo kỳ), PolicyConfig (tham số chính sách, KHÔNG hard-code).
- `src/data/*.json` — danh mục BHXH cơ sở (Cần Thơ), danh mục bệnh viện KCB (**mẫu — cần thay bằng danh mục chính thức**), tham số chính sách mặc định.
- `src/lib/calc.ts`, `src/lib/validate.ts` — engine tính mức đóng và bộ quy tắc kiểm tra chặn thêm (mục 5 đặc tả).
- `src/lib/export/*` — sinh file `.docx` (TK3-TS, TK1-TS qua thư viện `docx`) và `.xlsx` (D02-LT, Bảng dự toán, Bảng tính mức đóng, Sổ theo dõi, mẫu nhập liệu qua `exceljs`).
- `src/app/api/*` — REST API cho Unit/Participant/LedgerEntry/PolicyConfig, tra cứu MST, trích xuất PDF giấy phép kinh doanh.
- `src/app/*` — giao diện: Danh sách đơn vị, workspace từng đơn vị (2 luồng nghiệp vụ), Sổ theo dõi, Cấu hình chính sách.

## Lưu ý quan trọng

- Mọi hồ sơ xuất ra là **bản nháp dữ liệu**, không thay thế kênh nộp chính thức (Cổng DVC Quốc gia / I-VAN).
- Danh mục bệnh viện trong `src/data/hospitals.json` là dữ liệu mẫu — cần thay bằng danh mục chính thức trước khi dùng thật.
- Các tham số chính sách (mức tham chiếu, lương tối thiểu vùng, tỷ lệ đóng) chỉnh sửa tại màn hình **Cấu hình chính sách** (`/policy`), không sửa trong code.
