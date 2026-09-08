#!/usr/bin/env node

const fs = require('fs');

const [beforePath, afterPath] = process.argv.slice(2);
if (!beforePath || !afterPath) {
  console.error('用法：node scripts/compare-db-inventory.js 升级前清单.json 升级后清单.json');
  process.exit(2);
}

const before = JSON.parse(fs.readFileSync(beforePath, 'utf8'));
const after = JSON.parse(fs.readFileSync(afterPath, 'utf8'));
const protectedFields = [
  'database',
  'classes',
  'users',
  'students',
  'synonymGroups',
  'standardHobbies',
  'studentsWithStoredAvatar',
  'storedStudentAvatarBytes',
  'orphanUsers',
  'adminExists',
  'adminPasswordHashed'
];

const changes = protectedFields.filter((field) => before[field] !== after[field]);
if (changes.length) {
  for (const field of changes) console.error(`${field}: 升级前=${before[field]}，升级后=${after[field]}`);
  console.error('数据库清单发生变化，已停止自动发布。请先核对数据和备份。');
  process.exit(1);
}

console.log(`数据库清单一致：已核对 ${protectedFields.length} 项，学生注册数据未因代码升级改变。`);
