param(
  [Parameter(Mandatory = $true)][string]$BackupFile,
  [string]$DbHost = $env:DB_HOST,
  [int]$DbPort = $(if ($env:DB_PORT) { [int]$env:DB_PORT } else { 3306 }),
  [string]$DbUser = $env:DB_USER,
  [string]$DbName = $env:DB_NAME
)

$ErrorActionPreference = 'Stop'
$resolvedBackup = (Resolve-Path -LiteralPath $BackupFile).Path
if (-not $DbHost -or -not $DbUser -or -not $DbName) {
  throw 'Set DB_HOST, DB_USER and DB_NAME first, or pass script parameters.'
}
if (-not (Get-Command mysql -ErrorAction SilentlyContinue)) {
  throw 'mysql was not found. Install MySQL Client and add its bin directory to PATH.'
}

Write-Host "Backup file: $resolvedBackup"
Write-Host "Target database: $DbHost`:$DbPort/$DbName"
$confirmation = Read-Host 'This writes to the target database. Verify it is the NEW server, then type RESTORE'
if ($confirmation -cne 'RESTORE') { throw 'Cancelled. The database was not changed.' }

Write-Host 'MySQL will now ask for the password.'
$mysqlSourcePath = $resolvedBackup.Replace('\', '/')
& mysql --host=$DbHost --port=$DbPort --user=$DbUser --password --default-character-set=utf8mb4 $DbName --execute="source $mysqlSourcePath"
if ($LASTEXITCODE -ne 0) { throw 'mysql restore failed.' }
Write-Host 'Restore finished. Run npm run db:verify inside backend, then complete the UI checklist.'
