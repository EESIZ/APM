# APM

A Claude Skill for A2A manager-agent orchestration.

This skill adapts the abstract control loop:

```text
Reduce -> Measure -> Delegate -> Maintain -> Discipline
```

into an operating protocol for managing subordinate artificial agents in multi-agent workflows.

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
