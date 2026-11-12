# Robot page worksheet — using it on the site

The editable Word worksheet, `Pair-of-Dice-Robot-Season-Worksheet.docx`, is available as a separate download in the ChatGPT conversation. This repository contains a matching site-ready template at `content/robot-template.md`.

1. Copy `content/robot-template.md` to `content/robot-YYYY.md`.
2. Replace bracketed prompts with team-verified notes; remove sections that don't apply. Explain why choices were made.
3. Replace `{{model:robot-YYYY-assembly}}` with the model ID listed in `models/catalog.json`.
4. Edit the season entry in `navigation.json` to point to the new Markdown file. Existing years already have navigation entries.
5. Add approved photos to `assets/`, then use Markdown such as `![Caption](assets/your-image.png)`.
6. For browser editing, use `builder.html` to export your updated Markdown, then commit it through GitHub.

Keep the team voice natural. Do not publish fill-in prompts, invented specifications, or unapproved photos.
