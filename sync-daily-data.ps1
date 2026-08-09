# 每日数据同步脚本：PowerShell 包装器
# 实际逻辑由 sync-daily-data.js 实现

param(
    [switch]$SkipGit,
    [switch]$SkipPush
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$repoRoot = $PSScriptRoot
$jsScript = Join-Path $repoRoot "sync-daily-data.js"

# 构建参数
$nodeArgs = @($jsScript)
if ($SkipGit) { $nodeArgs += "--skip-git" }
if ($SkipPush) { $nodeArgs += "--skip-push" }

# 调用 Node.js 脚本
node @nodeArgs
exit $LASTEXITCODE
