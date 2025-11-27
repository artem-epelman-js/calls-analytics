# ===== ExportCalls.ps1 — устойчивое логирование + локализация статусов + upsert =====

# ---- один экземпляр ----
$mutex = New-Object System.Threading.Mutex($false, "Global\ExportCallsMutex")
if (-not $mutex.WaitOne(0)) { exit }

$ErrorActionPreference = 'SilentlyContinue'
$PSDefaultParameterValues['*:ErrorAction'] = 'SilentlyContinue'

# ---- пути/файлы ----
$microSipFolder = Join-Path $env:APPDATA "MicroSIP"
$callsFile      = Join-Path $microSipFolder "MicroSIP.ini"

function Get-ExportDirForToday {
    $now   = Get-Date
    $year  = $now.ToString('yyyy')
    $month = $now.ToString('MM')
    return (Join-Path (Join-Path (Join-Path $env:USERPROFILE "Downloads\Export") $year) $month)
}
$exportDir = Get-ExportDirForToday
if (!(Test-Path $exportDir)) { New-Item -ItemType Directory -Force -Path $exportDir | Out-Null }

$pcName      = $env:COMPUTERNAME
$monthNow    = (Get-Date).ToString('MM')
$monthlyFile = Join-Path $exportDir ("{0}-{1}-CallsLive.csv" -f $monthNow, $pcName)
$headers     = "Type;Name;Number;Time;Duration;Info"

# ---- словарь статусов (сравнение без регистра) ----
$statusMap = @{
    "busy here"                 = "Занято"
    "user busy"                 = "Занято"
    "temporarily unavailable"   = "Временно недоступен"
    "service unavailable"       = "Сервис недоступен"
    "request terminated"        = "Отменено"
    "call completed elsewhere"  = "Вызов завершен"
    "call completed"            = "Вызов завершен"
    # русские как есть (на случай разных регистров)
    "занято"                    = "Занято"
    "временно недоступен"       = "Временно недоступен"
    "сервис недоступен"         = "Сервис недоступен"
    "отменено"                  = "Отменено"
    "вызов завершен"            = "Вызов завершен"
}

function Localize-Info([string]$raw, [int]$duration){
    $txt = ($raw | ForEach-Object { $_ })  # защита от $null
    $txt = $txt.Trim()
    if ([string]::IsNullOrWhiteSpace($txt) -and $duration -gt 0) { return "Вызов завершен" }
    if (-not [string]::IsNullOrWhiteSpace($txt)) {
        $key = $txt.ToLowerInvariant()
        if ($statusMap.ContainsKey($key)) { return $statusMap[$key] }
    }
    return $txt
}

# ---- CSV утилиты ----
function Escape-CsvField([string]$s) {
    if ($null -eq $s) { return "" }
    $s = $s -replace '"','""'
    if ($s -match '[;,"\r\n]') { return '"' + $s + '"' }
    return $s
}
function Join-Csv([string[]]$Fields) { ($Fields | ForEach-Object { Escape-CsvField $_ }) -join ';' }

# Excel: принудительно текст (чтобы не было E+11 и обрезаний)
function AsExcelText([string]$s) { if ($null -eq $s) { return "''" } else { return "'" + $s } }

