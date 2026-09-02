# Operational Controls

APM's five operations are abstractions extracted from historical management records. The first implementation applied them to every dispatch and turned them into a rigid grammar. The current implementation applies them to a persistent project's organization and context lifecycle.

| Operation | Project-level meaning | Durable record | Consequence |
| --- | --- | --- | --- |
| Reduce | Define durable workstreams, interfaces, dependencies, and stable ownership | workstreams, architecture, roster | ambiguous or overlapping work is clarified before concurrent editing |
| Measure | Separate measured facts from reports and track cumulative output, rework, context health, and integration | observations, outputs, evidence, context signals | unsupported claims remain reported or unknown rather than becoming project truth |
| Delegate | Reuse useful domain context and issue bounded assignments carrying applicable directives and decisions | owner session, scope, directives, next action | ownership changes explicitly; the manager does not create disposable agents for appearance |
| Maintain | Preserve global memory, local working sets, checkpoints, and session succession | project state, checkpoints, handoffs | amber sessions refresh; red sessions hand off or are replaced without losing project continuity |
| Discipline | Inspect proportionally to risk, preserve authority, correct false or incomplete state, and make failure change ownership or status | decisions, observations, workstream state, handoff history | verbal assurance cannot silently unlock integration or expand approval |

## Before Assigning Work

1. Confirm the work is not already complete by measuring current artifacts or history.
2. Identify the existing session with the most relevant healthy context.
3. Check dependencies, coupled artifacts, and current ownership.
4. Attach applicable exact user directives, invariants, interfaces, and decisions.
5. State the expected artifact, evidence, escalation condition, and decision boundary.

The assignment may be a normal A2A message. It does not need a fixed field order. The manager records the resulting ownership and next action in project state.

## On Return

1. Keep the producer's report classified as `reported` until the artifact is inspected.
2. Measure the current candidate, commit, file, test, or rendered behavior at a depth proportional to risk.
3. For consequential or disputed changes, use an independent verifier or isolated environment.
4. Compare the artifact with the original objective, invariants, and cross-workstream interfaces.
5. Record acceptance, rework, reassignment, blockage, or abandonment without erasing the prior claim.

The manager may perform bounded inspection and integration checks. Preventing all artifact access creates a blind manager and was falsified by the v4 experiment.

## During A Long Run

1. Prefer follow-up work for the session that already owns the healthy domain context.
2. Watch for behavioral context-loss signals instead of waiting for a nominal token limit.
3. Checkpoint before compacting a worker.
4. Refresh an amber session from durable state and require a continuity check.
5. Prepare a two-phase handoff for a red session or a manager approaching drift.
6. Keep manager generations distinct and preserve the predecessor packet.

## State Epistemology

APM uses four claim classes:

- `measured`: reproduced from a current artifact, command, commit, or observation;
- `reported`: asserted by a session but not independently checked;
- `planned`: intended future action;
- `unknown`: unresolved fact.

Never merge these categories in one status line. A measured absence also needs a positive control when the measuring mechanism itself could be broken.

## Runtime Boundary

The CLI checks structured references, lifecycle state, and succession invariants. It deliberately does not:

- block ordinary source, shell, or inspection tools;
- infer that every task needs another agent;
- parse natural-language worker messages byte for byte;
- equate a valid ledger with a correct artifact;
- transfer human authority implicitly.

This boundary preserves the useful lesson of enforcement without repeating the v3/v4 failure where the control system consumed more work than the project.
