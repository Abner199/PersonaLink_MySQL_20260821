#!/usr/bin/env bash
set -Eeuo pipefail

# 使用方式：sudo /usr/local/sbin/check-personalink http://peaceinside.fun
# 该脚本只读取服务、接口和 MySQL 清单，不修改代码、配置或数据。

PROJECT_DIR="${PROJECT_DIR:-/srv/personalink}"
PUBLIC_URL="${1:-}"

fail() {
  echo "巡检失败：$1" >&2
  exit 1
}

[[ "$(id -u)" -eq 0 ]] || fail "请使用 sudo 执行。"
[[ -d "$PROJECT_DIR/backend" ]] || fail "后端目录不存在：$PROJECT_DIR/backend"

echo "[1/6] 检查服务状态。"
for service in personalink nginx mysql; do
  systemctl is-active --quiet "$service" || fail "$service 未运行，请执行 systemctl status $service --no-pager -l。"
  echo "$service: active"
done

echo "[2/6] 检查 Nginx 配置。"
nginx -t

echo "[3/6] 检查本机健康接口与运行版本。"
health_json="$(curl -fsS --max-time 10 http://127.0.0.1:3003/health)" || fail "本机健康接口失败。"
version_json="$(curl -fsS --max-time 10 http://127.0.0.1:3003/api/version)" || fail "本机版本接口失败。"
expected_version="$(tr -d '\r\n' < "$PROJECT_DIR/VERSION")"
node -e "const value=JSON.parse(process.argv[1]);if(value.version!==process.argv[2])process.exit(1)" "$version_json" "$expected_version" || fail "运行版本与项目 VERSION 不一致。"
echo "$health_json"
echo "$version_json"

echo "[4/6] 只读核对 MySQL 数据清单。"
(cd "$PROJECT_DIR/backend" && npm run db:verify --silent) || fail "MySQL 数据清单核验失败。"

echo "[5/6] 测量本机照片墙接口。"
curl -fsS --max-time 30 -o /dev/null -w 'local_photowall_http=%{http_code} bytes=%{size_download} seconds=%{time_total}\n' http://127.0.0.1:3003/api/photowall || fail "本机照片墙接口失败。"

echo "[6/6] 检查公网接口。"
if [[ -n "$PUBLIC_URL" ]]; then
  base_url="${PUBLIC_URL%/}"
  curl -fsS --max-time 15 "$base_url/health"
  echo
  curl -fsS --max-time 15 "$base_url/api/version"
  echo
  curl -fsS --max-time 30 -o /dev/null -w 'public_photowall_http=%{http_code} bytes=%{size_download} seconds=%{time_total}\n' "$base_url/api/photowall" || fail "公网照片墙接口失败。"
else
  echo "未提供公网地址，已跳过。示例：http://peaceinside.fun"
fi

echo "生产巡检通过：所有检查均为只读，MySQL 数据未被修改。"
