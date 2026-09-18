import { useMemo } from 'react';
import {
  forceX,
  forceY,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type SimulationNodeDatum,
} from 'd3-force';
import type { Snapshot } from '../engine/timeline';
import { assetUrl } from '../components/EntityImage';
import type { Relationship } from '../data/schema';
type Node = SimulationNodeDatum & {
  id: string;
  label: string;
  entityId: string;
  icon: string;
};
export function NetworkView({
  state,
  layoutState,
  allRelationships,
  onSelect,
  selected,
}: {
  state: Snapshot;
  layoutState: Snapshot;
  allRelationships: Relationship[];
  onSelect: (id: string) => void;
  selected: string;
}) {
  // Layout uses the full scenario graph, so scrubbing never repositions the graph.
  const nodes = useMemo(() => {
    const nodes: Node[] = layoutState.actors.map((a) => ({
      id: a.id,
      label: a.label,
      entityId: a.entityId,
      icon: assetUrl(a.entity.media?.icon ?? 'assets/entities/uncrewed.svg'),
    }));
    const links = allRelationships.map((r) => ({
      source: r.from,
      target: r.to,
    }));
    const groupIds = [
      ...new Set(layoutState.actors.map((a) => a.groupId || a.id)),
    ];
    const columns = Math.ceil(Math.sqrt(groupIds.length));
    const rows = Math.ceil(groupIds.length / columns);
    const centers = new Map(
      nodes.map((n) => {
        const actor = layoutState.actors.find((a) => a.id === n.id)!;
        const group = actor.groupId || actor.id,
          index = groupIds.indexOf(group);
        return [
          n.id,
          {
            x: (((index % columns) + 0.5) * 900) / columns,
            y: 100 + ((Math.floor(index / columns) + 0.5) * 270) / rows,
          },
        ];
      }),
    );
    nodes.forEach((n, i) => {
      const center = centers.get(n.id)!;
      n.x = center.x + (i % 2 ? 70 : -70);
      n.y = center.y;
    });
    const sim = forceSimulation(nodes)
      .force(
        'link',
        forceLink<Node, (typeof links)[number]>(links)
          .id((d) => d.id)
          .distance(250)
          .strength(0.03),
      )
      .force('charge', forceManyBody().strength(-150))
      .force('collision', forceCollide(78))
      .force('x', forceX<Node>((n) => centers.get(n.id)!.x).strength(0.3))
      .force('y', forceY<Node>((n) => centers.get(n.id)!.y).strength(0.8))
      .stop();
    for (let i = 0; i < 220; i++) sim.tick();
    return nodes;
    // Actor identity and scenario links determine layout, not animation position.
  }, [layoutState.actors.map((a) => a.id).join('|'), allRelationships]);
  return (
    <svg
      className="network"
      viewBox="0 0 900 460"
      role="img"
      aria-label="Conceptual relationship network"
    >
      <defs>
        <marker
          id="arrow"
          viewBox="0 0 10 10"
          refX="22"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#e6ba78" />
        </marker>
      </defs>
      {state.relationships.map((r) => {
        const a = nodes.find((n) => n.id === r.from)!,
          b = nodes.find((n) => n.id === r.to)!;
        return (
          <g key={r.id}>
            <line
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="#e6ba78"
              strokeWidth="2"
              strokeDasharray={r.type === 'logistics' ? '7 6' : undefined}
              markerEnd="url(#arrow)"
            />
            <text
              x={(a.x! + b.x!) / 2}
              y={(a.y! + b.y!) / 2 - 14}
              textAnchor="middle"
              className="edge-label"
            >
              {r.label}
            </text>
          </g>
        );
      })}
      {nodes
        .filter((n) => state.actors.some((a) => a.id === n.id))
        .map((n) => (
          <g
            key={n.id}
            role="button"
            tabIndex={0}
            aria-label={`Open ${n.label} profile`}
            onClick={() => onSelect(n.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(n.id);
              }
            }}
            transform={`translate(${n.x},${n.y})`}
            className="network-node"
          >
            <circle
              r="27"
              fill={n.id === selected ? '#68ded2' : '#213e4c'}
              stroke="#68ded2"
            />
            <image href={n.icon} x="-20" y="-22" width="40" height="44" />
            <text textAnchor="middle" y="52">
              {n.label}
            </text>
          </g>
        ))}
    </svg>
  );
}
