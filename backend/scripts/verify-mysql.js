require('dotenv').config();

const { pool, connectDB } = require('../db');

const run = async () => {
  await connectDB();
  const [[classCount]] = await pool.query('SELECT COUNT(*) AS total FROM classes');
  const [[userCount]] = await pool.query('SELECT COUNT(*) AS total FROM users');
  const [[groupCount]] = await pool.query('SELECT COUNT(*) AS total FROM synonym_groups');
  const [[orphans]] = await pool.query('SELECT COUNT(*) AS total FROM users u LEFT JOIN classes c ON c.id = u.class_id WHERE u.class_id IS NOT NULL AND c.id IS NULL');
  const [admins] = await pool.query("SELECT email, password_hash FROM users WHERE role = 'admin'");
  const admin = admins.find((item) => item.email === 'admin@system.com');
  const adminPasswordHashed = Boolean(admin?.password_hash?.startsWith('$2'));
  const report = { database: process.env.DB_NAME || 'personalink', classes: Number(classCount.total), users: Number(userCount.total), synonymGroups: Number(groupCount.total), orphanUsers: Number(orphans.total), adminExists: Boolean(admin), adminPasswordHashed };
  console.log(JSON.stringify(report, null, 2));
  // 全新站点允许管理员先登录后再创建第一个班级，因此班级数量可以为 0。
  if (!report.users || report.orphanUsers || !report.adminExists || !report.adminPasswordHashed) process.exitCode = 1;
  await pool.end();
};

run().catch(async (error) => {
  console.error('MySQL 校验失败：', error.message);
  await pool.end();
  process.exit(1);
});
