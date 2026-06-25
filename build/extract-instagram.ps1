# Extract EVERY Instagram post image -> optimized files + gallery-data.js (robust JSON)
Add-Type -AssemblyName System.Drawing

$root   = "C:\Users\LENOVO\Documents\projects\ISA_website"
$export = Join-Path $root "instagram-isa.cuhk-2026-06-25-janncWNE"
$outImg = Join-Path $root "assets\gallery"
$dataJs = Join-Path $root "js\gallery-data.js"
New-Item -ItemType Directory -Force -Path $outImg | Out-Null

# ---- helpers ----
function Fix-Text($s) {
  if ([string]::IsNullOrEmpty($s)) { return "" }
  $bytes = New-Object System.Collections.Generic.List[byte]
  foreach ($ch in $s.ToCharArray()) { $bytes.Add([byte]([int][char]$ch -band 0xFF)) }
  return [System.Text.Encoding]::UTF8.GetString($bytes.ToArray())
}
function Strip-Emoji($s) {
  if (-not $s) { return "" }
  $out = New-Object System.Text.StringBuilder
  foreach ($ch in $s.ToCharArray()) {
    $c = [int][char]$ch
    if ($c -ge 0xD800 -and $c -le 0xDFFF) { continue }
    if ($c -ge 0x2190 -and $c -le 0x2BFF) { continue }
    if ($c -ge 0x2300 -and $c -le 0x23FF) { continue }
    if ($c -ge 0xFE00 -and $c -le 0xFE0F) { continue }
    if ($c -eq 0x2122 -or $c -eq 0x2139 -or $c -eq 0x20E3) { continue }
    switch ($c) {
      0x2018 { [void]$out.Append("'") }
      0x2019 { [void]$out.Append("'") }
      0x201C { [void]$out.Append('"') }
      0x201D { [void]$out.Append('"') }
      0x2013 { [void]$out.Append('-') }
      0x2014 { [void]$out.Append('-') }
      0x2026 { [void]$out.Append('...') }
      0x00A0 { [void]$out.Append(' ') }
      default { [void]$out.Append($ch) }
    }
  }
  return $out.ToString()
}
function Clean($s) {
  $s = Strip-Emoji (Fix-Text $s)
  $s = $s -replace "`r", ''
  $s = ($s -replace '[ \t]+', ' ').Trim()
  return $s
}
function Categorize($caption) {
  $c = $caption.ToLower()
  if ($c -match 'recruit|exco|e-board|committee|cabinet|inaug|president|vice pres|secretary|treasurer|manager|meet the team|meet our|new member|join the team|board member|design team|pr manager|it manager') { return 'Cabinet' }
  if ($c -match 'party|boat|chalk|dai pai dong|dpd|buddy|friendship|speed|night|trip|hike|bbq|picnic|festiv|games|game night|orientation|fair|workshop|career|dinner|gala|camp|tour|outing|celebrat|pod leader|meet.{0,3}greet') { return 'Events' }
  if ($c -match 'college info|tips|guide|how to|scrapbook|campus|hostel|canteen|study|exam|semester|class|course|survival|life at cuhk') { return 'Campus Life' }
  return 'Highlights'
}

# ---- JPEG encoder ----
$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
$ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [int64]78)
$maxDim = 1080
function Optimize-Jpg($src, $dest) {
  try {
    $bytes = [System.IO.File]::ReadAllBytes($src)
    $ms = New-Object System.IO.MemoryStream(,$bytes)
    $img = [System.Drawing.Image]::FromStream($ms)
    $scale = [Math]::Min(1.0, $maxDim / [Math]::Max($img.Width, $img.Height))
    $w = [int]($img.Width * $scale); $h = [int]($img.Height * $scale)
    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($img, 0, 0, $w, $h)
    $img.Dispose(); $ms.Dispose()
    $bmp.Save($dest, $codec, $ep)
    $g.Dispose(); $bmp.Dispose()
    return $true
  } catch { return $false }
}

