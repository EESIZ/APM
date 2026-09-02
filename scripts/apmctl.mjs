#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import process from "node:process";
import {
  acceptHandoff,
  createProject,
  hashFile,
  loadProject,
  prepareHandoff,
  recordCheckpoint,
  relativeProjectPath,
  renderBrief,
  renderHandoff,
  saveProject,
  stateFileForRoot,
  summarizeProject,
  validateProject,
} from "./lib/project-state.mjs";

const argv = process.argv.slice(2);
const command = argv[0];
const args = argv.slice(1);

function usage() {
  console.log(`APM persistent-project state tool

usage:
  apmctl.mjs init --name NAME [--manager ID] [--root DIR] [--json]
  apmctl.mjs validate [--root DIR] [--json]
  apmctl.mjs status [--root DIR] [--json]
  apmctl.mjs brief --session ID [--root DIR]
  apmctl.mjs checkpoint --session ID --file PATH --health LEVEL [--compacted] [--root DIR] [--json]
  apmctl.mjs handoff --from ID --to ID [--out PATH] [--root DIR] [--json]
  apmctl.mjs accept-handoff --id ID --ack-file PATH [--root DIR] [--json]

Context health: green | amber | red | unknown

The tool validates and summarizes durable state. It never blocks ordinary project tools,
chooses delegation, or treats a valid state file as proof that an artifact is correct.`);
}

function fail(message, code = 2) {
  console.error(`apmctl: ${message}`);
  process.exit(code);
}

function option(name, required = false) {
  const index = args.indexOf(name);
  if (index === -1) {
    if (required) fail(`${name} is required`);
    return null;
  }
  const value = args[index + 1];
  if (!value || value.startsWith("--")) fail(`${name} requires a value`);
  return value;
}

function flag(name) {
  return args.includes(name);
}

function projectRoot() {
  return resolve(option("--root") ?? process.cwd());
}

function ensureKnownOptions(allowed) {
  const values = new Set();
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith("--")) continue;
    if (!allowed.has(arg)) fail(`unknown option ${arg}`);
    if (!["--json", "--compacted"].includes(arg)) {
      values.add(index + 1);
      index += 1;
    }
  }
  for (let index = 0; index < args.length; index += 1) {
    if (!args[index].startsWith("--") && !values.has(index)) fail(`unexpected argument ${args[index]}`);
  }
}

function printJson(value) {
  console.log(JSON.stringify(value, null, 2));
}

function printStatus(summary, file) {
  const project = summary.project ?? {};
  console.log(`APM project: ${project.name ?? "unknown"}`);
  console.log(`State file: ${file}`);
  console.log(`Mission: ${project.mission || "UNSET"}`);
  console.log(`Phase/status: ${project.phase ?? "unknown"} / ${project.status ?? "unknown"}`);
  console.log(`Manager: ${project.manager_session ?? "unknown"}`);
  console.log(`Sessions: ${JSON.stringify(summary.sessions)}`);
  console.log(`Context health: ${JSON.stringify(summary.session_health)}`);
  console.log(`Workstreams: ${JSON.stringify(summary.workstreams)}`);
  console.log(`Prepared handoffs: ${summary.prepared_handoffs}`);
  console.log(`Project reviews: ${summary.reviews}`);
  if (summary.errors.length) {
    console.log("Errors:");
    for (const item of summary.errors) console.log(`- ${item}`);
  }
  if (summary.warnings.length) {
    console.log("Warnings:");
    for (const item of summary.warnings) console.log(`- ${item}`);
  }
  if (summary.actions.length) {
    console.log("Next management actions:");
    for (const item of summary.actions) console.log(`- ${item}`);
  }
  if (!summary.errors.length && !summary.warnings.length) console.log("State health: clean");
}

function ensureInsideProject(root, file, label) {
  const stored = relativeProjectPath(root, file);
  if (isAbsolute(stored)) fail(`${label} must be inside the project root`);
  return stored;
}

function load(root) {
  try {
    return loadProject(root);
  } catch (error) {
    fail(error.message);
  }
}

function validateOrFail(state, root, operation) {
  const validation = validateProject(state, { root });
  if (validation.errors.length) {
    fail(`${operation} would leave invalid state: ${validation.errors.join("; ")}`);
  }
  return validation;
}

if (!command || ["help", "--help", "-h"].includes(command)) {
  usage();
  process.exit(0);
}

