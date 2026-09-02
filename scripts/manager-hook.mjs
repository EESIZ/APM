#!/usr/bin/env node
// APM manager-runtime hook for Claude Code. Zero dependencies. Node 18+.
// The Stop-hook progress guard is adapted from unlazy by Leonxlnx (MIT).

import { createHash } from "node:crypto";
import {
  appendFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";
import {
  evaluateWhips, loadWhips, parseVerifyOrder, parseVerifyReport,
  parseWorkOrder, parseWorkReport, REPORT_FIELDS, VERIFY_REPORT_FIELDS,
} from "./lib/whips.mjs";

const MAX_BLOCKS = 6;
const mode = process.argv[2];
const allowEmergencyRelease = process.argv.includes("--allow-emergency-release");
const scriptDir = dirname(fileURLToPath(import.meta.url));

function sha256(value) {
  return createHash("sha256").update(String(value)).digest("hex");
}

function readPayload() {
  try { return JSON.parse(readFileSync(0, "utf8") || "{}"); }
  catch { return {}; }
}

function runtimeRoot(payload) {
  return resolve(process.env.CLAUDE_PROJECT_DIR || payload.cwd || process.cwd());
}

function allow(message) {
  if (message) console.log(JSON.stringify({ systemMessage: message }));
  process.exit(0);
}

function denyTool(reason) {
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: reason,
    },
  }));
  process.exit(0);
}

function block(reason) {
  console.log(JSON.stringify({ decision: "block", reason }));
  process.exit(0);
}

function activeRuntime(payload) {
  const root = runtimeRoot(payload);
  const loaded = loadWhips(root);
  const result = evaluateWhips(loaded.document);
  return { root, loaded, result };
}

function isSubagent(payload) {
  return Boolean(payload.agent_id || payload.agentId || payload.agent_type || payload.agentType);
}

function recordEvent(payload, root, result, event) {
  try {
    if (String(process.env.APM_RUNTIME_LOG).toLowerCase() === "off") return;
    const file = process.env.APM_RUNTIME_LOG || join(root, ".apm", "runtime.jsonl");
    mkdirSync(dirname(file), { recursive: true });
    appendFileSync(file, JSON.stringify({
      schema: 1,
      at: new Date().toISOString(),
      session: sha256(String(payload.session_id || payload.sessionId || "anonymous")).slice(0, 16),
      hook: payload.hook_event_name || mode,
      scope_hash: result.document.scope ? sha256(result.document.scope).slice(0, 16) : null,
      ledger: result.document.active ? sha256(result.document.text).slice(0, 16) : null,
      states: result.counts,
      ...event,
    }) + "\n", "utf8");
  } catch {
    // Telemetry must never change the hook decision.
  }
}

function parseReturnSchema(prompt) {
  const lines = String(prompt).split(/\r?\n/);
  const markers = lines.map((line, index) => line.trim() === "APM WORK REPORT" ? index : -1).filter((index) => index !== -1);
  const errors = [];
  const fields = {};
  if (markers.length !== 1) return { fields, errors: ["expected one standalone APM WORK REPORT marker"] };
  for (const line of lines.slice(markers[0] + 1)) {
    if (!line.trim()) continue;
    const match = line.match(/^([A-Z][A-Z ]+):\s*(.*?)\s*$/);
    if (!match || !REPORT_FIELDS.includes(match[1])) continue;
    if (Object.hasOwn(fields, match[1])) errors.push(`duplicate ${match[1]}`);
    else fields[match[1]] = match[2];
  }
  for (const field of REPORT_FIELDS) {
    if (!Object.hasOwn(fields, field) || !String(fields[field]).trim()) errors.push(`missing ${field}:`);
  }
  return { fields, errors };
}

function parseVerifyReturnSchema(prompt) {
  const lines = String(prompt).split(/\r?\n/);
  const markers = lines.map((line, index) => line.trim() === "APM VERIFY REPORT" ? index : -1).filter((index) => index !== -1);
  const errors = [];
  const fields = {};
  if (markers.length !== 1) return { fields, errors: ["expected one standalone APM VERIFY REPORT marker"] };
  for (const line of lines.slice(markers[0] + 1)) {
    if (!line.trim()) continue;
    const match = line.match(/^([A-Z][A-Z ]+):\s*(.*?)\s*$/);
    if (!match || !VERIFY_REPORT_FIELDS.includes(match[1])) continue;
    if (Object.hasOwn(fields, match[1])) errors.push(`duplicate ${match[1]}`);
    else fields[match[1]] = match[2];
  }
  for (const field of VERIFY_REPORT_FIELDS) {
    if (!Object.hasOwn(fields, field) || !String(fields[field]).trim()) errors.push(`missing ${field}:`);
  }
  return { fields, errors };
}

