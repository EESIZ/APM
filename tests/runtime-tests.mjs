import {
  mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const hook = join(root, "scripts", "manager-hook.mjs");
const checker = join(root, "scripts", "whips-check.mjs");
const installer = join(root, "scripts", "install-hooks.mjs");
const runtimeReporter = join(root, "scripts", "runtime-report.mjs");

function sandbox() {
  const base = mkdtempSync(join(tmpdir(), "apm-runtime-test-"));
  const dir = join(base, "repo");
  const shared = join(base, "shared");
  const state = join(base, "hook-state");
  mkdirSync(dir, { recursive: true });
  mkdirSync(shared, { recursive: true });
  mkdirSync(state, { recursive: true });
  return {
    base,
    dir,
    shared,
    state,
    write(relative, text) {
      const file = join(dir, relative);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, text, "utf8");
    },
    writeShared(relative, text) {
      const file = join(shared, relative);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, text, "utf8");
    },
    read(relative) { return readFileSync(join(dir, relative), "utf8"); },
    cleanup() { rmSync(base, { recursive: true, force: true }); },
  };
}

function run(file, args, { cwd, input = "", env = {} } = {}) {
  const result = spawnSync(process.execPath, [file, ...args], {
    cwd,
    input,
    encoding: "utf8",
    windowsHide: true,
    env: { ...process.env, ...env },
  });
  return { code: result.status, out: result.stdout || "", err: result.stderr || "" };
}

function ledger({ unit = "READY", rootState = "WAITING", malformed = false, verifyDispatched = false, verifyReported = false } = {}) {
  const unitDone = unit === "VERIFIED";
  const rootDone = rootState === "VERIFIED";
  const dispatch = ["IN-FLIGHT", "VERIFYING", "VERIFIED"].includes(unit) ? "agent-1 at 2026-09-01T00:00:00Z" : "pending";
  const report = ["VERIFYING", "VERIFIED"].includes(unit) ? "agent-1 APM WORK REPORT" : "pending";
  const account = ["VERIFYING", "VERIFIED"].includes(unit) ? "norm met; budget 4 minutes; no deviation" : "pending";
  const verifyDispatch = unitDone || verifyDispatched ? "agent-2 at 2026-09-01T00:05:00Z" : "pending";
  const verifyReport = unitDone || verifyReported ? "agent-2 APM VERIFY REPORT PASS" : "pending";
  const evidence = unitDone ? "PASS npm test exit=0 output=PASS" : unit === "REWHIP" ? "missing proof on first return" : "pending";
  const rootEvidence = rootDone ? "PASS root test exit=0 output=ROOT_PASS" : "pending";
  const rootNeeds = malformed ? "MISSING" : "W1";
  return `# WHIPS: runtime-test

MISSION: finish one feature
NON-NEGOTIABLES: preserve public interfaces
SYSTEM MAP: W1 produces the feature and ROOT integrates it
DECISIONS: use the existing module boundary
MANAGER: orchestrator
CONTEXT POLICY: manager retains only mission, map, decisions, state, budgets, and bounded reports
STOP: ROOT is VERIFIED or ABANDONED with evidence
ENFORCEMENT: manager performs no leaf work and every producer has a different verifier
AUDIT CADENCE: after every return and before every dependent dispatch

- [${unitDone ? "x" : " "}] W1: implement feature
  HANDLER: worker-1
  VERIFIER: verifier-1
  NEEDS: none
  OWNS: src/a.js
  INPUTS: accepted plan v1
  CONTEXT LIMIT: 8000 tokens and 12 tool calls
  RETURN LIMIT: 4000 chars
  REPLACE WHEN: compaction, repeated loop, or context limit
  OUTPUT: patch src/a.js
  NORM: one passing feature
  BUDGET: 10 minutes
  WATCH: wait 30 seconds, then recontact
  INSPECTION: inspect src/a.js diff
  PROOF: npm test => PASS
  VERIFY INPUTS: src/a.js patch and accepted plan v1
  DISPATCH: ${dispatch}
  REPORT: ${report}
  ACCOUNT: ${account}
  VERIFY DISPATCH: ${verifyDispatch}
  VERIFY REPORT: ${verifyReport}
  STATE: ${unit}
  EVIDENCE: ${evidence}

## Integration

- [${rootDone ? "x" : " "}] ROOT: integrated feature
  HANDLER: root-integrator
  VERIFIER: root-verifier
  NEEDS: ${rootNeeds}
  OWNS: src/a.js
  INPUTS: verified W1 patch
  CONTEXT LIMIT: 8000 tokens and 12 tool calls
  RETURN LIMIT: 4000 chars
  REPLACE WHEN: compaction, repeated loop, or context limit
  OUTPUT: integrated src/a.js
  NORM: integrated feature with no regression
  BUDGET: 10 minutes
  WATCH: wait 30 seconds, then recontact
  INSPECTION: inspect interfaces and regressions
  PROOF: npm run test:root => ROOT_PASS
  VERIFY INPUTS: integrated src/a.js and root requirements
  DISPATCH: ${rootDone ? "root-agent at 2026-09-01T00:10:00Z" : "pending"}
  REPORT: ${rootDone ? "root-agent APM WORK REPORT" : "pending"}
  ACCOUNT: ${rootDone ? "root norm met within budget" : "pending"}
  VERIFY DISPATCH: ${rootDone ? "root-verifier at 2026-09-01T00:15:00Z" : "pending"}
  VERIFY REPORT: ${rootDone ? "root-verifier APM VERIFY REPORT PASS" : "pending"}
  STATE: ${rootState}
  EVIDENCE: ${rootEvidence}
`;
}

