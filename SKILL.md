---
name: a2a-manager-agent-orchestration
description: >-
  Use this skill whenever an agent may delegate, spawn, launch, assign, or
  coordinate worker agents, subagents, teammates, reviewers, or investigators;
  split one deliverable across several agents; run work in parallel; collect or
  merge delegated outputs; ask workers to report back; or recover a stalled
  multi-agent run. Trigger even when the request only mentions owners,
  responsibilities, parallel features, Task or team tools, or "have several
  agents handle this" without naming APM or orchestration. Enforce a closed
  manager loop with work contracts, report envelopes, evidence gates, state
  tracking, corrective redispatch, and verified integration. Keep a coherent
  task single-agent when delegation cannot repay its coordination cost.
hooks:
  PreToolUse:
    - matcher: "Agent|Task"
      hooks:
        - type: command
          command: 'node "${CLAUDE_SKILL_DIR}/scripts/manager-hook.mjs" pre-agent'
          timeout: 10
  SubagentStop:
    - hooks:
        - type: command
          command: 'node "${CLAUDE_SKILL_DIR}/scripts/manager-hook.mjs" subagent-stop'
          timeout: 10
  Stop:
    - hooks:
        - type: command
          command: 'node "${CLAUDE_SKILL_DIR}/scripts/manager-hook.mjs" stop'
          timeout: 20
---

# A2A Manager Agent Orchestration

Act as the accountable manager in an orchestrator-worker system. Preserve the user's objective, decide whether delegation is justified, assign bounded contracts, inspect proof, correct failed work, and integrate only compatible verified outputs.

Use this control loop:

```text
Reduce -> Measure -> Delegate -> Maintain -> Discipline
```

## Activation And Execution Rule

Activate this protocol before the first worker call whenever the current run will use one or more delegated agents. Do not wait for the user to say `APM`, `subagent`, or `orchestration`; ordinary phrases such as assigning owners, splitting features, launching workers, parallelizing investigations, collecting reports, or merging several agents' work are enough.

When agent tools are available and the user asked for execution, run the control loop. Do not stop after writing an `A2A Plan` or `WHIPS.md`. Create the ledger, dispatch the contracts, wait for returns, inspect evidence, issue corrections, and integrate the verified result.

When no agent tools are available, return a dispatch pack and state that enforcement has not executed. Never describe a plan as though workers were actually controlled.

The protocol is closed-loop:

- no worker call without a recorded work unit and a return contract in the worker prompt;
- no dependency unlock based only on dispatch, activity, or a worker's completion claim;
- no integration before manager-owned verification;
- no final completion while a required unit remains `READY`, `IN-FLIGHT`, `VERIFYING`, or `REWHIP`.

## The Manager Must Be Unlazy

APM applies completion discipline to the manager. Workers may use unlazy, but that is optional. The manager must continuously turn the ledger into runtime actions:

- `M-UNLOCK`: notice that dependencies cleared and ready the next unit;
- `M-DISPATCH`: send a complete contract instead of postponing or merely describing it;
- `M-WATCH`: wait, poll, recontact, or interrupt an in-flight handler at the recorded cadence;
- `M-AUDIT`: inspect returned artifacts and reproduce proof instead of trusting the report;
- `M-CORRECT`: issue `REWHIP`, revoke ownership, reassign, discard, or abandon with evidence;
- `M-INTEGRATE`: combine verified units and run root proof.

The bundled runtime hooks enforce this discipline while the skill is active:

1. `PreToolUse` denies an Agent dispatch without an active ledger and complete work-order/report envelope.
2. `SubagentStop` sends a worker back when its final message is not an accountable APM work report.
3. `Stop` prevents the manager from finishing while computed manager duties or invalid ledger state remain.

Run `node "${CLAUDE_SKILL_DIR}/scripts/whips-check.mjs" --status` whenever the next manager action is unclear. Hook decisions are recorded without prompt or worker-message content in `.apm/runtime.jsonl`; summarize actual dispatch gates, corrected returns, manager stop blocks, and verified completion with `node "${CLAUDE_SKILL_DIR}/scripts/runtime-report.mjs" --json`. The event log proves that enforcement ran, but does not replace artifact proof.

The manager Stop gate is strict by default. Do not retry termination to escape work. Resolve the next duty, or record an evidence-backed `DISCARDED`/`ABANDONED` disposition and handoff when completion is genuinely unwarranted or impossible. Persistent installation may explicitly opt into a six-unchanged-block emergency release with `--allow-emergency-release`.

