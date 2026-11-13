# Welcome screen: four hand-drawn assets

This folder is intentionally empty of finished artwork until the user uploads and approves their own drawings.

The welcome gateway in `index.html` has **exactly four art slots**:

| Slot | Manifest key | Suggested file | Visual role |
| --- | --- | --- | --- |
| 1 | `designBackground` | `assets/welcome/design-background.png` | Left-side design sketches / blueprint background |
| 2 | `designAce` | `assets/welcome/design-ace.png` | Left-side pointing Ace |
| 3 | `robotBackground` | `assets/welcome/robot-background.png` | Right-side robots / archive background |
| 4 | `robotAce` | `assets/welcome/robot-ace.png` | Right-side seated Ace with sunglasses, crossed arms and restrained aura |

After art approval:
1. Upload the four image files into this directory.
2. Put each corresponding **repo-relative** filename in `manifest.json`, e.g. `"designAce": "assets/welcome/design-ace.png"`.
3. Keep the Ace images transparent (PNG or WebP with alpha) for clean layering. Backgrounds can be opaque.
4. Confirm placement on desktop and mobile. Tune only the `.welcome-art--ace` and `.welcome-art--background` rules in `styles.css` if needed.

Before upload the site displays restrained, clearly labeled layout placeholders. Empty manifest keys never issue image requests. The user requested that the original reference art not be included or republished; no reference files or generated mascots are committed here.

Both scene areas and central buttons navigate to real routes: `?page=design-teaching` and `?page=robot-archive`. The existing engineering pages, robot models, and sidebar navigation remain available.

## First real 3D prototype (ready on the review branch)

The welcome screen now renders two versions of original Ace geometry in interactive WebGL:
- `assets/welcome/ace_pointing.glb.gz`: pointing Ace, his usual square glasses
- `assets/welcome/ace_seated.glb.gz`: Ace seated on a chair, crossed arms and sunglasses

The gzip-compressed files contain real GLB model bytes. `assets/welcome/ace-3d.js`
decompresses and loads those meshes through Three.js `GLTFLoader`, applies
matte toon materials, builds pivots for simple head and arm movement, and renders
two restrained animated scenes. A procedural geometry fallback shows the same
character design if stream decompression or asset loading is unavailable.
No generated illustrations, scans or personal reference images are stored in the repo.

This is the first blockout/animation pass, not the final artist-reviewed model.
It deliberately retains simple low-poly forms while the user evaluates the look.
It does not yet have advanced skeletal rigging, frame-by-frame anime character
acting, cinematic camera cuts or real competition robots in the background.
The main branch remains untouched until the user approves.
