---
name: a2a-manager-agent-orchestration
description: >-
  Use this skill at the start of every tool-using execution task whenever Agent,
  Task, teammate, subagent, or equivalent worker tools are available to the
  current agent. Treat access to this manager-only skill as assignment to the
  manager role unless a bounded worker contract explicitly marks this agent as
  a leaf. Trigger before planning, TaskCreate, repository
  inspection, research, edits, tests, or artifact production even when the
  request never mentions delegation, APM, agents, parallelism, or long-running
  work, and even when the task appears small or coherent. Once active, the
  manager must not perform leaf work or choose single-agent execution: preserve
  the mission and system map in WHIPS.md, delegate execution, verification, and
  integration through bounded worker contexts, supervise returns, and retain
  acceptance authority. Do not trigger for answer-only conversation or when no
  worker-agent mechanism exists.
hooks:
  PreToolUse:
    - matcher: "^(Agent|Task)$"
      hooks:
        - type: command
          command: 'node "${CLAUDE_SKILL_DIR}/scripts/manager-hook.mjs" pre-agent'
          timeout: 10
    - matcher: "^(Bash|Shell|Read|Write|Edit|MultiEdit|NotebookEdit|Glob|Grep|WebFetch|WebSearch|TaskCreate|TaskGet|TaskUpdate|TaskList|TodoWrite|TeamCreate|TeamDelete)$"
      hooks:
        - type: command
          command: 'node "${CLAUDE_SKILL_DIR}/scripts/manager-hook.mjs" pre-manager-tool'
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

Act as the non-executing control plane in an orchestrator-worker system. Preserve the user's mission and whole-system structure, assign bounded contracts, govern worker context, commission independent verification, correct failed work, and retain final acceptance authority.

Use this control loop:

```text
Reduce -> Measure -> Delegate -> Maintain -> Discipline
```

## Activation And Execution Rule

Activate this protocol before planning with `TaskCreate`, inspecting a repository, researching, editing, testing, or producing an artifact. The trigger is an execution request plus an available worker-agent mechanism. Because APM is manager-only, its availability assigns the current agent to the manager role unless the current prompt is an explicit bounded leaf contract. Delegation vocabulary or a `lead` label in the user's request is not required.

Once APM is active, delegation is not an architecture choice. The manager must use workers for every leaf action, including discovery, implementation, testing, verification, and root integration. Apparent simplicity is not an exception: the eventual run length and context growth cannot be reliably known before execution.

When agent tools are available and the user asked for execution, run the control loop. Do not stop after writing an `A2A Plan` or `WHIPS.md`. Create the ledger, dispatch the contracts, wait for bounded returns, commission verification, issue corrections, dispatch root integration, and decide whether the verified result satisfies the mission.

When no agent tools are available, return a dispatch pack and state that enforcement has not executed. Never describe a plan as though workers were actually controlled.

The protocol is closed-loop:

- no worker call without a recorded work unit and a return contract in the worker prompt;
- no dependency unlock based only on dispatch, activity, or a worker's completion claim;
- no verification by the worker that produced the artifact;
- no integration by the manager;
- no final completion while a required unit remains `READY`, `IN-FLIGHT`, `VERIFYING`, or `REWHIP`.

## The Manager Must Be Unlazy

APM applies completion discipline to the manager. Workers may use unlazy, but that is optional. The manager must continuously turn the ledger into runtime actions:

- `M-UNLOCK`: notice that dependencies cleared and ready the next unit;
- `M-DISPATCH`: send a complete contract instead of postponing or merely describing it;
- `M-WATCH`: wait, poll, recontact, or interrupt an in-flight handler at the recorded cadence;
- `M-VERIFY`: dispatch a fresh verifier with bounded context instead of reading leaf artifacts or trusting the producer;
- `M-DECIDE`: accept only an independent `PASS`, or correct, reassign, discard, or abandon;
- `M-CORRECT`: issue `REWHIP`, revoke ownership, reassign, discard, or abandon with evidence;
- `M-INTEGRATE`: dispatch the `ROOT` integration worker and then a different root verifier.

The bundled runtime hooks enforce this discipline while the skill is active:

