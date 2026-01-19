# 每日数据同步脚本：自动补齐未同步日期并更新版本号

param(
    [switch]$SkipGit,
    [switch]$SkipPush
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$ErrorActionPreference = "Stop"

$repoRoot = $PSScriptRoot
$dailyFile = Join-Path $repoRoot "每日数据整理.md"
$dataFile = Join-Path $repoRoot "public/initial-data.json"

function Convert-DateToIso {
    param([string]$line)
    $match = [regex]::Match($line, '日期[:：]\s*(\d{4})\.(\d{1,2})\.(\d{1,2})')
    if (-not $match.Success) {
        return $null
    }
    $year = $match.Groups[1].Value
    $month = $match.Groups[2].Value.PadLeft(2, '0')
    $day = $match.Groups[3].Value.PadLeft(2, '0')
    return "$year-$month-$day"
}

function Get-DecimalValue {
    param(
        [string]$line,
        [string]$pattern
    )
    $match = [regex]::Match($line, $pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    if (-not $match.Success) {
        return $null
    }
    return [decimal]::Parse($match.Groups[1].Value, [System.Globalization.CultureInfo]::InvariantCulture)
}

function Get-IntValue {
    param(
        [string]$line,
        [string]$pattern
    )
    $match = [regex]::Match($line, $pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    if (-not $match.Success) {
        return $null
    }
    return [int]$match.Groups[1].Value
}

function Increment-Version {
    param([string]$version)
    $parts = $version -split '\.'
    if ($parts.Length -lt 2) {
        throw "版本号格式错误：$version"
    }
    $lastIndex = $parts.Length - 1
    $lastValue = 0
    if (-not [int]::TryParse($parts[$lastIndex], [ref]$lastValue)) {
        throw "版本号格式错误：$version"
    }
    $parts[$lastIndex] = ($lastValue + 1).ToString()
    return ($parts -join '.')
}

if (-not (Test-Path $dailyFile)) {
    Write-Host "[错误] 未找到文件：$dailyFile" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $dataFile)) {
    Write-Host "[错误] 未找到文件：$dataFile" -ForegroundColor Red
    exit 1
}

$lines = Get-Content -Path $dailyFile
$parsedByDate = @{}
$warnings = New-Object System.Collections.Generic.List[string]

foreach ($line in $lines) {
    $trimmed = $line.Trim()
    if ([string]::IsNullOrWhiteSpace($trimmed)) {
        continue
    }

    $date = Convert-DateToIso $trimmed
    if (-not $date) {
        continue
    }

    $volc = Get-DecimalValue $trimmed '火山引擎消费\s*([\d.]+)\s*元'
    $yunwu = Get-DecimalValue $trimmed '云雾\s*api\s*消费\s*([\d.]+)\s*元'
    $tangguo = Get-DecimalValue $trimmed '糖果姐姐\s*api\s*消费\s*([\d.]+)\s*元'
    $count = Get-IntValue $trimmed '总生图数\s*(\d+)\s*张'

    if ($null -in @($volc, $yunwu, $tangguo, $count)) {
        $warnings.Add("日期 $date 数据不完整，已跳过")
        continue
    }

    $total = [Math]::Round(($volc + $yunwu + $tangguo), 2)
    $record = [ordered]@{
        id = "$date-1"
        date = $date
        apiCosts = @(
            [ordered]@{ apiId = "volcengine"; cost = [double]$volc }
            [ordered]@{ apiId = "yunwu"; cost = [double]$yunwu }
            [ordered]@{ apiId = "tangguo"; cost = [double]$tangguo }
        )
        imageCount = [int]$count
        totalCost = [double]$total
    }

    if ($parsedByDate.ContainsKey($date)) {
        $warnings.Add("日期 $date 重复出现，已覆盖旧记录")
    }
    $parsedByDate[$date] = $record
}

$data = Get-Content -Raw -Path $dataFile -Encoding UTF8 | ConvertFrom-Json
$existingDates = @{}
foreach ($record in $data.records) {
    $existingDates[$record.date] = $true
}

$missing = @()
foreach ($record in $parsedByDate.Values) {
    if (-not $existingDates.ContainsKey($record.date)) {
        $missing += $record
    }
}

if ($missing.Count -eq 0) {
    Write-Host "[信息] 未发现需要同步的数据" -ForegroundColor Yellow
    if ($warnings.Count -gt 0) {
        Write-Host "[警告] 解析过程中发现以下问题：" -ForegroundColor Yellow
        $warnings | ForEach-Object { Write-Host " - $_" -ForegroundColor Yellow }
    }
    exit 0
}

$missing = $missing | Sort-Object date -Descending
$data.records = @($missing + $data.records) | Sort-Object date -Descending
$data.version = Increment-Version $data.version
$data.lastUpdated = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

$updatedJson = $data | ConvertTo-Json -Depth 10
Set-Content -Path $dataFile -Value $updatedJson -Encoding UTF8

$addedDates = ($missing | ForEach-Object { $_.date }) -join ", "
Write-Host "[成功] 已同步 $($missing.Count) 条记录：$addedDates" -ForegroundColor Green
Write-Host "[成功] 版本号更新为：$($data.version)" -ForegroundColor Green

if ($warnings.Count -gt 0) {
    Write-Host "[警告] 解析过程中发现以下问题：" -ForegroundColor Yellow
    $warnings | ForEach-Object { Write-Host " - $_" -ForegroundColor Yellow }
}

if (-not $SkipGit) {
    git add public/initial-data.json
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[错误] git add 失败" -ForegroundColor Red
        exit 1
    }

    $commitTitle = if ($missing.Count -eq 1) {
        "chore: 更新数据到 v$($data.version) - 添加$($missing[0].date)记录"
    } else {
        "chore: 更新数据到 v$($data.version) - 添加$($missing[0].date)等$($missing.Count)条记录"
    }

    $commitBody = "🤖 Generated with [Claude Code](https://claude.com/claude-code)`n`nCo-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
    git commit -m $commitTitle -m $commitBody
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[错误] git commit 失败" -ForegroundColor Red
        exit 1
    }

    if (-not $SkipPush) {
        git push
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[错误] git push 失败" -ForegroundColor Red
            exit 1
        }
    }
}

