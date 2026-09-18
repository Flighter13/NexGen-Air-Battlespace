import { z } from 'zod';
import {
  sourceSchema,
  entitySchema,
  locationSchema,
  relationshipSchema,
  scenarioSchema,
  groupSchema,
  validateCatalog,
} from './schema';
function read<T>(files: Record<string, unknown>, schema: z.ZodType<T>): T[] {
  return Object.entries(files)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([file, data]) => {
      const result = schema.safeParse(data);
      if (!result.success) throw new Error(`${file}: ${result.error.message}`);
      return result.data;
    });
}
export const catalog = {
  groups: read(
    import.meta.glob('../../data/groups/*.json', {
      eager: true,
      import: 'default',
    }),
    groupSchema,
  ),
  sources: read(
    import.meta.glob('../../data/sources/*.json', {
      eager: true,
      import: 'default',
    }),
    sourceSchema,
  ),
  entities: read(
    import.meta.glob('../../data/entities/*.json', {
      eager: true,
      import: 'default',
    }),
    entitySchema,
  ),
  locations: read(
    import.meta.glob('../../data/locations/*.json', {
      eager: true,
      import: 'default',
    }),
    locationSchema,
  ),
  relationships: read(
    import.meta.glob('../../data/relationships/*.json', {
      eager: true,
      import: 'default',
    }),
    relationshipSchema,
  ),
  scenarios: read(
    import.meta.glob('../../data/scenarios/*.json', {
      eager: true,
      import: 'default',
    }),
    scenarioSchema,
  ),
};
const errors = validateCatalog(catalog);
if (!catalog.scenarios.length || errors.length)
  throw new Error(
    `Research catalog is invalid:\n${errors.join('\n') || 'Add at least one scenario.'}`,
  );
