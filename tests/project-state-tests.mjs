import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import {
  acceptHandoff,
  createProject,
  prepareHandoff,
  recordCheckpoint,
  renderBrief,
  renderHandoff,
  saveProject,
  stateFileForRoot,
  validateProject,
} from "../scripts/lib/project-state.mjs";

const cli = resolve("scripts/apmctl.mjs");
const fixedNow = "2026-09-02T00:00:00.000Z";
const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

function sandbox() {
  const root = mkdtempSync(join(tmpdir(), "apm-v2-test-"));
  return {
    root,
    write(relativePath, content) {
      const file = join(root, relativePath);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, content, "utf8");
      return file;
    },
    read(relativePath) {
      return readFileSync(join(root, relativePath), "utf8");
    },
    cleanup() {
      rmSync(root, { recursive: true, force: true });
    },
  };
}

function validState() {
  const state = createProject("FiveGround Test", "manager-1", fixedNow);
  state.project.mission = "Preserve the game architecture while delivering a sequence of features.";
  state.project.phase = "vertical-slice";
  state.project.status = "active";
  state.directives.push({
    id: "U1",
    quote: "Keep the original combat architecture and finish the vertical slice.",
    scope: "architecture and vertical-slice workstreams",
    authority: "user",
    source: "user message U1",
    recorded_at: fixedNow,
    status: "active",
  });
  state.invariants.push({ id: "I1", text: "Combat resolution remains deterministic.", authority: "user", status: "active" });
  state.sessions.push({
    id: "worker-combat-1",
    role: "worker",
    generation: 1,
    scope: "combat systems",
    status: "active",
    context: {
      health: "green",
      last_checkpoint: null,
      last_refresh: fixedNow,
      compactions: 0,
      signals: [],
      next_action: "implement W1",
    },
  });
  state.architecture.push({
    id: "A1",
    area: "combat",
    rule: "All combat outcomes flow through the deterministic resolver.",
    owner_session: "worker-combat-1",
    interfaces: ["src/combat/resolver.ts"],
  });
  state.workstreams.push({
    id: "W1",
    title: "combat resolver",
    owner_session: "worker-combat-1",
    state: "active",
    depends_on: [],
    scope: ["src/combat/**"],
    acceptance: ["deterministic replay test passes"],
    outputs: [],
    evidence: [],
    decision_needed: null,
    updated_at: fixedNow,
  });
  state.decisions.push({
    id: "D1",
    text: "Use seeded simulation for combat replays.",
    authority: "manager",
    status: "active",
    affects: ["W1", "A1"],
    evidence: "accepted architecture review",
    supersedes: null,
    recorded_at: fixedNow,
  });
  state.observations.push({
    id: "O1",
    kind: "measured",
    claim: "The baseline replay test passes.",
    source: "test:combat-replay exit=0",
    at: fixedNow,
  });
  return state;
}

function runCli(args, cwd) {
  return spawnSync(process.execPath, [cli, ...args], { cwd, encoding: "utf8" });
}

test("draft initialization is structurally valid and asks for a mission", () => {
  const state = createProject("Draft", "manager-1", fixedNow);
  const result = validateProject(state);
  assert.deepEqual(result.errors, []);
  assert(result.warnings.some((item) => item.includes("no mission")));
  assert(result.actions.some((item) => item.includes("Record the project mission")));
});

test("active persistent organization validates", () => {
  const result = validateProject(validState());
  assert.deepEqual(result.errors, []);
});

test("manager cannot own an active production workstream", () => {
  const state = validState();
  state.workstreams[0].owner_session = "manager-1";
  const result = validateProject(state);
  assert(result.errors.some((item) => item.includes("assigns production work to manager")));
});

test("missing dependencies and cycles are rejected", () => {
  const state = validState();
  state.workstreams[0].depends_on = ["W2"];
  state.workstreams.push({
    ...state.workstreams[0],
    id: "W2",
    title: "cycle peer",
    state: "blocked",
    depends_on: ["W1"],
  });
  const result = validateProject(state);
  assert(result.errors.some((item) => item.includes("dependency cycle")));
});

