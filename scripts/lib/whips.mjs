import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

export const STATES = new Set([
  "WAITING", "READY", "IN-FLIGHT", "VERIFYING", "VERIFIED",
  "REWHIP", "DISCARDED", "ABANDONED",
]);

export const HEADER_FIELDS = [
  "MISSION", "NON-NEGOTIABLES", "SYSTEM MAP", "DECISIONS",
  "MANAGER", "CONTEXT POLICY", "STOP", "ENFORCEMENT",
];

export const WORK_FIELDS = [
  "HANDLER", "VERIFIER", "NEEDS", "OWNS", "INPUTS", "CONTEXT LIMIT",
  "RETURN LIMIT", "REPLACE WHEN", "OUTPUT", "NORM", "BUDGET", "WATCH",
  "INSPECTION", "PROOF", "VERIFY INPUTS", "DISPATCH", "REPORT", "ACCOUNT",
  "VERIFY DISPATCH", "VERIFY REPORT", "STATE", "EVIDENCE",
];

export const REPORT_FIELDS = [
  "UNIT", "STATUS", "OUTPUTS", "UNFINISHED", "PROOF", "CHANGES",
  "ACCOUNT", "CONTEXT ACCOUNT", "ASSUMPTIONS", "RISKS", "MANAGER DECISION",
];

export const ORDER_FIELDS = [
  "USER OBJECTIVE", "WORK UNIT", "HANDLER ROLE", "NEEDS", "CONTEXT",
  "CONTEXT LIMIT", "RETURN LIMIT", "REPLACE WHEN", "OWNS", "DO NOT",
  "METHOD", "OUTPUT", "INSPECTION", "PROOF", "NORM", "BUDGET", "WATCH",
  "REPORT WHEN", "ESCALATE IF", "STOP WHEN",
];

export const VERIFY_ORDER_FIELDS = [
  "USER OBJECTIVE", "VERIFY UNIT", "VERIFIER ROLE", "CONTEXT", "ARTIFACTS",
  "INSPECTION", "PROOF", "CONTEXT LIMIT", "RETURN LIMIT", "STOP WHEN",
];

export const VERIFY_REPORT_FIELDS = [
  "UNIT", "VERDICT", "CHECKS", "PROOF", "GAPS", "CONTEXT ACCOUNT",
  "RISKS", "MANAGER DECISION",
];

const ORDER_ALIASES = new Map([
  ["USER OBJECTIVE", "USER OBJECTIVE"],
  ["WORK UNIT", "WORK UNIT"],
  ["HANDLER ROLE", "HANDLER ROLE"],
  ["NEEDS", "NEEDS"],
  ["CONTEXT", "CONTEXT"],
  ["CONTEXT AND ACCEPTED DECISIONS", "CONTEXT"],
  ["CONTEXT LIMIT", "CONTEXT LIMIT"],
  ["RETURN LIMIT", "RETURN LIMIT"],
  ["REPLACE WHEN", "REPLACE WHEN"],
  ["SCOPE / OWNS", "OWNS"],
  ["OWNS", "OWNS"],
  ["DO NOT", "DO NOT"],
  ["REQUIRED METHOD", "METHOD"],
  ["METHOD", "METHOD"],
  ["EXPECTED OUTPUT", "OUTPUT"],
  ["OUTPUT", "OUTPUT"],
  ["INSPECTION", "INSPECTION"],
  ["PROOF", "PROOF"],
  ["NORM", "NORM"],
  ["BUDGET", "BUDGET"],
  ["WATCH", "WATCH"],
  ["REPORT WHEN", "REPORT WHEN"],
  ["ESCALATE IF", "ESCALATE IF"],
  ["STOP WHEN", "STOP WHEN"],
]);

const VERIFY_ORDER_ALIASES = new Map(VERIFY_ORDER_FIELDS.map((field) => [field, field]));
const ORDER_NONE_ALLOWED = new Set(["NEEDS", "DO NOT", "ESCALATE IF"]);

