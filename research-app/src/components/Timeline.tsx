import type { Scenario } from '../data/schema';
import type { useTimeline } from '../engine/useTimeline';
export function Timeline({
  scenario,
  clock,
}: {
  scenario: Scenario;
  clock: ReturnType<typeof useTimeline>;
}) {
  return (
    <section className="timeline" aria-label="Scenario timeline">
      <div className="playback">
        <button onClick={clock.reset} aria-label="Reset timeline">
          ↶
        </button>
        <button className="primary" onClick={clock.toggle}>
          {clock.playing ? 'Pause' : 'Play'} {clock.playing ? 'Ⅱ' : '▶'}
        </button>
        <span className="time">
          {clock.time.toFixed(1)} / {scenario.duration}s
        </span>
        <label>
          Speed{' '}
          <select
            value={clock.speed}
            onChange={(e) => clock.setSpeed(+e.target.value)}
          >
            {[0.5, 1, 2, 4].map((s) => (
              <option value={s} key={s}>
                {s}×
              </option>
            ))}
          </select>
        </label>
        <span className="fine">Presentation time</span>
      </div>
      <input
        aria-label="Presentation time"
        type="range"
        min="0"
        max={scenario.duration}
        step="0.1"
        value={clock.time}
        onChange={(e) => clock.seek(+e.target.value)}
      />
      <div className="phase-buttons">
        {scenario.phases.map((p) => (
          <button
            key={p.id}
            onClick={() => clock.seek(p.start)}
            className={
              clock.time >= p.start &&
              (clock.time < p.end || p.end === scenario.duration)
                ? 'current'
                : ''
            }
          >
            {p.title}
            <small>{p.start}s</small>
          </button>
        ))}
      </div>
    </section>
  );
}
