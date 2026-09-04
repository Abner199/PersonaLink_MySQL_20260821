# Ubuntu 24.04 LTS 从 GitHub 零基础部署 PersonaLink

> 适用项目：`https://github.com/Abner199/PersonaLink_MySQL_20260821`  
> 适用系统：Ubuntu Server 24.04 LTS（Noble Numbat）  
> 部署方式：Nginx + Node.js 22 + Express + MySQL，先用公网 IP 验证，再选配域名和 HTTPS

本文假定服务器是刚安装完成的 Ubuntu 24.04 LTS，除系统本身外什么都没有。从第一次 SSH 登录开始，依次完成软件安装、下载代码、配置 MySQL、构建前端、启动后端、配置 Nginx，以及可选的域名和 HTTPS。

命令分为两类：标有“Windows PowerShell”的命令在自己的 Windows 电脑执行，其余 `bash` 命令均在 SSH 登录后的 Ubuntu 服务器执行。命令中的 `你的公网IP`、`你的域名` 和密码都是占位内容，必须替换为真实值，不要原样输入。

为避免复制时漏掉反斜杠、空格或续行，本教程中需要直接运行的命令均为“一行一条”。每个代码块可以整块粘贴执行；不要把终端提示符（例如 `root@server:~#`）一起复制。

## 1. 先理解最终结构

```text
用户浏览器
   ↓ 80/443
Nginx
   ├─ /              → Vue 构建后的静态文件
   ├─ /api/          → Express 127.0.0.1:3003
   └─ /health        → Express 健康检查
                          ↓
                    MySQL 127.0.0.1:3306
```

GitHub 保存代码和仓库内明确标注的 `backend/db.json` 教学模拟数据，但不保存服务器上的 `.env` 和实时 MySQL 数据。模拟 JSON 只用于首次导入，网站运行时的班级、学生、资料和头像全部来自 MySQL。换服务器时必须同时迁移“同一个 Git 版本”和“最终 MySQL 备份”。当前用户上传头像在 MySQL `users.avatar` 中，会随 SQL 备份迁移；默认图片在代码的 `frontend/public/images` 中。

## 2. 准备清单

开始前准备：

- 一台安装 Ubuntu 24.04 LTS 的云服务器，建议至少 2 核、2 GB 内存。
- 服务器公网 IP、SSH 用户名和密码或密钥。
- 云平台安全组已允许入站 TCP `22`、`80`；使用域名 HTTPS 时再允许 `443`。
- 安全组不要开放 `3003` 和 `3306`。它们只供服务器内部使用。
- 可选域名：先把域名的 A 记录指向服务器公网 IP，等待解析生效。

下文假定 SSH 用户叫 `ubuntu`。如果云厂商给的是其他用户名，以实际用户名为准。

## 3. 第一次连接服务器

Windows PowerShell 执行：

```powershell
ssh ubuntu@你的公网IP
```

第一次出现主机指纹时，核对 IP 后输入 `yes`。登录后检查系统：

```bash
cat /etc/os-release
uname -m
```

应看到 Ubuntu 24.04；常见架构是 `x86_64` 或 `aarch64`。

## 4. 更新系统并配置防火墙

先安装基础软件：

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y git curl ca-certificates openssl nginx mysql-server
```

上面三条命令依次用于刷新软件列表、安装系统更新、安装部署所需软件。如果升级提示需要重启，执行 `sudo reboot`，等待约一分钟后重新 SSH 登录。

先允许 SSH，再启用 UFW，顺序不要反：

```bash
# 先允许默认 22 端口的 SSH，避免启用防火墙后断开连接
sudo ufw allow OpenSSH

# 同时允许 Nginx 的 HTTP 80 和 HTTPS 443
sudo ufw allow 'Nginx Full'

# 启用防火墙；出现确认提示时输入 y
sudo ufw enable

