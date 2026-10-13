type Point = [number, number];
type Frame = { t: number };

// Stateless, so seeking backward gives the same heading as playback.
// At a corner use the outgoing tangent; at the end use the incoming tangent.
// During a hold retain the last direction of travel instead of snapping north.
export function travelDirection(
  frames: Frame[],
  time: number,
  position: (t: number) => Point,
): [Point, Point] {
  const first = frames[0].t,
    last = frames[frames.length - 1].t;
  const t = Math.max(first, Math.min(last, time));
  const epsilon = Math.max(0.0001, (last - first) / 100000);
  const pair = (at: number, backwards = false): [Point, Point] => {
    const a = backwards ? Math.max(first, at - epsilon) : at;
    const b = backwards ? at : Math.min(last, at + epsilon);
    return [position(a), position(b)];
  };
  const moving = ([a, b]: [Point, Point]) =>
    Math.abs(((b[0] - a[0] + 540) % 360) - 180) > 1e-10 ||
    Math.abs(b[1] - a[1]) > 1e-10;
  let points = pair(t, t === last);
  if (moving(points)) return points;
  points = pair(t, true);
  if (moving(points)) return points;
  for (let i = frames.length - 1; i > 0; i--) {
    if (frames[i].t > t) continue;
    points = pair(frames[i].t, true);
    if (moving(points)) return points;
  }
  for (let i = 0; i < frames.length - 1; i++) {
    if (frames[i].t < t) continue;
    points = pair(frames[i].t);
    if (moving(points)) return points;
  }
  return [position(t), position(t)];
}
