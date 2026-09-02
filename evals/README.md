# APM Evaluation

APM 2.0 changes the unit of evaluation from one manager answer or one small coding task to a project episode that outlives individual session contexts.

## Current Files

- `evals.json`: behavioral scenarios for skill decisions. These can detect obvious regressions such as mandatory delegation, disposable expertise, approval laundering, blind management, or missing succession. They do not prove productivity.
- `trigger-evals.json`: routing cases. Persistent named sessions, A2A project coordination, compact, and handoff should trigger. One-shot edits and ephemeral subagents should not.
- `protocol.json`: the controlled longitudinal experiment design.
- `results/`: archived v1 prompt-level outputs.
- `RESULTS.md` and `CLAUDE-REPRODUCTION.md`: legacy prompt findings with their limits.

## Primary Comparison

Use the same model, repository, task sequence, tools, user approvals, and budget under three conditions:

1. one continuing session;
2. native ephemeral subagents;
3. persistent APM manager and domain sessions with checkpoints and succession.

Models are replication blocks, not the treatment. The treatment is the organization of context across sessions and time.

## Required Project Events

A useful episode contains enough sequential work for context competition to emerge. It should include architecture invariants, cross-task dependencies, a tempting local violation, at least one worker compact, at least one manager handoff, one ownership or integration conflict, and a late task that depends on an early decision.

Also keep a short control episode. If APM cannot abstain left of the coordination crossover, it repeats v4.

## Outcomes

Measure current artifacts rather than manager prose:

- milestone and hidden invariant test results;
- cumulative accepted output over task index and time;
- architecture violations, regressions, rework, and integration loss;
- compact continuity and handoff recovery;
- measured-versus-reported state mismatches;
- context-health events, tokens, cost, elapsed time, and calls.

Plot cumulative output and cumulative cost to locate the crossover, if one exists.

## Legacy Results

The archived six-case prompt A/B improved from 72.2% to 90.3% in Codex and from 73.6% to 90.3% in an informal Claude reproduction. Those runs show that injected management rules can improve answers on their own rubric.

They do not show that an installed skill activates, that forced orchestration improves a task, or that persistent APM improves a project. Later v3/v4 experiments falsified those broader interpretations. See [the experimental lineage](../references/experiments.md).

## Validation

```bash
node scripts/validate-evals.mjs
```

This checks fixture shape and coverage only. It does not simulate a model router or execute the expensive longitudinal protocol.
