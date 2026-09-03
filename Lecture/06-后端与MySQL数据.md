# 第 06 课：后端与 MySQL 数据——一次注册如何被保存

## 本课目标

理解 Express 路由怎样调用 MySQL，以及为什么数据库连接信息不能写在前端或提交到 Git。

## 要打开的文件

| 文件 | 负责什么 |
| --- | --- |
| `backend/server.js` | 启动 Express，确认 MySQL 可连接，再监听 3003 |
| `backend/db.js` | 创建 MySQL 连接池和事务工具 |
| `backend/routes/users.js` | 注册、登录、管理员用户操作的 SQL 调用 |
| `backend/database/schema.sql` | `users`、`classes` 等表的真实结构 |
| `backend/.env` | 本机/服务器数据库地址和密码，仅本机保存 |

## 跟着做

1. 确保数据库已建立并导入演示数据，执行 `npm run db:verify`。
2. 用一个新邮箱注册用户，选择一个已有班级。
3. 在 MySQL 客户端中查询：

```sql
SELECT email, name, class_id, created_at
FROM users
WHERE email = '你刚注册的邮箱';
```

4. 打开 `routes/users.js`，找到 `INSERT INTO users`。观察问号 `?` 与后面的参数数组：这是参数化 SQL，用户输入不会直接拼到 SQL 字符串中。
5. 再查询 `password_hash`。它应以 `$2a$` 或 `$2b$` 开头；这说明数据库保存的是 bcrypt 哈希，而不是原密码。

## 必做

- [ ] 画出“页面 → API → Express 路由 → MySQL → 响应”的箭头图。
- [ ] 找到注册接口检查班级存在与邮箱重复的位置。
- [ ] 说明 `DB_PASSWORD` 为什么只能放 `.env`。
- [ ] 用自己的话解释“连接池”为什么比每个请求临时连一次数据库更合适。

## 重要提醒

- `backend/db.json` 不再是运行时数据库，只能作为从旧 NoDB 项目导入数据的来源。
- MySQL 账号和密码泄露的影响远大于普通代码泄露；不要上传 `.env`、SQL 备份或截图中的密码。
- 现阶段管理员接口为了兼容既有前端，仍由请求体传入管理员凭据；生产下一步应升级为登录令牌和后端授权。

## 挑战

阅读 `schema.sql` 中 `fk_users_class` 外键：回答为什么有学生的班级不能被删除，以及这个规则为什么同时存在于后端和数据库中。