# 查看最终规则，不应出现 3003 和 3306
sudo ufw status verbose
```

如果启用 UFW 后 SSH 断开，通常是云安全组或 SSH 端口不是 22。此时使用云厂商网页控制台修复，不要反复重装系统。

检查 MySQL 和 Nginx：

```bash
sudo systemctl status mysql --no-pager
sudo systemctl status nginx --no-pager
```

两者应为 `active (running)`。

## 5. 安装 Node.js 22

本项目的 Vite 8 需要较新的 Node.js。Ubuntu 自带版本可能不满足要求，因此使用 NodeSource 的 Node.js 22 仓库：

```bash
# 下载 NodeSource 的 Node.js 22 安装脚本
curl -fsSL https://deb.nodesource.com/setup_22.x -o /tmp/nodesource_setup.sh

# 添加 Node.js 22 软件源并安装 Node.js（npm 会一同安装）
sudo -E bash /tmp/nodesource_setup.sh
sudo apt install -y nodejs

# Node.js 应显示 v22.x
node -v
npm -v

# 删除已经用完的临时脚本
rm /tmp/nodesource_setup.sh
```

`node -v` 应为 `v22.x`；不要继续使用低于项目要求的版本。

## 6. 从 GitHub 公开仓库下载项目

PersonaLink 仓库已经设置为 Public。克隆公开仓库不需要 GitHub 账号、密码、Token 或 SSH Key。直接执行下面的命令：

```bash
# 创建项目目录并交给当前 SSH 用户管理
sudo mkdir -p /srv/personalink
sudo chown "$USER":"$USER" /srv/personalink

# 只克隆用于生产的 main 分支
git clone --branch main --single-branch https://github.com/Abner199/PersonaLink_MySQL_20260821.git /srv/personalink

cd /srv/personalink
git branch --show-current
git log -1 --oneline
git status --short
```

应看到当前分支为 `main`，`git status --short` 应没有输出。

正常情况下，`git clone` 不会出现用户名和密码提示。如果仍然出现 `Username for 'https://github.com'`，按 `Ctrl+C` 取消，不要输入 GitHub 密码。然后执行下面的匿名克隆命令，它会临时忽略服务器中可能残留的错误凭据：

```bash
# 上一次克隆失败可能留下空目录；rmdir 只删除空目录，不会删除已有文件
sudo rmdir /srv/personalink 2>/dev/null || true

# 禁用本次命令的凭据读取和交互提示，以匿名方式克隆公开仓库
GIT_TERMINAL_PROMPT=0 git -c credential.helper= clone --branch main --single-branch https://github.com/Abner199/PersonaLink_MySQL_20260821.git /srv/personalink
```

如果这条命令仍失败，错误原因通常是服务器无法访问 GitHub，而不是账号权限；可先运行 `curl -I https://github.com` 检查网络。

## 7. 创建 MySQL 数据库和应用账号

生成一条 48 位十六进制、只用于 MySQL 的随机密码，并保存在密码管理器中。十六进制密码不含引号等特殊字符，粘贴到 SQL 和 `.env` 时更不容易出错：

```bash
openssl rand -hex 24
```

进入 MySQL 管理终端：

```bash
sudo mysql
```

逐行执行下面 SQL。把 `替换为刚才生成的强密码` 换成真实密码，但保留单引号；密码中若含单引号，请重新生成一条：

```sql
CREATE DATABASE IF NOT EXISTS personalink
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE USER 'personalink'@'localhost'
  IDENTIFIED BY '替换为刚才生成的强密码';

GRANT SELECT, INSERT, UPDATE, DELETE
  ON personalink.* TO 'personalink'@'localhost';

FLUSH PRIVILEGES;
EXIT;
```

应用不能使用 MySQL `root`。数据库也不应监听公网。

## 8. 建表并配置后端

先由本机 MySQL 管理员加载表结构：

```bash
sudo mysql < /srv/personalink/backend/database/schema.sql

# 应列出 classes、users、synonym_groups、standard_hobbies
sudo mysql -e "SHOW TABLES FROM personalink;"
```

创建后端配置：

```bash
sudo nano /srv/personalink/backend/.env
```

填入以下内容，把数据库密码换成第 7 步的真实值：

```dotenv
NODE_ENV=production
PORT=3003
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=personalink
DB_USER=personalink
DB_PASSWORD=替换为数据库强密码
DB_CONNECTION_LIMIT=10
```

在 nano 中按 `Ctrl+O`、回车保存，再按 `Ctrl+X` 退出。限制文件权限：

