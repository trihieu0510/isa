# Build team images + team-data.js for the 17th Cabinet (2026-27)
Add-Type -AssemblyName System.Drawing
$root = "C:\Users\LENOVO\Documents\projects\ISA_website"
$src  = Join-Path $root "instagram-isa.cuhk-2026-06-25-janncWNE\media\ISA 26-27"
$out  = Join-Path $root "assets\team"
$dataJs = Join-Path $root "js\team-data.js"
New-Item -ItemType Directory -Force -Path $out | Out-Null

$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
$ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [int64]82)
function Opt($srcPath, $destName, $maxDim) {
  $dest = Join-Path $out $destName
  try {
    $b=[System.IO.File]::ReadAllBytes($srcPath); $ms=New-Object System.IO.MemoryStream(,$b)
    $img=[System.Drawing.Image]::FromStream($ms)
    $s=[Math]::Min(1.0,$maxDim/[Math]::Max($img.Width,$img.Height))
    $w=[int]($img.Width*$s); $h=[int]($img.Height*$s)
    $bmp=New-Object System.Drawing.Bitmap($w,$h); $g=[System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($img,0,0,$w,$h); $img.Dispose(); $ms.Dispose()
    $bmp.Save($dest,$codec,$ep); $g.Dispose(); $bmp.Dispose(); return $true
  } catch { return $false }
}

# group photo
Opt (Join-Path $src "All\Group picture.jpg") "group.jpg" 1100 | Out-Null

# department + member roster (matches sorted filenames)
$departments = @(
  @{ name='President';        photo='President.jpg';   members=@(@{n='Aashni'; r='President';      f='Aashni President.jpg'}) }
  @{ name='Vice President';   photo='VP.jpg';          members=@(@{n='Miu';    r='Vice President'; f='Miu Vice President.jpg'}) }
  @{ name='Secretaries';      photo='Secretaries.jpg'; members=@(@{n='Danielle'; r='Secretary'; f='Danielle Secretary.jpg'}, @{n='Bianca'; r='Secretary'; f='Bianca Secretary.png'}) }
  @{ name='Treasurers';       photo='Treasurer.jpg';   members=@(@{n='Floren'; r='Treasurer'; f='Floren Treasurer.jpg'}, @{n='Jessica'; r='Treasurer'; f='Jessica Treasuer.jpg'}) }
  @{ name='Public Relations'; photo='PR.jpg';          members=@(@{n='Charm'; r='PR Manager'; f='Charm PR.jpg'}, @{n='Kimberly'; r='PR Manager'; f='Kimberly PR.jpg'}) }
  @{ name='Design';           photo='Design.jpg';      members=@(@{n='Austin'; r='Design Manager'; f='Austin Design.jpg'}, @{n='Michelle'; r='Design Manager'; f='Michelle Design.jpg'}) }
  @{ name='Events';           photo='Events.jpg';      members=@(@{n='Alex'; r='Event Manager'; f='Alex Events.jpg'}, @{n='Jacky'; r='Event Manager'; f='Jacky events.jpg'}, @{n='Nitya'; r='Event Manager'; f='Nitya Events.jpg'}) }
  @{ name='IT';               photo='IT.jpg';          members=@(@{n='Hieu'; r='IT Manager'; f='Hieu IT.jpg'}, @{n='Wee'; r='IT Manager'; f='Wee IT.jpg'}) }
)

$result = New-Object System.Collections.Generic.List[object]
$di = 0
foreach ($d in $departments) {
  $di++
  $slug = ($d.name.ToLower() -replace '[^a-z]+','-').Trim('-')
  $deptImg = "dept-$slug.jpg"
  $hasPhoto = Opt (Join-Path $src ("Group\" + $d.photo)) $deptImg 1280
  $mlist = New-Object System.Collections.Generic.List[object]
  $mi = 0
  foreach ($m in $d.members) {
    $mi++
    $mn = "m-{0:D2}-{1}.jpg" -f $di, ($m.n.ToLower() -replace '[^a-z]+','')
    if (Opt (Join-Path $src ("Individual\" + $m.f)) $mn 950) {
      $mlist.Add([pscustomobject]@{ name=$m.n; role=$m.r; img="assets/team/$mn" })
    }
  }
  $result.Add([pscustomobject]@{
    name=$d.name
    photo= $(if ($hasPhoto) { "assets/team/$deptImg" } else { $null })
    members=$mlist
  })
}

$payload = [pscustomobject]@{ group='assets/team/group.jpg'; departments=$result }
$json = ConvertTo-Json $payload -Depth 6 -Compress
$content = "// Auto-generated team data (17th Cabinet, 2026-27).`r`nwindow.ISA_TEAM = $json;`r`n"
[System.IO.File]::WriteAllText($dataJs, $content, (New-Object System.Text.UTF8Encoding($false)))

$tot=(Get-ChildItem $out -File | Measure-Object Length -Sum).Sum/1MB
$mc = ($result | ForEach-Object { $_.members.Count } | Measure-Object -Sum).Sum
Write-Output ("Departments: {0}, Members: {1}, Files: {2}, {3} MB" -f $result.Count, $mc, (Get-ChildItem $out -File).Count, [math]::Round($tot,1))