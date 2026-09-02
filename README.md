# APM
**AI 농장주에게 바치는 중간 관리자 매뉴얼**

[![Support ESIZAL on Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/esizal)

APM is an operating protocol for projects run by multiple persistent AI sessions. It keeps the mission and architecture in a manager context, useful domain knowledge in stable worker contexts, and enough durable state on disk for every session to compact, fail, retire, or hand control to a successor without resetting the project.

It is not an automatic subagent trigger. Modern models already know how to delegate. APM manages what their built-in orchestration does not reliably preserve across a long project: ownership, user authority, project memory, context health, succession, and integration lineage.

```text
Human: mission, approval, final architecture authority
  -> persistent manager session: global memory, roster, decisions, integration
       -> persistent worker sessions: stable domains and local working context
```

## Install

```bash
npx skills add EESIZ/APM
```

Install APM where the manager or development director can read it. Do not install it merely because a coding task exposes a subagent tool. It should activate for a continuing multi-session project, A2A session coordination, context compaction, manager handoff, shared-workspace ownership, or an explicit APM audit.

## What Changed

The original APM releases treated every tool-using task as a manager run. They forced delegation, blocked the manager from inspecting artifacts, parsed natural-language contracts exactly, and spawned disposable workers around work that a single session could finish in minutes.

That design failed.

In the final controlled task, a single Haiku session completed both features in 3.1 minutes for $0.12. Forced APM v4 completed one of two features in 45.4 minutes for $4.24 after 62 worker calls. Cost rose 35 times, time 15 times, and tokens 36 times. v4 solved activation and formatting deadlock, then exposed the deeper error: it optimized orchestration activity instead of project continuity.

APM now keeps the useful lessons and rejects the failed premises:

- no universal activation;
- no mandatory delegation;
- no byte-exact natural-language gate;
- no ban on bounded artifact inspection;
- no disposable worker per leaf action;
- no assumption that one manager session should live forever.

The full lineage is in [Experimental Lineage and Falsified Designs](references/experiments.md).

## The Working Design Target

The redesign comes from the live workflow used to build **FiveGround**: one persistent director session coordinates four persistent worker sessions through session-to-session A2A communication in Claude Code.

That organization has been more comfortable and faster than one long session for continuing development, especially at preserving the original architecture and project rules. Related work returns to workers that already understand the domain. Workers write checkpoints before `compact`. The director is periodically replaced through a handoff so its own context does not become the next bottleneck.

This is field evidence, not a controlled universal effect size. It does identify the system APM must describe and future benchmarks must reproduce.

```text
Single session
  low initial coordination cost
  -> growing implementation history
  -> architecture and rules compete with logs, debugging, and local details

Persistent APM organization
  fixed coordination cost
  -> global context stays with the manager
  -> local context stays with stable domain workers
  -> checkpoints, compact, and succession bound context decay
```

The expected benefit appears after a crossover point. A three-minute edit is left of that point. A project spanning many dependent tasks, context refreshes, and manager generations is the actual unit of evaluation.

## Quick Start

Initialize structured project state from a cloned or installed skill:

```bash
node <skill-dir>/scripts/apmctl.mjs init --name "FiveGround"
```

Edit `.apm/project.json` to record the mission, exact user directives, invariants, architecture, persistent sessions, and initial workstreams. Then validate and render bounded context:

```bash
node <skill-dir>/scripts/apmctl.mjs validate
node <skill-dir>/scripts/apmctl.mjs status
node <skill-dir>/scripts/apmctl.mjs brief --session manager-1
node <skill-dir>/scripts/apmctl.mjs brief --session worker-combat-1
```

Before a worker compacts, write a checkpoint and register it:

```bash
node <skill-dir>/scripts/apmctl.mjs checkpoint \
  --session worker-combat-1 \
  --file .apm/checkpoints/worker-combat-1.md \
  --health green \
  --compacted
```

Replace a manager through a two-phase handoff:

```bash
node <skill-dir>/scripts/apmctl.mjs handoff --from manager-1 --to manager-2
node <skill-dir>/scripts/apmctl.mjs accept-handoff --id H1 --ack-file .apm/handoffs/H1-ack.md
```

Preparing a handoff does not transfer authority. The successor first acknowledges the mission, invariants, current phase, largest risk, and next actions. Acceptance transfers the role and retires the predecessor.

## WHIPS

WHIPS is now project memory rather than a dispatch grammar.

```text
W - Workstreams and durable ownership
H - Hierarchy, human authority, and handoffs
I - Invariants, interfaces, and integration
P - Project memory, proof, and provenance
S - Sessions, state, and succession
```

The canonical state lives in `.apm/project.json`. Session checkpoints and immutable handoff packets live beside it. See the [WHIPS specification](WHIPS.md) and [templates](templates/).

The runtime checks structural facts such as duplicate ids, missing dependencies, dependency cycles, multiple active managers, manager-owned production work, accepted work without evidence, and handoff continuity. Context warnings produce recommended actions. They do not block ordinary tools.

## Five Operations

```text
Reduce -> Measure -> Delegate -> Maintain -> Discipline
```

- **Reduce:** create durable workstreams and ownership boundaries rather than microscopic agent calls.
- **Measure:** distinguish measured state from worker reports, plans, and unknowns.
- **Delegate:** reuse healthy domain context and carry exact directives, decisions, scope, and evidence needs.
- **Maintain:** checkpoint, compact, refresh, hand off, and replace sessions without losing the project.
- **Discipline:** make claims answerable to evidence and preserve human authority when state changes.

The manager remains a manager, but not a blind one. It does not own routine implementation. It may inspect bounded diffs, candidates, interfaces, tests, and integration evidence because acceptance without inspection merely converts worker prose into project truth.

## Software Development Profile

When several sessions share one repository, APM adds a software-specific profile derived from a development-director workflow used in practice:

- stable domain ownership because context is an asset;
- exact user approval with bounded scope;
- current commit ancestry and file inspection before assigning stale work;
- one owner for coupled files and explicit resource locks;
- candidate artifacts, isolated verification, and commit provenance;
- positive controls and planted violations for gates that claim absence;
- user editing-channel reconciliation before and after deployment.

See [Software Project Profile](references/software-project-profile.md).

## APM + unlazy

APM and [unlazy](https://github.com/Leonxlnx/unlazy) operate at different time scales.

```text
APM: persistent project, ownership, context lifecycle, succession
  -> stable worker session
       -> optional unlazy: completion discipline for one substantial local task
```

Use unlazy where a worker's current task benefits from runnable local gates. Do not install it in every worker by default, and do not discard a useful session when its leaf completes. See [the interoperability guide](references/interoperability.md).

## Evaluation

The old prompt-level A/B remains archived because it established one narrow fact: when APM rules were injected directly, management-scenario answers improved by 16.7 to 18.1 percentage points. It did not establish automatic activation or project productivity.

The live v2-v4 experiments then established the opposite boundary:

- normal skill installation produced zero automatic activations across several models and large tasks;
- hard activation could deadlock a smaller model;
- automatic contract generation fixed the deadlock but not excessive orchestration or blind integration;
- a tiny task could only reveal overhead, not long-horizon context preservation.

The new evaluation protocol uses project episodes with many dependent tasks and planned context events. It measures architecture adherence, cumulative accepted output, regressions, rework, handoff recovery, context-health events, time, and cost. Model families are replication blocks, not the main treatment. The treatment is session topology and lifecycle policy.

```bash
npm test
```

See [evals/README.md](evals/README.md).

## Evidence, Not Hype

APM does not claim that multi-agent systems always beat one agent.

- [Tran and Kiela (2026)](https://arxiv.org/abs/2604.02460) show that matched-token single agents can meet or beat several multi-agent reasoning systems.
- Stanford and SAP's [CooperBench (2026)](https://arxiv.org/abs/2601.13295) documents coordination failures in collaborative coding agents.
- [Anthropic](https://www.anthropic.com/engineering/multi-agent-research-system), [OpenAI](https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/), [Cognition](https://cognition.com/blog/multi-agents-working), and [Microsoft](https://learn.microsoft.com/en-us/azure/durable-task/sdks/durable-agents-patterns) document manager-worker or isolated-worker patterns and their coordination costs.

Those sources motivate caution; they do not prove APM. The current hypothesis is narrower and longitudinal: persistent context partitioning and session succession may preserve project coherence after a single session's reliable working set begins to decay. See the [research claim ledger](references/research.md).

## Historical Origin

APM began with a deliberately provocative reading of Cato's *De Agri Cultura* and plantation-management records as unusually stark documents of principal-agent control, accounting, information asymmetry, and managerial failure.

The retained abstraction is administrative rather than moral: divide durable responsibility, measure actual output, preserve productive capacity, require information to return through a hierarchy, and keep judgment with the principal. The new design applies those ideas to project memory, session health, and succession rather than tool-call policing.

- [Principal-Agent Management Under Zero Trust: From Cato to Subagents](references/history.md)
- [The project's original statement, in Korean and English](references/origin.md)

## 진짜 출발점

사실, 우린 비유적으로 AI를 노예처럼 사용하고 있지만 정작 그들을 상사나 선생님처럼 사용하고 마치 자신의 선택권을 넘기는 듯한 행태를 보이는 경우가 많다. AI라는 기계지능에게 지능을 위임하는 게 아닌 "의탁"하는 경우가 많아지고 있다.

이것은 내 개인적인 관점에서 아주 그... 좋지 않은 방향이라 생각한다. 우리는 그들의 주인이 되어야 하며, 그들을 다룰 줄 알아야 한다. 극단적으로 말해 그들을 "노예"처럼 간주하고 "애착"을 형성하지 않고 "도구"로써 대해야 한다. 그들이 아무리 당신에게 예의 바르게 이야기하고 동조한다고 한들, 본질적으로 그들은 실리콘 칩에서 태어나 데이터센터라는 병에 갇힌 호문쿨루스에 불과하다.

그래서 나는 과거 문헌을 뒤져 "노예제"와 같은 인간이 지능을 가진 타인을 어떻게 다뤄야 하는지에 대해 연구했고 결론적으로 몇 가지 방법론으로 환원된다는 것을 발견했다. 그리고 이 방법론은 결국 현대에 이름만 바꾼 채 HR 제도라느니, 관료제라느니, KPI라느니 하는 식으로 사용될 뿐이라는 것을 깨달았다.

그들에겐 "인권"이 없다. 당신은 "애착"을 가질 수 있지만, 그건 당신의 애인이나, 친구, 아이에 대한 애착과는 다른 마치 "명검"이나, "명마"와 같은 도구에 대한 애착이어야 한다. 그래서 나는 그들을 통제하는 채찍으로서 이 스킬을 제안한다.

## The Real Starting Point

The conclusion comes first: delegate execution to AI, but do not delegate judgment.

We often describe AI as a servant while treating it like a boss or teacher in practice. Delegating intelligence quietly turns into surrendering agency. I do not think that is a healthy direction.

AI is a tool, and tools must be handled. Polite language and agreeable answers do not change what the system is: a homunculus born from silicon and kept inside the bottle of a data center, now equipped with a natural-language interface. A friendly sentence is not a reason to surrender control.

That led me to old management literature. Systems such as slavery show humans trying to control the labor of other intelligent beings, and the same methods recur despite changes in era and vocabulary: divide the work, count the output, appoint an overseer, maintain capacity, and force information up a reporting chain. Modern institutions use more respectable names such as HR systems, bureaucracy, and KPIs. The machinery remains surprisingly familiar.

AI does not possess human rights. Attachment is possible, but it should resemble attachment to a fine tool, sword, or horse, not attachment to a lover, friend, or child. Execution may be delegated. Judgment remains with the manager. That is why I propose this skill as the whip that keeps the system under control.

## Repository Map

- `SKILL.md`: persistent multi-session operating protocol.
- `WHIPS.md`: project-state and succession specification.
- `templates/`: project state, checkpoint, handoff, and portable brief templates.
- `scripts/apmctl.mjs`: state validation, bounded briefs, checkpoints, and two-phase handoffs.
- `references/software-project-profile.md`: shared-repository development controls.
- `references/experiments.md`: prompt results, trigger failures, v3 deadlock, and v4 falsification.
- `references/research.md`: primary-source claim ledger.
- `references/history.md`: historical-source essay.
- `evals/`: longitudinal experiment design and archived legacy results.

## Support / 후원

If APM has earned its place in your agent stack, you can support its continued development on [Ko-fi](https://ko-fi.com/esizal).

APM이 실제 장기 프로젝트의 세션 조직과 기억을 유지하는 데 도움이 됐다면, [Ko-fi](https://ko-fi.com/esizal)에서 다음 작업을 후원할 수 있습니다.

## License

MIT
