# 照片墙刷新脚本 — 运行后自动扫描 photowall 文件夹，更新 photowall.json
# 用法：在项目根目录下右键 -> 使用 PowerShell 运行

$photowallDir = ".\assets\picture\photowall"
$outFile = ".\assets\text\photowall.json"

if (-not (Test-Path $photowallDir)) {
    Write-Host "Error: $photowallDir not found"
    exit 1
}

$files = Get-ChildItem $photowallDir -File | Where-Object {
    $_.Extension -match '\.(jpg|jpeg|png|gif|webp)$'
} | Sort-Object Name | ForEach-Object { $_.Name }

$json = ConvertTo-Json -InputObject @($files) -Compress
[System.IO.File]::WriteAllText($outFile, $json, [System.Text.UTF8Encoding]::new($false))

Write-Host "Done! Updated photowall.json - $($files.Count) photos"
