const express = require('express');
const { pool, withTransaction } = require('../db');
const adminAuth = require('../middleware/adminAuth');
const { parseJSON } = require('../utils/userUtils');

const router = express.Router();
const normalizeGroup = (row) => ({ ...row, synonyms: parseJSON(row.synonyms, []) });
const normalizeSynonyms = (values) => [...new Set(values.map((value) => String(value).trim().toLowerCase()).filter(Boolean))];

const validate = (body, res) => {
  const { name, category, synonyms } = body;
  if (!name || !category || !Array.isArray(synonyms) || synonyms.length < 2) {
    res.status(400).json({ message: '请提供组名、分类和至少两个同义词' });
    return null;
  }
  const normalized = normalizeSynonyms(synonyms);
  if (normalized.length < 2) {
    res.status(400).json({ message: '至少需要提供两个不同的同义词' });
    return null;
  }
  return { name, category, synonyms: normalized };
};

const getGroups = async () => {
  const [rows] = await pool.query('SELECT id, name, category, synonyms FROM synonym_groups ORDER BY name');
  return rows.map(normalizeGroup);
};

const error = (cause, res) => {
  console.error('同义词 API 错误:', cause);
  res.status(500).json({ message: '服务器错误' });
};

router.get('/', async (_req, res) => {
  try { res.json({ success: true, data: await getGroups() }); } catch (cause) { error(cause, res); }
});

router.get('/all', async (_req, res) => {
  try { res.json({ success: true, data: (await getGroups()).flatMap((group) => group.synonyms) }); } catch (cause) { error(cause, res); }
});

router.post('/', adminAuth, async (req, res) => {
  const input = validate(req.body, res);
  if (!input) return;
  try {
    const result = await withTransaction(async (connection) => {
      const [rows] = await connection.query('SELECT id, name, category, synonyms FROM synonym_groups FOR UPDATE');
      const existing = rows.map(normalizeGroup).find((group) => input.synonyms.some((word) => group.synonyms.includes(word)));
      if (existing) {
        const synonyms = [...new Set([...existing.synonyms, ...input.synonyms])];
        await connection.execute('UPDATE synonym_groups SET synonyms = ?, updated_at = ? WHERE id = ?', [JSON.stringify(synonyms), new Date(), existing.id]);
        return { message: '同义词已合并到现有组', data: { ...existing, synonyms } };
      }
      const group = { id: `syn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, ...input };
      await connection.execute('INSERT INTO synonym_groups (id, name, category, synonyms, updated_at) VALUES (?, ?, ?, ?, ?)', [group.id, group.name, group.category, JSON.stringify(group.synonyms), new Date()]);
      return { message: '同义词组添加成功', data: group };
    });
    res.json({ success: true, ...result });
  } catch (cause) { error(cause, res); }
});

router.put('/:id', adminAuth, async (req, res) => {
  const input = validate(req.body, res);
  if (!input) return;
  try {
    const [result] = await pool.execute('UPDATE synonym_groups SET name = ?, category = ?, synonyms = ?, updated_at = ? WHERE id = ?', [input.name, input.category, JSON.stringify(input.synonyms), new Date(), req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: '同义词组不存在' });
    res.json({ success: true, message: '同义词组更新成功', data: { id: req.params.id, ...input } });
  } catch (cause) { error(cause, res); }
});

router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM synonym_groups WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: '同义词组不存在' });
    res.json({ success: true, message: '同义词组删除成功' });
  } catch (cause) { error(cause, res); }
});

router.post('/init', adminAuth, async (_req, res) => {
  const defaults = [
    ['sports', '运动类', '运动', ['篮球', '篮球运动', 'basketball', '打篮球', '足球', '足球运动', 'soccer', 'football', '踢足球', '羽毛球', 'badminton', '运动', 'sports']],
    ['programming', '编程类', '技术', ['编程', '程序设计', 'programming', 'coding', '写代码', '软件开发']],
    ['reading', '阅读类', '文化', ['阅读', '读书', 'reading', '看书', '阅读书籍']],
    ['travel', '旅行类', '休闲', ['旅行', '旅游', 'travel', '出游', '观光']],
    ['photography', '摄影类', '艺术', ['摄影', '拍照', 'photography', '照相', '拍摄']],
    ['food', '美食类', '美食', ['美食', '美食探店', 'food', '品尝美食', '美食文化']],
    ['gaming', '游戏类', '娱乐', ['游戏', '玩游戏', 'gaming', '电子游戏', '电竞']],
    ['movie', '电影类', '娱乐', ['电影', '看电影', 'movie', 'film', '观影']],
    ['music', '音乐类', '艺术', ['音乐', 'music', '听音乐', '音乐欣赏']]
  ];
  try {
    await withTransaction(async (connection) => {
      await connection.query('DELETE FROM synonym_groups');
      for (const [id, name, category, synonyms] of defaults) {
        await connection.execute('INSERT INTO synonym_groups (id, name, category, synonyms, updated_at) VALUES (?, ?, ?, ?, ?)', [id, name, category, JSON.stringify(synonyms), new Date()]);
      }
    });
    res.json({ success: true, message: '同义词组初始化成功', data: await getGroups() });
  } catch (cause) { error(cause, res); }
});

module.exports = router;
