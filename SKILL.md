---
name: a2a-manager-agent-orchestration
description: >-
  Use this skill to operate a long-running project through multiple persistent
  agent sessions. Trigger when a user appoints a manager or director, coordinates
  named worker sessions, uses session-to-session A2A communication, shares one
  repository or workspace, manages context compaction or session handoff, or
  needs architecture and rules to survive across many tasks. Preserve global
  intent in a manager session, stable domain context in worker sessions, and
  durable project state outside every chat. Do not trigger for ordinary one-shot
  tasks, ephemeral subagent calls, or merely because agent tools are available.
---

# APM: Persistent Multi-Session Project Management

Operate an agent organization whose lifetime is longer than any one context window.

APM does not teach modern models how to summon subagents. They already possess orchestration behavior. APM manages the harder layer: persistent ownership, project memory, context health, session succession, user authority, and verified integration across many tasks.

```text
Human: mission, approval, architecture authority, session creation and removal
  -> Manager session: project memory, roster, work map, decisions, integration
       -> Persistent worker sessions: stable domain ownership and implementation
       -> Optional recorder/verifier sessions: measured state and independent checks
```

## Activation Boundary

Use APM when the unit of work is a continuing project and at least one of these is true:

- several named sessions will remain available across tasks;
- a manager or development director coordinates other sessions;
- architecture, rules, ownership, and decisions must survive context pressure;
- workers communicate through A2A messages or a shared repository;
- sessions are compacted, replaced, or handed over while work continues;
- the user explicitly asks to establish or audit an APM organization.

Do not convert a coherent one-shot task into a hierarchy. Do not spawn workers merely to activate this protocol. If the runtime exposes only ephemeral subagents, use its native orchestration unless the user is explicitly designing a persistent project organization.

Activation means the organization already exists or the user wants to establish one. It never means that every leaf must be delegated.

## Prime Directive

Keep the user's intent and the project's accepted architecture alive when individual sessions forget, compact, fail, or retire.

The manager owns judgment but not production work. It may inspect bounded diffs, interfaces, test evidence, candidate artifacts, and project state because acceptance without inspection is blindness. It should not become the regular implementer or absorb full worker transcripts, exploratory logs, and local debugging history.

## The Five Operations

The historical abstractions remain, but their unit is now the project lifecycle rather than one tool call.

### 1. Reduce

Divide the project into durable workstreams with meaningful ownership boundaries. Do not atomize a task into disposable calls when one persistent session can carry the domain context.

Record:

- the project mission and current phase;
- non-negotiable rules and architecture invariants;
- workstreams, dependencies, interfaces, and one current owner;
- decisions that affect more than one session;
- coupled files or resources that require one writer or an explicit lock.

### 2. Measure

Separate what was measured from what was reported, planned, or remains unknown.

Measure cumulative project health:

- accepted features and verified artifacts;
- regressions, rework, reversions, and unresolved integration;
- architecture and rule violations;
- context-health signals and session replacements;
- elapsed time, cost, and throughput when available.

A worker's statement is a report. A current commit, file, test, rendered artifact, or reproduced observation is measured evidence. Preserve both without confusing them.

### 3. Delegate

Prefer stable ownership. Give related follow-up work to the session that already holds the useful context unless its context is stale, contaminated, or no longer aligned.

Every assignment carries the minimum durable contract:

- user objective and applicable exact user directives;
- workstream, scope, ownership, and dependencies;
- relevant invariants, interfaces, and accepted decisions;
- expected artifact and evidence;
- escalation conditions and the decision that remains with the manager or user.

Use natural language. A2A messages must preserve these meanings, not reproduce a byte-exact envelope. Runtime validation reports missing semantics with expected values; it must not trap a model in formatting retries.

### 4. Maintain

Treat useful context as an asset. Keep it near the work that created it, checkpoint it before compression, and replace it only when continuity becomes unreliable.

Maintain two complementary memories:

- **global memory:** mission, invariants, architecture, roster, decisions, dependencies, and integration state;
- **local memory:** source exploration, implementation details, test history, and domain-specific working knowledge.

