# PersonaLink MySQL

一个 Vue 3 + Express + MySQL 的班级信息分享项目，包含注册登录、个人资料、班级、照片墙、搜索、同义词和管理员功能。

当前稳定版本：[`v1.0.4`](https://github.com/Abner199/PersonaLink_MySQL_20260821/releases/tag/v1.0.4)。页面右下角和后端版本接口均可核对实际部署版本。

只下载稳定版：

```bash
git clone --branch v1.0.4 --single-branch https://github.com/Abner199/PersonaLink_MySQL_20260821.git
```

## 在线部署状态

- `v1.0.0` 基线已于 2026-09-07 部署到 [peaceinside.fun](http://peaceinside.fun) 并开始使用。
- 2026-09-08 核验时 HTTP 网站和 MySQL 服务正常，HTTPS 443 尚未开放。
- 线上已于 2026-09-08 升级到 `v1.0.2`，核验 7 个班级、88 名学生和 50 份已存头像保持一致；照片墙列表实测为 37,509 字节、0.022 秒。
- 线上随后升级到 `v1.0.3`，Ubuntu gzip 冲突修复生效，Nginx、后端和公网 HTTP 健康检查全部通过；HTTPS 按站点决定暂缓配置。
- `v1.0.4` 新增一条命令完成服务、Nginx、版本、MySQL 清单及照片墙响应的只读巡检。

## 小白先理解三部分

```text
Vue 前端（frontend）     显示页面
Express 后端（backend）  处理请求和权限
MySQL                    保存班级、账号、资料和头像
```

GitHub 保存代码和用于教学测试的 `backend/db.json` 模拟数据快照，不保存线上 MySQL 实时数据。换服务器必须同时迁移代码版本和数据库备份。

## 文档入口

- 云服务器部署、IP/域名、HTTPS、备份和换服务器：[Ubuntu 24.04 零基础部署与迁移教程](./docs/Ubuntu24.04从GitHub部署与零丢数据迁移教程.md)
- 自动检查和安全发布：[CI/CD 发布与安全部署](./docs/CI-CD发布与安全部署.md)
- 页面使用和管理员操作：[软件使用说明书](./docs/软件使用说明书.md)
- 修改代码、旧数据导入和发布：[开发维护指南](./docs/开发维护指南.md)
- 全部文档导航：[文档中心](./docs/README.md)
- v1.0.4 一键生产巡检与现场教程总结：[版本发布说明](./docs/releases/v1.0.4.md)
- v1.0.3 Ubuntu gzip 兼容修复：[历史版本说明](./docs/releases/v1.0.3.md)
- v1.0.2 CI/CD 与数据安全发布说明：[历史版本说明](./docs/releases/v1.0.2.md)
- v1.0.1 网络修复与服务器升级说明：[历史版本说明](./docs/releases/v1.0.1.md)
- v1.0.0 首个稳定基线与部署记录：[历史版本说明](./docs/releases/v1.0.0.md)
- 历次版本变化：[更新日志](./CHANGELOG.md)
- 系统学习课程：[Lecture](./Lecture/README.md)

## 本地第一次启动

需要 Node.js 20+、npm 和 MySQL 8.0+。

### 1. 配置 MySQL

```powershell
Copy-Item backend/.env.example backend/.env
notepad backend/.env
```

填写真实的 `DB_HOST`、`DB_PORT`、`DB_NAME` 和 `DB_USER`。教学演示可直接使用示例中的 `DB_PASSWORD=123456`；接入真实数据时应更换。`.env` 不能上传 GitHub。

### 2. 建表

```powershell
Set-Location backend
npm ci
npm run db:schema
```

如果应用账号没有建库权限，按 `.env.example` 临时填写 `DB_ADMIN_USER` 和 `DB_ADMIN_PASSWORD`。

### 3. 准备初始数据

二选一；“新服务器”不等于“全新空站点”：

- 教学演示站：先运行 `npm run db:inspect-json` 核验仓库自带的模拟数据，再设置 `ADMIN_INITIAL_PASSWORD` 并运行 `npm run db:migrate-json`。
- 真正的全新空站点：设置 `ADMIN_EMAIL=admin@system.com`、`ADMIN_NAME`、`ADMIN_INITIAL_PASSWORD` 后运行 `npm run db:create-admin`。

完成后执行：

```powershell
npm run db:verify
```

### 4. 启动后端和前端

后端终端：

```powershell
Set-Location backend
npm start
```

前端终端：

```powershell
Set-Location frontend
npm ci
npm run dev
```

打开 `http://localhost:3000`；后端健康检查是 `http://localhost:3003/health`，版本信息接口是 `http://localhost:3003/api/version`。

## 管理员功能

- 创建、编辑和删除空班级。
- 查看每班注册学员，复制姓名或导出 CSV。
- 添加、删除普通用户，重置普通用户密码。
- 修改自己的管理员密码。
- 管理同义词，查看全部或指定班级照片墙。

## 目录

```text
frontend/                 Vue 页面
backend/                  Express 与 MySQL API
backend/database/         MySQL 表结构
backend/scripts/          建表、导入、管理员初始化和校验
scripts/                  备份、恢复、安全发布和只读生产巡检脚本
deploy/                   Ubuntu systemd 服务文件
docs/                     操作文档和测试记录
Lecture/                  教学课程
```

`backend/db.json` 是本仓库刻意公开的教学模拟数据，只在执行迁移命令时读取。不要用真实用户快照覆盖它；真实数据和 SQL 备份不得推送到 GitHub。
