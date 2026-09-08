# PersonaLink CI/CD 发布与安全部署

本文说明如何让 GitHub Actions 自动检查项目，并通过手动批准的 CD 流程安全更新 Ubuntu 服务器。CD 只部署已经发布的版本标签，先备份和比对 MySQL，不运行模拟数据导入。

## 1. 自动化流程

| 工作流 | 触发方式 | 作用 |
| --- | --- | --- |
| `CI` | 推送 `main`、推送版本标签、向 `main` 提交 PR | 核对版本、检查后端语法、在临时 MySQL 建表并导入模拟数据、验证数据库、构建前端并保存构建产物 |
| `CD - Deploy production release` | GitHub 页面手动执行 | 校验正式 Release，通过 SSH 调用服务器发布脚本，备份数据库、比对数据、部署并验收版本 |

CI 使用的是 GitHub 临时 MySQL，其中的 `db:migrate-json` 不会连接生产服务器。生产 CD 不执行 `db:migrate-json`、`db:schema`、`DELETE`、`DROP` 或 `TRUNCATE`。

## 2. 第一次在服务器安装安全发布脚本

以下命令在 Ubuntu 服务器逐行执行。`git status --short` 必须没有输出：

```bash
# 进入已经部署的项目目录。
cd /srv/personalink

# 确认没有在服务器手工修改受 Git 管理的文件。
git status --short

# 获取所有正式版本标签，但暂不切换运行版本。
git fetch --tags origin

# 从固定标签提取发布脚本并安装为仅 root 可修改和执行。
git show v1.0.4:scripts/deploy-release.sh | sudo tee /usr/local/sbin/deploy-personalink-release > /dev/null
sudo chmod 700 /usr/local/sbin/deploy-personalink-release

# 第一次仍由管理员手工运行，脚本会自动备份并检查数据。
sudo /usr/local/sbin/deploy-personalink-release v1.0.4
```

成功输出必须同时出现 `发布成功：v1.0.4` 和 `MySQL 数据清单保持一致`。脚本会更新自己的已安装副本，并安装只读巡检命令；以后发布新版本时无需重复提取。

## 3. 创建专用 SSH 部署权限

推荐使用普通 SSH 用户，不开放 GitHub Actions 的 root 密码登录。让该用户只能无密码执行固定发布脚本：

```bash
# 把当前 SSH 用户写入最小 sudo 规则。
echo "$USER ALL=(root) NOPASSWD: /usr/local/sbin/deploy-personalink-release" | sudo tee /etc/sudoers.d/personalink-deploy

# 设置严格权限并检查 sudoers 语法。
sudo chmod 440 /etc/sudoers.d/personalink-deploy
sudo visudo -cf /etc/sudoers.d/personalink-deploy

# 确认当前用户无需输入密码即可调用脚本；缺少版本参数时显示明确错误是正常的。
sudo -n /usr/local/sbin/deploy-personalink-release
```

为 GitHub Actions 创建独立 ed25519 密钥，把公钥追加到该用户的 `~/.ssh/authorized_keys`。私钥只放 GitHub Secret，不放仓库、部署文档或服务器项目目录。

## 4. 配置 GitHub Environment 和 Secrets

在仓库 `Settings → Environments` 创建 `production`，建议启用 Required reviewers。然后在 `production` 环境中创建以下 Secrets：

| Secret | 示例或内容 |
| --- | --- |
| `PRODUCTION_HOST` | `43.156.217.98` |
| `PRODUCTION_URL` | HTTPS 完成前为 `http://peaceinside.fun`，完成后改为 `https://peaceinside.fun` |
| `PRODUCTION_USER` | 拥有上述最小 sudo 权限的 SSH 用户名 |
| `PRODUCTION_SSH_PRIVATE_KEY` | 专用 ed25519 私钥完整内容 |
| `PRODUCTION_KNOWN_HOSTS` | 经管理员核对指纹后的服务器 known_hosts 记录 |

不要使用 `ssh-keyscan` 得到结果后未经指纹核对就直接信任。应通过云厂商控制台或首次可信 SSH 连接确认服务器主机密钥指纹，再保存到 `PRODUCTION_KNOWN_HOSTS`。

## 5. 手动触发生产 CD

先确认目标版本已经出现在 GitHub Releases。然后可以在仓库 `Actions → CD - Deploy production release → Run workflow` 输入版本标签，也可在已登录 GitHub CLI 的电脑执行：

```bash
# 触发固定版本的生产部署。
gh workflow run deploy-production.yml --repo Abner199/PersonaLink_MySQL_20260821 -f release_tag=v1.0.4

# 查看最近的 CD 运行记录。
gh run list --repo Abner199/PersonaLink_MySQL_20260821 --workflow deploy-production.yml --limit 5

# 打开最近一次运行的日志并等待结束。
gh run watch --repo Abner199/PersonaLink_MySQL_20260821
```

CD 使用 `production` Environment，因此启用审核后必须由授权人员批准才会连接服务器。同一时间只允许一个生产发布任务，后来的任务会等待，不会取消正在备份或部署的任务。

## 6. 发布脚本的数据保护顺序

1. 验证 root 权限、标签格式、项目目录、备份命令和干净工作区。
2. 保存升级前数据库清单。
3. 生成 SQL gzip、SHA-256、Git commit 和数据库清单四件套备份。
4. 获取并切换到指定版本标签，核对 7 处版本号。
5. 使用 lockfile 安装依赖并构建前端。
6. 再次读取数据库清单，比对班级、用户、学生、头像等 11 项数据。
7. 只有数据一致才更新 systemd、Nginx 兼容配置并重启服务。
8. 等待健康检查，通过 `/api/version` 确认运行版本与目标标签一致。

部署完成后可随时执行一条只读巡检命令。地址参数应与当前实际协议一致；尚未配置 HTTPS 时使用 `http://`：

```bash
# 检查服务、Nginx、版本、MySQL 清单和照片墙响应，不修改数据。
sudo /usr/local/sbin/check-personalink http://peaceinside.fun
```

如果部署期间恰好有新学生注册，前后清单会不同，脚本会安全停止并保留数据，不会删除新注册信息。建议在低使用时段重新执行。

## 7. CI/CD 失败处理

- CI 的 MySQL 导入失败：只影响临时测试容器，不能跳过，应修复后重新发布。
- CD 提示工作区不干净：登录服务器执行 `cd /srv/personalink` 和 `git status --short`，先人工确认文件来源。
- CD 提示数据清单变化：不要强行继续，查看最新四件套备份和服务器操作记录。
- 健康检查失败：执行 `sudo journalctl -u personalink -n 100 --no-pager`。
- Nginx 检查失败：执行 `sudo nginx -t`。若提示 `gzip directive is duplicate in /etc/nginx/conf.d/personalink-gzip.conf`，执行 `sudo mv /etc/nginx/conf.d/personalink-gzip.conf /etc/nginx/conf.d/personalink-gzip.conf.disabled`，再重新检查；改名可恢复且不影响 MySQL。
- SSH 失败：核对安全组 22 端口、部署用户、公钥、主机指纹和四个 production Secrets。

## 8. 安全边界

- CI/CD 只负责代码版本，实时学生数据仍以 MySQL 和异地备份为准。
- 不在 workflow 中保存数据库密码、SSH 私钥、`.env` 或真实 SQL 备份。
- 不把 CD 改为每次推送 `main` 自动部署；生产环境只部署经过测试并发布的固定标签。
- 已发布标签不得移动或覆盖。需要修复时增加补丁版本，例如从 `v1.0.4` 发布 `v1.0.5`。