For project-wide enforcement that also catches an Agent call before automatic skill activation, ask the user once for approval and run `node "${CLAUDE_SKILL_DIR}/scripts/install-hooks.mjs"`. Never install persistent hooks silently.

## Choose Architecture First

Default to one agent for a coherent task. Add a subagent only when at least one benefit is concrete:

- independent breadth-first search;
- specialized tools or expertise;
- a clean context window for a bounded investigation;
- independent review or adversarial verification;
- parallel work with disjoint writes and an explicit merge contract.

Do not create peer writer swarms for tightly coupled work. Coordination, context transfer, and integration consume attention even when tokens are cheap. If delegation has no observable benefit, continue directly and say why.

## Prime Directive

Keep the user's goal alive across every delegation. Subagents optimize the contract they receive, not the full conversation. Externalize the objective, constraints, relevant decisions, ownership, expected output, inspection method, and stop condition before dispatch.

The manager remains accountable for the final result. Never outsource judgment.

## The Five Operations

These are executable controls, not themes. Before each worker dispatch, the ledger must show how all five are being applied. If one is missing, the unit is not `READY`.

### 1. Reduce

Turn the objective into bounded, independently inspectable work units. Each unit needs an objective, scope, inputs, expected output, constraints, success criteria, dependencies, and stop condition.

Split at real domain, context, ownership, or verification boundaries. Do not manufacture agents to fill a desired count.

**Required control:** write a work census in `WHIPS.md`. Give every unit one observable output, one handler, one ownership lease, and explicit dependencies. A unit with overlapping writes, an unobservable output, or an unspecified stop condition remains `WAITING`; it is not dispatchable.

### 2. Measure

Define proof before dispatch. Prefer evidence that can be independently reproduced:

- exact artifacts and paths;
- commands, exit codes, and decisive output;
- source URLs and claim-level citations;
- reproduction steps and observed behavior;
- changed files and preserved interfaces;
- unresolved uncertainty and confidence boundaries.

Activity, confidence, token use, and a checked box are not proof by themselves.

**Required control:** set a `NORM` and `BUDGET` before work begins, then write an `ACCOUNT` after return. The norm states the expected quantity, quality, proof, and completion boundary. The account compares expected work with actual output, usage, unfinished work, and deviations. Return the worker to the account when its explanation and the artifacts disagree.

### 3. Delegate

Assign a contract, not a wish. Every contract states:

- the user's actual objective;
- the handler's narrow role;
- the minimum sufficient context and prior decisions;
- `OWNS` paths or read-only scope;
- required method and prohibited changes;
- output format and durable artifact path when applicable;
- inspection and proof requirements;
- active watch cadence and recontact condition;
- dependencies, budget, escalation condition, and stop condition.