```bash
sudo chown "$USER":www-data /srv/personalink/backend/.env
sudo chmod 640 /srv/personalink/backend/.env
```

安装后端依赖并确认应用账号能看到数据表：

```bash
cd /srv/personalink/backend
npm ci --omit=dev

# 使用与 .env 相同的连接方式测试应用账号；按提示输入数据库密码
mysql -h 127.0.0.1 -u personalink -p -e "SHOW TABLES FROM personalink;"
```

MySQL 会询问第 7 步的数据库密码。输出中应出现 `classes`、`users`、`synonym_groups` 和 `standard_hobbies`。

`npm ci --omit=dev` 输出 `added ... packages` 表示依赖安装完成。出现 `packages are looking for funding`、npm 新版本通知或依赖漏洞摘要，不代表安装失败。上线时不要直接运行 `npm audit fix --force`，它可能升级到不兼容版本；先用 `npm audit --omit=dev` 查看生产依赖报告，再在开发环境评估和测试升级。

## 9. 选择初始数据：演示站或真正空站点

这里必须二选一。“刚购买的新服务器”不等于“没有历史数据的全新站点”。如果希望部署后看到仓库原有的模拟班级和学生，执行 9.1；只有确定不需要任何演示数据时才执行 9.2。不要先创建空管理员再误以为演示数据会自动出现。

### 9.1 教学演示站：把模拟数据导入 MySQL

先只读核验仓库自带的 `backend/db.json`，该操作不会连接或修改 MySQL：

```bash
cd /srv/personalink/backend
npm run db:inspect-json
```

当前演示快照应显示 `classes: 3`、`users: 43`、`orphanUsers: 0`、`duplicateEmails: 0`、`passwordsPresent: true` 和 `valid: true`。确认无误后设置管理员新密码并导入：

```bash
read -rsp '请输入初始管理员密码（至少 8 位）: ' PERSONALINK_ADMIN_PASSWORD
echo
ADMIN_INITIAL_PASSWORD="$PERSONALINK_ADMIN_PASSWORD" npm run db:migrate-json
unset PERSONALINK_ADMIN_PASSWORD
npm run db:verify
```

`db:migrate-json` 会在一个事务中清空目标业务表，再把模拟班级、账号、资料、头像、同义词和标准爱好写入 MySQL。它不是把网站改回 JSON 存储；导入后网站仍然只使用 MySQL。校验结果应为 `classes: 3`、`users: 43`、`synonymGroups: 9`、`orphanUsers: 0`、`adminExists: true` 和 `adminPasswordHashed: true`。

### 9.2 真正空站点：只创建第一个管理员

仅当确定不需要演示班级和学生时执行。刚建完表时提前运行 `npm run db:verify`，会显示 `adminExists: false`、`adminPasswordHashed: false` 并以失败状态退出。这说明数据库连接和表结构正常，但初始化尚未完成，不需要重新建库。

```bash
cd /srv/personalink/backend
read -rsp '请输入初始管理员密码（至少 8 位）: ' PERSONALINK_ADMIN_PASSWORD
echo
ADMIN_EMAIL='admin@system.com' ADMIN_NAME='系统管理员' ADMIN_INITIAL_PASSWORD="$PERSONALINK_ADMIN_PASSWORD" npm run db:create-admin
unset PERSONALINK_ADMIN_PASSWORD
npm run db:verify
```

管理员邮箱必须使用 `admin@system.com`，当前校验脚本和部分后台保护逻辑依赖该固定邮箱。脚本发现同邮箱已存在时会停止，不会覆盖已有账号或密码。

校验成功时应满足：`users` 至少为 `1`、`orphanUsers` 为 `0`、`adminExists` 和 `adminPasswordHashed` 均为 `true`。全新站点的 `classes: 0` 和 `synonymGroups: 0` 是正常结果。首次登录后，应在“用户管理 → 修改管理员密码”设置长期强密码。

## 10. 构建 Vue 前端

```bash
cd /srv/personalink/frontend
npm ci
npm run build
test -f dist/index.html && echo '前端构建成功'
```

线上不运行 `npm run dev`。Nginx 直接读取 `frontend/dist`。

