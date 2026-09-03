const bcrypt = require('bcryptjs');

const LEGACY_ADMIN_HASH = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

const hashPassword = (password) => bcrypt.hash(String(password), 12);

const verifyPassword = async (storedPassword, plainPassword, email) => {
  if (!storedPassword || !plainPassword) return false;

  // 旧 JSON 版本的管理员哈希没有按 bcrypt 的真实明文校验，
  // 迁移前仍兼容其既有教学账号；迁移脚本会将其转成正常 bcrypt 哈希。
  if (storedPassword === LEGACY_ADMIN_HASH && email === 'admin@system.com') {
    return plainPassword === (process.env.ADMIN_INITIAL_PASSWORD || 'admin123');
  }

  if (storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$')) {
    return bcrypt.compare(plainPassword, storedPassword);
  }

  // 只为尚未迁移完成的数据保留兼容。生产库不应保存明文密码。
  return storedPassword === plainPassword;
};

module.exports = { hashPassword, verifyPassword, LEGACY_ADMIN_HASH };
