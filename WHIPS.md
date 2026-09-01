# WHIPS Manager Ledger

`WHIPS.md` is the manager-owned control ledger for a delegated-agent run. It records what was assigned, who owns it, how the manager will inspect it, what proof is required, and whether the work may be integrated.

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
```

## Required Work Unit Fields

```markdown
- [ ] W1: <observable work unit>
  HANDLER: <subagent id or UNASSIGNED>
  NEEDS: <verified unit ids or none>
  OWNS: <repository-relative paths or read-only>
  INPUTS: <context, artifacts, and accepted decisions>
  OUTPUT: <artifact or response contract>
  INSPECTION: <what the manager will examine independently>
  PROOF: <commands, source evidence, or observable acceptance evidence>
  STATE: WAITING | READY | IN-FLIGHT | VERIFYING | VERIFIED | REWHIP | DISCARDED | ABANDONED
  EVIDENCE: pending
```

Every work unit must be independently inspectable. Use `OWNS: read-only` for research and review units. Paths coordinate writers; they do not isolate processes.

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

## Evidence Rules

- Record decisive evidence, not a narrative that evidence exists.
- Re-run runnable proof when the environment permits; inherited output is not re-verification.
- For research, retain claim-level source URLs and distinguish primary from secondary sources.
- For code, record command, working directory, exit code, and decisive output.
- For manual inspection, cite the artifact and exact observation.
- If proof cannot be obtained, keep the unit unverified or mark it `ABANDONED` with a reason.

## Integration Rule

Integrate only `VERIFIED` units. Local verification does not prove cross-unit compatibility, so the root integration must also inspect interfaces, assumptions, end-to-end behavior, and regressions.

Copy [templates/WHIPS.md](templates/WHIPS.md) to start a run.
