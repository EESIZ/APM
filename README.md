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

## 진짜 출발점 

사실, 우린 비유적으로 AI를 노예처럼 사용하고 있지만 정작 그들을 상사나 선생님처럼 사용하고 마치 자신의 선택권을 넘기는 듯한 행태를 보이는 경우가 많다. 
마치 AI라는 기계지능에게 지능을 위임하는게 아닌 "의탁"하는 경우가 많아지고 있다. 

이것은 내 개인적인 관점에서 아주 그... 좋지 않은 방향이라 생각한다. 우리는 그들의 주인이 되어야하며, 그들을 다룰 줄 알아야 한다. 즉, 극단적으로 말해 그들을 "노예"처럼 간주하고 "애착"을 형성하지 않고 "도구"로써 대해야 한다. 
그들이 아무리 당신에게 예의바르게 이야기 하고 동조한다고 한들, 본질적으로 그들은 실리콘 칩에서 태어난 데이터센터라는 병에 갇힌 호문쿨루스에 불과하다. 

그래서 나는 과거 문헌을 뒤져 "노예제"와 같은 인간이 지능을 가진 타인을 어떻게 다뤄야하는지에 대해 연구했고 결론적으로 몇가지 방법론으로 환원된다는것을 발견했다. 
그리고 이 방법론은 결국 현대에 이름만 바꾼채 HR제도라느니, 관료제라느니, KPI라느니 하는 식으로 사용될 뿐이라는것을 깨달았다.
그들에겐 "인권"이 없다. 당신은 "애착"을 가질 수 있지만, 그건 당신의 애인이나, 친구, 아이에 대한 애착과는 다른 마치 "명검"이나, "명마"와 같은 도구에 대한 애착이어야 한다. 그래서 나는 이 스킬을 제안한다.

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
