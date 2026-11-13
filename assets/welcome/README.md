# Ace 3D Welcome Gateway

This welcome page has two immediately navigable entry points: **Design Teaching** and **Robot Archive**.

## Render and loading strategy

The markup and local stylesheet render the complete hero *before* settings, Markdown, CAD, WebGL, or the 3D models load.

- The old fullscreen loading video is removed. There is no blocking splash.
- `ace-pointing-poster.webp` (16 KB) and `ace-seated-poster.webp` (26 KB) are first-frame images **rendered from the actual Ace 3D models**, not generated cartoon art. They are transparent and ready for immediate paint.
- `ace-3d.js` is an async Three.js module. It loads two compressed GLB assets in the background, and only fades each poster out *after the matching first WebGL frame has rendered*. If WebGL fails, the poster stays visible.
- The animation loop sleeps when a character is outside the viewport or the document is hidden, and it respects reduced-motion settings.
- CAD's model-viewer and robot-explorer libraries load only when a CAD page requests them. Markdown libraries are deferred, fonts are non-blocking, and no video is requested during startup.

## The 3D models

- `ace_pointing.glb.gz`: pointing Ace with regular glasses.
- `ace_seated.glb.gz`: seated Ace with sunglasses and crossed arms.

These are real, low-poly 3D assets, with a procedural fallback inside `ace-3d.js`. The animation is intentionally restrained and low-shading. They are not yet advanced skeletal rigs or feature-film animation quality.

## Optional art manifest

`manifest.json` still allows up to four optional art overrides:
`designAce`, `robotAce`, `designBackground` and `robotBackground`.
All keys are blank by default, and the live 3D scenes do **not** depend on them. Do not publish uploaded reference photos or privately shared sketches.

## Performance boundary

The goal is **no perceived blank loading**, not a fabricated speed guarantee. The website can render the header and hero before network requests finish, but the exact first-paint and animation-ready times depend on visitors' bandwidth, CDN latency, device GPU, browser caching, and connectivity. Inspect real-device LCP after deployment if a strict 500ms measurement is required.
