# Design refresh / Pair of Dice Design

## Why this looks like us

We kept the existing Pair of Dice red (#a32632), warm off-white, dark charcoal text, Barlow and Barlow Condensed typography, and dice mark. The refresh intentionally avoids gradients, glass cards, animated counters, stock photography, and fabricated robot claims. It reads like a student-maintained engineering notebook rather than a sales landing page.

## Reference sites (organizational patterns, not copied visuals)

- HighTide's [2026 Technical Binder](https://2026.team4414.com/) uses clear subsystem chapters with strong individual page hierarchy and practical CAD illustration. Our robot pages now have automatically generated in-page chapter links.
- [Spectrum 3847's mechanical resource index](https://www.spectrum3847.org/resources/other-teams-resources/mechanical/) demonstrates helpful grouping of technical resources. We moved the robot archive directly after Home and split design references into scannable groups.
- [Buzz Robotics' documentation library](https://www.buzzrobotics.org/about/documentation) treats source notebooks as preserved artifacts. We retain existing documentation, model catalog, and planned original binder references instead of inventing missing details.
- [Official Pair of Dice Robotics site](https://pairofdice.vegas/) informed the emphasis on student learning, real engineering, and community.

## Changes

1. Reworked the intro region with Pair of Dice's existing font and colors, editorial spacing, and a very subtle team number watermark.
2. Reorganized the navigation so robot seasons are discoverable earlier.
3. Added a homepage pathway section that opens 2026 RICOCHET, all years, CAD, and design reasoning.
4. Added season-row hierarchy and improved status labels in the archive.
5. Added automatically generated chapter links on longer pages.
6. Improved contrast, content typography, buttons, table spacing, focus states, and mobile layouts.
7. Rewrote the homepage and archive introduction in a student-team voice without invented accomplishments.
8. Preserved the interactive model loader, packed GLB manifest, seven season CAD entries, separate T-shirt Cannon page, site builder, all existing content pages, and sponsor configuration.

## Verification performed

- Navigation JSON parses; 19 page references exist; no repeated navigation IDs.
- All 7 robot metadata entries match an existing navigation page and model catalog ID.
- All 23 packed GLB chunks referenced by the catalog are present in the repository tree, and the existing original T-shirt Cannon model remains available.
- Inline website JavaScript passed syntax compilation.
- No files were deleted from the existing website.
- Browser layout, CAD render performance and deployment of this review branch have NOT been verified. The live site remains on main.

## Maintenance

Edit content under `content/`, ordering and labels in `navigation.json`, robot metadata in `robots.json`, model catalog in `models/catalog.json`, sponsors in `sponsors.json`. `builder.html` remains export-only, not a public write endpoint. Keep new sections factual; reference original binders and build photos.
