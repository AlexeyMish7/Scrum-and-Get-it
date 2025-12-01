param(
    [ValidateSet("all","frontend","server")]
    [string]$Suite = "all"
)

$ErrorActionPreference = "Stop"

# Resolve tests workspace path relative to this script
$testsDir = Join-Path $PSScriptRoot "..\tests"

# Ensure test-friendly environment
$env:NODE_ENV = "test"

# Map requested suite to tests workspace script
$scriptName = switch ($Suite) {
    "frontend" { "test:frontend" }
    "server"   { "test:server" }
    default     { "test:all" }
}

Push-Location $testsDir
try {
    npm run $scriptName
    $code = $LASTEXITCODE
    if ($code -ne 0) {
        exit $code
    }
}
finally {
    Pop-Location
}
