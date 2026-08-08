param([int]$Port = 8000)

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

function Get-Mime($ext) {
  switch ($ext) {
    '.html' { 'text/html; charset=utf-8' }
    '.css' { 'text/css; charset=utf-8' }
    '.js' { 'application/javascript; charset=utf-8' }
    '.json' { 'application/json; charset=utf-8' }
    '.webmanifest' { 'application/manifest+json; charset=utf-8' }
    '.png' { 'image/png' }
    '.svg' { 'image/svg+xml' }
    '.ico' { 'image/x-icon' }
    default { 'application/octet-stream' }
  }
}

function Send-Response($stream, $status, $mime, $bodyBytes) {
  $head = "HTTP/1.1 $status`r`nContent-Type: $mime`r`nContent-Length: $($bodyBytes.Length)`r`nConnection: close`r`nCache-Control: no-cache`r`n`r`n"
  $headBytes = [System.Text.Encoding]::ASCII.GetBytes($head)
  $stream.Write($headBytes, 0, $headBytes.Length)
  if ($bodyBytes.Length -gt 0) { $stream.Write($bodyBytes, 0, $bodyBytes.Length) }
  $stream.Flush()
}

$listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Any, $Port)
try {
  $listener.Start()
} catch {
  Write-Host "Nie udalo sie wystartowac serwera na porcie $Port (port zajety?)."
  Write-Host "Zamknij inne programy uzywajace portu 8000 albo zmien port."
  exit 1
}

Write-Host "Serwer dziala."
Write-Host "Na tym komputerze:  http://localhost:$Port"
Write-Host ""
Write-Host "Na telefonie (ta sama siec WiFi) uzyj jednego z adresow:"
Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notlike '169.254*' -and $_.IPAddress -notlike '127.*' } | ForEach-Object {
  Write-Host ("  http://{0}:{1}" -f $_.IPAddress, $Port)
}
Write-Host ""
Write-Host "Pierwsze uruchomienie moze zapytac Zapory (Firewall) - zezwol." 
Write-Host "Zamykanie serwera: Ctrl+C"
Write-Host ""

try {
  while ($true) {
    $client = $listener.AcceptTcpClient()
    try {
      $client.NoDelay = $true
      $stream = $client.GetStream()
      $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::ASCII)
      $requestLine = $reader.ReadLine()
      if ($null -ne $requestLine -and $requestLine -match '^GET\s+(\S+)') {
        $path = $Matches[1]
        $path = $path.Split('?')[0]
        try { $path = [System.Uri]::UnescapeDataString($path) } catch {}
        if ($path -eq '/' -or $path -eq '') { $path = '/index.html' }
        $rel = $path.TrimStart('/').Replace('/', [IO.Path]::DirectorySeparatorChar)
        $file = Join-Path $root $rel
        if (Test-Path -LiteralPath $file -PathType Leaf) {
          $bytes = [IO.File]::ReadAllBytes($file)
          $mime = Get-Mime ([IO.Path]::GetExtension($file).ToLower())
          Send-Response $stream '200 OK' $mime $bytes
        } else {
          $body = [System.Text.Encoding]::UTF8.GetBytes('Not found')
          Send-Response $stream '404 Not Found' 'text/plain' $body
        }
      } else {
        $body = [System.Text.Encoding]::UTF8.GetBytes('OK')
        Send-Response $stream '200 OK' 'text/plain' $body
      }
      $stream.Close()
    } catch {
      try { $stream.Close() } catch {}
    }
    $client.Close()
  }
} finally {
  $listener.Stop()
}
