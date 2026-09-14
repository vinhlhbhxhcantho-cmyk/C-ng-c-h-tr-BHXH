# Công cụ hỗ trợ DN/HKD đăng ký tham gia Bắt buộc

## Module: Tra cứu & Thanh toán số tiền BHXH cần đóng

Cho phép doanh nghiệp/hộ kinh doanh tự tra cứu số tiền BHXH/BHYT/BHTN cần đóng
theo mã đơn vị (không cần tài khoản Claude, không cần đăng nhập), và lập lệnh
chuyển khoản (QR + thông tin tài khoản) nếu còn nợ. Dữ liệu do cán bộ BHXH nạp
hàng tháng từ báo cáo C12 xuất ra từ TST.

Xem đặc tả đầy đủ trong yêu cầu ban đầu của dự án (mục đích, quy tắc nạp dữ
liệu, quy tắc tra cứu, tính năng thanh toán, yêu cầu bảo mật).

### Kiến trúc

- **Backend:** Node.js + Express 5.
- **Database:** PostgreSQL (bảng `donvi_ky`, khoá duy nhất `(ma_don_vi, ky)`).
- **Đọc file Excel:** thư viện `exceljs`, dò cột theo **tên kỹ thuật** ở dòng
  tiêu đề (không theo vị trí cột) — xem `src/services/excelImport.js`.
- **Xác thực admin:** JWT + bcrypt, nhiều tài khoản riêng biệt (không dùng
  chung 1 mật khẩu) để truy vết ai đã nạp/sửa dữ liệu.
- **Frontend:** HTML/CSS/JS thuần, không cần build, phục vụ tĩnh từ `public/`.
- **QR chuyển khoản:** gọi trực tiếp API công khai `img.vietqr.io` từ trình
  duyệt (không qua backend), không gắn `amount` để người dùng tự nhập/sửa
  số tiền ngay trong app ngân hàng sau khi quét (một số app khoá cứng ô số
  tiền nếu QR đã có sẵn amount, không sửa lại được).

### Cài đặt & chạy local

```bash
npm install
cp .env.example .env   # rồi chỉnh DATABASE_URL, JWT_SECRET cho phù hợp
npm run migrate        # tạo bảng trong PostgreSQL
npm run create-admin -- <username> <password> "Họ tên đầy đủ"
npm start               # chạy tại http://localhost:3000
```

- Trang tra cứu công khai: `http://localhost:3000/`
- Trang quản trị (nạp dữ liệu): `http://localhost:3000/admin.html`

### Chạy kiểm thử

```bash
npm test
```

Bộ test (`tests/excelImport.test.js`) kiểm chứng việc dò cột theo tên kỹ thuật
dù thứ tự cột bị đảo lộn, công thức tính "Số đầu kỳ"/"Số kỳ này", việc bỏ qua
dòng không có mã đơn vị, và thông báo lỗi khi thiếu cột bắt buộc.

### Nạp dữ liệu hàng tháng (thao tác của chuyên quản)

1. Đăng nhập trang admin bằng tài khoản riêng của mình.
2. Nhập **Kỳ** theo định dạng `YYYYMM` (ví dụ `202509`).
3. Chọn file C12 (`.xlsx`) xuất từ TST, bấm **Nạp dữ liệu**.
4. Hệ thống **gộp (upsert)** theo mã đơn vị — nhiều người có thể nạp nối tiếp
   nhau cho cùng một kỳ mà không làm mất dữ liệu người khác đã nạp.
5. Dùng mục **Đối chiếu đơn vị theo kỳ** để kiểm tra lại vài đơn vị trước khi
   công bố cho tra cứu công khai.

### Bảo mật

- API tra cứu công khai (`POST /api/tra-cuu`) chỉ trả kết quả khi **cả** mã
  đơn vị và email chuyên quản cùng khớp; mọi trường hợp không khớp đều trả về
  **một thông báo lỗi chung duy nhất**, tránh lộ thông tin cho phép dò tìm.
