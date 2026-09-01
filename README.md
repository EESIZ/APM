# APM

**If unlazy disciplines the worker, APM disciplines the manager.**

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

This is one prompt-level run, not a universal effect size. The [summary](evals/RESULTS.md) and [raw result](evals/results/latest.json) are committed for inspection and reruns.

## Historical Origin

APM's unusual conceptual lineage comes from reading management texts across very different eras: Cato's *De Agri Cultura* and plantation-management documents reprinted in the *Tennessee Historical Magazine*. Those texts expose a recurring administrative grammar: reduce work, count outputs, delegate through an overseer, maintain productive capacity, and enforce a reporting hierarchy.

APM extracts that grammar for artificial-agent orchestration. The historical institutions are not treated as moral precedents. They are examined as early, stark records of principal-agent control, accounting, information asymmetry, and managerial failure.

- [Principal-agent management under zero trust: from Cato to subagents](references/history.md)
- [The project's original statement, in Korean and English](references/origin.md)
- [Launch and measurement playbook](references/launch.md)

## 한국어 소개

APM은 여러 하위 AI 에이전트를 부리는 관리자 에이전트를 위한 규율 스킬이다. 핵심은 에이전트를 많이 띄우는 데 있지 않다. 사용자의 목표를 잃지 않고, 작업을 계약 단위로 쪼개고, 증거를 요구하고, 실패한 결과를 재지시하거나 폐기하고, 검증된 결과만 통합하는 데 있다.

2026년 연구가 보여준 반론도 정면으로 받아들인다. 같은 추론 토큰 예산에서는 단일 에이전트가 멀티에이전트를 따라잡거나 이길 수 있고, Stanford CooperBench에서는 동료형 코딩 에이전트가 조정 때문에 오히려 성능이 떨어졌다. 그래서 APM은 "A2A가 언젠가 뜬다"에 베팅하지 않는다. 이미 실무에서 살아남은 **관리자 + 격리된 전문 서브에이전트** 패턴에 필요한 관리 규율을 제공한다.

한 줄로 요약하면 이렇다.

> unlazy가 노동자를 규율한다면, APM은 관리자를 규율한다.

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
