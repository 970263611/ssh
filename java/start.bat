set port=%1%
set token=%2%
start /b %cd%\java\jdk\bin\java -jar -Dserver.port=%port% -Dssh.token=%token% %cd%\java\ssh.jar