# ---- build filename -> metadata map from post JSONs ----
$meta = @{}
function Ingest($postList) {
  foreach ($post in $postList) {
    if (-not $post.media -or $post.media.Count -eq 0) { continue }
    $cap = $post.title
    if ([string]::IsNullOrWhiteSpace($cap)) { $cap = $post.media[0].title }
    $cap = Clean $cap
    if ([string]::IsNullOrWhiteSpace($cap)) { $cap = "ISA CUHK" }
    $title = ($cap -split "`n" | Where-Object { $_.Trim() } | Select-Object -First 1)
    if (-not $title) { $title = "ISA CUHK" }
    $title = $title.Trim()
    if ($title.Length -gt 70) { $title = $title.Substring(0,67).TrimEnd() + "..." }
    $full = ($cap -replace "`n+", ' ')
    if ($full.Length -gt 320) { $full = $full.Substring(0,317).TrimEnd() + "..." }
    $cat = Categorize $cap
    $slides = ($post.media | Where-Object { $_.uri -match '\.(jpg|jpeg|webp|png)$' }).Count
    $si = 0
    foreach ($m in $post.media) {
      if ($m.uri -notmatch '\.(jpg|jpeg|webp|png)$') { continue }
      $si++
      $fn = [System.IO.Path]::GetFileName($m.uri)
      $ts = [int64]$m.creation_timestamp
      if ($ts -le 0) { $ts = [int64]$post.media[0].creation_timestamp }
      if (-not $meta.ContainsKey($fn)) {
        $meta[$fn] = [pscustomobject]@{ title=$title; caption=$full; cat=$cat; ts=$ts; slide=$si; slides=$slides }
      }
    }
  }
}

$posts1 = Get-Content (Join-Path $export "your_instagram_activity\media\posts_1.json") -Raw -Encoding UTF8 | ConvertFrom-Json
Ingest $posts1
try {
  $arch = Get-Content (Join-Path $export "your_instagram_activity\media\archived_posts.json") -Raw -Encoding UTF8 | ConvertFrom-Json
  if ($arch.ig_archived_post_media) { Ingest $arch.ig_archived_post_media }
} catch {}

# ---- walk every image file in media/posts and media/archived_posts ----
$srcDirs = @("media\posts", "media\archived_posts")
$seen = @{}
$items = New-Object System.Collections.Generic.List[object]
$idx = 0
foreach ($sd in $srcDirs) {
  $dir = Join-Path $export $sd
  if (-not (Test-Path $dir)) { continue }
  $files = Get-ChildItem $dir -Recurse -File -Include *.jpg,*.jpeg,*.webp,*.png
  foreach ($f in $files) {
    if ($seen.ContainsKey($f.Name)) { continue }   # dedup by filename
    $seen[$f.Name] = $true
    $m = $meta[$f.Name]
    if ($m) {
      $title=$m.title; $caption=$m.caption; $cat=$m.cat; $ts=$m.ts; $slide=$m.slide; $slides=$m.slides
    } else {
      $title="ISA CUHK"; $caption="ISA CUHK"; $cat="Highlights"
      $ts=[int64]([DateTimeOffset]$f.LastWriteTimeUtc).ToUnixTimeSeconds(); $slide=1; $slides=1
    }
    $idx++
    $name = "ig-{0:D3}" -f $idx
    $ext = $f.Extension.ToLower()
    $ok=$false
    if ($ext -eq '.jpg' -or $ext -eq '.jpeg' -or $ext -eq '.png') {
      $destName="$name.jpg"; $ok = Optimize-Jpg $f.FullName (Join-Path $outImg $destName)
    } elseif ($ext -eq '.webp') {
      $destName="$name.webp"; Copy-Item $f.FullName (Join-Path $outImg $destName) -Force; $ok=$true
    }
    if (-not $ok) { $idx--; continue }
    $date = [DateTimeOffset]::FromUnixTimeSeconds($ts).ToString('MMM yyyy')
    $items.Add([pscustomobject]@{
      src="assets/gallery/$destName"; title=$title; caption=$caption
      date=$date; ts=$ts; cat=$cat; slide=$slide; slides=$slides
    })
  }
}

$sorted = @($items | Sort-Object ts -Descending | Select-Object src,title,caption,date,cat,slide,slides)

# robust JSON serialization
$jsonArr = ConvertTo-Json $sorted -Depth 4 -Compress
$content = "// Auto-generated from Instagram export. Do not edit by hand.`r`nwindow.ISA_GALLERY = $jsonArr;`r`n"
[System.IO.File]::WriteAllText($dataJs, $content, (New-Object System.Text.UTF8Encoding($false)))

Write-Output ("Total images: {0}" -f $sorted.Count)
$sorted | Group-Object cat | Sort-Object Count -Descending | ForEach-Object { Write-Output ("  {0}: {1}" -f $_.Name, $_.Count) }
$tot = (Get-ChildItem $outImg -File | Measure-Object Length -Sum).Sum/1MB
Write-Output ("Gallery folder: {0} MB across {1} files" -f [math]::Round($tot,1), (Get-ChildItem $outImg -File).Count)