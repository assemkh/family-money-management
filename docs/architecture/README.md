# Architecture documentation

How the system is built, and the Interfaces the refactor is moving toward. Decisions
that constrain these documents live in [`docs/adr/`](../adr/README.md); the vocabulary
they use is defined in [`CONTEXT.md`](../../CONTEXT.md).

## Current implementation

| Document                         | Describes                                                                                      |
| -------------------------------- | ---------------------------------------------------------------------------------------------- |
| [`foundation.md`](foundation.md) | Runtime architecture, application structure, and the security boundary established in Phase 1A |
| [`database.md`](database.md)     | Public and private schema, RLS approach, atomic finance operations, and owner bootstrap        |

## Refactor design

| Document                                                       | Describes                                                                                                            | Lands in                        |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| [`mutation-dependency-map.md`](mutation-dependency-map.md)     | Every mutation mapped to the read models and routes it affects, with the declared-versus-actual gap analysis         | Phase 4.A                       |
| [`household-request-context.md`](household-request-context.md) | Interface for resolving verified identity, Household, locale, and the RLS-scoped client once per request             | Phase 2.A                       |
| [`authenticated-action.md`](authenticated-action.md)           | Interface for authentication, authorization, validation, safe errors, and declarative invalidation in Server Actions | Phase 2, completed in Phase 4.A |
| [`read-model-boundaries.md`](read-model-boundaries.md)         | Domain layout replacing `lib/finance/data.ts`, and ownership rules for shared valuation code                         | Phase 2.B                       |

Each Interface document states its named Interface, the Implementation responsibility
it hides, its consumers, and a deletion-test rationale — including the wrappers that
failed that test and are deliberately not proposed.

## Roadmap and measurements

- [`../refactor_responsive_perofrmance_plan.md`](../refactor_responsive_perofrmance_plan.md) — the five-phase roadmap and its acceptance criteria
- [`../performance-baseline.md`](../performance-baseline.md) — reproducible Phase 1.A measurements, known debt ceilings, and privacy constraints