try {
  if (command === "init") {
    ensureKnownOptions(new Set(["--name", "--manager", "--root", "--json"]));
    const root = projectRoot();
    const name = option("--name", true);
    const manager = option("--manager") ?? "manager-1";
    const file = stateFileForRoot(root);
    if (existsSync(file)) fail(`refusing to overwrite existing ${file}`);
    const state = createProject(name, manager);
    mkdirSync(resolve(root, ".apm", "checkpoints"), { recursive: true });
    mkdirSync(resolve(root, ".apm", "handoffs"), { recursive: true });
    const localDir = resolve(root, ".apm", "local");
    mkdirSync(localDir, { recursive: true });
    const localIgnore = resolve(localDir, ".gitignore");
    if (!existsSync(localIgnore)) writeFileSync(localIgnore, "*\n!.gitignore\n", "utf8");
    saveProject(file, state);
    const validation = validateProject(state, { root });
    const output = { file, state, validation };
    if (flag("--json")) printJson(output);
    else {
      console.log(`Initialized APM project state at ${file}`);
      console.log("Next: record the mission, exact directives, invariants, persistent sessions, and workstreams.");
    }
    process.exit(0);
  }

  if (command === "validate" || command === "status") {
    ensureKnownOptions(new Set(["--root", "--json"]));
    const root = projectRoot();
    const loaded = load(root);
    const validation = validateProject(loaded.state, { root });
    const summary = summarizeProject(loaded.state, validation);
    if (flag("--json")) printJson({ file: loaded.file, ...summary });
    else printStatus(summary, loaded.file);
    process.exit(validation.errors.length ? 2 : 0);
  }

  if (command === "brief") {
    ensureKnownOptions(new Set(["--session", "--root"]));
    const root = projectRoot();
    const session = option("--session", true);
    const loaded = load(root);
    process.stdout.write(renderBrief(loaded.state, session));
    process.exit(0);
  }

  if (command === "checkpoint") {
    ensureKnownOptions(new Set(["--session", "--file", "--health", "--compacted", "--root", "--json"]));
    const root = projectRoot();
    const session = option("--session", true);
    const inputPath = option("--file", true);
    const health = option("--health", true);
    const absolute = resolve(root, inputPath);
    if (!existsSync(absolute)) fail(`checkpoint file does not exist: ${absolute}`);
    if (!readFileSync(absolute, "utf8").trim()) fail("checkpoint file is empty");
    const stored = ensureInsideProject(root, absolute, "checkpoint");
    const loaded = load(root);
    const next = recordCheckpoint(loaded.state, session, stored, hashFile(absolute), health, flag("--compacted"));
    const validation = validateOrFail(next, root, "checkpoint");
    saveProject(loaded.file, next);
    const output = { file: loaded.file, session, checkpoint: stored, compacted: flag("--compacted"), validation };
    if (flag("--json")) printJson(output);
    else console.log(`Recorded checkpoint for ${session}: ${stored}`);
    process.exit(0);
  }

  if (command === "handoff") {
    ensureKnownOptions(new Set(["--from", "--to", "--out", "--root", "--json"]));
    const root = projectRoot();
    const from = option("--from", true);
    const to = option("--to", true);
    const loaded = load(root);
    const prepared = prepareHandoff(loaded.state, from, to, "pending");
    const defaultOutput = resolve(root, ".apm", "handoffs", `${prepared.handoff.id}.md`);
    const outputFile = resolve(root, option("--out") ?? defaultOutput);
    const stored = ensureInsideProject(root, outputFile, "handoff packet");
    prepared.handoff.packet = stored;
    mkdirSync(dirname(outputFile), { recursive: true });
    writeFileSync(outputFile, renderHandoff(prepared.state, prepared.handoff), "utf8");
    prepared.handoff.packet_sha256 = hashFile(outputFile);
    validateOrFail(prepared.state, root, "handoff preparation");
    saveProject(loaded.file, prepared.state);
    const output = { file: loaded.file, handoff: prepared.handoff, packet: outputFile };
    if (flag("--json")) printJson(output);
    else {
      console.log(`Prepared ${prepared.handoff.id}: ${from} -> ${to}`);
      console.log(`Packet: ${outputFile}`);
      console.log("The source remains authoritative until a checked acknowledgement is accepted.");
    }
    process.exit(0);
  }

  if (command === "accept-handoff") {
    ensureKnownOptions(new Set(["--id", "--ack-file", "--root", "--json"]));
    const root = projectRoot();
    const id = option("--id", true);
    const ackInput = option("--ack-file", true);
    const ackFile = resolve(root, ackInput);
    if (!existsSync(ackFile)) fail(`acknowledgement file does not exist: ${ackFile}`);
    const ackText = readFileSync(ackFile, "utf8").trim();
    if (ackText.length < 80) fail("successor acknowledgement is too short to establish continuity");
    const stored = ensureInsideProject(root, ackFile, "acknowledgement");
    const loaded = load(root);
    const accepted = acceptHandoff(loaded.state, id, { path: stored, sha256: hashFile(ackFile) });
    const validation = validateOrFail(accepted.state, root, "handoff acceptance");
    saveProject(loaded.file, accepted.state);
    const output = { file: loaded.file, handoff: accepted.handoff, validation };
    if (flag("--json")) printJson(output);
    else console.log(`Accepted ${id}; authority and active ownership transferred to ${accepted.handoff.to}.`);
    process.exit(0);
  }

  fail(`unknown command ${command}`);
} catch (error) {
  fail(error.message);
}
