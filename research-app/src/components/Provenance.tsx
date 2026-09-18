import { catalog } from '../data/catalog';
import type { Citation } from '../data/schema';
export function Provenance({ citations }: { citations: Citation[] }) {
  return (
    <div className="citations">
      {citations.map((c, i) => {
        const s = catalog.sources.find((s) => s.id === c.sourceId)!;
        return (
          <details key={`${c.sourceId}-${i}`}>
            <summary>
              {s.publisher} · {c.locator}
            </summary>
            <p>
              {s.url ? (
                <a href={s.url} target="_blank" rel="noreferrer">
                  {s.title} ↗
                </a>
              ) : (
                s.title
              )}
            </p>
            <p>
              {s.published && `Published ${s.published} · `}Reviewed{' '}
              {s.accessed}
            </p>
            {s.localFile && <p>Original upload: {s.localFile}</p>}
            <p>{s.notes}</p>
          </details>
        );
      })}
    </div>
  );
}
