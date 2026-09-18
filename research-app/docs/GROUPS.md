# Entity images and groups

## Images

Every entity can have a `media` record with `src`, `icon`, `alt`, `credit`, `rights`, and optional `sourceUrl`. Store files beneath `public/assets/` and reference them as `assets/entities/name.png` (without a leading slash). `src` is used in profiles and library thumbnails; `icon` is used on maps and network nodes. Local paths support deployment beneath a GitHub Pages repository prefix. Failed profile images fall back to a symbol.

Credit text is visible in the profile. The three legacy aircraft images retain their original repository origin without inventing creator or license information. Replace them with better-documented assets when available. Generic concept imagery is labeled original abstract artwork.

## Groups

`data/groups/` contains one JSON record per scenario group. A group owns a shared geographic track and a list of member instances. `scenarioId` binds it to a scenario. Each member specifies `id`, `entityId`, `label`, `role` and `offsetKm: [east, north]`. The offset is an illustrative geographic spacing, not browser pixels or a validated formation. It is limited to ±100 km per axis. The first member can sit at `[0, 0]`.

Copy an existing group to add another. Use unique member IDs across all actors and groups within a scenario. Add/remove entries in `members` to change size; the UI counts the actual records. Members may reference different entities, so one group can mix several types. Attach evidence and citations to the group. Member-specific claims remain in the entity records. Standalone actors remain supported in `scenario.actors`.

In the app, each group can be hidden, focused, and expanded/collapsed. Selecting a member highlights only that actor and opens its entity profile. Hiding/focusing filters both views and removes relationship lines whose endpoints are no longer visible. Show-all clears focus; individual visibility choices are retained. A scenario change resets visibility and selection. Group controls remain available when every group is hidden.

Relationships refer to member IDs rather than group IDs. Shared tracks are resolved by the timeline engine, so all members move together and support deterministic scrubbing. The schematic network shows the same membership and active links but computes its own layout. It does not depict geographic positions.
