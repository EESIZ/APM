# Operational Controls

APM's five operations are abstractions extracted from historical estate-management records. This document makes their runtime meaning explicit. The historical sources explain the lineage; the controls below define agent behavior.

| Historical administrative move | Abstract operation | Manager action | Observable record | Enforcement consequence |
| --- | --- | --- | --- | --- |
| Count work, labor, tools, and unfinished duties | Reduce | Divide the objective into bounded units with one owner and visible dependencies | Unit id, `HANDLER`, `NEEDS`, `OWNS`, `OUTPUT` | An ambiguous or overlapping unit stays `WAITING` |
| Compare output with labor and time; inspect before accepting explanations | Measure | Set norms, resource and context limits, and a bounded return before dispatch; compare them with actual output and usage | `NORM`, `BUDGET`, `CONTEXT LIMIT`, `RETURN LIMIT`, `ACCOUNT`, `CONTEXT ACCOUNT` | Unsupported or over-limit narratives cannot pass `VERIFYING` |
| Leave written directions and require reports through an overseer | Delegate | Put the complete work order and report schema in every child prompt; retain one integration authority | `DISPATCH`, APM work order, APM work report | A worker cannot self-certify or silently alter sibling work |
| Preserve tools, records, health, and productive capacity | Maintain | Supply a minimal context slice, execute a `WATCH` cadence, enforce context and return limits, and replace stale or contaminated contexts | `INPUTS`, `CONTEXT LIMIT`, `RETURN LIMIT`, `REPLACE WHEN`, checkpoints | Obsolete, looping, or context-saturated workers lose the assignment without polluting manager context |
| Return the overseer to the account and correct failed execution | Discipline | Dispatch a different verifier, hold dependent gates, `REWHIP`, revoke ownership, reassign, discard, or abandon | `VERIFIER`, verifier report, manager-owned `STATE`, correction history | Failure changes execution state and ownership instead of producing a verbal reminder |

## Concrete Cycle

### Before dispatch

1. **Reduce:** identify one observable output and one owner.
2. **Measure:** state the expected yield, quality, proof, resource ceiling, context ceiling, and bounded return.
3. **Delegate:** issue written instructions with a fixed reporting line.
4. **Maintain:** provide current context and define checkpoint and replacement conditions.
5. **Discipline:** state which gate remains closed and what correction follows a breach.

### On return

1. Dispatch a fresh verifier to inspect the current artifact or state independently.
2. Compare `OUTPUTS`, `UNFINISHED`, and `ACCOUNT` with `NORM` and `BUDGET`.
3. Check proof rather than accepting the handler's explanation as proof.
4. Record one manager decision: `VERIFIED`, `REWHIP`, reassigned, `DISCARDED`, or `ABANDONED`.
5. Unlock dependent work only after verification.

### During integration

1. Dispatch exact returned artifacts to a dedicated `ROOT` integration worker so provenance survives the handoff.
2. Never let the manager rewrite or silently reconstruct worker output.
3. Dispatch a different root verifier to check interfaces, assumptions, end-to-end behavior, and regressions.
4. Close the run only when the manager accepts bounded `PASS` evidence for `ROOT`.

The resulting system does not rely on workers voluntarily remembering APM. The manager carries the controls into each dispatch and makes compliance observable through state transitions.

The runtime translation is intentionally manager-centered. `PreToolUse` prevents unaccountable orders and blocks manager leaf work, `SubagentStop` prevents unbounded or malformed producer and verifier returns, and `Stop` prevents the manager from leaving computed duties unfinished. WHIPS acts as a whip by creating consequences for managerial inaction and role collapse.
