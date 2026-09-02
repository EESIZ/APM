# WHIPS Project Memory

WHIPS is the durable memory of a persistent multi-session project. It is not a natural-language work-order parser and it is not a reason to create a hierarchy for every task.

```text
W - Workstreams and their durable ownership
H - Hierarchy, human authority, and handoffs
I - Invariants, interfaces, and integration
P - Project memory, proof, and provenance
S - Sessions, state, and succession
```

The canonical machine-readable state is `.apm/project.json`. The manager and workers may communicate in ordinary prose. The state file records the meanings that must survive those conversations.

## Directory Layout

```text
.apm/
  project.json
  checkpoints/
    <session-id>.md
  handoffs/
    <handoff-id>.md
  local/
```

- `project.json` is shared durable state and should normally be committed.
- `checkpoints/` contains bounded continuity packets written before compaction or replacement.
- `handoffs/` contains immutable succession packets.
- `local/` may contain uncommitted runtime data and must not contain the only copy of a project decision.

Do not store secrets, raw transcripts, long logs, or full source snapshots in project state.

## Project State

The schema version is `2`. See [templates/APM_PROJECT.json](templates/APM_PROJECT.json) for a complete example.

### Project

```json
{
  "project": {
    "name": "FiveGround",
    "mission": "The outcome that must survive every session",
    "phase": "current project phase",
    "status": "draft | active | paused | complete",
    "human_authority": "user",
    "manager_session": "manager-1"
  }
}
```

An active project has exactly one active manager. The human authority remains the source of final approval unless an exact directive explicitly delegates a bounded decision.

### Directives

Record consequential user instructions without paraphrasing away their scope.

```json
{
  "id": "U1",
  "quote": "Exact user sentence",
  "scope": "what this authorizes",
  "authority": "user",
  "source": "message id, transcript location, or direct manager observation",
  "recorded_at": "ISO-8601 timestamp",
  "status": "active"
}
```

Valid statuses are `active`, `superseded`, and `expired`. Approval for planning, commit, deployment, destructive actions, and architecture changes is not interchangeable.

### Invariants And Architecture

Invariants are concise rules that must survive handoff. Architecture entries define stable boundaries and interfaces.

```json
{
  "invariants": [
    {"id": "I1", "text": "Rule that may not drift", "authority": "user", "status": "active"}
  ],
  "architecture": [
    {
      "id": "A1",
      "area": "combat",
      "rule": "accepted boundary or interface",
      "owner_session": "worker-combat",
      "interfaces": ["src/combat/api.ts"]
    }
  ]
}
```

Architecture changes require the authority named by the applicable directive or invariant. Record a new decision; do not silently rewrite the old rule.

### Sessions

Each persistent session has an identity and generation. Never reuse an id for a replacement.

```json
{
  "id": "worker-combat-1",
  "role": "worker",
  "generation": 1,
  "scope": "combat systems",
  "status": "active",
  "context": {
    "health": "green",
    "last_checkpoint": ".apm/checkpoints/worker-combat-1.md",
    "checkpoint_sha256": "sha256 of the checkpoint file",
    "last_refresh": "ISO-8601 timestamp",
    "compactions": 1,
    "signals": [],
    "next_action": "implement W3"
  }
}
```

Roles are `manager`, `worker`, `recorder`, `verifier`, or `integrator`. Session statuses are `starting`, `active`, `compact-due`, `handoff-due`, `replacing`, `retired`, and `lost`. Context health is `green`, `amber`, `red`, or `unknown`.

`amber` and `red` are operational warnings, not shame labels. They trigger checkpoint, refresh, handoff, or replacement actions.

### Workstreams

A workstream is large enough to benefit from continuity. Do not create one per tool call.

```json
{
  "id": "W3",
  "title": "combat resolution",
  "owner_session": "worker-combat-1",
  "state": "active",
  "depends_on": ["W1"],
  "scope": ["src/combat/**"],
  "acceptance": ["deterministic replay test passes"],
  "outputs": ["commit:abc123"],
  "evidence": ["test:combat-replay exit=0"],
  "decision_needed": null,
  "updated_at": "ISO-8601 timestamp"
}
```

States are:

```text
backlog -> ready -> active -> review -> accepted
                     |          |
                     -> blocked -> active
Any nonterminal state -> superseded | abandoned
```

Rules:

- every active or review workstream has one active non-manager owner;
- dependencies must exist and must not form a cycle;
- accepted work records both outputs and evidence;
- coupled write scopes have one owner or an explicit serialized transfer;
- a retired or lost session cannot retain active ownership;
- the manager may coordinate and inspect but does not own production workstreams.

### Decisions