- Có giới hạn tốc độ (rate limit) cho API tra cứu công khai và API đăng nhập
  admin để hạn chế dò quét/brute-force.
- Không có endpoint nào liệt kê toàn bộ đơn vị công khai (chỉ admin đã đăng
  nhập mới xem được danh sách, phục vụ đối chiếu).
- Chỉ lưu đúng 11 trường cần thiết từ báo cáo C12 gốc (~230 cột), không lưu
  các thông tin nhạy cảm khác.

### Triển khai (gợi ý)

Nền tảng có gói miễn phí/giá rẻ, tự deploy từ GitHub, có PostgreSQL đi kèm:
[Render.com](https://render.com) hoặc [Fly.io](https://fly.io). Cấu hình biến
môi trường theo `.env.example` (đặc biệt `DATABASE_URL` và `JWT_SECRET`).

Nếu đã có backend/database chung cho các module khác của BHXH PRO, nên trỏ
`DATABASE_URL` vào cùng database đó (bảng `donvi_ky`, `admin_users`,
`import_logs` không trùng tên với các module khác) thay vì dựng hệ thống
riêng.

#### Deploy nhanh lên Render.com (miễn phí, để dùng thử)

Repo đã có sẵn `render.yaml` để deploy 1 lần bấm (Render tự tạo cả web
service lẫn database PostgreSQL):

1. Vào <https://dashboard.render.com/select-repo?type=blueprint>, đăng nhập
   (có thể dùng tài khoản GitHub), rồi chọn repo
   `vinhlhbhxhcantho-cmyk/C-ng-c-h-tr-BHXH`, nhánh `main`.
2. Render đọc file `render.yaml`, hiện sẵn 1 web service (`bhxh-tra-cuu`) và
   1 database (`bhxh-tra-cuu-db`) — bấm **Apply** để tạo.
3. **Không cần Shell** (gói Free có thể khoá tính năng này): server tự chạy
   migrate khi khởi động. Để tự tạo tài khoản admin đầu tiên, vào service
   `bhxh-tra-cuu` → tab **Environment** → thêm 3 biến:
   - `ADMIN_BOOTSTRAP_USERNAME` — tên đăng nhập bạn muốn
   - `ADMIN_BOOTSTRAP_PASSWORD` — mật khẩu (từ 8 ký tự)
   - `ADMIN_BOOTSTRAP_FULL_NAME` — họ tên hiển thị

   Lưu lại, Render tự deploy lại — server sẽ tạo tài khoản này nếu chưa có.
   Có thể xoá 3 biến này sau khi đã đăng nhập thành công lần đầu.
4. Mở địa chỉ web Render cấp cho service (dạng
   `https://bhxh-tra-cuu-xxxx.onrender.com`) — trang `/` là tra cứu công
   khai, `/admin.html` là trang quản trị, đăng nhập bằng tài khoản vừa tạo.
   Muốn thêm tài khoản cho các chuyên quản khác: nếu Shell dùng được thì
   chạy `npm run create-admin -- <username> <password> "Họ tên"`; nếu
   không, lặp lại cách thêm biến `ADMIN_BOOTSTRAP_*` ở trên với tên đăng
   nhập mới.

Lưu ý: gói database miễn phí của Render tự xoá sau khoảng 30 ngày không
nâng cấp — chỉ phù hợp để dùng thử, khi triển khai chính thức nên nâng lên
gói trả phí hoặc trỏ vào database chung của BHXH PRO như trên.

### Việc còn cần xác nhận thêm (theo đặc tả)

- Đối chiếu thêm công thức "Số kỳ này"/"Số đầu kỳ" trên số lượng lớn đơn vị
  (mới kiểm chứng 3 đơn vị thật với TST).

Đã xác nhận: nội dung chuyển khoản `+BHXH+103+00+<mã đơn vị>+09200+dong BHXH`
— "103" và "00" cố định cho mọi đơn vị, chỉ thay phần mã đơn vị.
