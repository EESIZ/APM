# APM and unlazy Interoperability

APM and unlazy operate at different time scales.

| Concern | APM | unlazy |
| --- | --- | --- |
| Unit | long-running multi-session project | one substantial execution session |
| Memory | mission, architecture, decisions, roster, succession | local acceptance gates and evidence |
| Ownership | stable domain and workstream owner | bounded task scope |
| Context | checkpoint, compact, refresh, replace, handoff | finish the current leaf without premature completion |
| Evidence | project-level provenance and integration | runnable local checks |
| Completion | cumulative project or milestone acceptance | local deliverable completion |

## Recommended Composition

Use APM on the persistent organization. Use unlazy only inside a worker session whose current assignment is substantial enough to benefit from local gates.

```text
Human
  -> APM manager and project state
       -> persistent worker context
            -> optional unlazy GATES for the current substantial task
```

The worker checkpoint should record the current `GATES.md`, decisive evidence, remaining gates, and rejected paths before compaction or handoff. The manager treats checked gates as worker evidence, then inspects the current candidate at the appropriate project risk level.

## Boundary Rules

- A local gate does not prove that sibling outputs compose.
- Project state does not prove that an artifact is correct.
- APM does not require every worker or every small task to load unlazy.
- unlazy does not create persistent ownership, manager succession, or cross-session memory.
- Context should be reused while healthy; local completion discipline is not a reason to discard the session.
- The manager may inspect bounded worker artifacts and rerun decisive checks.

The current APM runtime contains no forked unlazy hook code. Earlier v1-v4 releases adapted its stop-discipline mechanism; that lineage remains documented in Git history and [the experimental record](experiments.md).
