<#
.SYNOPSIS
  PosMul 토큰 절약형 빌드 · 커밋 · 푸시 · 선택 배포 파이프라인
.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts/ship.ps1 -CheckOnly
  powershell -ExecutionPolicy Bypass -File scripts/ship.ps1 -Message "feat(web): 수정" -Files "apps/posmul-web/src/a.ts"
  powershell -ExecutionPolicy Bypass -File scripts/ship.ps1 -Message "fix(pro): 수정" -Files "apps/housing-pro/src/b.ts" -Deploy
#>
param(
  [ValidateSet("auto", "web", "pro", "both", "none")]
  [string]$App = "auto",
  [string]$Message = "",
  [string]$Files = "",
  [switch]$Deploy,
  [switch]$CheckOnly
)

$ErrorActionPreference = "Continue"
$RepoRoot = "c:\G\posmul"
Set-Location -Path $RepoRoot

$FileList = @()
if ($Files) {
  $FileList = $Files.Split(",") | ForEach-Object { $_.Trim() } | Where-Object { $_ }
}

$Branch = (git branch --show-current).Trim()
if ($Branch -eq "main") {
  Write-Error "[BLOCKED] main 브랜치에서는 직접 작업할 수 없습니다."
  exit 1
}

function Resolve-TargetApp {
  param([string]$Requested, [string[]]$ExplicitFiles)
  if ($Requested -ne "auto") { return $Requested }

  $paths = @()
  if ($ExplicitFiles.Count -gt 0) {
    $paths = $ExplicitFiles
  } else {
    $rawStatus = git status --porcelain
    foreach ($line in $rawStatus) {
      if ($line.Length -gt 3) {
        $paths += $line.Substring(3).Trim('"')
      }
    }
  }

  $hasWeb = $false
  $hasPro = $false
  $hasShared = $false
  foreach ($p in $paths) {
    $norm = $p.Replace("\", "/")
    if ($norm -like "apps/posmul-web/*") { $hasWeb = $true }
    elseif ($norm -like "apps/housing-pro/*") { $hasPro = $true }
    elseif ($norm -like "packages/*") { $hasShared = $true }
  }

  if ($hasShared -or ($hasWeb -and $hasPro)) { return "both" }
  if ($hasWeb) { return "web" }
  if ($hasPro) { return "pro" }
  return "none"
}

function Invoke-QuietBuild {
  param([string]$PkgFilter)
  $out = & pnpm --filter $PkgFilter build 2>&1
  if ($LASTEXITCODE -ne 0) {
    Write-Output "[BUILD FAIL] $PkgFilter"
    $out | Select-Object -Last 30
    exit $LASTEXITCODE
  }
  $summary = ($out | Select-String -Pattern "Compiled|Generating static pages" | Select-Object -Last 2) -join " | "
  if (-not $summary) { $summary = "Exit code 0" }
  Write-Output "[BUILD OK] $PkgFilter :: $summary"
}

function Invoke-QuietVercelDeploy {
  param([ValidateSet("web", "pro")][string]$Target)
  $urlToCheck = if ($Target -eq "web") { "https://posmul.com" } else { "https://pro.posmul.com" }
  $rootVercel = Join-Path $RepoRoot ".vercel\project.json"
  $proVercel = Join-Path $RepoRoot "apps\housing-pro\.vercel\project.json"

  $backup = $null
  if (Test-Path $rootVercel) {
    $backup = Get-Content -Raw $rootVercel
  }

  try {
    if ($Target -eq "pro") {
      if (-not (Test-Path $proVercel)) {
        Write-Error "[DEPLOY FAIL] apps/housing-pro/.vercel/project.json 이 없습니다."
        exit 1
      }
      Copy-Item -Force $proVercel $rootVercel
    }

    $deployOut = & pnpm dlx vercel --prod --yes 2>&1
    if ($LASTEXITCODE -ne 0) {
      Write-Output "[DEPLOY FAIL] $Target"
      $deployOut | Select-Object -Last 25
      exit $LASTEXITCODE
    }

    $aliased = ($deployOut | Select-String -Pattern "Aliased|Production" | Select-Object -Last 2) -join " | "
    $resp = Invoke-WebRequest -Uri $urlToCheck -Method Head -UseBasicParsing -TimeoutSec 15
    Write-Output "[DEPLOY OK] $Target -> $urlToCheck ($($resp.StatusCode)) :: $aliased"
  } finally {
    if ($null -ne $backup) {
      Set-Content -Path $rootVercel -Value $backup -NoNewline
    }
  }
}

$ResolvedApp = Resolve-TargetApp -Requested $App -ExplicitFiles $FileList

if ($CheckOnly) {
  $hasRootVercel = Test-Path (Join-Path $RepoRoot ".vercel\project.json")
  $hasProVercel = Test-Path (Join-Path $RepoRoot "apps\housing-pro\.vercel\project.json")
  Write-Output "[CHECK OK] branch=$Branch target=$ResolvedApp deploy=$($Deploy.IsPresent) rootVercel=$hasRootVercel proVercel=$hasProVercel"
  exit 0
}

if ($ResolvedApp -eq "web" -or $ResolvedApp -eq "both") {
  Invoke-QuietBuild -PkgFilter "@posmul/posmul-web"
}
if ($ResolvedApp -eq "pro" -or $ResolvedApp -eq "both") {
  Invoke-QuietBuild -PkgFilter "@posmul/housing-pro"
}
if ($ResolvedApp -eq "none") {
  Write-Output "[BUILD SKIP] 변경된 앱 코드 없음"
}

if ($Message) {
  if ($FileList.Count -gt 0) {
    & git add -- $FileList
  } else {
    & git add -A
  }
  $commitOut = & git commit -m $Message 2>&1
  if ($LASTEXITCODE -ne 0) {
    $commitOut | Select-Object -Last 10
    exit $LASTEXITCODE
  }
  $commitHash = (git rev-parse --short HEAD).Trim()
  $pushOut = & git push origin $Branch 2>&1
  if ($LASTEXITCODE -ne 0) {
    $pushOut | Select-Object -Last 10
    exit $LASTEXITCODE
  }
  Write-Output "[GIT OK] $Branch@$commitHash pushed -> origin/$Branch"
}

if ($Deploy) {
  if ($ResolvedApp -eq "web" -or $ResolvedApp -eq "both") {
    Invoke-QuietVercelDeploy -Target "web"
  }
  if ($ResolvedApp -eq "pro" -or $ResolvedApp -eq "both") {
    Invoke-QuietVercelDeploy -Target "pro"
  }
}
