param([int]$VersionCode = 1)

$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path $PSScriptRoot -Parent
$outputDir = Join-Path $taskRoot 'release-output'
$apk = Join-Path $outputDir "AstroWalla-1.0.0-$VersionCode.apk"
$aab = Join-Path $outputDir "AstroWalla-1.0.0-$VersionCode.aab"
$buildTools = Join-Path $env:LOCALAPPDATA 'Android\Sdk\build-tools\36.0.0'
$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
Add-Type -AssemblyName System.IO.Compression.FileSystem

foreach ($artifact in @($apk, $aab)) {
    $zip = [System.IO.Compression.ZipFile]::OpenRead($artifact)
    try {
        $bundle = @($zip.Entries | Where-Object { $_.FullName -match '(^|/)assets/index.android.bundle$' })
        if ($bundle.Count -ne 1 -or $bundle[0].Length -lt 100000) { throw "Missing standalone JavaScript in $artifact" }
        $libraries = @($zip.Entries | Where-Object { $_.FullName -match '/(arm64-v8a|x86_64)/.*\.so$' })
        if (!$libraries.Count) { throw "Missing 64-bit libraries in $artifact" }
        foreach ($entry in $libraries) {
            $stream = $entry.Open()
            $memory = New-Object System.IO.MemoryStream
            try { $stream.CopyTo($memory); $bytes = $memory.ToArray() } finally { $stream.Dispose(); $memory.Dispose() }
            if ($bytes[0] -ne 127 -or $bytes[1] -ne 69 -or $bytes[2] -ne 76 -or $bytes[3] -ne 70 -or $bytes[4] -ne 2) { throw "Not ELF64: $($entry.FullName)" }
            $offset = [System.BitConverter]::ToUInt64($bytes, 32)
            $entrySize = [System.BitConverter]::ToUInt16($bytes, 54)
            $count = [System.BitConverter]::ToUInt16($bytes, 56)
            for ($index = 0; $index -lt $count; $index++) {
                $header = [int]($offset + $index * $entrySize)
                if ([System.BitConverter]::ToUInt32($bytes, $header) -eq 1) {
                    $alignment = [System.BitConverter]::ToUInt64($bytes, $header + 48)
                    if ($alignment -lt 16384) { throw "16 KB alignment failure: $($entry.FullName) ($alignment)" }
                }
            }
        }
        Write-Output "$(Split-Path $artifact -Leaf): standalone bundle and $($libraries.Count) ELF64 libraries passed."
    } finally { $zip.Dispose() }
}

& "$buildTools\apksigner.bat" verify --verbose --print-certs $apk
if ($LASTEXITCODE -ne 0) { throw 'APK signature verification failed.' }
& "$buildTools\zipalign.exe" -c -P 16 4 $apk
if ($LASTEXITCODE -ne 0) { throw 'APK 16 KB ZIP alignment verification failed.' }
$badging = & "$buildTools\aapt.exe" dump badging $apk
if ($LASTEXITCODE -ne 0) { throw 'APK manifest read failed.' }
if (!($badging -match "package: name='com.astrowalla.app'.*versionCode='$VersionCode'")) { throw 'Wrong application ID or version code.' }
if (!($badging -match "targetSdkVersion:'36'")) { throw 'Wrong Android target SDK.' }
if ($badging -match 'application-debuggable') { throw 'Release APK is debuggable.' }
if ($badging -match "uses-permission: name='android.permission.(CAMERA|READ_PHONE_STATE|READ_EXTERNAL_STORAGE|WRITE_EXTERNAL_STORAGE|READ_MEDIA_IMAGES|READ_MEDIA_VIDEO)'") { throw 'Unexpected broad device or photo permissions.' }
$badging | Select-String 'package:|sdkVersion:|targetSdkVersion:|uses-permission:'
& "$env:JAVA_HOME\bin\jarsigner.exe" -verify $aab
if ($LASTEXITCODE -ne 0) { throw 'AAB signature verification failed.' }
Get-FileHash -Algorithm SHA256 -LiteralPath $apk, $aab | Select-Object Path, Hash
