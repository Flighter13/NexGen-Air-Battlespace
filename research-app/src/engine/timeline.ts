import type {
  Catalog,
  Scenario,
  Location,
  MotionConfig,
  Keyframe,
} from '../data/schema';
import {
  displayPositionAt,
  headingAt,
  offsetPosition,
  positionAt as motionPositionAt,
  sampleRoute,
} from './motion';

export const clampTime = (t: number, duration: number) =>
  Math.max(0, Math.min(duration, Number.isFinite(t) ? t : 0));

export const advanceTime = (
  t: number,
  elapsedSeconds: number,
  speed: number,
  duration: number,
) => clampTime(t + Math.max(0, elapsedSeconds) * speed, duration);

export function positionAt(
  keys: Keyframe[],
  t: number,
  locations: Location[],
  mode: 'linear' | 'smooth' = 'linear',
): [number, number] {
  return motionPositionAt(keys, t, locations, mode);
}

export { offsetPosition };

export function snapshot(scenario: Scenario, t: number, catalog: Catalog) {
  const time = clampTime(t, scenario.duration);
  const groups = catalog.groups.filter((g) => g.scenarioId === scenario.id);

  const definitions = [
    ...scenario.actors.map((a) => ({
      ...a,
      groupId: '',
      offsetKm: [0, 0] as [number, number],
      motion: a.motion as MotionConfig,
    })),
    ...groups.flatMap((g) =>
      g.members.map((m) => ({
        ...m,
        groupId: g.id,
        keyframes: g.keyframes,
        motion: g.motion as MotionConfig,
      })),
    ),
  ];

  const actors = definitions.map((a) => ({
    ...a,
    position: displayPositionAt(
      a.keyframes,
      time,
      catalog.locations,
      a.motion,
      a.offsetKm,
    ),
    heading: headingAt(a.keyframes, time, catalog.locations, a.motion),
    route: sampleRoute(
      a.keyframes,
      catalog.locations,
      a.motion,
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
