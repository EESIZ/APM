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
  "LICENSE",
  "SKILL.md",
  "WHIPS.md",
  "templates/WHIPS.md",
  "references/interoperability.md",
  "references/research.md",
  "references/history.md",
  "references/origin.md",
  "references/launch.md",
  "evals/evals.json",
  "evals/README.md",
  "package.json"
];

for (const file of requiredFiles) read(file);

const license = read("LICENSE");
if (!license.startsWith("MIT License")) fail("LICENSE is not MIT");
if (!license.includes("Copyright (c) 2026 EESIZ")) fail("LICENSE owner or year is missing");

const readme = read("README.md");
const firstFortyLines = readme.split(/\r?\n/).slice(0, 40).join("\n");
if (!firstFortyLines.includes("npx skills add EESIZ/APM")) fail("install command is not near the top of README");
if (!readme.includes("AI 농장주에게 바치는 중간 관리자 매뉴얼")) fail("positioning line is missing");
if (!readme.includes("Use APM as the manager and unlazy inside each substantial leaf.")) fail("unlazy interoperability summary is missing");

const researchLinks = [
  "https://arxiv.org/abs/2604.02460",
  "https://arxiv.org/abs/2601.13295",
  "https://www.anthropic.com/engineering/multi-agent-research-system",
  "https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/",
  "https://cognition.com/blog/multi-agents-working",
  "https://learn.microsoft.com/en-us/azure/durable-task/sdks/durable-agents-patterns"
];

for (const link of researchLinks) {
  if (!readme.includes(link)) fail(`README is missing primary source ${link}`);
}

if (/Stanford.{0,80}equal.{0,40}token/is.test(readme)) {
  fail("README appears to conflate the equal-token paper with Stanford CooperBench");
}

const packageJson = JSON.parse(read("package.json"));
if (packageJson.license !== "MIT") fail("package.json license is not MIT");
if (!packageJson.scripts?.test || !packageJson.scripts?.eval) fail("package scripts are incomplete");

const evals = JSON.parse(read("evals/evals.json"));
if (!Array.isArray(evals.evals) || evals.evals.length < 6) fail("evaluation suite is too small");
if (Object.keys(evals.rubric?.dimensions ?? {}).length !== 6) fail("evaluation rubric must have six dimensions");

console.log("repository validation passed");