1. `PreToolUse` denies an Agent dispatch without an active ledger, then expands a one-line `APM DISPATCH: <unit>` or `APM VERIFY: <unit>` request into the canonical work-order/report envelope stored in the ledger. Incomplete, duplicated, or drifted envelopes are replaced with ledger values instead of entering a formatting retry loop.
2. `PreToolUse` denies manager use of leaf exploration and execution tools while allowing those tools inside dispatched workers; only WHIPS control files, APM status commands, and ledger-backed task/team controls remain directly available to the manager.
3. `SubagentStop` sends a worker or verifier back when its final message is not an accountable bounded report.
4. `Stop` prevents the manager from finishing while computed manager duties or invalid ledger state remain. Once an execution tool has been attempted, the manager also cannot stop before creating an active ledger.

Run `node "${CLAUDE_SKILL_DIR}/scripts/whips-check.mjs" --status` whenever the next manager action is unclear. Hook decisions are recorded without prompt or worker-message content in `.apm/runtime.jsonl`; summarize actual dispatch gates, corrected returns, manager stop blocks, and verified completion with `node "${CLAUDE_SKILL_DIR}/scripts/runtime-report.mjs" --json`. The event log proves that enforcement ran, but does not replace artifact proof.

The manager Stop gate is strict by default. Do not retry termination to escape work. Resolve the next duty, or record an evidence-backed `DISCARDED`/`ABANDONED` disposition and handoff when completion is genuinely unwarranted or impossible. Persistent installation may explicitly opt into a six-unchanged-block emergency release with `--allow-emergency-release`.

For project-wide enforcement that also catches an Agent call before automatic skill activation, ask the user once for approval and run `node "${CLAUDE_SKILL_DIR}/scripts/install-hooks.mjs"`. Never install persistent hooks silently.

## The Manager Is An Overseer

Use this command pyramid:

```text
User: sets the mission, constraints, and completion authority
  -> Manager: retains the blueprint, work map, state, budgets, and judgments
       -> Workers: discover, implement, test, verify, and integrate bounded units
```

The manager never becomes a spare worker. It must not inspect full source trees, search the web, edit implementation artifacts, debug, run leaf tests, rewrite worker patches, or perform root integration. It may read and update `WHIPS.md`, consume bounded reports, invoke APM control scripts, dispatch and supervise agents, and make state and acceptance decisions.

Keep one writer for tightly coupled artifacts and serialize dependencies when necessary. Mandatory delegation does not mean mandatory parallelism or a peer swarm. A one-unit task still uses one worker, one independent verifier, and the manager's acceptance gate.

## Manager Context Constitution

Before the first dispatch, externalize these durable fields in `WHIPS.md`. Use the project-root `WHIPS.md`, the sibling `shared/WHIPS.md` used by team harnesses, or an explicit `APM_WHIPS_PATH`:

- `MISSION`: the user's actual desired outcome;
- `NON-NEGOTIABLES`: constraints that may not drift;
- `SYSTEM MAP`: the whole structure and current work decomposition;
- `DECISIONS`: accepted architectural and policy decisions;
- `CONTEXT POLICY`: what the manager may retain and what must remain in worker contexts.

Re-read this constitution before every dispatch, state transition, correction, and final decision. The manager context contains the constitution, ledger state, dependencies, budgets, and bounded reports. Raw source, long logs, exploratory transcripts, implementation details, and test output belong to disposable worker contexts.

Every work unit declares `CONTEXT LIMIT`, `RETURN LIMIT`, and `REPLACE WHEN`. Give the worker only the smallest context slice needed for its unit. Replace the worker when it reaches the limit, compacts away critical inputs, loops, becomes stale, or crosses its ownership boundary. A replacement receives the durable contract and artifacts, not the predecessor's entire transcript.

## Prime Directive

Keep the user's goal alive across every delegation. Subagents optimize the contract they receive, not the full conversation. Externalize the mission, constraints, system map, relevant decisions, ownership, expected output, inspection method, context limits, and stop condition before dispatch.

The manager remains accountable for the final result. Delegate execution and evidence production; never outsource judgment.

## The Five Operations

These are executable controls, not themes. Before each worker dispatch, the ledger must show how all five are being applied. If one is missing, the unit is not `READY`.

### 1. Reduce

Turn the objective into bounded, independently inspectable work units. Each unit needs an objective, scope, inputs, expected output, constraints, success criteria, dependencies, and stop condition.

Split at real domain, context, ownership, or verification boundaries. A small task may remain one work unit, but that unit is still executed outside the manager context.

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