function workOrder({ complete = true } = {}) {
  if (!complete) return `APM WORK ORDER: W1
USER OBJECTIVE: finish one feature
WORK UNIT: implement feature`;
  return `APM WORK ORDER: W1
USER OBJECTIVE: finish one feature
WORK UNIT: implement feature
HANDLER ROLE: worker-1
NEEDS: none
CONTEXT: accepted plan v1
CONTEXT LIMIT: 8000 tokens and 12 tool calls
RETURN LIMIT: 4000 chars
REPLACE WHEN: compaction, repeated loop, or context limit
OWNS: src/a.js
DO NOT: change public interfaces
METHOD: implement the bounded feature and test it
OUTPUT: patch src/a.js
INSPECTION: inspect src/a.js diff
PROOF: npm test => PASS
NORM: one passing feature
BUDGET: 10 minutes
WATCH: wait 30 seconds, then recontact
REPORT WHEN: complete, blocked, before scope change, or at budget threshold
ESCALATE IF: required input is missing
STOP WHEN: the report is complete or a blocker is evidenced
Return exactly one report using this schema:
APM WORK REPORT
UNIT: W1
STATUS: COMPLETE | BLOCKED | PARTIAL
OUTPUTS: exact paths, patch, commit, findings, or none
UNFINISHED: required work not completed, or none
PROOF: command and exit code, source evidence, or observable check
CHANGES: files, interfaces, and decisions changed
ACCOUNT: norm achieved, budget used, and deviations
CONTEXT ACCOUNT: context supplied, tool calls used, compaction or limit status
ASSUMPTIONS: remaining assumptions or none
RISKS: residual risks or none
MANAGER DECISION: specific decision needed or none`;
}

function report({ complete = true } = {}) {
  if (!complete) return "Done. Everything looks good.";
  return `APM WORK REPORT
UNIT: W1
STATUS: COMPLETE
OUTPUTS: src/a.js patch
UNFINISHED: none
PROOF: npm test exit=0 output=PASS
CHANGES: src/a.js
ACCOUNT: norm met; budget 4 minutes; no deviations
CONTEXT ACCOUNT: 1200 input tokens; 4 tool calls; no compaction; within limit
ASSUMPTIONS: none
RISKS: none
MANAGER DECISION: none`;
}

function verifyOrder() {
  return `APM VERIFY ORDER: W1
USER OBJECTIVE: finish one feature
VERIFY UNIT: implement feature
VERIFIER ROLE: verifier-1
CONTEXT: src/a.js patch and accepted plan v1
ARTIFACTS: patch src/a.js
INSPECTION: inspect src/a.js diff
PROOF: npm test => PASS
CONTEXT LIMIT: 8000 tokens and 12 tool calls
RETURN LIMIT: 4000 chars
STOP WHEN: decisive checks finish or a blocker is evidenced
Return exactly one report using this schema:
APM VERIFY REPORT
UNIT: W1
VERDICT: PASS | FAIL | BLOCKED
CHECKS: checks actually performed
PROOF: decisive evidence
GAPS: missing or failed requirements, or none
CONTEXT ACCOUNT: context supplied, tool calls used, compaction or limit status
RISKS: residual risks or none
MANAGER DECISION: specific correction or acceptance decision needed`;
}

function verifyReport() {
  return `APM VERIFY REPORT
UNIT: W1
VERDICT: PASS
CHECKS: inspected src/a.js and ran npm test
PROOF: npm test exit=0 output=PASS
GAPS: none
CONTEXT ACCOUNT: 900 input tokens; 3 tool calls; no compaction; within limit
RISKS: none
MANAGER DECISION: accept W1`;
}

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }
function assert(condition, message) { if (!condition) throw new Error(message); }
function json(text) { return JSON.parse(text); }

test("PreToolUse blocks Agent dispatch without an active ledger", () => {
  const s = sandbox();
  try {
    const result = run(hook, ["pre-agent"], {
      cwd: s.dir,
      input: JSON.stringify({ cwd: s.dir, tool_input: { prompt: workOrder() } }),
      env: { APM_HOOK_STATE_DIR: s.state },
    });
    assert(json(result.out).hookSpecificOutput.permissionDecision === "deny", result.out + result.err);
  } finally { s.cleanup(); }
});

