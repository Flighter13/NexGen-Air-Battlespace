# System-of-systems expansion

This expansion changes NexGen Air Battlespace from an aircraft-centric catalog into a research graph of mission actors, support functions, networks and relationships.

## Research basis

The implementation uses public U.S. Air Force/government sources plus the Mitchell Institute report already represented in the catalog. Entity claims are kept separate from scenario relationships. A documented platform capability does not automatically make a scenario edge documented.

Examples:
- RC-135 dissemination is documented; connecting a specific RC-135 actor to a specific fighter actor in a scenario is analytical unless a source documents that pairing.
- A-GRA is documented across CCA vendor platforms; using it as a generic autonomy layer in a notional mission is analytical.
- Mitchell Institute scenario structures remain research-exercise concepts, not operational plans.

## New data types

- entities carry domain, function and visualization metadata
- networks represent public architectures and communications families
- relationships carry type, function, optional networkId, direction and evidence
- packages group actors into mission packages

## Scaling rule

Add documented entities and networks first. Add scenario participation and relationship edges only when a source supports them or label them analytical/illustrative. Do not infer specific communications interfaces, routing, tactics, ranges or classified connectivity from broad interoperability language.

## Initial public-source expansion

The initial expansion adds research records for F-22, KC-46A, B-21, RC-135V/W and EA-37B, plus A-GRA and AMS GRA architecture records. It also expands the existing SEAD concept into a system-of-systems presentation with explicitly labeled analytical/illustrative links.
