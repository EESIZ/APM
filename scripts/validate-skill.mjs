import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

function fail(message) {
  console.error(`skill validation failed: ${message}`);
  process.exit(1);
}

function read(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) fail(`missing ${relativePath}`);
  return fs.readFileSync(absolutePath, "utf8");
}

const skill = read("SKILL.md");
const frontmatter = skill.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
if (!frontmatter) fail("SKILL.md frontmatter is missing");

const yaml = frontmatter[1];
const name = yaml.match(/^name:\s*([^\r\n]+)$/m)?.[1]?.trim();
if (!name || !/^[a-z0-9-]{1,64}$/.test(name)) fail("invalid skill name");
if (name !== "a2a-manager-agent-orchestration") fail("unexpected skill name");

const descriptionStart = yaml.match(/^description:\s*>-\s*$/m);
if (!descriptionStart) fail("description must use a folded block scalar");
const yamlLines = yaml.split(/\r?\n/);
const descriptionIndex = yamlLines.findIndex((line) => /^description:\s*>-\s*$/.test(line));
const descriptionLines = [];
for (let index = descriptionIndex + 1; index < yamlLines.length; index += 1) {
  if (/^[A-Za-z0-9_-]+:\s*/.test(yamlLines[index])) break;
  descriptionLines.push(yamlLines[index]);
}
if (!descriptionLines.length || descriptionLines.some((line) => line && !/^\s{2,}\S/.test(line))) {
  fail("description block is not consistently indented");
}

const description = descriptionLines.map((line) => line.trim()).join(" ");
const requiredDescriptionText = [
  "worker agents",
  "split one deliverable",
  "report back",
  "Task or team tools",
  "without naming APM"
];
for (const text of requiredDescriptionText) {
  if (!description.includes(text)) fail(`description is missing trigger language: ${text}`);
}

const requiredHookText = [
  "hooks:",
  "PreToolUse:",
  "matcher: \"Agent|Task\"",
  "manager-hook.mjs\" pre-agent",
  "SubagentStop:",
  "manager-hook.mjs\" subagent-stop",
  "Stop:",
  "manager-hook.mjs\" stop"
];
for (const text of requiredHookText) {
  if (!yaml.includes(text)) fail(`frontmatter is missing runtime hook: ${text}`);
}

const requiredSkillText = [
  "## Choose Architecture First",
  "## Activation And Execution Rule",
  "## The Manager Must Be Unlazy",
  ".apm/runtime.jsonl",
  "## Five-Control Dispatch Gate",
  "## WHIPS Ledger",
  "Only the manager changes a unit to `VERIFIED`",
  "## Worker Dispatch Envelope",
  "## Worker Return Protocol",
  "APM WORK REPORT",
  "Return the worker to the account",
  "visible correction ladder",
  "no final completion while a required unit remains",
  "## Pair With unlazy",
  "## Failure Modes",
  "architecture choice"
];

for (const text of requiredSkillText) {
  if (!skill.includes(text)) fail(`SKILL.md is missing: ${text}`);
}

const whips = read("WHIPS.md");
const template = read("templates/WHIPS.md");
const states = ["WAITING", "READY", "IN-FLIGHT", "VERIFYING", "VERIFIED", "REWHIP", "DISCARDED", "ABANDONED"];
for (const state of states) {
  if (!whips.includes(state)) fail(`WHIPS.md is missing state ${state}`);
}

const fields = ["HANDLER:", "NEEDS:", "OWNS:", "INPUTS:", "OUTPUT:", "NORM:", "BUDGET:", "WATCH:", "INSPECTION:", "PROOF:", "DISPATCH:", "REPORT:", "ACCOUNT:", "STATE:", "EVIDENCE:"];
for (const field of fields) {
  if (!template.includes(field)) fail(`WHIPS template is missing ${field}`);
}

const markdownFiles = [
  "README.md",
  "SKILL.md",
  "WHIPS.md",
  "references/interoperability.md",
  "references/research.md",
  "references/history.md",
  "references/operational-controls.md",
  "references/origin.md",
  "references/launch.md",
  "THIRD_PARTY_NOTICES.md",
  "evals/README.md"
];

for (const markdownFile of markdownFiles) {
  const content = read(markdownFile);
  const linkPattern = /\[[^\]]+\]\(([^)]+\.md)\)/g;
  for (const match of content.matchAll(linkPattern)) {
    const target = path.resolve(root, path.dirname(markdownFile), match[1]);
    if (!fs.existsSync(target)) fail(`${markdownFile} links to missing ${match[1]}`);
  }
}

for (const script of ["scripts/manager-hook.mjs", "scripts/whips-check.mjs", "scripts/runtime-report.mjs", "scripts/install-hooks.mjs", "scripts/lib/whips.mjs"]) {
  read(script);
}

console.log("skill validation passed");