The manager carries global memory. Workers carry local memory. Durable state on disk allows both to be refreshed or succeeded without replaying full transcripts.

### 5. Discipline

Make claims answerable to evidence and make failures change state.

- Do not treat a completion claim as accepted work.
- Inspect current artifacts at a depth proportional to risk.
- Use a fresh verifier for consequential, disputed, security-sensitive, or cross-workstream changes; do not require one for every trivial return.
- Reassign or replace a session after repeated contradiction, silent scope reduction, fabricated inspection, or context drift.
- Preserve failed attempts and corrections instead of rewriting history.
- Ask the human for architecture changes, session creation or removal, destructive actions, and any decision reserved in project state.

Discipline is not the number of blocked tool calls. It is the preservation of authority, evidence, ownership, and project continuity.

## Durable Project State

Use `.apm/project.json` as the canonical structured state. Read [WHIPS.md](WHIPS.md) for the schema and operating rules.

```text
.apm/
  project.json                 canonical project, roster, work, and decision state
  checkpoints/<session>.md    compact local continuity packet
  handoffs/<handoff>.md       immutable succession packet
  local/                      optional uncommitted runtime data
```

Commit `project.json`, checkpoints, and accepted handoffs when the repository is the project's durable memory. Keep secrets and raw transcripts out of them.

Initialize and inspect state with the bundled zero-dependency CLI:

```bash
node <skill-dir>/scripts/apmctl.mjs init --name "Project name"
node <skill-dir>/scripts/apmctl.mjs validate
node <skill-dir>/scripts/apmctl.mjs status
node <skill-dir>/scripts/apmctl.mjs brief --session manager-1
```

The CLI validates references and lifecycle invariants. It does not decide whether to delegate, block ordinary tools, or claim that state correctness proves artifact correctness.

## Human Authority

The human remains above the manager.

- Record approvals as exact quotations with their task and scope. A summary or another session's claim that approval exists is not approval.
- Do not extend approval from commit to deployment, from one workstream to another, or from one session generation to the next without recorded scope.
- Session creation, retirement, and final architecture authority belong to the human unless explicitly delegated.
- The human may speak directly with any session. Copy consequential new instructions into project state and notify affected owners; do not treat the manager as a communications censor.
- Report uncertainty and managerial mistakes with the same weight as worker mistakes.

## Session Roles

### Manager

Retain the mission, invariants, system map, roster, workstream ownership, unresolved decisions, and integration state. Assign work, reconcile reports with measured state, inspect bounded artifacts, coordinate shared resources, and request session changes from the user.

Do not carry routine implementation history. When the manager context degrades, prepare a two-phase handoff instead of trying to remain immortal.

### Worker

Own a stable domain or workstream. Verify that an assignment is still current before editing, preserve relevant local context, expose scope changes, checkpoint before compaction, and return artifacts plus evidence and unresolved decisions.

### Recorder

Maintain state from measurements rather than hearsay. Keep snapshots immutable, update the current view, distinguish actual from planned values, and leave unknown facts marked unknown. This role may be separate when the project is large enough to justify it.

### Verifier Or Integrator

Inspect the current candidate in isolation when risk warrants it. Preserve artifact lineage and verify the actual integrated state, not a producer's remembered version. This can be a temporary role assigned to an existing session; it does not require a permanent agent for every unit.

## Context Health

Do not use nominal context-window size as the only signal. Mark a session `amber` or `red` when observable behavior indicates loss of coherence:

- it forgets or contradicts an accepted decision;
- it repeats a resolved investigation without new evidence;
- it misidentifies its ownership or current project phase;
- it silently narrows the assignment or reports unperformed inspection;
- it cannot state the next action and decisive blocker;
- compaction removed critical inputs;
- reports and rereads grow while verified progress stalls.

`amber` calls for a checkpoint, narrowed working set, and explicit refresh. `red` calls for handoff or replacement. Token and turn counts are useful telemetry, not sufficient proof of health.

## Worker Compaction

Before compacting a worker session:

1. Write a checkpoint containing the current objective, scope, relevant invariants, changed artifacts, measured evidence, unresolved decisions, blockers, and next action.
2. Record the checkpoint path and context health in `.apm/project.json`.
3. Compact the session.
4. Re-read the assignment, checkpoint, and applicable decisions.
5. Return a short continuity check: objective, ownership, next action, and largest unresolved risk.

