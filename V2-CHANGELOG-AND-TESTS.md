# V3 archive and site builder status

## Text/source changes on this branch
- 2019, 2020, 2022, 2023, 2024, 2025 and 2026 robot documentation pages and navigation tabs.
- T-shirt Cannon has a separate tab and Markdown page.
- `robots.json` and `models/catalog.json` include all seven season models.
- `builder.html` supports editing Markdown and config JSON and downloading files for a manual authenticated GitHub commit.
- The 2026 RICOCHET technical details are taken from the supplied 19-page technical binder; unsupported details are placeholders.

## Binary hosting NOT complete on GitHub
- Model assets from Analyze Folder.zip and the original 2026 technical binder are included in the **downloadable site archive**, not in this GitHub branch.
- `hosted:false` intentionally disables viewer controls until the matching model GLBs are uploaded.
- 2019/2023/2024 optimized GLBs still exceed GitHub's ordinary 100 MiB upload limit and need approved external HTTPS hosting with CORS, or further compression.
- The original TShirt.glb in the repository remains downloadable/usable.

## Test report
- GLB structure (headers, accessors, buffer ranges, node indices) validated for all eight optimized models.
- Navigation, Markdown paths, embedded model tokens, model catalog IDs validated.
- Inline JavaScript parses. Real-browser local HTTP test was blocked with net::ERR_BLOCKED_BY_ADMINISTRATOR; real model rendering and mobile usability are still unverified.
- This is a review branch, not a production deployment. Do not merge until model host links and browser tests pass.

## How to edit
Open `builder.html` from the deployed site or local static server, export updated files and commit them through GitHub's authenticated UI. The editor does not store GitHub credentials or write to the live repository. Delete builder.html when no longer required.