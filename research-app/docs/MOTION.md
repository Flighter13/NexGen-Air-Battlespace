# Motion, headings and formations

Mission motion is presentation data, not a flight-dynamics or performance model. The engine intentionally treats time, paths and formation spacing as illustrative unless a source explicitly supports a statement.

## Group motion

Add an optional `motion` object to any file in `data/groups/`:

```json
{
  "motion": {
    "path": "smooth",
    "heading": "path",
    "rotateFormation": true
  }
}
```

### Path modes

- `linear` — straight interpolation between authored geographic keyframes.
- `smooth` — Catmull-Rom interpolation through the same keyframes. Add intermediate location records to shape the curve.

The map route is sampled from the same function used to place the moving icon, so the icon follows the visible path.

## Heading modes

### Follow the path

```json
{
  "motion": {
    "heading": "path"
  }
}
```

The icon bearing is calculated from the current route direction and changes continuously as the path bends.

### Fixed heading

```json
{
  "motion": {
    "heading": "fixed",
    "fixedHeading": 90
  }
}
```

Use this when the visual should keep a constant bearing independent of travel direction.

### Manual heading keyframes

```json
{
  "motion": {
    "heading": "manual"
  },
  "keyframes": [
    { "t": 0, "locationId": "start", "heading": 350 },
    { "t": 20, "locationId": "turn", "heading": 10 }
  ]
}
```

Every keyframe must include `heading` in manual mode. Angles interpolate across the shortest turn, so 350° to 10° rotates 20° instead of 340°.

## Rotating a group formation

Member `offsetKm` values are local east/north offsets. By default they stay aligned to the map. Set:

```json
{
  "motion": {
    "rotateFormation": true
  }
}
```

to rotate those offsets with the path bearing. The whole group then turns around its shared route without separate tracks for every member.

## Icon orientation

The renderer assumes the icon artwork points toward 0°/north. If an asset is drawn with a different default orientation, add `headingOffset` to the entity's `media` record:

```json
{
  "media": {
    "icon": "assets/entities/example.svg",
    "src": "assets/entities/example.svg",
    "alt": "Example icon",
    "credit": "Research project",
    "rights": "Project asset",
    "headingOffset": 90
  }
}
```

This rotates only the artwork; it does not change the actor's research heading.

## Shaping a curved route

Do not add screen coordinates to React components. Add or edit location records and reference them as keyframes:

```json
{
  "keyframes": [
    { "t": 0, "locationId": "start" },
    { "t": 15, "locationId": "bend-a" },
    { "t": 30, "locationId": "bend-b" },
    { "t": 45, "locationId": "end" }
  ],
  "motion": {
    "path": "smooth",
    "heading": "path"
  }
}
```

That keeps research content separate from the rendering engine and lets the same group be redrawn by editing only JSON.
