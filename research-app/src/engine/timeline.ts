import type { Catalog, Scenario, Location } from '../data/schema';
export const clampTime = (t: number, duration: number) =>
  Math.max(0, Math.min(duration, Number.isFinite(t) ? t : 0));
export const advanceTime = (
  t: number,
  elapsedSeconds: number,
  speed: number,
  duration: number,
) => clampTime(t + Math.max(0, elapsedSeconds) * speed, duration);
export function positionAt(
  keys: Scenario['actors'][number]['keyframes'],
  t: number,
  locations: Location[],
): [number, number] {
  const locate = (id: string) => {
    const location = locations.find((l) => l.id === id);
    if (!location) throw new Error(`Missing location ${id}`);
    return location.coordinates;
  };
  if (!keys.length) throw new Error('An actor needs at least one keyframe');
  if (t <= keys[0].t) return locate(keys[0].locationId);
  const right = keys.findIndex((k) => k.t > t);
  if (right === -1) return locate(keys[keys.length - 1].locationId);
  const a = keys[right - 1],
    b = keys[right];
  const p = locate(a.locationId),
    q = locate(b.locationId),
    f = (t - a.t) / (b.t - a.t);
  // Shortest longitude interpolation prevents an accidental world-spanning route.
  const delta = ((q[0] - p[0] + 540) % 360) - 180;
  return [((p[0] + delta * f + 540) % 360) - 180, p[1] + (q[1] - p[1]) * f];
}
export function snapshot(scenario: Scenario, t: number, catalog: Catalog) {
  const time = clampTime(t, scenario.duration);
  const groups = catalog.groups.filter((g) => g.scenarioId === scenario.id);
  const definitions = [
    ...scenario.actors.map((a) => ({
      ...a,
      groupId: '',
      offsetKm: [0, 0] as [number, number],
    })),
    ...groups.flatMap((g) =>
      g.members.map((m) => ({ ...m, groupId: g.id, keyframes: g.keyframes })),
    ),
  ];
  const actors = definitions.map((a) => ({
    ...a,
    position: offsetPosition(
      positionAt(a.keyframes, time, catalog.locations),
      a.offsetKm,
    ),
    entity: catalog.entities.find((e) => e.id === a.entityId)!,
  }));
  const relationships = catalog.relationships.filter(
    (r) =>
      r.scenarioId === scenario.id &&
      time >= r.start &&
      (time < r.end || (time === scenario.duration && r.end === time)),
  );
  const phase =
    scenario.phases.find((p) => time >= p.start && time < p.end) ??
    scenario.phases[scenario.phases.length - 1];
  return { time, actors, relationships, phase, groups };
}
// Editorial geographic spacing, not formation or aircraft performance modeling.
export function offsetPosition(
  p: [number, number],
  offset: [number, number],
): [number, number] {
  return [
    ((p[0] +
      offset[0] / (111.32 * Math.max(0.087, Math.cos((p[1] * Math.PI) / 180))) +
      540) %
      360) -
      180,
    Math.max(-85, Math.min(85, p[1] + offset[1] / 111.32)),
  ];
}
export function filterSnapshot(
  state: Snapshot,
  hiddenGroupIds: string[],
  focusGroupId: string | null,
) {
  const actors = state.actors.filter(
    (a) =>
      !hiddenGroupIds.includes(a.groupId) &&
      (!focusGroupId || a.groupId === focusGroupId),
  );
  const ids = new Set(actors.map((a) => a.id));
  return {
    ...state,
    actors,
    relationships: state.relationships.filter(
      (r) => ids.has(r.from) && ids.has(r.to),
    ),
  };
}
export type Snapshot = ReturnType<typeof snapshot>;
