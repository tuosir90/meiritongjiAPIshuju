@echo off
:: 调试模式 - 显示所有命令执行过程
echo on
chcp 65001
cls

echo ========================================
echo   API费用统计系统 - 开发服务器启动工具 (调试模式)
echo ========================================
echo.

@echo off
echo [调试] 步骤1: 检查Node.js...
@echo on

where node
@echo off
set NODE_CHECK=%errorlevel%
echo [调试] Node.js检查结果: %NODE_CHECK%

if %NODE_CHECK% neq 0 (
    echo [错误] 未检测到Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

echo.
echo [调试] 步骤2: 显示Node.js版本...
@echo on
node -v
@echo off

echo.
echo [调试] 步骤3: 检查npm...
@echo on
where npm
@echo off
set NPM_CHECK=%errorlevel%
echo [调试] npm检查结果: %NPM_CHECK%

if %NPM_CHECK% neq 0 (
    echo [错误] 未检测到npm
    pause
    exit /b 1
)

echo.
echo [调试] 步骤4: 显示npm版本...
@echo on
npm -v
@echo off

echo.
echo [调试] 步骤5: 检查当前目录...
echo 当前目录: %CD%
dir /b

echo.
echo [调试] 步骤6: 检查node_modules...
if exist "node_modules" (
    echo [信息] node_modules 存在
) else (
    echo [信息] node_modules 不存在，需要安装依赖
    echo.
    echo [调试] 步骤7: 安装依赖...
    @echo on
    npm install
    @echo off
    set INSTALL_RESULT=%errorlevel%
    echo [调试] 安装结果代码: %INSTALL_RESULT%
    if %INSTALL_RESULT% neq 0 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
)

echo.
echo [调试] 步骤8: 检查package.json中的dev命令...
type package.json | findstr "dev"

echo.
echo ========================================
echo   即将启动开发服务器
echo ========================================
echo.
echo 按任意键继续...
pause >nul

echo.
echo [调试] 步骤9: 启动开发服务器...
@echo on
npm run dev
@echo off

set DEV_RESULT=%errorlevel%
echo.
echo [调试] 开发服务器退出代码: %DEV_RESULT%
echo.
pause
