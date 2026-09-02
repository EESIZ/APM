# Gates: APM 2.0 persistent-session redesign

OWNS: README.md, SKILL.md, WHIPS.md, templates/**, references/**, scripts/**, tests/**, evals/**, package.json, .gitignore, THIRD_PARTY_NOTICES.md, GATES.md

Scope: Replace forced one-shot orchestration with persistent multi-session project memory, context lifecycle, and succession while preserving the historical abstractions and the author's Korean statement.

- [x] G1: APM routes only for continuing multi-session projects, A2A session coordination, compaction, handoff, or explicit project audit.
  CHECK: node scripts/validate-skill.mjs
  EXPECT: skill validation passed
  EVIDENCE: frontmatter excludes hooks and ordinary one-shot activation; validator passed on 2026-09-02.

- [x] G2: Durable state distinguishes human directives, invariants, persistent sessions, workstreams, decisions, observations, context health, and two-phase handoffs.
  CHECK: node tests/project-state-tests.mjs
  EXPECT: all project-state tests passed
  EVIDENCE: 12/12 tests passed on the final implementation cycle.

- [x] G3: Runtime enforcement validates structured lifecycle state without parsing natural-language worker messages or blocking normal project tools.
  CHECK: node scripts/validate-repo.mjs
  EXPECT: repository validation passed
  EVIDENCE: v3/v4 hook, installer, runtime log, Markdown parser, and old runtime tests removed; `apmctl` installed.

- [x] G4: Evaluation distinguishes behavioral checks, routing, archived prompt evidence, and a longitudinal project protocol with a short overhead control.
  CHECK: node scripts/validate-evals.mjs
  EXPECT: evaluation fixtures valid
  EVIDENCE: three topology conditions, four project episodes, crossover metrics, and pilot/confirmatory sample plans validated.

- [x] G5: The author's Korean `진짜 출발점` section remains byte-equivalent after newline normalization.
  CHECK: node scripts/validate-repo.mjs
  EXPECT: repository validation passed
  EVIDENCE: SHA-256 remains 0656a4422c1edd2c1c62dd930c986cb68ec571db5aaf42f954fa72d006086448.

- [x] G6: The final repository diff is clean, all tests pass after residue cleanup, and the redesign is ready for commit.
  CHECK: npm test
  EXPECT: repository validation passed; skill validation passed; evaluation fixtures valid; all project-state tests passed
  EVIDENCE: `npm test` passed all repository, skill, evaluation, and 12/12 project-state checks on 2026-09-02.
