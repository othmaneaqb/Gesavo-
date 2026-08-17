[CmdletBinding()]
param(
    [ValidateSet("docker", "local")]
    [string]$Mode = "docker",

    [switch]$SkipMigrations,

    [string]$PythonCommand = "python"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$backendRoot = Join-Path $projectRoot "backend"
$environmentFile = Join-Path $projectRoot ".env"

if (-not (Test-Path -LiteralPath $environmentFile)) {
    throw "Missing .env file. Copy .env.example to .env and configure it first."
}

$environmentValues = @{}
foreach ($line in Get-Content -LiteralPath $environmentFile) {
    if ($line -match '^\s*#' -or $line -notmatch '=') {
        continue
    }

    $name, $value = $line -split '=', 2
    $name = $name.Trim()
    $value = $value.Trim().Trim('"').Trim("'")
    $environmentValues[$name] = $value
}

$requiredVariables = @(
    "GESAVO_DEMO_PASSWORD",
    "GESAVO_ASSISTANT_PASSWORD"
)

foreach ($variableName in $requiredVariables) {
    $configuredValue = $environmentValues[$variableName]
    if ([string]::IsNullOrWhiteSpace($configuredValue) -or $configuredValue -like "replace-with-*") {
        throw "$variableName must contain a strong, non-placeholder password in .env."
    }
}

function Invoke-CheckedCommand {
    param(
        [Parameter(Mandatory = $true)]
        [scriptblock]$Command,

        [Parameter(Mandatory = $true)]
        [string]$FailureMessage
    )

    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw $FailureMessage
    }
}

if ($Mode -eq "docker") {
    Push-Location $projectRoot
    try {
        if (-not $SkipMigrations) {
            Invoke-CheckedCommand {
                docker compose run --rm backend python manage.py migrate
            } "Django migrations failed."
        }

        Invoke-CheckedCommand {
            docker compose run --rm backend python manage.py seed_demo
        } "Database seeding failed."
    }
    finally {
        Pop-Location
    }
}
else {
    foreach ($entry in $environmentValues.GetEnumerator()) {
        [Environment]::SetEnvironmentVariable($entry.Key, $entry.Value, "Process")
    }

    Push-Location $backendRoot
    try {
        if (-not $SkipMigrations) {
            Invoke-CheckedCommand {
                & $PythonCommand manage.py migrate
            } "Django migrations failed."
        }

        Invoke-CheckedCommand {
            & $PythonCommand manage.py seed_demo
        } "Database seeding failed."
    }
    finally {
        Pop-Location
    }
}

Write-Host "Database filled successfully." -ForegroundColor Green
Write-Host "Lawyer username: demo"
Write-Host "Assistant username: assistant"
Write-Host "Passwords are read from GESAVO_DEMO_PASSWORD and GESAVO_ASSISTANT_PASSWORD in .env."
