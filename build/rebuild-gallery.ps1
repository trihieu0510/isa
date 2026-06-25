# Rebuild gallery: dedup by content hash, optimize, emit manifest + numbered contact sheets
Add-Type -AssemblyName System.Drawing
$root   = "C:\Users\LENOVO\Documents\projects\ISA_website"
$export = Join-Path $root "instagram-isa.cuhk-2026-06-25-janncWNE"
$work   = Join-Path $root "assets\gallery\_all"
$sheets = "C:\Users\LENOVO\AppData\Local\Temp\claude\C--Users-LENOVO-Documents-projects-ISA-website\070c9149-e291-4677-900c-1fdda2a7e4e2\scratchpad\sheets"
$manifest = Join-Path $root "scripts\gallery-manifest.csv"
New-Item -ItemType Directory -Force -Path $work | Out-Null
New-Item -ItemType Directory -Force -Path $sheets | Out-Null

# ---- text helpers (encoding fix) ----
function Fix-Text($s){ if([string]::IsNullOrEmpty($s)){return ""}; $b=New-Object System.Collections.Generic.List[byte]; foreach($ch in $s.ToCharArray()){$b.Add([byte]([int][char]$ch -band 0xFF))}; return [System.Text.Encoding]::UTF8.GetString($b.ToArray()) }
function Strip-Emoji($s){ if(-not $s){return ""}; $o=New-Object System.Text.StringBuilder; foreach($ch in $s.ToCharArray()){ $c=[int][char]$ch; if($c-ge 0xD800-and $c-le 0xDFFF){continue}; if($c-ge 0x2190-and $c-le 0x2BFF){continue}; if($c-ge 0x2300-and $c-le 0x23FF){continue}; if($c-ge 0xFE00-and $c-le 0xFE0F){continue}; if($c-eq 0x2122-or $c-eq 0x2139-or $c-eq 0x20E3){continue}; switch($c){0x2018{[void]$o.Append("'")}0x2019{[void]$o.Append("'")}0x201C{[void]$o.Append('"')}0x201D{[void]$o.Append('"')}0x2013{[void]$o.Append('-')}0x2014{[void]$o.Append('-')}0x2026{[void]$o.Append('...')}0x00A0{[void]$o.Append(' ')}default{[void]$o.Append($ch)}} }; return $o.ToString() }
function Clean($s){ $s=Strip-Emoji (Fix-Text $s); $s=$s -replace "`r",''; return (($s -replace '[ \t]+',' ').Trim()) }

# ---- build filename -> meta ----
$meta=@{}
function Ingest($list){ foreach($post in $list){ if(-not $post.media -or $post.media.Count -eq 0){continue}; $cap=$post.title; if([string]::IsNullOrWhiteSpace($cap)){$cap=$post.media[0].title}; $cap=Clean $cap; if([string]::IsNullOrWhiteSpace($cap)){$cap="ISA CUHK"}; $title=($cap -split "`n"|Where-Object{$_.Trim()}|Select-Object -First 1); if(-not $title){$title="ISA CUHK"}; $title=$title.Trim(); if($title.Length -gt 70){$title=$title.Substring(0,67).TrimEnd()+"..."}; $full=($cap -replace "`n+",' '); if($full.Length -gt 300){$full=$full.Substring(0,297).TrimEnd()+"..."}; foreach($m in $post.media){ if($m.uri -notmatch '\.(jpg|jpeg|webp|png)$'){continue}; $fn=[System.IO.Path]::GetFileName($m.uri); $ts=[int64]$m.creation_timestamp; if($ts -le 0){$ts=[int64]$post.media[0].creation_timestamp}; if(-not $meta.ContainsKey($fn)){$meta[$fn]=[pscustomobject]@{title=$title;caption=$full;ts=$ts}} } } }
$p1=Get-Content (Join-Path $export "your_instagram_activity\media\posts_1.json") -Raw -Encoding UTF8|ConvertFrom-Json
Ingest $p1
try{ $a=Get-Content (Join-Path $export "your_instagram_activity\media\archived_posts.json") -Raw -Encoding UTF8|ConvertFrom-Json; if($a.ig_archived_post_media){Ingest $a.ig_archived_post_media} }catch{}

