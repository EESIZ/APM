# WHIPS: <scope>

MISSION: <one sentence preserving the user's desired outcome>
NON-NEGOTIABLES: <constraints that may not drift>
SYSTEM MAP: <whole-system structure, work units, and dependencies>
DECISIONS: <accepted architecture and policy decisions>
MANAGER: <responsible non-executing orchestrator>
CONTEXT POLICY: manager retains only this constitution, ledger state, budgets, and bounded reports
STOP: ROOT is VERIFIED or explicitly ABANDONED with a reason and handoff
ENFORCEMENT: manager performs no leaf work; every producer has a different verifier
AUDIT CADENCE: after every return and before every dependent dispatch
RUNTIME LOG: .apm/runtime.jsonl

- [ ] W1: <observable work unit>
  HANDLER: UNASSIGNED
  VERIFIER: UNASSIGNED
  NEEDS: none
  OWNS: read-only
  INPUTS: <minimum context, artifacts, and accepted decisions>
  CONTEXT LIMIT: <maximum input tokens and tool calls>
  RETURN LIMIT: <integer chars>
  REPLACE WHEN: <compaction, loop, staleness, scope, or context threshold>
  OUTPUT: <artifact or response contract>
  NORM: <expected quantity, quality, proof, and completion boundary>
  BUDGET: <time, tokens, calls, tools, or other limit>
  WATCH: <wait, poll, recontact, or interrupt cadence>
  INSPECTION: <what the fresh verifier will inspect>
  PROOF: <commands, source evidence, or observable acceptance evidence>
  VERIFY INPUTS: <bounded artifact paths and decisions for the verifier>
  DISPATCH: pending
  REPORT: pending
  ACCOUNT: pending
  VERIFY DISPATCH: pending
  VERIFY REPORT: pending
  STATE: READY
  EVIDENCE: pending

- [ ] W2: <dependent work unit>
  HANDLER: UNASSIGNED
  VERIFIER: UNASSIGNED
  NEEDS: W1
  OWNS: <repository-relative paths or read-only>
  INPUTS: <minimum W1 outputs and other required context>
  CONTEXT LIMIT: <maximum input tokens and tool calls>
  RETURN LIMIT: <integer chars>
  REPLACE WHEN: <compaction, loop, staleness, scope, or context threshold>
  OUTPUT: <artifact or response contract>
  NORM: <expected quantity, quality, proof, and completion boundary>
  BUDGET: <time, tokens, calls, tools, or other limit>
  WATCH: <wait, poll, recontact, or interrupt cadence>
  INSPECTION: <what the fresh verifier will inspect>
  PROOF: <commands, source evidence, or observable acceptance evidence>
  VERIFY INPUTS: <bounded artifact paths and decisions for the verifier>
  DISPATCH: pending
  REPORT: pending
  ACCOUNT: pending
  VERIFY DISPATCH: pending
  VERIFY REPORT: pending
  STATE: WAITING
  EVIDENCE: pending

## Integration

- [ ] ROOT: <observable integrated outcome>
  HANDLER: <integration worker different from the manager>
  VERIFIER: <root verifier different from the integration worker>
  NEEDS: W1, W2
  OWNS: <integration paths or read-only>
  INPUTS: <exact verified artifacts and accepted decisions>
  CONTEXT LIMIT: <maximum input tokens and tool calls>
  RETURN LIMIT: <integer chars>
  REPLACE WHEN: <compaction, loop, staleness, scope, or context threshold>
  OUTPUT: <integrated artifact or response>
  NORM: <root completion boundary>
  BUDGET: <time, tokens, calls, tools, or other limit>
  WATCH: <wait, poll, recontact, or interrupt cadence>
  INSPECTION: <interfaces, assumptions, end-to-end behavior, and regressions>
  PROOF: <root acceptance evidence>
  VERIFY INPUTS: <bounded integrated artifacts and root requirements>
  DISPATCH: pending
  REPORT: pending
  ACCOUNT: pending
  VERIFY DISPATCH: pending
  VERIFY REPORT: pending
  STATE: WAITING
  EVIDENCE: pending
