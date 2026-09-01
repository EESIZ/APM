# APM

A Claude Skill for A2A manager-agent orchestration.

This skill adapts the abstract control loop:

```text
Reduce -> Measure -> Delegate -> Maintain -> Discipline
```

into an operating protocol for managing subordinate artificial agents in multi-agent workflows.

## 아이디어의 출발점

이 스킬의 아이디어는 고대 농장 관리 문헌과 근대 플랜테이션 관리 문헌을 읽으며 발견한 하나의 반복 패턴에서 출발했다. 역사적으로 인간은 자신이 감당하기 싫어한 육체노동을 다른 인간에게 떠넘겼고, 어떤 시대에는 그것이 노예제라는 폭력적인 제도로 굳어졌다. 이후 기계와 산업 시스템은 많은 육체노동을 대체하거나 증폭했다.

이제 AI의 등장은 지적노동에서도 비슷한 전환을 만들고 있다. 사람이 직접 모든 탐색, 요약, 구현, 검증을 수행하는 대신 여러 AI 에이전트에게 일을 나누어 맡기고, 관리자는 목표와 기준, 검증, 통합을 담당한다. APM은 이 흐름을 위해 만들어진 manager-agent orchestration skill이다.

여기서 가져온 것은 역사적 제도의 윤리가 아니라, 복잡한 작업을 분해하고, 측정하고, 위임하고, 유지하고, 검증하는 추상적 운영 구조다. APM은 그 구조를 A2A 환경에서 하위 에이전트의 작업 계약, 상태 추적, 증거 요구, 재지시, 결과 통합에 적용한다.

## Origin

The idea behind this skill came from reading ancient estate-management texts and modern plantation-management documents as examples of a recurring organizational pattern. Historically, humans often tried to escape unwanted physical labor by pushing it onto other humans; in some societies, that became institutionalized as slavery. Later, machines and industrial systems replaced or amplified much of that physical labor.

AI now creates a similar shift in intellectual labor. Instead of performing every search, summary, implementation, and verification step directly, a manager can delegate bounded pieces of reasoning or execution to multiple AI agents, while preserving the goal, standards, verification, and final integration.

APM does not borrow the ethics of those historical systems. It abstracts only the operational structure: reduce work into units, measure evidence, delegate contracts, maintain context, and discipline outputs through verification. In A2A workflows, that structure becomes a protocol for managing subordinate agents, tracking their state, rejecting weak outputs, and integrating verified results.

It is designed for manager/coordinator agents that need to:

- preserve the user's objective across delegation;
- split work into bounded subagent contracts;
- define measurable evidence and verification;
- maintain context, inputs, and constraints;
- reject, re-prompt, reassign, or discard weak subagent outputs;
- integrate multiple subagent results into a coherent final answer.

## Files

- `SKILL.md`: the Claude Skill.
- `evals/evals.json`: starter evaluation prompts.