test("accepted work requires outputs and evidence", () => {
  const state = validState();
  state.workstreams[0].state = "accepted";
  const result = validateProject(state);
  assert(result.errors.some((item) => item.includes("accepted without outputs")));
  assert(result.errors.some((item) => item.includes("accepted without evidence")));
});

test("project review metrics reject impossible negative measurements", () => {
  const state = validState();
  state.reviews.push({
    id: "R1",
    period: "milestone-1",
    accepted_workstreams: 1,
    architecture_violations: 0,
    regressions: 0,
    rework_events: 0,
    compactions: 0,
    handoffs: 0,
    integration_losses: 0,
    elapsed_hours: 1,
    tokens: 1000,
    cost_usd: -1,
    evidence: ["test report"],
  });
  const result = validateProject(state);
  assert(result.errors.some((item) => item.includes("R1.cost_usd")));
});

test("context risk warns and recommends lifecycle action without structural failure", () => {
  const state = validState();
  state.sessions[1].context.health = "red";
  state.sessions[1].context.signals = ["contradicted D1 twice"];
  const result = validateProject(state);
  assert.deepEqual(result.errors, []);
  assert(result.warnings.some((item) => item.includes("context health is red")));
  assert(result.actions.some((item) => item.includes("handoff or replacement")));
});

test("worker brief is bounded to its owned work and preserves exact authority", () => {
  const state = validState();
  state.sessions.push({
    id: "worker-ui-1",
    role: "worker",
    generation: 1,
    scope: "UI",
    status: "active",
    context: { health: "green", last_checkpoint: null, last_refresh: fixedNow, compactions: 0, signals: [], next_action: "implement W2" },
  });
  state.workstreams.push({
    id: "W2",
    title: "private UI work",
    owner_session: "worker-ui-1",
    state: "active",
    depends_on: [],
    scope: ["src/ui/**"],
    acceptance: ["UI test"],
    outputs: [],
    evidence: [],
    decision_needed: null,
    updated_at: fixedNow,
  });
  const brief = renderBrief(state, "worker-combat-1");
  assert(brief.includes(state.directives[0].quote));
  assert(brief.includes("W1: combat resolver"));
  assert(!brief.includes("private UI work"));
});

test("checkpoint records compaction and restores a healthy session", () => {
  const state = validState();
  state.sessions[1].status = "compact-due";
  state.sessions[1].context.health = "amber";
  const next = recordCheckpoint(state, "worker-combat-1", ".apm/checkpoints/worker-combat-1.md", "c".repeat(64), "green", true, fixedNow);
  assert.equal(next.sessions[1].status, "active");
  assert.equal(next.sessions[1].context.compactions, 1);
  assert.equal(next.sessions[1].context.last_checkpoint, ".apm/checkpoints/worker-combat-1.md");
  assert.equal(next.sessions[1].context.checkpoint_sha256, "c".repeat(64));
});

test("manager handoff is two-phase and transfers authority only on acceptance", () => {
  const state = validState();
  state.sessions.push({
    id: "manager-2",
    role: "manager",
    generation: 2,
    scope: "project-wide coordination",
    status: "starting",
    context: { health: "green", last_checkpoint: null, last_refresh: fixedNow, compactions: 0, signals: [], next_action: "acknowledge handoff" },
  });
  const prepared = prepareHandoff(state, "manager-1", "manager-2", ".apm/handoffs/H1.md", fixedNow);
  prepared.handoff.packet_sha256 = "c".repeat(64);
  assert.equal(prepared.state.project.manager_session, "manager-1");
  assert.equal(prepared.state.sessions.find((item) => item.id === "manager-1").status, "active");
  assert(renderHandoff(prepared.state, prepared.handoff).includes("Successor Acknowledgement"));

  const accepted = acceptHandoff(prepared.state, "H1", { path: ".apm/handoffs/H1-ack.md", sha256: "a".repeat(64) }, fixedNow);
  assert.equal(accepted.state.project.manager_session, "manager-2");
  assert.equal(accepted.state.sessions.find((item) => item.id === "manager-1").status, "retired");
  assert.equal(accepted.state.sessions.find((item) => item.id === "manager-2").status, "active");
  assert.deepEqual(validateProject(accepted.state).errors, []);
});

