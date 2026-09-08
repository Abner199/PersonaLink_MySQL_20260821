const assert = require('assert');
require('dotenv').config();

const { pool, connectDB } = require('../db');
const { rosterStudentSelect, formatRosterStudent } = require('../utils/rosterUtils');

const run = async () => {
  await connectDB();
  const [classes] = await pool.query("SELECT class_id, COUNT(*) AS total FROM users WHERE role <> 'admin' AND class_id IS NOT NULL GROUP BY class_id ORDER BY total DESC LIMIT 1");
  assert(classes[0], '测试数据库没有可核验的班级学生');

  const [rows] = await pool.execute(rosterStudentSelect, [classes[0].class_id]);
  const payload = rows.map(formatRosterStudent);
  const serialized = JSON.stringify(payload);

  assert.strictEqual(payload.length, Number(classes[0].total));
  assert(!serialized.includes('data:image/'), '名单响应不能包含 base64 头像');
  assert(Buffer.byteLength(serialized) < Math.max(1000, payload.length * 1000), '名单响应体积异常');
  console.log(`MySQL 班级名单查询通过：${payload.length} 人，${Buffer.byteLength(serialized)} 字节。`);
  await pool.end();
};

run().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
