#!/usr/bin/env node
// APM manager-runtime hook for Claude Code. Zero dependencies. Node 18+.
// The Stop-hook progress guard is adapted from unlazy by Leonxlnx (MIT).

import { createHash } from "node:crypto";
import {
  appendFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";
import {
  evaluateWhips, loadWhips, parseVerifyOrder, parseVerifyReport,
  parseWorkOrder, parseWorkReport, renderVerifyOrder, renderWorkOrder,
  REPORT_FIELDS, VERIFY_REPORT_FIELDS,
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

function allowTool(updatedInput = null, additionalContext = null) {
  const hookSpecificOutput = { hookEventName: "PreToolUse" };
  if (updatedInput) hookSpecificOutput.updatedInput = updatedInput;
  if (additionalContext) hookSpecificOutput.additionalContext = additionalContext;
  console.log(JSON.stringify({ hookSpecificOutput }));
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

function explicitDispatchIntent(prompt) {
  const match = String(prompt).match(/^\s*APM\s+(WORK\s+ORDER|VERIFY\s+ORDER|DISPATCH|VERIFY)\s*:\s*([A-Za-z][A-Za-z0-9._-]*)\s*$/im);
  if (!match) return null;
  return {
    unit: match[2],
    verify: /^VERIFY/i.test(match[1]),
  };
}

function inferDispatchIntent(prompt, result) {
  const explicit = explicitDispatchIntent(prompt);
  if (explicit) return explicit;

  const eligible = result.document.units.filter((unit) => ["READY", "REWHIP", "VERIFYING"].includes(unit.state));
  const referenced = eligible.filter((unit) => new RegExp(`(^|[^A-Za-z0-9._-])${unit.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^A-Za-z0-9._-]|$)`, "i").test(String(prompt)));
  const candidates = referenced.length === 1 ? referenced : eligible.length === 1 ? eligible : [];
  if (candidates.length !== 1) return null;
  return { unit: candidates[0].id, verify: candidates[0].state === "VERIFYING" };
}

function dispatchHelp(result, preferred = null) {
  const eligible = result.document.units.filter((unit) => ["READY", "REWHIP", "VERIFYING"].includes(unit.state));
  const unit = preferred || eligible[0];
  if (!unit) return "No producer or verifier unit is dispatchable. Run whips-check and resolve the next ledger duty.";
  const verify = unit.state === "VERIFYING";
  const shorthand = verify ? `APM VERIFY: ${unit.id}` : `APM DISPATCH: ${unit.id}`;
  const example = verify ? renderVerifyOrder(result.document, unit) : renderWorkOrder(result.document, unit);
  return `Retry with the one-line prompt ${JSON.stringify(shorthand)}; the hook expands it from WHIPS.md. Exact canonical envelope:\n${example}`;
}

function prepareDispatch(result, prompt) {
  const intent = inferDispatchIntent(prompt, result);
  if (!intent) {
    return { errors: ["cannot determine one ledger unit and dispatch role"], help: dispatchHelp(result) };
  }

  const unit = result.document.units.find((item) => item.id === intent.unit);
  if (!unit) return { errors: [`unknown unit ${intent.unit}`], help: dispatchHelp(result) };
  const allowedStates = intent.verify ? ["VERIFYING"] : ["READY", "REWHIP"];
  if (!allowedStates.includes(unit.state)) {
    return {
      errors: [`${unit.id} is ${unit.state}, not ${allowedStates.join(" or ")}`],
      unit,
      help: dispatchHelp(result, unit),
    };
  }

  const order = intent.verify ? parseVerifyOrder(prompt) : parseWorkOrder(prompt);
  const schema = intent.verify ? parseVerifyReturnSchema(prompt) : parseReturnSchema(prompt);
  const repair = [...order.errors, ...schema.errors];
  if (!order.errors.length) repair.push(...contractDrift(order, unit, result.document, intent.verify));
  if (String(schema.fields.UNIT || "").trim() !== unit.id) repair.push("REPORT UNIT");
  if (intent.verify) {
    const verdicts = String(schema.fields.VERDICT || "").toUpperCase();
    if (!["PASS", "FAIL", "BLOCKED"].every((verdict) => verdicts.includes(verdict))) repair.push("REPORT VERDICT");
  } else {
    const statuses = String(schema.fields.STATUS || "").toUpperCase();
    if (!["COMPLETE", "BLOCKED", "PARTIAL"].every((status) => statuses.includes(status))) repair.push("REPORT STATUS");
  }

  return {
    errors: [],
    unit,
    verify: intent.verify,
    canonical: intent.verify ? renderVerifyOrder(result.document, unit) : renderWorkOrder(result.document, unit),
    repair: [...new Set(repair)],
  };
}

function preAgent(payload) {
  const { root, loaded, result } = activeRuntime(payload);
  const deny = (code, reason, unit = null) => {
    recordEvent(payload, root, result, { action: "deny", code, unit });
    denyTool(reason);
  };
  if (isSubagent(payload)) {
    deny("WORKER_NESTED_DELEGATION", "APM reporting hierarchy: a worker cannot create child agents or redefine the work tree. Return a blocker or manager decision request so the manager can allocate another bounded unit.");
  }
  if (!result.document.active) {
    markExecutionRequired(payload, root);
    deny("NO_LEDGER", `APM manager gate: create an active WHIPS.md before dispatching an Agent. Accepted ledger paths: ${loaded.candidates.join(", ")}. Load APM, define the unit, norm, budget, watch cadence, proof, and return contract, then retry.`);
  }
  if (result.errors.length) {
    deny("INVALID_LEDGER", `APM manager gate: WHIPS.md is invalid: ${result.errors.slice(0, 8).join("; ")}. Repair the ledger, then run node ${JSON.stringify(join(scriptDir, "whips-check.mjs"))} --status. A trailing 2>&1 is allowed.`);
  }

  const prompt = typeof payload.tool_input?.prompt === "string" ? payload.tool_input.prompt : "";
  const prepared = prepareDispatch(result, prompt);
  if (prepared.errors.length) {
    deny("DISPATCH_INTENT_INVALID", `APM manager gate: ${prepared.errors.join("; ")}. ${prepared.help}`, prepared.unit?.id || null);
  }

  const repaired = prepared.repair.length > 0;
  const code = prepared.verify
    ? repaired ? "VERIFY_CONTRACT_NORMALIZED" : "VERIFY_CONTRACT_OK"
    : repaired ? "DISPATCH_CONTRACT_NORMALIZED" : "DISPATCH_CONTRACT_OK";
  recordEvent(payload, root, result, { action: "allow", code, unit: prepared.unit.id, repaired_fields: prepared.repair.length });
  const context = prepared.verify
    ? `APM dispatched independent verification for ${prepared.unit.id}${repaired ? " with a ledger-normalized contract" : ""}. Record VERIFY DISPATCH and VERIFY REPORT, then accept only a PASS verdict with decisive evidence.`
    : `APM dispatched ${prepared.unit.id}${repaired ? " with a ledger-normalized contract" : ""}. After return, record DISPATCH and REPORT, compare ACCOUNT and CONTEXT ACCOUNT with the limits, and move only to VERIFYING before a fresh verifier is dispatched.`;
  allowTool(repaired ? { ...payload.tool_input, prompt: prepared.canonical } : null, context);
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

function controlPath(root, loaded, value) {
  if (typeof value !== "string" || !value.trim()) return false;
  const absolute = resolve(root, value);
  const runtime = resolve(root, ".apm");
  return loaded.candidates.includes(absolute) || absolute.startsWith(runtime + "\\") || absolute.startsWith(runtime + "/") || /[\\/]templates[\\/]WHIPS\.md$/i.test(absolute);
}

function tokenizeControlCommand(command) {
  const tokens = [];
  let current = "";
  let quote = null;
  for (const char of command) {
    if (quote) {
      if (char === quote) quote = null;
      else current += char;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
    } else if (/\s/.test(char)) {
      if (current) { tokens.push(current); current = ""; }
    } else if (/[;&|<>`$()]/.test(char)) {
      return null;
    } else {
      current += char;
    }
  }
  if (quote) return null;
  if (current) tokens.push(current);
  return tokens;
}

function isSafeControlCommand(command) {
  const normalized = String(command).trim().replace(/\s+2>\s*&1\s*$/, "");
  if (/[;&|<>`$()\r\n]/.test(normalized)) return false;
  const tokens = tokenizeControlCommand(normalized);
  if (!tokens || tokens.length < 2) return false;
  if (!/^node(?:\.exe)?$/i.test(basename(tokens[0]))) return false;
  return /^(?:whips-check|runtime-report)\.mjs$/i.test(basename(tokens[1]));
}

function preManagerTool(payload) {
  const { root, loaded, result } = activeRuntime(payload);
  const tool = String(payload.tool_name || payload.toolName || "unknown");
  const input = payload.tool_input || {};
  if (isSubagent(payload)) {
    recordEvent(payload, root, result, { action: "allow", code: "WORKER_LEAF_TOOL_OK", unit: null, tool });
    allow(null);
  }
  const deny = (reason) => {
    if (!result.document.active) markExecutionRequired(payload, root);
    recordEvent(payload, root, result, { action: "deny", code: "MANAGER_LEAF_TOOL_BLOCKED", unit: null, tool });
    const activation = result.document.active ? "" : " Load a2a-manager-agent-orchestration and create WHIPS.md before retrying.";
    denyTool(`APM context firewall: ${reason}${activation} The manager may update WHIPS.md, read bounded reports, run APM control scripts, and dispatch or supervise agents. Assign leaf execution to a worker.`);
  };

  if (/^TaskCreate$/i.test(tool)) {
    if (!result.document.active || result.errors.length) {
      deny(`${tool} cannot substitute for an active valid WHIPS.md; externalize the mission, system map, decisions, and units first.`);
    }
    const prompt = String(input.description || "");
    const prepared = prepareDispatch(result, prompt);
    if (prepared.errors.length) deny(`${tool} cannot identify a valid ledger dispatch: ${prepared.errors.join("; ")}. ${prepared.help}`);
    const repaired = prepared.repair.length > 0;
    const code = prepared.verify
      ? repaired ? "TASK_VERIFY_CONTRACT_NORMALIZED" : "TASK_VERIFY_CONTRACT_OK"
      : repaired ? "TASK_CONTRACT_NORMALIZED" : "TASK_CONTRACT_OK";
    recordEvent(payload, root, result, { action: "allow", code, unit: prepared.unit.id, tool, repaired_fields: prepared.repair.length });
    if (repaired) {
      allowTool({ ...input, description: prepared.canonical }, `APM normalized TaskCreate for ${prepared.unit.id} from the active ledger.`);
    }
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
    if (paths.length && paths.every((value) => controlPath(root, loaded, value))) {
      recordEvent(payload, root, result, { action: "allow", code: "MANAGER_CONTROL_FILE_OK", unit: null, tool });
      allow(null);
    }
    deny(`${tool} would expose the manager to leaf artifacts or let it perform leaf work.`);
  }
  if (/^(Bash|Shell)$/i.test(tool)) {
    const command = String(input.command || "");
    if (isSafeControlCommand(command)) {
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

function sessionKey(payload) {
  return sha256(String(payload.session_id || payload.sessionId || "anonymous")).slice(0, 24);
}

function markExecutionRequired(payload, root) {
  const file = statePath(root);
  const key = sessionKey(payload);
  const state = readState(file);
  state.sessions[key] = {
    ...(state.sessions[key] || {}),
    executionRequired: true,
    updatedAt: new Date().toISOString(),
  };
  writeState(file, state);
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
  const key = sessionKey(payload);
  const file = statePath(root);
  if (!result.document.active) {
    const state = readState(file);
    if (state.sessions[key]?.executionRequired) {
      const current = state.sessions[key];
      current.bootstrapBlocks = (current.bootstrapBlocks || 0) + 1;
      current.updatedAt = new Date().toISOString();
      writeState(file, state);
      recordEvent(payload, root, result, { action: "block", code: "BOOTSTRAP_LEDGER_REQUIRED", unit: null, blocks: current.bootstrapBlocks });
      block("APM manager gate: an execution tool was attempted, so this session cannot finish without an active WHIPS.md. Create the ledger at the project root or sibling shared/WHIPS.md, then dispatch the recorded work. Do not replace execution with a failure narrative.");
    }
    clearSession(file, key);
    recordEvent(payload, root, result, { action: "allow", code: "NO_ACTIVE_LEDGER", unit: null });
    allow(null);
  }
  if (result.complete) {
    clearSession(file, key);
    recordEvent(payload, root, result, { action: "allow", code: "MANAGER_COMPLETE", unit: "ROOT" });
    allow("APM manager gate: root and all required units have terminal, auditable dispositions.");
  }

  const outstanding = [...result.errors.map((item) => `INVALID ${item}`), ...result.duties];
  const contentHash = sha256(result.document.text + "\0" + outstanding.join("\0")).slice(0, 24);
  const state = readState(file);
  let current = state.sessions[key];
  if (!current || current.hash !== contentHash) current = { hash: contentHash, blocks: 0 };
  current.blocks += 1;
  current.updatedAt = new Date().toISOString();
  state.sessions[key] = current;
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
