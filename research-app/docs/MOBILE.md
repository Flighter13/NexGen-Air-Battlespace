# Mobile behavior

The research app is designed to preserve the map/timeline interaction on phones rather than simply stacking the desktop columns.

On screens at or below 700 px:

- the concept explorer is placed first;
- the research and profile panels follow below the visualization;
- map/network controls expand to full-width touch targets;
- primary controls use at least 44 px touch height;
- the mission phase timeline becomes a horizontally scrollable, snap-aligned strip;
- the map height follows the viewport while keeping a usable minimum size;
- entity and group controls use single-column layouts where needed.

The intent is to keep the mission animation, phase narrative and timeline usable without requiring the user to scroll through the full entity library first.

When adding more phases, do not change the renderer. Add phase records to the scenario JSON. The phase strip is intentionally scrollable so scenarios can contain longer mission sequences without compressing labels into unreadable buttons.
