import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

function fail(message) {
  console.error(`evaluation validation failed: ${message}`);
  process.exit(1);
}

function load(relativePath) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
  } catch (error) {
    fail(`${relativePath}: ${error.message}`);
  }
}

function uniqueIds(items, label) {
  const ids = items.map((item) => item.id);
  if (ids.some((id) => typeof id !== "string" || !id)) fail(`${label} contains a missing id`);
  if (new Set(ids).size !== ids.length) fail(`${label} ids are not unique`);
}

const evals = load("evals/evals.json");
if (evals.schema_version !== 2) fail("evals.json schema must be version 2");
if (!Array.isArray(evals.evals) || evals.evals.length < 10) fail("behavioral evaluation suite is too small");
if (Object.keys(evals.rubric?.dimensions ?? {}).length !== 6) fail("behavioral rubric must have six dimensions");
uniqueIds(evals.evals, "behavioral eval");
for (const item of evals.evals) {
  if (!item.prompt || !Array.isArray(item.expected_signals) || item.expected_signals.length < 2) {
    fail(`${item.id} lacks a prompt or expected signals`);
  }
}
if (!evals.evals.some((item) => item.prompt.includes("오타 하나"))) fail("suite lacks a short-task restraint case");
if (!evals.evals.some((item) => item.prompt.includes("manager-2"))) fail("suite lacks manager succession");
if (!evals.evals.some((item) => item.prompt.includes("compact"))) fail("suite lacks worker compaction");

const triggers = load("evals/trigger-evals.json");
if (triggers.schema_version !== 2) fail("trigger schema must be version 2");
if (!Array.isArray(triggers.evals) || triggers.evals.length < 20) fail("trigger suite needs at least 20 cases");
uniqueIds(triggers.evals, "trigger eval");
const positives = triggers.evals.filter((item) => item.should_trigger === true);
const negatives = triggers.evals.filter((item) => item.should_trigger === false);
if (positives.length < 8 || negatives.length < 8) fail("trigger suite needs balanced positive and negative coverage");
if (!positives.some((item) => /인수인계|handoff/i.test(item.prompt))) fail("trigger suite lacks succession routing");
if (!negatives.some((item) => item.prompt.includes("README 오타"))) fail("trigger suite lacks one-shot routing restraint");
if (triggers.evals.some((item) => typeof item.reason !== "string" || !item.reason)) fail("trigger reason is missing");

const protocol = load("evals/protocol.json");
if (protocol.schema_version !== 1) fail("protocol schema must be version 1");
if (!protocol.hypothesis?.includes("Persistent hierarchical sessions")) fail("longitudinal hypothesis is missing");
if (!Array.isArray(protocol.conditions) || protocol.conditions.length < 3) fail("protocol needs at least three conditions");
if (!protocol.conditions.some((item) => item.id === "single-session")) fail("protocol lacks single-session control");
if (!protocol.conditions.some((item) => item.id === "persistent-apm")) fail("protocol lacks persistent APM treatment");
if (!Array.isArray(protocol.episodes) || protocol.episodes.length < 4) fail("protocol needs longitudinal and short-control episodes");
uniqueIds(protocol.episodes, "protocol episode");
if (!protocol.episodes.some((item) => item.tasks <= 2)) fail("protocol lacks a short overhead control");
if (!protocol.episodes.some((item) => item.planned_events.some((event) => event.includes("replace the manager")))) {
  fail("protocol lacks manager succession event");
}
if (!protocol.metrics?.crossover || !protocol.metrics?.primary?.length) fail("protocol lacks primary and crossover metrics");
if (!protocol.sample_plan?.pilot || !protocol.sample_plan?.confirmatory) fail("protocol lacks sample plan");

console.log("evaluation fixtures valid");
