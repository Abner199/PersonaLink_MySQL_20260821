param(
  [string]$DbHost = $env:DB_HOST,
  [int]$DbPort = $(if ($env:DB_PORT) { [int]$env:DB_PORT } else { 3306 }),
  [string]$DbUser = $env:DB_USER,
  [string]$DbName = $env:DB_NAME,
  [string]$OutputDirectory = ".\backups"
)

$ErrorActionPreference = 'Stop'
if (-not $DbHost -or -not $DbUser -or -not $DbName) {
  throw 'Set DB_HOST, DB_USER and DB_NAME first, or pass script parameters.'
}
if (-not (Get-Command mysqldump -ErrorAction SilentlyContinue)) {
  throw 'mysqldump was not found. Install MySQL Client and add its bin directory to PATH.'
}

$resolvedOutput = if ([System.IO.Path]::IsPathRooted($OutputDirectory)) {
  [System.IO.Path]::GetFullPath($OutputDirectory)
} else {
  [System.IO.Path]::GetFullPath((Join-Path (Get-Location).Path $OutputDirectory))
}
New-Item -ItemType Directory -Path $resolvedOutput -Force | Out-Null
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupFile = Join-Path $resolvedOutput "$DbName-$timestamp.sql"

Write-Host "Backing up $DbHost`:$DbPort/$DbName"
Write-Host 'MySQL will ask for the password. No characters are shown while you type.'
& mysqldump --host=$DbHost --port=$DbPort --user=$DbUser --password --single-transaction --routines --triggers --default-character-set=utf8mb4 --result-file=$backupFile $DbName
if ($LASTEXITCODE -ne 0) { throw 'mysqldump failed.' }

$hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $backupFile).Hash
$size = (Get-Item -LiteralPath $backupFile).Length
Write-Host "Backup created: $backupFile"
Write-Host "Size: $size bytes"
Write-Host "SHA256: $hash"
Write-Host 'Copy both the SQL file and SHA256 to another machine or object storage.'
