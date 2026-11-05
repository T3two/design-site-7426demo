# Pair of Dice Design — start here

This is a starter website prepared from your Word document. It is designed so you can manage it from a school computer using a web browser. You do **not** need to install Python, Node.js, or a code editor to publish it.

## What is included

- A responsive website with navigation.
- Your document divided into separate editable pages.
- A CAD Library page that reads `models/catalog.json`.
- A reusable browser-based 3D viewer for GLB models. It supports orbit/rotate, zoom, and pan.
- A starter model catalog for individual parts and assemblies.

**Important:** The two example CAD entries are placeholders. They will show a missing-model message until you upload your own GLB files and update the catalog.

## Easiest publishing method: GitHub Pages

1. Sign in to GitHub (or create an account if permitted by your school).
2. Click the `+` button in the upper-right, then choose **New repository**.
3. Name it `pair-of-dice-design`.
4. Set it to **Public** if you want a free public GitHub Pages site.
5. Create the repository.
6. Open the new repository and choose **Add file → Upload files**.
7. Unzip this downloaded project on a computer where you can extract ZIP files. Upload the *contents* of the `pair_of_dice_design` folder, not the folder itself.
8. Commit the uploaded files.
9. In your repository, open **Settings → Pages**.
10. Under **Build and deployment**, choose **Deploy from a branch**.
11. Choose branch `main` and folder `/ (root)`, then click **Save**.
12. Wait a few minutes. GitHub Pages will show your website address in the Pages settings.

If your school blocks GitHub or ZIP extraction, use a personal device or ask your teacher/IT staff for an approved way to access the files. Do not bypass school restrictions.

## How to edit an article later

1. Open your GitHub repository in the browser.
2. Open the `content` folder.
3. Click the page you want, such as `motors.md`.
4. Click the pencil icon to edit.
5. Make your changes.
6. Click **Commit changes**.
7. Wait for GitHub Pages to update the website.

Use simple Markdown:
- `# Heading` for a large heading
- `## Subheading` for a section
- `**bold text**` for bold
- `- item` for a bullet
- `[link text](https://example.com)` for a link

## How to add an Onshape CAD model

1. Open the part or assembly in Onshape.
2. Export it as **GLB** if that export option is available in your Onshape workflow.
3. In GitHub, upload the GLB file to:
   - `models/parts/` for one part
   - `models/assemblies/` for an assembly
4. Open `models/catalog.json` and edit it.
5. Copy one example entry and change its `id`, `name`, `type`, `description`, and `file`.
6. Make sure the `file` path exactly matches the uploaded file name.
7. Commit both changes.

Example catalog entry:

```json
{
  "id": "kraken-x60-mount",
  "name": "Kraken X60 Mount",
  "type": "part",
  "category": "Motor Mounts",
  "description": "A mounting plate designed for a Kraken X60.",
  "file": "models/parts/kraken-x60-mount.glb",
  "onshapeUrl": "PASTE_PUBLIC_ONSHAPE_DOCUMENT_LINK_HERE",
  "downloads": []
}
```

For downloadable STEP files, upload the STEP file to the repository and add an item inside `downloads`, for example:

```json
"downloads": [
  {"label": "STEP", "file": "models/parts/kraken-x60-mount.step"}
]
```

Only publish models and Onshape links that you have permission to share. Do not upload private team designs or proprietary files without approval.

## Current limitations

This is the first version, not the final advanced viewer. The current viewer supports interactive rotate, zoom, and pan. Component selection, component trees, exploded views, and measurement tools are planned enhancements and are not implemented yet.

The website loads its Markdown renderer and 3D viewer from external CDNs, so an internet connection and access to those services are required. If the school network blocks them, the site may need an approved alternative.

The original Word content was transferred into separate pages, but please review image placement, code formatting, and headings before publishing. This is a content migration, not a technical fact-check of the original document.
