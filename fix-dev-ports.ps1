<#
.SYNOPSIS
  Sblocca le porte di sviluppo MedWork (5173 frontend Vite, 5279 backend Kestrel) quando
  Windows/Docker/WSL le ha riservate come "excluded port range".

.DESCRIPTION
  Su Windows Hyper-V/WSL/Docker (servizio HNS + driver NAT "winnat") riservano a blocchi di
  100 porte prese dal "dynamic port range". Se 5173 o 5279 finiscono dentro uno di quei
  blocchi, QUALSIASI processo (anche amministratore) non riesce piu' a fare bind:

    - Node/Vite : Error: listen EACCES: permission denied 127.0.0.1:5173
    - Kestrel   : System.Net.Sockets.SocketException (10013) ... at Socket.DoBind(...)

  Questo script richiede i privilegi di amministratore (UAC) e:
    1. verifica lo stato attuale delle porte;
    2. aggiunge 5173 e 5279 come esclusioni persistenti (IPv4 + IPv6), in modo che HNS
       non possa piu' includerle nei propri blocchi riservati;
    3. riavvia il driver NAT (winnat) per rilasciare le riserve correnti;
    4. verifica che le porte siano di nuovo bindabili.

  Nota: il riavvio di winnat puo' interrompere temporaneamente il port-forwarding dei
  container Docker. Se serve, riavvia Docker Desktop al termine.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\fix-dev-ports.ps1
#>
[CmdletBinding()]
param(
    [int[]]$Ports = @(5173, 5279),

    # Solo diagnosi (nessun privilegio richiesto): stampa lo stato delle porte e
    # restituisce exit code 0 se utilizzabili, 1 se bloccate dal sistema operativo.
    [switch]$CheckOnly
)

$ErrorActionPreference = 'Continue'

$root = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
$logDir = Join-Path $root 'logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$logFile = Join-Path $logDir 'fix-dev-ports.log'

function Write-Log {
    param([string]$Message, [string]$Level = 'INFO')
    $line = '{0} [{1}] {2}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Level, $Message
    Write-Host $line
    Add-Content -Path $logFile -Value $line -Encoding UTF8
}

function Test-PortInUse {
    param([int]$Port)
    $listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    return [bool]$listener
}

function Test-PortBindable {
    param([int]$Port)
    foreach ($address in @([System.Net.IPAddress]::Loopback, [System.Net.IPAddress]::IPv6Loopback)) {
        try {
            $listener = [System.Net.Sockets.TcpListener]::new($address, $Port)
            $listener.Start()
            $listener.Stop()
        } catch {
            return $false
        }
    }
    return $true
}

# Una porta e' "utilizzabile" se il server di sviluppo la sta gia' usando oppure
# se un nuovo bind su loopback IPv4/IPv6 ha successo.
function Test-PortUsable {
    param([int]$Port)
    if (Test-PortInUse -Port $Port) { return $true }
    return (Test-PortBindable -Port $Port)
}

if ($CheckOnly) {
    $blockedPorts = @()
    foreach ($port in $Ports) {
        if (Test-PortUsable -Port $port) {
            Write-Host "  porta $port : OK" -ForegroundColor Green
        } else {
            Write-Host "  porta $port : BLOCCATA da Windows (excluded port range)" -ForegroundColor Red
            $blockedPorts += $port
        }
    }

    if ($blockedPorts.Count -eq 0) {
        exit 0
    }

    Write-Host ''
    Write-Host "ATTENZIONE: $($blockedPorts -join ', ') non possono essere aperte da nessun processo." -ForegroundColor Red
    Write-Host "Causa: Hyper-V / WSL / Docker (servizio HNS + driver winnat) hanno riservato queste porte" -ForegroundColor Red
    Write-Host '       prendendole dal dynamic port range di Windows.' -ForegroundColor Red
    Write-Host 'Effetti: Vite -> "Error: listen EACCES: permission denied 127.0.0.1:5173"' -ForegroundColor Red
    Write-Host '         Kestrel -> "SocketException (10013)" durante il bind.' -ForegroundColor Red
    Write-Host ''
    Write-Host 'Rimedio (una tantum, richiede conferma UAC):' -ForegroundColor Yellow
    Write-Host "  powershell -ExecutionPolicy Bypass -File `"$(Join-Path $root 'fix-dev-ports.ps1')`"" -ForegroundColor Yellow
    exit 1
}

$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host ''
    Write-Host 'MedWork - Fix porte di sviluppo (5173 / 5279)' -ForegroundColor Cyan
    Write-Host 'Servono i privilegi di amministratore: apro la richiesta UAC...' -ForegroundColor Yellow
    Write-Log 'Avvio senza privilegi di amministratore: richiesta elevazione UAC...' 'WARN'
    try {
        Start-Process -FilePath 'powershell.exe' -Verb RunAs -ArgumentList @(
            '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', "`"$PSCommandPath`""
        ) | Out-Null
        Write-Host 'Accetta la richiesta UAC: l''esito verra'' scritto in logs\fix-dev-ports.log' -ForegroundColor Green
    } catch {
        Write-Host "Impossibile elevare i privilegi: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host 'Esegui questo script da una PowerShell aperta come amministratore.' -ForegroundColor Red
    }
    return
}

Write-Log 'Verifica stato porte...'
$blocked = @()
foreach ($port in $Ports) {
    if (Test-PortUsable -Port $port) {
        Write-Log "porta $port : utilizzabile"
    } else {
        Write-Log "porta $port : BLOCCATA (excluded port range riservata da HNS/winnat)" 'WARN'
        $blocked += $port
    }
}

if ($blocked.Count -eq 0) {
    Write-Log 'Nessuna azione necessaria: le porte sono gia'' libere.' 
    Write-Log 'RESULT=OK'
    return
}

try {
    Write-Log 'Arresto del driver NAT (winnat) per rilasciare le riserve Hyper-V/WSL/Docker...'
    & net stop winnat 2>&1 | ForEach-Object { Write-Log "  $_" }

    foreach ($port in $blocked) {
        foreach ($family in @('ipv4', 'ipv6')) {
            $output = & netsh interface $family add excludedportrange protocol=tcp startport=$port numberofports=1 persistent 2>&1
            Write-Log "netsh $family add excludedportrange $port -> $(($output | Out-String).Trim())"
        }
    }
} finally {
    Write-Log 'Riavvio del driver NAT (winnat)...'
    & net start winnat 2>&1 | ForEach-Object { Write-Log "  $_" }
}

Start-Sleep -Seconds 2

$stillBlocked = @()
foreach ($port in $Ports) {
    if (Test-PortUsable -Port $port) {
        Write-Log "porta $port : utilizzabile"
    } else {
        Write-Log "porta $port : ANCORA BLOCCATA" 'ERROR'
        $stillBlocked += $port
    }
}

if ($stillBlocked.Count -eq 0) {
    Write-Log 'RESULT=OK'
    if (Get-Service -Name 'com.docker.service' -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq 'Running' }) {
        Write-Log 'Suggerimento: riavvia Docker Desktop se i container non ricevono piu'' traffico sulle porte pubblicate.' 'WARN'
    }
} else {
    Write-Log "RESULT=FAIL porte bloccate: $($stillBlocked -join ', ')" 'ERROR'
    Write-Log 'Rimedio alternativo (da PowerShell amministratore):' 'ERROR'
    Write-Log '  netsh int ipv4 set dynamicport tcp start=49152 num=16384' 'ERROR'
    Write-Log '  net stop winnat; net start winnat' 'ERROR'
}