test("PreToolUse gives the checker command for an invalid ledger", () => {
  const s = sandbox();
  try {
    s.write("WHIPS.md", ledger({ malformed: true }));
    const result = run(hook, ["pre-agent"], {
      cwd: s.dir,
      input: JSON.stringify({ cwd: s.dir, tool_input: { prompt: "APM DISPATCH: W1" } }),
      env: { APM_HOOK_STATE_DIR: s.state },
    });
    const reason = json(result.out).hookSpecificOutput.permissionDecisionReason;
    assert(reason.includes("whips-check.mjs") && reason.includes("2>&1"), result.out + result.err);
  } finally { s.cleanup(); }
});

test("PreToolUse normalizes an incomplete worker contract from the ledger", () => {
  const s = sandbox();
  try {
    s.write("WHIPS.md", ledger());
    const result = run(hook, ["pre-agent"], {
      cwd: s.dir,
      input: JSON.stringify({ cwd: s.dir, tool_input: { prompt: workOrder({ complete: false }), description: workOrder() } }),
      env: { APM_HOOK_STATE_DIR: s.state },
    });
    const output = json(result.out).hookSpecificOutput;
    assert(!output.permissionDecision, result.out + result.err);
    assert(output.updatedInput.prompt.startsWith("APM WORK ORDER: W1\n"), result.out + result.err);
    assert(output.updatedInput.prompt.includes("HANDLER ROLE: worker-1"), result.out + result.err);
    assert(output.updatedInput.prompt.includes("CONTEXT: accepted plan v1"), result.out + result.err);
    assert(output.updatedInput.prompt.includes("STATUS: COMPLETE | BLOCKED | PARTIAL"), result.out + result.err);
    assert(output.updatedInput.prompt.match(/^USER OBJECTIVE:/gm).length === 1, result.out + result.err);
    assert(output.additionalContext.includes("normalized"), result.out + result.err);
  } finally { s.cleanup(); }
});

test("PreToolUse expands a one-line producer dispatch shorthand", () => {
  const s = sandbox();
  try {
    s.write("WHIPS.md", ledger());
    const result = run(hook, ["pre-agent"], {
      cwd: s.dir,
      input: JSON.stringify({ cwd: s.dir, tool_input: { prompt: "APM DISPATCH: W1" } }),
      env: { APM_HOOK_STATE_DIR: s.state },
    });
    const output = json(result.out).hookSpecificOutput;
    assert(!output.permissionDecision && output.updatedInput.prompt.includes("APM WORK REPORT"), result.out + result.err);
  } finally { s.cleanup(); }
});

test("PreToolUse expands a one-line verifier dispatch shorthand", () => {
  const s = sandbox();
  try {
    s.write("WHIPS.md", ledger({ unit: "VERIFYING" }));
    const result = run(hook, ["pre-agent"], {
      cwd: s.dir,
      input: JSON.stringify({ cwd: s.dir, tool_input: { prompt: "APM VERIFY: W1" } }),
      env: { APM_HOOK_STATE_DIR: s.state },
    });
    const output = json(result.out).hookSpecificOutput;
    assert(!output.permissionDecision && output.updatedInput.prompt.startsWith("APM VERIFY ORDER: W1\n"), result.out + result.err);
    assert(output.updatedInput.prompt.includes("APM VERIFY REPORT"), result.out + result.err);
  } finally { s.cleanup(); }
});

test("PreToolUse rejection includes a canonical envelope for an unknown unit", () => {
  const s = sandbox();
  try {
    s.write("WHIPS.md", ledger());
    const result = run(hook, ["pre-agent"], {
      cwd: s.dir,
      input: JSON.stringify({ cwd: s.dir, tool_input: { prompt: "APM DISPATCH: W9" } }),
      env: { APM_HOOK_STATE_DIR: s.state },
    });
    const reason = json(result.out).hookSpecificOutput.permissionDecisionReason;
    assert(reason.includes("Exact canonical envelope:"), result.out + result.err);
    assert(reason.includes("APM WORK ORDER: W1"), result.out + result.err);
  } finally { s.cleanup(); }
});

test("PreToolUse allows a ledger-backed full work order", () => {
  const s = sandbox();
  try {
    s.write("WHIPS.md", ledger());
    const result = run(hook, ["pre-agent"], {
      cwd: s.dir,
      input: JSON.stringify({ cwd: s.dir, tool_input: { prompt: workOrder() } }),
      env: { APM_HOOK_STATE_DIR: s.state },
    });
    const output = json(result.out).hookSpecificOutput;
    assert(!output.permissionDecision && output.additionalContext.includes("W1"), result.out + result.err);
  } finally { s.cleanup(); }
});

test("PreToolUse allows a ledger-backed independent verifier order", () => {
  const s = sandbox();
  try {
    s.write("WHIPS.md", ledger({ unit: "VERIFYING" }));
    const result = run(hook, ["pre-agent"], {
      cwd: s.dir,
      input: JSON.stringify({ cwd: s.dir, tool_input: { prompt: verifyOrder() } }),
      env: { APM_HOOK_STATE_DIR: s.state },
    });
    const output = json(result.out).hookSpecificOutput;
    assert(!output.permissionDecision && output.additionalContext.includes("independent verification"), result.out + result.err);
  } finally { s.cleanup(); }
});