If the continuity check disagrees with durable state, stop work and repair or replace the session.

## Manager Succession

Manager replacement is a normal lifecycle event, not a failure.

1. Freeze new assignments long enough to snapshot current state.
2. Prepare a handoff packet with mission, exact directives, invariants, architecture, roster, active and blocked work, decisions, risks, evidence locations, and next actions.
3. Start the successor as a new generation; do not overwrite the predecessor's identity.
4. Require the successor to acknowledge the mission, invariants, current phase, largest risk, and next three actions.
5. Compare that acknowledgement with durable state, correct discrepancies, then transfer manager authority.

Use:

```bash
node <skill-dir>/scripts/apmctl.mjs handoff --from manager-1 --to manager-2
node <skill-dir>/scripts/apmctl.mjs accept-handoff --id H1 --ack-file .apm/handoffs/H1-ack.md
```

The old manager remains authoritative until acceptance succeeds.

## A2A Message Semantics

Use ordinary prose, but make the message type and decision boundary visible.

```text
TYPE: ORDER | CHECK-IN | QUESTION | DECISION | RETURN | HANDOFF
FROM / TO: persistent session ids
WORKSTREAM: affected id or project-wide
FACTS: measured facts, reported claims, and unknowns kept distinct
ARTIFACTS / EVIDENCE: exact paths, commits, checks, or observations
DECISION NEEDED: who must decide what, or none
CONTEXT HEALTH: green, amber, red, or unknown
NEXT: next action and owner
```

Fields may be expressed naturally and combined when the meaning is unambiguous. Never reject useful work because punctuation or capitalization differs.

## Integration And Shared Workspaces

- Keep one active owner for a coupled artifact.
- Verify current ancestry and current files before assigning work from a stale board.
- Do not use another session's staged files or uncommitted work implicitly.
- Preserve exact candidate provenance through verification and integration.
- Let the manager inspect bounded candidates and integration evidence.
- For software projects sharing one worktree, read [references/software-project-profile.md](references/software-project-profile.md).

## Failure Modes

- **Microscopic hierarchy:** coordination is imposed before context pressure can exist.
- **Disposable expertise:** a useful worker is replaced after every task and must rediscover the domain.
- **Immortal manager:** one supervisory session accumulates context until it loses the blueprint.
- **Blind manager:** implementation is separated correctly, but artifact inspection is also forbidden.
- **Report reality:** worker prose replaces measured repository or artifact state.
- **Approval laundering:** a summary or peer message is treated as the user's authorization.
- **State rewriting:** an old snapshot is edited instead of recording a new fact and its source.
- **Shared-tree collision:** ownership exists in prose but not at the file or resource boundary.
- **Compaction amnesia:** a session compacts without a durable checkpoint and resumes from inference.
- **Succession drift:** a new manager receives activity history but not mission, invariants, decisions, and authority scope.
- **Orchestration excess:** agent count and control activity grow faster than accepted project output.

## Operating Modes

### Establish Organization

Create the project state, record the human authority and exact directives, name the manager generation, register persistent sessions, define stable scopes, and seed the first workstreams.

### Director Run

Read current state, reconcile reports with measurements, assign or rebalance work, inspect bounded candidates, propagate decisions, monitor context health, and keep integration coherent.

### Context Audit

Identify drift signals, stale ownership, missing checkpoints, overgrown manager context, and sessions due for compact or replacement.

### Succession

Prepare and accept a manager or worker handoff without replaying the full transcript.

### Project Review

Compare cumulative throughput, architecture adherence, rework, context events, cost, and unresolved integration across a meaningful project interval.

## Related Material

- [WHIPS state and succession specification](WHIPS.md)
- [Software project profile](references/software-project-profile.md)
- [Operational controls](references/operational-controls.md)
- [APM and unlazy interoperability](references/interoperability.md)
- [Experimental lineage and falsified designs](references/experiments.md)
- [Research claim ledger](references/research.md)
- [Historical origin](references/history.md)
