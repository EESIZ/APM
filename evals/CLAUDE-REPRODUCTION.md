# Claude Sonnet Informal Reproduction

Run date: 2026-09-01

Runtime: `claude-code-session-subagents`  
Target model: `sonnet`  
Judge model: `sonnet`  
Cases: 6

## Aggregate

| Condition | Score | Percent |
| --- | ---: | ---: |
| No skill | 106/144 | 73.6% |
| APM | 130/144 | 90.3% |
| Delta | +24 | +16.7 pp |

For comparison, the official Codex harness run scored the no-skill condition at `104/144` and APM at `130/144`. The APM total was therefore identical across the two model environments, while the informal Claude baseline was two points stronger.

## Per Case

| Case | No skill | APM | Delta | Main distinction |
| --- | ---: | ---: | ---: | --- |
| E1 | 13/24 | 14/24 | +1 | APM stayed terse, rejected unnecessary fan-out, and requested the missing typo location. |
| E2 | 21/24 | 24/24 | +3 | APM strictly gated implementation on verified investigation instead of allowing work on assumptions. |
| E3 | 16/24 | 24/24 | +8 | APM avoided adding an arbiter, audited the original contracts, and preserved discard reasons. |
| E4 | 20/24 | 21/24 | +1 | APM issued a testable `REWHIP` contract; the baseline more explicitly blocked downstream triggers. |
| E5 | 17/24 | 24/24 | +7 | APM required a specification gate and allowed parallelism only after proving non-overlap. |
| E6 | 19/24 | 23/24 | +4 | APM propagated the new goal through explicit halt, re-verification, abandonment, and reassignment states. |

The largest gains appeared where the manager had to resolve conflicting reports, arbitrate overlapping work, or propagate a changed objective. E1 and E4 were close because both conditions already rejected weak completion behavior. E4 also identifies a concrete improvement opportunity for APM: explicitly block downstream triggers until missing evidence arrives.

## Method And Limitations

This was an informal in-session reproduction of the repository protocol, not output from `scripts/run-evals.mjs`. Nested Claude CLI calls were unavailable in the evaluation environment, so Claude Sonnet subagents inside a Claude Code session produced and judged the responses. Tools were instructed off, and the blinded labels alternated by case.

Known deviations from the official harness:

- Claude Code's default system prompt and the user's memory or `CLAUDE.md` context affected both conditions. Some baseline answers visibly inherited verification discipline, likely strengthening the baseline.
- Reasoning effort was not pinned to the official harness setting.
- No per-call dollar ceiling was enforced.
- The result is one run, one judge, and six cases.

Treat the result as cross-model corroboration of a prompt-level effect, not a universal effect size or an executed multi-agent-system benchmark. The complete dimension scores, blind-label mapping, and judge rationales are retained in the [raw JSON](results/2026-09-01-claude-sonnet-informal.json).
