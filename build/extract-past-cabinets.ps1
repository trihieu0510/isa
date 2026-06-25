# Optimize past cabinet cards + past-cabinets-data.js
Add-Type -AssemblyName System.Drawing
$root = "C:\Users\LENOVO\Documents\projects\ISA_website"
$ev   = Join-Path $root "Events"
$outBase = Join-Path $root "assets\past-cabinets"
$dataJs  = Join-Path $root "js\past-cabinets-data.js"

$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
$ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality,[int64]82)
function Opt($srcPath,$dest,$maxDim){
  try{
    $b=[IO.File]::ReadAllBytes($srcPath); $ms=New-Object IO.MemoryStream(,$b)
    $img=[System.Drawing.Image]::FromStream($ms)
    $s=[Math]::Min(1.0,$maxDim/[Math]::Max($img.Width,$img.Height))
    $w=[int]($img.Width*$s); $h=[int]($img.Height*$s)
    $bmp=New-Object System.Drawing.Bitmap($w,$h); $g=[System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($img,0,0,$w,$h); $img.Dispose()
    $bmp.Save($dest,$codec,$ep); $g.Dispose(); $bmp.Dispose(); return $true
  } catch { return $false }
}
function NiceName($fn){
  $n = [IO.Path]::GetFileNameWithoutExtension($fn)
  $n = $n -replace '^\d+(\.\d+)?\s*',''   # strip leading "1.2 "
  return $n.Trim()
}

$cabinets = @(
  [pscustomobject]@{ id='16th'; title='16th Cabinet'; years='2025 - 2026'; src=(Join-Path $ev 'Past cabinet 2025-2026'); group=$null }
  [pscustomobject]@{ id='15th'; title='15th Cabinet'; years='2024 - 2025'; src=(Join-Path $ev 'Past cabinet 2024-2025'); group='ISA Group Picture.jpeg' }
)

$result = New-Object System.Collections.Generic.List[object]
foreach($c in $cabinets){
  $dir = Join-Path $outBase $c.id
  New-Item -ItemType Directory -Force -Path $dir | Out-Null
  Get-ChildItem $dir -File -ErrorAction SilentlyContinue | Remove-Item -Force
  $groupRel = $null
  if ($c.group) {
    $gp = Join-Path $c.src $c.group
    if (Test-Path $gp) { if (Opt $gp (Join-Path $dir "group.jpg") 1200) { $groupRel = "assets/past-cabinets/$($c.id)/group.jpg" } }
  }
  $files = Get-ChildItem $c.src -File -Include *.jpg,*.jpeg,*.png,*.JPG,*.PNG -Recurse | Where-Object { $_.Name -ne $c.group }
  # order: President first, dept-summary cards next, individuals last
  $files = $files | Sort-Object @{e={ if($_.Name -match 'President'){0} elseif($_.Name -match 'Managers|Secretaries|Treasurers|managers|secretaries|treasurers'){1} else {2} }}, Name
  $cards = New-Object System.Collections.Generic.List[object]
  $n=0
  foreach($f in $files){
    $n++; $dn = "{0}-{1:D2}.jpg" -f $c.id,$n
    if (Opt $f.FullName (Join-Path $dir $dn) 900) {
      $cards.Add([pscustomobject]@{ src="assets/past-cabinets/$($c.id)/$dn"; name=(NiceName $f.Name) })
    } else { $n-- }
  }
  $result.Add([pscustomobject]@{ id=$c.id; title=$c.title; years=$c.years; group=$groupRel; cards=$cards })
  Write-Output ("{0} ({1}): {2} cards, group={3}" -f $c.title, $c.years, $cards.Count, [bool]$groupRel)
}

$json = ($result | ConvertTo-Json -Depth 6 -Compress)
[System.IO.File]::WriteAllText($dataJs, "// Auto-generated past cabinet data.`r`nwindow.ISA_PAST_CABINETS = $json;`r`n", (New-Object System.Text.UTF8Encoding($false)))
$tot=(Get-ChildItem $outBase -Recurse -File | Measure-Object Length -Sum).Sum/1MB
Write-Output ("Total {0} MB" -f [math]::Round($tot,1))