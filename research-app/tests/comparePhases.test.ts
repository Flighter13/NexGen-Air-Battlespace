import {describe,it,expect} from 'vitest';
import {catalog} from '../src/data/catalog';
import {snapshot} from '../src/engine/timeline';
import {compareSnapshots} from '../src/engine/comparePhases';

describe('mission phase comparison',()=>{
 it('compares identical phase-start snapshots without differences',()=>{
  const s=catalog.scenarios[0], start=s.phases[0].start;
  const diff=compareSnapshots(snapshot(s,start,catalog),snapshot(s,start,catalog));
  expect(diff.newLinks).toEqual([]);
  expect(diff.removedLinks).toEqual([]);
  expect(diff.newActors).toEqual([]);
  expect(diff.removedActors).toEqual([]);
 });
 it('compares authored phase starts deterministically',()=>{
  for(const s of catalog.scenarios){
   const first=snapshot(s,s.phases[0].start,catalog);
   for(const phase of s.phases){
    const current=snapshot(s,phase.start,catalog);
    const diff=compareSnapshots(first,current);
    expect(diff.currentPhase).toBe(phase.title);
    expect(diff.currentLinkCount).toBe(current.relationships.length);
    expect(diff.newLinks.every(r=>!first.relationships.some(old=>old.id===r.id))).toBe(true);
    expect(diff.removedLinks.every(r=>!current.relationships.some(now=>now.id===r.id))).toBe(true);
   }
  }
 });
});