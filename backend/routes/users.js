const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../db');
const adminAuth = require('../middleware/adminAuth');
const { formatUserData, parseJSON } = require('../utils/userUtils');
const { filterUsersBySearchType, getSynonymsForSearch } = require('../utils/searchUtils');
const { hashPassword, verifyPassword } = require('../utils/password');
const { createAdminSession, revokeAdminSessions } = require('../utils/adminSessions');

const router = express.Router();

const userSelect = `
  SELECT u.*, c.name AS class_name
  FROM users u
  LEFT JOIN classes c ON c.id = u.class_id`;

const defaultProfile = (name, profile = {}) => ({
  name: name || '', hometown: '', phone: '', hobbies: [], bio: '', ...profile
});

const getUserByEmail = async (email) => {
  const [rows] = await pool.execute(`${userSelect} WHERE u.email = ?`, [email]);
  return rows[0] || null;
};

const classExists = async (classId) => {
  const [rows] = await pool.execute('SELECT id FROM classes WHERE id = ?', [classId]);
  return rows.length > 0;
};

const insertUser = async ({ name, email, password, classId, profile, role = 'user' }) => {
  const now = new Date();
  const id = uuidv4();
  const storedProfile = defaultProfile(name, profile);
  await pool.execute(
    `INSERT INTO users
      (id, username, name, email, password_hash, avatar, role, class_id, profile, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, '', ?, ?, ?, ?, ?)`,
    [id, name, name, email, await hashPassword(password), role, classId, JSON.stringify(storedProfile), now, now]
  );
  return getUserByEmail(email);
};

const handleDatabaseError = (error, res, fallback) => {
  if (error && error.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: '用户已存在或邮箱已被使用' });
  console.error(fallback, error);
  return res.status(500).json({ message: fallback });
};

// 获取全部用户；前端原接口保持不变，密码字段不会返回。
router.get('/', async (_req, res) => {
  try {
    const [rows] = await pool.query(userSelect);
    res.json(rows.map(formatUserData));
  } catch (error) {
    handleDatabaseError(error, res, '服务器错误');
  }
});

router.post('/register', async (req, res) => {
  const { name, email, password, classId, profile } = req.body;
  try {
    if (!name || !email || !password) return res.status(400).json({ message: '姓名、邮箱和密码均为必填项' });
    if (!classId) return res.status(400).json({ message: '请选择班级' });
    if (!await classExists(classId)) return res.status(400).json({ message: '所选班级不存在' });
    if (await getUserByEmail(email)) return res.status(400).json({ message: '用户已存在' });
    res.status(201).json(formatUserData(await insertUser({ name, email, password, classId, profile })));
  } catch (error) {
    handleDatabaseError(error, res, '注册失败');
  }
});

router.post('/admin/create', adminAuth, async (req, res) => {
  const { name, email, classId, password = '123456', profile } = req.body;
  try {
    if (!name || !email || !classId) return res.status(400).json({ message: '姓名、邮箱和班级均为必填项' });
    if (!await classExists(classId)) return res.status(400).json({ message: '所选班级不存在' });
    if (await getUserByEmail(email)) return res.status(400).json({ message: '该邮箱已被使用' });
    res.status(201).json(formatUserData(await insertUser({ name, email, password, classId, profile })));
  } catch (error) {
    handleDatabaseError(error, res, '创建用户失败');
  }
});

router.put('/admin/reset-password/:email', adminAuth, async (req, res) => {
  try {
    const user = await getUserByEmail(req.params.email);
    if (!user) return res.status(404).json({ message: '用户不存在' });
    if (user.role === 'admin' || user.email === 'admin@system.com') return res.status(400).json({ message: '不能重置管理员密码' });
    await pool.execute('UPDATE users SET password_hash = ?, updated_at = ? WHERE email = ?', [await hashPassword('123456'), new Date(), user.email]);
    res.json({ message: '密码已重置为 123456' });
  } catch (error) {
    handleDatabaseError(error, res, '重置密码失败');
  }
});

