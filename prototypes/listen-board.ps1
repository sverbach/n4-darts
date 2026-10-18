<#
  Throwaway prototype: is the Autodarts Board Manager's local API usable?

  Probes the HTTP API, then connects to the WebSocket and prints every
  message it receives. Throw some darts, pull them out, and watch.

  Run on the board laptop:
    powershell -ExecutionPolicy Bypass -File .\listen-board.ps1

  Run from another machine to test LAN access:
    powershell -ExecutionPolicy Bypass -File .\listen-board.ps1 -BoardHost 192.168.1.50

  Stop with Ctrl+C. Raw messages are also saved to the log file (one per line).
#>
param(
    [string]$BoardHost = "localhost",
    [int]$Port = 3180,
    [string]$LogFile = (Join-Path $PSScriptRoot "board-events.log")
)

$ErrorActionPreference = "Stop"
$base = "${BoardHost}:${Port}"

Write-Host "== HTTP probe on http://$base" -ForegroundColor Cyan
foreach ($path in "/api/state", "/api/config", "/api/version") {
    try {
        $res = Invoke-WebRequest "http://$base$path" -UseBasicParsing -TimeoutSec 3
        Write-Host "[OK $($res.StatusCode)] $path" -ForegroundColor Green
        Write-Host "  $($res.Content)"
    } catch {
        Write-Host "[--] $path : $($_.Exception.Message)" -ForegroundColor DarkYellow
    }
}

Write-Host "`n== WebSocket" -ForegroundColor Cyan
$ws = $null
foreach ($path in "/api/events", "/api/ws", "/ws") {
    $candidate = New-Object System.Net.WebSockets.ClientWebSocket
    try {
        $candidate.ConnectAsync([Uri]"ws://$base$path", [Threading.CancellationToken]::None).Wait(5000) | Out-Null
        if ($candidate.State -eq "Open") { $ws = $candidate; Write-Host "[OK] connected to ws://$base$path" -ForegroundColor Green; break }
        Write-Host "[--] $path : state $($candidate.State)" -ForegroundColor DarkYellow
    } catch {
        Write-Host "[--] $path : $($_.Exception.GetBaseException().Message)" -ForegroundColor DarkYellow
    }
    $candidate.Dispose()
}
if (-not $ws) { Write-Host "No WebSocket endpoint found. Is the Board Manager running?" -ForegroundColor Red; exit 1 }

Write-Host "Listening... throw some darts. Logging to $LogFile. Ctrl+C to stop.`n"
$buffer = New-Object byte[] 65536
$segment = New-Object ArraySegment[byte] -ArgumentList (, $buffer)

try {
    while ($ws.State -eq "Open") {
        # Messages can span several frames; collect until EndOfMessage.
        $stream = New-Object System.IO.MemoryStream
        do {
            $task = $ws.ReceiveAsync($segment, [Threading.CancellationToken]::None)
            while (-not $task.Wait(500)) { }  # short waits so Ctrl+C gets through
            $result = $task.Result
            $stream.Write($buffer, 0, $result.Count)
        } while (-not $result.EndOfMessage)

        if ($result.MessageType -eq "Close") { Write-Host "Server closed the connection." -ForegroundColor Red; break }

        $text = [Text.Encoding]::UTF8.GetString($stream.ToArray())
        $stamp = Get-Date -Format "HH:mm:ss.fff"
        Write-Host "[$stamp] " -NoNewline -ForegroundColor Gray
        Write-Host $text
        Add-Content -Path $LogFile -Value "$stamp $text" -Encoding UTF8
    }
} finally {
    $ws.Dispose()
}
