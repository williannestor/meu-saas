# Package-Template.ps1
param(
  [Parameter(Mandatory=$true)][string]$OutputZip,
  [string]$Source = $PSScriptRoot,
  [string]$TemporaryBrand = "MEUS-ARQUIVOS"
)

$ErrorActionPreference = "Stop"
$tmp = Join-Path $env:TEMP ("meus-arquivos-tpl-" + [guid]::NewGuid().ToString("N"))

if (-not (Test-Path $Source)) { throw "Source not found: $Source" }
New-Item -Path $tmp -ItemType Directory | Out-Null
Copy-Item -Path "$Source\*" -Destination $tmp -Recurse -Force

Set-Location $tmp
$brand = $env:TEMPLATE_BRAND
if (-not $brand) { $brand = $TemporaryBrand }

Write-Host "[package] source: $Source"
Write-Host "[package] output: $OutputZip"
Write-Host "[package] temporary brand: $brand"

# Ensure node_modules is not packaged
$nodeModules = Join-Path $tmp "node_modules"
if (Test-Path $nodeModules) { Remove-Item $nodeModules -Recurse -Force }
$envFile = Join-Path $tmp ".env"
if (-not (Test-Path $envFile)) {
  if (Test-Path "$Source\.env.example") { Copy-Item "$Source\.env.example" $envFile }
}

if (-not (Test-Path (Split-Path $OutputZip -Parent))) {
  New-Item -Path (Split-Path $OutputZip -Parent) -ItemType Directory | Out-Null
}
Compress-Archive -Path "$tmp\*" -DestinationPath $OutputZip -Force
Remove-Item $tmp -Recurse -Force
Write-Host "[package] created: $OutputZip"
