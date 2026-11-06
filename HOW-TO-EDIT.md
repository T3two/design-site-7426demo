# Pair of Dice Design: Easy Editing Guide

This guide is written for editing the website through GitHub in a browser. You do not need to install a code editor.

## The five files you will edit most often

| File or folder | What it controls |
|---|---|
| `content/` | Page text and images (Markdown files) |
| `navigation.json` | Sidebar tabs, pages, and subtabs |
| `models/catalog.json` | Which 3D models appear and where |
| `sponsors.json` | Sponsor names, logos, levels, and links |
| `settings.json` | Colors, site name, footer, and loading screen |

You normally do not need to edit `index.html` or `styles.css`.

---

## A. Add a 3D model

The website uses Google's `<model-viewer>` component. It supports GLB and glTF models. For the simplest upload, use **`.glb`**.

### Step 1: Upload the file

In your GitHub repository, open one of these folders:

- `models/parts/` for an individual part.
- `models/assemblies/` for a complete assembly.

Choose **Add file → Upload files**, upload the `.glb`, and commit the change.

Use a short filename with lowercase letters, numbers, and hyphens. Example: `motor-mount.glb`.

### Step 2: Add the model to the catalog

Open `models/catalog.json`, click the pencil icon, and add an entry inside the `"models"` list.

Example for a harmless mechanical component:

```json
{
  "id": "motor-mount",
  "name": "Motor Mount",
  "type": "part",
  "description": "A mounting plate for a robot motor.",
  "file": "models/parts/motor-mount.glb",
  "thumbnail": "",
  "pages": ["cad-library", "cad-parts"],
  "onshapeUrl": "",
  "downloads": []
}
```

Important:
- Each model needs a unique `id`.
- The `file` path must match the uploaded filename exactly, including capital letters.
- Use `"type": "part"` or `"type": "assembly"`.
- `pages` controls which pages automatically show the model.
- `thumbnail` is optional. Upload an image into `assets/` and enter its path.
- `onshapeUrl` is optional.
- Leave `downloads` as an empty list if you do not have files to share.

If the catalog already has models, add a comma after the previous model entry before adding the next one. JSON does not allow comments or trailing commas.

### Step 3: Put a model between paragraphs

To put a model at an exact spot in a Markdown article, add this on its own line:

```text
{{model:motor-mount}}
```

The ID between the colon and the closing braces must match the model's `id` in `catalog.json`.

You can use the same model token in more than one article. You do not need to edit the main JavaScript.

### Viewer controls

- Drag with the mouse to rotate.
- Scroll to zoom.
- Use touch gestures on a touchscreen.
- Select **Reset view** to return to the starting camera.
- Select **Full screen** to expand the viewer when the browser allows it.

If a model does not load, check the spelling and capitalization of its file path, confirm the file is in the repository, and make sure the school network allows the viewer library to load.

---

## B. Edit an existing page

1. Open the `content` folder in GitHub.
2. Select a page, such as `motors.md`.
3. Select the pencil icon.
4. Edit the text.
5. Select **Commit changes**.

Basic Markdown:

```markdown
# Main heading

## Section heading

A normal paragraph. Use **bold** for emphasis.

- First bullet
- Second bullet

[Link text](https://example.com)
```

### Add an image

1. Upload the image into `assets/`.
2. In your Markdown page, add:

```markdown
![Description of the image](assets/my-image.png)
```

Use the exact filename and capitalization. The Markdown pages are stored in `content/`, but image paths are written from the website root, so use `assets/...`, not `../assets/...`.

---

## C. Create a new page

### Step 1: Create the Markdown file

In GitHub, open `content/`, select **Add file → Create new file**, and name it:

`robot-design-notes.md`

Add your page text, then commit it.

### Step 2: Add it to the sidebar

Open `navigation.json`. Find the group where you want the page to appear. Add an item inside that group's `"items"` list:

```json
{
  "id": "robot-design-notes",
  "label": "Robot Design Notes",
  "file": "robot-design-notes.md",
  "eyebrow": "ENGINEERING NOTES",
  "description": "Notes and lessons from robot design.",
  "title": "Robot Design Notes"
}
```

If another item is already above it, put a comma after that item's closing brace. Do not put a comma after the final item in a list.

The `id` becomes the page address (`?page=robot-design-notes`). The `file` must match the Markdown filename in `content/`.

---

## D. Create a main sidebar tab and subtabs

The sidebar is organized into groups. A group heading such as `"CAD RESOURCES"` is a visual section label. Its `"items"` are the clickable main pages.

### Add another main tab

Add a page item to the `"items"` list in the group where it belongs. Create its Markdown file in `content/` first.

### Add subtabs under a main tab