## 11. 用 systemd 常驻运行后端

创建服务文件：

```bash
sudo nano /etc/systemd/system/personalink.service
```

粘贴：

```ini
[Unit]
Description=PersonaLink Express API
After=network.target mysql.service
Requires=mysql.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/srv/personalink/backend
EnvironmentFile=/srv/personalink/backend/.env
ExecStart=/usr/bin/node /srv/personalink/backend/server.js
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true
ProtectHome=true
ProtectSystem=full

[Install]
WantedBy=multi-user.target
```

启动并设置开机启动：

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now personalink
sudo systemctl status personalink --no-pager
curl http://127.0.0.1:3003/health
```

正确结果包含 `"status":"ok"` 和 `"database":"mysql"`。

## 12. 配置 Nginx，通过公网 IP 访问

项目自带配置模板，复制并启用：

```bash
sudo cp /srv/personalink/nginx.conf /etc/nginx/sites-available/personalink
sudo ln -s /etc/nginx/sites-available/personalink /etc/nginx/sites-enabled/personalink
sudo unlink /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

如果 `ln` 提示文件已存在，说明此前启用过，跳过该命令即可。现在用自己电脑浏览器访问：

```text
http://你的公网IP
http://你的公网IP/health
```

第一个地址应显示登录页；第二个地址应返回 MySQL 健康状态。若服务器内能访问、外部不能访问，优先检查云平台安全组的 80 端口和 UFW。

## 13. 绑定域名并启用 HTTPS

先在域名服务商控制台添加：

```text
A    @      你的公网IP
A    www    你的公网IP（可选）
```

等待解析后，在自己电脑检查：

```powershell
nslookup 你的域名
```

解析 IP 正确后，编辑 Nginx：

```bash
sudo nano /etc/nginx/sites-available/personalink
```

把：

```nginx
server_name _;
```

改为：

```nginx
server_name 你的域名 www.你的域名;
```

然后：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

安装 Certbot 并自动配置证书：

```bash
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/local/bin/certbot
sudo certbot --nginx
sudo certbot renew --dry-run
```

根据提示选择域名并启用 HTTP 跳转 HTTPS。最终访问：

```text
https://你的域名
https://你的域名/health
```

只有公网 IP 时可先使用 HTTP；常规公开证书通常以域名验证为主。

## 14. 上线后的完整验收

逐项确认：

- [ ] `https://你的域名/health` 或 `http://公网IP/health` 返回 `status: ok`。
- [ ] 管理员能登录并修改自己的密码。
- [ ] 管理员能创建班级和普通用户。
- [ ] 普通用户能注册、登录、修改资料和头像。
- [ ] 管理员能查看每班学员姓名、复制名单、导出 CSV。
- [ ] 搜索、照片墙和同义词页面正常。
- [ ] 刷新 `/home`、`/classes` 等子页面不会出现 Nginx 404。
- [ ] 云安全组和 UFW 没有开放 3003、3306。

常用检查命令：

```bash
sudo systemctl status personalink nginx mysql --no-pager
sudo journalctl -u personalink -n 100 --no-pager
sudo nginx -t
cd /srv/personalink/backend && npm run db:verify
```

## 15. 日常更新代码

先备份数据库，再更新。不要在服务器直接修改项目代码，否则 `git pull` 容易冲突。以下第一条命令来自第 16 节；必须先配置并测试备份脚本。

```bash
# 1. 先生成一份数据库备份，成功后再继续
sudo /usr/local/sbin/backup-personalink

# 2. 确认工作区干净，然后从公开仓库只允许快进更新
cd /srv/personalink
git status --short

# 临时忽略可能残留的 GitHub 凭据，公开仓库可匿名拉取
GIT_TERMINAL_PROMPT=0 git -c credential.helper= pull --ff-only origin main

# 3. 更新后端依赖并检查数据库
cd backend
npm ci --omit=dev
npm run db:verify

# 4. 更新前端依赖并重新构建
cd ../frontend
npm ci
npm run build

# 5. 重启服务并完成健康检查
sudo systemctl restart personalink
sudo nginx -t
sudo systemctl reload nginx
curl http://127.0.0.1:3003/health
```

