Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

' 获取脚本所在目录
strScriptPath = objFSO.GetParentFolderName(WScript.ScriptFullName)

' 切换到项目目录并启动开发服务器
objShell.CurrentDirectory = strScriptPath
objShell.Run "cmd /k npm run dev", 1, False

Set objShell = Nothing
Set objFSO = Nothing
