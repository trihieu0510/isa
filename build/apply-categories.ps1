# Apply manual (visual) category sort -> folders + gallery-data.js
$root = "C:\Users\LENOVO\Documents\projects\ISA_website"
$gal  = Join-Path $root "assets\gallery"
$work = Join-Path $gal "_all"
$manifest = Join-Path $root "scripts\gallery-manifest.csv"
$dataJs = Join-Path $root "js\gallery-data.js"

# ---- visual category assignments (image index -> category) ----
$CB = 5,9,13,16,17,20,22,24,25,29,36,37,38,39,40,41,43,45,46,49,50,51,56,57,58,66,67,71,76,82,83,84,93,94,96,97,104,105,106,109,112,113,114,115,117,119,121,125,128,129,139,144
$CL = 1,14,21,32,42,60,65,68,75,81,85,90,92,95,98,99,100,108,126,127,135,138,140,142,146
$HL = 4,6,19,31,33,35,44,54,62,70,74,130,147,149,160
# everything else -> Events

# images to drop entirely:
#  CUHK "Spotify Wrapped" stat cards (campus life) + repeated "follow for hints" branding cards
$DELETE = 1,60,68,75,81,85,90,95,98,100,142,146,   6,31,74,147,160,   149
$drop = @{}; foreach($i in $DELETE){ $drop[$i]=$true }
# Highlights category removed from the gallery entirely
foreach($i in $HL){ $drop[$i]=$true }

$catOf = @{}
foreach($i in $CB){$catOf[$i]='Cabinet'}
foreach($i in $CL){$catOf[$i]='Campus Life'}

$folder = @{ 'Events'='events'; 'Cabinet'='cabinet'; 'Campus Life'='campus-life' }
# remove any old highlights folder
Remove-Item (Join-Path $gal 'highlights') -Recurse -Force -ErrorAction SilentlyContinue
foreach($f in $folder.Values){ New-Item -ItemType Directory -Force -Path (Join-Path $gal $f) | Out-Null; Get-ChildItem (Join-Path $gal $f) -File -ErrorAction SilentlyContinue | Remove-Item -Force }

$rows = Import-Csv $manifest
# assign category, sort newest first (skipping dropped images)
$items = foreach($r in $rows){
  if($drop[[int]$r.idx]){ continue }
  $cat = $catOf[[int]$r.idx]; if(-not $cat){ $cat='Events' }
  [pscustomobject]@{ idx=[int]$r.idx; file=$r.file; title=$r.title; caption=$r.caption; date=$r.date; ts=[int64]$r.ts; cat=$cat }
}
$sorted = $items | Sort-Object ts -Descending

# move into category folders with clean per-category numbering
$counter = @{}
$out = New-Object System.Collections.Generic.List[object]
foreach($it in $sorted){
  $slug = $folder[$it.cat]
  if(-not $counter.ContainsKey($slug)){ $counter[$slug]=0 }
  $counter[$slug]++
  $dn = "{0}-{1:D2}.jpg" -f $slug, $counter[$slug]
  $srcPath = Join-Path $work $it.file
  $destPath = Join-Path (Join-Path $gal $slug) $dn
  if(Test-Path $srcPath){ Copy-Item $srcPath $destPath -Force } else { continue }
  $out.Add([pscustomobject]@{ src="assets/gallery/$slug/$dn"; title=$it.title; caption=$it.caption; date=$it.date; cat=$it.cat })
}

# write gallery-data.js (robust JSON)
$json = ($out | Select-Object src,title,caption,date,cat | ConvertTo-Json -Depth 4 -Compress)
if ($out.Count -eq 1) { $json = "[$json]" }
$content = "// Auto-generated, visually sorted from Instagram export.`r`nwindow.ISA_GALLERY = $json;`r`n"
[System.IO.File]::WriteAllText($dataJs, $content, (New-Object System.Text.UTF8Encoding($false)))

# cleanup: remove old flat ig-* files in gallery root + the _all working dir
Get-ChildItem $gal -File -ErrorAction SilentlyContinue | Where-Object { $_.Name -like 'ig-*' } | Remove-Item -Force
Remove-Item $work -Recurse -Force -ErrorAction SilentlyContinue

Write-Output "Sorted dataset:"
$out | Group-Object cat | Sort-Object Count -Descending | ForEach-Object { Write-Output ("  {0}: {1}" -f $_.Name, $_.Count) }
$tot=(Get-ChildItem $gal -Recurse -File | Measure-Object Length -Sum).Sum/1MB
Write-Output ("Total: {0} images, {1} MB" -f $out.Count, [math]::Round($tot,1))