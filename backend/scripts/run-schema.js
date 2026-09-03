require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const run = async () => {
  const databaseName = process.env.DB_NAME || 'personalink';
  if (!/^[A-Za-z0-9_]+$/.test(databaseName)) throw new Error('DB_NAME 只能包含字母、数字和下划线');
  const sql = fs.readFileSync(path.join(__dirname, '..', 'database', 'schema.sql'), 'utf8').replaceAll('personalink', databaseName);
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    // 建库需要的管理员账号可临时以环境变量传入；应用本身仍应使用低权限 DB_USER。
    user: process.env.DB_ADMIN_USER || process.env.DB_USER || 'root',
    password: process.env.DB_ADMIN_PASSWORD || process.env.DB_PASSWORD || '',
    charset: 'utf8mb4',
    multipleStatements: true
  });
  try {
    await connection.query(sql);
    console.log('MySQL 数据库结构已就绪。');
  } finally {
    await connection.end();
  }
};

run().catch((error) => {
  console.error('创建数据库结构失败：', error.message);
  process.exit(1);
});
