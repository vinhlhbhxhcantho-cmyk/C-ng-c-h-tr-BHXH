const crypto = require('crypto');
const svgCaptcha = require('svg-captcha');
const config = require('../config');

const TTL_MS = 5 * 60 * 1000; // 5 phút

function sign(payload) {
  return crypto.createHmac('sha256', config.jwtSecret).update(payload).digest('hex');
}

/**
 * Tạo 1 captcha mới. Đáp án được ký (HMAC) kèm hạn dùng, gửi về cho client
 * dưới dạng token — không cần lưu trạng thái ở server (stateless), phù hợp
 * với việc chạy nhiều instance / server khởi động lại không mất captcha
 * đang chờ xác nhận.
 */
function createCaptcha() {
  const captcha = svgCaptcha.create({
    size: 5,
    noise: 3,
    color: true,
    background: '#f4f7fa',
    ignoreChars: '0oO1ilI', // bỏ ký tự dễ nhầm lẫn
  });

  const answer = captcha.text.toLowerCase();
  const expiresAt = Date.now() + TTL_MS;
  const payload = `${answer}.${expiresAt}`;
  const signature = sign(payload);
  const token = Buffer.from(`${payload}.${signature}`).toString('base64url');

  return { svg: captcha.data, token };
}

/**
 * Kiểm tra đáp án người dùng nhập có khớp với token đã cấp không, và token
 * chưa hết hạn.
 */
function verifyCaptcha(token, userAnswer) {
  if (!token || !userAnswer) return false;
  let decoded;
  try {
    decoded = Buffer.from(token, 'base64url').toString('utf8');
  } catch (err) {
    return false;
  }
  const parts = decoded.split('.');
  if (parts.length !== 3) return false;
  const [answer, expiresAtStr, signature] = parts;
  const payload = `${answer}.${expiresAtStr}`;
  const expectedSignature = sign(payload);

  const sigBuf = Buffer.from(signature, 'utf8');
  const expectedBuf = Buffer.from(expectedSignature, 'utf8');
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return false;
  }

  const expiresAt = Number(expiresAtStr);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  return userAnswer.trim().toLowerCase() === answer;
}

module.exports = { createCaptcha, verifyCaptcha };
