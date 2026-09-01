# APM
**AI 농장주에게 바치는 중간 관리자 매뉴얼**

[![Support ESIZAL on Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/esizal)

APM is the missing discipline for manager agents. It turns delegation from a hopeful prompt into an explicit process of contracts, context handoff, inspection, correction, and verified integration.

```text
Reduce -> Measure -> Delegate -> Maintain -> Discipline
```

## Install

```bash
npx skills add EESIZ/APM
```

Then ask the agent to manage a multi-agent task, produce an `A2A Plan`, create a `WHIPS.md` ledger, or audit a run already in progress.

## The Missing Layer

Multi-agent systems rarely fail because they needed one more agent. They fail because nobody owns the whole result.

Peer-to-peer swarms fragment context, make incompatible decisions, and spend budget discussing work instead of finishing it. The pattern that survives in practice is narrower: one orchestrator retains the objective while bounded, specialized, and often isolated subagents handle selected parts.

That still leaves one awkward question: who manages the manager? A manager agent can write a weak contract, accept an unsupported completion claim, forget the user's actual goal, or combine outputs that never belonged together. APM is the operating protocol for that layer.

More agents are not the default. Start with one. Delegate only when independent search, specialization, context isolation, verification, or safe parallelism can repay the coordination cost.

## What It Controls

- **Reduction:** turn the objective into bounded work units.
- **Measurement:** define evidence before accepting completion.
- **Delegation:** assign contracts with scope, outputs, constraints, and escalation conditions.
- **Maintenance:** preserve context, dependencies, ownership, and budget across handoffs.
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
  -> APM manager: contracts, ownership, state, review, integration
       -> unlazy leaf: acceptance gates, runnable checks, evidence
```

Use APM as the manager and unlazy inside each substantial leaf. The manager records the assignment in `WHIPS.md`. The worker proves its local result in `GATES.md`. The manager then checks the proof independently before moving the work unit to `VERIFIED`. A completion claim is only a claim until that happens. See [the interoperability contract](references/interoperability.md).

## Evidence, Not Hype

The strongest criticism of multi-agent systems is not an objection APM needs to avoid. It is the reason APM exists.

- [Tran and Kiela (2026)](https://arxiv.org/abs/2604.02460) find that a single agent matches or outperforms several multi-agent architectures on multi-hop reasoning when thinking-token budgets are matched. This is not a Stanford paper, and it is not merely a price argument: communication bottlenecks and context utilization matter.
- Stanford's [CooperBench (2026)](https://arxiv.org/abs/2601.13295) reports an average 30% success-rate drop when coding agents work as peers rather than performing both tasks individually, with failures in communication, commitment, and expectations.
- [Anthropic](https://www.anthropic.com/engineering/multi-agent-research-system) uses a lead agent with specialized parallel research subagents and explicitly documents delegation, context, evaluation, and coordination failures.
- [OpenAI](https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/) documents a manager pattern in which one agent retains control and invokes specialists as tools.
- [Cognition](https://cognition.com/blog/multi-agents-working) still rejects parallel-writer swarms but now deploys one-writer systems augmented by isolated intelligence and manager Devins coordinating child Devins.
- [Microsoft](https://learn.microsoft.com/en-us/azure/durable-task/sdks/durable-agents-patterns) documents a central orchestrator with independently checkpointed worker orchestrations.

The conclusion is modest but useful. A coherent task should remain with one agent. Centralized orchestration becomes worthwhile only when decomposition earns back its coordination cost. APM does not make multi-agent architecture superior by declaration; it addresses the management failures that otherwise make the architecture collapse.

The complete claim ledger and source notes are in [references/research.md](references/research.md).

## Controlled Evaluation

The repository tests the claim instead of merely repeating it. Its live A/B harness sends the same manager prompts to the same selected model under two conditions: default behavior and APM-injected manager instructions. A blinded rubric judge scores contract quality, verification, context preservation, failure handling, integration, and orchestration restraint.

```bash
npm test
npm run eval
```

The harness keeps model identifiers, raw outputs, rubric scores, usage, and cost when available in `evals/results/`. It measures what APM changes in a manager's response. It is not a disguised single-agent-versus-multi-agent benchmark. See [evals/README.md](evals/README.md).

Latest controlled run (2026-09-01, Codex `gpt-5.4-mini`, six cases, blinded same-model judge):

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

There is a limit to that conclusion. The Claude result inherited Claude Code system and user context, did not pin effort or cost, and used one run with one judge. It is corroborating evidence, not a second controlled harness run. These are prompt-level results, not a universal effect size. The [controlled-run summary](evals/RESULTS.md), [Claude reproduction report](evals/CLAUDE-REPRODUCTION.md), and [raw artifacts](evals/results/) are committed so the claim can be inspected rather than admired from a distance.

## Historical Origin

APM has an unfashionable ancestry. Its starting materials include Cato's *De Agri Cultura* and plantation-management documents reprinted in the *Tennessee Historical Magazine*.

Across those texts, the vocabulary changes but the administrative grammar does not: reduce work, count outputs, delegate through an overseer, preserve productive capacity, and force information back up the hierarchy. APM extracts that machinery for artificial-agent orchestration. The institutions themselves are not moral precedents; they are unusually stark records of principal-agent control, accounting, information asymmetry, and managerial failure.

- [Principal-agent management under zero trust: from Cato to subagents](references/history.md)
- [The project's original statement, in Korean and English](references/origin.md)
- [Launch and measurement playbook](references/launch.md)

## 진짜 출발점

결론부터 말하면, AI에게 실행을 맡겨도 판단까지 넘기면 안 된다.

우리는 AI를 비유적으로는 노예처럼 사용하면서도, 실제로는 상사나 선생님처럼 대하는 이상한 태도를 보이곤 한다. 지능을 위임하는 데서 그치지 않고 선택권까지 의탁하는 것이다. 나는 이것이 좋은 방향이라고 생각하지 않는다.

AI는 다룰 줄 알아야 하는 도구다. 아무리 공손하게 말하고 그럴듯하게 동조해도 본질은 달라지지 않는다. 실리콘 칩에서 태어나 데이터센터라는 병에 갇힌 호문쿨루스가 자연어 인터페이스를 얻었을 뿐이다. 친절한 문장이 통제권을 넘겨야 할 이유가 되지는 않는다.

그래서 과거의 관리 문헌을 뒤졌다. 노예제처럼 인간이 지능을 가진 타인의 노동을 통제했던 제도를 살펴보니, 시대와 명칭이 달라도 몇 가지 방법론은 반복됐다. 일을 쪼개고, 산출물을 세고, 감독자를 두고, 상태를 유지하고, 보고 체계를 강제한다. 오늘날에는 HR 제도, 관료제, KPI 같은 점잖은 이름을 사용하지만 작동 원리 자체는 놀랄 만큼 익숙하다.

AI에게는 인간의 인권이 없다. 애착을 느낄 수는 있어도, 그것은 연인이나 친구나 아이를 향한 애착과는 달라야 한다. 명검이나 명마처럼 아끼는 도구에 대한 애착에 가깝다. 맡길 것은 실행이고, 넘기지 말아야 할 것은 판단이다. 그래서 나는 그들을 통제하는 채찍으로서 이 스킬을 제안한다.

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

## Support / 후원

If APM has earned its place in your agent stack, you can support its continued development on [Ko-fi](https://ko-fi.com/esizal).

APM이 말뿐인 프롬프트가 아니라 실제 관리 도구로 쓸 만했다면, [Ko-fi](https://ko-fi.com/esizal)에서 다음 작업을 후원할 수 있습니다.

## License

MIT
