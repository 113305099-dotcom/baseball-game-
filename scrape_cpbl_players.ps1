# Scrape CPBL player bio data
# Uses label-based parsing (robust against varying CSS class names)

$ErrorActionPreference = "Continue"
$outputFile = "C:\Users\user\Documents\Codex\2026-05-11\files-mentioned-by-the-user-game-2\cpbl_player_bios.json"

Write-Host "=== CPBL Player Bio Scraper ==="

# Step 1: Fetch player listing to build name→acnt map
Write-Host "[1/3] Fetching player listing..."
$listPage = Invoke-WebRequest -Uri "https://cpbl.com.tw/player" -UseBasicParsing -TimeoutSec 30
$acntPattern = '/team/person\?acnt=([0-9]+)"[^>]*>([^<]+)</a>'
$acntMatches = [regex]::Matches($listPage.Content, $acntPattern)
$cpblMap = @{}
foreach ($m in $acntMatches) {
    $acnt = $m.Groups[1].Value
    $name = $m.Groups[2].Value.Trim()
    if (-not $cpblMap.ContainsKey($name)) {
        $cpblMap[$name] = $acnt
    }
}
Write-Host "  Found $($cpblMap.Count) players on CPBL listing"

# Step 2: Get game player names from data.js
Write-Host "[2/3] Extracting game player names from data.js..."
$dataContent = Get-Content 'C:\Users\user\Documents\Codex\2026-05-11\files-mentioned-by-the-user-game-2\data.js' -Raw -Encoding UTF8
$gamePlayers = @{}

if ($dataContent -match 'const CPBL_BATTER_STATS_2025 = (\[[\s\S]*?\]);') {
    $batters = $Matches[1] | ConvertFrom-Json
    foreach ($b in $batters) { $gamePlayers[$b.name] = $true }
}
if ($dataContent -match 'const CPBL_PITCHER_STATS_2025 = (\[[\s\S]*?\]);') {
    $pitchers = $Matches[1] | ConvertFrom-Json
    foreach ($p in $pitchers) { $gamePlayers[$p.name] = $true }
}
Write-Host "  $($gamePlayers.Count) unique players in game"

# Cross-reference
$toScrape = @{}
$notFound = @()
foreach ($name in $gamePlayers.Keys) {
    if ($cpblMap.ContainsKey($name)) {
        $toScrape[$name] = $cpblMap[$name]
    } else {
        $notFound += $name
    }
}
Write-Host "  $($toScrape.Count) matched, $($notFound.Count) not found"

# Step 3: Scrape individual player pages
Write-Host "[3/3] Scraping $($toScrape.Count) player bio pages..."
$results = [ordered]@{}
$count = 0
$total = $toScrape.Count
$errors = @()

foreach ($entry in $toScrape.GetEnumerator()) {
    $name = $entry.Key
    $acnt = $entry.Value
    $count++

    if ($count % 25 -eq 0 -or $count -eq 1) {
        Write-Host "  $count / $total ($([math]::Round($count * 100 / $total))%)"
    }

    try {
        $page = Invoke-WebRequest -Uri "https://cpbl.com.tw/team/person?acnt=$acnt" -UseBasicParsing -TimeoutSec 15
        $html = $page.Content

        # Extract PlayerBrief section for more reliable parsing
        $brief = $html
        if ($html -match '<div class="PlayerBrief">([\s\S]*?)</div>\s*<div class="Tab">') {
            $brief = $matches[1]
        }

        # Photo URL
        $imageUrl = ""
        if ($html -match '<div class="img">\s*<span style="background-image:\s*url\(([^)]+)\)') {
            $img = $matches[1].Trim()
            if ($img -match '^/files/') { $imageUrl = "https://cpbl.com.tw$img" }
            elseif ($img -notmatch '^https?://') { $imageUrl = "https://cpbl.com.tw$img" }
            else { $imageUrl = $img }
        }

        # Team
        $team = ""
        if ($brief -match '<div class="team">([^<]+)</div>') { $team = $matches[1].Trim() }

        # Position (label-based)
        $position = ""
        if ($brief -match '位置[^<]*</div>\s*<div class="desc">([^<]+)</div>') { $position = $matches[1].Trim() }

        # Bats/Throws (label-based, handles both b_t and bt_tw class names)
        $batsThrows = ""
        if ($brief -match '投打習慣[^<]*</div>\s*<div class="desc">([^<]+)</div>') { $batsThrows = $matches[1].Trim() }

        # Height/Weight
        $heightCm = 0
        $weightKg = 0
        if ($brief -match '身高/體重[^<]*</div>\s*<div class="desc">(\d+)<span[^>]*>\(CM\)</span>\s*/\s*(\d+)<span[^>]*>\(KG\)</span>') {
            $heightCm = [int]$matches[1]
            $weightKg = [int]$matches[2]
        }

        # Birthdate
        $birthDate = ""
        if ($brief -match '生日[^<]*</div>\s*<div class="desc">(\d{4}/\d{2}/\d{2})</div>') { $birthDate = $matches[1].Trim() }

        # Parse bats/throws
        $bats = ""
        $throws = ""
        if ($batsThrows) {
            if ($batsThrows -match '右投右打') { $throws = 'R'; $bats = 'R' }
            elseif ($batsThrows -match '左投左打') { $throws = 'L'; $bats = 'L' }
            elseif ($batsThrows -match '右投左打') { $throws = 'R'; $bats = 'L' }
            elseif ($batsThrows -match '左投右打') { $throws = 'L'; $bats = 'R' }
            elseif ($batsThrows -match '右投') { $throws = 'R' }
            elseif ($batsThrows -match '左投') { $throws = 'L' }
            if (-not $bats) { if ($batsThrows -match '左打') { $bats = 'L' } else { $bats = 'R' } }
            if (-not $throws) { if ($batsThrows -match '左投') { $throws = 'L' } else { $throws = 'R' } }
        }

        $results[$name] = @{
            acnt = $acnt
            team = $team
            position = $position
            bats = $bats
            throws = $throws
            heightCm = $heightCm
            weightKg = $weightKg
            birthDate = $birthDate
            imageUrl = $imageUrl
        }
    } catch {
        $errors += "$name ($acnt): $_"
    }
}

# Step 4: Save
Write-Host "`nSaving $($results.Count) player bios..."
$results | ConvertTo-Json -Depth 4 | Set-Content -Path $outputFile -Encoding UTF8

Write-Host "Done! Output: $outputFile"
Write-Host "Scraped: $($results.Count) | Errors: $($errors.Count) | Not found: $($notFound.Count)"
if ($notFound.Count -gt 0) {
    Write-Host "Not found on CPBL:"
    $notFound | ForEach-Object { Write-Host "  $_" }
}
if ($errors.Count -gt 0) {
    Write-Host "Errors:"
    $errors | ForEach-Object { Write-Host "  $_" }
}
