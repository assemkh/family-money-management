# Architecture decision records

Each record states one decision that constrains later work, the evidence behind it,
and what it forbids. A record is written when a choice would otherwise be re-argued
or silently reversed during a refactor.

Records are immutable once accepted. A changed decision gets a new record that
supersedes the old one; the old record stays and gains a `Superseded by` line.

| ID                                                       | Decision                                 | Status   |
| -------------------------------------------------------- | ---------------------------------------- | -------- |
| [0001](0001-financial-source-of-truth.md)                | Financial source of truth                | Accepted |
| [0002](0002-authenticated-rendering-and-cache-safety.md) | Authenticated rendering and cache safety | Accepted |
| [0003](0003-adaptive-navigation-and-breakpoints.md)      | Adaptive navigation and breakpoints      | Accepted |

## Format

```
# NNNN — Title

Status / Date / Context (subphase that produced it)

## Context      what was true, with evidence
## Decision     what is now required, in the imperative
## Consequences what this costs and enables
## Rejected alternatives  what was considered and why it lost
## Verification  how a reviewer proves the decision still holds
```

Terms used in these records are defined in [`CONTEXT.md`](../../CONTEXT.md).
