const express = require('express');
const { pool } = require('../db');
const { formatUserData } = require('../utils/userUtils');

const router = express.Router();
const photoUserSelect = `
  SELECT u.*, c.name AS class_name
  FROM users u
  LEFT JOIN classes c ON c.id = u.class_id
  WHERE u.role <> 'admin'`;

const sendFailure = (error, res) => {
  console.error('获取照片墙失败:', error);
  res.status(500).json({ success: false, message: '获取用户列表失败' });
};

// 保持已有接口：管理员可获取全部，前端普通用户实际调用 /class/:classId。
router.get('/', async (_req, res) => {
  try {
    const [rows] = await pool.query(photoUserSelect);
    res.json({ success: true, data: rows.map(formatUserData) });
  } catch (error) { sendFailure(error, res); }
});

router.get('/class/:classId', async (req, res) => {
  try {
    const [classes] = await pool.execute('SELECT name FROM classes WHERE id = ?', [req.params.classId]);
    if (!classes[0]) return res.status(404).json({ success: false, message: '班级不存在' });
    const [rows] = await pool.execute(`${photoUserSelect} AND u.class_id = ?`, [req.params.classId]);
    res.json({ success: true, data: rows.map(formatUserData) });
  } catch (error) { sendFailure(error, res); }
});

router.get('/user/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(`${photoUserSelect} AND u.id = ?`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, message: '用户不存在' });
    res.json({ success: true, data: formatUserData(rows[0]) });
  } catch (error) { sendFailure(error, res); }
});

module.exports = router;
