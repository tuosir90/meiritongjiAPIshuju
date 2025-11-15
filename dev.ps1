# API费用统计系统 - 开发服务器启动脚本 (PowerShell)

# 设置控制台编码为 UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  API费用统计系统 - 开发服务器" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Node.js
Write-Host "[检查] Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node -v 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[成功] Node.js 版本: $nodeVersion" -ForegroundColor Green
    } else {
        throw "Node.js 未安装"
    }
} catch {
    Write-Host "[错误] 未检测到 Node.js" -ForegroundColor Red
    Write-Host "请访问 https://nodejs.org/ 下载安装" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "按回车键退出"
    exit 1
}

# 检查 npm
Write-Host "[检查] npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm -v 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[成功] npm 版本: $npmVersion" -ForegroundColor Green
    } else {
        throw "npm 未安装"
    }
} catch {
    Write-Host "[错误] 未检测到 npm" -ForegroundColor Red
    Write-Host ""
    Read-Host "按回车键退出"
    exit 1
}

Write-Host ""

# 检查依赖
if (-not (Test-Path "node_modules")) {
    Write-Host "[提示] 首次运行，正在安装依赖..." -ForegroundColor Yellow
    Write-Host ""

    npm install

    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "[错误] 依赖安装失败" -ForegroundColor Red
        Write-Host ""
        Read-Host "按回车键退出"
        exit 1
    }

    Write-Host ""
    Write-Host "[成功] 依赖安装完成" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "[信息] 依赖已安装" -ForegroundColor Green
    Write-Host ""
}

# 启动开发服务器
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  正在启动开发服务器..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "服务器地址: " -NoNewline
Write-Host "http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "提示:" -ForegroundColor Yellow
Write-Host "  - 按 Ctrl+C 可停止服务器" -ForegroundColor Gray
Write-Host "  - 修改代码后会自动热重载" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 启动服务器
npm run dev

# 服务器退出
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  服务器已停止" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($LASTEXITCODE -ne 0) {
    Write-Host "[错误] 服务器异常退出，错误代码: $LASTEXITCODE" -ForegroundColor Red
} else {
    Write-Host "[信息] 服务器正常退出" -ForegroundColor Green
}

Write-Host ""
Read-Host "按回车键退出"
