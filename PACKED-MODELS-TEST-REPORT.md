# Test report — large GLB hosting solution

- All seven season GLBs were read from the supplied complete ZIP.
- ZIP-internal DEFLATE was wrapped as standards-compliant gzip and split into 20 MiB fragments; no geometry rewriting is involved.
- Every model's gzip fragments were reconstructed and the output SHA-256 and length matched the actual ZIP member exactly.
- The compressed payloads total 393.45 MiB, fitting comfortably within GitHub Pages' 1 GiB site limit alongside the current site assets.
- JavaScript using native DecompressionStream reconstructed and SHA-256-verified the 2022 and 2024 models in Node 22, including the 248.6 MiB 2024 GLB.
- The patched inline index.html JavaScript parsed without syntax errors.
- Actual model-viewer/WebGL rendering and remote GitHub Pages deployment have not been verified; the binary fragments still must be uploaded through GitHub Desktop or the GitHub web editor.