test("PreToolUse blocks verifier dispatch before a producer return", () => {
  const s = sandbox();
  try {
    s.write("WHIPS.md", ledger());
    const result = run(hook, ["pre-agent"], {
      cwd: s.dir,
      input: JSON.stringify({ cwd: s.dir, tool_input: { prompt: verifyOrder() } }),
      env: { APM_HOOK_STATE_DIR: s.state },
    });
    assert(json(result.out).hookSpecificOutput.permissionDecision === "deny", result.out + result.err);
  } finally { s.cleanup(); }
});

test("SubagentStop sends a worker back for a malformed report", () => {
  const s = sandbox();
  try {
    s.write("WHIPS.md", ledger());
    const result = run(hook, ["subagent-stop"], {
      cwd: s.dir,
      input: JSON.stringify({ cwd: s.dir, last_assistant_message: report({ complete: false }) }),
      env: { APM_HOOK_STATE_DIR: s.state },
    });
    assert(json(result.out).decision === "block", result.out + result.err);
  } finally { s.cleanup(); }
});

test("SubagentStop accepts an accountable return", () => {
  const s = sandbox();
  try {
    s.write("WHIPS.md", ledger());
    const result = run(hook, ["subagent-stop"], {
      cwd: s.dir,
      input: JSON.stringify({ cwd: s.dir, last_assistant_message: report() }),
      env: { APM_HOOK_STATE_DIR: s.state },
    });
    assert(result.code === 0 && result.out === "", result.out + result.err);
  } finally { s.cleanup(); }
});

test("SubagentStop accepts an accountable independent verifier return", () => {
  const s = sandbox();
  try {
    s.write("WHIPS.md", ledger({ unit: "VERIFYING", verifyDispatched: true }));
    const result = run(hook, ["subagent-stop"], {
      cwd: s.dir,
      input: JSON.stringify({ cwd: s.dir, last_assistant_message: verifyReport() }),
      env: { APM_HOOK_STATE_DIR: s.state },
    });
    assert(result.code === 0 && result.out === "", result.out + result.err);
  } finally { s.cleanup(); }
});

test("SubagentStop enforces the bounded return size", () => {
  const s = sandbox();
  try {
    s.write("WHIPS.md", ledger());
    const oversized = report().replace("RISKS: none", `RISKS: ${"x".repeat(4100)}`);
    const result = run(hook, ["subagent-stop"], {
      cwd: s.dir,
      input: JSON.stringify({ cwd: s.dir, last_assistant_message: oversized }),
      env: { APM_HOOK_STATE_DIR: s.state },
    });
    assert(json(result.out).decision === "block" && json(result.out).reason.includes("RETURN LIMIT"), result.out + result.err);
  } finally { s.cleanup(); }
});

test("Context firewall blocks manager reads of leaf artifacts", () => {
  const s = sandbox();
  try {
    s.write("WHIPS.md", ledger());
    const result = run(hook, ["pre-manager-tool"], {
      cwd: s.dir,
      input: JSON.stringify({ cwd: s.dir, tool_name: "Read", tool_input: { file_path: "src/a.js" } }),
      env: { APM_HOOK_STATE_DIR: s.state },
    });
    const output = json(result.out).hookSpecificOutput;
    assert(output.permissionDecision === "deny" && output.permissionDecisionReason.includes("context firewall"), result.out + result.err);
  } finally { s.cleanup(); }
});

test("Persistent context firewall bootstraps APM before the first direct tool call", () => {
  const s = sandbox();
  try {
    const result = run(hook, ["pre-manager-tool"], {
      cwd: s.dir,
      input: JSON.stringify({ cwd: s.dir, session_id: "bootstrap", tool_name: "Read", tool_input: { file_path: "src/a.js" } }),
      env: { APM_HOOK_STATE_DIR: s.state },
    });
    const output = json(result.out).hookSpecificOutput;
    assert(output.permissionDecision === "deny" && output.permissionDecisionReason.includes("Load a2a-manager-agent-orchestration"), result.out + result.err);

    const stopped = run(hook, ["stop"], {
      cwd: s.dir,
      input: JSON.stringify({ cwd: s.dir, session_id: "bootstrap" }),
      env: { APM_HOOK_STATE_DIR: s.state },
    });
    assert(json(stopped.out).decision === "block" && json(stopped.out).reason.includes("WHIPS.md"), stopped.out + stopped.err);
  } finally { s.cleanup(); }
});

