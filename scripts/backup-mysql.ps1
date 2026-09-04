param(
  [string]$DbHost = $env:DB_HOST,
  [int]$DbPort = $(if ($env:DB_PORT) { [int]$env:DB_PORT } else { 3306 }),
  [string]$DbUser = $env:DB_USER,
  [string]$DbName = $env:DB_NAME,
  [string]$OutputDirectory = ".\backups",
  [string]$ProjectDirectory = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
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
$temporaryFile = "$backupFile.tmp"
$checksumFile = "$backupFile.sha256"
$commitFile = "$backupFile.git-commit"

Write-Host "Backing up $DbHost`:$DbPort/$DbName"
Write-Host 'MySQL will ask for the password. No characters are shown while you type.'
try {
  & mysqldump --host=$DbHost --port=$DbPort --user=$DbUser --password --single-transaction --quick --routines --triggers --events --hex-blob --no-tablespaces --default-character-set=utf8mb4 --result-file=$temporaryFile $DbName
  if ($LASTEXITCODE -ne 0) { throw 'mysqldump failed.' }
  if (-not (Test-Path -LiteralPath $temporaryFile) -or (Get-Item -LiteralPath $temporaryFile).Length -eq 0) { throw 'mysqldump created an empty file.' }
  Move-Item -LiteralPath $temporaryFile -Destination $backupFile
} finally {
  if (Test-Path -LiteralPath $temporaryFile) { Remove-Item -LiteralPath $temporaryFile -Force }
}

$hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $backupFile).Hash
$size = (Get-Item -LiteralPath $backupFile).Length
$hashLine = "$($hash.ToLowerInvariant())  $([System.IO.Path]::GetFileName($backupFile))"
Set-Content -LiteralPath $checksumFile -Value $hashLine -Encoding ascii
$gitCommit = if (Get-Command git -ErrorAction SilentlyContinue) { (& git -C $ProjectDirectory rev-parse HEAD 2>$null) } else { $null }
if (-not $gitCommit) { $gitCommit = 'unknown' }
Set-Content -LiteralPath $commitFile -Value $gitCommit -Encoding ascii
Write-Host "Backup created: $backupFile"
Write-Host "Size: $size bytes"
Write-Host "SHA256: $hash"
Write-Host "Checksum file: $checksumFile"
Write-Host "Git commit file: $commitFile"
Write-Host 'Copy the SQL, SHA256 and Git commit files to another machine or object storage.'
