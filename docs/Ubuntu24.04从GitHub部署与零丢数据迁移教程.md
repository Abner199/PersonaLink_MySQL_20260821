# 零基础：Ubuntu 24.04 LTS 从 GitHub 部署 PersonaLink，并安全迁移服务器

> 适用项目：`https://github.com/Abner199/PersonaLink_MySQL_20260821`  
> 适用系统：Ubuntu Server 24.04 LTS（Noble Numbat）  
> 部署方式：Nginx + Node.js 22 + Express + MySQL，先用公网 IP 验证，再选配域名和 HTTPS

这是一份可以从头照着执行的主教程。命令中的 `你的公网IP`、`你的域名` 和密码都必须替换，尖括号不要原样输入。

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

GitHub 只保存代码，不保存服务器上的 `.env` 和实时 MySQL 数据。换服务器时必须同时迁移“同一个 Git 版本”和“最终 MySQL 备份”。当前用户上传头像在 MySQL `users.avatar` 中，会随 SQL 备份迁移；默认图片在代码的 `frontend/public/images` 中。

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
sudo apt install -y git curl ca-certificates nginx mysql-server
```

先允许 SSH，再启用 UFW，顺序不要反：

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
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
curl -fsSL https://deb.nodesource.com/setup_22.x -o /tmp/nodesource_setup.sh
less /tmp/nodesource_setup.sh
sudo -E bash /tmp/nodesource_setup.sh
sudo apt install -y nodejs
node -v
npm -v
```

按 `q` 可退出 `less`。`node -v` 应为 `v22.x`；不要继续使用低于项目要求的版本。

## 6. 从 GitHub 下载项目

```bash
sudo mkdir -p /srv/personalink
sudo chown "$USER":"$USER" /srv/personalink
git clone https://github.com/Abner199/PersonaLink_MySQL_20260821.git /srv/personalink
cd /srv/personalink
git status
```

公开仓库克隆不需要 GitHub 密码。若以后仓库改为私有，推荐在服务器配置只读 Deploy Key；不要把个人访问令牌写进脚本或仓库。

## 7. 创建 MySQL 数据库和应用账号

生成一条至少 24 位、只用于 MySQL 的随机密码并临时记在安全位置：

```bash
openssl rand -base64 24
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
mysql -h 127.0.0.1 -u personalink -p -e "SHOW TABLES FROM personalink;"
```

MySQL 会询问第 7 步的数据库密码。输出中应出现 `classes`、`users`、`synonym_groups` 和 `standard_hobbies`。

## 9. 全新项目创建第一个管理员

仅当这是全新空库时执行。密码采用隐藏输入，不会显示在屏幕上：

```bash
cd /srv/personalink/backend
read -s -p '请输入初始管理员密码（至少8位）: ' ADMIN_INITIAL_PASSWORD
echo
export ADMIN_INITIAL_PASSWORD
export ADMIN_EMAIL='admin@system.com'
export ADMIN_NAME='系统管理员'
npm run db:create-admin
unset ADMIN_INITIAL_PASSWORD ADMIN_EMAIL ADMIN_NAME
npm run db:verify
```

脚本发现同邮箱已存在时会停止，不会覆盖已有账号或密码。首次登录后，应在“用户管理 → 修改管理员密码”再次设置长期密码。

如果是从旧版 `db.json` 迁移，不执行本节，改看第 19 节。

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

先备份数据库，再更新。不要在服务器直接修改项目代码，否则 `git pull` 容易冲突。

```bash
cd /srv/personalink
git status
git pull --ff-only origin main

cd backend
npm ci --omit=dev
npm run db:verify

cd ../frontend
npm ci
npm run build

sudo systemctl restart personalink
sudo nginx -t
sudo systemctl reload nginx
curl http://127.0.0.1:3003/health
```

`git status` 必须干净再拉取。`.env` 被 Git 忽略，不会被 `git pull` 覆盖。

## 16. 每日 MySQL 备份

先建立只有 root 能读的客户端配置，避免密码出现在命令历史：

```bash
sudo nano /root/.my.cnf
```

内容：

```ini
[client]
host=127.0.0.1
port=3306
user=personalink
password=替换为数据库强密码
```

设置权限并测试备份：

```bash
sudo chmod 600 /root/.my.cnf
sudo mkdir -p /var/backups/personalink
sudo mysqldump --defaults-extra-file=/root/.my.cnf \
  --single-transaction --routines --triggers --hex-blob \
  --default-character-set=utf8mb4 personalink \
  | gzip > /var/backups/personalink/personalink-$(date +%F-%H%M%S).sql.gz
sudo sha256sum /var/backups/personalink/*.sql.gz
```

备份成功不等于安全：至少再复制一份到另一台机器或对象存储。不要提交 SQL 到 GitHub。每月选择一份备份恢复到测试库，确认真的可用。

可用 root 的定时任务每天 03:30 备份：

```bash
sudo crontab -e
```

加入一行：

```cron
30 3 * * * /usr/bin/mysqldump --defaults-extra-file=/root/.my.cnf --single-transaction --routines --triggers --hex-blob --default-character-set=utf8mb4 personalink | /usr/bin/gzip > /var/backups/personalink/personalink-$(date +\%F-\%H\%M\%S).sql.gz
```

cron 中 `%` 必须写成 `\%`。先手工执行成功，再添加定时任务。

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
sudo mysqldump --defaults-extra-file=/root/.my.cnf \
  --single-transaction --routines --triggers --hex-blob \
  --default-character-set=utf8mb4 personalink \
  | gzip > /var/backups/personalink/FINAL-personalink.sql.gz
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

下面会覆盖新服务器 `personalink` 库中的同名表。确认这是新服务器且备份校验正确后执行：

```bash
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

## 19. 从旧版 `db.json` 首次迁入 MySQL

`backend/db.json` 含用户资料，不进入 GitHub。先使用 SCP 单独传到新服务器：

```powershell
scp .\backend\db.json ubuntu@服务器IP:/tmp/personalink-db.json
```

在服务器导入前，确认目标是新库或测试库。该命令会清空目标库的业务表再导入，禁止对正在使用的生产库随意执行：

```bash
cd /srv/personalink/backend
read -s -p '请输入旧管理员的初始密码: ' ADMIN_INITIAL_PASSWORD
echo
export ADMIN_INITIAL_PASSWORD
JSON_SOURCE=/tmp/personalink-db.json npm run db:migrate-json
unset ADMIN_INITIAL_PASSWORD
npm run db:verify
rm /tmp/personalink-db.json
```

导入后登录管理员、修改密码，并核对班级人数和头像。

## 20. 常见故障

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

### Git pull 提示本地文件冲突

先执行 `git status`。服务器上不应直接改源代码；`.env` 不受 Git 管理。不要在不理解后果时使用 `git reset --hard`。

## 21. 官方资料

- [Ubuntu：安装与配置 MySQL](https://ubuntu.com/server/docs/install-and-configure-a-mysql-server)
- [Ubuntu：UFW 防火墙](https://ubuntu.com/server/docs/security-firewall/)
- [NodeSource：Ubuntu 安装 Node.js](https://github.com/nodesource/distributions)
- [Nginx：反向代理模块](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)
- [Certbot：Nginx HTTPS 安装说明](https://certbot.eff.org/instructions?ws=nginx&os=snap)
- [GitHub：通过 SSH 连接 GitHub](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)
