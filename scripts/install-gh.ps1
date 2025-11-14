<#
Idempotent installer for GitHub CLI (gh).
- Tries winget with accept flags.
- Falls back to downloading the MSI and installing silently.
- Verifies installation and prints path/version.
Usage (run as admin for best results):
    .\scripts\install-gh.ps1 [-Version <version>] [-Force]

Parameters:
  -Version: optional version to install (default: latest known stable 2.83.0). If passing 'latest', uses winget's default.
  -Force: re-run installation even if gh already exists.
#>
[CmdletBinding()]
param(
    [string]$Version = '2.83.0',
    [switch]$Force,
    [string]$LogFile = ''
)

# Setup logging: default log file at scripts/logs/install-gh.log (create folder if needed)
if (-not $LogFile) {
    $logDir = Join-Path $PSScriptRoot 'logs'
    if (-not (Test-Path $logDir)) {
        New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    }
    $LogFile = Join-Path $logDir 'install-gh.log'
}

function Log-Write {
    param(
        [string]$Level,
        [string]$Message
    )
    try {
        $ts = (Get-Date).ToString('s')
        "$ts [$Level] $Message" | Out-File -FilePath $LogFile -Encoding UTF8 -Append
    } catch {
        # Logging should not break the installer; write a console warning if it fails
        Write-Host "[LOG-ERR] Failed to write to log file $LogFile: $_" -ForegroundColor Yellow
    }
}

function Write-Info { param($m) Write-Host "[INFO] $m" -ForegroundColor Cyan; Log-Write 'INFO' $m }
function Write-Success { param($m) Write-Host "[OK]   $m" -ForegroundColor Green; Log-Write 'OK' $m }
function Write-Warn { param($m) Write-Host "[WARN] $m" -ForegroundColor Yellow; Log-Write 'WARN' $m }
function Write-Err { param($m) Write-Host "[ERR]  $m" -ForegroundColor Red; Log-Write 'ERR' $m }

Write-Info "Starting GitHub CLI installer (Version=$Version, Force=$Force, LogFile=$LogFile)"

$ghCmd = Get-Command gh -ErrorAction SilentlyContinue
if ($ghCmd -and -not $Force) {
    Write-Success "gh already installed: $($ghCmd.Path)"
    gh --version
    return 0
}

# Try winget first
try {
    if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
        Write-Warn "winget not found on PATH. Skipping winget step."
        throw "NoWinget"
    }

    $wingetArgs = @('install','--id','GitHub.cli','-e','--accept-source-agreements','--accept-package-agreements')
    if ($Version -and $Version -ne 'latest') { $wingetArgs += @('--version',$Version) }

    Write-Info "Attempting winget install..."
    $process = Start-Process -FilePath 'winget' -ArgumentList $wingetArgs -NoNewWindow -Wait -PassThru -ErrorAction Stop
    if ($process.ExitCode -eq 0) {
        Write-Success "winget installed GitHub CLI (exit code 0)"
        gh --version
        return 0
    }
    else {
        Write-Warn "winget exited with code $($process.ExitCode). Falling back to MSI."
        throw "WingetFailed"
    }
} catch {
    Write-Info "Falling back to MSI installer path: $($_)"
}

# MSI fallback
$arch = (if ([Environment]::Is64BitOperatingSystem) { 'windows_amd64' } else { 'windows_386' })
$msiVersion = $Version -replace '^v',''
$msiFileName = "gh_${msiVersion}_${arch}.msi"
$msiUrl = "https://github.com/cli/cli/releases/download/v${msiVersion}/${msiFileName}"
$tempPath = [IO.Path]::GetTempPath()
$msiPath = Join-Path $tempPath $msiFileName

Write-Info "Downloading MSI from $msiUrl to $msiPath"
try {
    Invoke-WebRequest -Uri $msiUrl -OutFile $msiPath -UseBasicParsing -ErrorAction Stop
    Write-Info "Download complete"
} catch {
    Write-Err "Failed to download MSI: $($_)"
    exit 2
}

# Install silently
Write-Info "Installing MSI silently (elevated prompt may appear)..."
$msiArgs = @('/i', $msiPath, '/qn', '/norestart')
$proc = Start-Process -FilePath 'msiexec.exe' -ArgumentList $msiArgs -Verb RunAs -Wait -PassThru -ErrorAction SilentlyContinue
if ($proc -and $proc.ExitCode -eq 0) {
    Write-Success "MSI installed successfully"
} else {
    Write-Warn "MSI installer exit code: $($proc.ExitCode). If you saw UI, check for prompts."
}

# Verify
$ghCmd = Get-Command gh -ErrorAction SilentlyContinue
if ($ghCmd) {
    Write-Success "gh installed: $($ghCmd.Path)"
    gh --version
    exit 0
} else {
    Write-Err "gh still not found on PATH after install."
    Write-Info "You can try running the MSI interactively: Start-Process msiexec.exe -ArgumentList '/i', '$msiPath' -Verb RunAs -Wait"
    exit 3
}
