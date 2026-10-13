import { describe, expect, it } from 'vitest';
import { catalog } from '../src/data/catalog';
import { filterSnapshot, snapshot } from '../src/engine/timeline';
import { validateCatalog } from '../src/data/schema';
describe('editable research groups', () => {
  const scenario = catalog.scenarios[0];
  it('expands group members with shared tracks and distinct positions', () => {
    const state = snapshot(scenario, 20, catalog);
    expect(state.actors.filter((a) => a.groupId)).toHaveLength(8);
    expect(state.actors.filter((a) => !a.groupId)).toHaveLength(scenario.actors.length);
    expect(state.actors).toHaveLength(8 + scenario.actors.length);
    const north = state.actors.filter((a) => a.groupId === '01-sweep-north');
    expect(north).toHaveLength(2);
    expect(north[0].keyframes).toEqual(north[1].keyframes);
    expect(north[0].position).not.toEqual(north[1].position);
  });
  it('hiding a group removes links that reference its members', () => {
    const filtered = filterSnapshot(
      snapshot(scenario, 20, catalog),
      ['01-sweep-center'],
      null,
    );
    expect(filtered.actors.filter((a) => a.groupId)).toHaveLength(6);
    expect(filtered.actors.filter((a) => !a.groupId)).toHaveLength(scenario.actors.length);
    expect(filtered.relationships).toHaveLength(0);
  });
  it('focus isolates a group and allows all groups to be hidden', () => {
    const state = snapshot(scenario, 20, catalog);
    expect(filterSnapshot(state, [], '01-sweep-north').actors).toHaveLength(2);
    expect(
      filterSnapshot(
        state,
        state.groups.map((g) => g.id),
        null,
      ).actors.filter((a) => a.groupId),
    ).toHaveLength(0);
    expect(filterSnapshot(state, state.groups.map((g) => g.id), null).actors.filter((a) => !a.groupId)).toHaveLength(scenario.actors.length);
  });
  it('separates independent aircraft sharing the same staging point', () => {
    for (const study of catalog.scenarios.filter((s) =>
      ['01-sweep', '03-hvaa-protection', '04-sead'].includes(s.id),
    )) {
      const actors = snapshot(study, 0, catalog).actors;
      for (let i = 0; i < study.actors.length; i++) {
        for (let j = i + 1; j < study.actors.length; j++) {
          const a = study.actors[i];
          const b = study.actors[j];
          if (a.keyframes[0].locationId !== b.keyframes[0].locationId) continue;
          const ap = actors.find((item) => item.id === a.id)!.position;
          const bp = actors.find((item) => item.id === b.id)!.position;
          expect(Math.hypot(ap[0] - bp[0], ap[1] - bp[1])).toBeGreaterThan(0.0001);
        }
      }
    }
  });
  it('validates group member entity references and scenario-wide unique member ids', () => {
    const copy = structuredClone(catalog);
    copy.groups[0].members[0].entityId = 'missing';
    copy.groups[0].members.push(copy.groups[0].members[0]);
    const errors = validateCatalog(copy);
    expect(errors.some((e) => e.includes('missing entities'))).toBe(true);
    expect(errors.some((e) => e.includes('duplicate actor'))).toBe(true);
  });
});
