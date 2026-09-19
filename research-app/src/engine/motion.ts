import type {
  Keyframe,
  Location,
  MotionConfig,
} from '../data/schema';

export type PathMode = 'linear' | 'smooth';
export type HeadingMode = 'path' | 'manual' | 'fixed';

const normalizeLongitude = (longitude: number) =>
  ((longitude + 540) % 360) - 180;

const shortestDelta = (from: number, to: number) =>
  ((to - from + 540) % 360) - 180;

const normalizeHeading = (heading: number) => ((heading % 360) + 360) % 360;

const locate = (id: string, locations: Location[]): [number, number] => {
  const location = locations.find((item) => item.id === id);
  if (!location) throw new Error(`Missing location ${id}`);
  return location.coordinates;
};

function segmentFor(keys: Keyframe[], t: number) {
  if (!keys.length) throw new Error('An actor needs at least one keyframe');
  if (keys.length === 1 || t <= keys[0].t)
    return { left: 0, right: 0, fraction: 0 };
  const right = keys.findIndex((key) => key.t > t);
  if (right === -1) {
    const last = keys.length - 1;
    return { left: last, right: last, fraction: 0 };
  }
  const left = right - 1;
  return {
    left,
    right,
    fraction: (t - keys[left].t) / (keys[right].t - keys[left].t),
  };
}

function catmullRom(
  p0: number,
  p1: number,
  p2: number,
  p3: number,
  t: number,
) {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}

export function positionAt(
  keys: Keyframe[],
  t: number,
  locations: Location[],
  mode: PathMode = 'linear',
): [number, number] {
  const segment = segmentFor(keys, t);
  const current = locate(keys[segment.left].locationId, locations);

  if (segment.left === segment.right) return current;

  const next = locate(keys[segment.right].locationId, locations);
  const fraction = segment.fraction;

  if (mode === 'linear') {
    const longitude = normalizeLongitude(
      current[0] + shortestDelta(current[0], next[0]) * fraction,
    );
    return [longitude, current[1] + (next[1] - current[1]) * fraction];
  }

  const previousIndex = Math.max(0, segment.left - 1);
  const followingIndex = Math.min(keys.length - 1, segment.right + 1);
  const previous = locate(keys[previousIndex].locationId, locations);
  const following = locate(keys[followingIndex].locationId, locations);

  // Unwrap neighboring longitudes around the current point before interpolation.
  const x1 = current[0];
  const x0 = x1 + shortestDelta(x1, previous[0]);
  const x2 = x1 + shortestDelta(x1, next[0]);
  const x3 = x1 + shortestDelta(x1, following[0]);

  return [
    normalizeLongitude(catmullRom(x0, x1, x2, x3, fraction)),
    Math.max(
      -85,
      Math.min(
        85,
        catmullRom(previous[1], current[1], next[1], following[1], fraction),
      ),
    ),
  ];
}

export function bearingBetween(
  from: [number, number],
  to: [number, number],
): number {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const fromLat = toRadians(from[1]);
  const toLat = toRadians(to[1]);
  const deltaLongitude = toRadians(shortestDelta(from[0], to[0]));
  const y = Math.sin(deltaLongitude) * Math.cos(toLat);
  const x =
    Math.cos(fromLat) * Math.sin(toLat) -
    Math.sin(fromLat) * Math.cos(toLat) * Math.cos(deltaLongitude);

  if (Math.abs(x) < 1e-12 && Math.abs(y) < 1e-12) return 0;
  return normalizeHeading((Math.atan2(y, x) * 180) / Math.PI);
}

export function pathHeadingAt(
  keys: Keyframe[],
  t: number,
  locations: Location[],
  mode: PathMode = 'linear',
): number {
  if (keys.length < 2) return 0;

  const first = keys[0].t;
  const last = keys[keys.length - 1].t;
  const span = Math.max(0.1, last - first);
  const epsilon = Math.max(0.01, span / 1000);
  let before = Math.max(first, t - epsilon);
  let after = Math.min(last, t + epsilon);

  if (before === after) {
    if (after < last) after = Math.min(last, after + epsilon);
    else before = Math.max(first, before - epsilon);
  }

  return bearingBetween(
    positionAt(keys, before, locations, mode),
    positionAt(keys, after, locations, mode),
  );
}

function manualHeadingAt(keys: Keyframe[], t: number): number {
  const segment = segmentFor(keys, t);
  const a = keys[segment.left].heading ?? 0;
  if (segment.left === segment.right) return normalizeHeading(a);
  const b = keys[segment.right].heading ?? a;
  return normalizeHeading(a + shortestDelta(a, b) * segment.fraction);
}

export function headingAt(
  keys: Keyframe[],
  t: number,
  locations: Location[],
  motion?: MotionConfig,
): number {
  const pathMode = motion?.path ?? 'linear';
  const headingMode: HeadingMode = motion?.heading ?? 'path';

  if (headingMode === 'fixed') return normalizeHeading(motion?.fixedHeading ?? 0);
  if (headingMode === 'manual') return manualHeadingAt(keys, t);
  return pathHeadingAt(keys, t, locations, pathMode);
}

export function rotateOffset(
  offset: [number, number],
  heading: number,
): [number, number] {
  const angle = (normalizeHeading(heading) * Math.PI) / 180;
  const [east, north] = offset;
  return [
    east * Math.cos(angle) + north * Math.sin(angle),
    -east * Math.sin(angle) + north * Math.cos(angle),
  ];
}

export function offsetPosition(
  point: [number, number],
  offsetKm: [number, number],
): [number, number] {
  return [
    normalizeLongitude(
      point[0] /
        1 +
        offsetKm[0] /
          (111.32 * Math.max(0.087, Math.cos((point[1] * Math.PI) / 180))),
    ),
    Math.max(-85, Math.min(85, point[1] + offsetKm[1] / 111.32)),
  ];
}

export function displayPositionAt(
  keys: Keyframe[],
  t: number,
  locations: Location[],
  motion: MotionConfig,
  offsetKm: [number, number],
): [number, number] {
  const pathMode = motion?.path ?? 'linear';
  const base = positionAt(keys, t, locations, pathMode);
  const offset = motion?.rotateFormation
    ? rotateOffset(offsetKm, pathHeadingAt(keys, t, locations, pathMode))
    : offsetKm;
  return offsetPosition(base, offset);
}

export function sampleRoute(
  keys: Keyframe[],
  locations: Location[],
  motion: MotionConfig,
  offsetKm: [number, number],
  samplesPerSegment = 12,
): [number, number][] {
  if (keys.length === 1)
    return [displayPositionAt(keys, keys[0].t, locations, motion, offsetKm)];

  const points: [number, number][] = [];
  for (let index = 0; index < keys.length - 1; index++) {
    const start = keys[index].t;
    const end = keys[index + 1].t;
    for (let step = 0; step < samplesPerSegment; step++) {
      const t = start + ((end - start) * step) / samplesPerSegment;
      points.push(displayPositionAt(keys, t, locations, motion, offsetKm));
    }
  }
  points.push(
    displayPositionAt(
      keys,
      keys[keys.length - 1].t,
      locations,
      motion,
      offsetKm,
    ),
  );
  return points;
}
