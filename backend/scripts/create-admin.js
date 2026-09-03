require('dotenv').config();

const { randomUUID } = require('crypto');
const { pool } = require('../db');
const { hashPassword } = require('../utils/password');

const run = async () => {
  const email = String(process.env.ADMIN_EMAIL || 'admin@system.com').trim().toLowerCase();
  const name = String(process.env.ADMIN_NAME || '系统管理员').trim();
  const password = String(process.env.ADMIN_INITIAL_PASSWORD || '');

  if (!email || !email.includes('@')) throw new Error('请设置有效的 ADMIN_EMAIL。');
  if (!name) throw new Error('请设置 ADMIN_NAME。');
  if (password.length < 8) throw new Error('ADMIN_INITIAL_PASSWORD 至少需要 8 位。');

  const [existing] = await pool.execute('SELECT id, role FROM users WHERE email = ? LIMIT 1', [email]);
  if (existing.length) {
    throw new Error(`邮箱 ${email} 已存在，脚本不会覆盖账号或密码。请登录后台修改密码。`);
  }

  const now = new Date();
  await pool.execute(
    `INSERT INTO users
      (id, username, name, email, password_hash, avatar, role, class_id, profile, avatar_index, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, '', 'admin', NULL, ?, NULL, ?, NULL)`,
    [randomUUID(), name, name, email, await hashPassword(password), JSON.stringify({ name, hometown: '', phone: '', hobbies: [], bio: '' }), now]
  );

  console.log(`管理员已创建：${email}`);
  console.log('请立即登录并在“用户管理”中修改为长期强密码。');
};

run()
  .catch((error) => {
    console.error('创建管理员失败：', error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