test("Context firewall allows and loads a sibling shared WHIPS ledger", () => {
  const s = sandbox();
  try {
    const ledgerPath = join(s.shared, "WHIPS.md");
    const write = run(hook, ["pre-manager-tool"], {
      cwd: s.dir,
      input: JSON.stringify({ cwd: s.dir, session_id: "shared", tool_name: "Write", tool_input: { file_path: ledgerPath } }),
      env: { APM_HOOK_STATE_DIR: s.state },
    });
    assert(write.code === 0 && write.out === "", write.out + write.err);

    s.writeShared("WHIPS.md", ledger());
    const dispatch = run(hook, ["pre-agent"], {
      cwd: s.dir,
      input: JSON.stringify({ cwd: s.dir, session_id: "shared", tool_input: { prompt: "APM DISPATCH: W1" } }),
      env: { APM_HOOK_STATE_DIR: s.state },
    });
    const output = json(dispatch.out).hookSpecificOutput;
    assert(!output.permissionDecision && output.updatedInput.prompt.startsWith("APM WORK ORDER: W1\n"), dispatch.out + dispatch.err);
  } finally { s.cleanup(); }
});

test("Haiku-style bootstrap reaches dispatch without an envelope retry loop", () => {
  const s = sandbox();
  try {
    const session = "haiku-deadlock-regression";
    const blockedRead = run(hook, ["pre-manager-tool"], {
      cwd: s.dir,
      input: JSON.stringify({ cwd: s.dir, session_id: session, tool_name: "Read", tool_input: { file_path: "src/a.js" } }),
      env: { APM_HOOK_STATE_DIR: s.state },
    });
    assert(json(blockedRead.out).hookSpecificOutput.permissionDecision === "deny", blockedRead.out + blockedRead.err);

    const ledgerPath = join(s.shared, "WHIPS.md");
    const allowedLedgerWrite = run(hook, ["pre-manager-tool"], {
      cwd: s.dir,
      input: JSON.stringify({ cwd: s.dir, session_id: session, tool_name: "Write", tool_input: { file_path: ledgerPath } }),
      env: { APM_HOOK_STATE_DIR: s.state },
    });
    assert(allowedLedgerWrite.code === 0 && allowedLedgerWrite.out === "", allowedLedgerWrite.out + allowedLedgerWrite.err);
    s.writeShared("WHIPS.md", ledger());

    const duplicated = `APM WORK ORDER: W1
USER OBJECTIVE: finish one feature
USER OBJECTIVE: finish one feature
WORK UNIT: implement feature
WORK UNIT: implement feature
HANDLER ROLE: worker-1
HANDLER ROLE: worker-1`;
    const dispatch = run(hook, ["pre-agent"], {
      cwd: s.dir,
      input: JSON.stringify({ cwd: s.dir, session_id: session, tool_input: { prompt: duplicated } }),
      env: { APM_HOOK_STATE_DIR: s.state },
    });
    const output = json(dispatch.out).hookSpecificOutput;
    assert(!output.permissionDecision && output.updatedInput.prompt.startsWith("APM WORK ORDER: W1\n"), dispatch.out + dispatch.err);
    assert(output.updatedInput.prompt.match(/^USER OBJECTIVE:/gm).length === 1, dispatch.out + dispatch.err);
    assert(output.updatedInput.prompt.match(/^WORK UNIT:/gm).length === 1, dispatch.out + dispatch.err);
    assert(output.updatedInput.prompt.match(/^HANDLER ROLE:/gm).length === 1, dispatch.out + dispatch.err);
  } finally { s.cleanup(); }
});

test("Context firewall allows manager updates to WHIPS.md", () => {
  const s = sandbox();
  try {
    s.write("WHIPS.md", ledger());
    const result = run(hook, ["pre-manager-tool"], {
      cwd: s.dir,
      input: JSON.stringify({ cwd: s.dir, tool_name: "Edit", tool_input: { file_path: "WHIPS.md" } }),
      env: { APM_HOOK_STATE_DIR: s.state },
    });
    assert(result.code === 0 && result.out === "", result.out + result.err);
  } finally { s.cleanup(); }
});

test("Context firewall allows leaf tools inside dispatched workers", () => {
  const s = sandbox();
  try {
    s.write("WHIPS.md", ledger({ unit: "IN-FLIGHT" }));
    const result = run(hook, ["pre-manager-tool"], {
      cwd: s.dir,
      input: JSON.stringify({ cwd: s.dir, agent_id: "worker-agent", agent_type: "general-purpose", tool_name: "Read", tool_input: { file_path: "src/a.js" } }),
      env: { APM_HOOK_STATE_DIR: s.state },
    });
    assert(result.code === 0 && result.out === "", result.out + result.err);
  } finally { s.cleanup(); }
});

test("Reporting hierarchy blocks workers from creating child agents", () => {
  const s = sandbox();
  try {
    s.write("WHIPS.md", ledger({ unit: "IN-FLIGHT" }));
    const result = run(hook, ["pre-agent"], {
      cwd: s.dir,
      input: JSON.stringify({ cwd: s.dir, agent_id: "worker-agent", agent_type: "general-purpose", tool_input: { prompt: workOrder() } }),
      env: { APM_HOOK_STATE_DIR: s.state },
    });
    const output = json(result.out).hookSpecificOutput;
    assert(output.permissionDecision === "deny" && output.permissionDecisionReason.includes("reporting hierarchy"), result.out + result.err);
  } finally { s.cleanup(); }
});

