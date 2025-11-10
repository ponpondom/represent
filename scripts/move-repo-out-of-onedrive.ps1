<#
.SYNOPSIS
    Safely move this repository out of OneDrive by creating backups, pausing OneDrive, copying to a new location, and optionally deleting the original.

.DESCRIPTION
    This script performs safe steps to move a git repo located inside OneDrive (or any folder). It:
    - Shows git status and optionally commits uncommitted changes.
    - Creates a git bundle as an extra backup (optional).
    - Attempts to pause/stop OneDrive to avoid sync/lock races.
    - Copies the repo with robocopy (robust on Windows) to the destination.
    - Installs node deps in the new location (npm ci if package-lock.json exists, otherwise npm install).
    - Optionally deletes the original source after confirmation.

.PARAMETER Source
    Path to the source repo. Defaults to the current working directory.

.PARAMETER Destination
    Full path to copy the repo to. Defaults to C:\Projects\represent (adjust as needed).

.PARAMETER DeleteOriginal
    If set, the script will delete the original source AFTER the copy and verification.

.PARAMETER PauseOneDrive
    If set (default), attempt to stop the OneDrive process before copying. The script will also print UI steps for pausing via the OneDrive tray icon.

.PARAMETER CreateBundle
    If set (default), create a git bundle as an extra offline backup in $env:TEMP.

.PARAMETER StartExpo
    If set, runs `npx expo start -c` in the destination after copying/deps install.

.EXAMPLE
    # Basic use: copy current repo to C:\Projects\represent
    .\move-repo-out-of-onedrive.ps1 -Destination 'C:\Projects\represent'

    # Copy and delete original after confirmation
    .\move-repo-out-of-onedrive.ps1 -Destination 'C:\Projects\represent' -DeleteOriginal -StartExpo
#>

param(
    [string]$Source = (Get-Location).Path,
    [string]$Destination = 'C:\Projects\represent',
    [switch]$DeleteOriginal,
    [switch]$PauseOneDrive = $true,
    [switch]$CreateBundle = $true,
    [switch]$StartExpo
)

