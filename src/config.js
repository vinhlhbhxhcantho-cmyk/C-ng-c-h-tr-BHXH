require('dotenv').config({ quiet: true });

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Thiếu biến môi trường bắt buộc: ${name}`);
  }
  return value;
}

module.exports = {
  databaseUrl: required('DATABASE_URL', 'postgres://localhost:5432/bhxh_pro'),
  jwtSecret: required('JWT_SECRET', 'dev-only-secret-change-me'),
  port: parseInt(process.env.PORT || '3000', 10),
  adminTokenTtlSeconds: parseInt(process.env.ADMIN_TOKEN_TTL_SECONDS || '43200', 10),
};
