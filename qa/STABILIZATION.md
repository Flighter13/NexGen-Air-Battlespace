# Phase 1 — Stabilization checklist

The research app lives in `research-app/`. This phase preserves the scenario catalog and existing interactions.

## Verification commands

```sh
cd research-app
npm ci
npm test
npm run build -- --base=/NexGen-Air-Battlespace/research/
```

The deployment workflow checks for the generated MapLibre worker and mobile research UI in the published artifact before deploying.

## Desktop/mobile browser regression

On Windows with Microsoft Edge installed, use the separate Playwright test workspace at
`C:\\Users\\jdp4v\\Documents\\Website Testing\\playwright`. It already has Playwright installed.
Run the versioned Edge script in `qa/edge-regression.cjs` from a directory where `playwright` can be resolved, for example by copying it to that existing Playwright workspace.

Checks cover:
- 1440×900 desktop and 390×844 mobile
- successful page load and absence of significant horizontal overflow
- scenario switching, Geographic/Network view toggle, mobile section tabs
- asset failures and uncaught JavaScript errors
- timeline Play interaction where available

The browser run is non-destructive; it exercises the public deployed site.

## Known follow-up

Vite reports a large bundle (~2 MB uncompressed). Consider dynamic imports for the map and graph engines, and retest map switching before changing bundle splitting.
