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
- enough account or API budget for 13 model calls with the default six-case suite.

```bash
npm run eval
npm run eval:codex
```

Optional controls:

```bash
node scripts/run-evals.mjs --runtime claude --model haiku --judge-model sonnet --max-budget-usd 0.05
node scripts/run-evals.mjs --runtime codex --model gpt-5.4-mini
node scripts/run-evals.mjs --limit 2
node scripts/run-evals.mjs --verify
```

Environment variables `APM_EVAL_RUNTIME`, `APM_EVAL_MODEL`, `APM_EVAL_JUDGE_MODEL`, `APM_EVAL_MAX_BUDGET_USD`, `APM_EVAL_CLAUDE`, and `APM_EVAL_CODEX` provide the same overrides.

## Interpretation

This is a prompt-level skill evaluation, not a benchmark of an executed multi-agent system. It does not reproduce Tran and Kiela's equal-thinking-token study or CooperBench. A single run is evidence about these prompts and model versions, not a universal effect size. Re-run after material skill changes and compare raw artifacts, not only aggregate scores.

`evals/results/latest.json` is the machine-readable record. `evals/RESULTS.md` is the generated summary committed with the repository.
