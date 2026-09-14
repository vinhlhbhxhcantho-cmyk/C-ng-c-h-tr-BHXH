const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const config = require('./config');
const { runStartupBootstrap } = require('./bootstrap');

const adminAuthRoutes = require('./routes/adminAuth');
const adminImportRoutes = require('./routes/adminImport');
const adminDonViRoutes = require('./routes/adminDonVi');
const publicRoutes = require('./routes/public');

const app = express();

// Cần thiết khi chạy sau reverse proxy (Render, Fly.io, ...): để Express đọc
// đúng IP thật của client từ header X-Forwarded-For, nếu không
// express-rate-limit sẽ báo lỗi ERR_ERL_UNEXPECTED_X_FORWARDED_FOR.
app.set('trust proxy', 1);

app.use(
  helmet({
    // Cho phép trang tĩnh tự host gọi VietQR image trực tiếp từ trình duyệt (thẻ <img>),
    // không qua backend, nên không cần nới lỏng CSP connect-src ở đây.
    contentSecurityPolicy: false,
  })
);
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.use('/api/admin', adminAuthRoutes);
app.use('/api/admin', adminImportRoutes);
app.use('/api/admin', adminDonViRoutes);
app.use('/api', publicRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use(express.static(path.join(__dirname, '..', 'public')));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Đã xảy ra lỗi phía máy chủ.' });
});

if (require.main === module) {
  runStartupBootstrap()
    .catch((err) => console.error('[bootstrap] Lỗi khi khởi tạo:', err))
    .finally(() => {
      app.listen(config.port, () => {
        console.log(`Server đang chạy tại cổng ${config.port}`);
      });
    });
}

module.exports = app;