function Write-Okay($msg){ Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Warn($msg){ Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Err($msg){ Write-Host "[ERROR] $msg" -ForegroundColor Red }

Write-Host "Move repo helper"
Write-Host "Source: $Source"
Write-Host "Destination: $Destination"

# Resolve paths
$Source = [System.IO.Path]::GetFullPath($Source)
$Destination = [System.IO.Path]::GetFullPath($Destination)

if (-not (Test-Path $Source)){
    Write-Err "Source path does not exist: $Source"
    exit 1
}

# Check for .git
$gitFolder = Join-Path $Source '.git'
if (-not (Test-Path $gitFolder)){
    Write-Warn "No .git folder found at source. This script expects a git repo. Continuing, but .git will not be copied unless present."
}

# Show git status
Push-Location $Source
try{
    $gitStatus = & git status --porcelain 2>$null
} catch {
    Write-Warn "Git not found or not a git repo. Install git or initialize the repo before using this script. Output: $_"
    $gitStatus = $null
}

if ($gitStatus -and $gitStatus.Length -gt 0){
    Write-Warn "Repository has uncommitted changes."
    Write-Host $gitStatus

    $doCommit = Read-Host "Would you like to auto-commit these changes locally before copying? (y/N)"
    if ($doCommit -match '^[Yy]'){
        & git add -A
        $commitMsg = Read-Host "Enter commit message (default: WIP: save before moving out of OneDrive)"
        if ([string]::IsNullOrWhiteSpace($commitMsg)) { $commitMsg = 'WIP: save before moving out of OneDrive' }
        & git commit -m "$commitMsg"
        if ($LASTEXITCODE -ne 0){ Write-Warn "Commit may have failed. Check git status manually." }
        else { Write-Okay "Committed changes." }
    } else {
        Write-Warn "Proceeding without committing. Consider committing or creating a bundle backup."
    }
} else {
    Write-Okay "No uncommitted changes detected (or not a git repo)."
}

# Create bundle backup if requested
if ($CreateBundle -and (Get-Command git -ErrorAction SilentlyContinue)){
    $bundleName = "represent-repo-$(Get-Date -Format 'yyyyMMddHHmmss').bundle"
    $bundlePath = Join-Path $env:TEMP $bundleName
    Write-Host "Creating git bundle backup at: $bundlePath"
    & git bundle create "$bundlePath" --all
    if ($LASTEXITCODE -eq 0){ Write-Okay "Git bundle created: $bundlePath" } else { Write-Warn "Git bundle creation failed or this is not a git repo." }
}

# Attempt to pause/stop OneDrive if requested
if ($PauseOneDrive){
    Write-Host "Attempting to stop OneDrive process to avoid sync races."
    try{
        # Attempt graceful close (send close main window) - not universally supported.
        $oneProc = Get-Process -Name OneDrive -ErrorAction SilentlyContinue
        if ($oneProc){
            Write-Host "Stopping OneDrive process..."
            Stop-Process -Id $oneProc.Id -Force -ErrorAction SilentlyContinue
            Start-Sleep -Milliseconds 500
            if (-not (Get-Process -Name OneDrive -ErrorAction SilentlyContinue)){
                Write-Okay "OneDrive stopped."
            } else {
                Write-Warn "OneDrive still running. Consider pausing from the system tray before continuing."
            }
        } else {
            Write-Host "OneDrive process not found. If you use OneDrive GUI, consider pausing sync manually via the tray icon."
        }
    } catch {
        Write-Warn "Failed to stop OneDrive process: $_"
    }
    Write-Host "(If OneDrive is running, please pause syncing from the tray icon before continuing.)"
}

# Prepare destination
$destParent = Split-Path -Path $Destination -Parent
if (-not (Test-Path $destParent)){
    New-Item -ItemType Directory -Path $destParent -Force | Out-Null
}

Write-Host "Starting robocopy from:`n  $Source`n to:`n  $Destination"

# Robocopy command - robust for Windows. /MIR mirrors the tree. Adjust /R and /W to reduce retries.
$robocopyArgs = @($Source, $Destination, '/MIR', '/COPYALL', '/XJ', '/R:2', '/W:2')
$robocopyExe = 'robocopy'

# Run robocopy
$rc = & $robocopyExe @robocopyArgs
$rcCode = $LASTEXITCODE
# Robocopy returns bitmask codes; 0 and 1 indicate success/some files copied
if ($rcCode -lt 8){
    Write-Okay "Robocopy finished (exit code $rcCode)."
} else {
    Write-Err "Robocopy failed with exit code $rcCode. Inspect the output above and retry."
    Pop-Location
    exit 1
}

# Verify .git in destination
$destGit = Join-Path $Destination '.git'
if (Test-Path $destGit){ Write-Okay ".git exists in destination." } else { Write-Warn ".git not found in destination. If you need git history, consider cloning from remote instead." }

# Install node deps in destination
Push-Location $Destination
if (Test-Path 'package-lock.json'){
    Write-Host "Installing node modules with npm ci..."
    & npm ci
    if ($LASTEXITCODE -eq 0){ Write-Okay "npm ci succeeded." } else { Write-Warn "npm ci failed. Try 'npm install' or check npm logs." }
} elseif (Test-Path 'package.json'){
    Write-Host "Installing node modules with npm install..."
    & npm install
    if ($LASTEXITCODE -eq 0){ Write-Okay "npm install succeeded." } else { Write-Warn "npm install failed. Check npm logs." }
} else {
    Write-Warn "No package.json found in destination; skipping dependency install."
}

if ($StartExpo){
    Write-Host "Starting Expo Metro bundler (clearing cache)..."
    Start-Process -FilePath 'npx' -ArgumentList 'expo start -c' -NoNewWindow
}

Pop-Location
Pop-Location

# Optionally delete original
if ($DeleteOriginal){
    $confirm = Read-Host "Delete original source folder $Source? This is irreversible. Type DELETE to confirm"
    if ($confirm -eq 'DELETE'){
        Write-Host "Removing original folder..."
        try{
            Remove-Item -LiteralPath $Source -Recurse -Force -ErrorAction Stop
            Write-Okay "Original source deleted."
        } catch {
            Write-Err "Failed to delete original: $_"
        }
    } else {
        Write-Warn "Deletion cancelled by user. Original folder remains at $Source"
    }
}

Write-Host "Move complete. Verify the destination at: $Destination"
Write-Host "If everything looks good, remove the OneDrive copy or re-enable OneDrive syncing as desired."

