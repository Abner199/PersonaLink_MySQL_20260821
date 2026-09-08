const { toISOString } = require('./userUtils');

const rosterStudentSelect = `
  SELECT id, username, name, email, class_id, avatar_index, created_at, updated_at,
         CASE WHEN avatar LIKE 'data:image/%;base64,%' OR CAST(profile AS CHAR) LIKE '%data:image/%;base64,%' THEN 1 ELSE 0 END AS has_stored_avatar
  FROM users
  WHERE class_id = ? AND role <> 'admin'
  ORDER BY name, created_at`;

// 名单只返回展示和导出所需字段。真实头像通过已有按需接口加载，避免几十份 base64 图片堵塞名单请求。
const formatRosterStudent = (row) => ({
  id: row.id,
  username: row.username || row.name,
  name: row.name || row.username,
  email: row.email,
  avatar: Number(row.has_stored_avatar) > 0 ? `/api/photowall/avatar/${encodeURIComponent(row.id)}` : '',
  role: 'user',
  classId: row.class_id || null,
  profile: { name: row.name || row.username || '' },
  avatarIndex: row.avatar_index ?? null,
  createdAt: toISOString(row.created_at),
  updatedAt: toISOString(row.updated_at)
});

module.exports = { rosterStudentSelect, formatRosterStudent };