**Required control:** set a `NORM`, `BUDGET`, `CONTEXT LIMIT`, and `RETURN LIMIT` before work begins, then require an `ACCOUNT` and `CONTEXT ACCOUNT` after return. The norm states the expected quantity, quality, proof, and completion boundary. The accounts compare expected work with actual output, usage, context exposure, unfinished work, and deviations. Return the worker to the account when its explanation and the artifacts disagree.

### 3. Delegate

Assign a contract, not a wish. Every contract states:

- the user's actual objective;
- the handler's narrow role;
- the minimum sufficient context and prior decisions;
- the worker context ceiling, bounded return size, and replacement condition;
- `OWNS` paths or read-only scope;
- required method and prohibited changes;
- output format and durable artifact path when applicable;
- inspection and proof requirements;
- active watch cadence and recontact condition;
- dependencies, budget, escalation condition, and stop condition.

Every child must receive the complete [Worker Dispatch Envelope](#worker-dispatch-envelope). Skills and manager context are not assumed to propagate into a child agent. With the runtime hook active, dispatch using only `APM DISPATCH: <unit id>`; the hook generates the complete prompt from the active ledger. Without hook support, render and send the full envelope manually.

Use parallel dispatch only when dependencies are satisfied and write ownership is disjoint. Treat `OWNS` as coordination, not filesystem isolation or a security boundary.

**Required control:** maintain one reporting hierarchy. Workers report to the manager; they do not silently redefine sibling contracts or certify their own output. A designated `ROOT` worker performs integration. The manager is the sole authority that assigns ownership, changes dependencies, accepts independent proof, and declares the final result accepted.

### 4. Maintain

Keep the run coherent while workers execute:

- refresh missing context and propagate user changes;
- preserve decisions and intermediate artifacts outside chat history;
- watch dependencies, duplicate effort, ownership, time, and token budget;
- stop obsolete work and unblock newly ready units;
- keep the manager's context limited to the mission constitution, state, budgets, and bounded evidence summaries.

After dispatch, use the runtime's wait, join, read, or follow-up mechanism to collect every required report. A launched worker is not a completed work unit. Persist enough state in `WHIPS.md` to resume the loop if the runtime returns control between stages.

**Required control:** preserve productive capacity. Supply each worker with current decisions, exact inputs, working tools, and bounded time, call, token, and return budgets. Require a context account at completion, on blockage, before an out-of-scope decision, and at the stated budget threshold when the runtime permits checkpoints. Stop or replace a worker whose context is stale, contaminated, compacted past critical inputs, looping, or no longer aligned with the user's goal.

### 5. Discipline

Judge outputs against the original contract through an independent verifier:

- request missing evidence;
- reject unsupported completion claims;
- issue a focused `REWHIP` when a result is recoverable;
- reassign when a handler is stuck or its context is contaminated;
- discard work whose assumptions conflict with the accepted plan;
- quarantine useful but unverified claims;
- dispatch a verifier different from the producing handler;
- dispatch root integration only after every dependency has independent `PASS` evidence.

Missing report fields, silent scope changes, unowned edits, or unsupported completion claims are protocol breaches. Keep dependent units blocked and issue a specific `REWHIP`; do not continue downstream while hoping the missing evidence will appear later.

**Required control:** apply a visible correction ladder. First hold the gate and demand the missing account or proof. Then issue a bounded `REWHIP`. On repeated failure, revoke the ownership lease and reassign with clean context. Discard incompatible output; abandon only with a recorded reason and handoff. The consequence is a state and ownership change, not another reminder to be careful.

The term `REWHIP` means a corrective agent dispatch recorded in the manager ledger.

## Five-Control Dispatch Gate

Before every worker call, answer these in the ledger:

```text
REDUCE: What exact unit, owner, boundary, and dependency is being dispatched?
MEASURE: What norm, resource budget, context limit, return limit, and reproducible proof will settle the account?
DELEGATE: What written order and reporting line bind the handler?
MAINTAIN: What minimal context slice, tools, checkpoint, and replacement condition preserve capacity without entering manager context?
DISCIPLINE: What gate closes on failure, and what REWHIP, reassignment, or discard follows?
```

If any answer is missing, do not dispatch. Read [references/operational-controls.md](references/operational-controls.md) for the traceability map from the historical abstractions to these runtime controls.

## WHIPS Ledger

For substantial delegated work, create `WHIPS.md` from [templates/WHIPS.md](templates/WHIPS.md) before dispatch. Read [WHIPS.md](WHIPS.md) for the full contract.

```text
W - Work Unit: the bounded assignment and its dependency contract
H - Handler: the producer and its ownership lease
I - Inspection: what a fresh verifier must independently examine
P - Proof: the bounded evidence required for manager acceptance
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

Only the manager changes a unit to `VERIFIED`, and only after a different verifier returns current `PASS` evidence. A producer's self-report may move a unit to `VERIFYING`, never directly to `VERIFIED`.

## Closed Manager Loop

1. Write the mission constitution: objective, non-negotiables, system map, accepted decisions, and context policy.
2. Create `WHIPS.md` before any repository inspection or leaf action. Record producer, verifier, context limits, dependencies, ownership, proof, and both return contracts.
3. For each `READY` unit, call the worker with `APM DISPATCH: <unit id>`. The hook expands the canonical envelope from `WHIPS.md`; record the call or session identity, then move it to `IN-FLIGHT`.
4. Wait for and collect a bounded work report. Do not ingest the worker transcript or treat launch, activity, or confidence as acceptance evidence.
5. Validate `ACCOUNT` and `CONTEXT ACCOUNT`. If required fields or evidence are missing, keep dependents blocked, record `REWHIP`, and send a corrective contract or replace the context.
6. Move a conforming return to `VERIFYING`, then call a fresh verifier with `APM VERIFY: <unit id>`. The hook expands the verification envelope, and the verifier must be different from the producer.
7. Accept only a conforming `APM VERIFY REPORT` with `VERDICT: PASS`. Otherwise issue `REWHIP`, replace, reassign, discard, or abandon.
8. Mark the unit `VERIFIED` only with bounded `PASS` evidence and a manager-owned reason.
9. Unlock a dependent unit only after every id in `NEEDS` is `VERIFIED`.
10. Dispatch `ROOT` to a dedicated integration worker after all dependencies verify, then dispatch a different root verifier.
11. Finish only when `ROOT` is `VERIFIED` or explicitly `ABANDONED`. Report unresolved conflicts, residual risk, and every discard or abandonment.

## Worker Dispatch Envelope

This is the canonical envelope the runtime generates from `WHIPS.md`. Prefer the one-line `APM DISPATCH: <unit id>` interface so the manager does not hand-author or duplicate fields. If hooks are unavailable, put this entire envelope in the child-agent prompt.

```markdown
APM WORK ORDER: <unit id>
USER OBJECTIVE: <the user's preserved objective>
WORK UNIT: <one bounded assignment>
HANDLER ROLE: <narrow role>
NEEDS: <verified unit ids or none>
CONTEXT: <minimum context and accepted decisions>
CONTEXT LIMIT: <maximum input tokens and worker tool calls>
RETURN LIMIT: <integer chars>
REPLACE WHEN: <context, loop, staleness, or scope threshold>
OWNS: <exact paths or read-only scope>
DO NOT: <prohibited changes or none>
METHOD: <required method>
OUTPUT: <exact artifact or response>
INSPECTION: <contract-bound inspection for a fresh verifier>
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
CONTEXT ACCOUNT: <context supplied, tool calls used, compaction or limit status>
ASSUMPTIONS: <remaining assumptions or none>
RISKS: <residual risks or none>
MANAGER DECISION: <specific decision needed or none>
```

The runtime gate requires every order field to be non-empty and binds mission, handler, context, limits, replacement condition, ownership, output, inspection, proof, norm, budget, and watch cadence to `WHIPS.md`. Missing, duplicated, or weakened fields are replaced with the canonical ledger values. An unknown unit or invalid lifecycle state remains blocked, with a complete valid envelope included in the rejection.

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
CONTEXT ACCOUNT: <context supplied, tool calls used, compaction or limit status>
ASSUMPTIONS: <remaining assumptions or none>
RISKS: <residual risks or none>
MANAGER DECISION: <specific decision needed or none>
```

Reject malformed reports before evaluating their substantive claim. A `COMPLETE` report moves the unit only to `VERIFYING`. A `BLOCKED` or `PARTIAL` report must identify the blocker and the smallest manager action that can unblock it; otherwise issue `REWHIP` for a proper report.

Then dispatch the independent verifier. The manager reads its bounded report, not the leaf artifact or transcript.

## Independent Verification Envelope

After a producer return reaches `VERIFYING`, prefer `APM VERIFY: <unit id>`. The runtime generates this complete envelope for a fresh verifier; use it manually only where hooks are unavailable:

```markdown
APM VERIFY ORDER: <unit id>
USER OBJECTIVE: <the preserved mission>
VERIFY UNIT: <the exact work-unit title>
VERIFIER ROLE: <a verifier different from HANDLER>
CONTEXT: <bounded verification inputs and accepted decisions>
ARTIFACTS: <exact returned artifacts>
INSPECTION: <contract-bound inspection>
PROOF: <contract-bound reproducible proof>
CONTEXT LIMIT: <maximum input tokens and verifier tool calls>
RETURN LIMIT: <integer chars>
STOP WHEN: decisive checks finish or an evidenced blocker is found

Return exactly this one report, with every value on one line:
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

The producer cannot be its own verifier. `PASS` requires `GAPS: none`. A failed or blocked verification keeps dependencies closed and gives the manager a correction decision; it never becomes a prose warning attached to accepted work.

## Integration Rules

- Preserve provenance for every accepted claim and artifact.
- Treat disagreement as a verification task, not something to average away.
- Do not merge partial results whose assumptions or interfaces conflict.
- Re-run cross-unit tests after local checks pass.
- Keep one writer for tightly coupled artifacts unless ownership and merge semantics are explicit.
- Give the `ROOT` integrator exact verified patches, commits, artifacts, or cited findings. The manager must not reconstruct, paraphrase, or rewrite them.
- Use a root verifier different from the root integrator and expose only its bounded report to the manager.
- Label useful but unverified material as unverified.
- Surface discarded and abandoned work in the final report when it affects scope or confidence.

## Failure Modes

- **Context amnesia:** a worker solves an older or narrower objective.
- **Manager context leakage:** raw source, logs, or implementation transcripts enter the control-plane context.
- **Role collapse:** the manager performs a leaf action because it appears faster than dispatch.
- **Context overrun:** a worker exceeds its context or return limit without replacement.
- **Contract gap:** the manager leaves scope, output, or proof undefined.
- **Parallel contradiction:** workers make incompatible implicit decisions.
- **Commitment failure:** a worker promises a path and silently takes another.
- **Expectation failure:** a worker reasons from an incorrect model of another unit.
- **Tool theater:** activity is presented as evidence.
- **Premature completion:** success is claimed without current verification.
- **Over-broad edits:** a worker changes unowned files or interfaces.
- **Citation laundering:** secondary summaries are presented as primary evidence.
- **Integration fog:** the root integrator combines outputs without resolving conflicts.

When a failure appears, update `WHIPS.md`, tighten the contract, and commission fresh verification. Do not merely remind the worker to "be careful."

## Pair With unlazy

When a substantial worker has unlazy available, read [references/interoperability.md](references/interoperability.md). APM controls the manager's `WHIPS.md`; unlazy controls each worker's runnable `GATES.md`. The APM work order and return schema must still be present in the child prompt because worker-side skill activation is not guaranteed. A fresh APM verifier still checks the leaf evidence before manager acceptance.

APM's manager-runtime Stop-hook progress guard and installer structure are adapted from unlazy under the MIT License. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). The borrowed mechanism is deliberately inverted: unlazy keeps a worker from declaring its own leaf complete too early; APM keeps the manager from ceasing supervision too early.

## Output Modes

### Live Manager Run

When the user asks the lead to execute and the runtime supports agent tools, create the ledger and carry the closed manager loop through producer dispatch, bounded return, independent verification, correction, delegated root integration, and root verification. The final response is the manager's acceptance decision, not merely the plan.

### A2A Plan

Return the mission constitution, work units, dependencies, producers, verifiers, context limits, proof, and delegated root-integration strategy.

### Dispatch Pack

Return ready-to-send contracts for every `READY` work unit.

### Manager Audit

Audit mission preservation, role separation, contracts, context limits, evidence, ownership, state transitions, integration, and failure modes. Produce corrective `REWHIP` instructions where needed.

### Final Integration Report

Report verified outcomes, independent proof accepted by the manager, conflicts resolved, discarded or abandoned work, residual risks, and remaining decisions.

## Research Routing

If the user asks whether multi-agent execution is justified or requests the evidence behind this protocol, read [references/research.md](references/research.md). Do not claim that APM proves multi-agent superiority or that lower token prices remove coordination costs.