test("Context firewall blocks TaskCreate as a substitute ledger", () => {
  const s = sandbox();
  try {
    const result = run(hook, ["pre-manager-tool"], {
      cwd: s.dir,
      input: JSON.stringify({ cwd: s.dir, tool_name: "TaskCreate", tool_input: { subject: "implement directly" } }),
      env: { APM_HOOK_STATE_DIR: s.state },
    });
    const output = json(result.out).hookSpecificOutput;
    assert(output.permissionDecision === "deny" && output.permissionDecisionReason.includes("WHIPS.md"), result.out + result.err);
  } finally { s.cleanup(); }
});

test("Context firewall allows a ledger-backed TaskCreate contract", () => {
  const s = sandbox();
  try {
    s.write("WHIPS.md", ledger());
    const result = run(hook, ["pre-manager-tool"], {
      cwd: s.dir,
      input: JSON.stringify({ cwd: s.dir, tool_name: "TaskCreate", tool_input: { subject: "W1", description: workOrder() } }),
      env: { APM_HOOK_STATE_DIR: s.state },
    });
    assert(result.code === 0 && result.out === "", result.out + result.err);
  } finally { s.cleanup(); }
});

test("Context firewall normalizes a shorthand TaskCreate contract", () => {
  const s = sandbox();
  try {
    s.write("WHIPS.md", ledger());
    const result = run(hook, ["pre-manager-tool"], {
      cwd: s.dir,
      input: JSON.stringify({ cwd: s.dir, tool_name: "TaskCreate", tool_input: { subject: "W1", description: "APM DISPATCH: W1" } }),
      env: { APM_HOOK_STATE_DIR: s.state },
    });
    const output = json(result.out).hookSpecificOutput;
    assert(!output.permissionDecision && output.updatedInput.description.startsWith("APM WORK ORDER: W1\n"), result.out + result.err);
  } finally { s.cleanup(); }
});

test("Task-list mirrors require and accept an active WHIPS ledger", () => {
  const s = sandbox();
  try {
    const denied = run(hook, ["pre-manager-tool"], {
      cwd: s.dir,
      input: JSON.stringify({ cwd: s.dir, tool_name: "TaskList", tool_input: {} }),
      env: { APM_HOOK_STATE_DIR: s.state },
    });
    assert(json(denied.out).hookSpecificOutput.permissionDecision === "deny", denied.out + denied.err);

    s.write("WHIPS.md", ledger());
    const allowed = run(hook, ["pre-manager-tool"], {
      cwd: s.dir,
      input: JSON.stringify({ cwd: s.dir, tool_name: "TaskUpdate", tool_input: { taskId: "1", status: "in_progress" } }),
      env: { APM_HOOK_STATE_DIR: s.state },
    });
    assert(allowed.code === 0 && allowed.out === "", allowed.out + allowed.err);
  } finally { s.cleanup(); }
});

test("Context firewall allows only bounded APM control commands", () => {
  const s = sandbox();
  try {
    s.write("WHIPS.md", ledger());
    const allowed = run(hook, ["pre-manager-tool"], {
      cwd: s.dir,
      input: JSON.stringify({ cwd: s.dir, tool_name: "Bash", tool_input: { command: "node scripts/whips-check.mjs --status" } }),
      env: { APM_HOOK_STATE_DIR: s.state },
    });
    assert(allowed.code === 0 && allowed.out === "", allowed.out + allowed.err);

    const redirected = run(hook, ["pre-manager-tool"], {
      cwd: s.dir,
      input: JSON.stringify({ cwd: s.dir, tool_name: "Bash", tool_input: { command: "node scripts/whips-check.mjs --status 2>&1" } }),
      env: { APM_HOOK_STATE_DIR: s.state },
    });
    assert(redirected.code === 0 && redirected.out === "", redirected.out + redirected.err);

    const disguised = run(hook, ["pre-manager-tool"], {
      cwd: s.dir,
      input: JSON.stringify({ cwd: s.dir, tool_name: "Bash", tool_input: { command: "node scripts/evil.mjs whips-check.mjs" } }),
      env: { APM_HOOK_STATE_DIR: s.state },
    });
    assert(json(disguised.out).hookSpecificOutput.permissionDecision === "deny", disguised.out + disguised.err);

    const expanded = run(hook, ["pre-manager-tool"], {
      cwd: s.dir,
      input: JSON.stringify({ cwd: s.dir, tool_name: "Bash", tool_input: { command: "node scripts/whips-check.mjs --root \"$(whoami)\"" } }),
      env: { APM_HOOK_STATE_DIR: s.state },
    });
    assert(json(expanded.out).hookSpecificOutput.permissionDecision === "deny", expanded.out + expanded.err);

    const denied = run(hook, ["pre-manager-tool"], {
      cwd: s.dir,
      input: JSON.stringify({ cwd: s.dir, tool_name: "Bash", tool_input: { command: "node scripts/whips-check.mjs --status; Get-Content src/a.js" } }),
      env: { APM_HOOK_STATE_DIR: s.state },
    });
    assert(json(denied.out).hookSpecificOutput.permissionDecision === "deny", denied.out + denied.err);
  } finally { s.cleanup(); }
});

