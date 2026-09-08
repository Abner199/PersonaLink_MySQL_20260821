const assert = require('assert');
const router = require('../routes/classes');
const { pool } = require('../db');
const { rosterStudentSelect } = require('../utils/rosterUtils');

const routeLayer = router.stack.find((layer) => layer.route?.path === '/:id/students');
assert(routeLayer, '未找到班级学生名单路由');
const routeHandler = routeLayer.route.stack.at(-1).handle;

const students = Array.from({ length: 46 }, (_, index) => ({
  id: `student-${index + 1}`,
  username: `student${index + 1}`,
  name: `学员${index + 1}`,
  email: `student${index + 1}@example.com`,
  class_id: 'class-46',
  avatar_index: index + 1,
  created_at: new Date('2026-09-08T00:00:00Z'),
  updated_at: new Date('2026-09-08T00:00:00Z'),
  has_stored_avatar: 1
}));

const originalExecute = pool.execute;
let callCount = 0;
pool.execute = async (sql) => {
  callCount += 1;
  if (callCount === 1) return [[{ id: 'class-46' }]];
  assert.strictEqual(sql, rosterStudentSelect);
  assert(!/SELECT[^;]*\bavatar\s*,/is.test(sql), '名单查询不应读取完整 avatar 字段');
  assert(!/SELECT[^;]*\bprofile\s*,/is.test(sql), '名单查询不应读取完整 profile 字段');
  return [students];
};

let responseBody;
const response = {
  statusCode: 200,
  status(code) { this.statusCode = code; return this; },
  json(value) { responseBody = value; return this; }
};

routeHandler({ params: { id: 'class-46' } }, response)
  .then(() => {
    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(responseBody.length, 46);
    assert(responseBody.every((student) => student.avatar.startsWith('/api/photowall/avatar/')));
    assert(!JSON.stringify(responseBody).includes('data:image/'));
    assert(Buffer.byteLength(JSON.stringify(responseBody)) < 30000, '46 人轻量名单不应超过 30 KB');
    console.log(`班级名单轻量接口测试通过：${responseBody.length} 人，${Buffer.byteLength(JSON.stringify(responseBody))} 字节。`);
  })
  .finally(() => {
    pool.execute = originalExecute;
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