function reportLimit(unit) {
  const match = String(unit?.fields?.["RETURN LIMIT"] ?? "").trim().match(/^(\d{3,6})\s+chars$/i);
  return match ? Number(match[1]) : null;
}

function contractDrift(order, unit, document, verify = false) {
  const bindings = verify ? [
    ["USER OBJECTIVE", document.header.MISSION],
    ["VERIFY UNIT", unit.title],
    ["VERIFIER ROLE", unit.fields.VERIFIER],
    ["CONTEXT", unit.fields["VERIFY INPUTS"]],
    ["ARTIFACTS", unit.fields.OUTPUT],
    ["INSPECTION", unit.fields.INSPECTION],
    ["PROOF", unit.fields.PROOF],
    ["CONTEXT LIMIT", unit.fields["CONTEXT LIMIT"]],
    ["RETURN LIMIT", unit.fields["RETURN LIMIT"]],
  ] : [
    ["USER OBJECTIVE", document.header.MISSION],
    ["WORK UNIT", unit.title],
    ["HANDLER ROLE", unit.fields.HANDLER],
    ["NEEDS", unit.fields.NEEDS],
    ["CONTEXT", unit.fields.INPUTS],
    ["CONTEXT LIMIT", unit.fields["CONTEXT LIMIT"]],
    ["RETURN LIMIT", unit.fields["RETURN LIMIT"]],
    ["REPLACE WHEN", unit.fields["REPLACE WHEN"]],
    ["OWNS", unit.fields.OWNS],
    ["OUTPUT", unit.fields.OUTPUT],
    ["INSPECTION", unit.fields.INSPECTION],
    ["PROOF", unit.fields.PROOF],
    ["NORM", unit.fields.NORM],
    ["BUDGET", unit.fields.BUDGET],
    ["WATCH", unit.fields.WATCH],
  ];
  return bindings.filter(([field, expected]) => String(order.fields[field]).trim() !== String(expected).trim()).map(([field]) => field);
}

