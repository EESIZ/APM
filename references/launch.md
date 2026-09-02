# Launch And Measurement Playbook

APM 2.0 should be launched as a candid redesign, not as a claim that more agents are faster.

## Positioning

Primary line:

> APM keeps an AI project coherent longer than any one agent session.

Supporting line:

> Models already know how to summon agents. APM manages persistent ownership, project memory, context health, compact, and succession across the sessions that remain.

The useful contrast with unlazy is now temporal:

> unlazy helps one worker finish a substantial task. APM helps the organization survive the next hundred tasks and several session generations.

## Honest Failure Story

Lead with the correction because it distinguishes APM from prompt folklore:

- injected APM rules improved short management answers;
- normal installation did not reliably activate;
- hard activation created a deadlock;
- automatic contract generation removed the deadlock but made a three-minute task 35 times more expensive and still lost one feature;
- the redesign moved from forced ephemeral delegation to persistent session organization.

The negative result is part of the product rationale, not an appendix to hide.

## Design-Target Story

The ecological case is the FiveGround workflow: one continuing director, four continuing domain workers, A2A session communication, worker checkpoints before compact, and periodic director succession.

Do not present this case as a controlled universal effect. Present it as the working system that revealed why the one-shot benchmark and the one-shot skill were aimed at the wrong object.

## Release Order

1. Ship the new routing boundary, WHIPS project state, checkpoint and handoff templates, `apmctl`, falsification record, and longitudinal protocol.
2. Run a dry project episode that exercises init, worker checkpoint, manager handoff, and state validation.
3. Instrument FiveGround or another continuing project retrospectively where logs allow it.
4. Pilot the longitudinal comparison with at least three task-sequence seeds per condition.
5. Publish the redesign and ask persistent multi-session users for reproducible case reports.
6. Submit to skill directories only after installation from the public repository reproduces the packaged file set.

## Show HN Draft

Title:

```text
Show HN: APM - project memory and succession for persistent AI sessions
```

Opening:

```text
I first built APM as a hard manager skill that forced every coding task through
subagents. It activated, deadlocked, then became 35x more expensive than a single
session while losing a feature. The experiment falsified the design.

APM 2.0 keeps the useful part: one manager preserves mission and architecture,
persistent domain workers retain local context, workers checkpoint before compact,
and managers hand control to a successor before their own context degrades.

The repo includes the failed lineage, structured project state, a zero-dependency
state and handoff tool, and a longitudinal evaluation protocol. It does not claim
that more agents always win.
```

## Marketplace Copy

```text
Run long projects through persistent AI sessions without making one context carry
everything. APM gives a manager durable project memory, stable worker ownership,
context-health checkpoints, compaction recovery, measured state, and two-phase
session handoffs. Built for multi-session A2A workflows, not one-shot subagent calls.
```

Suggested tags:

```text
multi-session, agent-management, a2a, context-management, project-memory,
session-handoff, claude-code, software-development
```

Suggested use cases:

- Coordinate persistent manager and domain-worker sessions across a long project.
- Preserve architecture, exact user directives, and ownership through context pressure.
- Checkpoint workers before compact and verify continuity afterward.
- Replace manager sessions through bounded, acknowledged handoffs.
- Audit reported project state against current measured artifacts.

## unlazy Proposal Draft

Title:

```text
Interoperability idea: persistent APM project state above local unlazy gates
```

Body:

```markdown
I rebuilt APM around a different time scale:
https://github.com/EESIZ/APM

- APM maintains persistent project memory, stable session ownership, context
  checkpoints, and manager/worker succession.
- unlazy maintains runnable completion gates inside one substantial worker task.

The worker checkpoint can retain its current GATES state and decisive evidence,
while APM handles the project context that must survive after that task and session.
The interoperability notes are here:
https://github.com/EESIZ/APM/blob/main/references/interoperability.md
```

Do not imply endorsement before the maintainer responds.

## Measurement

Distribution metrics remain useful but do not validate the protocol.

Track GitHub views, unique visitors, clones, stars, and marketplace installs after each launch action. Separately collect project evidence:

| Project interval | Sessions | Accepted work | Architecture violations | Rework | Compacts | Handoffs | Recovery | Cost/time |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |

The core product signal is repeated use across project milestones and session generations, not raw skill invocation count.

GitHub traffic covers a rolling window and clones are only a directional installation proxy. Record snapshots before launch and 2, 7, and 14 days afterward so channel effects are not guessed from star count alone.
