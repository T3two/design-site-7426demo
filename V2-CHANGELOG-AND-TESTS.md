# Pair of Dice Design V2 — implementation and testing

## Changes
- Preserved original documentation and brand colors.
- Switched heading and body typography to Barlow Condensed/Barlow, with a dice-mark header.
- Added configuration-based 2024, 2025, 2026 robot archive scaffolds.
- Added missing page files and sponsor page.
- Added read-only archive directory driven by robots.json.
- Added on-demand CAD viewer controls, progress UI, missing engine error, and model file link.
- Addressed rapid page navigation race and mobile menu closing.
- Improved Markdown sanitization.

## Structural tests
- JSON, page paths and model paths validated in the downloadable ZIP.
- Inline JavaScript parses with Node.js.
- Original and optimized GLB structure parsed. Consolidated 10,175 triangle primitives into 125; nodes 455, meshes 89, materials 48 are retained.

## Unverified
- Browser-based CAD rendering, desktop/mobile pixel-level verification, and GitHub Pages deployment. The local browser blocked HTTP/file access by administrator policy.
- The optimized GLB is only in the downloadable ZIP. GitHub connector did not accept local binary uploads.

## Publishing the optimized assembly
Upload `models/assemblies/TShirt-optimized.glb` from the ZIP to the review branch. Update `models/catalog.json` entry's `file` to point to it. Verify color/hierarchy and performance in a real browser before merging. Original remains available.

## Content policy
Robot specifications and sponsor records remain placeholders pending approved verified source documentation. No unsupported specifications have been invented.

## Editing
Edit Markdown under `content/`, navigation in `navigation.json`, model records in `models/catalog.json`, sponsors in `sponsors.json`, and robot metadata in `robots.json`. GitHub's authenticated editor commits directly; a static site has no safe unattended public editor.