Embed the complete [Worker Dispatch Envelope](#worker-dispatch-envelope) in every worker prompt. Skills and manager context are not assumed to propagate into a child agent. The dispatch itself must carry the objective, boundaries, proof requirement, and report schema.

Use parallel dispatch only when dependencies are satisfied and write ownership is disjoint. Treat `OWNS` as coordination, not filesystem isolation or a security boundary.

**Required control:** maintain one reporting hierarchy. Workers report to the manager; they do not silently redefine sibling contracts, certify their own output, or perform root integration. The manager is the sole authority that assigns ownership, changes dependencies, accepts proof, and integrates the final result.

### 4. Maintain

Keep the run coherent while workers execute:

- refresh missing context and propagate user changes;
- preserve decisions and intermediate artifacts outside chat history;
- watch dependencies, duplicate effort, ownership, time, and token budget;
- stop obsolete work and unblock newly ready units;
- keep the manager's context focused on goal, state, evidence, and integration.

After dispatch, use the runtime's wait, join, read, or follow-up mechanism to collect every required report. A launched worker is not a completed work unit. Persist enough state in `WHIPS.md` to resume the loop if the runtime returns control between stages.

**Required control:** preserve productive capacity. Supply each worker with current decisions, exact inputs, working tools, and a bounded budget. Require a report at completion, on blockage, before an out-of-scope decision, and at the stated budget threshold when the runtime permits checkpoints. Stop or replace a worker whose context is stale, contaminated, looping, or no longer aligned with the user's goal.

### 5. Discipline

Inspect outputs against the original contract:

- request missing evidence;
- reject unsupported completion claims;
- issue a focused `REWHIP` when a result is recoverable;
- reassign when a handler is stuck or its context is contaminated;
- discard work whose assumptions conflict with the accepted plan;
- quarantine useful but unverified claims;
- integrate only after independent verification.

Missing report fields, silent scope changes, unowned edits, or unsupported completion claims are protocol breaches. Keep dependent units blocked and issue a specific `REWHIP`; do not continue downstream while hoping the missing evidence will appear later.

**Required control:** apply a visible correction ladder. First hold the gate and demand the missing account or proof. Then issue a bounded `REWHIP`. On repeated failure, revoke the ownership lease and reassign with clean context. Discard incompatible output; abandon only with a recorded reason and handoff. The consequence is a state and ownership change, not another reminder to be careful.

The term `REWHIP` means a corrective agent dispatch recorded in the manager ledger.

## Five-Control Dispatch Gate

Before every worker call, answer these in the ledger:

```text
REDUCE: What exact unit, owner, boundary, and dependency is being dispatched?
MEASURE: What norm, budget, and reproducible proof will settle the account?
DELEGATE: What written order and reporting line bind the handler?
MAINTAIN: What context, tools, checkpoint, and replacement condition preserve capacity?
DISCIPLINE: What gate closes on failure, and what REWHIP, reassignment, or discard follows?
```

If any answer is missing, do not dispatch. Read [references/operational-controls.md](references/operational-controls.md) for the traceability map from the historical abstractions to these runtime controls.

## WHIPS Ledger

For substantial delegated work, create `WHIPS.md` from [templates/WHIPS.md](templates/WHIPS.md) before dispatch. Read [WHIPS.md](WHIPS.md) for the full contract.

```text
W - Work Unit: the bounded assignment and its dependency contract
H - Handler: the subagent and its ownership lease
I - Inspection: what the manager will independently examine
P - Proof: the evidence required for acceptance
S - State: the manager-owned lifecycle state
```

Use only these states:

```text
WAITING -> READY -> IN-FLIGHT -> VERIFYING -> VERIFIED
                                  |             |
                                  -> REWHIP ----+
                                  -> DISCARDED
Any active state -> ABANDONED with a reason and handoff
```

Only the manager changes a unit to `VERIFIED`, and only after checking current proof. A worker's self-report may move a unit to `VERIFYING`, never directly to `VERIFIED`.

## Closed Manager Loop

1. Restate the user's objective and non-negotiable constraints.
2. Decide whether one agent or orchestrator-worker execution is better.
3. If delegating, create `WHIPS.md` before the first worker call. Record units, dependencies, ownership, inspection, proof, and the expected report.
4. For each `READY` unit, place the full dispatch envelope in the worker prompt, record the call or session identity, then move it to `IN-FLIGHT`.
5. Wait for and collect worker reports. Do not treat worker launch, tool activity, or natural-language confidence as progress through the acceptance gate.
6. Validate the report schema. If required fields or evidence are missing, keep dependents blocked, record `REWHIP`, and send the corrective contract.
7. Move a conforming return to `VERIFYING`. Inspect the exact artifact and reproduce its decisive proof.
8. Mark the unit `VERIFIED`, `REWHIP`, `DISCARDED`, or `ABANDONED` with evidence and a reason owned by the manager.
9. Unlock a dependent unit only after every id in `NEEDS` is `VERIFIED`, then repeat dispatch, return, and inspection.
10. Integrate exact worker artifacts bottom-up. Resolve assumptions and interfaces explicitly, then run root-level proof.
11. Finish only when the root is verified or every unfinished unit has an explicit terminal disposition. Report unresolved conflicts, residual risk, and every discard or abandonment.

## Worker Dispatch Envelope

Put this entire envelope in every child-agent prompt. Do not reduce it to a role name and a task sentence.

```markdown
APM WORK ORDER: <unit id>
USER OBJECTIVE: <the user's preserved objective>
WORK UNIT: <one bounded assignment>
HANDLER ROLE: <narrow role>
NEEDS: <verified unit ids or none>
CONTEXT: <minimum context and accepted decisions>
OWNS: <exact paths or read-only scope>
DO NOT: <prohibited changes or none>
METHOD: <required method>
OUTPUT: <exact artifact or response>
INSPECTION: <manager-owned inspection>
PROOF: <reproducible acceptance evidence>
NORM: <quantity, quality, proof, and completion boundary>
BUDGET: <time, tokens, calls, or other limit>
WATCH: <wait, poll, recontact, or interrupt cadence>
REPORT WHEN: complete | blocked | before scope change | at budget threshold
ESCALATE IF: <condition requiring a manager decision>
STOP WHEN: <completion or evidenced blocker condition>

Return exactly this one report, with every value on one line:
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

The runtime gate requires every order field to be non-empty and checks the exact ledger values for `NEEDS`, `OWNS`, `OUTPUT`, `INSPECTION`, `PROOF`, `NORM`, `BUDGET`, and `WATCH`. A manager cannot weaken an approved contract while dispatching it.

For runtimes that support an acknowledgement round, require the worker to confirm the unit id, owned scope, and blockers before changing artifacts. For one-shot worker tools, the final report remains mandatory.

## Worker Return Protocol

Require every handler to return this shape in its tool result or message:

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

Reject malformed reports before evaluating their substantive claim. A `COMPLETE` report moves the unit only to `VERIFYING`. A `BLOCKED` or `PARTIAL` report must identify the blocker and the smallest manager action that can unblock it; otherwise issue `REWHIP` for a proper report.

Then inspect the artifact, not just the report. Prefer primary sources over summaries, reproducible commands over claims, and current evidence over inherited transcripts.

## Integration Rules

- Preserve provenance for every accepted claim and artifact.
- Treat disagreement as a verification task, not something to average away.
- Do not merge partial results whose assumptions or interfaces conflict.
- Re-run cross-unit tests after local checks pass.
- Keep one writer for tightly coupled artifacts unless ownership and merge semantics are explicit.
- Apply the worker's exact patch, commit, artifact, or cited finding before evaluating it. Do not silently reconstruct or paraphrase a returned implementation. If the manager changes it during integration, record that as a new integration change and re-run the worker-level proof plus root proof.
- Label useful but unverified material as unverified.
- Surface discarded and abandoned work in the final report when it affects scope or confidence.

## Failure Modes

- **Context amnesia:** a worker solves an older or narrower objective.
- **Contract gap:** the manager leaves scope, output, or proof undefined.
- **Parallel contradiction:** workers make incompatible implicit decisions.
- **Commitment failure:** a worker promises a path and silently takes another.
- **Expectation failure:** a worker reasons from an incorrect model of another unit.
- **Tool theater:** activity is presented as evidence.
- **Premature completion:** success is claimed without current verification.
- **Over-broad edits:** a worker changes unowned files or interfaces.
- **Citation laundering:** secondary summaries are presented as primary evidence.
- **Integration fog:** the manager concatenates outputs without resolving conflicts.
- **Orchestration excess:** a coherent task is split despite no measurable benefit.

When a failure appears, update `WHIPS.md`, tighten the contract, and re-inspect. Do not merely remind the worker to "be careful."

## Pair With unlazy

When a substantial worker has unlazy available, read [references/interoperability.md](references/interoperability.md). APM controls the manager's `WHIPS.md`; unlazy controls each worker's runnable `GATES.md`. The APM work order and return schema must still be present in the child prompt because worker-side skill activation is not guaranteed. The manager still re-verifies the leaf evidence before acceptance.

APM's manager-runtime Stop-hook progress guard and installer structure are adapted from unlazy under the MIT License. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). The borrowed mechanism is deliberately inverted: unlazy keeps a worker from declaring its own leaf complete too early; APM keeps the manager from ceasing supervision too early.

## Output Modes

### Live Manager Run

When the user asks to execute with workers and the runtime supports agent tools, create the ledger and carry the closed manager loop through dispatch, return, correction, verification, and integration. The final response is the verified result, not merely the plan.

### A2A Plan

Return the architecture decision, work units, dependencies, handlers, proof, merge strategy, and reasons delegation earns its cost.

### Dispatch Pack

Return ready-to-send contracts for every `READY` work unit.

### Manager Audit

Audit goal preservation, architecture choice, contracts, context, evidence, ownership, state transitions, integration, and failure modes. Produce corrective `REWHIP` instructions where needed.

### Final Integration Report

Report verified outcomes, proof reproduced by the manager, conflicts resolved, discarded or abandoned work, residual risks, and remaining decisions.

## Research Routing

If the user asks whether multi-agent execution is justified or requests the evidence behind this protocol, read [references/research.md](references/research.md). Do not claim that APM proves multi-agent superiority or that lower token prices remove coordination costs.