router.put('/admin/password', adminAuth, async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  try {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: '请完整填写当前密码、新密码和确认密码' });
    }
    if (newPassword.length < 8) return res.status(400).json({ message: '新密码至少 8 位' });
    if (newPassword !== confirmPassword) return res.status(400).json({ message: '两次输入的新密码不一致' });
    if (newPassword === currentPassword) return res.status(400).json({ message: '新密码不能与当前密码相同' });

    const [rows] = await pool.execute('SELECT email, password_hash FROM users WHERE email = ?', [req.admin.email]);
    const admin = rows[0];
    if (!admin || !await verifyPassword(admin.password_hash, currentPassword, admin.email)) {
      return res.status(400).json({ message: '当前密码不正确' });
    }

    await pool.execute('UPDATE users SET password_hash = ?, updated_at = ? WHERE email = ?', [await hashPassword(newPassword), new Date(), admin.email]);
    revokeAdminSessions(admin.email);
    res.json({ message: '管理员密码修改成功', adminToken: createAdminSession(admin.email) });
  } catch (error) {
    handleDatabaseError(error, res, '修改管理员密码失败');
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await getUserByEmail(email);
    if (!user || !await verifyPassword(user.password_hash, password, user.email)) {
      return res.status(401).json({ message: '邮箱或密码错误' });
    }
    const result = formatUserData(user);
    if (user.role === 'admin') result.adminToken = createAdminSession(user.email);
    res.json(result);
  } catch (error) {
    handleDatabaseError(error, res, '服务器错误');
  }
});

router.get('/current/:email', async (req, res) => {
  try {
    const user = await getUserByEmail(req.params.email);
    if (!user) return res.status(404).json({ message: '用户不存在' });
    res.json(formatUserData(user));
  } catch (error) {
    handleDatabaseError(error, res, '服务器错误');
  }
});

router.put('/update/:email', async (req, res) => {
  const { profileData, classId, avatar } = req.body;
  try {
    const user = await getUserByEmail(req.params.email);
    if (!user) return res.status(404).json({ message: '用户不存在' });
    if (classId !== undefined && classId && !await classExists(classId)) return res.status(400).json({ message: '所选班级不存在' });

    const nextProfile = profileData ? defaultProfile(user.name, profileData) : parseJSON(user.profile, defaultProfile(user.name));
    await pool.execute(
      'UPDATE users SET class_id = ?, profile = ?, avatar = ?, updated_at = ? WHERE email = ?',
      [classId === undefined ? user.class_id : (classId || null), JSON.stringify(nextProfile), avatar === undefined ? user.avatar : avatar, new Date(), user.email]
    );
    res.json(formatUserData(await getUserByEmail(user.email)));
  } catch (error) {
    handleDatabaseError(error, res, '服务器错误');
  }
});

router.get('/all/:currentEmail', async (_req, res) => {
  try {
    const [rows] = await pool.query(`${userSelect} WHERE u.email <> ?`, ['admin@system.com']);
    res.json(rows.map(formatUserData));
  } catch (error) {
    handleDatabaseError(error, res, '服务器错误');
  }
});

router.delete('/admin/delete', adminAuth, async (req, res) => {
  try {
    const user = await getUserByEmail(req.body.email);
    if (!user) return res.status(404).json({ message: '用户不存在' });
    if (user.role === 'admin' || user.email === 'admin@system.com') return res.status(400).json({ message: '不能删除管理员账户' });
    await pool.execute('DELETE FROM users WHERE email = ?', [user.email]);
    res.json({ message: '用户删除成功' });
  } catch (error) {
    handleDatabaseError(error, res, '服务器错误');
  }
});

router.post('/search', async (req, res) => {
  const { query, type, scope, classId, includeSynonyms } = req.body;
  try {
    if (!query || !query.trim()) return res.status(400).json({ message: '搜索关键词不能为空' });
    const [rows] = await pool.query(`${userSelect} WHERE u.email <> ?`, ['admin@system.com']);
    let users = rows.map(formatUserData);
    if (scope === 'class' && classId) users = users.filter((user) => user.classId === classId);
    let synonyms = [];
    if (includeSynonyms) {
      const [groups] = await pool.query('SELECT id, name, category, synonyms FROM synonym_groups');
      synonyms = getSynonymsForSearch({ data: { synonymGroups: groups.map((group) => ({ ...group, synonyms: parseJSON(group.synonyms, []) })) } }, query.toLowerCase().trim());
    }
    const data = filterUsersBySearchType(users, type, [query.toLowerCase().trim(), ...synonyms]);
    res.json({ success: true, data, count: data.length });
  } catch (error) {
    handleDatabaseError(error, res, '搜索用户失败');
  }
});

router.get('/:email', async (req, res) => {
  try {
    const user = await getUserByEmail(req.params.email);
    if (!user) return res.status(404).json({ message: '用户不存在' });
    res.json(formatUserData(user));
  } catch (error) {
    handleDatabaseError(error, res, '服务器错误');
  }
});

module.exports = router;
