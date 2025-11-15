@echo off
chcp 65001 >nul
cls

:menu
cls
echo ╔════════════════════════════════════════════╗
echo ║   API费用统计系统 - 项目管理工具           ║
echo ╚════════════════════════════════════════════╝
echo.
echo  请选择操作:
echo.
echo  [1] 启动开发服务器 (npm run dev)
echo  [2] 构建生产版本 (npm run build)
echo  [3] 预览构建结果 (npx serve out)
echo  [4] 安装/更新依赖 (npm install)
echo  [5] 运行代码检查 (npm run lint)
echo  [6] 清理构建产物 (删除out目录)
echo  [7] 清理并重新安装依赖
echo  [0] 退出
echo.
echo ════════════════════════════════════════════
echo.

set /p choice=请输入选项 (0-7):

if "%choice%"=="1" goto dev
if "%choice%"=="2" goto build
if "%choice%"=="3" goto preview
if "%choice%"=="4" goto install
if "%choice%"=="5" goto lint
if "%choice%"=="6" goto clean_out
if "%choice%"=="7" goto clean_all
if "%choice%"=="0" goto end

echo [错误] 无效的选项，请重新选择
timeout /t 2 >nul
goto menu

:dev
cls
echo ════════════════════════════════════════════
echo   启动开发服务器
echo ════════════════════════════════════════════
echo.

:: 检查Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到Node.js
    echo 请访问 https://nodejs.org/ 下载安装
    pause
    goto menu
)

:: 检查依赖
if not exist "node_modules" (
    echo [提示] 首次运行，正在安装依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] 依赖安装失败
        pause
        goto menu
    )
)

echo [信息] 服务器地址: http://localhost:3000
echo [提示] 按 Ctrl+C 停止服务器
echo.
call npm run dev
pause
goto menu

:build
cls
echo ════════════════════════════════════════════
echo   构建生产版本
echo ════════════════════════════════════════════
echo.

if not exist "node_modules" (
    echo [提示] 需要先安装依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] 依赖安装失败
        pause
        goto menu
    )
)

echo [信息] 开始构建...
call npm run build
if %errorlevel% equ 0 (
    echo.
    echo [成功] 构建完成！输出目录: ./out
    echo.
    echo 提示: 可以选择选项[3]预览构建结果
) else (
    echo.
    echo [错误] 构建失败
)
echo.
pause
goto menu

:preview
cls
echo ════════════════════════════════════════════
echo   预览构建结果
echo ════════════════════════════════════════════
echo.

if not exist "out" (
    echo [错误] 未找到构建产物
    echo 请先执行选项[2]进行构建
    pause
    goto menu
)

echo [信息] 启动静态服务器...
echo [信息] 预览地址: http://localhost:3000
echo [提示] 按 Ctrl+C 停止服务器
echo.
npx serve out
pause
goto menu

:install
cls
echo ════════════════════════════════════════════
echo   安装/更新依赖
echo ════════════════════════════════════════════
echo.

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到npm
    pause
    goto menu
)

echo [信息] 正在安装依赖...
call npm install
if %errorlevel% equ 0 (
    echo.
    echo [成功] 依赖安装完成
) else (
    echo.
    echo [错误] 依赖安装失败
)
echo.
pause
goto menu

:lint
cls
echo ════════════════════════════════════════════
echo   运行代码检查
echo ════════════════════════════════════════════
echo.

if not exist "node_modules" (
    echo [提示] 需要先安装依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] 依赖安装失败
        pause
        goto menu
    )
)

echo [信息] 正在检查代码...
call npm run lint
if %errorlevel% equ 0 (
    echo.
    echo [成功] 代码检查通过
) else (
    echo.
    echo [警告] 发现代码问题，请查看上方输出
)
echo.
pause
goto menu

:clean_out
cls
echo ════════════════════════════════════════════
echo   清理构建产物
echo ════════════════════════════════════════════
echo.

if not exist "out" (
    echo [信息] 未找到out目录，无需清理
    pause
    goto menu
)

echo [警告] 即将删除out目录
set /p confirm=确认删除? (y/n):
if /i "%confirm%" neq "y" (
    echo [取消] 已取消操作
    pause
    goto menu
)

echo [信息] 正在删除out目录...
rmdir /s /q "out"
if %errorlevel% equ 0 (
    echo [成功] 清理完成
) else (
    echo [错误] 清理失败
)
echo.
pause
goto menu

:clean_all
cls
echo ════════════════════════════════════════════
echo   清理并重新安装依赖
echo ════════════════════════════════════════════
echo.

echo [警告] 即将删除 node_modules 和 out 目录
echo [警告] 然后重新安装依赖
echo.
set /p confirm=确认执行? (y/n):
if /i "%confirm%" neq "y" (
    echo [取消] 已取消操作
    pause
    goto menu
)

echo.
echo [信息] 正在删除node_modules...
if exist "node_modules" (
    rmdir /s /q "node_modules"
)

echo [信息] 正在删除out...
if exist "out" (
    rmdir /s /q "out"
)

echo [信息] 正在重新安装依赖...
call npm install
if %errorlevel% equ 0 (
    echo.
    echo [成功] 重新安装完成
) else (
    echo.
    echo [错误] 安装失败
)
echo.
pause
goto menu

:end
cls
echo.
echo 感谢使用！
echo.
timeout /t 1 >nul
exit /b 0
