# Website Upgrade Audit

## Changes made
- Rebuilt the visual layout as a cleaner, light-background technical site with restrained Pair of Dice red accents.
- Replaced the hard-coded sidebar with `navigation.json`, including grouped tabs and collapsible subtabs.
- Added `settings.json` for site branding, theme colors, footer text, and loading-screen settings.
- Added a configurable loading screen with a custom image option, message, animated progress bar, and timeout fallback.
- Reworked the 3D viewer to support catalog entries, page assignment, inline Markdown placement, loading/error states, reset view, and fullscreen.
- Added a Sponsors page, `sponsors.json`, and an optional sponsor-logo strip.
- Added `HOW-TO-EDIT.md` with copyable examples for pages, subtabs, models, sponsors, images, and publishing.
- Corrected Markdown image paths that incorrectly began with `../assets/`.
- Removed missing hero-image dependencies so absent `assets/hero/` files no longer create blank image areas.
- Corrected malformed HTML in the original document head and consolidated the model-viewer script to one pinned CDN reference.

## Checks completed
- All four JSON configuration files parse successfully.
- All pages referenced in `navigation.json` exist.
- All 11 Markdown image references point to files that exist after path normalization.
- No missing hero-image references remain.
- The JavaScript passes `node --check`.
- The public model catalog starts empty; no invented model entries or sponsor entries were added.

## Not fully tested
- The site was not deployed to GitHub Pages from this environment.
- Actual rendering, touch controls, rotation, zoom, and fullscreen need to be checked in a browser after deployment.
- The 3D viewer library and Markdown renderer load from external CDNs; a school network may block them.
- The pre-existing catalog entry appeared to represent a launcher-style device, so it was not enabled in the public viewer. Its source file was left untouched in the archive. The viewer catalog is empty until approved, suitable CAD models are added.

## Before publishing
Upload the contents of this project folder to the root of your GitHub repository. Keep the folder structure intact, then follow `README.md` and `HOW-TO-EDIT.md`.