function visibleLines(text) {
  const output = [];
  let fence = null;
  for (const line of String(text).split(/\r?\n/)) {
    const marker = line.match(/^\s*(`{3,}|~{3,})/);
    if (marker) {
      const token = marker[1];
      if (!fence) fence = { char: token[0], length: token.length };
      else if (token[0] === fence.char && token.length >= fence.length) fence = null;
      output.push("");
      continue;
    }
    output.push(fence ? "" : line);
  }
  return output;
}

export function isPending(value) {
  const text = String(value ?? "").trim();
  return !text || /^pending$/i.test(text) || /^unassigned$/i.test(text) || /^<[^>]+>$/.test(text);
}

function parseNeeds(value) {
  const text = String(value ?? "").trim();
  if (!text || /^none$/i.test(text)) return [];
  return text.split(",").map((item) => item.trim()).filter(Boolean);
}

function findCycles(units, errors) {
  const visiting = new Set();
  const visited = new Set();
  const byId = new Map(units.map((unit) => [unit.id, unit]));

  function visit(id, trail) {
    if (visiting.has(id)) {
      errors.push(`dependency cycle: ${[...trail, id].join(" -> ")}`);
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    const unit = byId.get(id);
    for (const dependency of unit?.needs ?? []) visit(dependency, [...trail, id]);
    visiting.delete(id);
    visited.add(id);
  }

  for (const unit of units) visit(unit.id, []);
}

export function parseWhips(text) {
  const lines = visibleLines(text);
  const header = lines.map((line) => line.match(/^# WHIPS:\s*(.+?)\s*$/)).find(Boolean);
  if (!header || /<[^>]+>/.test(header[1])) {
    return { active: false, scope: null, header: {}, units: [], errors: [], text: String(text) };
  }

  const units = [];
  const errors = [];
  const headerFields = {};
  let current = null;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const start = line.match(/^- \[([ xX])\]\s+([A-Za-z][A-Za-z0-9._-]*):\s*(.*?)\s*$/);
    if (start) {
      current = {
        id: start[2],
        title: start[3],
        checked: start[1].toLowerCase() === "x",
        fields: {},
        line: index + 1,
      };
      units.push(current);
      continue;
    }
    if (!current) {
      const field = line.match(/^([A-Z][A-Z0-9 _-]*):\s*(.*?)\s*$/);
      if (field) {
        if (Object.hasOwn(headerFields, field[1])) errors.push(`header repeats ${field[1]}`);
        else headerFields[field[1]] = field[2];
      }
      continue;
    }
    const field = line.match(/^\s{2}([A-Z][A-Z0-9 _-]*):\s*(.*?)\s*$/);
    if (field) {
      if (Object.hasOwn(current.fields, field[1])) errors.push(`${current.id} repeats ${field[1]}`);
      else current.fields[field[1]] = field[2];
    }
  }

  const seen = new Set();
  for (const unit of units) {
    if (seen.has(unit.id)) errors.push(`duplicate unit id ${unit.id}`);
    seen.add(unit.id);
    unit.state = String(unit.fields.STATE ?? "").trim().toUpperCase();
    unit.needs = parseNeeds(unit.fields.NEEDS);
    if (!STATES.has(unit.state)) errors.push(`${unit.id} has invalid STATE ${JSON.stringify(unit.fields.STATE ?? "")}`);
    if (unit.checked && !["VERIFIED", "DISCARDED", "ABANDONED"].includes(unit.state)) {
      errors.push(`${unit.id} has a checked box in non-terminal state ${unit.state || "missing"}`);
    }
  }

  const roots = units.filter((unit) => unit.id.toUpperCase() === "ROOT");
  if (roots.length !== 1) errors.push(`active ledger requires exactly one ROOT unit, found ${roots.length}`);
  const root = roots[0] ?? null;

  for (const field of HEADER_FIELDS) {
    if (!Object.hasOwn(headerFields, field) || isPending(headerFields[field])) errors.push(`header is missing ${field}`);
  }

  for (const unit of units) {
    for (const field of WORK_FIELDS) {
      if (!Object.hasOwn(unit.fields, field)) errors.push(`${unit.id} is missing ${field}`);
    }
    for (const dependency of unit.needs) {
      if (!seen.has(dependency)) errors.push(`${unit.id} NEEDS unknown unit ${dependency}`);
      if (dependency === unit.id) errors.push(`${unit.id} cannot depend on itself`);
    }
  }
  findCycles(units, errors);

  return { active: true, scope: header[1].trim(), header: headerFields, units, root, errors, text: String(text) };
}

function readyFields(unit) {
  return [
    "HANDLER", "VERIFIER", "OWNS", "INPUTS", "CONTEXT LIMIT", "RETURN LIMIT",
    "REPLACE WHEN", "OUTPUT", "NORM", "BUDGET", "WATCH", "INSPECTION", "PROOF",
    "VERIFY INPUTS",
  ]
    .filter((field) => isPending(unit.fields[field]) || (field !== "INPUTS" && /^none$/i.test(String(unit.fields[field]).trim())));
}

function evidenceRequired(unit, fields, errors) {
  for (const field of fields) {
    if (isPending(unit.fields[field])) errors.push(`${unit.id} ${unit.state} requires non-pending ${field}`);
  }
}

export function evaluateWhips(document) {
  if (!document.active) return { complete: true, errors: [], duties: [], counts: {}, document };
  const errors = [...document.errors];
  const duties = [];
  const byId = new Map(document.units.map((unit) => [unit.id, unit]));
  const counts = {};

  const dependenciesVerified = (unit) => unit.needs.every((id) => byId.get(id)?.state === "VERIFIED");

  for (const unit of document.units) {
    counts[unit.state] = (counts[unit.state] ?? 0) + 1;
    const depsReady = dependenciesVerified(unit);

    if (!isPending(unit.fields.HANDLER) && String(unit.fields.HANDLER).trim() === String(unit.fields.VERIFIER).trim()) {
      errors.push(`${unit.id} HANDLER and VERIFIER must be different agents`);
    }
    const returnLimit = String(unit.fields["RETURN LIMIT"] ?? "").trim().match(/^(\d{3,6})\s+chars$/i);
    if (!isPending(unit.fields["RETURN LIMIT"]) && !returnLimit) {
      errors.push(`${unit.id} RETURN LIMIT must use '<integer> chars'`);
    }

    if (["READY", "IN-FLIGHT", "VERIFYING", "VERIFIED", "REWHIP"].includes(unit.state)) {
      const missing = readyFields(unit);
      if (missing.length) errors.push(`${unit.id} ${unit.state} has unresolved dispatch fields: ${missing.join(", ")}`);
    }
    if (["READY", "IN-FLIGHT", "VERIFYING", "VERIFIED"].includes(unit.state) && !depsReady) {
      errors.push(`${unit.id} is ${unit.state} before NEEDS are VERIFIED`);
    }

    if (unit.state === "WAITING") {
      if (!unit.needs.length || depsReady) duties.push(`M-UNLOCK ${unit.id}: dependencies are satisfied; complete the contract and move to READY`);
    } else if (unit.state === "READY") {
      duties.push(`M-DISPATCH ${unit.id}: send the recorded work order now`);
    } else if (unit.state === "IN-FLIGHT") {
      evidenceRequired(unit, ["DISPATCH"], errors);
      duties.push(`M-WATCH ${unit.id}: execute WATCH=${unit.fields.WATCH || "missing"}; wait, poll, or follow up until a report arrives`);
    } else if (unit.state === "VERIFYING") {
      evidenceRequired(unit, ["DISPATCH", "REPORT", "ACCOUNT"], errors);
      if (isPending(unit.fields["VERIFY DISPATCH"])) {
        duties.push(`M-VERIFY ${unit.id}: dispatch the independent verifier; do not inspect or reproduce leaf work yourself`);
      } else if (isPending(unit.fields["VERIFY REPORT"])) {
        duties.push(`M-WATCH ${unit.id}: collect the independent verifier report`);
      } else {
        duties.push(`M-DECIDE ${unit.id}: accept PASS evidence as VERIFIED or issue REWHIP, reassignment, or discard`);
      }
    } else if (unit.state === "VERIFIED") {
      evidenceRequired(unit, ["DISPATCH", "REPORT", "ACCOUNT", "VERIFY DISPATCH", "VERIFY REPORT", "EVIDENCE"], errors);
      if (!/^PASS\b/i.test(String(unit.fields.EVIDENCE).trim())) errors.push(`${unit.id} VERIFIED EVIDENCE must begin with PASS`);
      if (!unit.checked) errors.push(`${unit.id} VERIFIED must use a checked box`);
    } else if (unit.state === "REWHIP") {
      evidenceRequired(unit, ["EVIDENCE"], errors);
      duties.push(`M-CORRECT ${unit.id}: issue the recorded REWHIP or revoke and reassign ownership`);
    } else if (["DISCARDED", "ABANDONED"].includes(unit.state)) {
      evidenceRequired(unit, ["EVIDENCE"], errors);
      if (!unit.checked) errors.push(`${unit.id} ${unit.state} must use a checked box`);
    }
  }

  if (document.root) {
    if (document.root.state === "DISCARDED") errors.push("ROOT cannot be DISCARDED");
    if (document.root.state === "VERIFIED" && !dependenciesVerified(document.root)) {
      errors.push("ROOT is VERIFIED before all dependencies are VERIFIED");
    }
  }

  const allTerminal = document.units.every((unit) => ["VERIFIED", "DISCARDED", "ABANDONED"].includes(unit.state));
  const rootTerminal = document.root && ["VERIFIED", "ABANDONED"].includes(document.root.state);
  return { complete: errors.length === 0 && allTerminal && rootTerminal, errors, duties, counts, document };
}

export function whipsCandidateFiles(root) {
  const project = resolve(root);
  const explicit = String(process.env.APM_WHIPS_PATH || "").trim();
  const candidates = explicit
    ? [resolve(project, explicit)]
    : [resolve(project, "WHIPS.md"), resolve(dirname(project), "shared", "WHIPS.md")];
  return [...new Set(candidates)];
}

export function loadWhips(root) {
  const candidates = whipsCandidateFiles(root);
  const loaded = candidates.filter((file) => existsSync(file)).map((file) => {
    const text = readFileSync(file, "utf8");
    return { file, exists: true, document: parseWhips(text) };
  });
  const selected = loaded.find((item) => item.document.active && item.document.errors.length === 0)
    || loaded.find((item) => item.document.active)
    || loaded[0];
  if (selected) return { ...selected, candidates };
  return { file: candidates[0], candidates, exists: false, document: parseWhips("") };
}

export function formatStatus(result) {
  if (!result.document.active) return "APM: no active WHIPS ledger.";
  const counts = Object.entries(result.counts).map(([state, count]) => `${state}=${count}`).join(" ");
  const lines = [`APM scope: ${result.document.scope}`, `States: ${counts || "none"}`];
  if (result.errors.length) lines.push("Invalid:", ...result.errors.map((item) => `  - ${item}`));
  if (result.duties.length) lines.push("Manager duties:", ...result.duties.map((item) => `  - ${item}`));
  if (result.complete) lines.push("Manager gate: COMPLETE");
  else lines.push("Manager gate: BLOCKED");
  return lines.join("\n");
}

function unitFrom(document, value) {
  if (typeof value === "object" && value?.id) return value;
  return document.units.find((unit) => unit.id === value) || null;
}

export function renderWorkOrder(document, value) {
  const unit = unitFrom(document, value);
  if (!unit) throw new Error(`cannot render unknown work unit ${value}`);
  return [
    `APM WORK ORDER: ${unit.id}`,
    `USER OBJECTIVE: ${document.header.MISSION}`,
    `WORK UNIT: ${unit.title}`,
    `HANDLER ROLE: ${unit.fields.HANDLER}`,
    `NEEDS: ${unit.fields.NEEDS}`,
    `CONTEXT: ${unit.fields.INPUTS}`,
    `CONTEXT LIMIT: ${unit.fields["CONTEXT LIMIT"]}`,
    `RETURN LIMIT: ${unit.fields["RETURN LIMIT"]}`,
    `REPLACE WHEN: ${unit.fields["REPLACE WHEN"]}`,
    `OWNS: ${unit.fields.OWNS}`,
    `DO NOT: violate these non-negotiables: ${document.header["NON-NEGOTIABLES"]}; modify outside OWNS; create child agents; self-certify`,
    "METHOD: execute only this bounded unit, preserve accepted decisions, and collect the recorded proof",
    `OUTPUT: ${unit.fields.OUTPUT}`,
    `INSPECTION: ${unit.fields.INSPECTION}`,
    `PROOF: ${unit.fields.PROOF}`,
    `NORM: ${unit.fields.NORM}`,
    `BUDGET: ${unit.fields.BUDGET}`,
    `WATCH: ${unit.fields.WATCH}`,
    "REPORT WHEN: complete | blocked | before scope change | at budget threshold",
    "ESCALATE IF: required input is missing or scope, ownership, context, or budget would be exceeded",
    "STOP WHEN: OUTPUT and PROOF satisfy NORM, or an evidenced blocker requires a manager decision",
    "Return exactly one report using this schema:",
    "APM WORK REPORT",
    `UNIT: ${unit.id}`,
    "STATUS: COMPLETE | BLOCKED | PARTIAL",
    "OUTPUTS: exact paths, patch, commit, findings, or none",
    "UNFINISHED: required work not completed, or none",
    "PROOF: command and exit code, source evidence, or observable check",
    "CHANGES: files, interfaces, and decisions changed",
    "ACCOUNT: norm achieved, budget used, and deviations",
    "CONTEXT ACCOUNT: context supplied, tool calls used, compaction or limit status",
    "ASSUMPTIONS: remaining assumptions or none",
    "RISKS: residual risks or none",
    "MANAGER DECISION: specific decision needed or none",
  ].join("\n");
}

export function renderVerifyOrder(document, value) {
  const unit = unitFrom(document, value);
  if (!unit) throw new Error(`cannot render unknown verify unit ${value}`);
  return [
    `APM VERIFY ORDER: ${unit.id}`,
    `USER OBJECTIVE: ${document.header.MISSION}`,
    `VERIFY UNIT: ${unit.title}`,
    `VERIFIER ROLE: ${unit.fields.VERIFIER}`,
    `CONTEXT: ${unit.fields["VERIFY INPUTS"]}`,
    `ARTIFACTS: ${unit.fields.OUTPUT}`,
    `INSPECTION: ${unit.fields.INSPECTION}`,
    `PROOF: ${unit.fields.PROOF}`,
    `CONTEXT LIMIT: ${unit.fields["CONTEXT LIMIT"]}`,
    `RETURN LIMIT: ${unit.fields["RETURN LIMIT"]}`,
    "STOP WHEN: decisive checks finish or an evidenced blocker requires a manager decision",
    "Return exactly one report using this schema:",
    "APM VERIFY REPORT",
    `UNIT: ${unit.id}`,
    "VERDICT: PASS | FAIL | BLOCKED",
    "CHECKS: checks actually performed",
    "PROOF: decisive evidence",
    "GAPS: missing or failed requirements, or none",
    "CONTEXT ACCOUNT: context supplied, tool calls used, compaction or limit status",
    "RISKS: residual risks or none",
    "MANAGER DECISION: specific correction or acceptance decision needed",
  ].join("\n");
}

export function parseWorkOrder(message) {
  const text = String(message ?? "");
  const trimmed = text.trim();
  const lines = trimmed.split(/\r?\n/);
  const first = lines[0]?.match(/^APM WORK ORDER:\s*([A-Za-z][A-Za-z0-9._-]*)\s*$/);
  const fields = {};
  const errors = [];

  if (!first) errors.push("first line must be APM WORK ORDER: <unit id>");
  if (lines.filter((line) => /^APM WORK ORDER:/.test(line.trim())).length !== 1) errors.push("expected exactly one APM WORK ORDER marker");

  const reportIndex = lines.findIndex((line) => line.trim() === "APM WORK REPORT");
  const orderLines = lines.slice(1, reportIndex === -1 ? lines.length : reportIndex);
  for (const line of orderLines) {
    const match = line.match(/^([A-Za-z][A-Za-z /]+):\s*(.*?)\s*$/);
    if (!match) continue;
    const field = ORDER_ALIASES.get(match[1].trim().toUpperCase());
    if (!field) continue;
    if (Object.hasOwn(fields, field)) errors.push(`duplicate ${field}`);
    else fields[field] = match[2];
  }
  for (const field of ORDER_FIELDS) {
    if (!Object.hasOwn(fields, field) || isPending(fields[field]) || (!ORDER_NONE_ALLOWED.has(field) && /^none$/i.test(String(fields[field]).trim()))) {
      errors.push(`missing ${field}`);
    }
  }

  return { text, unit: first?.[1] ?? null, fields, errors };
}

export function parseVerifyOrder(message) {
  const text = String(message ?? "");
  const lines = text.trim().split(/\r?\n/);
  const first = lines[0]?.match(/^APM VERIFY ORDER:\s*([A-Za-z][A-Za-z0-9._-]*)\s*$/);
  const fields = {};
  const errors = [];
  if (!first) errors.push("first line must be APM VERIFY ORDER: <unit id>");
  if (lines.filter((line) => /^APM VERIFY ORDER:/.test(line.trim())).length !== 1) errors.push("expected exactly one APM VERIFY ORDER marker");
  const reportIndex = lines.findIndex((line) => line.trim() === "APM VERIFY REPORT");
  for (const line of lines.slice(1, reportIndex === -1 ? lines.length : reportIndex)) {
    const match = line.match(/^([A-Za-z][A-Za-z /]+):\s*(.*?)\s*$/);
    if (!match) continue;
    const field = VERIFY_ORDER_ALIASES.get(match[1].trim().toUpperCase());
    if (!field) continue;
    if (Object.hasOwn(fields, field)) errors.push(`duplicate ${field}`);
    else fields[field] = match[2];
  }
  for (const field of VERIFY_ORDER_FIELDS) {
    if (!Object.hasOwn(fields, field) || isPending(fields[field]) || /^none$/i.test(String(fields[field]).trim())) errors.push(`missing ${field}`);
  }
  return { text, unit: first?.[1] ?? null, fields, errors };
}

export function parseWorkReport(message) {
  const text = String(message ?? "");
  const trimmed = text.trim();
  const lines = trimmed.split(/\r?\n/);
  const fields = {};
  const errors = [];

  if (lines[0] !== "APM WORK REPORT") errors.push("first line must be APM WORK REPORT");
  if (lines.filter((line) => line.trim() === "APM WORK REPORT").length !== 1) errors.push("expected exactly one APM WORK REPORT marker");

  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const match = line.match(/^([A-Z][A-Z ]+):\s*(.*?)\s*$/);
    if (!match) {
      errors.push(`unexpected report line ${JSON.stringify(line.slice(0, 80))}`);
      continue;
    }
    if (!REPORT_FIELDS.includes(match[1])) {
      errors.push(`unknown report field ${match[1]}`);
      continue;
    }
    if (Object.hasOwn(fields, match[1])) errors.push(`duplicate ${match[1]}`);
    else fields[match[1]] = match[2];
  }
  for (const field of REPORT_FIELDS) {
    if (!Object.hasOwn(fields, field) || isPending(fields[field])) errors.push(`missing ${field}`);
  }
  const status = String(fields.STATUS ?? "").toUpperCase();
  if (!new Set(["COMPLETE", "BLOCKED", "PARTIAL"]).has(status)) errors.push("STATUS must be COMPLETE, BLOCKED, or PARTIAL");
  if (status === "COMPLETE" && !/^none$/i.test(String(fields.UNFINISHED ?? "").trim())) {
    errors.push("COMPLETE report must state UNFINISHED: none");
  }
  if (status === "COMPLETE" && (/^none$/i.test(String(fields.OUTPUTS ?? "")) || /^none$/i.test(String(fields.PROOF ?? "")))) {
    errors.push("COMPLETE report requires outputs and proof");
  }
  if (/^none$/i.test(String(fields.ACCOUNT ?? "").trim())) errors.push("report requires a norm-versus-actual ACCOUNT");
  if (/^none$/i.test(String(fields["CONTEXT ACCOUNT"] ?? "").trim())) errors.push("report requires a CONTEXT ACCOUNT");
  if (["BLOCKED", "PARTIAL"].includes(status) && /^none$/i.test(String(fields.UNFINISHED ?? "").trim())) {
    errors.push(`${status} report must identify unfinished work`);
  }
  if (["BLOCKED", "PARTIAL"].includes(status) && /^none$/i.test(String(fields.PROOF ?? "").trim())) {
    errors.push(`${status} report requires evidence of the blocker or partial result`);
  }
  if (["BLOCKED", "PARTIAL"].includes(status) && /^none$/i.test(String(fields["MANAGER DECISION"] ?? "").trim())) {
    errors.push(`${status} report requires a manager decision or unblock request`);
  }
  return { text, fields, status, errors };
}

export function parseVerifyReport(message) {
  const text = String(message ?? "");
  const lines = text.trim().split(/\r?\n/);
  const fields = {};
  const errors = [];
  if (lines[0] !== "APM VERIFY REPORT") errors.push("first line must be APM VERIFY REPORT");
  if (lines.filter((line) => line.trim() === "APM VERIFY REPORT").length !== 1) errors.push("expected exactly one APM VERIFY REPORT marker");
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const match = line.match(/^([A-Z][A-Z ]+):\s*(.*?)\s*$/);
    if (!match) { errors.push(`unexpected verify report line ${JSON.stringify(line.slice(0, 80))}`); continue; }
    if (!VERIFY_REPORT_FIELDS.includes(match[1])) { errors.push(`unknown verify report field ${match[1]}`); continue; }
    if (Object.hasOwn(fields, match[1])) errors.push(`duplicate ${match[1]}`);
    else fields[match[1]] = match[2];
  }
  for (const field of VERIFY_REPORT_FIELDS) {
    if (!Object.hasOwn(fields, field) || isPending(fields[field])) errors.push(`missing ${field}`);
  }
  const verdict = String(fields.VERDICT ?? "").toUpperCase();
  if (!new Set(["PASS", "FAIL", "BLOCKED"]).has(verdict)) errors.push("VERDICT must be PASS, FAIL, or BLOCKED");
  if (verdict === "PASS" && /^none$/i.test(String(fields.PROOF ?? "").trim())) errors.push("PASS requires proof");
  if (verdict === "PASS" && !/^none$/i.test(String(fields.GAPS ?? "").trim())) errors.push("PASS requires GAPS: none");
  if (["FAIL", "BLOCKED"].includes(verdict) && /^none$/i.test(String(fields.GAPS ?? "").trim())) errors.push(`${verdict} requires gaps`);
  if (["FAIL", "BLOCKED"].includes(verdict) && /^none$/i.test(String(fields["MANAGER DECISION"] ?? "").trim())) errors.push(`${verdict} requires a manager decision`);
  if (/^none$/i.test(String(fields["CONTEXT ACCOUNT"] ?? "").trim())) errors.push("verify report requires a CONTEXT ACCOUNT");
  return { text, fields, verdict, errors };
}
