# Built-in local Site Builder

Open `builder.html` while serving the folder through a local HTTP server, or use the deployed `builder.html` read-only configuration editor. Choose **Page text**, **Navigation**, **Robot catalog**, **Model catalog**, **Sponsors**, or **Settings**. Load the file, modify, and press **Download edited file** to save the modified JSON/Markdown into your Downloads folder. Replace the corresponding repository file through GitHub's authenticated editor and commit it.

There is deliberately **no public site write API, no GitHub token storage, and no automatic GitHub commit**. Changes are unsaved until you download the edited file and commit it yourself. You can remove `builder.html` when finished.

To add a robot: create a new `content/robot-YYYY.md` file, add an entry to `robots.json`, `navigation.json`, and `models/catalog.json`, then host a GLB where the model file points. Season model IDs are `robot-YYYY-assembly`.

To add another CAD model: upload a GLB and register `id`, `file`, `type`, `pages` in `models/catalog.json`.

To add sponsors: edit `sponsors.json` and upload approved logos to `assets/`.

To add a binder: put the original PDF in `binders/`, link it from the corresponding Markdown using `[Binder (PDF)](binders/file.pdf)`.

Large files: GitHub's ordinary repository upload limit is 100 MiB per file. The 2019, 2023, and 2024 optimized assets are still above that threshold; to display them on GitHub Pages, upload to a suitable external static model host with cross-origin support and configure `file` to the HTTPS URL. The downloaded ZIP includes these assets for self-hosting. External content must support CORS and range requests where possible.