function preAgent(payload) {
  const { root, result } = activeRuntime(payload);
  const deny = (code, reason, unit = null) => {
    recordEvent(payload, root, result, { action: "deny", code, unit });
    denyTool(reason);
  };
  if (isSubagent(payload)) {
    deny("WORKER_NESTED_DELEGATION", "APM reporting hierarchy: a worker cannot create child agents or redefine the work tree. Return a blocker or manager decision request so the manager can allocate another bounded unit.");
  }
  if (!result.document.active) {
    deny("NO_LEDGER", "APM manager gate: create an active WHIPS.md from the template before dispatching an Agent. Load APM, define the unit, norm, budget, watch cadence, proof, and return contract, then retry.");
  }
  if (result.errors.length) {
    deny("INVALID_LEDGER", `APM manager gate: WHIPS.md is invalid: ${result.errors.slice(0, 3).join("; ")}. Repair the ledger before dispatch.`);
  }

  const prompt = typeof payload.tool_input?.prompt === "string" ? payload.tool_input.prompt : "";
  const verify = /^APM VERIFY ORDER:/m.test(prompt.split(/\r?\n/, 1)[0] || "");
  const order = verify ? parseVerifyOrder(prompt) : parseWorkOrder(prompt);
  if (order.errors.length) {
    deny(verify ? "NO_VERIFY_ORDER" : "NO_WORK_ORDER", `APM manager gate: malformed ${verify ? "verify" : "work"} order: ${order.errors.slice(0, 5).join("; ")}. Dispatch the full non-empty envelope, not a role and task sentence.`, order.unit);
  }

  const unit = result.document.units.find((item) => item.id === order.unit);
  if (!unit) deny("UNKNOWN_UNIT", `APM manager gate: work unit ${order.unit} does not exist in the active ledger.`, order.unit);
  const allowedStates = verify ? ["VERIFYING"] : ["READY", "REWHIP"];
  if (!allowedStates.includes(unit.state)) {
    deny("BAD_STATE", `APM manager gate: ${unit.id} is ${unit.state}, not ${allowedStates.join(" or ")}. Resolve dependencies and state before dispatch.`, unit.id);
  }

  const returnSchema = verify ? parseVerifyReturnSchema(prompt) : parseReturnSchema(prompt);
  if (returnSchema.errors.length) {
    deny("INCOMPLETE_ENVELOPE", `APM manager gate: ${unit.id} dispatch does not carry a complete return contract: ${returnSchema.errors.slice(0, 5).join("; ")}.`, unit.id);
  }
  const drift = contractDrift(order, unit, result.document, verify);
  if (String(returnSchema.fields.UNIT).trim() !== unit.id) drift.push("REPORT UNIT");
  if (verify) {
    const verdicts = String(returnSchema.fields.VERDICT).toUpperCase();
    if (!["PASS", "FAIL", "BLOCKED"].every((verdict) => verdicts.includes(verdict))) drift.push("REPORT VERDICT");
  } else {
    const statuses = String(returnSchema.fields.STATUS).toUpperCase();
    if (!["COMPLETE", "BLOCKED", "PARTIAL"].every((status) => statuses.includes(status))) drift.push("REPORT STATUS");
  }
  if (drift.length) {
    deny("CONTRACT_DRIFT", `APM manager gate: ${unit.id} prompt drifts from WHIPS.md in ${drift.join(", ")}. Carry the exact ledger values into the order.`, unit.id);
  }

  const code = verify ? "VERIFY_CONTRACT_OK" : "DISPATCH_CONTRACT_OK";
  recordEvent(payload, root, result, { action: "allow", code, unit: unit.id });
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      additionalContext: verify
        ? `APM dispatched independent verification for ${unit.id}. Record VERIFY DISPATCH and VERIFY REPORT, then accept only a PASS verdict with decisive evidence.`
        : `APM dispatched ${unit.id}. After return, record DISPATCH and REPORT, compare ACCOUNT and CONTEXT ACCOUNT with the limits, and move only to VERIFYING before a fresh verifier is dispatched.`,
    },
  }));
  process.exit(0);
}

function subagentStop(payload) {
  const { root, result } = activeRuntime(payload);
  if (!result.document.active) {
    recordEvent(payload, root, result, { action: "allow", code: "NO_ACTIVE_LEDGER", unit: null });
    allow(null);
  }

  const message = payload.last_assistant_message || "";
  const verify = String(message).trimStart().startsWith("APM VERIFY REPORT");
  const report = verify ? parseVerifyReport(message) : parseWorkReport(message);
  const unit = result.document.units.find((item) => item.id === report.fields.UNIT);
  const errors = [...report.errors];
  if (!unit) errors.push(`UNIT ${report.fields.UNIT || "missing"} is not an active unit`);
  else if (verify && unit.state !== "VERIFYING") errors.push(`${unit.id} is ${unit.state}, not awaiting independent verification`);
  else if (!verify && !["READY", "IN-FLIGHT", "REWHIP"].includes(unit.state)) errors.push(`${unit.id} is ${unit.state}, not a returning worker state`);
  const limit = reportLimit(unit);
  if (limit && String(message).length > limit) errors.push(`report length ${String(message).length} exceeds RETURN LIMIT ${limit} chars`);

  if (errors.length) {
    const code = verify ? "MALFORMED_VERIFY_REPORT" : "MALFORMED_WORK_REPORT";
    recordEvent(payload, root, result, { action: "block", code, unit: report.fields.UNIT || null, report_chars: String(message).length });
    block(`APM ${verify ? "verifier" : "worker"} return gate: the manager cannot account for this return. ` + errors.slice(0, 5).join("; ") +
      `. Continue only as needed to return one complete ${verify ? "APM VERIFY REPORT" : "APM WORK REPORT"} within the context return limit. Do not perform root integration.`);
  }
  recordEvent(payload, root, result, { action: "allow", code: verify ? "VERIFY_REPORT_OK" : "WORK_REPORT_OK", unit: unit.id, report_chars: String(message).length });
  allow(null);
}

function controlPath(root, value) {
  if (typeof value !== "string" || !value.trim()) return false;
  const absolute = resolve(root, value);
  const ledger = resolve(root, "WHIPS.md");
  const runtime = resolve(root, ".apm");
  return absolute === ledger || absolute.startsWith(runtime + "\\") || absolute.startsWith(runtime + "/") || /[\\/]templates[\\/]WHIPS\.md$/i.test(absolute);
}

