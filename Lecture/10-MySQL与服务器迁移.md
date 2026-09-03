# 第 10 课：MySQL 与服务器迁移——让数据跟着项目走

## 本课目标

理解“代码迁移”和“数据迁移”不是同一件事，并能完成一次安全的备份、恢复和验收演练。

## 一个最重要的模型

```text
Git 仓库：代码、数据库结构、迁移脚本、文档
MySQL：用户、班级、资料、同义词和当前版本的用户上传头像
frontend/public/images：随代码部署的默认头像和背景图
```

克隆 Git 仓库只能得到代码，**不会自动得到线上 MySQL 数据**。当前用户上传头像也在 MySQL 中，因此换服务器前必须准备完整 SQL 备份。

## 课堂演练：导出与恢复

教师提供两个测试数据库：`personalink_old` 与 `personalink_new`。

```bash
# 从旧库导出结构和数据
mysqldump -u 用户名 -p --single-transaction personalink_old > personalink.sql

# 导入新库
mysql -u 用户名 -p personalink_new < personalink.sql
```

然后把后端 `.env` 的 `DB_NAME` 改为 `personalink_new`，重启后端并执行：

```bash
npm run db:verify
```

## 必做

- [ ] 解释为什么 Git Tag 只能固定代码，不能替代数据库备份。
- [ ] 写出“旧库导出 → 新库导入 → `.env` 改连接 → 健康检查 → 登录验收”的五步流程。
- [ ] 说出用户上传头像和默认图片各在哪里。

## 常见错误

| 错误 | 后果 | 正确做法 |
| --- | --- | --- |
| 只复制项目文件夹 | 新站没有线上用户数据 | 导入 SQL 备份 |
| 只复制代码、不导入 MySQL | 用户、资料和上传头像丢失 | 恢复完整 SQL 备份 |
| 新旧服务器同时开放写入 | 两份数据分叉，无法判断哪份最新 | 切换窗口内只保留一个写入源 |
| 把 SQL 备份提交 Git | 可能泄露用户资料与密码哈希 | 加密保存到独立备份位置 |

完整操作请阅读 [Ubuntu 24.04 部署与零丢数据迁移教程](../docs/Ubuntu24.04从GitHub部署与零丢数据迁移教程.md)。