```json
{
  "id": "D7",
  "text": "Accepted decision",
  "authority": "user | manager",
  "status": "active",
  "affects": ["W3", "A1"],
  "evidence": "exact directive or measured basis",
  "supersedes": null,
  "recorded_at": "ISO-8601 timestamp"
}
```

Preserve superseded decisions. A future session needs to know not only what is current but which tempting old path was deliberately rejected.

### Observations

Every important claim should be typed by epistemic status:

```json
{
  "id": "O9",
  "kind": "measured | reported | planned | unknown",
  "claim": "what is believed",
  "source": "command, commit, artifact, session, or user",
  "at": "ISO-8601 timestamp"
}
```

Never silently promote `reported` or `planned` to `measured`.

### Handoffs

Handoffs are two-phase records.

```json
{
  "id": "H1",
  "from": "manager-1",
  "to": "manager-2",
  "role": "manager",
  "status": "prepared | accepted | cancelled",
  "packet": ".apm/handoffs/H1.md",
  "packet_sha256": "sha256 of the immutable packet",
  "prepared_at": "ISO-8601 timestamp",
  "accepted_at": null,
  "acknowledgement": null
}
```

Preparing a handoff does not transfer authority. Acceptance does.

### Project Reviews

Record periodic cumulative snapshots so project benefit can be evaluated over time rather than inferred from agent activity.

```json
{
  "id": "R1",
  "period": "milestone-1",
  "accepted_workstreams": 6,
  "architecture_violations": 0,
  "regressions": 1,
  "rework_events": 2,
  "compactions": 3,
  "handoffs": 1,
  "integration_losses": 0,
  "elapsed_hours": 18.5,
  "tokens": null,
  "cost_usd": null,
  "evidence": ["commit range", "test report", "decision audit"]
}
```

Use `null` when a metric is unavailable. Do not replace an unavailable measurement with an estimate unless the estimate is explicitly labeled in evidence.

## Validation Severity

The runtime distinguishes structural errors from operating warnings.

**Errors** include invalid JSON, duplicate ids, missing references, dependency cycles, multiple active managers, manager-owned production work, or accepted work without outputs and evidence.

**Warnings** include amber or red context, stale or missing checkpoints, unresolved decisions, an unaccepted handoff, or ownership that should be reviewed.

Warnings produce the next management actions but do not lock the agent out of ordinary tools. This is deliberate: the failed v3/v4 runtime demonstrated that a strict natural-language gate can consume the project instead of protecting it.

## Context Checkpoint

Use [templates/SESSION_CHECKPOINT.md](templates/SESSION_CHECKPOINT.md). A useful checkpoint contains:

- session identity, generation, role, and scope;
- current objective and applicable invariants;
- changed artifacts and current measured evidence;
- accepted local decisions and rejected paths;
- unresolved questions and blockers;
- next action and expected proof;
- context-health signals and reason for compact or handoff.

The checkpoint is a working-set continuation, not a transcript summary.

## Handoff Packet

Use [templates/HANDOFF.md](templates/HANDOFF.md). A manager packet includes:

- mission, phase, human authority, and exact active directives;
- invariants and architecture map;
- active roster with context health;
- active, review, and blocked workstreams;
- unresolved decisions and integration risks;
- current measured outputs and evidence locations;
- the next three management actions.

The successor acknowledgement restates the mission, non-negotiables, current phase, largest risk, and next three actions. Transfer authority only after discrepancies are corrected.

## WHIPS Brief

`apmctl brief` renders a bounded view of project state for one session. It is intentionally selective:

- managers receive global state and bounded workstream summaries;
- workers receive their scope, relevant invariants and decisions, owned workstreams, dependencies, and next action;
- retired sessions receive no new assignment context.

This brief is the normal refresh input after compaction or at the start of a successor session. Do not replay the full project transcript.

## Runtime Commands

```bash
node <skill-dir>/scripts/apmctl.mjs init --name "Project"
node <skill-dir>/scripts/apmctl.mjs validate
node <skill-dir>/scripts/apmctl.mjs status --json
node <skill-dir>/scripts/apmctl.mjs brief --session worker-combat-1
node <skill-dir>/scripts/apmctl.mjs checkpoint --session worker-combat-1 --file .apm/checkpoints/worker-combat-1.md --health green --compacted
node <skill-dir>/scripts/apmctl.mjs handoff --from manager-1 --to manager-2
node <skill-dir>/scripts/apmctl.mjs accept-handoff --id H1 --ack-file .apm/handoffs/H1-ack.md
```

The scripts validate and summarize shared state. Artifact inspection, user approval, and managerial judgment remain outside the parser.
