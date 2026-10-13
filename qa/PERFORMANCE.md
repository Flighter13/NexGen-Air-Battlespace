# Lazy-loading verification — 2026-10-13

Verified on JDP-LAPTOP2, D:\NexGen-Air-Battlespace, Node 24.19.0 / npm 12.0.2.
Compared baseline 5731e7e406ac922541744a72c156e8c976025450 with
e116b808f8337172dec4baefa6266f209bfc381c using production builds and the
same package lock. Baseline built in a separate detached checkout.

## JavaScript measurements

Bytes on disk; gzip is computed separately per emitted file with Node zlib.
These are build measurements, not browser transfer sizes or load-time benchmarks.

| Measure | Before bytes (gzip) | After bytes (gzip) |
| --- | ---: | ---: |
| App chunk | 2,050,318 (565,599) | 115,563 (31,374) |
| Separate MapView chunk | included in App | 1,915,396 (527,512) |
| Separate NetworkView chunk | included in App | 17,932 (7,151) |
| All emitted JS, including worker | 2,822,546 (796,334) | 2,821,044 (796,708) |
| All emitted JS, excluding worker | 2,313,076 (648,183) | 2,311,574 (648,557) |

App chunk is 94.4% smaller uncompressed. Total JS is essentially unchanged
(-1,502 raw bytes; +374 gzip bytes). Geographic is the default view, so its
large chunk and worker still load on initial navigation. Do not interpret the
App chunk reduction as a 94% reduction in initial page traffic or load time.
Edge request checks confirm NetworkView is not requested before selection.
Vite still reports the large MapView chunk warning.

Reproduce after building each revision:

```powershell
node qa/bundle-sizes.cjs research-app/dist D:/NexGen-performance-baseline/research-app/dist
```

## Verification results

- npm test: 26 tests passed across 5 files.
- npm run build: successful for both baseline and lazy-loaded revisions.
- Edge Playwright: desktop 1440x900 and mobile emulation 390x844 passed against
  the local production preview and live GitHub Pages research site.
- All 4 scenarios: map canvas, Network nodes, actor selection, switching back
  and forth, every timeline phase, playback/reset and phase comparison.
- All 13 library records remain available; search/clear and profile selection work.
- Zero page errors, HTTP errors, failed requests or horizontal page overflow.
- Regression now waits for map requests to settle before changing views.
  Switching immediately after canvas creation had cancelled an in-flight
  land.geojson request; this was a test synchronization issue, not an app regression.
- GitHub Pages deployment for e116b808 completed successfully; live site returned
  HTTP 200 and served separate MapView and NetworkView chunks.
- No application, research catalog, imagery, or authoring content changed during verification.

## Running Edge checks

Use installed Playwright and Microsoft Edge on the laptop:

```powershell
$env:NODE_PATH='C:\Users\jdp4v\Documents\Website Testing\playwright\node_modules'
$env:NEXGEN_TEST_URL='http://127.0.0.1:4187'
node D:/NexGen-Air-Battlespace/qa/edge-regression.cjs
```

Run from a scratch directory to keep screenshots outside the repository.
Omit NEXGEN_TEST_URL to test GitHub Pages. Mobile uses Edge device emulation,
not physical mobile hardware.

Dependency installation reported one high-severity audit finding in the existing
locked dependency tree; dependency remediation was not part of this lazy-loading change.