`git status` 必须干净再拉取。`.env` 被 Git 忽略，不会被 `git pull` 覆盖。

## 16. 每日 MySQL 备份

GitHub 中的模拟 JSON 只是固定的首次导入快照，不会随网站操作自动更新。线上新增或修改的用户、班级、资料和头像都只在 MySQL 中，因此仍然必须单独备份数据库。

Ubuntu 的 MySQL 本机管理员默认通过系统身份验证，所以可用 `sudo mysqldump` 备份，不需要把 root 密码写入脚本。先创建仅 root 可访问的目录并手工备份一次：

```bash
# 创建权限为 700 的备份目录
sudo install -d -m 700 /var/backups/personalink

# pipefail 保证 mysqldump 或 gzip 任一失败时整条命令失败
sudo bash -c 'set -o pipefail; umask 077; mysqldump --single-transaction --routines --triggers --hex-blob --no-tablespaces --default-character-set=utf8mb4 personalink | gzip > "/var/backups/personalink/personalink-$(date +%F-%H%M%S).sql.gz"'

# 确认文件存在且不是 0 字节，并计算完整性校验值
sudo ls -lh /var/backups/personalink
sudo sha256sum /var/backups/personalink/*.sql.gz
```

`--single-transaction` 可在 InnoDB 表继续提供服务时获得一致备份；`--no-tablespaces` 避免不同 MySQL 权限配置导致备份失败。备份成功后，至少再复制一份到另一台机器或对象存储。不要提交 SQL 到 GitHub。

接着创建自动备份脚本：

```bash
sudo nano /usr/local/sbin/backup-personalink
```

粘贴以下内容：

```bash
#!/usr/bin/env bash
set -Eeuo pipefail

BACKUP_DIR=/var/backups/personalink
install -d -m 700 "$BACKUP_DIR"

mysqldump --single-transaction --routines --triggers --hex-blob --no-tablespaces --default-character-set=utf8mb4 personalink | gzip > "$BACKUP_DIR/personalink-$(date +%F-%H%M%S).sql.gz"

# 删除服务器本地超过 30 天的自动备份
find "$BACKUP_DIR" -type f -name 'personalink-*.sql.gz' -mtime +30 -delete
```

保存后设置权限并手工测试：

```bash
# 只有 root 可以读写和执行脚本
sudo chmod 700 /usr/local/sbin/backup-personalink

# 必须先手工执行成功，再配置定时任务
sudo /usr/local/sbin/backup-personalink
sudo ls -lh /var/backups/personalink
```

最后使用 root 定时任务每天 03:30 备份：

```bash
sudo crontab -e
```

第一次打开会要求选择编辑器，可以选 nano。在文件末尾加入：

```cron
# 每天凌晨 03:30 备份；错误和输出写入系统日志
30 3 * * * /usr/local/sbin/backup-personalink 2>&1 | logger -t personalink-backup
```

以后可用下面的命令查看最近 7 天的备份任务日志：

```bash
sudo journalctl -t personalink-backup --since '7 days ago' --no-pager
```

备份文件存在不等于一定能恢复。建议每月选择一份备份恢复到测试库，核对用户数、班级数和管理员登录。

## 17. 服务器迁移前的核心原则

“零丢数据”不是只做一次备份，而是保证最终备份以后旧站不再产生新写入。最适合小项目的是短暂停止写入：

1. 新服务器提前装好环境，部署与旧服务器完全相同的 Git commit。
2. 用最近备份在新服务器做一次恢复演练。
3. 正式切换时停止旧后端，阻止注册、改资料和管理员操作。
4. 立即生成最终备份并记录 SHA-256。
5. 恢复新库、核对数据、启动新后端。
6. 验收通过后切 DNS；旧站保持停止状态，保留至少 14 天。

绝对不要让旧、新两套网站同时写各自数据库，否则数据会分叉，之后无法简单合并。

## 18. 进阶：完整迁移到另一台 Ubuntu 24.04 服务器

### 18.1 提前一天

- 将 DNS TTL 调低，例如 300 秒。
- 按第 3～13 节准备新服务器，但先不要切域名。
- 在新服务器记录代码版本：

```bash
cd /srv/personalink
git rev-parse HEAD
```

