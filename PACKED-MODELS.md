# Large GLB models on GitHub Pages — working delivery workflow

**Solution:** Compress each optimized GLB as a single gzip stream, split that stream into GitHub-compatible fragments of **20 MiB maximum**, and reassemble/decompress it *only on demand* inside the browser. This preserves the exact optimized GLB bytes, node organization, and material references. It does NOT simplify the model further or guarantee fast GPU rendering; 2019/2023/2024 remain heavy.

## Upload all seven models (one-time)

1. In GitHub Desktop, clone `T3two/design-site-7426demo` and select branch `pair-of-dice-design-v2-review`. If you do not have a branch locally, fetch from origin.
2. Download all nine parts of `pair-of-dice-design-v3-full` and use `assemble-full-website.py` to produce `pair-of-dice-design-v3-all-robots.zip`.
3. From a command prompt in the folder where you downloaded this utility, run:
   `python pack-models-for-pages.py "path/to/pair-of-dice-design-v3-all-robots.zip" "path/to/design-site-7426demo"`
   Substitute the actual paths. The script reads the compressed ZIP directly; no giant extracted GLBs are necessary.
4. All generated fragments go under `models/packed/YEAR/`, and the script sets the corresponding model's `hosted` flag to `true` in `models/catalog.json`. It verifies each reconstructed model against SHA-256 of the source GLB.
5. Commit the fragments and `models/catalog.json` using GitHub Desktop, then **Push origin**. Use a few commits if GitHub Desktop encounters an upload-size or timeout problem; do not enable `hosted:true` on the deployed branch until *all* fragments are pushed.
6. Test all seven year pages from the deployed site, particularly the three largest models, on a real Chrome/Edge school computer. Once verified, merge the draft PR into `main`.

**No paid host, Git LFS, token, or proxy is required.** The browser gets files from the same GitHub Pages origin. Each stored asset is under the web uploader's 25 MiB per-file limit. Their combined gzip payload should be well below GitHub Pages' 1 GB published-site limit (verify the complete site size). A repository that grows beyond 1 GB should move old models to a CORS-enabled object store.

## Browser compatibility

The website uses the standard `DecompressionStream('gzip')` API. Modern Chrome and Edge support it. The viewer catches missing parts, decompression errors, and unavailable browser APIs and displays an error. **Loading a 250 MB original GLB still requires substantial RAM/VRAM; compression only solves hosting and network size.** Large files load only when requested.

## How this differs from ZIP

The generated `.part001` etc. are consecutive byte ranges of *one gzip stream*. Do not unzip them separately or rename them. The loader fetches the parts in order, streams them through the browser's native gzip decompressor, and passes the byte-identical GLB to `<model-viewer>` as a temporary Blob URL.

## Verified vs unverified

The packer verifies gzip decompression and SHA-256 equality against your actual GLB source. JavaScript syntax is checked. Live GitHub Pages uploads and full WebGL rendering need testing after the user pushes binaries.