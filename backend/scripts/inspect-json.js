require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { LEGACY_ADMIN_HASH } = require('../utils/password');

const jsonPath = process.env.JSON_SOURCE || path.join(__dirname, '..', 'db.json');
const duplicateCount = (values) => values.length - new Set(values).size;

const run = () => {
  if (!fs.existsSync(jsonPath)) throw new Error(`未找到 JSON 源数据：${jsonPath}`);

  const source = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const classes = Array.isArray(source.classes) ? source.classes : [];
  const users = Array.isArray(source.users) ? source.users : [];
  const groups = Array.isArray(source.synonymGroups) ? source.synonymGroups : [];
  const hobbies = Array.isArray(source.standard_hobbies) ? source.standard_hobbies : [];
  const classIds = classes.map((item) => item.id).filter(Boolean);
  const classIdSet = new Set(classIds);
  const userIds = users.map((item) => item.id).filter(Boolean);
  const emails = users.map((item) => String(item.email || '').trim().toLowerCase()).filter(Boolean);
  const admins = users.filter((item) => String(item.email || '').trim().toLowerCase() === 'admin@system.com');
  const students = users.filter((item) => item.role !== 'admin' && String(item.email || '').trim().toLowerCase() !== 'admin@system.com');
  const orphanUsers = users.filter((item) => item.classId && !classIdSet.has(item.classId));
  const hasDisplayableAvatar = (item) => typeof item.avatar === 'string' && item.avatar.length > 0 && !item.avatar.includes('picsum.photos');
  const errors = [];

  if (!users.length) errors.push('没有用户数据');
  if (classIds.length !== classes.length) errors.push('存在缺少 ID 的班级');
  if (userIds.length !== users.length) errors.push('存在缺少 ID 的用户');
  if (emails.length !== users.length) errors.push('存在缺少邮箱的用户');
  if (users.some((item) => typeof item.password !== 'string' || !item.password)) errors.push('存在缺少密码的用户');
  if (duplicateCount(classIds)) errors.push('存在重复班级 ID');
  if (duplicateCount(userIds)) errors.push('存在重复用户 ID');
  if (duplicateCount(emails)) errors.push('存在重复邮箱');
  if (orphanUsers.length) errors.push('存在引用不存在班级的用户');
  if (admins.length !== 1) errors.push('必须且只能有一个 admin@system.com 管理员');

  const report = {
    classes: classes.length,
    users: users.length,
    students: students.length,
    synonymGroups: groups.length,
    standardHobbies: hobbies.length,
    usersWithClass: users.filter((item) => item.classId).length,
    studentsWithCustomAvatar: students.filter(hasDisplayableAvatar).length,
    studentsUsingDefaultAvatar: students.filter((item) => !hasDisplayableAvatar(item)).length,
    orphanUsers: orphanUsers.length,
    duplicateEmails: duplicateCount(emails),
    passwordsPresent: users.every((item) => typeof item.password === 'string' && item.password.length > 0),
    bcryptPasswords: users.filter((item) => typeof item.password === 'string' && item.password.startsWith('$2')).length,
    plaintextPasswords: users.filter((item) => typeof item.password === 'string' && !item.password.startsWith('$2')).length,
    adminExists: admins.length === 1,
    adminPasswordResetRequired: admins.some((item) => item.password === LEGACY_ADMIN_HASH),
    valid: errors.length === 0,
    errors
  };

  console.log(JSON.stringify(report, null, 2));
  if (errors.length) process.exitCode = 1;
};

try {
  run();
} catch (error) {
  console.error('JSON 数据核验失败：', error.message);
  process.exitCode = 1;
}
