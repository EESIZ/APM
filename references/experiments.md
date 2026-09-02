# Experimental Lineage And Falsified Designs

APM changed direction because its experiments separated several claims that earlier releases had collapsed.

## What The Prompt Experiments Supported

When APM instructions were injected directly into short management scenarios, manager-response scores improved in two environments:

| Environment | No skill | APM injected | Difference |
| --- | ---: | ---: | ---: |
| Codex CLI / GPT-5.4-mini | 104/144 | 130/144 | +18.1 percentage points |
| Claude Code / Sonnet reproduction | 106/144 | 130/144 | +16.7 percentage points |

This supports a narrow claim: explicit contracts, evidence, ownership, and failure handling can improve answers to management scenarios. It does not show automatic skill activation or end-to-end project productivity.

## What Installation Did Not Support

Across Sonnet 4.5, an isolated Sonnet run, Haiku, SWE-Chain, and ProjDevBench, a listed but unforced APM skill was invoked zero times. ProjDevBench reached 96 assistant turns and approximately 4.81 million tokens without activation.

The result was model-independent in the observed runs. It also showed that project size does not create manager framing when the task prompt presents the agent as the direct executor.

## v3: Triggering Without Operability

v3 widened activation and used hooks to block manager leaf tools. It forced skill loading, then deadlocked:

- 96 dispatch attempts were blocked;
- a strict natural-language contract parser demanded exact field values;
- the manager received rules but not the expected canonical values;
- the run ended without producing either requested feature.

Lesson: deterministic activation is not useful when the enforcement language is harder to satisfy than the project.

## v4: Operability Without Restraint

v4 generated a canonical contract automatically and removed the formatting deadlock. On the same small two-feature Haiku task:

| Condition | Score | Time | Cost | Tokens |
| --- | ---: | ---: | ---: | ---: |
| Single session | 2/2 | 3.1 minutes | $0.12 | 1.26 million |
| v4 forced team | 1/2 | 45.4 minutes | $4.24 | 45.82 million |

The v4 manager summoned 62 workers. Cost rose 35 times, time 15 times, and tokens 36 times while integration still lost one feature. The manager could not inspect worker artifacts, and both team runs ended with identical merged patches that discarded member work.

Lesson: forcing delegation, forbidding bounded inspection, and optimizing control activity can reduce output.

## Why The Test Was Also Too Small

The final task took a single session about three minutes. It could reveal orchestration overhead and integration failure, but not the benefit APM was originally intended to create: preserving architecture and rules after context accumulates across many tasks.

A live multi-session development workflow showed a different shape:

- one persistent director coordinates several persistent domain workers;
- related work returns to the session whose context is already useful;
- workers checkpoint and compact instead of being respawned per tool call;
- the manager is periodically succeeded through a bounded handoff;
- the organization operates across a project history rather than one benchmark item.

This field observation is not a controlled causal result, but it identifies the system that future experiments must model.

## Retained Lessons

1. Human intent and architecture require a durable global memory.
2. Worker claims require evidence and current artifact inspection.
3. Shared work needs explicit ownership and integration lineage.
4. Manager and worker contexts should remain distinct.
5. Context health must cause checkpoint, refresh, handoff, or replacement.
6. Enforcement should validate structured lifecycle state, not natural-language bytes.
7. Coordination has a fixed cost and needs a project-scale opportunity to repay it.
8. A useful worker context is an asset, not disposable waste.

## Current Hypothesis

APM no longer claims that a manager skill makes one task faster. Its testable hypothesis is:

> A persistent hierarchical multi-session organization with durable project memory, stable domain ownership, context checkpoints, and session succession preserves architecture and cumulative throughput better than a single long-lived session once project context exceeds the session's reliable working set.

The appropriate experiment is longitudinal. Compare project episodes across many dependent tasks, hold the model and harness constant where possible, and measure architecture adherence, rework, regression, handoff recovery, context events, cost, and cumulative accepted output.
