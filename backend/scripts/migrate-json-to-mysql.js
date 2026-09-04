require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { pool, withTransaction } = require('../db');
const { hashPassword, LEGACY_ADMIN_HASH } = require('../utils/password');

const jsonPath = process.env.JSON_SOURCE || path.join(__dirname, '..', 'db.json');
const dateOrNow = (value) => {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
};
const profileOf = (user) => ({
  name: user.name || user.username || '', hometown: '', phone: '', hobbies: user.hobbies || [], bio: user.bio || '', ...(user.profile || {})
});

const passwordFor = async (user, email) => {
  if (email === 'admin@system.com' && user.password === LEGACY_ADMIN_HASH) {
    return hashPassword(process.env.ADMIN_INITIAL_PASSWORD);
  }
  if (typeof user.password === 'string' && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))) return user.password;
  return hashPassword(user.password || '123456');
};

const run = async () => {
  if (!fs.existsSync(jsonPath)) throw new Error(`未找到 JSON 源数据：${jsonPath}`);
  const source = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const classes = Array.isArray(source.classes) ? source.classes : [];
  const users = Array.isArray(source.users) ? source.users : [];
  const groups = Array.isArray(source.synonymGroups) ? source.synonymGroups : [];
  const hobbies = Array.isArray(source.standard_hobbies) ? source.standard_hobbies : [];
  const emails = users.map((user) => String(user.email || '').trim().toLowerCase()).filter(Boolean);
  const userIds = users.map((user) => user.id).filter(Boolean);
  const classIds = new Set(classes.map((item) => item.id).filter(Boolean));
  if (!users.length) throw new Error('JSON 数据中没有用户，已取消迁移。');
  if (userIds.length !== users.length || new Set(userIds).size !== userIds.length) throw new Error('JSON 数据中存在缺失或重复的用户 ID。');
  if (classIds.size !== classes.length) throw new Error('JSON 数据中存在缺失或重复的班级 ID。');
  if (emails.length !== users.length) throw new Error('JSON 数据中存在缺失的用户邮箱。');
  if (users.some((user) => typeof user.password !== 'string' || !user.password)) throw new Error('JSON 数据中存在缺失的用户密码。');
  if (new Set(emails).size !== emails.length) throw new Error('JSON 数据中存在重复邮箱；请先清理后再迁移。');
  if (users.some((user) => user.classId && !classIds.has(user.classId))) throw new Error('JSON 数据中存在引用不存在班级的用户。');
  const admins = users.filter((user) => String(user.email || '').trim().toLowerCase() === 'admin@system.com');
  if (admins.length !== 1) throw new Error('JSON 数据必须且只能包含一个 admin@system.com 管理员。');
  if (admins[0].password === LEGACY_ADMIN_HASH && String(process.env.ADMIN_INITIAL_PASSWORD || '').length < 8) {
    throw new Error('该快照需要重设管理员密码；请提供至少 8 位的 ADMIN_INITIAL_PASSWORD。');
  }

  await withTransaction(async (connection) => {
    // 可重复执行：先清空依赖表，再完整导入同一份快照。
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('DELETE FROM users');
    await connection.query('DELETE FROM synonym_groups');
    await connection.query('DELETE FROM standard_hobbies');
    await connection.query('DELETE FROM classes');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    for (const item of classes) {
      await connection.execute('INSERT INTO classes (id, name, description, teacher, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)', [item.id, item.name, item.description || '', item.teacher || '', dateOrNow(item.createdAt), item.updatedAt ? dateOrNow(item.updatedAt) : null]);
    }
    for (const user of users) {
      const email = String(user.email).trim().toLowerCase();
      const role = user.role || (email === 'admin@system.com' ? 'admin' : 'user');
      const classId = classIds.has(user.classId) ? user.classId : null;
      await connection.execute(
        `INSERT INTO users (id, username, name, email, password_hash, avatar, role, class_id, profile, avatar_index, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [user.id, user.username || user.name || '', user.name || user.username || '', email, await passwordFor(user, email), user.avatar || '', role, classId, JSON.stringify(profileOf(user)), user.avatarIndex ?? null, dateOrNow(user.createdAt), user.updatedAt ? dateOrNow(user.updatedAt) : null]
      );
    }
    for (const group of groups) await connection.execute('INSERT INTO synonym_groups (id, name, category, synonyms, updated_at) VALUES (?, ?, ?, ?, ?)', [String(group.id), group.name, group.category, JSON.stringify(group.synonyms || []), new Date()]);
    for (const hobby of hobbies) await connection.execute('INSERT INTO standard_hobbies (id, name, category) VALUES (?, ?, ?)', [hobby.id, hobby.name, hobby.category || '其他']);
  });
  console.log(`迁移完成：${classes.length} 个班级、${users.length} 位用户、${groups.length} 个同义词组、${hobbies.length} 条标准爱好。`);
  await pool.end();
};

run().catch(async (error) => {
  console.error('JSON 迁移失败：', error.message);
  await pool.end();
  process.exit(1);
});