function preManagerTool(payload) {
  const { root, result } = activeRuntime(payload);
  const tool = String(payload.tool_name || payload.toolName || "unknown");
  const input = payload.tool_input || {};
  if (isSubagent(payload)) {
    recordEvent(payload, root, result, { action: "allow", code: "WORKER_LEAF_TOOL_OK", unit: null, tool });
    allow(null);
  }
  const deny = (reason) => {
    recordEvent(payload, root, result, { action: "deny", code: "MANAGER_LEAF_TOOL_BLOCKED", unit: null, tool });
    const activation = result.document.active ? "" : " Load a2a-manager-agent-orchestration and create WHIPS.md before retrying.";
    denyTool(`APM context firewall: ${reason}${activation} The manager may update WHIPS.md, read bounded reports, run APM control scripts, and dispatch or supervise agents. Assign leaf execution to a worker.`);
  };

  if (/^TaskCreate$/i.test(tool)) {
    if (!result.document.active || result.errors.length) {
      deny(`${tool} cannot substitute for an active valid WHIPS.md; externalize the mission, system map, decisions, and units first.`);
    }
    const prompt = String(input.description || "");
    const verify = prompt.trimStart().startsWith("APM VERIFY ORDER:");
    const order = verify ? parseVerifyOrder(prompt) : parseWorkOrder(prompt);
    const schema = verify ? parseVerifyReturnSchema(prompt) : parseReturnSchema(prompt);
    const unit = result.document.units.find((item) => item.id === order.unit);
    const allowedStates = verify ? ["VERIFYING"] : ["READY", "REWHIP"];
    const errors = [...order.errors, ...schema.errors];
    if (!unit) errors.push(`unknown unit ${order.unit || "missing"}`);
    else {
      if (!allowedStates.includes(unit.state)) errors.push(`${unit.id} is ${unit.state}, expected ${allowedStates.join(" or ")}`);
      errors.push(...contractDrift(order, unit, result.document, verify));
      if (String(schema.fields.UNIT).trim() !== unit.id) errors.push("REPORT UNIT");
      if (verify) {
        const verdicts = String(schema.fields.VERDICT).toUpperCase();
        if (!["PASS", "FAIL", "BLOCKED"].every((verdict) => verdicts.includes(verdict))) errors.push("REPORT VERDICT");
      } else {
        const statuses = String(schema.fields.STATUS).toUpperCase();
        if (!["COMPLETE", "BLOCKED", "PARTIAL"].every((status) => statuses.includes(status))) errors.push("REPORT STATUS");
      }
    }
    if (errors.length) deny(`${tool} must carry an exact ledger-backed ${verify ? "verification" : "producer"} contract: ${errors.slice(0, 4).join("; ")}.`);
    recordEvent(payload, root, result, { action: "allow", code: verify ? "TASK_VERIFY_CONTRACT_OK" : "TASK_CONTRACT_OK", unit: unit.id, tool });
    allow(null);
  }
  if (/^(TaskGet|TaskUpdate|TaskList|TodoWrite|TeamCreate|TeamDelete)$/i.test(tool)) {
    if (!result.document.active || result.errors.length) {
      deny(`${tool} is allowed only as a secondary control surface backed by an active valid WHIPS.md.`);
    }
    recordEvent(payload, root, result, { action: "allow", code: "MANAGER_TASK_MIRROR_OK", unit: null, tool });
    allow(null);
  }
  if (/^(Read|Write|Edit|MultiEdit|NotebookEdit)$/i.test(tool)) {
    const paths = [input.file_path, input.path, input.notebook_path].filter((value) => typeof value === "string");
    if (paths.length && paths.every((value) => controlPath(root, value))) {
      recordEvent(payload, root, result, { action: "allow", code: "MANAGER_CONTROL_FILE_OK", unit: null, tool });
      allow(null);
    }
    deny(`${tool} would expose the manager to leaf artifacts or let it perform leaf work.`);
  }
  if (/^(Bash|Shell)$/i.test(tool)) {
    const command = String(input.command || "");
    const safeControl = /(whips-check|runtime-report)\.mjs/i.test(command) && !/[;&|<>`$()\r\n]/.test(command);
    if (safeControl) {
      recordEvent(payload, root, result, { action: "allow", code: "MANAGER_CONTROL_COMMAND_OK", unit: null, tool });
      allow(null);
    }
    deny(`${tool} is limited to the APM checker and runtime reporter while the manager role is active.`);
  }
  deny(`${tool} is a leaf exploration or execution tool.`);
}

function statePath(root) {
  const base = process.env.APM_HOOK_STATE_DIR || join(tmpdir(), "apm-runtime-hooks");
  mkdirSync(base, { recursive: true });
  return join(base, `${sha256(root).slice(0, 24)}.json`);
}

function readState(file) {
  try {
    const state = JSON.parse(readFileSync(file, "utf8"));
    if (state && typeof state === "object" && state.sessions && typeof state.sessions === "object") return state;
  } catch { /* new or corrupt state */ }
  return { schema: 1, sessions: {} };
}

function writeState(file, state) {
  writeFileSync(file, JSON.stringify(state, null, 2) + "\n", "utf8");
}

function clearSession(file, sessionKey) {
  if (!existsSync(file)) return;
  const state = readState(file);
  delete state.sessions[sessionKey];
  if (!Object.keys(state.sessions).length) rmSync(file, { force: true });
  else writeState(file, state);
}

function stop(payload) {
  const { root, result } = activeRuntime(payload);
  const sessionKey = sha256(String(payload.session_id || payload.sessionId || "anonymous")).slice(0, 24);
  const file = statePath(root);
  if (!result.document.active) {
    clearSession(file, sessionKey);
    recordEvent(payload, root, result, { action: "allow", code: "NO_ACTIVE_LEDGER", unit: null });
    allow(null);
  }
  if (result.complete) {
    clearSession(file, sessionKey);
    recordEvent(payload, root, result, { action: "allow", code: "MANAGER_COMPLETE", unit: "ROOT" });
    allow("APM manager gate: root and all required units have terminal, auditable dispositions.");
  }

  const outstanding = [...result.errors.map((item) => `INVALID ${item}`), ...result.duties];
  const contentHash = sha256(result.document.text + "\0" + outstanding.join("\0")).slice(0, 24);
  const state = readState(file);
  let current = state.sessions[sessionKey];
  if (!current || current.hash !== contentHash) current = { hash: contentHash, blocks: 0 };
  current.blocks += 1;
  current.updatedAt = new Date().toISOString();
  state.sessions[sessionKey] = current;
  state.sessions = Object.fromEntries(Object.entries(state.sessions)
    .sort((a, b) => String(b[1].updatedAt).localeCompare(String(a[1].updatedAt))).slice(0, 64));
  writeState(file, state);

  if (allowEmergencyRelease && current.blocks > MAX_BLOCKS) {
    recordEvent(payload, root, result, { action: "release", code: "NO_PROGRESS_GUARD", unit: null, blocks: current.blocks, outstanding: outstanding.length });
    allow(`APM manager gate emergency release after ${MAX_BLOCKS} unchanged blocks; ${outstanding.length} duty item(s) remain. The run is not verified.`);
  }

  const list = outstanding.slice(0, 6).join(" | ") + (outstanding.length > 6 ? ` | +${outstanding.length - 6} more` : "");
  recordEvent(payload, root, result, { action: "block", code: "MANAGER_DUTIES_REMAIN", unit: null, blocks: current.blocks, outstanding: outstanding.length });
  block(`APM manager gate: you are not done. ${list}. Execute the next manager action, update WHIPS.md with actual evidence, then run ` +
    `node "${join(scriptDir, "whips-check.mjs")}" --status. Do not replace supervision with a status narrative.`);
}

const payload = readPayload();
try {
  if (mode === "pre-agent") preAgent(payload);
  else if (mode === "pre-manager-tool") preManagerTool(payload);
  else if (mode === "subagent-stop") subagentStop(payload);
  else if (mode === "stop") stop(payload);
  else {
    console.error("manager-hook: expected pre-agent, pre-manager-tool, subagent-stop, or stop");
    process.exit(2);
  }
} catch (error) {
  const reason = `APM runtime gate failed closed: ${error.message}. Repair the hook or ledger before continuing.`;
  if (mode === "pre-agent" || mode === "pre-manager-tool") denyTool(reason);
  if (mode === "subagent-stop" || mode === "stop") block(reason);
  console.error(reason);
  process.exit(2);
}
