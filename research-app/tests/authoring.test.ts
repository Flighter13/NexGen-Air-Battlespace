import {describe,it,expect} from 'vitest';import{catalog}from '../src/data/catalog';import{validateRecord}from '../editor/validation';
describe('local authoring validation',()=>{
 it('accepts an existing source record',()=>{expect(validateRecord('sources',catalog.sources[0]).ok).toBe(true)});
 it('rejects a missing source citation',()=>{const record=structuredClone(catalog.entities[0]);record.claims[0].citations=[{sourceId:'no-such-source',locator:'none'}];const result=validateRecord('entities',record);expect(result.ok).toBe(false);expect(result.errors.join(' ')).toContain('missing sources')});
 it('rejects invalid structured records',()=>{expect(validateRecord('entities',{id:'incomplete'}).ok).toBe(false)});
});