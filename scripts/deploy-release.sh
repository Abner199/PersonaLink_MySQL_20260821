#!/usr/bin/env bash
set -Eeuo pipefail

# 使用方式：sudo /usr/local/sbin/deploy-personalink-release v1.0.3
# 脚本只更新代码和依赖，不执行建表、模拟数据导入或任何删表操作。

RELEASE_TAG="${1:-}"
PROJECT_DIR="${PROJECT_DIR:-/srv/personalink}"
BACKUP_COMMAND="${BACKUP_COMMAND:-/usr/local/sbin/backup-personalink}"

fail() {
  echo "发布失败：$1" >&2
  exit 1
}

[[ "$(id -u)" -eq 0 ]] || fail "请使用 sudo 执行。"
[[ "$RELEASE_TAG" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]] || fail "版本必须形如 v1.0.3。"
[[ -d "$PROJECT_DIR/.git" ]] || fail "项目目录不是 Git 仓库：$PROJECT_DIR"
[[ -x "$BACKUP_COMMAND" ]] || fail "备份命令不存在或不可执行：$BACKUP_COMMAND"

git_safe=(git -c "safe.directory=$PROJECT_DIR" -C "$PROJECT_DIR")
[[ -z "$("${git_safe[@]}" status --porcelain)" ]] || fail "Git 工作区存在未提交文件，请先处理。"

temporary_dir="$(mktemp -d)"
before_inventory="$temporary_dir/before.json"
after_inventory="$temporary_dir/after.json"
cleanup() {
  rm -rf -- "$temporary_dir"
}
trap cleanup EXIT

echo "[1/9] 记录升级前数据库清单。"
(cd "$PROJECT_DIR/backend" && npm run db:verify --silent) > "$before_inventory"

echo "[2/9] 创建 MySQL 四件套备份。"
"$BACKUP_COMMAND"

echo "[3/9] 获取远程标签并验证目标版本。"
"${git_safe[@]}" fetch --tags --prune origin
"${git_safe[@]}" rev-parse --verify "$RELEASE_TAG^{commit}" > /dev/null

echo "[4/9] 切换到固定发布标签。"
"${git_safe[@]}" switch --detach "$RELEASE_TAG"
release_version="${RELEASE_TAG#v}"
node -e "const fs=require('fs');const path=process.argv[1];const expected=process.argv[2];const read=(file)=>JSON.parse(fs.readFileSync(path+'/'+file,'utf8'));const values=[fs.readFileSync(path+'/VERSION','utf8').trim(),read('backend/package.json').version,read('backend/package-lock.json').version,read('backend/package-lock.json').packages[''].version,read('frontend/package.json').version,read('frontend/package-lock.json').version,read('frontend/package-lock.json').packages[''].version];if(values.some(value=>value!==expected)){console.error(values);process.exit(1)}" "$PROJECT_DIR" "$release_version" || fail "目标标签内部版本号不一致。"

echo "[5/9] 按锁文件安装后端生产依赖。"
(cd "$PROJECT_DIR/backend" && npm ci --omit=dev)

echo "[6/9] 按锁文件安装前端依赖并构建。"
(cd "$PROJECT_DIR/frontend" && npm ci && npm run build)

echo "[7/9] 核对升级前后数据库清单。"
(cd "$PROJECT_DIR/backend" && npm run db:verify --silent) > "$after_inventory"
node -e "const fs=require('fs');const before=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));const after=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));const fields=['database','classes','users','students','synonymGroups','standardHobbies','studentsWithStoredAvatar','storedStudentAvatarBytes','orphanUsers','adminExists','adminPasswordHashed'];const changes=fields.filter(field=>before[field]!==after[field]);if(changes.length){for(const field of changes)console.error(field+': 升级前='+before[field]+'，升级后='+after[field]);process.exit(1)}" "$before_inventory" "$after_inventory" || fail "数据库清单发生变化，请先核对数据和备份。"

echo "[8/9] 更新运维文件，检查 Nginx 后重启服务。"
install -m 700 "$PROJECT_DIR/scripts/backup-personalink.sh" /usr/local/sbin/backup-personalink
install -m 644 "$PROJECT_DIR/deploy/personalink.service" /etc/systemd/system/personalink.service
if [[ -f "$PROJECT_DIR/scripts/deploy-release.sh" ]]; then install -m 700 "$PROJECT_DIR/scripts/deploy-release.sh" /usr/local/sbin/deploy-personalink-release; fi
# 保留此安装以兼容已部署的 v1.0.2 脚本；v1.0.3 起源文件仅含注释，可覆盖并停用旧的重复 gzip 声明。
if [[ -f "$PROJECT_DIR/deploy/personalink-gzip.conf" ]]; then install -m 644 "$PROJECT_DIR/deploy/personalink-gzip.conf" /etc/nginx/conf.d/personalink-gzip.conf; fi
systemctl daemon-reload
nginx -t
systemctl restart personalink
systemctl reload nginx

echo "[9/9] 等待后端启动并核对实际版本。"
for attempt in {1..15}; do
  if health_json="$(curl -fsS http://127.0.0.1:3003/health 2>/dev/null)"; then break; fi
  sleep 2
done
[[ -n "${health_json:-}" ]] || fail "30 秒内健康检查未通过，请运行 journalctl -u personalink -n 100 --no-pager。"
version_json="$(curl -fsS http://127.0.0.1:3003/api/version)"
node -e "const value=JSON.parse(process.argv[1]);if(value.release!==process.argv[2])process.exit(1)" "$version_json" "$RELEASE_TAG" || fail "运行版本与目标标签不一致。"

echo "$health_json"
echo "$version_json"
echo "发布成功：$RELEASE_TAG；MySQL 数据清单保持一致。"