# ---- BOM для существующих файлов ----
function Ensure-Utf8Bom($Path) {
    try {
        if (Test-Path $Path) {
            $fs = [System.IO.File]::Open($Path, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
            $br = New-Object System.IO.BinaryReader($fs)
            $bytes = $br.ReadBytes([Math]::Min(3, $fs.Length))
            $br.Close(); $fs.Close()
            $hasBom = ($bytes.Length -eq 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF)
            if (-not $hasBom) {
                $text = Get-Content -Path $Path -Raw -Encoding UTF8
                $encBom = New-Object System.Text.UTF8Encoding($true)
                $sw = New-Object System.IO.StreamWriter($Path, $false, $encBom)
                $sw.Write($text); $sw.Close()
            }
        }
    } catch { }
}

# ---- безопасная работа с файлами ----
function Ensure-Header {
    param([string]$Path, [string]$Header)
    if (!(Test-Path $Path)) {
        $encBom = New-Object System.Text.UTF8Encoding($true)  # UTF-8 BOM
        $dir = Split-Path $Path -Parent
        if (!(Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
        $fs = [System.IO.FileStream]::new($Path, [System.IO.FileMode]::Create, [System.IO.FileAccess]::Write, [System.IO.FileShare]::ReadWrite)
        $sw = New-Object System.IO.StreamWriter($fs, $encBom)
        $sw.WriteLine($Header); $sw.Flush(); $sw.Close(); $fs.Close()
    } else {
        Ensure-Utf8Bom $Path  # добиваемся BOM у старых файлов
    }
}

function Write-LineAppend {
    param([string]$Path, [string]$Line, [int]$MaxRetries = 40, [int]$DelayMs = 200)
    $enc = New-Object System.Text.UTF8Encoding($false)  # без BOM
    for ($i=0; $i -lt $MaxRetries; $i++) {
        try {
            $fs = [System.IO.FileStream]::new(
                $Path,
                [System.IO.FileMode]::Append,
                [System.IO.FileAccess]::Write,
                [System.IO.FileShare]::ReadWrite
            )
            $sw = New-Object System.IO.StreamWriter($fs, $enc)
            $sw.WriteLine($Line)
            $sw.Flush(); $sw.Close(); $fs.Close()
            return $true
        } catch { Start-Sleep -Milliseconds $DelayMs }
    }
    return $false
}

# распаковка номера из CSV (если там стоит префикс ' для текста)
function UnwrapNumber([string]$csvField) {
    if ($null -eq $csvField) { return "" }
    if ($csvField.StartsWith("'")) { return $csvField.Substring(1) } else { return $csvField }
}

function Replace-LineIfBetter {
    <#
      Обновляет строку в CSV, если старая «хуже» (Info пуст ИЛИ Duration=0), а новая «лучше».
      Критерии «лучше»: (новый Duration > старого) ИЛИ (у старого Info пусто, а у нового не пусто).
      Возвращает $true, если заменили; иначе $false.
    #>
    param(
        [string]$Path,
        [string]$NumberRaw,     # без префиксов
        [string]$Timestamp,     # строкой
        [string]$NewLine
    )
    if (!(Test-Path $Path)) { return $false }
    $temp = "$Path.tmp"
    $changed = $false

    # читаем все линии с шарингом
    $lines = @()
    try {
        $fs = [System.IO.File]::Open($Path,
            [System.IO.FileMode]::Open,
            [System.IO.FileAccess]::Read,
            [System.IO.FileShare]::ReadWrite)
        $sr = New-Object System.IO.StreamReader($fs, [System.Text.Encoding]::UTF8, $true)
        while (-not $sr.EndOfStream) { $lines += $sr.ReadLine() }
        $sr.Close(); $fs.Close()
    } catch { return $false }

    if ($lines.Count -eq 0) { return $false }

    # первая строка — заголовок
    $out = New-Object System.Collections.Generic.List[string]
    $out.Add($lines[0])

    for ($i=1; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        $f = $line -split ';'
        if ($f.Count -ge 6) {
            $csvNumber = UnwrapNumber $f[2]
            $csvTime   = $f[3]
            if ($csvNumber -eq $NumberRaw -and $csvTime -eq $Timestamp) {
                # старая строка
                $oldDur = 0; [void][int]::TryParse(($f[4] -as [string]), [ref]$oldDur)
                $oldInfoEmpty = [string]::IsNullOrWhiteSpace($f[5])

                # новая — парсим для сравнения
                $nf = $NewLine -split ';'
                $newDur = 0; if ($nf.Count -ge 5) { [void][int]::TryParse(($nf[4] -as [string]), [ref]$newDur) }
                $newInfoEmpty = $true; if ($nf.Count -ge 6) { $newInfoEmpty = [string]::IsNullOrWhiteSpace($nf[5]) }

                $isBetter = ($newDur -gt $oldDur) -or ($oldInfoEmpty -and -not $newInfoEmpty)
                if ($isBetter) {
                    $out.Add($NewLine); $changed = $true
                } else {
                    $out.Add($line)
                }
                continue
            }
        }
        $out.Add($line)
    }

    if (-not $changed) { return $false }

    # атомарная замена файла
    try {
        $enc = New-Object System.Text.UTF8Encoding($false)
        $fsw = [System.IO.FileStream]::new($temp, [System.IO.FileMode]::Create, [System.IO.FileAccess]::Write, [System.IO.FileShare]::ReadWrite)
        $sw  = New-Object System.IO.StreamWriter($fsw, $enc)
        foreach ($l in $out) { $sw.WriteLine($l) }
        $sw.Flush(); $sw.Close(); $fsw.Close()
        Move-Item -Path $temp -Destination $Path -Force
        return $true
    } catch { return $false }
}

# ---- безопасное чтение ini (ANSI/1251 + ретраи) ----
function Read-MicroSIPFile {
    param([string]$Path, [int]$MaxRetries = 30, [int]$DelayMs = 200)
    $lines = @()
    $enc = [System.Text.Encoding]::Default  # чаще всего CP1251/ANSI
    for ($i=0; $i -lt $MaxRetries; $i++) {
        try {
            $fs = [System.IO.File]::Open($Path,
                [System.IO.FileMode]::Open,
                [System.IO.FileAccess]::Read,
                [System.IO.FileShare]::ReadWrite)
            $sr = New-Object System.IO.StreamReader($fs, $enc, $true)
            while (-not $sr.EndOfStream) { $lines += $sr.ReadLine() }
            $sr.Close(); $fs.Close()
            break
        } catch { Start-Sleep -Milliseconds $DelayMs }
    }
    return $lines
}

# ---- предзагрузка уникальности (Number+Time) из текущего месяца ----
$processedIds = @{}
Ensure-Header -Path $monthlyFile -Header $headers
Get-ChildItem -Path $exportDir -Filter "*-CallsLive.csv" | ForEach-Object {
    try {
        Get-Content $_.FullName | Select-Object -Skip 1 | ForEach-Object {
            $f = $_ -split ";"
            if ($f.Count -ge 6) {
                $numRaw = UnwrapNumber $f[2]
                $processedIds["$numRaw-$($f[3])"] = $true
            }
        }
    } catch {}
}

# ---- парсер по регулярке (Info = весь хвост) ----
$rx = '^(?<id>\d+)=(?<number1>[^;]*);(?<number2>[^;]*);(?<unknown>[^;]*);(?<ts>[^;]*);(?<duration>[^;]*);(?<info>.*)$'

# ---- основной цикл ----
while ($true) {
    try {
        if (Test-Path $callsFile) {
            $lines = Read-MicroSIPFile $callsFile | Where-Object { $_ -match "^\d+=" }

            foreach ($line in $lines) {
                $m = [regex]::Match($line, $rx)
                if (-not $m.Success) { continue }

                $id       = $m.Groups['id'      ].Value
                $number   = $m.Groups['number2' ].Value
                $name     = $number
                $rawTime  = $m.Groups['ts'      ].Value.Replace(',','.')
                $duration = $m.Groups['duration'].Value
                $infoRaw  = ($m.Groups['info'   ].Value).Trim()

                # Time -> Int64 (+ нормализация мс->сек)
                try {
                    $timestamp = [int64][double]$rawTime
                    if ($timestamp -gt 1000000000000) { $timestamp = [int64]([double]$timestamp / 1000) }
                } catch { continue }

                # «сырые» строки: Info пуст И Duration=0 — пока не пишем и не помечаем
                $durInt = 0; [void][int]::TryParse(($duration -as [string]), [ref]$durInt)
                if ([string]::IsNullOrWhiteSpace($infoRaw) -and $durInt -eq 0) { continue }

                # локализация статуса
                $info = Localize-Info -raw $infoRaw -duration $durInt

                # тип направления в этих полях MicroSIP не пишет — оставим заглушку
                $type = "in"

                # Excel-safe текст для Name/Number
                $nameTxt   = AsExcelText $name
                $numberTxt = AsExcelText $number

                # формирование CSV-строки
                $csvLine = Join-Csv @($type,$nameTxt,$numberTxt,$timestamp,$duration,$info)

                # переключение месяца «на лету»
                $exportDirToday = Get-ExportDirForToday
                if ($exportDirToday -ne $exportDir) {
                    $exportDir = $exportDirToday
                    if (!(Test-Path $exportDir)) { New-Item -ItemType Directory -Force -Path $exportDir | Out-Null }
                    $monthNow = (Get-Date).ToString('MM')
                    $monthlyFile = Join-Path $exportDir ("{0}-{1}-CallsLive.csv" -f $monthNow, $pcName)
                    Ensure-Header -Path $monthlyFile -Header $headers
                }

                # ежедневный файл по дате звонка
                $callDate  = ([datetime]'1970-01-01 00:00:00').AddSeconds($timestamp).Date
                $dailyFile = Join-Path $exportDir ("$pcName-{0}-CallsLive.csv" -f $callDate.ToString("dd.MM"))
                Ensure-Header -Path $dailyFile -Header $headers

                $key = "$number-$timestamp"
                $already = $processedIds.ContainsKey($key)

                if (-not $already) {
                    # дописываем
                    $null = Write-LineAppend -Path $dailyFile   -Line $csvLine
                    # в месячный — только если звонок этого месяца
                    $startMonth = Get-Date -Day 1 -Hour 0 -Minute 0 -Second 0
                    if (([datetime]'1970-01-01').AddSeconds($timestamp) -ge $startMonth) {
                        $null = Write-LineAppend -Path $monthlyFile -Line $csvLine
                    }
                    $processedIds[$key] = $true
                } else {
                    # апгрейд «проблемных» строк (если старая была пустая Info/Duration=0)
                    $repl1 = Replace-LineIfBetter -Path $dailyFile   -NumberRaw $number -Timestamp "$timestamp" -NewLine $csvLine
                    $repl2 = $false
                    $startMonth = Get-Date -Day 1 -Hour 0 -Minute 0 -Second 0
                    if (([datetime]'1970-01-01').AddSeconds($timestamp) -ge $startMonth) {
                        $repl2 = Replace-LineIfBetter -Path $monthlyFile -NumberRaw $number -Timestamp "$timestamp" -NewLine $csvLine
                    }
                    # processedIds не трогаем: он только блокирует дубли; обновление идёт через Replace-LineIfBetter
                }
            }
        }
    } catch { }
    Start-Sleep -Seconds 5
}