# ---- JPEG encoder ----
$codec=[System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders()|Where-Object{$_.MimeType -eq 'image/jpeg'}
function MakeEP($q){ $e=New-Object System.Drawing.Imaging.EncoderParameters(1); $e.Param[0]=New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality,[int64]$q); return $e }
$ep80=MakeEP 80; $ep70=MakeEP 70
function LoadImg($path){ $b=[System.IO.File]::ReadAllBytes($path); $ms=New-Object System.IO.MemoryStream(,$b); return [System.Drawing.Image]::FromStream($ms) }
function Optimize($img,$dest,$maxDim,$ep){ $s=[Math]::Min(1.0,$maxDim/[Math]::Max($img.Width,$img.Height)); $w=[int]($img.Width*$s); $h=[int]($img.Height*$s); $bmp=New-Object System.Drawing.Bitmap($w,$h); $g=[System.Drawing.Graphics]::FromImage($bmp); $g.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic; $g.DrawImage($img,0,0,$w,$h); $bmp.Save($dest,$codec,$ep); $g.Dispose(); $bmp.Dispose() }

# ---- walk + dedup ----
Get-ChildItem $work -File -ErrorAction SilentlyContinue | Remove-Item -Force
$md5=[System.Security.Cryptography.MD5]::Create()
$seenHash=@{}
$rows=New-Object System.Collections.Generic.List[object]
$idx=0; $dups=0
foreach($sd in @("media\posts","media\archived_posts")){
  $dir=Join-Path $export $sd; if(-not (Test-Path $dir)){continue}
  foreach($f in (Get-ChildItem $dir -Recurse -File -Include *.jpg,*.jpeg,*.webp,*.png | Sort-Object Name)){
    $bytes=[System.IO.File]::ReadAllBytes($f.FullName)
    $hash=[System.BitConverter]::ToString($md5.ComputeHash($bytes))
    if($seenHash.ContainsKey($hash)){ $dups++; continue }
    $seenHash[$hash]=$true
    $m=$meta[$f.Name]
    if($m){$title=$m.title;$caption=$m.caption;$ts=$m.ts}else{$title="ISA CUHK";$caption="ISA CUHK";$ts=[int64]([DateTimeOffset]$f.LastWriteTimeUtc).ToUnixTimeSeconds()}
    $idx++; $name=("ig-{0:D3}.jpg" -f $idx)
    try{ $img=LoadImg $f.FullName; Optimize $img (Join-Path $work $name) 1080 $ep80; $img.Dispose() }catch{ $idx--; continue }
    $date=[DateTimeOffset]::FromUnixTimeSeconds($ts).ToString('MMM yyyy')
    $rows.Add([pscustomobject]@{ idx=$idx; file=$name; title=$title; caption=$caption; date=$date; ts=$ts })
  }
}
$rows | Export-Csv $manifest -NoTypeInformation -Encoding UTF8
Write-Output ("Unique images: {0}  (removed {1} exact duplicates)" -f $idx, $dups)

# ---- contact sheets: 25 per sheet (5x5), numbered ----
Get-ChildItem $sheets -File -ErrorAction SilentlyContinue | Remove-Item -Force
$cell=230; $cols=5; $rowsPer=5; $per=$cols*$rowsPer; $lblH=26
$font=New-Object System.Drawing.Font("Arial",13,[System.Drawing.FontStyle]::Bold)
$all=$rows
$sheetNo=0
for($i=0;$i -lt $all.Count;$i+=$per){
  $sheetNo++
  $chunk=$all[$i..([Math]::Min($i+$per-1,$all.Count-1))]
  $sw=$cols*$cell; $sh=$rowsPer*($cell+$lblH)
  $sheet=New-Object System.Drawing.Bitmap($sw,$sh)
  $g=[System.Drawing.Graphics]::FromImage($sheet)
  $g.Clear([System.Drawing.Color]::FromArgb(245,242,244))
  $g.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $k=0
  foreach($r in $chunk){
    $cx=($k % $cols)*$cell; $cy=[Math]::Floor($k/$cols)*($cell+$lblH)
    try{
      $img=LoadImg (Join-Path $work $r.file)
      $s=[Math]::Min(($cell-8)/$img.Width,($cell-8)/$img.Height)
      $w=[int]($img.Width*$s); $h=[int]($img.Height*$s)
      $ox=$cx+[int](($cell-$w)/2); $oy=$cy+[int](($cell-8-$h)/2)+4
      $g.DrawImage($img,$ox,$oy,$w,$h); $img.Dispose()
    }catch{}
    $g.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(92,32,73))),$cx,$cy+$cell,$cell,$lblH)
    $g.DrawString(("#"+$r.idx),$font,[System.Drawing.Brushes]::White,$cx+6,$cy+$cell+4)
    $k++
  }
  $g.Dispose()
  $sheet.Save((Join-Path $sheets ("sheet-{0:D2}.jpg" -f $sheetNo)),$codec,$ep70)
  $sheet.Dispose()
}
Write-Output ("Contact sheets: {0} in {1}" -f $sheetNo, $sheets)