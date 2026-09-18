import type { Snapshot } from '../engine/timeline';
import { EntityImage } from './EntityImage';
import { Provenance } from './Provenance';
export function GroupControls({
  state,
  hidden,
  focus,
  selectedActor,
  onToggle,
  onFocus,
  onSelect,
}: {
  state: Snapshot;
  hidden: string[];
  focus: string | null;
  selectedActor: string;
  onToggle: (id: string) => void;
  onFocus: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  return (
    <section className="group-panel">
      <div className="group-heading">
        <div className="eyebrow">SCENARIO GROUPS</div>
        {focus && (
          <button onClick={() => onFocus(null)}>Show all groups</button>
        )}
      </div>
      <p className="fine">
        Members share a geographic track. Spacing and counts are illustrative.
      </p>
      {state.groups.map((g) => (
        <details key={g.id} className="group-card" open>
          <summary>
            {g.name} <span>{g.members.length} members</span>
          </summary>
          <div className="group-actions">
            <label>
              <input
                type="checkbox"
                checked={!hidden.includes(g.id)}
                onChange={() => onToggle(g.id)}
                aria-label={`Show ${g.name}`}
              />{' '}
              Visible
            </label>
            <button
              aria-pressed={focus === g.id}
              onClick={() => onFocus(focus === g.id ? null : g.id)}
            >
              {focus === g.id ? 'Exit focus' : 'Focus group'}
            </button>
          </div>
          <p className="fine">{g.role}</p>
          <div className="group-members">
            {state.actors
              .filter((a) => a.groupId === g.id)
              .map((a) => (
                <button
                  key={a.id}
                  className={
                    selectedActor === a.id ? 'member selected' : 'member'
                  }
                  onClick={() => onSelect(a.id)}
                >
                  <EntityImage small entity={a.entity} />
                  <span>
                    {a.label}
                    <small>{a.role}</small>
                  </span>
                </button>
              ))}
          </div>
          <Provenance citations={g.citations} />
        </details>
      ))}
    </section>
  );
}
