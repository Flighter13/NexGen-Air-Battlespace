# NexGen Air Battlespace

A public research and visualization application for exploring published air-combat concepts, entity profiles and their sources. This is software for presenting research, not aircraft design, operational planning, or a validated simulation.

## Run locally

The GitHub version lives in `research-app/` beside the original website. Open that folder before running commands.

Install Node.js 22.12+ (Node 24 recommended), open a terminal in this folder, then:

```sh
npm ci
npm run dev
```

Open the local address printed by Vite. `npm test` checks research references, group behavior and timeline/motion behavior. `npm run build` type-checks and creates `dist/`; `npm run preview` previews that build. A lockfile pins the tested dependencies. No API key or account is required.

## What is included

- React + TypeScript + Vite application with responsive entity library and source-linked profile cards.
- MapLibre geographic view and deck.gl paths, actors, site labels and active relationship layers.
- D3 force-layout network view derived from the same actors and relationships.
- Reusable deterministic timeline with play/pause, speed, reset, phase jumps and backward/forward scrubbing.
- JSON records separated into entities, sources, scenarios, locations, relationships and groups. Files are discovered automatically.
- Entity images, member selection, group visibility/focus and shared-track animation.
- Dynamic presentation paths with linear or smooth interpolation, automatic path-following heading, manual/fixed headings and heading-relative group rotation.
- Per-entity icon heading offsets so replacement artwork can be aligned without changing mission data.
- Runtime schema validation, cross-reference validation and an actionable data-error page.
- Two illustrative starter scenarios: a three-axis CCA concept overview and distributed logistics. Six entity records include three basic historical/official aircraft profiles and three clearly labeled research concepts.

## Research boundaries

The baseline is the [original NexGen site](https://flighter13.github.io/NexGen-Air-Battlespace/), its mission/profile interaction, and the two user-supplied Mitchell Institute PDFs. This is a clean implementation: the local mirror contained no synced original application files. The source PDFs were read but are not redistributed. The former site was inspected directly; no old capability claims were imported wholesale.

The sweep concept is adapted from executive-summary PDF page 7. The logistics example is motivated by pages 11–15. Report conclusions describe a research exercise. They are not proof of real platform capabilities or interoperability. All starter geography, counts, routes, links and animation timings are illustrative. The generic CCA actors are not YFQ-42A or YFQ-44A. The real-aircraft library retains dated 2025 designation claims; it does not claim current program status.

## Where to edit

```text
data/
  entities/        One independent profile per JSON file
  sources/         Publications, government pages, manufacturer pages, lectures
  scenarios/       Roles, phases, named geographic keyframes, assumptions
  groups/          Named members, shared tracks, motion settings and geographic offsets
  locations/       Longitude/latitude points and their provenance
  relationships/  Directed scenario links, types, timing and evidence
src/
  data/            Schemas, automatic loading, reference validation
  engine/          Timeline, interpolation, heading and formation-motion functions
  visualization/   MapLibre/deck.gl map and D3 network
  components/      Profile, timeline and reusable citations
tests/             Data-integrity, group and motion tests
docs/              Authoring, architecture, motion and migration notes
```

See [motion and headings](docs/MOTION.md) for curved routes, automatic/manual headings, rotating formations and icon orientation. See [images and groups](docs/GROUPS.md) for member editing and image provenance. See [the content guide](docs/AUTHORING.md) for adding research without changing rendering code and [architecture notes](docs/ARCHITECTURE.md) for extending the application.

## Hosting and external services

`dist/` can be served by any static host; Vite uses relative asset paths for repository subdirectories such as GitHub Pages. Nothing has been published. Serve over HTTP rather than opening `index.html` directly. A public-domain Natural Earth land basemap is bundled locally, so map rendering does not need an API key or external tile server. Google Fonts is optional with system-font fallbacks and receives normal browser requests. Without WebGL, select Network.

## Current limits

This is an editable foundation, not a completed research catalog. There is no CMS, backend, authentication, live program-status feed, outcome calculation, threat modeling, sensor or weapon performance model. Motion is presentation animation, not flight dynamics: smooth paths are interpolation through authored waypoints, heading is visual orientation, and timeline seconds do not imply aircraft speed. Single-point tracks hold position; tracks hold their first/last location outside keyframe bounds. Very large datasets will need indexing, filtering and map-layer tuning. Source URLs are human-reviewed references, not automatically archived or continuously verified.
