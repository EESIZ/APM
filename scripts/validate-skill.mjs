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

if (!/^description:\s*>-\s*$/m.test(yaml)) fail("description must use a folded block scalar");
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
for (const text of [
  "long-running project",
  "multiple persistent agent sessions",
  "session-to-session A2A communication",
  "context compaction or session handoff",
  "Do not trigger for ordinary one-shot tasks",
]) {
  if (!description.includes(text)) fail(`description is missing routing language: ${text}`);
}

if (/^hooks:/m.test(yaml)) fail("hard runtime hooks remain in skill frontmatter");
for (const forbidden of [
  "every tool-using execution task",
  "even when the task appears small",
  "must not perform leaf work or choose single-agent execution",
  "manager-hook.mjs",
  "APM DISPATCH:",
]) {
  if (skill.includes(forbidden)) fail(`obsolete v3/v4 instruction remains: ${forbidden}`);
}

for (const text of [
  "## Activation Boundary",
  "## Prime Directive",
  "## The Five Operations",
  "## Durable Project State",
  "## Human Authority",
  "## Session Roles",
  "## Context Health",
  "## Worker Compaction",
  "## Manager Succession",
  "## A2A Message Semantics",
  "## Integration And Shared Workspaces",
  "## Failure Modes",
  "persistent worker sessions",
  "exact quotations",
  "two-phase handoff",
  "Never reject useful work because punctuation or capitalization differs",
  "It never means that every leaf must be delegated",
  "acceptance without inspection is blindness",
]) {
  if (!skill.toLowerCase().includes(text.toLowerCase())) fail(`SKILL.md is missing: ${text}`);
}

const lines = skill.split(/\r?\n/).length;
if (lines > 500) fail(`SKILL.md is too large for the entrypoint: ${lines} lines`);

const whips = read("WHIPS.md");
for (const text of [
  ".apm/project.json",
  "measured",
  "reported",
  "planned",
  "unknown",
  "Preparing a handoff does not transfer authority",
  "manager may coordinate and inspect but does not own production workstreams",
]) {
  if (!whips.includes(text)) fail(`WHIPS.md is missing: ${text}`);
}

const markdownFiles = [
  "README.md",
  "SKILL.md",
  "WHIPS.md",
  "references/interoperability.md",
  "references/research.md",
  "references/history.md",
  "references/operational-controls.md",
  "references/software-project-profile.md",
  "references/experiments.md",
  "references/origin.md",
  "references/launch.md",
  "THIRD_PARTY_NOTICES.md",
  "evals/README.md",
];

for (const markdownFile of markdownFiles) {
  const content = read(markdownFile);
  const linkPattern = /\[[^\]]+\]\(([^)]+\.(?:md|json))\)/g;
  for (const match of content.matchAll(linkPattern)) {
    if (/^https?:/i.test(match[1])) continue;
    const target = path.resolve(root, path.dirname(markdownFile), match[1]);
    if (!fs.existsSync(target)) fail(`${markdownFile} links to missing ${match[1]}`);
  }
}

for (const script of ["scripts/apmctl.mjs", "scripts/lib/project-state.mjs"]) read(script);

console.log("skill validation passed");
