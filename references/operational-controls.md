# Operational Controls

APM's five operations are abstractions extracted from historical estate-management records. This document makes their runtime meaning explicit. The historical sources explain the lineage; the controls below define agent behavior.

| Historical administrative move | Abstract operation | Manager action | Observable record | Enforcement consequence |
| --- | --- | --- | --- | --- |
| Count work, labor, tools, and unfinished duties | Reduce | Divide the objective into bounded units with one owner and visible dependencies | Unit id, `HANDLER`, `NEEDS`, `OWNS`, `OUTPUT` | An ambiguous or overlapping unit stays `WAITING` |
| Compare output with labor and time; inspect before accepting explanations | Measure | Set the norm and budget before dispatch, then compare them with actual output and usage | `NORM`, `BUDGET`, `PROOF`, `ACCOUNT` | Unsupported narratives cannot pass `VERIFYING` |
| Leave written directions and require reports through an overseer | Delegate | Put the complete work order and report schema in every child prompt; retain one integration authority | `DISPATCH`, APM work order, APM work report | A worker cannot self-certify or silently alter sibling work |
| Preserve tools, records, health, and productive capacity | Maintain | Refresh context, supply tools, execute a `WATCH` cadence, check blockers and budget, replace stale or contaminated contexts | `INPUTS`, `WATCH`, checkpoints, blocker reports, replacement reason | Obsolete work is stopped; looping or stale workers lose the assignment |
| Return the overseer to the account and correct failed execution | Discipline | Hold dependent gates, demand missing evidence, `REWHIP`, revoke ownership, reassign, discard, or abandon | manager-owned `STATE`, correction history, evidence | Failure changes execution state and ownership instead of producing a verbal reminder |

## Concrete Cycle

### Before dispatch

1. **Reduce:** identify one observable output and one owner.
2. **Measure:** state the expected yield, quality, proof, and resource ceiling.
3. **Delegate:** issue written instructions with a fixed reporting line.
4. **Maintain:** provide current context and define checkpoint and replacement conditions.
5. **Discipline:** state which gate remains closed and what correction follows a breach.

### On return

1. Inspect the current artifact or state independently.
2. Compare `OUTPUTS`, `UNFINISHED`, and `ACCOUNT` with `NORM` and `BUDGET`.
3. Check proof rather than accepting the handler's explanation as proof.
4. Record one manager decision: `VERIFIED`, `REWHIP`, reassigned, `DISCARDED`, or `ABANDONED`.
5. Unlock dependent work only after verification.

### During integration

1. Integrate exact returned artifacts so provenance survives the handoff.
2. Treat any manager rewrite as new work requiring renewed unit proof.
3. Recheck interfaces, assumptions, end-to-end behavior, and regressions at the root.
4. Close the run only when every required unit has a verified or explicitly terminal disposition.

The resulting system does not rely on workers voluntarily remembering APM. The manager carries the controls into each dispatch and makes compliance observable through state transitions.

The runtime translation is intentionally manager-centered. `PreToolUse` prevents the manager from issuing an unaccountable order, `SubagentStop` prevents the manager from receiving an unaccountable return, and `Stop` prevents the manager from leaving computed duties unfinished. WHIPS acts as a whip by creating consequences for managerial inaction.
