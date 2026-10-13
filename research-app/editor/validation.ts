import {catalog} from '../src/data/catalog';
import {sourceSchema,entitySchema,networkSchema,locationSchema,relationshipSchema,packageSchema,scenarioSchema,groupSchema,validateCatalog} from '../src/data/schema';

export const collectionSchemas={sources:sourceSchema,entities:entitySchema,networks:networkSchema,locations:locationSchema,relationships:relationshipSchema,packages:packageSchema,scenarios:scenarioSchema,groups:groupSchema};
export type Collection=keyof typeof collectionSchemas;
export function validateRecord(collection:Collection,input:unknown){
 const schema=collectionSchemas[collection];
 const parsed=schema.safeParse(input);
 if(!parsed.success)return {ok:false,errors:parsed.error.issues.map(x=>x.path.join('.')+': '+x.message)};
 const value=parsed.data;
 const clone=structuredClone(catalog);
 const index=(clone[collection] as Array<{id:string}>).findIndex(x=>x.id===value.id);
 // Editing an existing record replaces it, whereas a new record appends.
 const records=clone[collection] as Array<{id:string}>;
 if(index>=0) records[index]=value as {id:string};else records.push(value as {id:string});
 const errors=validateCatalog(clone);
 return {ok:errors.length===0,errors,value};
}
