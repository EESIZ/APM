import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

function fail(message) {
  console.error(`evaluation fixture validation failed: ${message}`);
  process.exit(1);
}

function readJson(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) fail(`missing ${relativePath}`);
  return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
}

const suite = readJson("evals/evals.json");
const dimensions = Object.keys(suite.rubric?.dimensions ?? {});
if (suite.schema_version !== 1) fail("unsupported manager suite schema");
if (suite.skill_name !== "a2a-manager-agent-orchestration") fail("unexpected manager suite skill name");
if (dimensions.length !== 6) fail("manager suite must define six rubric dimensions");
if (!Array.isArray(suite.evals) || suite.evals.length < 10) fail("manager suite must contain at least ten cases");
if (new Set(suite.evals.map((item) => item.id)).size !== suite.evals.length) fail("manager suite ids are not unique");

for (const item of suite.evals) {
  if (typeof item.prompt !== "string" || !item.prompt.trim()) fail(`${item.id} has no prompt`);
  if (!Array.isArray(item.expected_signals) || item.expected_signals.length < 2) fail(`${item.id} has too few expected signals`);
}

const triggers = readJson("evals/trigger-evals.json");
if (triggers.schema_version !== 1) fail("unsupported trigger suite schema");
if (triggers.skill_name !== suite.skill_name) fail("trigger suite skill name differs from manager suite");
if (!Array.isArray(triggers.evals) || triggers.evals.length < 10) fail("trigger suite must contain at least ten cases");
if (new Set(triggers.evals.map((item) => item.id)).size !== triggers.evals.length) fail("trigger suite ids are not unique");

for (const item of triggers.evals) {
  if (typeof item.prompt !== "string" || !item.prompt.trim()) fail(`${item.id} has no trigger prompt`);
  if (typeof item.should_trigger !== "boolean") fail(`${item.id} has no boolean should_trigger value`);
  if (typeof item.reason !== "string" || !item.reason.trim()) fail(`${item.id} has no trigger rationale`);
}

if (!triggers.evals.some((item) => item.should_trigger)) fail("trigger suite has no positive cases");
if (!triggers.evals.some((item) => !item.should_trigger)) fail("trigger suite has no negative cases");

console.log("evaluation fixture validation passed");
