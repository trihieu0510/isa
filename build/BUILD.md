# Build scripts

These PowerShell scripts (re)generate the site's image assets and the `js/*-data.js`
data files from raw source material. **The site does not need them to run** — the
generated output is already committed under `assets/` and `js/`. They're here so you
can refresh content later.

> ⚠️ The original source folders were removed to keep the project clean. To re-run any
> script you must first drop the relevant source back into the project root and update
> the `$root`/source paths near the top of the script.

## Source material each script expects
| Script | Needs (in project root) | Produces |
|---|---|---|
| `extract-instagram.ps1` | `instagram-...export/` | optimized IG images + a flat `js/gallery-data.js` |
| `rebuild-gallery.ps1` | `instagram-...export/` | dedupes + builds numbered contact sheets + `gallery-manifest.csv` |
| `apply-categories.ps1` | `gallery-manifest.csv` + `assets/gallery/_all` | sorts photos into `assets/gallery/<category>/` + final `js/gallery-data.js` |
| `extract-events.ps1` | `Events/` (+ optional `Drive_materials/`) | `assets/events/<slug>/` + `js/events-data.js` + `js/gallery-extra.js` |
| `extract-team.ps1` | `instagram-...export/media/ISA 26-27/` | `assets/team/` + `js/team-data.js` |
| `extract-past-cabinets.ps1` | `Events/Past cabinet 20XX-20XX/` | `assets/past-cabinets/<id>/` + `js/past-cabinets-data.js` |

## Gallery pipeline (visual sort)
The main gallery is sorted by eye, not by caption:
1. `rebuild-gallery.ps1` — dedup by hash, optimize, emit `gallery-manifest.csv` + contact sheets.
2. Review the contact sheets; the category index-lists live at the top of `apply-categories.ps1`
   (`$CB`, `$CL`, `$HL`, `$DELETE`). Everything not listed defaults to **Events**.
3. `apply-categories.ps1` — moves images into `assets/gallery/events|cabinet|campus-life/`
   and writes `js/gallery-data.js`. (The **Highlights** category is intentionally dropped.)

## Notes
- Image optimization uses .NET `System.Drawing`; HEIC is decoded via WIC
  (`PresentationCore`) and needs the Windows HEIF Image Extension installed.
- All scripts are Windows PowerShell 5.1 compatible.
