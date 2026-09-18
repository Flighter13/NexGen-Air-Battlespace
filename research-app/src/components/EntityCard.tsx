import type { Entity } from '../data/schema';
import { Provenance } from './Provenance';
import { EntityImage } from './EntityImage';
export function EntityCard({ entity }: { entity: Entity }) {
  return (
    <section className="profile">
      <div className="eyebrow">ENTITY PROFILE</div>
      <EntityImage key={entity.id} entity={entity} />
      {entity.media && (
        <details className="image-credit">
          <summary>Image credit & origin</summary>
          <p>{entity.media.credit}</p>
          <p>{entity.media.rights}</p>
          {entity.media.sourceUrl && (
            <a href={entity.media.sourceUrl} target="_blank" rel="noreferrer">
              Original repository asset ↗
            </a>
          )}
        </details>
      )}
      <h2>{entity.name}</h2>
      <p className="muted">{entity.category} · Research record</p>
      {entity.claims.map((c, i) => (
        <article className="claim" key={i}>
          <span className={`badge ${c.evidence}`}>{c.evidence}</span>
          <p>{c.text}</p>
          <Provenance citations={c.citations} />
        </article>
      ))}
      <p className="fine">
        A profile describes an entity. Its role in a scenario is a separate
        research interpretation.
      </p>
    </section>
  );
}
