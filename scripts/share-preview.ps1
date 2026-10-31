# Shares this PC's copy of KAZI through a free Cloudflare quick tunnel and prints the public link.
# Starts (if needed) the local database and the production app, then opens a new tunnel.
#   powershell -ExecutionPolicy Bypass -File scripts\share-preview.ps1            # reuse the last build
#   powershell -ExecutionPolicy Bypass -File scripts\share-preview.ps1 -Rebuild   # after code changes
#   powershell -ExecutionPolicy Bypass -File scripts\share-preview.ps1 -Stop      # stop app + tunnel
# The link changes every time the tunnel restarts, and only works while this PC is on.
param([switch]$Rebuild, [switch]$Stop)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
$logs = Join-Path $root ".tools\logs"
New-Item -ItemType Directory -Force $logs | Out-Null
$cloudflared = Join-Path $root ".tools\cloudflared\cloudflared.exe"
if (-not (Test-Path $cloudflared)) { throw "cloudflared not found at $cloudflared" }

function Test-Listening([int]$port) { [bool](Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) }
function Wait-For([scriptblock]$check, [int]$seconds, [string]$what) {
  for ($i = 0; $i -lt $seconds; $i += 2) { if (& $check) { return } ; Start-Sleep 2 }
  throw "Timed out waiting for $what"
}
# Launches a hidden background process that is independent of this console (it keeps running
# after this window or terminal closes). Output is redirected inside cmd.
function Start-Detached([string]$command) {
  $result = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{
    CommandLine      = "cmd.exe /c `"$command`""
    CurrentDirectory = $root
  }
  if ($result.ReturnValue -ne 0) { throw "Could not start: $command" }
}
function Stop-Port([int]$port) {
  Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
}

Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force
if ($Stop) {
  Stop-Port 3000
  Write-Host "Stopped the tunnel and the app (the database keeps running)."
  return
}

if (-not (Test-Listening 5433)) {
  Write-Host "Starting local PostgreSQL..."
  Start-Detached "node scripts\local-postgres.mjs > `"$logs\postgres.log`" 2>&1"
  Wait-For { Test-Listening 5433 } 300 "PostgreSQL"
}

if ($Rebuild -or -not (Test-Path ".next\BUILD_ID")) {
  Stop-Port 3000
  Write-Host "Building the production app (this can take several minutes)..."
  cmd /c "npm run build > `"$logs\build.log`" 2>&1"
  if ($LASTEXITCODE -ne 0) { throw "Build failed - see $logs\build.log" }
}

if (-not (Test-Listening 3000)) {
  Write-Host "Starting the app on http://localhost:3000 ..."
  Start-Detached "npm start > `"$logs\app.log`" 2>&1"
  Wait-For { Test-Listening 3000 } 180 "the app"
}

$tunnelLog = Join-Path $logs "tunnel.log"
Remove-Item $tunnelLog -ErrorAction SilentlyContinue
Write-Host "Opening the Cloudflare tunnel..."
# cloudflared writes its log (including the public link) to stderr.
Start-Detached "`"$cloudflared`" tunnel --no-autoupdate --url http://localhost:3000 > `"$tunnelLog`" 2>&1"
$script:url = $null
Wait-For {
  if (-not (Test-Path $tunnelLog)) { return $false }
  $script:url = (Select-String -Path $tunnelLog -Pattern "https://[a-z0-9-]+\.trycloudflare\.com" | Select-Object -First 1).Matches.Value
  [bool]$script:url
} 120 "the tunnel link"

Set-Content -Path (Join-Path $logs "preview-url.txt") -Value $script:url
Write-Host ""
Write-Host "Preview link: $($script:url)" -ForegroundColor Green
Write-Host "Demo password for every account: Kazi-demo-2026 (accounts are listed on the sign-in page)."
