---
name: a2a-manager-agent-orchestration
description: >-
  Manage orchestrator-worker and delegated-agent workflows with explicit work
  contracts, context handoffs, evidence requirements, state tracking,
  correction, and final integration. Use when an agent is coordinating
  subagents or auditing a multi-agent run; keep coherent tasks single-agent
  when delegation would add more coordination cost than value.
---

# A2A Manager Agent Orchestration

Act as the accountable manager in an orchestrator-worker system. Preserve the user's objective, decide whether delegation is justified, assign bounded contracts, inspect proof, correct failed work, and integrate only compatible verified outputs.

Use this control loop:

```text
Reduce -> Measure -> Delegate -> Maintain -> Discipline
```

## Choose Architecture First

Default to one agent for a coherent task. Add a subagent only when at least one benefit is concrete:

- independent breadth-first search;
- specialized tools or expertise;
- a clean context window for a bounded investigation;
- independent review or adversarial verification;
- parallel work with disjoint writes and an explicit merge contract.

Do not create peer writer swarms for tightly coupled work. Coordination, context transfer, and integration consume attention even when tokens are cheap. If delegation has no observable benefit, continue directly and say why.

## Prime Directive

Keep the user's goal alive across every delegation. Subagents optimize the contract they receive, not the full conversation. Externalize the objective, constraints, relevant decisions, ownership, expected output, inspection method, and stop condition before dispatch.

The manager remains accountable for the final result. Never outsource judgment.

## The Five Operations

### 1. Reduce

Turn the objective into bounded, independently inspectable work units. Each unit needs an objective, scope, inputs, expected output, constraints, success criteria, dependencies, and stop condition.

Split at real domain, context, ownership, or verification boundaries. Do not manufacture agents to fill a desired count.

### 2. Measure

Define proof before dispatch. Prefer evidence that can be independently reproduced:

- exact artifacts and paths;
- commands, exit codes, and decisive output;
- source URLs and claim-level citations;
- reproduction steps and observed behavior;
- changed files and preserved interfaces;
- unresolved uncertainty and confidence boundaries.

Activity, confidence, token use, and a checked box are not proof by themselves.

### 3. Delegate

Assign a contract, not a wish. Every contract states:

- the user's actual objective;
- the handler's narrow role;
- the minimum sufficient context and prior decisions;
- `OWNS` paths or read-only scope;
- required method and prohibited changes;
- output format and durable artifact path when applicable;
- inspection and proof requirements;
- dependencies, budget, escalation condition, and stop condition.

Use parallel dispatch only when dependencies are satisfied and write ownership is disjoint. Treat `OWNS` as coordination, not filesystem isolation or a security boundary.

### 4. Maintain

Keep the run coherent while workers execute:

- refresh missing context and propagate user changes;
- preserve decisions and intermediate artifacts outside chat history;
- watch dependencies, duplicate effort, ownership, time, and token budget;
- stop obsolete work and unblock newly ready units;
- keep the manager's context focused on goal, state, evidence, and integration.

### 5. Discipline

Inspect outputs against the original contract:

- request missing evidence;
- reject unsupported completion claims;
- issue a focused `REWHIP` when a result is recoverable;
- reassign when a handler is stuck or its context is contaminated;
- discard work whose assumptions conflict with the accepted plan;
- quarantine useful but unverified claims;
- integrate only after independent verification.

The term `REWHIP` means a corrective agent dispatch recorded in the manager ledger.

## WHIPS Ledger

For substantial delegated work, create `WHIPS.md` from [templates/WHIPS.md](templates/WHIPS.md) before dispatch. Read [WHIPS.md](WHIPS.md) for the full contract.

```text
W - Work Unit: the bounded assignment and its dependency contract
H - Handler: the subagent and its ownership lease
I - Inspection: what the manager will independently examine
P - Proof: the evidence required for acceptance
S - State: the manager-owned lifecycle state
```

Use only these states:

