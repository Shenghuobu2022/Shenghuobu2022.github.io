# 照片墙刷新脚本 — 运行后自动扫描 photowall 文件夹，更新 photowall.json
# 用法：在项目根目录下运行  .\refresh_photowall.ps1

$photowallDir = ".\assets\picture\photowall"
$outFile = ".\assets\text\photowall.json"

if (-not (Test-Path $photowallDir)) {
    Write-Output "错误：找不到 $photowallDir"
    exit 1
}

$files = Get-ChildItem $photowallDir -File | Where-Object {
    $_.Extension -match '\.(jpg|jpeg|png|gif|webp)$'
} | Sort-Object Name | ForEach-Object { $_.Name }

$json = ConvertTo-Json -InputObject @($files) -Compress
Set-Content $outFile -Value $json -Encoding UTF8

Write-Output "✅ 已更新 photowall.json — 共 $($files.Count) 张照片"
