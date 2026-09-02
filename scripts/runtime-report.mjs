#!/usr/bin/env node
// Aggregate APM runtime-hook decisions without exposing prompts or worker text.

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

const args = process.argv.slice(2);
if (args.some((arg) => arg === "--help" || arg === "-h")) {
  console.log("usage: runtime-report.mjs [--json] [--root DIR] [FILE]");
  process.exit(0);
}
const rootIndex = args.indexOf("--root");
if (rootIndex !== -1 && !args[rootIndex + 1]) {
  console.error("runtime-report: --root requires a directory");
  process.exit(2);
}
const positional = args.filter((arg, index) => arg !== "--json" && arg !== "--root" && (rootIndex === -1 || index !== rootIndex + 1));
if (positional.length > 1) {
  console.error("runtime-report: expected at most one event file");
  process.exit(2);
}
const root = resolve(rootIndex === -1 ? process.cwd() : args[rootIndex + 1]);
const file = positional[0] ? resolve(positional[0]) : resolve(root, ".apm/runtime.jsonl");
if (!existsSync(file)) {
  console.error(`runtime-report: missing ${file}`);
  process.exit(2);
}

const events = [];
const errors = [];
for (const [index, line] of readFileSync(file, "utf8").split(/\r?\n/).entries()) {
  if (!line.trim()) continue;
  try {
    const event = JSON.parse(line);
    if (event.schema !== 1 || !event.hook || !event.action || !event.code) throw new Error("missing required event fields");
    events.push(event);
  } catch (error) {
    errors.push(`line ${index + 1}: ${error.message}`);
  }
}
if (errors.length) {
  console.error(`runtime-report: invalid event log: ${errors.slice(0, 3).join("; ")}`);
  process.exit(2);
}

const countBy = (key) => Object.fromEntries(Object.entries(events.reduce((counts, event) => {
  const value = String(event[key] ?? "unknown");
  counts[value] = (counts[value] ?? 0) + 1;
  return counts;
}, {})).sort());
const hasCode = (event, ...codes) => codes.includes(event.code);
const summary = {
  file,
  events: events.length,
  first_event_at: events[0]?.at ?? null,
  last_event_at: events.at(-1)?.at ?? null,
  sessions: new Set(events.map((event) => event.session)).size,
  scope_hashes: [...new Set(events.map((event) => event.scope_hash).filter(Boolean))].sort(),
  hooks: countBy("hook"),
  actions: countBy("action"),
  codes: countBy("code"),
  accepted_dispatches: events.filter((event) => hasCode(event, "DISPATCH_CONTRACT_OK", "DISPATCH_CONTRACT_NORMALIZED")).length,
  normalized_dispatches: events.filter((event) => event.code === "DISPATCH_CONTRACT_NORMALIZED").length,
  accepted_verifications: events.filter((event) => hasCode(event, "VERIFY_CONTRACT_OK", "VERIFY_CONTRACT_NORMALIZED")).length,
  normalized_verifications: events.filter((event) => event.code === "VERIFY_CONTRACT_NORMALIZED").length,
  denied_dispatches: events.filter((event) => event.action === "deny" && event.code !== "MANAGER_LEAF_TOOL_BLOCKED").length,
  manager_leaf_blocks: events.filter((event) => event.code === "MANAGER_LEAF_TOOL_BLOCKED").length,
  returned_workers: events.filter((event) => event.code === "WORK_REPORT_OK").length,
  returned_verifiers: events.filter((event) => event.code === "VERIFY_REPORT_OK").length,
  corrected_worker_returns: events.filter((event) => event.code === "MALFORMED_WORK_REPORT").length,
  corrected_verifier_returns: events.filter((event) => event.code === "MALFORMED_VERIFY_REPORT").length,
  manager_stop_blocks: events.filter((event) => hasCode(event, "MANAGER_DUTIES_REMAIN", "BOOTSTRAP_LEDGER_REQUIRED")).length,
  bootstrap_stop_blocks: events.filter((event) => event.code === "BOOTSTRAP_LEDGER_REQUIRED").length,
  verified_completions: events.filter((event) => event.code === "MANAGER_COMPLETE").length,
  emergency_releases: events.filter((event) => event.code === "NO_PROGRESS_GUARD").length,
};
summary.contract_normalizations = summary.normalized_dispatches + summary.normalized_verifications;
summary.manager_interventions = summary.denied_dispatches + summary.manager_leaf_blocks + summary.contract_normalizations + summary.corrected_worker_returns + summary.corrected_verifier_returns + summary.manager_stop_blocks;

if (args.includes("--json")) console.log(JSON.stringify(summary, null, 2));
else {
  console.log(`APM runtime events: ${summary.events}`);
  console.log(`Sessions: ${summary.sessions}`);
  console.log(`Dispatches accepted/denied: ${summary.accepted_dispatches}/${summary.denied_dispatches}`);
  console.log(`Dispatch contracts normalized: ${summary.normalized_dispatches}`);
  console.log(`Verification dispatches accepted: ${summary.accepted_verifications}`);
  console.log(`Verification contracts normalized: ${summary.normalized_verifications}`);
  console.log(`Contract normalizations: ${summary.contract_normalizations}`);
  console.log(`Manager leaf-tool blocks: ${summary.manager_leaf_blocks}`);
  console.log(`Worker reports accepted/corrected: ${summary.returned_workers}/${summary.corrected_worker_returns}`);
  console.log(`Verifier reports accepted/corrected: ${summary.returned_verifiers}/${summary.corrected_verifier_returns}`);
  console.log(`Manager stop blocks: ${summary.manager_stop_blocks}`);
  console.log(`Bootstrap stop blocks: ${summary.bootstrap_stop_blocks}`);
  console.log(`Manager interventions: ${summary.manager_interventions}`);
  console.log(`Verified completions: ${summary.verified_completions}`);
  console.log(`Emergency releases: ${summary.emergency_releases}`);
}