Find the main page item that should contain the subtabs. Add a `"children"` list inside that item:

```json
{
  "id": "cad-library",
  "label": "CAD Library",
  "file": "cad-library.md",
  "eyebrow": "INTERACTIVE CAD",
  "description": "Explore public CAD models.",
  "title": "CAD Library",
  "children": [
    {
      "id": "cad-parts",
      "label": "Individual Parts",
      "file": "cad-parts.md",
      "eyebrow": "CAD LIBRARY · PARTS",
      "description": "Browse individual component models.",
      "title": "Individual Parts",
      "modelType": "part"
    },
    {
      "id": "cad-assemblies",
      "label": "Assemblies",
      "file": "cad-assemblies.md",
      "eyebrow": "CAD LIBRARY · ASSEMBLIES",
      "description": "Browse complete assembly models.",
      "title": "Assemblies",
      "modelType": "assembly"
    }
  ]
}
```

Each subtab needs its own Markdown file. The example above filters the model catalog by part or assembly.

### Reorder or rename tabs

- To reorder: move the whole page object higher or lower in the `"items"` or `"children"` list.
- To rename: change `"label"`.
- To remove: remove that page object from `navigation.json`. The Markdown file can remain in `content/` as a draft.
- To collapse or expand subtabs: use the small arrow beside the parent tab.

The current navigation system supports one level of subtabs.

---

## E. Add sponsors

### Step 1: Upload each logo

Create or use `assets/sponsors/` and upload sponsor logo files there. Use PNG, JPG, or WebP images. Keep the original proportions; the website fits logos into a consistent display area.

### Step 2: Add sponsor information

Open `sponsors.json` and add an entry inside `"sponsors"`:

```json
{
  "name": "Sponsor Name",
  "level": "Gold",
  "description": "Optional short description.",
  "logo": "assets/sponsors/sponsor-name.png",
  "url": "https://example.com"
}
```

Only publish sponsor names, logos, and links that the team has approved. The Sponsors page updates automatically. If logos are provided, a small logo row can also appear near the bottom of the homepage.

To remove a sponsor, remove its entry from `sponsors.json`. You do not need to edit the page itself.

---

## F. Change the design and loading screen

Open `settings.json`.

### Change colors

Edit the values in `"theme"`:

- `"accent"`: main Pair of Dice red.
- `"accentDark"`: darker red for hover and emphasis.
- `"accentLight"`: pale red backgrounds.
- `"page"`: main page background.
- `"sidebar"`: sidebar background.
- `"text"`: main text color.
- `"muted"`: secondary text color.
- `"line"`: borders and dividers.

Use six-digit hexadecimal color values such as `"#a32632"`.

### Change the loading screen

The `"loading"` section controls it:

- `"enabled"`: set to `true` or `false`.
- `"logo"`: optional path to an image, such as `"assets/loading-logo.png"`.
- `"text"`: message shown under the logo.
- `"background"`: loading screen background color.
- `"accent"`: loading bar color.
- `"minimumDisplayMs"`: minimum time in milliseconds before it fades away.

To use your own logo, upload it into `assets/` and put its exact path in `"logo"`. Leave `"logo"` as an empty string to use the built-in 7426 mark.

The loading bar is an animated progress indicator, not an exact percentage of all files downloaded. The screen also has a timeout so it should not remain visible forever if a request fails.

---

## G. Publish updates on GitHub

1. Open your repository in the browser.
2. Open the file or folder you want to change.
3. Upload files or edit the JSON/Markdown file.
4. Select **Commit changes**.
5. Wait for GitHub Pages to publish the update.
6. Refresh your website. If an old version remains, do a hard refresh (`Ctrl + Shift + R`) if your browser permits it.

Keep the folder structure exactly as it is. Do not upload only the contents of `content/` or `assets/` to the repository root.

---

## H. Quick troubleshooting

| Problem | What to check |
|---|---|
| A page says it cannot load | The Markdown filename in `navigation.json` must match the file in `content/`. |
| A sidebar link does nothing | Check that its `id` is unique and that its Markdown file exists. |
| A model card shows an error | Check the exact `file` path in `models/catalog.json`. |
| A model does not appear on a page | Check its `pages` list or the `{{model:your-id}}` token. |
| An image is missing | Use `assets/filename.png` and check capitalization. |
| Sponsors do not appear | Check that `sponsors.json` is valid JSON and that the logo path exists. |
| The viewer does not load at school | The school network may block the external model-viewer library. Try an approved network or ask school IT. |
| The page is blank after editing JSON | Look for a missing comma, extra comma, unmatched quote, or unmatched brace. |

**Important:** GitHub Pages is case-sensitive. `Motor-Mount.glb` and `motor-mount.glb` are different filenames.
