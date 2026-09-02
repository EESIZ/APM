import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

function fail(message) {
  console.error(`repository validation failed: ${message}`);
  process.exit(1);
}

function read(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) fail(`missing ${relativePath}`);
  return fs.readFileSync(absolutePath, "utf8");
}

const requiredFiles = [
  "README.md",
  ".gitignore",
  "LICENSE",
  "SKILL.md",
  "WHIPS.md",
  "templates/WHIPS.md",
  "templates/APM_PROJECT.json",
  "templates/SESSION_CHECKPOINT.md",
  "templates/HANDOFF.md",
  "references/interoperability.md",
  "references/research.md",
  "references/history.md",
  "references/operational-controls.md",
  "references/software-project-profile.md",
  "references/experiments.md",
  "references/origin.md",
  "references/launch.md",
  "THIRD_PARTY_NOTICES.md",
  "evals/evals.json",
  "evals/protocol.json",
  "evals/trigger-evals.json",
  "evals/README.md",
  "scripts/apmctl.mjs",
  "scripts/lib/project-state.mjs",
  "scripts/validate-skill.mjs",
  "scripts/validate-evals.mjs",
  "tests/project-state-tests.mjs",
  "package.json",
];

for (const file of requiredFiles) read(file);

for (const removed of [
  "scripts/manager-hook.mjs",
  "scripts/install-hooks.mjs",
  "scripts/runtime-report.mjs",
  "scripts/whips-check.mjs",
  "scripts/lib/whips.mjs",
  "tests/runtime-tests.mjs",
  "scripts/run-evals.mjs",
]) {
  if (fs.existsSync(path.join(root, removed))) fail(`obsolete hard-enforcement file remains: ${removed}`);
}

const license = read("LICENSE");
if (!license.startsWith("MIT License")) fail("LICENSE is not MIT");
if (!license.includes("Copyright (c) 2026 EESIZ")) fail("LICENSE owner or year is missing");

const readme = read("README.md");
const firstFortyLines = readme.split(/\r?\n/).slice(0, 40).join("\n");
if (!firstFortyLines.includes("npx skills add EESIZ/APM")) fail("install command is not near the top of README");
if (!readme.includes("AI 농장주에게 바치는 중간 관리자 매뉴얼")) fail("positioning line is missing");
if (!readme.includes("The redesign comes from the live workflow used to build **FiveGround**")) fail("live design target is missing");
if (!readme.includes("That design failed.")) fail("README does not disclose the falsified design");
if (!readme.includes("Use unlazy where a worker's current task benefits")) fail("unlazy boundary is missing");

const koreanOrigin = readme.match(/## 진짜 출발점\r?\n[\s\S]*?(?=\r?\n## The Real Starting Point)/)?.[0];
if (!koreanOrigin) fail("original Korean project statement is missing");
const normalizedOrigin = koreanOrigin.replace(/\r\n/g, "\n");
const originHash = createHash("sha256").update(normalizedOrigin, "utf8").digest("hex");
if (originHash !== "0656a4422c1edd2c1c62dd930c986cb68ec571db5aaf42f954fa72d006086448") {
  fail("author's Korean project statement changed");
}

const gitignore = read(".gitignore").split(/\r?\n/);
if (gitignore.includes(".apm/")) fail("durable APM project state is still ignored");
if (!gitignore.includes(".apm/local/")) fail("local APM runtime data is not ignored");

const researchLinks = [
  "https://arxiv.org/abs/2604.02460",
  "https://arxiv.org/abs/2601.13295",
  "https://www.anthropic.com/engineering/multi-agent-research-system",
  "https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/",
  "https://cognition.com/blog/multi-agents-working",
  "https://learn.microsoft.com/en-us/azure/durable-task/sdks/durable-agents-patterns",
];
for (const link of researchLinks) {
  if (!readme.includes(link)) fail(`README is missing primary source ${link}`);
}

const packageJson = JSON.parse(read("package.json"));
if (packageJson.version !== "2.0.0") fail("package version is not 2.0.0");
if (packageJson.license !== "MIT") fail("package.json license is not MIT");
for (const script of ["test", "test:state", "validate", "apm"]) {
  if (!packageJson.scripts?.[script]) fail(`package script is missing: ${script}`);
}
if (JSON.stringify(packageJson.scripts).includes("runtime-tests")) fail("package scripts still invoke the old runtime suite");

let template;
try {
  template = JSON.parse(read("templates/APM_PROJECT.json"));
} catch (error) {
  fail(`APM project template is invalid JSON: ${error.message}`);
}
if (template.schema_version !== 2) fail("APM project template schema is not version 2");
if (!Array.isArray(template.sessions) || template.sessions[0]?.role !== "manager") fail("APM project template lacks a manager session");

console.log("repository validation passed");