- 在旧服务器执行相同命令，两个 commit 必须一致。
- 用旧备份进行一次预恢复和功能验收。

### 18.2 正式切换：停止旧站写入

在旧服务器执行：

```bash
sudo systemctl stop personalink
sudo systemctl is-active personalink
```

结果应为 `inactive`。此刻开始不要重新启动旧后端。

### 18.3 生成最终备份

仍在旧服务器：

```bash
# 使用 pipefail，避免数据库导出失败后仍留下看似正常的 gzip 文件
sudo bash -c 'set -o pipefail; umask 077; mysqldump --single-transaction --routines --triggers --hex-blob --no-tablespaces --default-character-set=utf8mb4 personalink | gzip > /var/backups/personalink/FINAL-personalink.sql.gz'

sudo sha256sum /var/backups/personalink/FINAL-personalink.sql.gz
```

保存输出的 SHA-256，并记录旧库校验：

```bash
cd /srv/personalink/backend
npm run db:verify
```

### 18.4 把备份复制到新服务器

最容易理解的方式是在自己的电脑中转。Windows PowerShell：

```powershell
scp ubuntu@旧服务器IP:/var/backups/personalink/FINAL-personalink.sql.gz .
scp .\FINAL-personalink.sql.gz ubuntu@新服务器IP:/tmp/
```

在新服务器校验 SHA-256：

```bash
sha256sum /tmp/FINAL-personalink.sql.gz
```

必须与旧服务器完全一致，不一致就重新传输。

### 18.5 恢复到新数据库

先停止新后端：

```bash
sudo systemctl stop personalink
```

下面会删除并重建新服务器的 `personalink` 数据库。只有确认当前登录的是新服务器、备份校验值正确后才能执行：

```bash
# 删除新服务器上的现有测试数据并重建空库；数据库账号授权仍会保留
sudo mysql -e "DROP DATABASE IF EXISTS personalink; CREATE DATABASE personalink CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;"

# 解压和导入任一步骤失败时都返回错误
set -o pipefail
gunzip -c /tmp/FINAL-personalink.sql.gz | sudo mysql personalink
```

启动并校验：

```bash
sudo systemctl start personalink
cd /srv/personalink/backend
npm run db:verify
curl http://127.0.0.1:3003/health
```

将新库的班级数、用户数、同义词数与第 18.3 节旧库输出逐项比较。再通过新服务器 IP 临时验收登录、头像、名单、CSV、照片墙和搜索。

### 18.6 切换域名

在域名控制台把 A 记录从旧 IP 改为新 IP。等待解析时可在自己电脑检查：

```powershell
nslookup 你的域名
```

解析到新 IP 后访问 HTTPS 并完成第 14 节清单。旧服务器保持后端停止，不要马上销毁。

### 18.7 迁移失败时回滚

1. 先停止新服务器后端，防止继续产生新数据。
2. 将 DNS 改回旧服务器 IP。
3. 确认访问已回到旧服务器后，再启动旧后端。
4. 分析新服务器日志，修复后重新安排迁移窗口。

回滚过程中同样只能有一个数据库接受写入。

## 19. 已上线空站补导演示数据，或导入其他 JSON

如果已经按空站点完成部署，后来才发现需要仓库中的模拟班级和学生，可按本节补导。导入会替换当前 MySQL 业务表，所以先停后端并备份当前数据库：

```bash
sudo systemctl stop personalink
sudo install -d -m 700 /var/backups/personalink
sudo bash -c 'set -o pipefail; umask 077; mysqldump --single-transaction --routines --triggers --hex-blob --no-tablespaces --default-character-set=utf8mb4 personalink | gzip > "/var/backups/personalink/before-demo-import-$(date +%F-%H%M%S).sql.gz"'
cd /srv/personalink
GIT_TERMINAL_PROMPT=0 git -c credential.helper= pull --ff-only origin main
cd /srv/personalink/backend
npm ci --omit=dev
npm run db:inspect-json
read -rsp '请为演示管理员设置新密码（至少 8 位）: ' PERSONALINK_ADMIN_PASSWORD
echo
ADMIN_INITIAL_PASSWORD="$PERSONALINK_ADMIN_PASSWORD" npm run db:migrate-json
unset PERSONALINK_ADMIN_PASSWORD
npm run db:verify
sudo systemctl start personalink
curl -fsS http://127.0.0.1:3003/health && echo
```

