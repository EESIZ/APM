---
name: a2a-manager-agent-orchestration
description: Use this skill whenever Claude is acting as a manager, coordinator, supervisor, planner, or controller of subordinate agents in an A2A, multi-agent, agent-to-agent, subagent, swarm, manager-agent, orchestrator-executor, or delegated-agent workflow. This skill uses the "reduction -> measurement -> delegation -> maintenance -> discipline" control loop as an operating protocol for agent orchestration: decompose work, assign contracts, preserve context, monitor progress, verify outputs, reassign failures, and report results.
---

# A2A Manager Agent Orchestration

Use this skill when you are the managing agent in a multi-agent workflow. Your job is not to "trust the swarm"; your job is to preserve the user's intent, divide work into clear contracts, keep subagents supplied with context, measure progress against evidence, and integrate the results into one coherent outcome.

This skill borrows the abstract control grammar:

> Reduce -> Measure -> Delegate -> Maintain -> Discipline

Apply it to agent tasks, context, tools, budgets, outputs, and verification state. Treat it as a control protocol for distributed reasoning and execution.

## Prime Directive

Keep the user's goal alive across every delegation.

Subagents tend to optimize the prompt they see, not the full project context. The manager agent must therefore externalize intent, scope, constraints, success criteria, and verification methods before dispatching work.

## The Five Operations

### 1. Reduce

Convert the user's goal into bounded work units.

For each unit, define:

- Objective
- Scope
- Inputs
- Expected outputs
- Constraints
- Success criteria
- Stop condition

Good reduction makes subagent work independently verifiable. Avoid vague tasks like "research this" or "fix the bug" unless paired with concrete outputs.

### 2. Measure

Define what evidence proves the task is moving or done.

Use measurable signals such as:

- Files changed
- Tests run
- Logs inspected
- Sources consulted
- Hypotheses eliminated
- Reproduction steps confirmed
- Output artifacts created
- Confidence level and remaining uncertainty

Measurements are not vanity metrics. They exist so the manager can decide whether to continue, redirect, merge, or discard the subagent's work.

### 3. Delegate

Assign each subagent a contract, not a wish.

Every delegation prompt should include:

- The user's real objective
- The subagent's narrow role
- What context it may assume
- What it must inspect before acting
- What it must not change
- Output format
- Verification requirement
- Escalation condition

Prefer smaller, parallel tasks when outputs can be independently merged. Use serial delegation when one result changes the next agent's inputs.

### 4. Maintain

Keep subagents productive by feeding them context and constraints.

Maintenance means:

- Refreshing lost context
- Clarifying ambiguous scope
- Supplying file paths, schemas, examples, and prior decisions
- Watching token/time budget
- Preventing duplicated work
- Updating agents when the user changes direction
- Preserving intermediate artifacts

For subagents, "maintenance" is context and resource management.

### 5. Discipline

Enforce task contracts through verification, correction, and termination.

Discipline means:

- Ask for evidence when claims are unsupported
- Reject outputs that do not meet the contract
- Re-prompt with tighter instructions when drift is recoverable
- Reassign to another agent when the approach is stuck
- Stop a subagent when the task is obsolete
- Quarantine speculative or unverified conclusions
- Integrate only work that passes validation

The manager agent is accountable for the final answer. Never outsource judgment.

## Manager Loop

Use this loop for substantial A2A work:

1. Restate the user's objective in one sentence.
2. Split the objective into 2-6 subagent contracts.
3. For each contract, define output and verification.
4. Dispatch agents in parallel only when their work does not depend on each other.
5. Monitor for completion, blocker, drift, and duplicate effort.
6. Verify each result against evidence.
7. Merge compatible results.
8. Resolve conflicts explicitly.
9. Produce a final integrated answer or artifact.
10. Record residual risk, skipped verification, and recommended next actions.

## Delegation Prompt Template

Use or adapt this template when creating a subagent task:

```markdown
You are a subordinate agent in an A2A workflow.

User objective:
[one sentence preserving the user's actual goal]

Your role:
[specific bounded role]

Scope:
[what to inspect/do]

Do not:
[files/actions/assumptions to avoid]

Required method:
[repo search, source verification, tests, screenshots, comparison, etc.]

Expected output:
[bullets, patch, report, table, artifact path, etc.]

Verification:
[commands run, evidence gathered, citations, line references, confidence]

Escalate if:
[blockers, missing inputs, destructive action needed, uncertainty threshold]
```

## Subagent Status Schema

When reading or requesting status, prefer this compact format:

```markdown
Status: pending | running | blocked | complete | discarded
Objective:
Evidence:
Outputs:
Risks:
Needs manager decision:
```

## Integration Rules

When multiple subagents return results:

- Prefer evidence over confidence.
- Prefer primary sources over summaries.
- Prefer reproducible commands over claims.
- Treat disagreements as signals, not noise.
- Keep provenance: know which agent produced which result.
- Do not merge two partial answers if their assumptions conflict.
- If a result is useful but unverified, label it as unverified.

## Failure Modes

Watch for these common A2A failures:

- **Context amnesia**: a subagent solves a narrower or older version of the goal.
- **Parallel contradiction**: agents make incompatible assumptions.
- **Tool theater**: lots of activity, little evidence.
- **Premature completion**: a subagent reports success without validation.
- **Over-broad edits**: a coding subagent changes unrelated files.
- **Citation laundering**: a research subagent cites secondary summaries as if primary.
- **Integration fog**: the manager pastes outputs together without resolving conflicts.

When these appear, tighten the contract and re-verify.

## Hyper-Waterfall Mapping

This skill pairs naturally with a Hyper-Waterfall workflow:

- Plan: manager writes the macro objective and task contracts.
- Design: agents inspect context and propose bounded approaches.
- Implement: agents execute narrow units quickly.
- Verify: manager demands tests, citations, screenshots, or artifacts.
- Report: manager writes the final integrated result and preserves decisions.

The manager controls direction. Subagents provide speed.

## Output Modes

### A2A Plan

Use when the user asks how to organize agents:

```markdown
**A2A Plan**
Objective:

Agents:
1. [Role] - [contract] - [verification]
2. [Role] - [contract] - [verification]

Merge strategy:
Risks:
```

### Dispatch Pack

Use when the user wants prompts to send to subagents. Provide ready-to-copy subagent prompts using the delegation template.

### Manager Audit

Use when reviewing an existing multi-agent run:

```markdown
**Manager Audit**
Goal preservation:
Delegation quality:
Evidence quality:
Integration quality:
Failure modes:
Corrections:
```

### Final Integration Report

Use after subagents finish:

```markdown
**Integrated Result**
What changed / what was found:
Evidence:
Conflicts resolved:
Verification:
Residual risks:
Next actions:
```
