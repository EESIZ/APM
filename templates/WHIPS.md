# WHIPS: <scope>

OBJECTIVE: <one sentence preserving the user's goal>
MANAGER: <responsible orchestrator>
INTEGRATION: <how verified units become one result>
STOP: <root completion condition>

- [ ] W1: <observable work unit>
  HANDLER: UNASSIGNED
  NEEDS: none
  OWNS: read-only
  INPUTS: <context, artifacts, and accepted decisions>
  OUTPUT: <artifact or response contract>
  INSPECTION: <what the manager will examine independently>
  PROOF: <commands, source evidence, or observable acceptance evidence>
  STATE: READY
  EVIDENCE: pending

- [ ] W2: <dependent work unit>
  HANDLER: UNASSIGNED
  NEEDS: W1
  OWNS: <repository-relative paths or read-only>
  INPUTS: <W1 output and other required context>
  OUTPUT: <artifact or response contract>
  INSPECTION: <what the manager will examine independently>
  PROOF: <commands, source evidence, or observable acceptance evidence>
  STATE: WAITING
  EVIDENCE: pending

## Integration

- [ ] ROOT: <observable integrated outcome>
  NEEDS: W1, W2
  INSPECTION: <interfaces, assumptions, end-to-end behavior, and regressions>
  PROOF: <root acceptance evidence>
  STATE: WAITING
  EVIDENCE: pending
