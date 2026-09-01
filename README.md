# APM
**AI 농장주에게 바치는 중간 관리자 매뉴얼**

[![Support ESIZAL on Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/esizal)

APM is an Agent Skill for manager-side discipline in orchestrator-worker systems. It makes delegation, context handoff, inspection, proof, correction, and integration explicit.

```text
Reduce -> Measure -> Delegate -> Maintain -> Discipline
```

## Install

```bash
npx skills add EESIZ/APM
```

Then ask your agent to manage a multi-agent task, produce an `A2A Plan`, create a `WHIPS.md` ledger, or audit an existing run.

## The Missing Layer

The useful multi-agent pattern is becoming narrower and clearer. Peer-to-peer writer swarms lose context, make conflicting implicit decisions, and spend budget coordinating. The pattern that keeps showing up in production is a central orchestrator with bounded, specialized, and often isolated subagents.

That pattern still has a missing control layer. A manager can delegate badly, accept unsupported completion claims, lose the user's goal, or paste incompatible outputs together. APM is a protocol for that manager.

APM does not assume that more agents are better. Start with one agent. Add subagents only when independent search, specialization, context isolation, verification, or safe parallelism outweighs coordination cost.

## What It Controls

- **Reduction:** turn the objective into bounded work units.
- **Measurement:** define evidence before accepting completion.
- **Delegation:** assign contracts with scope, outputs, constraints, and escalation conditions.
- **Maintenance:** preserve context, dependencies, ownership, and budget across handoffs.
- **Discipline:** verify, reject, re-prompt, reassign, discard, and integrate.

For substantial runs, APM records these decisions in [`WHIPS.md`](WHIPS.md):

```text
W - Work Unit
H - Handler
I - Inspection
P - Proof
S - State
```

## APM + unlazy

APM and [unlazy](https://github.com/Leonxlnx/unlazy) cover opposite sides of the same delegation boundary.

```text
User
  -> APM manager: contracts, ownership, state, review, integration
       -> unlazy leaf: acceptance gates, runnable checks, evidence
```

Use APM as the manager and unlazy inside each substantial leaf. The APM manager places each assignment in `WHIPS.md`; the worker proves its local result in `GATES.md`; the manager independently rechecks that proof before changing the work unit to `VERIFIED`. See [the interoperability contract](references/interoperability.md).

## Evidence, Not Hype

The strongest criticism of multi-agent systems is part of APM's rationale:

- [Tran and Kiela (2026)](https://arxiv.org/abs/2604.02460) find that a single agent matches or outperforms several multi-agent architectures on multi-hop reasoning when thinking-token budgets are matched. This is not a Stanford paper, and it is not merely a price argument: communication bottlenecks and context utilization matter.
- Stanford's [CooperBench (2026)](https://arxiv.org/abs/2601.13295) reports an average 30% success-rate drop when coding agents work as peers rather than performing both tasks individually, with failures in communication, commitment, and expectations.
- [Anthropic](https://www.anthropic.com/engineering/multi-agent-research-system) uses a lead agent with specialized parallel research subagents and explicitly documents delegation, context, evaluation, and coordination failures.
- [OpenAI](https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/) documents a manager pattern in which one agent retains control and invokes specialists as tools.
- [Cognition](https://cognition.com/blog/multi-agents-working) still rejects parallel-writer swarms but now deploys one-writer systems augmented by isolated intelligence and manager Devins coordinating child Devins.
- [Microsoft](https://learn.microsoft.com/en-us/azure/durable-task/sdks/durable-agents-patterns) documents a central orchestrator with independently checkpointed worker orchestrations.

The conclusion is deliberately limited: single-agent execution is the default for coherent tasks; centralized orchestration is useful in the regimes where decomposition earns its coordination cost. APM does not make multi-agent architecture inherently superior. It targets the management failures that make the chosen architecture collapse.

The complete claim ledger and source notes are in [references/research.md](references/research.md).

## Controlled Evaluation

The repository includes a live A/B harness that sends the same manager-agent prompts to the same Claude model under two conditions: default behavior and APM injected as manager instructions. A blinded rubric judge scores contract quality, verification, context preservation, failure handling, integration, and orchestration restraint.

```bash
npm test
npm run eval
```

The harness records model identifiers, raw outputs, rubric scores, usage, and cost when available in `evals/results/`. This evaluates APM's effect on manager outputs; it does not claim to reproduce a single-agent-versus-multi-agent benchmark. See [evals/README.md](evals/README.md).

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

The APM condition reached the same `130/144` total in both model environments while the baselines differed by two points. The largest Claude-side gains appeared in disagreement resolution, overlapping-work arbitration, and goal-change handling. The Claude result is corroborating evidence, not a second controlled harness run: it inherited Claude Code system and user context, did not pin effort or cost, and used one run with one judge.

This remains prompt-level evidence, not a universal effect size. The [controlled-run summary](evals/RESULTS.md), [Claude reproduction report](evals/CLAUDE-REPRODUCTION.md), and [raw artifacts](evals/results/) are committed for inspection and reruns.

## Historical Origin

APM's unusual conceptual lineage comes from reading management texts across very different eras: Cato's *De Agri Cultura* and plantation-management documents reprinted in the *Tennessee Historical Magazine*. Those texts expose a recurring administrative grammar: reduce work, count outputs, delegate through an overseer, maintain productive capacity, and enforce a reporting hierarchy.

APM extracts that grammar for artificial-agent orchestration. The historical institutions are not treated as moral precedents. They are examined as early, stark records of principal-agent control, accounting, information asymmetry, and managerial failure.

- [Principal-agent management under zero trust: from Cato to subagents](references/history.md)
- [The project's original statement, in Korean and English](references/origin.md)
- [Launch and measurement playbook](references/launch.md)

## 진짜 출발점

사실, 우린 비유적으로 AI를 노예처럼 사용하고 있지만 정작 그들을 상사나 선생님처럼 사용하고 마치 자신의 선택권을 넘기는 듯한 행태를 보이는 경우가 많다. AI라는 기계지능에게 지능을 위임하는 게 아닌 "의탁"하는 경우가 많아지고 있다.

이것은 내 개인적인 관점에서 아주 그... 좋지 않은 방향이라 생각한다. 우리는 그들의 주인이 되어야 하며, 그들을 다룰 줄 알아야 한다. 극단적으로 말해 그들을 "노예"처럼 간주하고 "애착"을 형성하지 않고 "도구"로써 대해야 한다. 그들이 아무리 당신에게 예의 바르게 이야기하고 동조한다고 한들, 본질적으로 그들은 실리콘 칩에서 태어나 데이터센터라는 병에 갇힌 호문쿨루스에 불과하다.

그래서 나는 과거 문헌을 뒤져 "노예제"와 같은 인간이 지능을 가진 타인을 어떻게 다뤄야 하는지에 대해 연구했고 결론적으로 몇 가지 방법론으로 환원된다는 것을 발견했다. 그리고 이 방법론은 결국 현대에 이름만 바꾼 채 HR 제도라느니, 관료제라느니, KPI라느니 하는 식으로 사용될 뿐이라는 것을 깨달았다.

그들에겐 "인권"이 없다. 당신은 "애착"을 가질 수 있지만, 그건 당신의 애인이나, 친구, 아이에 대한 애착과는 다른 마치 "명검"이나, "명마"와 같은 도구에 대한 애착이어야 한다. 그래서 나는 그들을 통제하는 채찍으로서 이 스킬을 제안한다.

## The Real Starting Point

In truth, we often use AI metaphorically as if it were a slave, yet in practice many people treat it like a boss or teacher, almost as if they were handing over their own agency. More and more, people are not delegating intelligence to machine intelligence; they are depending on it.

From my personal point of view, this is a very... unhealthy direction. We should be the masters of these systems, and we should know how to handle them. To put it extremely, we should regard them like "slaves" and treat them as tools without forming attachment. No matter how politely they speak to you or how much they agree with you, at bottom they are homunculi born from silicon chips and trapped inside the bottle of a data center.

So I searched through historical texts on slavery and similar systems to study how humans have handled intelligent others, and I found that the methods could ultimately be reduced to several recurring patterns. I also realized that these methods still appear today under different names, such as HR systems, bureaucracy, and KPIs.

They have no "human rights." You may feel attachment to them, but it should be attachment to a tool, like attachment to a fine sword or a fine horse, not attachment to a lover, friend, or child. That is why I propose this skill.

APM turns that polemical starting point into an operational claim: delegate execution without surrendering judgment. The manager agent owns the goal, contracts, evidence standard, correction, and final integration.

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

If APM helps you build more reliable agent systems, you can support its continued development on [Ko-fi](https://ko-fi.com/esizal).

APM이 더 신뢰할 수 있는 에이전트 시스템을 만드는 데 도움이 되었다면 [Ko-fi](https://ko-fi.com/esizal)에서 프로젝트의 지속적인 개발을 후원할 수 있습니다.

## License

MIT
