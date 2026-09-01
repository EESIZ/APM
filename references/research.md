# Research and Industry Claim Ledger

Last checked: 2026-09-01.

This ledger separates what the sources demonstrate from APM's inference. It avoids the claim that cheaper tokens alone make multi-agent systems superior.

## Budget-Controlled Reasoning

**Source:** Dat Tran and Douwe Kiela, [*Single-Agent LLMs Outperform Multi-Agent Systems on Multi-Hop Reasoning Under Equal Thinking Token Budgets*](https://arxiv.org/abs/2604.02460), submitted April 2, 2026.

**Supported claim:** Across FRAMES and MuSiQue, three model families, and several multi-agent architectures, single-agent systems matched or outperformed multi-agent systems when thinking-token budgets were controlled. The paper attributes part of the gap to communication bottlenecks and identifies degraded single-agent context utilization as a regime where structured multi-agent reasoning can become competitive.

**Boundary:** The experiments concern multi-hop reasoning under matched thinking-token budgets. They do not establish that every orchestrator-worker application is inferior. The paper is by Tran and Kiela; it is not the Stanford study sometimes conflated with CooperBench.

**APM inference:** Token price declines do not remove context fragmentation or coordination overhead. A manager should default to one agent and demand a concrete reason for delegation.

## Stanford CooperBench

**Source:** Arpandeep Khatua et al., [*CooperBench: Why Coding Agents Cannot be Your Teammates Yet*](https://arxiv.org/abs/2601.13295), Stanford University and SAP Labs, 2026. The project repository is [cooperbench/CooperBench](https://github.com/cooperbench/CooperBench).

**Supported claim:** On more than 600 collaborative coding tasks, agents working together had an average 30% lower success rate than an agent performing both tasks individually. The reported failure taxonomy includes jammed communication, broken commitments, and incorrect expectations about partners.

**Boundary:** CooperBench studies cooperating coding agents with potentially conflicting features. It is direct evidence against naive peer collaboration, not a universal comparison of every centralized manager-worker design.

**APM inference:** Contract clarity, ownership, commitment tracking, inspection, and integration are first-order controls rather than administrative decoration.

## Anthropic

**Source:** Anthropic, [*How we built our multi-agent research system*](https://www.anthropic.com/engineering/multi-agent-research-system), June 13, 2025; and [*Building effective agents*](https://www.anthropic.com/engineering/building-effective-agents), December 19, 2024.

**Supported claim:** Anthropic's Research system uses an orchestrator-worker architecture: a lead agent plans, delegates specialized parallel searches, and synthesizes their results. Anthropic reports that vague delegation causes duplicated work and gaps, that coordination complexity grows quickly, and that effort must scale to task complexity. Its general guidance recommends adding agentic complexity only when simpler approaches fall short.

**APM inference:** The lead-agent prompt needs an explicit delegation and inspection protocol. APM supplies that manager-side layer.

## OpenAI

**Source:** OpenAI, [*A practical guide to building agents*](https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/), 2025; and [*The next evolution of the Agents SDK*](https://openai.com/index/the-next-evolution-of-the-agents-sdk/), April 15, 2026.

**Supported claim:** OpenAI distinguishes a manager pattern from decentralized handoffs. In the manager pattern, a central agent retains workflow control and invokes specialized agents as tools. The 2026 SDK supports routing subagents into isolated sandbox environments.

**Boundary:** OpenAI also documents decentralized handoffs. The evidence supports manager-agent adoption, not the death of every peer topology.

**APM inference:** A central controller needs explicit acceptance and synthesis rules even when the SDK supplies routing and sandboxing.

## Cognition

**Source:** Walden Yan, [*Don't Build Multi-Agents*](https://cognition.com/blog/dont-build-multi-agents), June 12, 2025; [*Multi-Agents: What's Actually Working*](https://cognition.com/blog/multi-agents-working), April 22, 2026; and Cognition, [*Devin can now Manage Devins*](https://cognition.com/blog/devin-can-now-manage-devins), March 19, 2026.

**Supported claim:** Cognition continues to reject parallel-writer swarms because actions encode implicit decisions and contexts fragment. It now reports success with a narrower shape: one writer augmented by read-only or review intelligence, plus manager Devin sessions that break down work and coordinate child Devins. Cognition explicitly reports that agents wrongly assume shared state and require substantial context engineering.

**APM inference:** The 2025 anti-multi-agent argument and the 2026 manager-agent product are consistent. The winning pattern constrains where independent action occurs and makes management explicit.

## Microsoft

**Source:** Microsoft, [*Agentic application patterns: orchestrator-workers*](https://learn.microsoft.com/en-us/azure/durable-task/sdks/durable-agents-patterns), 2026; and [*Microsoft Entra Agent ID design patterns*](https://learn.microsoft.com/en-us/entra/agent-id/concept-agent-id-design-patterns), 2026.

**Supported claim:** Microsoft documents a central orchestrator that dynamically plans and dispatches specialized, independently checkpointed worker orchestrations. Its identity guidance separates orchestrator and worker permissions across trust boundaries.

**APM inference:** Isolation and durable execution solve runtime concerns; they do not replace the manager's contract, proof, and integration discipline.

## Synthesis

The sources do not prove that the multi-agent debate has one universal winner. They do show a practical convergence:

1. Keep coherent work in one context when possible.
2. Use a central manager when decomposition, specialization, isolation, or breadth earns the overhead.
3. Bound worker scope and preserve context deliberately.
4. Keep tightly coupled writes serialized or explicitly partitioned.
5. Verify worker claims and integrate under one accountable controller.

APM is designed for this constrained orchestrator-worker regime. Its contribution is not another agent topology. It is the manager discipline that topology needs.
