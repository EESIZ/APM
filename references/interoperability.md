# APM and unlazy Interoperability

APM controls the delegation boundary. unlazy controls completion inside a substantial worker leaf.

| Concern | APM manager | unlazy worker |
| --- | --- | --- |
| Objective | Preserve the user's root goal | Complete the bounded leaf |
| Contract | `WHIPS.md` work unit | `GATES.md` acceptance gates |
| Ownership | Assign handler, dependencies, and `OWNS` | Claim and respect the leaf scope |
| Evidence | Define `INSPECTION` and `PROOF` | Run `CHECK`, match `EXPECT`, record `EVIDENCE` |
| State | Decide `VERIFYING`, `VERIFIED`, `REWHIP`, or discard | Report met, unmet, and abandoned gates |
| Integration | Reverify and merge across leaves | Prove only the local deliverable |

## Dispatch Contract

For a worker using unlazy, the APM work unit must include:

```markdown
OUTPUT: completed artifact plus the leaf GATES.md
NORM: exact leaf acceptance gates and completion boundary
BUDGET: agreed time, token, tool, or retry ceiling
WATCH: manager wait, poll, recontact, or interrupt cadence
INSPECTION: inspect the artifact and re-run every runnable leaf gate
PROOF: current unlazy evidence plus manager re-verification
REPORT: APM WORK REPORT containing outputs, unfinished work, proof, changes, account, assumptions, risks, and manager decisions
```

The worker writes gates before implementation, inspects every command before approval, and returns the artifact with its gate ledger. The manager must not accept a checked box or old evidence as completion.

## Return Sequence

1. Worker returns the artifact, `GATES.md`, decisive output, and an APM work report including unfinished work and its norm-versus-actual account.
2. Manager moves the work unit from `IN-FLIGHT` to `VERIFYING`.
3. Manager reads every inherited check and script before execution.
4. Manager re-runs runnable gates with unlazy's `--reverify` mode when available.
5. Manager inspects manual gates and tries to refute consequential claims.
6. Manager records the result in `WHIPS.md`.
7. Manager marks `VERIFIED`, issues a specific `REWHIP`, discards, or abandons with a handoff.

## Boundary Rules

- `GATES.md` proving a leaf does not prove that sibling outputs compose.
- `WHIPS.md` tracking a unit does not prove the unit is correct.
- The manager owns cross-leaf interfaces and root regressions.
- APM `OWNS` and unlazy leases are coordination mechanisms, not security boundaries.
- Keep tightly coupled writes single-threaded unless paths and merge semantics are explicit.

This pairing is optional. APM can inspect proof produced by any worker, and unlazy can verify a leaf managed by any orchestrator. APM's bundled hooks apply unlazy-style early-stop prevention to the manager itself; they do not require every worker to load unlazy.