test("SubagentStop rejects a report marker hidden behind narrative", () => {
  const s = sandbox();
  try {
    s.write("WHIPS.md", ledger());
    const result = run(hook, ["subagent-stop"], {
      cwd: s.dir,
      input: JSON.stringify({ cwd: s.dir, last_assistant_message: `Finished successfully.\n${report()}` }),
      env: { APM_HOOK_STATE_DIR: s.state },
    });
    assert(json(result.out).decision === "block", result.out + result.err);
  } finally { s.cleanup(); }
});

test("PreToolUse restores a contract value weakened after ledger approval", () => {
  const s = sandbox();
  try {
    s.write("WHIPS.md", ledger());
    const result = run(hook, ["pre-agent"], {
      cwd: s.dir,
      input: JSON.stringify({ cwd: s.dir, tool_input: { prompt: workOrder().replace("BUDGET: 10 minutes", "BUDGET: unlimited") } }),
      env: { APM_HOOK_STATE_DIR: s.state },
    });
    const output = json(result.out).hookSpecificOutput;
    assert(!output.permissionDecision && output.updatedInput.prompt.includes("BUDGET: 10 minutes"), result.out + result.err);
    assert(!output.updatedInput.prompt.includes("BUDGET: unlimited"), result.out + result.err);
  } finally { s.cleanup(); }
});

test("PreToolUse restores the return schema to the dispatched unit", () => {
  const s = sandbox();
  try {
    s.write("WHIPS.md", ledger());
    const result = run(hook, ["pre-agent"], {
      cwd: s.dir,
      input: JSON.stringify({ cwd: s.dir, tool_input: { prompt: workOrder().replace("UNIT: W1", "UNIT: W2") } }),
      env: { APM_HOOK_STATE_DIR: s.state },
    });
    const output = json(result.out).hookSpecificOutput;
    assert(!output.permissionDecision && output.updatedInput.prompt.includes("UNIT: W1"), result.out + result.err);
    assert(!output.updatedInput.prompt.includes("UNIT: W2"), result.out + result.err);
  } finally { s.cleanup(); }
});

for (const state of ["READY", "IN-FLIGHT", "VERIFYING", "REWHIP"]) {
  test(`Stop blocks an unlazy manager with ${state} work`, () => {
    const s = sandbox();
    try {
      s.write("WHIPS.md", ledger({ unit: state }));
      const result = run(hook, ["stop"], {
        cwd: s.dir,
        input: JSON.stringify({ cwd: s.dir, session_id: state }),
        env: { APM_HOOK_STATE_DIR: s.state },
      });
      assert(json(result.out).decision === "block", result.out + result.err);
    } finally { s.cleanup(); }
  });
}

test("Stop allows only a fully settled ledger", () => {
  const s = sandbox();
  try {
    s.write("WHIPS.md", ledger({ unit: "VERIFIED", rootState: "VERIFIED" }));
    const result = run(hook, ["stop"], {
      cwd: s.dir,
      input: JSON.stringify({ cwd: s.dir, session_id: "done" }),
      env: { APM_HOOK_STATE_DIR: s.state },
    });
    const output = json(result.out);
    assert(!output.decision && output.systemMessage.includes("terminal"), result.out + result.err);
  } finally { s.cleanup(); }
});

test("Stop allows an answer-only session that never attempted execution", () => {
  const s = sandbox();
  try {
    const result = run(hook, ["stop"], {
      cwd: s.dir,
      input: JSON.stringify({ cwd: s.dir, session_id: "answer-only" }),
      env: { APM_HOOK_STATE_DIR: s.state },
    });
    assert(result.code === 0 && result.out === "", result.out + result.err);
  } finally { s.cleanup(); }
});

test("Stop blocks a malformed ledger", () => {
  const s = sandbox();
  try {
    s.write("WHIPS.md", ledger({ malformed: true }));
    const result = run(hook, ["stop"], {
      cwd: s.dir,
      input: JSON.stringify({ cwd: s.dir, session_id: "invalid" }),
      env: { APM_HOOK_STATE_DIR: s.state },
    });
    assert(json(result.out).decision === "block", result.out + result.err);
  } finally { s.cleanup(); }
});

test("Optional Stop progress guard releases after six unchanged blocks", () => {
  const s = sandbox();
  try {
    s.write("WHIPS.md", ledger());
    let output;
    for (let index = 0; index < 7; index += 1) {
      output = json(run(hook, ["stop", "--allow-emergency-release"], {
        cwd: s.dir,
        input: JSON.stringify({ cwd: s.dir, session_id: "guard" }),
        env: { APM_HOOK_STATE_DIR: s.state },
      }).out);
    }
    assert(!output.decision && output.systemMessage.includes("emergency release"), JSON.stringify(output));
  } finally { s.cleanup(); }
});

