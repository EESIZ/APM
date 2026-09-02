# Controlled A/B Evaluation

The harness measures whether injecting APM changes the quality of manager-agent responses.

## Conditions

- **No skill:** the selected model answers without APM instructions.
- **APM:** the same model receives the same prompt and settings, with `SKILL.md` loaded as manager instructions.
- **Judge:** the selected judge model receives anonymous `A` and `B` outputs in alternating order and scores both against the repository rubric.

The Claude runtime disables skills and tools in both conditions and appends APM only to the APM system instructions. The Codex runtime uses isolated temporary workspaces: no project instructions for the baseline and an `AGENTS.md` containing APM for the treatment. Both use the same target model and reasoning settings within a run. Claude uses the same dollar ceiling; Codex records observed tokens but does not expose a fixed token ceiling in this harness. Raw outputs, model identifiers, usage, cost when available, scores, and judge rationales are retained.

## Run

Requirements:

- Node.js 18 or newer;
- an authenticated `claude` CLI;
- enough account or API budget for the current fourteen-case suite and blinded judging.

```bash
npm run eval
npm run eval:codex
npm run test:recorded
```

Optional controls:

```bash
node scripts/run-evals.mjs --runtime claude --model haiku --judge-model sonnet --max-budget-usd 0.05
node scripts/run-evals.mjs --runtime codex --model gpt-5.4-mini
node scripts/run-evals.mjs --limit 2
node scripts/run-evals.mjs --verify
```

Environment variables `APM_EVAL_RUNTIME`, `APM_EVAL_MODEL`, `APM_EVAL_JUDGE_MODEL`, `APM_EVAL_MAX_BUDGET_USD`, `APM_EVAL_CLAUDE`, and `APM_EVAL_CODEX` provide the same overrides.

`npm test` validates repository, skill, and evaluation-fixture structure without rewriting historical results. `npm run test:recorded` additionally requires `evals/results/latest.json` to match the current `SKILL.md` and manager suite byte-for-byte. It is expected to fail after a skill or suite revision until a new controlled run replaces the recorded result; do not update stored hashes without running the models.

## Runtime Enforcement Tests

`npm test` also executes `tests/runtime-tests.mjs`. These cases run the actual hook processes with Claude Code-shaped JSON payloads and temporary ledgers. They verify manager leaf-tool blocking without disabling worker tools, nested-delegation denial, producer and verifier contract binding, bounded returns, manager Stop blocking across active states, strict default behavior, the optional emergency release, sibling-hook preservation, and runtime-log privacy.

During a live APM run, hook decisions append to `.apm/runtime.jsonl`. Aggregate the event stream with `node scripts/runtime-report.mjs --json`. It records activation and control interventions, not prompt text, worker messages, or proof that the produced artifact is correct. Compare these runtime metrics with task quality, elapsed time, tokens, and benchmark outcomes rather than treating intervention count alone as productivity.

## Interpretation

This is a prompt-level skill evaluation, not a benchmark of an executed multi-agent system. It does not reproduce Tran and Kiela's equal-thinking-token study or CooperBench. A single run is evidence about these prompts and model versions, not a universal effect size. Re-run after material skill changes and compare raw artifacts, not only aggregate scores.

`evals/results/latest.json` is the machine-readable record for the latest official harness run. `evals/RESULTS.md` is its generated summary committed with the repository.

## Additional Reproductions

[`CLAUDE-REPRODUCTION.md`](CLAUDE-REPRODUCTION.md) records an informal in-session reproduction using Claude Sonnet subagents as target and blinded judge. Its raw data is stored in [`results/2026-09-01-claude-sonnet-informal.json`](results/2026-09-01-claude-sonnet-informal.json).

Keep this result separate from official harness output. The reproduction inherited Claude Code's default system prompt and user context, did not pin effort or a per-call cost ceiling, and consists of one six-case run with one judge. It is useful as cross-model corroboration, not as a directly interchangeable benchmark result.

## Trigger Evaluation Set

[`trigger-evals.json`](trigger-evals.json) now treats an ordinary execution request received by a lead with worker tools as positive even when it appears small and contains no delegation language. Answer-only conversation and non-agent management remain negative. Use this set with a native skill-description trigger evaluation after changing the frontmatter; repository validation checks fixture shape but does not pretend to simulate Claude's router.

### Trigger Regression Evidence

An external harness report supplied on 2026-09-02 observed the skill installed and visible but invoked zero times in three settings: Sonnet 4.5 on ProjDevBench, Sonnet on an isolated CooperBench run, and an all-Haiku staged team run. In the Haiku tiktoken pilot, the team scored 1/2; the two patches became identical and the lead failed to preserve the second feature during integration. Reported cost was $0.44 over 13 minutes 43 seconds.

Those observations motivate `T7` through `T9` and `E13`; they are not stored as a controlled result because the raw harness artifacts are not in this repository. The revised claim is narrower: description routing must activate before the lead independently decides whether to delegate, and persistent hooks are required when probabilistic native routing is not strong enough.
