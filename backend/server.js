const express = require('express');
const cors = require('cors');
const { connectDB } = require('./db');
const userRoutes = require('./routes/users');
const classRoutes = require('./routes/classes');
const photoWallRoutes = require('./routes/photowall');
const synonymsRoutes = require('./routes/synonyms_new');
const errorHandler = require('./middleware/errorHandler');
const { version } = require('./package.json');

const app = express();
const PORT = Number(process.env.PORT || 3003);

// 中间件
app.use(cors());
// Express 4.16+ 已内置 JSON 和表单解析器，不再需要额外安装 body-parser。
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API路由
app.use('/api/users', userRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/photowall', photoWallRoutes);
app.use('/api/synonyms', synonymsRoutes);

// 测试路由
app.get('/', (req, res) => {
  res.json({ message: 'PersonaLink API is running!', version });
});

// 供页面、运维检查和问题反馈确认当前部署的代码版本。
app.get('/api/version', (_req, res) => {
  res.json({
    name: 'PersonaLink MySQL',
    version,
    release: `v${version}`,
    apiVersion: 'v1',
    database: 'mysql'
  });
});

// 供 Docker、负载均衡器和迁移后验收使用的健康检查。
app.get('/health', async (_req, res) => {
  try {
    await connectDB();
    res.json({ status: 'ok', database: 'mysql', version });
  } catch (error) {
    res.status(503).json({ status: 'unavailable', database: 'mysql', version });
  }
});

// 错误处理中间件
app.use(errorHandler);

// 先确认 MySQL 可用；避免应用看似启动成功、实际无法读写数据。
const start = async () => {
  try {
    await connectDB();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`PersonaLink API is listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('无法连接 MySQL，服务未启动：', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  start();
}

module.exports = { app, start };
