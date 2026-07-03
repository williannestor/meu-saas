# Install-Client.ps1
param(
  [Parameter(Mandatory=$true)][string]$Destination,
  [Parameter(Mandatory=$true)][string]$Brand,
  [string]$RepoZip = "$PSScriptRoot\..\meu-saas-template.zip",
  [string]$NodeExe = "node"
)

$ErrorActionPreference = "Stop"

Write-Host "[install] destination: $Destination"
if (Test-Path $Destination) {
  $confirm = Read-Host "Destination exists. Overwrite? [y/N]"
  if ($confirm -ne "y") { exit 1 }
  Remove-Item $Destination -Recurse -Force
}

if (-not (Test-Path $RepoZip)) {
  Write-Host "[install] repo zip not found at: $RepoZip"
  exit 1
}

Expand-Archive -Path $RepoZip -DestinationPath $Destination -Force
Set-Location $Destination

if (-not (Get-Command $NodeExe -ErrorAction SilentlyContinue)) {
  Write-Host "[install] node not found in PATH. Set -NodeExe to your node path."
  exit 1
}

Write-Host "[install] installing dependencies..."
& $NodeExe npm install

Write-Host "[install] applying brand: $Brand"
$brandSafe = $Brand -replace '[^a-zA-Z0-9_-]',''
$env:BRAND = $brandSafe

Write-Host "[install] done."
Write-Host "Next: edit .env and run: npm start"
