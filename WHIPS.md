# WHIPS Manager Ledger

`WHIPS.md` is the non-executing manager's durable control plane. It preserves the mission and whole-system map while disposable worker contexts absorb source code, logs, research, implementation, testing, verification, and integration.

Create it before the first leaf action. Use `<project>/WHIPS.md`, a sibling `shared/WHIPS.md` in team harnesses, or set `APM_WHIPS_PATH`. Update it after every dispatch and bounded return. The manager may decide, assign, watch, correct, and accept; it may not become a worker.

```text
W - Work Unit
H - Handler and independent verifier
I - Inspection contract
P - Proof required for manager acceptance
S - Manager-owned state
```

## Required Header

```markdown
# WHIPS: <scope>

MISSION: <one sentence preserving the user's desired outcome>
NON-NEGOTIABLES: <constraints that may not drift>
SYSTEM MAP: <whole-system structure, work units, and dependencies>
DECISIONS: <accepted architecture and policy decisions>
MANAGER: <responsible non-executing orchestrator>
CONTEXT POLICY: <what remains with the manager and what remains in worker contexts>
STOP: ROOT is VERIFIED or explicitly ABANDONED with a reason and handoff
ENFORCEMENT: manager performs no leaf work; every producer has a different verifier
```

The manager re-reads this constitution before every dispatch, state transition, correction, and final decision. Raw source, long logs, exploratory transcripts, patches, and test output are not manager context.

## Required Work Unit Fields

```markdown
- [ ] W1: <observable work unit>
  HANDLER: <producer agent>
  VERIFIER: <different verifier agent>
  NEEDS: <verified unit ids or none>
  OWNS: <repository-relative paths or read-only>
  INPUTS: <minimum sufficient context and accepted decisions>
  CONTEXT LIMIT: <maximum input tokens and worker tool calls>
  RETURN LIMIT: <integer chars>
  REPLACE WHEN: <context, loop, staleness, or scope threshold>
  OUTPUT: <artifact or response contract>
  NORM: <quantity, quality, proof, and completion boundary>
  BUDGET: <time, tokens, calls, tools, or other limit>
  WATCH: <wait, poll, recontact, or interrupt cadence>
  INSPECTION: <what the fresh verifier will inspect>
  PROOF: <commands, source evidence, or observable acceptance evidence>
  VERIFY INPUTS: <bounded artifact paths and decisions for the verifier>
  DISPATCH: <producer call/session id and time, or pending>
  REPORT: <APM WORK REPORT reference, or pending>
  ACCOUNT: <actual output, usage, unfinished work, and deviations, or pending>
  VERIFY DISPATCH: <verifier call/session id and time, or pending>
  VERIFY REPORT: <APM VERIFY REPORT reference, or pending>
  STATE: WAITING | READY | IN-FLIGHT | VERIFYING | VERIFIED | REWHIP | DISCARDED | ABANDONED
  EVIDENCE: <PASS evidence, failure reason, or pending>
```

`RETURN LIMIT` uses the machine-readable form `<integer> chars`, for example `4000 chars`. Every producer and verifier report includes a `CONTEXT ACCOUNT`. `HANDLER` and `VERIFIER` must identify different agents.

Use the same full field set for `ROOT`. Its handler is a dedicated integration worker, not the manager, and its verifier must be different from that integrator.

## Context Control

- Give each worker only the smallest context slice needed for its unit.
- Keep durable artifacts on disk and pass paths or compact decisions instead of predecessor transcripts.
- Stop and replace a worker when `REPLACE WHEN` fires.
- Do not ask a replacement to continue from an unbounded chat transcript.
- Reject reports over `RETURN LIMIT`; they would pollute the manager context.
- Record supplied context, tool calls, compaction, and limit status in `CONTEXT ACCOUNT`.

The runtime can enforce order fields and returned character count. Token and compaction accounting depends on the agent runtime, so the worker must report it and the manager must treat uncertainty as a reason to replace or narrow the contract.

## State Authority

- `WAITING`: one or more ids in `NEEDS` are not `VERIFIED`.
- `READY`: dependencies are verified and the producer contract is complete.
- `IN-FLIGHT`: the producer contract has been dispatched.
- `VERIFYING`: the producer returned; a different verifier must now run.
- `VERIFIED`: the verifier returned `PASS`, `GAPS: none`, and the manager accepted the evidence.
- `REWHIP`: the producer or verifier failed a recoverable contract.
- `DISCARDED`: the result will not be integrated; record why.
- `ABANDONED`: completion is impossible or no longer warranted; record reason and handoff.

