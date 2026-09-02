# APM
**AI 농장주에게 바치는 중간 관리자 매뉴얼**

[![Support ESIZAL on Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/esizal)

APM is a context firewall for manager agents. It keeps the mission, system map, decisions, and acceptance authority in a small supervisory context while disposable workers absorb the growing context of discovery, implementation, testing, verification, and integration.

```text
Reduce -> Measure -> Delegate -> Maintain -> Discipline
```

## Install

```bash
npx skills add EESIZ/APM
```

Install APM on the lead agent. For any tool-using execution task with worker agents available, the lead should load APM before planning, repository inspection, `TaskCreate`, research, edits, or tests. The request does not need to mention delegation.

### Runtime Enforcement

APM carries [Claude Code lifecycle hooks](https://code.claude.com/docs/en/hooks) in the [skill frontmatter](https://code.claude.com/docs/en/skills). While APM is active, uncontracted Agent dispatch is denied, manager leaf tools are blocked, over-limit or malformed worker and verifier returns are sent back, and the manager cannot stop while `WHIPS.md` still computes unfinished duties.

The manager is the disciplined party. Leaf workers may use unlazy, but APM does not require every worker to install it. The manager keeps the blueprint, assigns bounded context, watches, replaces, commissions independent verification, and dispatches root integration without doing leaf work itself. Each runtime decision is recorded without prompt or worker-message content in `.apm/runtime.jsonl`, so an experiment can distinguish “the skill was present” from “the controls actually fired.”

```bash
node scripts/runtime-report.mjs --json
```

Treat `.apm/` as local runtime evidence and ignore it in ordinary commits.

For project-wide enforcement that catches direct work and substitute task-list tools even before automatic skill activation, install the persistent hooks from a cloned copy:

```bash
node scripts/install-hooks.mjs
```

Description routing is probabilistic; only persistent hooks can force the manager to load APM before its first direct tool call. The installer writes project-local `.claude/settings.local.json` by default. Use `--uninstall` to remove only APM handlers, `--shared` for committed project settings, or `--global` for all local projects. The manager Stop gate is strict by default; use `--allow-emergency-release` only when a six-unchanged-block escape hatch is deliberately preferred. Persistent installation is explicit because it changes Claude Code runtime settings; the skill never installs it silently.

## The Missing Layer

Multi-agent systems rarely fail because they needed one more agent. They fail because nobody owns the whole result.

Peer-to-peer swarms fragment context, make incompatible decisions, and spend budget discussing work instead of finishing it. The pattern that survives in practice is narrower: one orchestrator retains the objective while bounded, specialized, and isolated subagents handle execution.

That still leaves one awkward question: who keeps the manager from becoming another worker? Once it reads source, follows logs, debugs, and rewrites patches, its supervisory context accumulates the same debris APM was meant to isolate. APM makes the manager a non-executing control plane.

Do not split a coherent work unit merely to create parallelism. Use one producer when one producer is enough, but keep that producer, its independent verifier, and the manager in separate contexts. The manager never decides to collapse back into single-agent execution.

```text
User: mission and final authority
  -> APM manager: blueprint, work map, context budgets, state, acceptance
       -> producers: discovery, implementation, tests, artifacts
       -> verifiers: independent evidence
       -> ROOT integrator: verified assembly
```

## What It Controls

- **Reduction:** turn the objective into bounded work units.
- **Measurement:** define evidence, resource ceilings, context limits, and bounded returns before accepting completion.
- **Delegation:** assign contracts with scope, outputs, constraints, and escalation conditions.
- **Maintenance:** preserve the manager context while replacing stale or saturated worker contexts.
- **Discipline:** verify, reject, re-prompt, reassign, discard, and integrate.

For substantial runs, these decisions live in [`WHIPS.md`](WHIPS.md). Memory is not a management system.

```text
W - Work Unit
H - Handler
I - Inspection
P - Proof
S - State
```

## APM + unlazy

APM and [unlazy](https://github.com/Leonxlnx/unlazy) discipline opposite sides of the same delegation boundary.

```text
User
  -> APM manager: mission, contracts, context budgets, state, acceptance
       -> unlazy leaf: acceptance gates, runnable checks, evidence
```

Use APM on the manager. Add unlazy only to a leaf whose local work is substantial enough to justify its own `GATES.md`. The manager records every assignment in `WHIPS.md`, regardless of whether the worker uses another skill, and dispatches a different verifier before moving a unit to `VERIFIED`. A completion claim is only a claim until bounded `PASS` evidence returns. See [the interoperability contract](references/interoperability.md).

The dependency is optional and the direction matters. Every worker does not need unlazy. APM adapts unlazy's early-stop discipline to the manager, forcing the orchestrator to keep dispatching, watching, replacing, verifying, and deciding until its own ledger is settled. Adapted runtime components retain the original MIT notice in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Evidence, Not Hype

The strongest criticism of multi-agent systems is not an objection APM needs to avoid. It is the reason APM exists.

- [Tran and Kiela (2026)](https://arxiv.org/abs/2604.02460) find that a single agent matches or outperforms several multi-agent architectures on multi-hop reasoning when thinking-token budgets are matched. This is not a Stanford paper, and it is not merely a price argument: communication bottlenecks and context utilization matter.
- Stanford's [CooperBench (2026)](https://arxiv.org/abs/2601.13295) reports an average 30% success-rate drop when coding agents work as peers rather than performing both tasks individually, with failures in communication, commitment, and expectations.
- [Anthropic](https://www.anthropic.com/engineering/multi-agent-research-system) uses a lead agent with specialized parallel research subagents and explicitly documents delegation, context, evaluation, and coordination failures.
- [OpenAI](https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/) documents a manager pattern in which one agent retains control and invokes specialists as tools.
- [Cognition](https://cognition.com/blog/multi-agents-working) still rejects parallel-writer swarms but now deploys one-writer systems augmented by isolated intelligence and manager Devins coordinating child Devins.
- [Microsoft](https://learn.microsoft.com/en-us/azure/durable-task/sdks/durable-agents-patterns) documents a central orchestrator with independently checkpointed worker orchestrations.

The conclusion is modest but useful. A coherent work unit should stay with one producer rather than a peer swarm, but the long-lived manager context should remain separate from that producer's execution context. APM does not make multi-agent architecture superior by declaration; it tests whether role and context isolation can prevent the manager from degrading across a long run.

The complete claim ledger and source notes are in [references/research.md](references/research.md).

## Controlled Evaluation

The repository tests the claim instead of merely repeating it. Its live A/B harness sends the same manager prompts to the same selected model under two conditions: default behavior and APM-injected manager instructions. A blinded rubric judge scores role separation, context control, contract quality, verification, failure handling, and integration accountability.

```bash
npm test
npm run eval
```

`npm test` also executes the runtime hooks as child processes with realistic Claude Code hook payloads. The current deterministic suite covers 32 routing, role-separation, dispatch, verification, bounded-return, stop, installer, ledger, and privacy-preserving telemetry cases.

The harness keeps model identifiers, raw outputs, rubric scores, usage, and cost when available in `evals/results/`. It measures what APM changes in a manager's response. It is not a disguised single-agent-versus-multi-agent benchmark. See [evals/README.md](evals/README.md).

Archived prompt-level controlled run (2026-09-01, Codex `gpt-5.4-mini`, six cases, blinded same-model judge):

| Condition | Score | Percent |
| --- | ---: | ---: |
| No skill | 104/144 | 72.2% |
| APM | 130/144 | 90.3% |
| Delta | +26 | +18.1 pp |

An informal Claude Code reproduction used Claude Sonnet subagents as both target and blinded judge:

| Condition | Codex controlled run | Claude informal reproduction |
| --- | ---: | ---: |
| No skill | 104/144 (72.2%) | 106/144 (73.6%) |
| APM | 130/144 (90.3%) | 130/144 (90.3%) |
| Delta | +26 (+18.1 pp) | +24 (+16.7 pp) |

The notable part is not that both runs improved. It is that APM reached the same `130/144` in both model environments while the baselines differed by two points. Claude showed its largest gains in disagreement resolution, overlapping-work arbitration, and goal-change handling.

There is a limit to that conclusion. The Claude result inherited Claude Code system and user context, did not pin effort or cost, and used one run with one judge. It is corroborating evidence, not a second controlled harness run. These are prompt-level results, not a universal effect size. They also predate the manager-runtime hooks and the current fourteen-case suite; `npm run test:recorded` deliberately remains red until a fresh live comparison is recorded. The [controlled-run summary](evals/RESULTS.md), [Claude reproduction report](evals/CLAUDE-REPRODUCTION.md), and [raw artifacts](evals/results/) are committed so the claim can be inspected rather than admired from a distance.

## Historical Origin

APM has an unfashionable ancestry. Its starting materials include Cato's *De Agri Cultura* and plantation-management documents reprinted in the *Tennessee Historical Magazine*.

Across those texts, the vocabulary changes but the administrative grammar does not: reduce work, count outputs, delegate through an overseer, preserve productive capacity, and force information back up the hierarchy. APM extracts that machinery for artificial-agent orchestration. The institutions themselves are not moral precedents; they are unusually stark records of principal-agent control, accounting, information asymmetry, and managerial failure.

- [Principal-agent management under zero trust: from Cato to subagents](references/history.md)
- [The project's original statement, in Korean and English](references/origin.md)
- [Launch and measurement playbook](references/launch.md)

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

- `SKILL.md`: manager-agent operating instructions.
- `WHIPS.md`: the manager ledger specification.
- `templates/WHIPS.md`: reusable ledger template.
- `references/interoperability.md`: APM and unlazy handoff contract.
- `references/research.md`: primary-source claim ledger.
- `references/history.md`: historical-source essay.
- `references/launch.md`: distribution order, outreach drafts, and measurement cadence.
- `evals/`: prompts, rubric, raw results, and evaluation notes.
- `scripts/`: zero-dependency validation and live A/B evaluation.
- `scripts/manager-hook.mjs`: Claude Code dispatch, worker-return, and manager-stop enforcement.
- `scripts/whips-check.mjs`: deterministic manager-duty audit.
- `scripts/runtime-report.mjs`: privacy-preserving runtime intervention summary.
- `scripts/install-hooks.mjs`: optional persistent Claude Code hook installer.
- `THIRD_PARTY_NOTICES.md`: attribution for adapted unlazy runtime mechanisms.

## Support / 후원

If APM has earned its place in your agent stack, you can support its continued development on [Ko-fi](https://ko-fi.com/esizal).

APM이 말뿐인 프롬프트가 아니라 실제 관리 도구로 쓸 만했다면, [Ko-fi](https://ko-fi.com/esizal)에서 다음 작업을 후원할 수 있습니다.

## License

MIT
