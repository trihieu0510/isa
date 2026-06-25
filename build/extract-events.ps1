# Build per-event image sets + events-data.js + gallery-extra.js
Add-Type -AssemblyName PresentationCore, WindowsBase, System.Drawing
$root = "C:\Users\LENOVO\Documents\projects\ISA_website"
$ev   = Join-Path $root "Events"
$dm   = Join-Path $root "Drive_materials"
$ig   = Join-Path $dm "2425 _ IG Posts-20260625T092930Z-3-001\2425 _ IG Posts"
$outBase = Join-Path $root "assets\events"
$dataJs  = Join-Path $root "js\events-data.js"
$extraJs = Join-Path $root "js\gallery-extra.js"

$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
$ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality,[int64]80)
$maxDim = 1400

function Apply-Orientation($img){
  try {
    if ($img.PropertyIdList -contains 0x0112) {
      $o = $img.GetPropertyItem(0x0112).Value[0]
      switch ($o) {
        2 { $img.RotateFlip([System.Drawing.RotateFlipType]::RotateNoneFlipX) }
        3 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate180FlipNone) }
        4 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate180FlipX) }
        5 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipX) }
        6 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipNone) }
        7 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipX) }
        8 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipNone) }
      }
    }
  } catch {}
}
function Load-AnyImage($path){
  $ext = [IO.Path]::GetExtension($path).ToLower()
  if ($ext -eq '.heic' -or $ext -eq '.heif') {
    $st = [IO.File]::OpenRead($path)
    $dec = [System.Windows.Media.Imaging.BitmapDecoder]::Create($st,'None','OnLoad')
    $frame = $dec.Frames[0]
    $enc = New-Object System.Windows.Media.Imaging.JpegBitmapEncoder; $enc.QualityLevel = 92
    $enc.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($frame))
    $ms = New-Object IO.MemoryStream; $enc.Save($ms); $st.Close(); $ms.Position = 0
    return [System.Drawing.Image]::FromStream($ms)
  } else {
    $b=[IO.File]::ReadAllBytes($path); $ms=New-Object IO.MemoryStream(,$b)
    $img=[System.Drawing.Image]::FromStream($ms); Apply-Orientation $img; return $img
  }
}
function Optimize($srcPath,$dest){
  try {
    $img = Load-AnyImage $srcPath
    if ([Math]::Max($img.Width,$img.Height) -lt 600) { $img.Dispose(); return $false }  # skip thumbnails
    $s=[Math]::Min(1.0,$maxDim/[Math]::Max($img.Width,$img.Height))
    $w=[int]($img.Width*$s); $h=[int]($img.Height*$s)
    $bmp=New-Object System.Drawing.Bitmap($w,$h); $g=[System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($img,0,0,$w,$h); $img.Dispose()
    $bmp.Save($dest,$codec,$ep); $g.Dispose(); $bmp.Dispose(); return $true
  } catch { return $false }
}

# event definitions
$events = @(
  [pscustomobject]@{ slug='inauguration'; name='Inauguration Ceremony'; cap=14; gallery=$true
    overview='Every ISA year begins with the Inauguration Ceremony - the moment a new Executive Committee is officially welcomed and the journey ahead is set in motion. Surrounded by faculty, alumni and friends, the cabinet makes its promise to serve the international student community at CUHK.'
    folders=@((Join-Path $ev 'Inauguration 16th cabinet')) }
  [pscustomobject]@{ slug='halloween-ball'; name='Halloween Ball'; cap=14; gallery=$true
    overview='Our spookiest night of the year. Costumes, UV lights and a dance floor that does not quit - the ISA Halloween Ball brings the whole community together for one unforgettable night.'
    folders=@((Join-Path $ev 'Halloween Ball')) }
  [pscustomobject]@{ slug='boat-party'; name='Boat Party'; cap=14; gallery=$true
    overview='One of ISA''s most-loved traditions - a whole day out on the water. Junk boats, swimming off the back deck, music and the Hong Kong skyline, all shared with the ISA family.'
    folders=@((Join-Path $ev 'Boat Party')) }
  [pscustomobject]@{ slug='dai-pai-dong'; name='Dai Pai Dong'; cap=14; gallery=$true
    overview='A taste of authentic local Hong Kong. We take members out to a classic dai pai dong - open-air street eateries serving wok-fried classics - to share a proper local meal the way it is meant to be enjoyed: loud, communal and delicious.'
    folders=@((Join-Path $ev 'Dai Pai Dong\DPD 2024 Pictures')) }
  [pscustomobject]@{ slug='prepasia'; name='PrepAsia Career Bootcamp'; cap=8; gallery=$true
    overview='In partnership with PrepAsia, our Career Bootcamp gives members a head start - CV workshops, interview practice and insider tips from industry mentors to help international students launch their careers.'
    folders=@((Join-Path $ev 'PrepAsia')) }
  [pscustomobject]@{ slug='ibuddy'; name='iBuddy Mentorship'; cap=12; gallery=$true
    overview='iBuddy pairs new international students with senior mentors who guide them through their crucial first year at CUHK - from settling into hostels and campus life to making friends and finding their feet.'
    folders=@((Join-Path $ev 'IBuddy')) }
  [pscustomobject]@{ slug='chalk-party'; name='Chalk Party'; cap=12; gallery=$false
    overview='Our legendary UV night. Glow paint, neon lights, music and white tees that never stay white for long. The Chalk Party is pure chaos in the best way.'
    folders=@((Join-Path $ig 'Chalk Party')) }
  [pscustomobject]@{ slug='speed-friendshipping'; name='Speed Friendshipping'; cap=8; gallery=$false
    overview='Think speed dating, but for friendships. A fast, fun, low-pressure way for freshmen to meet dozens of new people in a single evening and walk away with a whole new circle.'
    folders=@((Join-Path $ig 'Speed friendshipping'),(Join-Path $ig 'After Speed Friendshipping')) }
  [pscustomobject]@{ slug='meet-and-greet'; name='Meet & Greet Days'; cap=10; gallery=$false
    overview='The first hello. Our Meet & Greet Days welcome incoming international students before the semester begins - a friendly face, answers to every nervous question, and an instant community on day one.'
    folders=@((Join-Path $ig 'Meet-and-greet days posts')) }
)

$result = New-Object System.Collections.Generic.List[object]
$extra  = New-Object System.Collections.Generic.List[object]
foreach ($e in $events) {
  $dir = Join-Path $outBase $e.slug
  New-Item -ItemType Directory -Force -Path $dir | Out-Null
  Get-ChildItem $dir -File -ErrorAction SilentlyContinue | Remove-Item -Force
  $files=@()
  foreach($fld in $e.folders){ if(Test-Path $fld){ $files += Get-ChildItem $fld -Recurse -File -Include *.jpg,*.jpeg,*.png,*.JPG,*.JPEG,*.PNG,*.heic,*.HEIC } }
  $files = $files | Sort-Object Name | Select-Object -First $e.cap
  $imgs = New-Object System.Collections.Generic.List[string]
  $n=0
  foreach($f in $files){
    $n++; $dn = "{0}-{1:D2}.jpg" -f $e.slug,$n
    if (Optimize $f.FullName (Join-Path $dir $dn)) {
      $rel = "assets/events/$($e.slug)/$dn"
      $imgs.Add($rel)
      if ($e.gallery) { $extra.Add([pscustomobject]@{ src=$rel; title=$e.name; caption=$e.overview; date=''; cat='Events' }) }
    } else { $n-- }
  }
  if ($imgs.Count -eq 0) { Write-Output ("SKIP {0} (no images)" -f $e.name); continue }
  $result.Add([pscustomobject]@{ slug=$e.slug; name=$e.name; date=''; overview=$e.overview; cover=$imgs[0]; images=$imgs })
  Write-Output ("{0}: {1} images" -f $e.name, $imgs.Count)
}

$json = ($result | ConvertTo-Json -Depth 6 -Compress)
[System.IO.File]::WriteAllText($dataJs, "// Auto-generated event data.`r`nwindow.ISA_EVENTS = $json;`r`n", (New-Object System.Text.UTF8Encoding($false)))

$ejson = ($extra | Select-Object src,title,caption,date,cat | ConvertTo-Json -Depth 4 -Compress)
if ($extra.Count -eq 1) { $ejson = "[$ejson]" }
[System.IO.File]::WriteAllText($extraJs, "// Real event photos added to the gallery.`r`nwindow.ISA_GALLERY_EXTRA = $ejson;`r`n", (New-Object System.Text.UTF8Encoding($false)))

$tot=(Get-ChildItem $outBase -Recurse -File | Measure-Object Length -Sum).Sum/1MB
Write-Output ("Events: {0}; gallery extras: {1}; {2} MB" -f $result.Count, $extra.Count, [math]::Round($tot,1))