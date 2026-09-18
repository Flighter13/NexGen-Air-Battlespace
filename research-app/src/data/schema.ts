import { z } from 'zod';
const id = z.string().min(1);
const time = z.number().finite().nonnegative();
export const evidence = z.enum(['documented', 'analytical', 'illustrative']);
export const citationSchema = z.object({
  sourceId: id,
  locator: z.string().min(1),
});
const citations = z.array(citationSchema).min(1);
export const sourceSchema = z.object({
  id,
  title: id,
  publisher: id,
  kind: z.enum([
    'government',
    'manufacturer',
    'report',
    'lecture',
    'editorial',
  ]),
  url: z
    .string()
    .url()
    .refine((v) => /^https?:/.test(v))
    .optional(),
  published: z.string().optional(),
  accessed: z.string(),
  localFile: z.string().optional(),
  notes: z.string(),
});
const assetPath = z
  .string()
  .regex(/^assets\/[a-zA-Z0-9/_-]+\.(png|jpg|webp|svg)$/);
export const entitySchema = z.object({
  id,
  name: id,
  shortName: id,
  category: z.enum(['crewed', 'uncrewed', 'support']),
  media: z
    .object({
      src: assetPath,
      icon: assetPath,
      alt: id,
      credit: id,
      sourceUrl: z.string().url().optional(),
      rights: id,
    })
    .optional(),
  claims: z.array(z.object({ text: id, evidence, citations })).min(1),
});
export const locationSchema = z.object({
  id,
  name: id,
  coordinates: z.tuple([
    z.number().min(-180).max(180),
    z.number().min(-85).max(85),
  ]),
  evidence,
  notes: id,
  citations,
});
export const relationshipSchema = z.object({
  id,
  scenarioId: id,
  from: id,
  to: id,
  type: z.enum(['coordination', 'support', 'logistics']),
  label: id,
  evidence,
  start: time,
  end: time,
  citations,
});
const keyframes = z.array(z.object({ t: time, locationId: id })).min(1);
export const groupSchema = z.object({
  id,
  scenarioId: id,
  name: id,
  role: id,
  evidence,
  citations,
  keyframes,
  members: z
    .array(
      z.object({
        id,
        entityId: id,
        label: id,
        role: id,
        offsetKm: z.tuple([
          z.number().min(-100).max(100),
          z.number().min(-100).max(100),
        ]),
      }),
    )
    .min(1),
});
export const scenarioSchema = z.object({
  id,
  title: id,
  subtitle: id,
  description: id,
  evidence,
  citations,
  assumptions: z.array(id).min(1),
  duration: z.number().positive(),
  phases: z
    .array(z.object({ id, title: id, start: time, end: time, narrative: id }))
    .min(1),
  actors: z.array(
    z.object({ id, entityId: id, label: id, role: id, keyframes }),
  ),
});
export type Source = z.infer<typeof sourceSchema>;
export type Citation = z.infer<typeof citationSchema>;
export type Entity = z.infer<typeof entitySchema>;
export type Location = z.infer<typeof locationSchema>;
export type Relationship = z.infer<typeof relationshipSchema>;
export type Scenario = z.infer<typeof scenarioSchema>;
export type Group = z.infer<typeof groupSchema>;
export type Catalog = {
  sources: Source[];
  entities: Entity[];
  locations: Location[];
  relationships: Relationship[];
  scenarios: Scenario[];
  groups: Group[];
};

// Validate cross-file references as well as the shape of individual JSON records.
export function validateCatalog(c: Catalog): string[] {
  const errors: string[] = [];
  for (const [kind, records] of Object.entries(c)) {
    const seen = new Set<string>();
    for (const r of records) {
      if (seen.has(r.id)) errors.push(`${kind}: duplicate id ${r.id}`);
      seen.add(r.id);
    }
  }
  const has = (kind: keyof Catalog, value: string, owner: string) => {
    if (!c[kind].some((r) => r.id === value))
      errors.push(`${owner}: missing ${kind} ${value}`);
  };
  const checkCites = (refs: Citation[], owner: string) =>
    refs.forEach((r) => has('sources', r.sourceId, owner));
  c.entities.forEach((e) =>
    e.claims.forEach((cl) => checkCites(cl.citations, e.id)),
  );
  c.locations.forEach((l) => checkCites(l.citations, l.id));
  c.groups.forEach((g) => {
    has('scenarios', g.scenarioId, g.id);
    checkCites(g.citations, g.id);
  });
  for (const s of c.scenarios) {
    checkCites(s.citations, s.id);
    let end = 0;
    const phaseIds = new Set<string>();
    s.phases.forEach((p) => {
      if (phaseIds.has(p.id)) errors.push(`${s.id}: duplicate phase ${p.id}`);
      phaseIds.add(p.id);
      if (p.start !== end || p.end <= p.start || p.end > s.duration)
        errors.push(`${s.id}: phases must continuously cover the duration`);
      end = p.end;
    });
    if (end !== s.duration) errors.push(`${s.id}: phases must end at duration`);
    const actors = new Set<string>();
    const expanded = [
      ...s.actors,
      ...c.groups
        .filter((g) => g.scenarioId === s.id)
        .flatMap((g) =>
          g.members.map((m) => ({ ...m, keyframes: g.keyframes })),
        ),
    ];
    if (!expanded.length)
      errors.push(`${s.id}: needs at least one actor or group member`);
    for (const a of expanded) {
      if (actors.has(a.id)) errors.push(`${s.id}: duplicate actor ${a.id}`);
      actors.add(a.id);
      has('entities', a.entityId, a.id);
      let previous = -1;
      for (const k of a.keyframes) {
        has('locations', k.locationId, a.id);
        if (k.t <= previous || k.t > s.duration)
          errors.push(`${a.id}: keyframes must increase within duration`);
        previous = k.t;
      }
    }
  }
  for (const r of c.relationships) {
    has('scenarios', r.scenarioId, r.id);
    checkCites(r.citations, r.id);
    const s = c.scenarios.find((s) => s.id === r.scenarioId);
    if (s) {
      const actorIds = [
        ...s.actors.map((a) => a.id),
        ...c.groups
          .filter((g) => g.scenarioId === s.id)
          .flatMap((g) => g.members.map((m) => m.id)),
      ];
      for (const actor of [r.from, r.to])
        if (!actorIds.includes(actor))
          errors.push(`${r.id}: missing actor ${actor}`);
      if (r.start >= r.end || r.end > s.duration)
        errors.push(`${r.id}: invalid active interval`);
    }
  }
  return errors;
}
