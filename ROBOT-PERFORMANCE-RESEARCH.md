# Pair of Dice 3D performance engineering — November 2026

This document records the performance intervention applied to the Team 7426 design website. All figures are measured source-file sizes from the generated `models/preview/catalog.json` and `models/preview/subsystems.json`. No synthetic robot meshes replaced actual team CAD.

## Root cause (before)

The original website downloaded entire full-resolution robot GLBs before showing an interactive 3D viewport. While the assets were gzip-packed, decompressing them produced large GPU-heavy GLBs: 53.99 MB for 2026, 68.41 MB for 2025, 260.71 MB for 2024, and 242.53 MB for 2023. Packed older models needed several sequential 20 MiB fragments, decoded, reassembled, and transferred to the GPU. Other parts used 2–49 MB files even for an isolated subsystem. Compressing bytes alone did not reduce triangles, CPU object creation, draw calls, or VRAM.

## New two-tier model strategy

- A real fast model derived from the original CAD is the **default interactive robot**, not a static stand-in. Retained model naming and material groups support the same camera, navigation, and engineering interaction logic.
- Fast files use native gltfpack 0.25 with `-cc -si 0.38 -sp -kn -km -ke -mi` for complete robots and `-si 0.65` for subsystems (more mechanism detail). `-cc` is EXT_meshopt_compression; `-kn` keeps named geometry; `-mi` enables instancing where beneficial.
- Client Three.js calls `GLTFLoader.setMeshoptDecoder`. The separate model-viewer web component gets its own Meshopt decoder URL *before registration*.
- The complete **unmodified** original CAD remains on the site and can be loaded explicitly using "Inspect original CAD". Opening the standard preview never downloads the original.
- Previews are generated in GitHub Actions from the packed original GLBs, verifying original source length and SHA-256 before converting; the pipeline validates each resulting GLB's header and size, and publishes a hash/size manifest.
- Cards show fast models automatically only for season assemblies in view. Isolated subsystems are opt-in to avoid 14 WebGL canvases competing for GPU time.

## Actual files, robot assemblies

| Season | Original transfer (gzip MB) | New fast model (MB) |
| --- | ---: | ---: |
| 2026 | 18.19 | 2.30 |
| 2025 | 27.63 | 3.76 |
| 2024 | 122.98 | 8.75 |
| 2023 | 130.44 | 8.65 |
| 2022 | 7.75 | 1.17 |
| 2020 | 19.12 | 2.27 |
| 2019 | 86.46 | 8.18 |
| **Total** | **412.56** | **35.08** |

**91.5% smaller transfer across seven assembly models**, comparing the previous actual compressed transfer size to the new real, compressed 3D models. Some geometric detail is deliberately reduced in the fast models; the original remains fully available.

## Subsystems

**14 real parts:** 237.61 MB original → 10.87 MB fast model total (**95.4% smaller**). For example, 2026 shooter 6.62 MB → 0.36 MB, 2025 claw 19.69 MB → 0.73 MB. The smaller first view leaves peak bandwidth and memory for interactive animation rather than loading the same robot twice.

## Rendering architecture

- Fast materials and the same physical camera controls; unmodified originals remain accessible.
- Pixel ratio capped to 1.15 on mobile/low-memory devices, 1.35 elsewhere to reduce GPU fill rate.
- CAD poster only dissolves after the first 3D frame has actually rendered. A slow connection keeps the current artwork visible rather than blank.
- The main site no longer shows a blocking video splash. Navigation keeps the previous page during fetch, caches Markdown text, and prefetches the two welcome destinations.
- Ace is the **original 3D mascot**, not third-party art: 3-band toon light, selective low-cost ink outlines, graphic print dots behind the scene, and 12 fps stepped body acting. The camera remains smooth.
- A page's CAD model is released when leaving that page, and offscreen scenes are paused.

## Validation and remaining boundaries

- All 21 generated preview files are identified by SHA-256 in the manifest.
- Browser checks cover all seven fast previews, assert that original packed files were NOT fetched in the normal viewing path, verify that the scoring demonstration still runs, verify two Ace WebGL canvases, and check the initial welcome view.
- The finished branch is only merged after CI verifies the 3D scenes; passing headless Chromium does **not** guarantee a specific time on all school laptops, phones, or slow networks.
- Rendering the full original CAD, on demand, is necessarily slower; high-fidelity 200+ MB models cannot realistically be guaranteed under 500 ms from a static web host.
- GitHub Pages published-site limit is 1 GB (2026 Git tree is ~726.5 MB), so retain awareness of storage/bandwidth growth.

## References

- Official gltfpack guide: https://meshoptimizer.org/gltf/
- glTF Transform optimizer: https://gltf-transform.dev/
- Meshopt decoder setup: https://threejs.org/docs/#examples/en/loaders/GLTFLoader
- Google model-viewer Meshopt support: https://modelviewer.dev/examples/loading/
- GitHub Pages hosting limits: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
- Reference on mesh simplification: https://gltf-transform.dev/modules/functions/functions/simplify

## Rebuilding previews

