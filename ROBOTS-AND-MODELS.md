# Pair of Dice engineering archive maintenance

- **New season:** Copy `content/robot-template.md` into a season file, add an entry under the archive group in `navigation.json`, and register metadata in `robots.json`.
- **New model:** Put a GLB in `models/assemblies/` or `models/parts/`; add `id`, `name`, `file`, `type`, and optional `pages` to `models/catalog.json`. Use `{{model:model-id}}` in Markdown. IDs should use letters, numbers, hyphens, or underscores.
- **New page:** Write a file under `content/`, then add a navigation entry in `navigation.json`.
- **New sponsor:** Add approved company information and image paths in `sponsors.json`.
- **New binder:** Add its original PDF under `binders/` and link from the documentation Markdown file.

This is a static GitHub Pages website. Edit through GitHub's authenticated web editor. Local browser edits do not automatically commit to GitHub. Never make a publicly writable admin endpoint.

**Model performance:** The supplied assembly has 10,175 primitives and is expensive to render. The packaged v2 ZIP includes a structurally merged copy (125 primitives), but this branch retains the original GLB until a binary upload is available. Do not switch its catalog file path before uploading and browser-testing the optimized file.
