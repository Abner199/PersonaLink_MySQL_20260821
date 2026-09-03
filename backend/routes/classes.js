const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../db');
const adminAuth = require('../middleware/adminAuth');
const { formatUserData, toISOString } = require('../utils/userUtils');

const router = express.Router();

const classSelect = `
  SELECT c.*, COUNT(u.id) AS student_count
  FROM classes c
  LEFT JOIN users u ON u.class_id = c.id AND u.role <> 'admin'
  GROUP BY c.id`;

const formatClass = (row) => ({
  id: row.id,
  name: row.name,
  description: row.description || '',
  teacher: row.teacher || '',
  createdAt: toISOString(row.created_at),
  updatedAt: toISOString(row.updated_at),
  studentCount: Number(row.student_count || 0)
});

const handleError = (error, res) => {
  if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: '班级名称已存在' });
  console.error('班级 API 错误:', error);
  return res.status(500).json({ message: '服务器错误' });
};

router.get('/', async (_req, res) => {
  try {
    const [rows] = await pool.query(`${classSelect} ORDER BY c.created_at ASC`);
    res.json(rows.map(formatClass));
  } catch (error) { handleError(error, res); }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(`${classSelect} HAVING c.id = ?`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: '班级不存在' });
    res.json(formatClass(rows[0]));
  } catch (error) { handleError(error, res); }
});

router.post('/', adminAuth, async (req, res) => {
  const { name, description = '', teacher = '' } = req.body;
  try {
    if (!name) return res.status(400).json({ message: '班级名称不能为空' });
    const now = new Date();
    const newClass = { id: uuidv4(), name, description, teacher, createdAt: now.toISOString() };
    await pool.execute('INSERT INTO classes (id, name, description, teacher, created_at) VALUES (?, ?, ?, ?, ?)', [newClass.id, name, description, teacher, now]);
    res.status(201).json(newClass);
  } catch (error) { handleError(error, res); }
});

router.put('/:id', adminAuth, async (req, res) => {
  const { name, description, teacher } = req.body;
  try {
    const [found] = await pool.execute('SELECT id FROM classes WHERE id = ?', [req.params.id]);
    if (!found[0]) return res.status(404).json({ message: '班级不存在' });
    await pool.execute(
      `UPDATE classes SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        teacher = COALESCE(?, teacher),
        updated_at = ?
       WHERE id = ?`,
      [name || null, description === undefined ? null : description, teacher === undefined ? null : teacher, new Date(), req.params.id]
    );
    const [rows] = await pool.execute(`${classSelect} HAVING c.id = ?`, [req.params.id]);
    res.json(formatClass(rows[0]));
  } catch (error) { handleError(error, res); }
});

router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const [students] = await pool.execute("SELECT COUNT(*) AS count FROM users WHERE class_id = ? AND role <> 'admin'", [req.params.id]);
    if (Number(students[0].count) > 0) return res.status(400).json({ message: '班级中还有学生，无法删除', studentsCount: Number(students[0].count) });
    const [result] = await pool.execute('DELETE FROM classes WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: '班级不存在' });
    res.json({ message: '班级删除成功' });
  } catch (error) { handleError(error, res); }
});

router.get('/:id/students', adminAuth, async (req, res) => {
  try {
    const [classes] = await pool.execute('SELECT id FROM classes WHERE id = ?', [req.params.id]);
    if (!classes[0]) return res.status(404).json({ message: '班级不存在' });
    const [rows] = await pool.execute("SELECT id, username, name, email, avatar, role, class_id, profile, avatar_index, created_at, updated_at FROM users WHERE class_id = ? AND role <> 'admin' ORDER BY name, created_at", [req.params.id]);
    res.json(rows.map(formatUserData));
  } catch (error) { handleError(error, res); }
});

module.exports = router;
