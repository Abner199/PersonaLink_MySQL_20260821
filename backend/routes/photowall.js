const express = require('express');
const { pool } = require('../db');
const { formatUserData, normalizeAvatar, parseJSON } = require('../utils/userUtils');

const router = express.Router();
const photoUserSelect = `
  SELECT u.id, u.username, u.name, u.email, u.avatar, u.role, u.class_id,
         u.profile, u.avatar_index, u.created_at, u.updated_at,
         c.name AS class_name
  FROM users u
  LEFT JOIN classes c ON c.id = u.class_id
  WHERE u.role <> 'admin'`;

const embeddedImagePattern = /^data:(image\/(?:jpeg|png|gif|webp));base64,([a-zA-Z0-9+/=\r\n]+)$/;

// 列表不内嵌体积很大的 base64 头像；浏览器滚动到卡片时再按需请求图片。
const formatPhotoWallUser = (row) => {
  const user = formatUserData(row);
  const profile = parseJSON(row.profile, {});
  const sourceAvatar = normalizeAvatar(row.avatar || profile.avatar);
  const avatar = embeddedImagePattern.test(sourceAvatar)
    ? `/api/photowall/avatar/${encodeURIComponent(row.id)}`
    : sourceAvatar;

  return {
    ...user,
    avatar,
    profile: {
      name: profile.name || row.name || row.username || '',
      hometown: profile.hometown || '',
      hobbies: Array.isArray(profile.hobbies) ? profile.hobbies : [],
      bio: profile.bio || ''
    }
  };
};

const sendFailure = (error, res) => {
  console.error('获取照片墙失败:', error);
  res.status(500).json({ success: false, message: '获取用户列表失败' });
};

// 保持已有接口：管理员可获取全部，前端普通用户实际调用 /class/:classId。
router.get('/', async (_req, res) => {
  try {
    const [rows] = await pool.query(photoUserSelect);
    res.json({ success: true, data: rows.map(formatPhotoWallUser) });
  } catch (error) { sendFailure(error, res); }
});

router.get('/class/:classId', async (req, res) => {
  try {
    const [classes] = await pool.execute('SELECT name FROM classes WHERE id = ?', [req.params.classId]);
    if (!classes[0]) return res.status(404).json({ success: false, message: '班级不存在' });
    const [rows] = await pool.execute(`${photoUserSelect} AND u.class_id = ?`, [req.params.classId]);
    res.json({ success: true, data: rows.map(formatPhotoWallUser) });
  } catch (error) { sendFailure(error, res); }
});

router.get('/avatar/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT avatar, profile, updated_at FROM users WHERE id = ? AND role <> ?', [req.params.id, 'admin']);
    if (!rows[0]) return res.status(404).end();

    const profile = parseJSON(rows[0].profile, {});
    const avatar = normalizeAvatar(rows[0].avatar || profile.avatar);
    const match = avatar.match(embeddedImagePattern);

    if (!match) {
      if (/^https?:\/\//i.test(avatar)) return res.redirect(302, avatar);
      return res.status(404).end();
    }

    const image = Buffer.from(match[2].replace(/[\r\n]/g, ''), 'base64');
    res.set({
      'Content-Type': match[1],
      'Content-Length': String(image.length),
      'Cache-Control': 'private, max-age=300'
    });
    return res.send(image);
  } catch (error) {
    console.error('获取头像失败:', error);
    return res.status(500).end();
  }
});

router.get('/user/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(`${photoUserSelect} AND u.id = ?`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, message: '用户不存在' });
    res.json({ success: true, data: formatPhotoWallUser(rows[0]) });
  } catch (error) { sendFailure(error, res); }
});

module.exports = router;