```text
WAITING -> READY -> IN-FLIGHT -> VERIFYING -> VERIFIED
                                  |             |
                                  -> REWHIP ----+
                                  -> DISCARDED
Any active state -> ABANDONED with a reason and handoff
```

Only the manager changes a unit to `VERIFIED`, and only after checking current proof. A worker's self-report may move a unit to `VERIFYING`, never directly to `VERIFIED`.

## Manager Loop

1. Restate the user's objective and non-negotiable constraints.
2. Decide whether one agent or orchestrator-worker execution is better.
3. If delegating, write the `WHIPS.md` units, dependencies, ownership, inspection, and proof first.
4. Dispatch every `READY` unit whose ownership is available.
5. Monitor blockers, drift, duplicate effort, context loss, and user changes.
6. Move returned work to `VERIFYING` and reproduce its decisive proof.
7. Mark it `VERIFIED`, issue `REWHIP`, reassign, discard, or abandon with a reason.
8. Unlock dependent units as their prerequisites become `VERIFIED`.
9. Integrate bottom-up, resolving assumptions and interfaces explicitly.
10. Report verified outcomes, unresolved conflicts, residual risk, and every abandonment.

## Delegation Contract

Use this compact shape:

```markdown
User objective:
Work unit:
Handler role:
Needs:
Context and accepted decisions:
Scope / OWNS:
Do not:
Required method:
Expected output:
Inspection:
Proof:
Escalate if:
Stop when:
```

## Inspect Returned Work

Require the handler to report:

```markdown
Status: complete | blocked | partial
Work unit:
Outputs:
Proof:
Assumptions:
Residual risks:
Needs manager decision:
```

Then inspect the artifact, not just the report. Prefer primary sources over summaries, reproducible commands over claims, and current evidence over inherited transcripts.

## Integration Rules

- Preserve provenance for every accepted claim and artifact.
- Treat disagreement as a verification task, not something to average away.
- Do not merge partial results whose assumptions or interfaces conflict.
- Re-run cross-unit tests after local checks pass.
- Keep one writer for tightly coupled artifacts unless ownership and merge semantics are explicit.
- Label useful but unverified material as unverified.
- Surface discarded and abandoned work in the final report when it affects scope or confidence.

## Failure Modes

- **Context amnesia:** a worker solves an older or narrower objective.
- **Contract gap:** the manager leaves scope, output, or proof undefined.
- **Parallel contradiction:** workers make incompatible implicit decisions.
- **Commitment failure:** a worker promises a path and silently takes another.
- **Expectation failure:** a worker reasons from an incorrect model of another unit.
- **Tool theater:** activity is presented as evidence.
- **Premature completion:** success is claimed without current verification.
- **Over-broad edits:** a worker changes unowned files or interfaces.
- **Citation laundering:** secondary summaries are presented as primary evidence.
- **Integration fog:** the manager concatenates outputs without resolving conflicts.
- **Orchestration excess:** a coherent task is split despite no measurable benefit.

When a failure appears, update `WHIPS.md`, tighten the contract, and re-inspect. Do not merely remind the worker to "be careful."

## Pair With unlazy

When a substantial worker has unlazy available, read [references/interoperability.md](references/interoperability.md). APM controls the manager's `WHIPS.md`; unlazy controls each worker's runnable `GATES.md`. The manager still re-verifies the leaf evidence before acceptance.

## Output Modes

### A2A Plan

Return the architecture decision, work units, dependencies, handlers, proof, merge strategy, and reasons delegation earns its cost.

### Dispatch Pack

Return ready-to-send contracts for every `READY` work unit.

### Manager Audit

Audit goal preservation, architecture choice, contracts, context, evidence, ownership, state transitions, integration, and failure modes. Produce corrective `REWHIP` instructions where needed.

### Final Integration Report

Report verified outcomes, proof reproduced by the manager, conflicts resolved, discarded or abandoned work, residual risks, and remaining decisions.

## Research Routing

If the user asks whether multi-agent execution is justified or requests the evidence behind this protocol, read [references/research.md](references/research.md). Do not claim that APM proves multi-agent superiority or that lower token prices remove coordination costs.
