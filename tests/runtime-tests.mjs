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
  const dir = mkdtempSync(join(tmpdir(), "apm-runtime-test-"));
  const state = join(dir, "hook-state");
  mkdirSync(state, { recursive: true });
  return {
    dir,
    state,
    write(relative, text) {
      const file = join(dir, relative);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, text, "utf8");
    },
    read(relative) { return readFileSync(join(dir, relative), "utf8"); },
    cleanup() { rmSync(dir, { recursive: true, force: true }); },
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

function ledger({ unit = "READY", rootState = "WAITING", malformed = false } = {}) {
  const unitDone = unit === "VERIFIED";
  const rootDone = rootState === "VERIFIED";
  const dispatch = ["IN-FLIGHT", "VERIFYING", "VERIFIED"].includes(unit) ? "agent-1 at 2026-09-01T00:00:00Z" : "pending";
  const report = ["VERIFYING", "VERIFIED"].includes(unit) ? "agent-1 APM WORK REPORT" : "pending";
  const account = ["VERIFYING", "VERIFIED"].includes(unit) ? "norm met; budget 4 minutes; no deviation" : "pending";
  const evidence = unitDone ? "npm test exit=0 output=PASS" : unit === "REWHIP" ? "missing proof on first return" : "pending";
  const rootEvidence = rootDone ? "root test exit=0 output=ROOT_PASS" : "pending";
  const rootNeeds = malformed ? "MISSING" : "W1";
  return `# WHIPS: runtime-test

OBJECTIVE: finish one feature
MANAGER: orchestrator
INTEGRATION: apply W1 and run root test
STOP: ROOT is VERIFIED
ENFORCEMENT: no downstream dispatch or integration before manager verification
AUDIT CADENCE: after every return and before every dependent dispatch

- [${unitDone ? "x" : " "}] W1: implement feature
  HANDLER: worker-1
  NEEDS: none
  OWNS: src/a.js
  INPUTS: accepted plan v1
  OUTPUT: patch src/a.js
  NORM: one passing feature
  BUDGET: 10 minutes
  WATCH: wait 30 seconds, then recontact
  INSPECTION: inspect src/a.js diff
  PROOF: npm test => PASS
  DISPATCH: ${dispatch}
  REPORT: ${report}
  ACCOUNT: ${account}
  STATE: ${unit}
  EVIDENCE: ${evidence}

## Integration

- [${rootDone ? "x" : " "}] ROOT: integrated feature
  NEEDS: ${rootNeeds}
  INSPECTION: inspect interfaces and regressions
  PROOF: npm run test:root => ROOT_PASS
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
HANDLER ROLE: implementation worker
NEEDS: none
CONTEXT: accepted plan v1
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
ASSUMPTIONS: none
RISKS: none
MANAGER DECISION: none`;
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

test("PreToolUse blocks an incomplete worker contract", () => {
  const s = sandbox();
  try {
    s.write("WHIPS.md", ledger());
    const result = run(hook, ["pre-agent"], {
      cwd: s.dir,
      input: JSON.stringify({ cwd: s.dir, tool_input: { prompt: workOrder({ complete: false }), description: workOrder() } }),
      env: { APM_HOOK_STATE_DIR: s.state },
    });
    assert(json(result.out).hookSpecificOutput.permissionDecision === "deny", result.out + result.err);
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

test("PreToolUse rejects a contract value weakened after ledger approval", () => {
  const s = sandbox();
  try {
    s.write("WHIPS.md", ledger());
    const result = run(hook, ["pre-agent"], {
      cwd: s.dir,
      input: JSON.stringify({ cwd: s.dir, tool_input: { prompt: workOrder().replace("BUDGET: 10 minutes", "BUDGET: unlimited") } }),
      env: { APM_HOOK_STATE_DIR: s.state },
    });
    const output = json(result.out).hookSpecificOutput;
    assert(output.permissionDecision === "deny" && output.permissionDecisionReason.includes("BUDGET"), result.out + result.err);
  } finally { s.cleanup(); }
});

test("PreToolUse binds the return schema to the dispatched unit", () => {
  const s = sandbox();
  try {
    s.write("WHIPS.md", ledger());
    const result = run(hook, ["pre-agent"], {
      cwd: s.dir,
      input: JSON.stringify({ cwd: s.dir, tool_input: { prompt: workOrder().replace("UNIT: W1", "UNIT: W2") } }),
      env: { APM_HOOK_STATE_DIR: s.state },
    });
    const output = json(result.out).hookSpecificOutput;
    assert(output.permissionDecision === "deny" && output.permissionDecisionReason.includes("REPORT UNIT"), result.out + result.err);
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
      assert(ours.length === 1, `${event} has ${ours.length} APM hooks`);
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
      input: JSON.stringify({ cwd: s.dir, session_id: "telemetry", hook_event_name: "PreToolUse", tool_input: { prompt: workOrder() } }),
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
    assert(output.corrected_worker_returns === 1, JSON.stringify(output));
    assert(output.manager_stop_blocks === 1 && output.manager_interventions === 2, JSON.stringify(output));
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
