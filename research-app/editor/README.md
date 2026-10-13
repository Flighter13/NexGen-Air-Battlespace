# Phase 5: Local research authoring

The editor is an **offline-capable local developer tool**, not part of the GitHub Pages deployment. It imports the existing catalog for reference and never writes to the repository, changes Git, or publishes automatically.

## Start on JDP-LAPTOP2

```powershell
cd D:\NexGen-Air-Battlespace\research-app
npm run editor:dev
```

Visit the local URL printed by Vite. Microsoft Edge is supported.

## Editing

1. Choose a collection and existing record, or select **New record**.
2. Edit JSON with the original schema and source citations.
3. Use **Validate draft** to check schema, IDs, scenario references, and citation references against the current bundled catalog.
4. If valid, click **Export validated JSON**.
5. Review the file and place it under `research-app/data/<collection>/<id>.json`.
6. Run `npm test` and `npm run build -- --base=/NexGen-Air-Battlespace/research/` before committing to GitHub.

**Important:** New source records must be committed and reloaded before drafting dependent records; the validation uses the checked-in catalog as its reference set. Validation does not verify the factual accuracy or freshness of publications, so source claims require human review. Importing a file does not save it. JSON downloads are local drafts; no data is automatically published.

## Building

`npm run editor:build` creates a separate `editor-dist/` output. The public research application continues to build into `dist/`. The GitHub Pages deployment workflow packages only the latter. There is no login, server database, network write API, or CMS in this editor.

## Limitations

The editor currently provides a structured, schema-validated **JSON** workspace rather than one form per schema field; it does not automatically merge individual exported records, write directly into the repository, or manage image rights. Those actions intentionally remain part of the review-and-Git workflow.