test("Default Stop gate never releases unchanged unfinished work", () => {
  const s = sandbox();
  try {
    s.write("WHIPS.md", ledger());
    let output;
    for (let index = 0; index < 8; index += 1) {
      output = json(run(hook, ["stop"], {
        cwd: s.dir,
        input: JSON.stringify({ cwd: s.dir, session_id: "strict" }),
        env: { APM_HOOK_STATE_DIR: s.state },
      }).out);
    }
    assert(output.decision === "block", JSON.stringify(output));
  } finally { s.cleanup(); }
});

test("whips-check computes manager duties without mutating the ledger", () => {
  const s = sandbox();
  try {
    s.write("WHIPS.md", ledger());
    const before = s.read("WHIPS.md");
    const result = run(checker, ["--status"], { cwd: s.dir });
    assert(result.code === 1 && result.out.includes("M-DISPATCH W1"), result.out + result.err);
    assert(s.read("WHIPS.md") === before, "status checker mutated WHIPS.md");
  } finally { s.cleanup(); }
});

test("installer is idempotent and uninstall preserves sibling hooks", () => {
  const s = sandbox();
  try {
    s.write(".claude/settings.local.json", JSON.stringify({
      hooks: { Stop: [{ hooks: [{ type: "command", command: "node sibling.mjs", timeout: 5 }] }] },
    }, null, 2) + "\n");
    const first = run(installer, [], { cwd: s.dir });
    assert(first.code === 0, first.out + first.err);
    const second = run(installer, [], { cwd: s.dir });
    assert(second.code === 0, second.out + second.err);
    const installed = JSON.parse(s.read(".claude/settings.local.json"));
    for (const event of ["PreToolUse", "SubagentStop", "Stop"]) {
      const ours = installed.hooks[event].flatMap((group) => group.hooks)
        .filter((item) => item.command?.includes("--apm-runtime"));
      const expected = event === "PreToolUse" ? 2 : 1;
      assert(ours.length === expected, `${event} has ${ours.length} APM hooks`);
    }
    const removed = run(installer, ["--uninstall"], { cwd: s.dir });
    assert(removed.code === 0, removed.out + removed.err);
    const after = JSON.parse(s.read(".claude/settings.local.json"));
    assert(after.hooks.Stop.some((group) => group.hooks.some((item) => item.command === "node sibling.mjs")), "sibling hook was removed");
    assert(!JSON.stringify(after).includes("--apm-runtime"), "APM hook remained after uninstall");
  } finally { s.cleanup(); }
});

test("runtime event log proves manager interventions without storing prompts", () => {
  const s = sandbox();
  try {
    s.write("WHIPS.md", ledger());
    const log = join(s.dir, ".apm", "runtime.jsonl");
    const env = { APM_HOOK_STATE_DIR: s.state, APM_RUNTIME_LOG: log };

    run(hook, ["pre-agent"], {
      cwd: s.dir,
      input: JSON.stringify({ cwd: s.dir, session_id: "telemetry", hook_event_name: "PreToolUse", tool_input: { prompt: "APM DISPATCH: W1" } }),
      env,
    });
    run(hook, ["subagent-stop"], {
      cwd: s.dir,
      input: JSON.stringify({ cwd: s.dir, session_id: "telemetry", hook_event_name: "SubagentStop", last_assistant_message: "done" }),
      env,
    });
    run(hook, ["stop"], {
      cwd: s.dir,
      input: JSON.stringify({ cwd: s.dir, session_id: "telemetry", hook_event_name: "Stop" }),
      env,
    });

    const raw = s.read(".apm/runtime.jsonl");
    assert(!raw.includes("finish one feature") && !raw.includes("runtime-test") && !raw.includes("last_assistant_message"), "runtime log leaked prompt, scope, or report text");
    const summary = run(runtimeReporter, ["--json", log], { cwd: s.dir });
    const output = json(summary.out);
    assert(summary.code === 0 && output.events === 3, summary.out + summary.err);
    assert(output.accepted_dispatches === 1, JSON.stringify(output));
    assert(output.normalized_dispatches === 1, JSON.stringify(output));
    assert(output.contract_normalizations === 1, JSON.stringify(output));
    assert(output.corrected_worker_returns === 1, JSON.stringify(output));
    assert(output.manager_stop_blocks === 1 && output.manager_interventions === 3, JSON.stringify(output));
  } finally { s.cleanup(); }
});

let passed = 0;
const failures = [];
for (const item of tests) {
  try {
    item.fn();
    passed += 1;
    console.log(`ok   ${item.name}`);
  } catch (error) {
    failures.push(item.name);
    console.log(`FAIL ${item.name}\n     ${String(error.message).replace(/\n/g, "\n     ")}`);
  }
}
console.log(`\n${passed}/${tests.length} runtime tests passed`);
if (failures.length) {
  console.log(`failed: ${failures.join(", ")}`);
  process.exit(1);
}