test("worker handoff transfers live ownership while preserving history", () => {
  const state = validState();
  state.sessions.push({
    id: "worker-combat-2",
    role: "worker",
    generation: 2,
    scope: "combat systems",
    status: "starting",
    context: { health: "green", last_checkpoint: null, last_refresh: fixedNow, compactions: 0, signals: [], next_action: "acknowledge handoff" },
  });
  const prepared = prepareHandoff(state, "worker-combat-1", "worker-combat-2", ".apm/handoffs/H1.md", fixedNow);
  prepared.handoff.packet_sha256 = "c".repeat(64);
  const accepted = acceptHandoff(prepared.state, "H1", { path: ".apm/handoffs/H1-ack.md", sha256: "b".repeat(64) }, fixedNow);
  assert.equal(accepted.state.workstreams[0].owner_session, "worker-combat-2");
  assert.equal(accepted.state.architecture[0].owner_session, "worker-combat-2");
  assert.equal(accepted.state.sessions.find((item) => item.id === "worker-combat-1").status, "retired");
});

test("CLI initializes, validates, checkpoints, and accepts a handoff", () => {
  const box = sandbox();
  try {
    let result = runCli(["init", "--name", "CLI Test"], box.root);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(box.read(".apm/local/.gitignore"), "*\n!.gitignore\n");
    const stateFile = stateFileForRoot(box.root);
    const state = JSON.parse(readFileSync(stateFile, "utf8"));
    state.project.mission = "Keep the project coherent across session generations.";
    state.project.status = "active";
    state.invariants.push({ id: "I1", text: "Preserve the original architecture.", authority: "user", status: "active" });
    state.sessions.push({
      id: "manager-2",
      role: "manager",
      generation: 2,
      scope: "project-wide coordination",
      status: "starting",
      context: { health: "green", last_checkpoint: null, last_refresh: fixedNow, compactions: 0, signals: [], next_action: "acknowledge" },
    });
    state.sessions.push({
      id: "worker-1",
      role: "worker",
      generation: 1,
      scope: "test domain",
      status: "compact-due",
      context: { health: "amber", last_checkpoint: null, last_refresh: fixedNow, compactions: 0, signals: ["repeated one resolved question"], next_action: "checkpoint before compact" },
    });
    saveProject(stateFile, state);

    result = runCli(["validate"], box.root);
    assert.equal(result.status, 0, result.stdout + result.stderr);

    box.write(".apm/checkpoints/worker-1.md", "# Worker checkpoint\n\nObjective: preserve the test domain.\nNext: compact, reload this checkpoint, and restate the objective.\n");
    result = runCli(["checkpoint", "--session", "worker-1", "--file", ".apm/checkpoints/worker-1.md", "--health", "green", "--compacted"], box.root);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    const checkpointed = JSON.parse(readFileSync(stateFile, "utf8"));
    const worker = checkpointed.sessions.find((item) => item.id === "worker-1");
    assert.equal(worker.context.compactions, 1);
    assert.match(worker.context.checkpoint_sha256, /^[a-f0-9]{64}$/);

    result = runCli(["handoff", "--from", "manager-1", "--to", "manager-2"], box.root);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert(box.read(".apm/handoffs/H1.md").includes("Keep the project coherent"));

    box.write(".apm/handoffs/H1-ack.md", [
      "Mission: Keep the project coherent across session generations.",
      "Invariant: Preserve the original architecture.",
      "Phase: setup.",
      "Largest risk: context drift.",
      "Next: verify state, inspect active work, then assign the next bounded workstream.",
    ].join("\n"));
    result = runCli(["accept-handoff", "--id", "H1", "--ack-file", ".apm/handoffs/H1-ack.md"], box.root);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    const accepted = JSON.parse(readFileSync(stateFile, "utf8"));
    assert.equal(accepted.project.manager_session, "manager-2");
  } finally {
    box.cleanup();
  }
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
    console.log(`FAIL ${item.name}\n     ${String(error.stack ?? error.message).replace(/\n/g, "\n     ")}`);
  }
}

console.log(`\n${passed}/${tests.length} project-state tests passed`);
if (failures.length) {
  console.log(`failed: ${failures.join(", ")}`);
  process.exit(1);
}
