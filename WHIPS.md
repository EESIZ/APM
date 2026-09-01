# WHIPS Manager Ledger

`WHIPS.md` is the manager-owned control ledger for a delegated-agent run. It records what was assigned, who owns it, how the manager will inspect it, what proof is required, and whether the work may be integrated.

The ledger is an active gate, not retrospective documentation. Create it before the first worker call, update it after every dispatch and return, and keep downstream units blocked until their dependencies are manager-verified.

```text
W - Work Unit
H - Handler
I - Inspection
P - Proof
S - State
```

## Required Header

```markdown
# WHIPS: <scope>

OBJECTIVE: <one sentence preserving the user's goal>
MANAGER: <responsible orchestrator>
INTEGRATION: <how verified units become one result>
STOP: <root completion condition>
ENFORCEMENT: no downstream dispatch or integration before manager verification
AUDIT CADENCE: after every return and before every dependent dispatch
```

## Required Work Unit Fields

```markdown
- [ ] W1: <observable work unit>
  HANDLER: <subagent id or UNASSIGNED>
  NEEDS: <verified unit ids or none>
  OWNS: <repository-relative paths or read-only>
  INPUTS: <context, artifacts, and accepted decisions>
  OUTPUT: <artifact or response contract>
  NORM: <expected quantity, quality, proof, and completion boundary>
  BUDGET: <time, tokens, calls, tools, or other limit>
  INSPECTION: <what the manager will examine independently>
  PROOF: <commands, source evidence, or observable acceptance evidence>
  DISPATCH: <worker call/session id and dispatch time, or pending>
  REPORT: <received APM WORK REPORT reference, or pending>
  ACCOUNT: <actual output, usage, unfinished work, and deviations, or pending>
  STATE: WAITING | READY | IN-FLIGHT | VERIFYING | VERIFIED | REWHIP | DISCARDED | ABANDONED
  EVIDENCE: pending
```

Every work unit must be independently inspectable. Use `OWNS: read-only` for research and review units. Paths coordinate writers; they do not isolate processes.

The fields implement the five controls:

| Control | Ledger evidence |
| --- | --- |
| Reduce | unit id, `NEEDS`, `OWNS`, one observable `OUTPUT` |
| Measure | `NORM`, `BUDGET`, `PROOF`, and returned `ACCOUNT` |
| Delegate | written work order, `HANDLER`, `DISPATCH`, and reporting line |
| Maintain | current `INPUTS`, budget checkpoint, blocker report, and replacement condition |
| Discipline | manager-owned `STATE`, evidence gate, `REWHIP`, reassignment, discard, or abandonment |

## State Authority

The manager owns state transitions.

- `WAITING`: one or more ids in `NEEDS` are not `VERIFIED`.
- `READY`: dependencies are verified and ownership is available.
- `IN-FLIGHT`: the contract has been dispatched.
- `VERIFYING`: the handler returned and the manager is checking current proof.
- `VERIFIED`: the manager reproduced or directly inspected the required proof.
- `REWHIP`: the result is recoverable but requires a corrective contract.
- `DISCARDED`: the result will not be integrated; record why.
- `ABANDONED`: completion is impossible or no longer warranted; record the reason and handoff.

A handler cannot self-certify `VERIFIED`. A completion message moves the unit to `VERIFYING`.

State transitions control execution:

- Move `READY` to `IN-FLIGHT` only after the complete APM work order and return schema have been placed in the child prompt and `DISPATCH` has been recorded.
- Keep dependent units `WAITING` while any id in `NEEDS` is not `VERIFIED`.
- A missing or malformed report does not unlock inspection. Record the breach and issue `REWHIP`.
- Do not close the run while a required unit is `READY`, `IN-FLIGHT`, `VERIFYING`, or `REWHIP`.

## Corrective Dispatch

Append a correction without erasing the failed attempt:

```markdown
  REWHIP 1:
    REASON: <contract, context, evidence, or integration failure>
    RETURN: <specific missing or corrected output>
    PROOF: <evidence required on the next return>
    HANDLER: <same or reassigned agent>
```

Set the unit to `READY` when the corrective contract is dispatchable, then to `IN-FLIGHT` when sent.

Every corrective prompt repeats the unit objective, owned scope, exact missing return, proof, and the full APM work report schema. Do not rely on the worker remembering the first contract.

## Worker Report Gate

Each child prompt must require this return shape:

```markdown
APM WORK REPORT
UNIT: <unit id>
STATUS: COMPLETE | BLOCKED | PARTIAL
OUTPUTS: <exact paths, patch, commit, findings, or none>
UNFINISHED: <required work not completed, or none>
PROOF: <command and exit code, source evidence, or observable check>
CHANGES: <files, interfaces, and decisions changed>
ACCOUNT: <norm achieved, budget used, and deviations>
ASSUMPTIONS: <remaining assumptions or none>
RISKS: <residual risks or none>
MANAGER DECISION: <specific decision needed or none>
```

The manager records the report reference in `REPORT`, writes the expected-versus-actual comparison in `ACCOUNT`, validates all fields, and only then moves the unit to `VERIFYING`. The report is a handoff record, not proof by itself.

## Evidence Rules

- Record decisive evidence, not a narrative that evidence exists.
- Re-run runnable proof when the environment permits; inherited output is not re-verification.
- For research, retain claim-level source URLs and distinguish primary from secondary sources.
- For code, record command, working directory, exit code, and decisive output.
- For manual inspection, cite the artifact and exact observation.
- If proof cannot be obtained, keep the unit unverified or mark it `ABANDONED` with a reason.

## Integration Rule

Integrate only `VERIFIED` units. Local verification does not prove cross-unit compatibility, so the root integration must also inspect interfaces, assumptions, end-to-end behavior, and regressions.

Use the exact artifact, patch, commit, or cited finding returned by the worker. If the manager rewrites a returned implementation during integration, record the manager's change and repeat both the unit proof and root proof. Silent reconstruction destroys provenance.

Copy [templates/WHIPS.md](templates/WHIPS.md) to start a run.
