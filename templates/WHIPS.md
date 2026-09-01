# WHIPS: <scope>

OBJECTIVE: <one sentence preserving the user's goal>
MANAGER: <responsible orchestrator>
INTEGRATION: <how verified units become one result>
STOP: <root completion condition>
ENFORCEMENT: no downstream dispatch or integration before manager verification
AUDIT CADENCE: after every return and before every dependent dispatch

- [ ] W1: <observable work unit>
  HANDLER: UNASSIGNED
  NEEDS: none
  OWNS: read-only
  INPUTS: <context, artifacts, and accepted decisions>
  OUTPUT: <artifact or response contract>
  NORM: <expected quantity, quality, proof, and completion boundary>
  BUDGET: <time, tokens, calls, tools, or other limit>
  INSPECTION: <what the manager will examine independently>
  PROOF: <commands, source evidence, or observable acceptance evidence>
  DISPATCH: pending
  REPORT: pending
  ACCOUNT: pending
  STATE: READY
  EVIDENCE: pending

- [ ] W2: <dependent work unit>
  HANDLER: UNASSIGNED
  NEEDS: W1
  OWNS: <repository-relative paths or read-only>
  INPUTS: <W1 output and other required context>
  OUTPUT: <artifact or response contract>
  NORM: <expected quantity, quality, proof, and completion boundary>
  BUDGET: <time, tokens, calls, tools, or other limit>
  INSPECTION: <what the manager will examine independently>
  PROOF: <commands, source evidence, or observable acceptance evidence>
  DISPATCH: pending
  REPORT: pending
  ACCOUNT: pending
  STATE: WAITING
  EVIDENCE: pending

## Integration

- [ ] ROOT: <observable integrated outcome>
  NEEDS: W1, W2
  INSPECTION: <interfaces, assumptions, end-to-end behavior, and regressions>
  PROOF: <root acceptance evidence>
  STATE: WAITING
  EVIDENCE: pending
