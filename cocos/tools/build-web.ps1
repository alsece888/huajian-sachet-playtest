param([string]$CreatorPath=$env:COCOS_CREATOR_EXE)
$ErrorActionPreference='Stop'
if(-not $CreatorPath){$CreatorPath='D:\CocosCreator\3.8.8\CocosCreator.exe'}
if(-not (Test-Path -LiteralPath $CreatorPath)){throw '找不到 Cocos Creator，请通过 -CreatorPath 指定 3.8.8 的程序路径。'}
$project=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$logDir=Join-Path $project 'logs'
New-Item -ItemType Directory -Force $logDir | Out-Null
$argsList=@('--project',('"' + $project + '"'),'--build',('"configPath=' + $project + '\build-web.json"'))
$process=Start-Process -FilePath $CreatorPath -ArgumentList $argsList -WindowStyle Hidden -PassThru -Wait -RedirectStandardOutput (Join-Path $logDir 'publish.log') -RedirectStandardError (Join-Path $logDir 'publish-errors.log')
if($process.ExitCode -ne 36){throw ('Cocos 构建未成功，退出码 '+$process.ExitCode+'，请查看 logs/publish.log。')}
$html=Join-Path $project 'build/web-mobile/index.html'
$s=[IO.File]::ReadAllText($html)
$s=[regex]::Replace($s,'<title>.*?</title>','<title>花间香铺 · Cocos 试玩</title>')
$s=$s.Replace('<head>','<head><link rel="icon" href="data:,">')
[IO.File]::WriteAllText($html,$s)
Write-Output ('Cocos build success (36): '+$html)
