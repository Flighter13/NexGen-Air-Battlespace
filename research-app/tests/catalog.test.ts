import {describe,it,expect} from 'vitest';
import {catalog} from '../src/data/catalog';
import {validateCatalog} from '../src/data/schema';

describe('research catalog integrity',()=>{
 it('has no unresolved references or duplicate IDs',()=>{
  expect(validateCatalog(catalog)).toEqual([]);
  for(const records of Object.values(catalog)){
   expect(new Set(records.map(r=>r.id)).size).toBe(records.length);
  }
 });
 it('requires source-backed claims for all library entities',()=>{
  const sources=new Set(catalog.sources.map(s=>s.id));
  for(const e of catalog.entities){
   expect(e.claims.length).toBeGreaterThan(0);
   for(const claim of e.claims){
    expect(claim.citations.length).toBeGreaterThan(0);
    for(const citation of claim.citations) expect(sources.has(citation.sourceId)).toBe(true);
   }
  }
 });
 it('keeps historical research additions out of scenario actors until explicitly authored',()=>{
  for(const id of ['e3-sentry','e8c-jstars']){
   expect(catalog.entities.some(e=>e.id===id)).toBe(true);
   expect(catalog.scenarios.flatMap(s=>s.actors).some(a=>a.entityId===id)).toBe(false);
   expect(catalog.groups.flatMap(g=>g.members).some(m=>m.entityId===id)).toBe(false);
  }
 });
});