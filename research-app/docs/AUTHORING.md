# Editing the research

Each JSON file contains one record. Keep IDs stable and unique within each folder. Existing samples are the most complete templates. Vite discovers new files automatically; no renderer or registry edit is needed. Save changes, run `npm test` and `npm run build`, then review both visualizations. Validation rejects broken references and invalid time ranges. Reload the page if a newly added file is not immediately visible.

## 1. Add a source

Create `data/sources/your-source.json`. A source needs `id`, `title`, `publisher`, `kind`, `accessed`, and `notes`. Optional fields are `url`, `published`, and `localFile`. Kinds: government, manufacturer, report, lecture, editorial. URLs must be HTTP(S). Keep your source document or recording accessible and record the exact section, PDF page or timestamp on each citation.

```json
{
  "id": "afa-session-example",
  "title": "Replace with the exact AFA session title",
  "publisher": "Replace with the publishing organization",
  "kind": "lecture",
  "accessed": "2026-09-17",
  "notes": "Replace with speaker, event, date, recording availability and review notes. Add the actual recording URL before relying on it."
}
```

This is an authoring template, not an actual citation. Do not treat a speaker's prediction as a verified capability. Separate the source publication date, date of the underlying statement, and your access date in notes when they differ.

## 2. Add an entity

Copy an entity file, assign a new ID, name, shortName and category (`crewed`, `uncrewed`, `support`). Claims each require `text`, `evidence`, and at least one citation:

```json
{
  "text": "Write one specific, supportable claim here.",
  "evidence": "documented",
  "citations": [
    {
      "sourceId": "your-source-id",
      "locator": "PDF page 8, figure 3; or video 00:14:25–00:15:10"
    }
  ]
}
```

- **Documented:** the cited source directly supports the wording. Identify a manufacturer's assertion as such; a citation does not independently validate it.
- **Analytical:** your interpretation of source material, explicitly distinguished from its claims.
- **Illustrative:** an explanatory invention. Cite an editorial source that records the assumptions.

Use time-qualified claims for program milestones. Do not silently replace historical facts with current status. Add a newer source and revise the wording explicitly. Unknown details can be omitted; do not manufacture specifications to fill the card.

## 3. Add locations

Copy a location record and set coordinates in **[longitude, latitude]** order. Include provenance, notes and evidence. Starter sites are fictional open-ocean positions, not actual basing. Locations belong to the research model; never store browser pixels or screenshot offsets. The schema uses the supported Mercator latitude range of −85 to +85 degrees.

## 4. Add a scenario

Copy an existing scenario. Set its ID, title, subtitle, description, evidence, citations, assumptions and duration. Duration is presentation seconds. Phases must be ordered and continuously cover 0 through duration, without gaps or overlap; phase IDs must be unique.

An actor is an instance of a library entity. Several actors can share an entity ID. Assign each actor a unique scenario-local ID, label and role. Movement is expressed only as time plus a location reference:

```json
{
  "id": "example-group",
  "entityId": "cca-concept",
  "label": "Example study group",
  "role": "Research illustration",
  "keyframes": [
    { "t": 0, "locationId": "hub" },
    { "t": 30, "locationId": "north-start" },
    { "t": 60, "locationId": "hub" }
  ]
}
```

Keyframe times must strictly increase and stay within duration. One keyframe makes a stationary actor. Intermediate positions are interpolated; endpoints are held. Adding a research scenario does not require application-code changes.

## 5. Add relationships

Create one file per directed link. Reference the scenario ID and actor IDs (`from`, `to`), not entity IDs. Set type (`coordination`, `support`, `logistics`), label, evidence, start, end and citations. The link is active on [start, end); a link ending at the scenario endpoint is retained in the final frame. Label a speculative interface as illustrative even when both participating aircraft are real.

## Review before sharing

Read every claim against its exact citation. Check that conceptual actors have not been relabeled as production platforms. Inspect both views at phase boundaries and verify that the scenario's assumptions are visible. For a lecture, record speaker, session, event date, URL and timestamp. Keep quotes brief and use your own synthesis. Record image origins and reuse permissions. This starter includes legacy repository aircraft assets with their provenance limitations shown, plus original abstract symbols; see [images and groups](GROUPS.md).
