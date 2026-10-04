param([int]$VersionCode = 1)

$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path $PSScriptRoot -Parent
$privateDir = Join-Path $taskRoot 'release-private'
$outputDir = Join-Path $taskRoot 'release-output'
$credentialsPath = Join-Path $privateDir 'user-upload-signing.json'
$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
$env:ANDROID_HOME = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:Path"
$env:EXPO_PUBLIC_API_URL = 'https://www.astrowalla.com'
$env:EXPO_PUBLIC_SOCKET_URL = 'https://astrologer-socket-server.onrender.com'
$env:EXPO_NO_METRO_WORKSPACE_ROOT = '1'
$env:EXPO_ROUTER_APP_ROOT = 'app'
$env:NODE_ENV = 'production'

New-Item -ItemType Directory -Force -Path $privateDir, $outputDir | Out-Null
if (!(Test-Path -LiteralPath $credentialsPath)) {
    $keystorePath = Join-Path $privateDir 'astrowalla-user-upload.jks'
    if (Test-Path -LiteralPath $keystorePath) { throw 'Existing upload key found without credentials. Restore its credentials; do not replace it.' }
    $bytes = New-Object byte[] 32
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    $rng.Dispose()
    $password = [Convert]::ToBase64String($bytes)
    $signing = [ordered]@{ storeFile = $keystorePath; storePassword = $password; keyAlias = 'astrowalla-user-upload'; keyPassword = $password }
    $signing | ConvertTo-Json | Set-Content -LiteralPath $credentialsPath -Encoding utf8
}
$signing = Get-Content -LiteralPath $credentialsPath -Raw | ConvertFrom-Json
$env:ASTROWALLA_RELEASE_STORE_FILE = $signing.storeFile
$env:ASTROWALLA_RELEASE_STORE_PASSWORD = $signing.storePassword
$env:ASTROWALLA_RELEASE_KEY_ALIAS = $signing.keyAlias
$env:ASTROWALLA_RELEASE_KEY_PASSWORD = $signing.keyPassword

try {
    if (!(Test-Path -LiteralPath $signing.storeFile)) {
        & "$env:JAVA_HOME\bin\keytool.exe" -genkeypair -keystore $signing.storeFile -storepass:env ASTROWALLA_RELEASE_STORE_PASSWORD -alias $signing.keyAlias -keypass:env ASTROWALLA_RELEASE_KEY_PASSWORD -keyalg RSA -keysize 4096 -validity 10000 -dname 'CN=AstroWalla Upload, O=AstroWalla, C=IN'
        if ($LASTEXITCODE -ne 0) { throw 'Upload key generation failed.' }
    }
    Push-Location (Join-Path $taskRoot 'apps\mobile\android')
    try {
        & .\gradlew.bat app:bundleRelease app:assembleRelease "-PastrowallaVersionCode=$VersionCode" --no-daemon --console=plain
        if ($LASTEXITCODE -ne 0) { throw 'Release build failed.' }
    } finally { Pop-Location }
    Copy-Item -LiteralPath (Join-Path $taskRoot 'apps\mobile\android\app\build\outputs\bundle\release\app-release.aab') -Destination (Join-Path $outputDir "AstroWalla-1.0.0-$VersionCode.aab") -Force
    Copy-Item -LiteralPath (Join-Path $taskRoot 'apps\mobile\android\app\build\outputs\apk\release\app-release.apk') -Destination (Join-Path $outputDir "AstroWalla-1.0.0-$VersionCode.apk") -Force
    & "$env:JAVA_HOME\bin\keytool.exe" -exportcert -rfc -keystore $signing.storeFile -storepass:env ASTROWALLA_RELEASE_STORE_PASSWORD -alias $signing.keyAlias -file (Join-Path $outputDir 'user-upload-certificate.pem')
    if ($LASTEXITCODE -ne 0) { throw 'Certificate export failed.' }
    Get-ChildItem -LiteralPath $outputDir | Select-Object Name, Length
} finally {
    Remove-Item Env:ASTROWALLA_RELEASE_STORE_PASSWORD, Env:ASTROWALLA_RELEASE_KEY_PASSWORD -ErrorAction SilentlyContinue
}
