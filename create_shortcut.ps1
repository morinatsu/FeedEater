$WshShell = New-Object -comObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$Shortcut = $WshShell.CreateShortcut("$DesktopPath\Launch FeedEater.lnk")
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-WindowStyle Hidden -Command `"cd 'C:\Users\morinatsu\projects\FeedEater'; npm run dev`""
$Shortcut.WorkingDirectory = "C:\Users\morinatsu\projects\FeedEater"
$Shortcut.IconLocation = "powershell.exe,0"
$Shortcut.Save()
