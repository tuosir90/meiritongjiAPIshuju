@echo off
title API费用统计系统 - 开发服务器
color 0A

echo ========================================
echo   API费用统计系统
echo   开发服务器启动工具
echo ========================================
echo.

:: 检查 Node.js
node -v >nul 2>&1
if errorlevel 1 (
    color 0C
    echo [错误] 未检测到 Node.js
    echo.
    echo 请访问以下地址下载安装:
    echo https://nodejs.org/
    echo.
    pause
    exit
)

echo [信息] Node.js 版本:
node -v
echo.

:: 检查 npm
npm -v >nul 2>&1
if errorlevel 1 (
    color 0C
    echo [错误] 未检测到 npm
    echo.
    pause
    exit
)

echo [信息] npm 版本:
npm -v
echo.

:: 检查依赖
if not exist "node_modules\" (
    echo [提示] 首次运行，正在安装依赖...
    echo.
    npm install
    if errorlevel 1 (
        color 0C
        echo.
        echo [错误] 依赖安装失败
        echo.
        pause
        exit
    )
    echo.
    echo [成功] 依赖安装完成
    echo.
)

:: 启动服务器
echo ========================================
echo   正在启动开发服务器...
echo ========================================
echo.
echo 服务器地址: http://localhost:3000
echo.
echo 提示: 按 Ctrl+C 停止服务器
echo.
echo ========================================
echo.

npm run dev

echo.
echo.
echo ========================================
echo   服务器已停止
echo ========================================
echo.
pause
