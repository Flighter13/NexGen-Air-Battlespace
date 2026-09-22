import { describe, expect, it } from 'vitest';
import { catalog } from '../src/data/catalog';
import { validateCatalog } from '../src/data/schema';
import { advanceTime, positionAt, snapshot } from '../src/engine/timeline';
import { headingAt, rotateOffset } from '../src/engine/motion';

describe('research catalog', () => {
  it('validates all authored records and references', () =>
    expect(validateCatalog(catalog)).toEqual([]));

  it('reports missing evidence sources', () => {
    const broken = structuredClone(catalog);
    broken.sources = [];
    expect(
      validateCatalog(broken).some((e) => e.includes('missing sources')),
    ).toBe(true);
  });

  it('rejects out-of-order keyframes and phase gaps', () => {
    const broken = structuredClone(catalog);
    broken.groups[0].keyframes[1].t = 0;
    broken.scenarios[0].phases[1].start++;
    expect(validateCatalog(broken).some((e) => e.includes('keyframes'))).toBe(
      true,
    );
    expect(
      validateCatalog(broken).some((e) => e.includes('continuously')),
    ).toBe(true);
  });

  it('rejects broken actor references and duplicate IDs', () => {
    const broken = structuredClone(catalog);
    broken.entities.push(broken.entities[0]);
    broken.relationships[0].from = 'missing';
    expect(validateCatalog(broken).some((e) => e.includes('duplicate'))).toBe(
      true,
    );
    expect(
      validateCatalog(broken).some((e) => e.includes('missing actor')),
    ).toBe(true);
  });

  it('requires authored headings when manual heading mode is selected', () => {
    const broken = structuredClone(catalog);
    broken.groups[0].motion = { heading: 'manual' };
    expect(validateCatalog(broken).some((e) => e.includes('manual heading'))).toBe(
      true,
    );
  });
});

describe('deterministic presentation timeline', () => {
  const s = catalog.scenarios[0];

  it('clamps elapsed time to the end', () =>
    expect(advanceTime(59, 2, 4, 60)).toBe(60));

  it('interpolates geographic coordinates and holds endpoint states', () => {
    const k = [
      { t: 0, locationId: 'north-start' },
      { t: 40, locationId: 'north-area' },
      { t: 60, locationId: 'north-area' },
    ];
    expect(positionAt(k, -10, catalog.locations)).toEqual([139, 25]);
    expect(positionAt(k, 20, catalog.locations)).toEqual([136, 25]);
    expect(positionAt(k, 100, catalog.locations)).toEqual([133, 25]);
  });

  it('holds a static single-keyframe actor', () => {
    expect(
      positionAt([{ t: 0, locationId: 'hub' }], 30, catalog.locations),
    ).toEqual([145, 22]);
  });

  it('takes the short path across the antimeridian', () => {
    const locations = [
      {
        ...catalog.locations[0],
        id: 'a',
        coordinates: [179, 0] as [number, number],
      },
      {
        ...catalog.locations[0],
        id: 'b',
        coordinates: [-179, 0] as [number, number],
      },
    ];
    expect(
      positionAt(
        [
          { t: 0, locationId: 'a' },
          { t: 10, locationId: 'b' },
        ],
        5,
        locations,
      ),
    ).toEqual([-180, 0]);
  });

  it('supports smooth paths and derives a changing path heading', () => {
    const north = catalog.groups.find((g) => g.id === '01-sweep-north')!;
    const linear = positionAt(north.keyframes, 10, catalog.locations, 'linear');
    const smooth = positionAt(north.keyframes, 10, catalog.locations, 'smooth');
    expect(smooth).not.toEqual(linear);

    const early = headingAt(
      north.keyframes,
      5,
      catalog.locations,
      north.motion,
    );
    const late = headingAt(
      north.keyframes,
      30,
      catalog.locations,
      north.motion,
    );
    expect(Math.abs(early - late)).toBeGreaterThan(1);
  });

  it('interpolates manual headings using the shortest rotation', () => {
    const frames = [
      { t: 0, locationId: 'north-start', heading: 350 },
      { t: 10, locationId: 'north-area', heading: 10 },
    ];
    const heading = headingAt(frames, 5, catalog.locations, {
      heading: 'manual',
    });
    expect(heading === 0 || heading === 360).toBe(true);
  });

  it('rotates formation offsets with the route heading', () => {
    const [east, north] = rotateOffset([10, 0], 90);
    expect(east).toBeCloseTo(0, 6);
    expect(north).toBeCloseTo(-10, 6);
  });

  it('activates relationships exactly at phase boundaries and supports reverse seeking', () => {
    expect(snapshot(s, 14.9, catalog).relationships).toHaveLength(0);
    expect(snapshot(s, 15, catalog).relationships).toHaveLength(1);
    expect(snapshot(s, 15, catalog).phase.id).toBe('probe');
    snapshot(s, 55, catalog);
    expect(snapshot(s, 0, catalog).relationships).toHaveLength(0);
    expect(snapshot(s, s.duration, catalog).phase.id).toBe(
      s.phases[s.phases.length - 1].id,
    );
  });

  it('ends intermediate relationship intervals exclusively', () => {
    const logistics = catalog.scenarios[1];
    expect(
      snapshot(logistics, 35, catalog).relationships.map((r) => r.id),
    ).toEqual(['south-support']);
    expect(snapshot(logistics, 50, catalog).relationships).toHaveLength(0);
  });
});
