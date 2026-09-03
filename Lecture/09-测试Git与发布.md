# 第 09 课：测试、Git 与发布——让成果可追溯

## 本课目标

知道“能运行”不等于“已验证”，并能用 Git 保存一个可回退版本。

## 先测试，再提交

每次功能修改至少回答：

| 测试类型 | 示例 |
| --- | --- |
| 正常流程 | 正确输入后能成功保存 |
| 错误输入 | 空姓名、重复邮箱、错误密码有提示 |
| 边界情况 | 班级有成员时不能删除 |
| 回归检查 | 原来的登录、照片墙、返回按钮仍正常 |

完整清单见 `docs/test-plan.md`。学生可先写一个简化表：操作、预期、实际、是否通过。

## Git 最小工作流

```powershell
git status
git add .
git commit -m "learn: 完成公告功能"
git push origin master
```

`git status` 用于确认改了什么；`git add .` 选择提交；`git commit` 留下本地历史；`git push` 上传到 GitHub。

## 固定一个版本

当测试通过、准备继续开发时：

```powershell
git tag -a v1.0.0 -m "v1.0.0：完成基础功能"
git push origin v1.0.0
```

以后临时查看该版本：

```powershell
git switch --detach v1.0.0
```

恢复继续开发：

```powershell
git switch master
```

不要把 `git reset --hard` 当作日常撤销方式。它可能丢失未提交工作；先用 Git 历史、分支和 Tag 保留成果。

## 下载老师发布的指定版本

老师发布 `v1.1.0` 后，标签就像贴在一张确定照片上的编号：不管 `master` 后来又增加多少功能，`v1.1.0` 指向的内容都不变。

第一次下载且希望以后能切换版本，执行：

```powershell
git clone https://github.com/Abner199/PersonaLink_NoDB_20260828.git
cd PersonaLink_NoDB_20260828
git switch --detach v1.1.0
```

只需这一个版本时，可少下载一些无关历史：

```powershell
git clone --branch v1.1.0 --single-branch https://github.com/Abner199/PersonaLink_NoDB_20260828.git
```

此时若只是运行或学习，不必做别的；若要从这个版本开始完成自己的作业，先建一个分支：

```powershell
git switch -c feature/我的作业 v1.1.0
```

不要把“下载 ZIP”与“Git 克隆”混为一谈：ZIP 是只能阅读的源码快照；Git 克隆还保留了版本历史、标签和后续提交能力。完整发布规则见 [开发维护指南](../docs/开发维护指南.md#8-git-与发布)。

## 必做

- [ ] 为小项目写 3 条测试记录。
- [ ] 创建一条清楚描述工作的 Git 提交。
- [ ] 向同桌解释 Commit 和 Tag 的区别。

更多发布步骤见 `docs/开发维护指南.md`。
