# This PowerShell script sets up the MSVC environment and runs tauri dev
$vcvars = "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat"
# Run vcvars and capture the environment
$cmd = "`"$vcvars`" > `$null && set"
$envOutput = cmd /c $cmd
# Parse the environment variables
foreach ($line in $envOutput) {
    if ($line -match '^([^=]+)=(.*)$') {
        $key = $matches[1]
        $value = $matches[2]
        [Environment]::SetEnvironmentVariable($key, $value, [EnvironmentVariableTarget]::Process)
    }
}
# Now run tauri dev
Set-Location $PSScriptRoot
npm run tauri dev
if ($LASTEXITCODE) { exit $LASTEXITCODE }