1. Update the original models and manifest in `models/catalog.json` if a verified CAD export changes.
2. From the repository's preview-generation workflow, run `tools/build_robot_lods.py` and `tools/build_subsystem_lods.py` using gltfpack 0.25. Never replace the original packed models with lossy previews.
3. Review file-size summaries, SHA-256 manifests, and browser smoke results before publishing.

## Architecture comparison against professional 3D web techniques

| Approach | Strength | Cost or limitation | Decision |
| --- | --- | --- | --- |
| Three.js + WebGL2 + optimized glTF | Already powers the working robotics simulator; exposes reliable OrbitControls, PBR materials, GLTFLoader, meshopt decoding and custom mechanical animation | Requires careful scene/material lifetime management and explicit DOM/UI wiring | **Keep and optimize** instead of replacing functioning code |
| React Three Fiber | Good component composition and declarative lifecycle for complex React apps | A migration from a static site introduces React/runtime bundles and costly regression surface without decreasing source geometry bytes | **Do not migrate merely for fashion** |
| Three.js WebGPU | Modern rendering and compute options; excellent long-term potential | Browser/GPU variance, renderer API migration, and less predictable hardware support for school and mobile devices | **Future optional feature detection**, not a blocker for the current production site |
| Unity WebGL / full game-engine build | Rich authoring and established editor workflows | High startup payloads and broad device requirements; too heavyweight for a largely static educational binder | **Do not adopt** |
| Rapier rigid-body engine | Contact/joints, kinematic bodies, constraints for verified collision scenes | Adds runtime and an authoring burden for correctly labeled collision proxies; will not create physical truth from unknown axes/telemetry | **Defer for verified mechanical data**; use constrained CAD transforms and educational analytical paths now |

The choice is **not** a benchmark claiming Three.js wins universally. For this team's actual repository, model delivery and GPU geometry dominated the initial delay, so rewriting the UI framework would not solve the main problem.

### Transfer, decode, first-frame and transition are distinct metrics

1. **First meaningful paint**: immediate HTML and actual static previews; no blocking splash.
2. **Cold real 3D**: network transfer + Meshopt decompression + glTF parse + scene construction + shaders + GPU upload. On a software-rendered GitHub Actions Chromium test, measured first interactability varies by season and is not guaranteed sub-500 ms.
3. **Warm subsystem selection**: reused decoded GLTF, GPU resources and a single camera/fade animation; test this separately from cold load.
4. **High-detail inspection**: explicit user action downloads original assemblies; large originals still require a noticeable load.
5. **Runtime stability**: measured in `?perf=1` diagnostics with live FPS estimate, frame-time p95, draw calls, triangles, geometry and textures. Those numbers depend on the actual machine.

Chrome's Performance panel provides LCP, INP, layout shift, and long-frame traces; WebGL renderer.info provides draw calls, triangle and memory counters. The automated software-rendered browser suite is valuable for regressions but **not a reliable proxy for 60 FPS on real desktop or phone GPUs**.

### Graphic direction and professional references

The welcome art is the team's own Ace mascot in a stylized, held-frame, ink-outlined Three.js scene. The robot uses a separate restrained, white-background PMREM/PBR materials environment so the character's comic treatment never alters source engineering geometry. Professional vehicle-configurator case studies reinforce the design choice: preserve a stable scene and camera while users change what is being inspected. Their art/assets are not copied.

Relevant public references and technical documentation:

- [Three.js GLTFLoader (Meshopt, KTX2, Draco)](https://threejs.org/docs/pages/GLTFLoader.html)
- [Three.js WebGLRenderer shader compilation](https://threejs.org/docs/pages/WebGLRenderer)
- [Meshoptimizer gltfpack optimization](https://meshoptimizer.org/gltf/)
- [Three.js InstancedMesh draw calls](https://threejs.org/docs/pages/InstancedMesh.html)
- [Rapier joint constraints](https://rapier.rs/docs/user_guides/javascript/joints/)
- [Chrome Performance panel: measuring frames and Web Vitals](https://developer.chrome.com/docs/devtools/performance/reference)
- [Web-focused BMW configurator case study](https://interactiva.studio/3d-car-configurator/)
- [Porsche 3D interactive case study (fan project)](https://adjierizqan.com/projects/porsche-3d/)
- [Official FRC REBUILT 2026 game manual](https://firstfrc.blob.core.windows.net/frc2026/Manual/HTML/2026GameManual.htm)
- [Official FIRST archived games](https://www.firstinspires.org/resources/library/frc/archived-games)

## Engineering trust boundary

**Actual team CAD is a source of geometric evidence, not complete behavioral evidence.** The user-provided 2026 article includes specific design descriptions; the 2025 page explicitly flags missing verified engineering specifications. There is currently no full 2025 engineering notebook or measured joint envelope in this repository, and the `binders/` directory does not contain a verified original binder PDF. Therefore do not label the viewer's illustrative claw path or idealized fuel trajectory as a verified digital twin. The UI's Evidence tab says exactly which motion assumptions need confirmation.

Exact collision proxies, joint hard-stop angles, verified roller axes and shot/placement telemetry would be required before certifying a physically grounded twin. The source code retains those demonstrations as **illustrative, CAD-derived scenes**, while numeric original measurements are never silently invented to fill gaps.
