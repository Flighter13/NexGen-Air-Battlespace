import type { Snapshot } from './timeline';

export function compareSnapshots(reference: Snapshot, current: Snapshot) {
  const referenceIds = new Set(reference.relationships.map((r) => r.id));
  const currentIds = new Set(current.relationships.map((r) => r.id));
  const referenceActors = new Set(reference.actors.map((a) => a.id));
  const currentActors = new Set(current.actors.map((a) => a.id));
  return {
    referencePhase: reference.phase.title,
    currentPhase: current.phase.title,
    referenceActorCount: reference.actors.length,
    currentActorCount: current.actors.length,
    referenceLinkCount: reference.relationships.length,
    currentLinkCount: current.relationships.length,
    newLinks: current.relationships.filter((r) => !referenceIds.has(r.id)),
    removedLinks: reference.relationships.filter((r) => !currentIds.has(r.id)),
    newActors: current.actors.filter((a) => !referenceActors.has(a.id)),
    removedActors: reference.actors.filter((a) => !currentActors.has(a.id)),
  };
}
