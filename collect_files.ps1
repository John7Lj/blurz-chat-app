$outputFile = "collected_files.txt"
if (Test-Path $outputFile) { Remove-Item $outputFile }

$paths = @(
    "client/src/features/auth",
    "client/src/features/chat",
    "client/src/features/profile",
    "client/src/features/settings",
    "client/src/index.css",
    "client/src/main.tsx",
    "client/src/App.tsx"
)

foreach ($path in $paths) {
    if (Test-Path $path) {
        if ((Get-Item $path) -is [System.IO.DirectoryInfo]) {
            $files = Get-ChildItem -Path $path -File -Recurse
            foreach ($file in $files) {
                $relative = Resolve-Path -Path $file.FullName -Relative
                Add-Content -Path $outputFile -Value "--- FILE: $relative ---"
                Add-Content -Path $outputFile -Value (Get-Content -Path $file.FullName -Raw)
                Add-Content -Path $outputFile -Value "`n"
            }
        } else {
            $relative = Resolve-Path -Path (Get-Item $path).FullName -Relative
            Add-Content -Path $outputFile -Value "--- FILE: $relative ---"
            Add-Content -Path $outputFile -Value (Get-Content -Path (Get-Item $path).FullName -Raw)
            Add-Content -Path $outputFile -Value "`n"
        }
    }
}