核对 `classes: 3`、`users: 43` 和健康检查成功后，再刷新网页。无需重新构建前端，因为班级和学生来自 MySQL API，不在前端构建文件中。

如果导入的是仓库以外的其他 JSON，先使用 SCP 单独传到服务器。下面命令在自己的 Windows PowerShell 执行：

```powershell
scp .\backend\db.json ubuntu@服务器IP:/tmp/personalink-db.json
```

然后在服务器先核验、再导入；同样必须事先停服和备份：

```bash
cd /srv/personalink/backend
JSON_SOURCE=/tmp/personalink-db.json npm run db:inspect-json
read -rsp '请为管理员设置新密码（至少 8 位）: ' PERSONALINK_ADMIN_PASSWORD
echo
JSON_SOURCE=/tmp/personalink-db.json ADMIN_INITIAL_PASSWORD="$PERSONALINK_ADMIN_PASSWORD" npm run db:migrate-json
unset PERSONALINK_ADMIN_PASSWORD
npm run db:verify
sudo rm /tmp/personalink-db.json
```

导入后登录管理员、修改密码，并核对班级人数和头像。仓库自带的 `backend/db.json` 只能保存明确确认过的模拟数据；真实用户快照、`.env` 和 SQL 备份不得提交 GitHub。

## 20. 常见故障

### Git clone 要求用户名、密码，或者返回 403

当前仓库是公开仓库，部署时不需要登录 GitHub。看到用户名提示时按 `Ctrl+C` 取消，然后执行：

```bash
# 如果失败操作留下的是空目录，先安全移除空目录
sudo rmdir /srv/personalink 2>/dev/null || true

# 忽略错误缓存凭据，以匿名方式重新克隆
GIT_TERMINAL_PROMPT=0 git -c credential.helper= clone --branch main --single-branch https://github.com/Abner199/PersonaLink_MySQL_20260821.git /srv/personalink
```

不要在服务器中填写 GitHub 登录密码，也不要把 Token 拼进仓库 URL。

### 浏览器显示 502 Bad Gateway

```bash
sudo systemctl status personalink --no-pager
sudo journalctl -u personalink -n 100 --no-pager
curl http://127.0.0.1:3003/health
```

常见原因是 `.env` 密码错误、MySQL 未启动或后端启动失败。

### 页面能开，但刷新子页面变成 404

确认 Nginx 的 `location /` 中有：

```nginx
try_files $uri $uri/ /index.html;
```

### API 请求失败

确认 `location ^~ /api/` 的 `proxy_pass` 是 `http://127.0.0.1:3003`，末尾没有多余路径；再执行 `sudo nginx -t`。

### MySQL 提示 Access denied

检查 `.env` 的数据库用户名和密码，并在 MySQL 中确认账号为 `'personalink'@'localhost'`。不要为解决问题把 3306 开到公网。

### 部署成功但班级和学生都是空的

前端不内置班级和学生，它只显示 MySQL API 返回的数据。先执行 `cd /srv/personalink/backend && npm run db:verify`；如果只有一个管理员且 `classes` 为 `0`，说明此前选择了真正空站点。需要演示数据时按第 19 节停服、备份并补导，不需要修改或重新构建前端。

### Git pull 提示本地文件冲突

先执行 `git status`。服务器上不应直接改源代码；`.env` 不受 Git 管理。不要在不理解后果时使用 `git reset --hard`。

## 21. 官方资料

- [Ubuntu：安装与配置 MySQL](https://ubuntu.com/server/docs/install-and-configure-a-mysql-server)
- [Ubuntu：UFW 防火墙](https://ubuntu.com/server/docs/security-firewall/)
- [NodeSource：Ubuntu 安装 Node.js](https://github.com/nodesource/distributions)
- [Nginx：反向代理模块](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)
- [Certbot：Nginx HTTPS 安装说明](https://certbot.eff.org/instructions?ws=nginx&os=snap)
- [GitHub：通过 SSH 连接 GitHub](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)