A producer cannot self-certify. A verifier produces evidence but cannot change ledger state. Only the manager accepts or rejects evidence. `VERIFIED` evidence must begin with `PASS`.

## Runtime Manager Gate

Run the bundled checker from the target project root:

```text
node <installed-skill-dir>/scripts/whips-check.mjs --status
```

It derives duties from the ledger:

- `M-UNLOCK`: dependencies cleared; finish the next bounded contract.
- `M-DISPATCH`: send the recorded producer order.
- `M-WATCH`: collect a producer or verifier report at the recorded cadence.
- `M-VERIFY`: dispatch the independent verifier.
- `M-DECIDE`: accept `PASS` or correct, reassign, discard, or abandon.
- `M-CORRECT`: execute a recorded `REWHIP` or ownership change.

Claude Code hooks call the same logic before Agent dispatch, before manager leaf tools, when a subagent stops, and when the manager attempts to stop. With persistent enforcement installed, direct repository inspection, editing, shell work, and web research are denied to the main manager. Once an execution tool is attempted, `Stop` requires an active ledger instead of permitting a failure narrative.

For dispatch, the manager should send only one of these prompts:

```text
APM DISPATCH: W1
APM VERIFY: W1
```

The hook expands the shorthand into the complete producer or verifier envelope using this ledger. It also replaces incomplete, duplicated, or drifted fields with canonical ledger values. `TaskCreate` receives the same normalization. Unknown units and invalid states stay blocked, with an exact valid envelope included in the rejection. Task-list and team tools remain secondary control surfaces backed by an active valid ledger. Dispatched workers retain their leaf tools but cannot create an unrecorded child hierarchy.

Hook decisions append to `.apm/runtime.jsonl` without prompt or report content. Summarize them with:

```text
node <installed-skill-dir>/scripts/runtime-report.mjs --json
```

## Producer Return

```markdown
APM WORK REPORT
UNIT: <unit id>
STATUS: COMPLETE | BLOCKED | PARTIAL
OUTPUTS: <exact paths, patch, commit, findings, or none>
UNFINISHED: <required work not completed, or none>
PROOF: <command and exit code, source evidence, or observable check>
CHANGES: <files, interfaces, and decisions changed>
ACCOUNT: <norm achieved, budget used, and deviations>
CONTEXT ACCOUNT: <context supplied, tool calls used, compaction or limit status>
ASSUMPTIONS: <remaining assumptions or none>
RISKS: <residual risks or none>
MANAGER DECISION: <specific decision needed or none>
```

A conforming producer return moves the unit only to `VERIFYING`.

## Independent Verifier Return

```markdown
APM VERIFY REPORT
UNIT: <unit id>
VERDICT: PASS | FAIL | BLOCKED
CHECKS: <checks actually performed>
PROOF: <decisive evidence>
GAPS: <missing or failed requirements, or none>
CONTEXT ACCOUNT: <context supplied, tool calls used, compaction or limit status>
RISKS: <residual risks or none>
MANAGER DECISION: <specific correction or acceptance decision needed>
```

`PASS` requires `GAPS: none`. `FAIL` or `BLOCKED` keeps dependencies closed and must request a concrete manager decision.

## Corrective Dispatch

Append corrections without erasing failed attempts:

```markdown
  REWHIP 1:
    REASON: <contract, context, evidence, or integration failure>
    RETURN: <specific missing or corrected output>
    PROOF: <evidence required on the next return>
    HANDLER: <same or replacement agent>
```

Repeat the complete mission slice, context limit, ownership, missing return, proof, replacement condition, and report schema. Never rely on the worker remembering its prior context.

## Root Integration

Unlock `ROOT` only after every required unit is `VERIFIED`. Dispatch exact verified artifacts to the root integrator. The manager does not rewrite or merge them. A different root verifier checks interfaces, assumptions, end-to-end behavior, and regressions. The run closes only after the manager accepts that bounded `PASS` report.

Copy [templates/WHIPS.md](templates/WHIPS.md) to start a run.
