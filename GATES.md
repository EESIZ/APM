# Gates: APM manager-discipline release

OWNS: README.md, LICENSE, SKILL.md, WHIPS.md, references/**, templates/**, scripts/**, evals/**, GATES.md

Scope: Reposition, package, evaluate, and publish APM as the manager-side discipline for orchestrator-plus-isolated-subagent systems.

- [x] G1: The repository has an MIT license, install-first English README, verified research positioning, and discoverability metadata.
  CHECK: node scripts/validate-repo.mjs
  EXPECT: repository validation passed
  EVIDENCE: exit=0; shell=C:\WINDOWS\system32\cmd.exe; cwd=E:\APM; path=28c828a71423/52 entries; output=repository validation passed

- [x] G2: The skill frontmatter, WHIPS protocol, template routing, and unlazy interoperability contract are structurally valid.
  CHECK: node scripts/validate-skill.mjs
  EXPECT: skill validation passed
  EVIDENCE: exit=0; shell=C:\WINDOWS\system32\cmd.exe; cwd=E:\APM; path=28c828a71423/52 entries; output=skill validation passed

- [x] G3: The same evaluation prompts have been run in no-skill and APM conditions and scored with a reproducible rubric.
  CHECK: node scripts/run-evals.mjs --verify
  EXPECT: evaluation verification passed
  EVIDENCE: exit=0; shell=C:\WINDOWS\system32\cmd.exe; cwd=E:\APM; path=28c828a71423/52 entries; output=evaluation verification passed

- [x] G4: Every consequential research or ecosystem claim in the README points to a primary source and avoids unsupported inevitability claims.
  EVIDENCE: Reviewed 2026-09-01 against arXiv 2604.02460, Stanford/SAP CooperBench arXiv 2601.13295, and official Anthropic, OpenAI, Cognition, and Microsoft publications. The README separates source findings from APM inference and corrects the Stanford/equal-token conflation.

- [x] G5: GitHub topics are configured and the verified commit is present on origin/main.
  EVIDENCE: GitHub reported MIT License and topics a2a, agent-orchestration, agent-skill, claude-skill, multi-agent, subagents, and manager-agent. origin/main resolved to 404410e99901433f52164be4553e869ae74ad0fb. `npx --yes skills add EESIZ/APM --list` discovered exactly one skill named a2a-manager-agent-orchestration.
