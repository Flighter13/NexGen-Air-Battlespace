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
  it('keeps standalone study actors separated at shared staging points', () => {
    for (const study of catalog.scenarios.filter((s) =>
      ['01-sweep', '03-hvaa-protection', '04-sead'].includes(s.id),
    )) {
      const actors = snapshot(study, 0, catalog).actors;
      for (let i = 0; i < actors.length; i++) {
        for (let j = i + 1; j < actors.length; j++) {
          const [ax, ay] = actors[i].position;
          const [bx, by] = actors[j].position;
          // Do not let two aircraft share the exact same map position.
          expect(Math.hypot(ax - bx, ay - by)).toBeGreaterThan(0.0001);
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
