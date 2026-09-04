#!/usr/bin/env bash
set -Eeuo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/personalink}"
PROJECT_DIR="${PROJECT_DIR:-/srv/personalink}"
DB_NAME="${DB_NAME:-personalink}"
BACKUP_LABEL="${BACKUP_LABEL:-personalink}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

if [[ ! "$DB_NAME" =~ ^[A-Za-z0-9_]+$ ]]; then
  echo "DB_NAME 只能包含字母、数字和下划线。" >&2
  exit 1
fi
if [[ ! "$BACKUP_LABEL" =~ ^[A-Za-z0-9_-]+$ ]]; then
  echo "BACKUP_LABEL 只能包含字母、数字、下划线和连字符。" >&2
  exit 1
fi
if [[ ! "$RETENTION_DAYS" =~ ^[0-9]+$ ]]; then
  echo "RETENTION_DAYS 必须是非负整数。" >&2
  exit 1
fi

install -d -m 700 "$BACKUP_DIR"
timestamp="$(date +%F-%H%M%S)"
base_name="$BACKUP_LABEL-$timestamp.sql.gz"
archive="$BACKUP_DIR/$base_name"
temporary="$BACKUP_DIR/.$base_name.tmp"
checksum="$archive.sha256"
commit_file="$archive.git-commit"
inventory_file="$archive.inventory.json"

cleanup() {
  rm -f -- "$temporary" "$commit_file.tmp" "$inventory_file.tmp"
}
trap cleanup EXIT

umask 077
mysqldump --single-transaction --quick --routines --triggers --events --hex-blob --no-tablespaces --default-character-set=utf8mb4 "$DB_NAME" | gzip -9 > "$temporary"
test -s "$temporary"
gzip -t "$temporary"
mv -- "$temporary" "$archive"

if git -c safe.directory="$PROJECT_DIR" -C "$PROJECT_DIR" rev-parse HEAD > "$commit_file.tmp" 2>/dev/null; then
  mv -- "$commit_file.tmp" "$commit_file"
else
  rm -f -- "$commit_file.tmp"
  printf '%s\n' 'unknown' > "$commit_file"
fi

if (cd "$PROJECT_DIR/backend" && node scripts/verify-mysql.js) > "$inventory_file.tmp"; then
  mv -- "$inventory_file.tmp" "$inventory_file"
else
  if [[ -s "$inventory_file.tmp" ]]; then
    mv -- "$inventory_file.tmp" "$inventory_file"
  else
    printf '%s\n' '{"verification":"unavailable"}' > "$inventory_file"
    rm -f -- "$inventory_file.tmp"
  fi
  echo "警告：数据库清单校验未通过；备份仍已保留，请检查 $inventory_file。" >&2
fi

(
  cd "$BACKUP_DIR"
  sha256sum "$base_name" "$base_name.git-commit" "$base_name.inventory.json" > "$base_name.sha256"
)

find "$BACKUP_DIR" -type f -name 'personalink-*.sql.gz' -mtime "+$RETENTION_DAYS" -delete
find "$BACKUP_DIR" -type f -name 'personalink-*.sql.gz.sha256' -mtime "+$RETENTION_DAYS" -delete
find "$BACKUP_DIR" -type f -name 'personalink-*.sql.gz.git-commit' -mtime "+$RETENTION_DAYS" -delete
find "$BACKUP_DIR" -type f -name 'personalink-*.sql.gz.inventory.json' -mtime "+$RETENTION_DAYS" -delete

echo "备份完成：$archive"
echo "校验文件：$checksum"
echo "代码版本：$commit_file"
echo "数据清单：$inventory_file"
echo "请把这四个文件复制到另一台机器或对象存储。"
