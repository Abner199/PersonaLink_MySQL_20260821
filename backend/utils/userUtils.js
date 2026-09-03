/**
 * 用户数据格式化工具
 * 统一处理用户数据格式化逻辑
 */

/**
 * 格式化用户数据，确保包含profile字段和头像
 * @param {Object} user - 用户对象
 * @param {Object} db - 数据库对象
 * @returns {Object} 格式化后的用户对象
 */
const normalizeAvatar = (avatar) => (
  typeof avatar === 'string' && !avatar.includes('picsum.photos') ? avatar : ''
);

const parseJSON = (value, fallback) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch (_) {
    return fallback;
  }
};

const toISOString = (value) => (value ? new Date(value).toISOString() : null);

// 将 MySQL 行转换回前端既有的 camelCase API 结构。
const formatUserData = (row) => ({
  id: row.id,
  username: row.username || row.name,
  name: row.name || row.username,
  email: row.email,
  avatar: normalizeAvatar(row.avatar),
  role: row.role || 'user',
  classId: row.class_id || row.classId || null,
  className: row.class_name || row.className || null,
  profile: {
    name: row.name || row.username || '',
    hometown: '',
    phone: '',
    hobbies: [],
    bio: '',
    ...parseJSON(row.profile, {})
  },
  avatarIndex: row.avatar_index ?? row.avatarIndex ?? null,
  createdAt: toISOString(row.created_at || row.createdAt),
  updatedAt: toISOString(row.updated_at || row.updatedAt)
});

module.exports = {
  formatUserData,
  normalizeAvatar,
  parseJSON,
  toISOString
};
