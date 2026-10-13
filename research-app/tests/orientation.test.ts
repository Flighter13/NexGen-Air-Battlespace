import { describe, expect, it } from 'vitest';
import { catalog } from '../src/data/catalog';
import { iconCalibrationSchema } from '../src/data/schema';
import {
  bearingBetween,
  displayPositionAt,
  headingAt,
} from '../src/engine/motion';
import { snapshot } from '../src/engine/timeline';
import {
  iconAngle,
  iconCalibration,
} from '../src/visualization/iconOrientation';

const difference = (a: number, b: number) =>
  Math.abs(((a - b + 540) % 360) - 180);
const locations = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
].map((coordinates, i) => ({
  ...catalog.locations[0],
  id: String(i),
  coordinates: coordinates as [number, number],
}));
const frames = [
  { t: 0, locationId: '0' },
  { t: 10, locationId: '1' },
  { t: 20, locationId: '2' },
];

describe('image-to-map orientation', () => {
  it.each([0, 90, 180, 270])(
    'points nose-up artwork along compass bearing %s',
    (heading) => {
      // IconLayer rotates image vectors counterclockwise. A nose-up image starts at (0,-1).
      const radians = (iconAngle(heading) * Math.PI) / 180;
      const screenNose = [-Math.sin(radians), -Math.cos(radians)];
      const compass =
        ((Math.atan2(screenNose[0], -screenNose[1]) * 180) / Math.PI + 360) %
        360;
      expect(difference(compass, heading)).toBeLessThan(1e-8);
    },
  );
  it('calibrates diagonal artwork without modifying its image', () => {
    const native = 315,
      desired = 90;
    expect(iconAngle(desired, native)).toBe(225);
    expect((native - iconAngle(desired, native) + 360) % 360).toBe(desired);
  });
  it('retains clockwise heading corrections', () => {
    expect(iconAngle(90, 0, 15)).toBe(255);
  });
  it('uses inspected dimensions and centered pivots for every current map icon', () => {
    for (const entity of catalog.entities) {
      expect(iconCalibration(entity.media)).toEqual({
        width: 160,
        height: 170,
        anchorX: 80,
        anchorY: 85,
        noseHeading: 0,
      });
    }
  });
  it('validates rectangular images and rejects out-of-image pivots', () => {
    expect(
      iconCalibrationSchema.safeParse({
        width: 300,
        height: 120,
        anchorX: 80,
        anchorY: 50,
        noseHeading: 315,
      }).success,
    ).toBe(true);
    expect(
      iconCalibrationSchema.safeParse({
        width: 300,
        height: 120,
        anchorX: 301,
        anchorY: 50,
        noseHeading: 315,
      }).success,
    ).toBe(false);
    expect(
      iconCalibrationSchema.safeParse({
        width: 0,
        height: 120,
        anchorX: 0,
        anchorY: 50,
        noseHeading: 315,
      }).success,
    ).toBe(false);
  });
});

describe('heading follows displayed motion', () => {
  it('uses outgoing direction at a corner and incoming direction at the endpoint', () => {
    expect(headingAt(frames, 0, locations)).toBeCloseTo(90);
    expect(headingAt(frames, 10, locations)).toBeCloseTo(0);
    expect(headingAt(frames, 20, locations)).toBeCloseTo(0);
  });
  it('retains its arrival heading during holds and reverse seeking', () => {
    const hold = [
      { t: 0, locationId: '0' },
      { t: 10, locationId: '1' },
      { t: 30, locationId: '1' },
    ];
    for (const t of [10, 15, 30, 100, 15])
      expect(headingAt(hold, t, locations)).toBeCloseTo(90);
    const initialHold = [
      { t: 0, locationId: '0' },
      { t: 10, locationId: '0' },
      { t: 20, locationId: '1' },
    ];
    expect(headingAt(initialHold, 5, locations)).toBeCloseTo(90);
    expect(headingAt([{ t: 0, locationId: '0' }], 10, locations)).toBe(0);
  });
  it('keeps authored fixed and manual headings', () => {
    expect(
      headingAt(frames, 5, locations, { heading: 'fixed', fixedHeading: 45 }),
    ).toBe(45);
    const manual = frames.map((f, i) => ({ ...f, heading: [350, 10, 30][i] }));
    expect(headingAt(manual, 5, locations, { heading: 'manual' })).toBe(0);
  });
  it('uses each rotating formation member trajectory, not the group center', () => {
    const motion = {
      path: 'smooth',
      heading: 'path',
      rotateFormation: true,
    } as const;
    const offset: [number, number] = [60, 25];
    const t = 7;
    const actual = headingAt(frames, t, locations, motion, offset);
    const from = displayPositionAt(frames, t, locations, motion, offset);
    const to = displayPositionAt(frames, t + 0.0002, locations, motion, offset);
    expect(difference(actual, bearingBetween(from, to))).toBeLessThan(0.01);
    expect(
      difference(actual, headingAt(frames, t, locations, motion)),
    ).toBeGreaterThan(1);
  });
  it('tracks motion across the antimeridian', () => {
    const crossing = locations.map((l, i) => ({
      ...l,
      coordinates: [i === 0 ? 179 : -179, 0] as [number, number],
    }));
    expect(headingAt(frames.slice(0, 2), 5, crossing)).toBeCloseTo(90);
  });
  it('aligns every moving path-following actor in all research scenarios', () => {
    let checked = 0;
    for (const scenario of catalog.scenarios) {
      for (const fraction of [0.07, 0.23, 0.43, 0.67, 0.89]) {
        const t = scenario.duration * fraction,
          now = snapshot(scenario, t, catalog);
        const later = snapshot(scenario, t + 0.001, catalog);
        for (const actor of now.actors) {
          if (actor.motion?.heading && actor.motion.heading !== 'path')
            continue;
          const next = later.actors.find((a) => a.id === actor.id)!;
          if (
            Math.hypot(
              next.position[0] - actor.position[0],
              next.position[1] - actor.position[1],
            ) < 1e-9
          )
            continue;
          expect(
            difference(
              actor.heading,
              bearingBetween(actor.position, next.position),
            ),
          ).toBeLessThan(0.2);
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(30);
  });
});
