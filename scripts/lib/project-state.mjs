import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

export const SCHEMA_VERSION = 2;

export const PROJECT_STATUSES = new Set(["draft", "active", "paused", "complete"]);
export const SESSION_ROLES = new Set(["manager", "worker", "recorder", "verifier", "integrator"]);
export const SESSION_STATUSES = new Set([
  "starting", "active", "compact-due", "handoff-due", "replacing", "retired", "lost",
]);
export const CONTEXT_HEALTH = new Set(["green", "amber", "red", "unknown"]);
export const WORKSTREAM_STATES = new Set([
  "backlog", "ready", "active", "blocked", "review", "accepted", "superseded", "abandoned",
]);
export const DIRECTIVE_STATUSES = new Set(["active", "superseded", "expired"]);
export const DECISION_STATUSES = new Set(["active", "superseded", "rejected"]);
export const OBSERVATION_KINDS = new Set(["measured", "reported", "planned", "unknown"]);
export const HANDOFF_STATUSES = new Set(["prepared", "accepted", "cancelled"]);

const REQUIRED_ARRAYS = [
  "directives", "invariants", "architecture", "sessions", "workstreams",
  "decisions", "observations", "handoffs", "reviews",
];

const OWNED_STATES = new Set(["ready", "active", "blocked", "review"]);
const LIVE_OWNER_STATUSES = new Set(["active", "compact-due", "handoff-due"]);

function isoNow() {
  return new Date().toISOString();
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function nonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function cleanCell(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
}

function addUniqueIdErrors(items, label, errors) {
  const seen = new Set();
  for (const item of items) {
    if (!item || typeof item !== "object" || !nonEmpty(item.id)) {
      errors.push(`${label} contains an item without an id`);
      continue;
    }
    if (seen.has(item.id)) errors.push(`${label} has duplicate id ${item.id}`);
    seen.add(item.id);
  }
}

function findDependencyCycles(workstreams, errors) {
  const byId = new Map(workstreams.filter((item) => nonEmpty(item?.id)).map((item) => [item.id, item]));
  const visiting = new Set();
  const visited = new Set();

  function visit(id, trail) {
    if (visiting.has(id)) {
      errors.push(`workstream dependency cycle: ${[...trail, id].join(" -> ")}`);
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dependency of asArray(byId.get(id)?.depends_on)) {
      if (byId.has(dependency)) visit(dependency, [...trail, id]);
    }
    visiting.delete(id);
    visited.add(id);
  }

  for (const id of byId.keys()) visit(id, []);
}

export function createProject(name, managerId = "manager-1", now = isoNow()) {
  return {
    schema_version: SCHEMA_VERSION,
    project: {
      name,
      mission: "",
      phase: "setup",
      status: "draft",
      human_authority: "user",
      manager_session: managerId,
    },
    directives: [],
    invariants: [],
    architecture: [],
    sessions: [
      {
        id: managerId,
        role: "manager",
        generation: 1,
        scope: "project-wide coordination",
        status: "active",
        context: {
          health: "green",
          last_checkpoint: null,
          checkpoint_sha256: null,
          last_refresh: now,
          compactions: 0,
          signals: [],
          next_action: "record mission, invariants, persistent sessions, and initial workstreams",
        },
      },
    ],
    workstreams: [],
    decisions: [],
    observations: [],
    handoffs: [],
    reviews: [],
    cadence: {
      manager_review: "after every milestone, architecture decision, or context-health change",
      worker_checkpoint: "before compact, handoff, scope transfer, or red context",
      project_review: "at a stable interval chosen by the human",
    },
    updated_at: now,
  };
}

export function stateFileForRoot(root = process.cwd()) {
  return join(resolve(root), ".apm", "project.json");
}

export function loadProject(root = process.cwd()) {
  const file = stateFileForRoot(root);
  if (!existsSync(file)) throw new Error(`missing ${file}; run apmctl init first`);
  let state;
  try {
    state = JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    throw new Error(`invalid JSON in ${file}: ${error.message}`);
  }
  return { file, root: resolve(root), state };
}

export function saveProject(file, state) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

export function hashFile(file) {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

export function relativeProjectPath(root, file) {
  const absoluteRoot = resolve(root);
  const absoluteFile = resolve(file);
  const rel = relative(absoluteRoot, absoluteFile).replace(/\\/g, "/");
  if (!rel || rel === ".") return ".";
  if (rel === ".." || rel.startsWith("../")) return absoluteFile.replace(/\\/g, "/");
  return rel;
}

export function validateProject(state, options = {}) {
  const root = options.root ? resolve(options.root) : null;
  const errors = [];
  const warnings = [];
  const actions = [];
  const actionSet = new Set();
  const addAction = (action) => {
    if (!actionSet.has(action)) {
      actionSet.add(action);
      actions.push(action);
    }
  };

  if (!state || typeof state !== "object" || Array.isArray(state)) {
    return { errors: ["project state must be a JSON object"], warnings, actions };
  }
  if (state.schema_version !== SCHEMA_VERSION) {
    errors.push(`schema_version must be ${SCHEMA_VERSION}`);
  }
  if (!state.project || typeof state.project !== "object") {
    errors.push("project object is missing");
  }

  for (const field of REQUIRED_ARRAYS) {
    if (!Array.isArray(state[field])) errors.push(`${field} must be an array`);
  }

  const project = state.project ?? {};
  for (const field of ["name", "phase", "status", "human_authority", "manager_session"]) {
    if (!nonEmpty(project[field])) errors.push(`project.${field} is required`);
  }
  if (!PROJECT_STATUSES.has(project.status)) errors.push(`invalid project.status ${JSON.stringify(project.status)}`);
  if (project.status === "active" && !nonEmpty(project.mission)) errors.push("active project requires project.mission");
  if (project.status === "draft" && !nonEmpty(project.mission)) {
    warnings.push("draft project has no mission");
    addAction("Record the project mission before activating work.");
  }

  const directives = asArray(state.directives);
  const invariants = asArray(state.invariants);
  const architecture = asArray(state.architecture);
  const sessions = asArray(state.sessions);
  const workstreams = asArray(state.workstreams);
  const decisions = asArray(state.decisions);
  const observations = asArray(state.observations);
  const handoffs = asArray(state.handoffs);
  const reviews = asArray(state.reviews);

  for (const [items, label] of [
    [directives, "directives"], [invariants, "invariants"], [architecture, "architecture"],
    [sessions, "sessions"], [workstreams, "workstreams"], [decisions, "decisions"],
    [observations, "observations"], [handoffs, "handoffs"], [reviews, "reviews"],
  ]) addUniqueIdErrors(items, label, errors);

  const sessionById = new Map(sessions.filter((item) => nonEmpty(item?.id)).map((item) => [item.id, item]));
  const workstreamById = new Map(workstreams.filter((item) => nonEmpty(item?.id)).map((item) => [item.id, item]));

  for (const directive of directives) {
    if (!nonEmpty(directive?.quote)) errors.push(`${directive?.id ?? "directive"} requires an exact quote`);
    if (!nonEmpty(directive?.scope)) errors.push(`${directive?.id ?? "directive"} requires bounded scope`);
    if (!nonEmpty(directive?.source)) errors.push(`${directive?.id ?? "directive"} requires an original source reference`);
    if (!DIRECTIVE_STATUSES.has(directive?.status)) errors.push(`${directive?.id ?? "directive"} has invalid status`);
  }

  for (const invariant of invariants) {
    if (!nonEmpty(invariant?.text)) errors.push(`${invariant?.id ?? "invariant"} requires text`);
    if (!nonEmpty(invariant?.authority)) errors.push(`${invariant?.id ?? "invariant"} requires authority`);
    if (!DIRECTIVE_STATUSES.has(invariant?.status)) errors.push(`${invariant?.id ?? "invariant"} has invalid status`);
  }
  if (project.status === "active" && !invariants.some((item) => item.status === "active")) {
    warnings.push("active project has no active invariants");
    addAction("Record the architecture or project rules that must survive session turnover.");
  }

  for (const session of sessions) {
    const label = session?.id ?? "session";
    if (!SESSION_ROLES.has(session?.role)) errors.push(`${label} has invalid role ${JSON.stringify(session?.role)}`);
    if (!Number.isInteger(session?.generation) || session.generation < 1) errors.push(`${label} requires a positive generation`);
    if (!nonEmpty(session?.scope)) errors.push(`${label} requires a stable scope`);
    if (!SESSION_STATUSES.has(session?.status)) errors.push(`${label} has invalid status ${JSON.stringify(session?.status)}`);
    if (!session?.context || typeof session.context !== "object") {
      errors.push(`${label} requires context state`);
      continue;
    }
    if (!CONTEXT_HEALTH.has(session.context.health)) errors.push(`${label} has invalid context health`);
    if (!Number.isInteger(session.context.compactions) || session.context.compactions < 0) {
      errors.push(`${label} requires a non-negative compactions count`);
    }
    if (!Array.isArray(session.context.signals)) errors.push(`${label} context.signals must be an array`);

    if (session.context.health === "amber") {
      warnings.push(`${label} context health is amber`);
      addAction(`Checkpoint and refresh ${label}; narrow its working set before more assignments.`);
    }
    if (session.context.health === "red") {
      warnings.push(`${label} context health is red`);
      addAction(`Prepare a handoff or replacement for ${label}.`);
    }
    if (["compact-due", "handoff-due", "replacing"].includes(session.status)) {
      warnings.push(`${label} status is ${session.status}`);
    }
    if (session.context.compactions > 0 && !nonEmpty(session.context.last_checkpoint)) {
      warnings.push(`${label} records compaction without a checkpoint`);
      addAction(`Create and register a continuity checkpoint for ${label}.`);
    }
    if (session.context.compactions > 0 && !nonEmpty(session.context.checkpoint_sha256)) {
      warnings.push(`${label} records compaction without a checkpoint hash`);
      addAction(`Hash and register the continuity checkpoint for ${label}.`);
    }
    if (root && nonEmpty(session.context.last_checkpoint)) {
      const checkpoint = resolve(root, session.context.last_checkpoint);
      if (!existsSync(checkpoint)) {
        warnings.push(`${label} checkpoint is missing at ${session.context.last_checkpoint}`);
        addAction(`Repair the checkpoint reference for ${label} before compact or handoff.`);
      } else if (nonEmpty(session.context.checkpoint_sha256) && hashFile(checkpoint) !== session.context.checkpoint_sha256) {
        errors.push(`${label} checkpoint hash does not match ${session.context.last_checkpoint}`);
      }
    }
  }

  const activeManagers = sessions.filter((item) => item.role === "manager" && item.status === "active");
  if (project.status !== "complete" && activeManagers.length !== 1) {
    errors.push(`non-complete project requires exactly one active manager, found ${activeManagers.length}`);
  }
  const currentManager = sessionById.get(project.manager_session);
  if (!currentManager) errors.push(`project.manager_session references missing session ${project.manager_session}`);
  else {
    if (currentManager.role !== "manager") errors.push(`project.manager_session ${currentManager.id} is not a manager`);
    if (project.status !== "complete" && currentManager.status !== "active") {
      errors.push(`project.manager_session ${currentManager.id} is not active`);
    }
  }

  for (const entry of architecture) {
    const label = entry?.id ?? "architecture entry";
    if (!nonEmpty(entry?.area) || !nonEmpty(entry?.rule)) errors.push(`${label} requires area and rule`);
    if (!Array.isArray(entry?.interfaces)) errors.push(`${label}.interfaces must be an array`);
    if (nonEmpty(entry?.owner_session) && !sessionById.has(entry.owner_session)) {
      errors.push(`${label} references missing owner session ${entry.owner_session}`);
    }
  }

  for (const workstream of workstreams) {
    const label = workstream?.id ?? "workstream";
    if (!nonEmpty(workstream?.title)) errors.push(`${label} requires a title`);
    if (!WORKSTREAM_STATES.has(workstream?.state)) errors.push(`${label} has invalid state ${JSON.stringify(workstream?.state)}`);
    if (!Array.isArray(workstream?.depends_on)) errors.push(`${label}.depends_on must be an array`);
    if (!Array.isArray(workstream?.scope)) errors.push(`${label}.scope must be an array`);
    if (!Array.isArray(workstream?.acceptance)) errors.push(`${label}.acceptance must be an array`);
    if (!Array.isArray(workstream?.outputs)) errors.push(`${label}.outputs must be an array`);
    if (!Array.isArray(workstream?.evidence)) errors.push(`${label}.evidence must be an array`);

    for (const dependency of asArray(workstream?.depends_on)) {
      if (!workstreamById.has(dependency)) errors.push(`${label} references missing dependency ${dependency}`);
    }

    if (OWNED_STATES.has(workstream?.state)) {
      const owner = sessionById.get(workstream?.owner_session);
      if (!owner) errors.push(`${label} requires an existing owner session`);
      else {
        if (owner.role === "manager") errors.push(`${label} assigns production work to manager ${owner.id}`);
        if (!LIVE_OWNER_STATUSES.has(owner.status)) errors.push(`${label} owner ${owner.id} is ${owner.status}`);
      }
      const unmet = asArray(workstream.depends_on).filter((id) => workstreamById.get(id)?.state !== "accepted");
      if (["ready", "active", "review"].includes(workstream.state) && unmet.length) {
        errors.push(`${label} is ${workstream.state} with unmet dependencies ${unmet.join(", ")}`);
      }
    }
    if (workstream?.state === "accepted") {
      if (!asArray(workstream.outputs).length) errors.push(`${label} is accepted without outputs`);
      if (!asArray(workstream.evidence).length) errors.push(`${label} is accepted without evidence`);
    }
    if (nonEmpty(workstream?.decision_needed)) {
      warnings.push(`${label} needs decision: ${workstream.decision_needed}`);
      addAction(`Resolve the recorded decision for ${label} or keep dependent work blocked.`);
    }
  }
  findDependencyCycles(workstreams, errors);

  for (const decision of decisions) {
    const label = decision?.id ?? "decision";
    if (!nonEmpty(decision?.text) || !nonEmpty(decision?.authority)) errors.push(`${label} requires text and authority`);
    if (!DECISION_STATUSES.has(decision?.status)) errors.push(`${label} has invalid status`);
    if (!Array.isArray(decision?.affects)) errors.push(`${label}.affects must be an array`);
    if (!nonEmpty(decision?.evidence)) errors.push(`${label} requires authority evidence`);
  }

  for (const observation of observations) {
    const label = observation?.id ?? "observation";
    if (!OBSERVATION_KINDS.has(observation?.kind)) errors.push(`${label} has invalid kind`);
    if (!nonEmpty(observation?.claim) || !nonEmpty(observation?.source)) errors.push(`${label} requires claim and source`);
  }

  for (const handoff of handoffs) {
    const label = handoff?.id ?? "handoff";
    if (!HANDOFF_STATUSES.has(handoff?.status)) errors.push(`${label} has invalid status`);
    const from = sessionById.get(handoff?.from);
    const to = sessionById.get(handoff?.to);
    if (!from) errors.push(`${label} references missing source session ${handoff?.from}`);
    if (!to) errors.push(`${label} references missing target session ${handoff?.to}`);
    if (from && to && from.role !== to.role) errors.push(`${label} crosses roles ${from.role} -> ${to.role}`);
    if (from && handoff?.role !== from.role) errors.push(`${label}.role does not match source role`);
    if (!nonEmpty(handoff?.packet)) errors.push(`${label} requires a packet path`);
    if (!nonEmpty(handoff?.packet_sha256)) errors.push(`${label} requires a packet sha256`);
    if (root && nonEmpty(handoff?.packet)) {
      const packet = resolve(root, handoff.packet);
      if (!existsSync(packet)) errors.push(`${label} packet is missing at ${handoff.packet}`);
      else if (nonEmpty(handoff.packet_sha256) && hashFile(packet) !== handoff.packet_sha256) {
        errors.push(`${label} packet hash does not match ${handoff.packet}`);
      }
    }
    if (handoff?.status === "prepared") {
      warnings.push(`${label} is prepared but not accepted`);
      addAction(`Review successor acknowledgement and accept or cancel ${label}.`);
    }
    if (handoff?.status === "accepted" && !handoff?.acknowledgement) {
      errors.push(`${label} is accepted without successor acknowledgement`);
    }
    if (handoff?.status === "accepted" && root && handoff?.acknowledgement?.path) {
      const acknowledgement = resolve(root, handoff.acknowledgement.path);
      if (!existsSync(acknowledgement)) errors.push(`${label} acknowledgement is missing at ${handoff.acknowledgement.path}`);
      else if (hashFile(acknowledgement) !== handoff.acknowledgement.sha256) {
        errors.push(`${label} acknowledgement hash does not match ${handoff.acknowledgement.path}`);
      }
    }
  }

  const metricFields = [
    "accepted_workstreams", "architecture_violations", "regressions", "rework_events",
    "compactions", "handoffs", "integration_losses", "elapsed_hours", "tokens", "cost_usd",
  ];
  for (const review of reviews) {
    const label = review?.id ?? "review";
    if (!nonEmpty(review?.period)) errors.push(`${label} requires a period`);
    if (!Array.isArray(review?.evidence)) errors.push(`${label}.evidence must be an array`);
    for (const field of metricFields) {
      const value = review?.[field];
      if (value !== null && value !== undefined && (typeof value !== "number" || value < 0)) {
        errors.push(`${label}.${field} must be a non-negative number or null`);
      }
    }
  }

  return { errors, warnings, actions };
}

export function summarizeProject(state, validation = validateProject(state)) {
  const countBy = (items, field) => Object.fromEntries(
    [...asArray(items).reduce((map, item) => {
      const key = String(item?.[field] ?? "unknown");
      map.set(key, (map.get(key) ?? 0) + 1);
      return map;
    }, new Map()).entries()].sort(([a], [b]) => a.localeCompare(b)),
  );
  return {
    project: state?.project ?? null,
    sessions: countBy(state?.sessions, "status"),
    session_health: Object.fromEntries(
      [...asArray(state?.sessions).reduce((map, item) => {
        const key = String(item?.context?.health ?? "unknown");
        map.set(key, (map.get(key) ?? 0) + 1);
        return map;
      }, new Map()).entries()].sort(([a], [b]) => a.localeCompare(b)),
    ),
    workstreams: countBy(state?.workstreams, "state"),
    prepared_handoffs: asArray(state?.handoffs).filter((item) => item.status === "prepared").length,
    reviews: asArray(state?.reviews).length,
    latest_review: asArray(state?.reviews).at(-1) ?? null,
    errors: validation.errors,
    warnings: validation.warnings,
    actions: validation.actions,
  };
}

function addList(lines, items, empty = "none") {
  if (!items.length) lines.push(`- ${empty}`);
  else for (const item of items) lines.push(`- ${item}`);
}

function relevantDecisions(state, workIds, managerView) {
  const active = asArray(state.decisions).filter((item) => item.status === "active");
  if (managerView) return active;
  return active.filter((item) => !asArray(item.affects).length || asArray(item.affects).some((id) => workIds.has(id)));
}

export function renderBrief(state, sessionId) {
  const session = asArray(state.sessions).find((item) => item.id === sessionId);
  if (!session) throw new Error(`unknown session ${sessionId}`);
  const managerView = session.role === "manager" || session.role === "recorder";
  const work = managerView
    ? asArray(state.workstreams).filter((item) => !["superseded", "abandoned"].includes(item.state))
    : asArray(state.workstreams).filter((item) => item.owner_session === session.id);
  const workIds = new Set(work.map((item) => item.id));
  const validation = validateProject(state);
  const lines = [
    `# APM Session Brief: ${session.id}`,
    "",
    `PROJECT: ${state.project.name}`,
    `MISSION: ${state.project.mission || "UNSET"}`,
    `PHASE: ${state.project.phase}`,
    `HUMAN AUTHORITY: ${state.project.human_authority}`,
    `ACTIVE MANAGER: ${state.project.manager_session}`,
    `SESSION ROLE: ${session.role}`,
    `SESSION GENERATION: ${session.generation}`,
    `STABLE SCOPE: ${session.scope}`,
    `CONTEXT HEALTH: ${session.context?.health ?? "unknown"}`,
    "",
    "## Exact Active Directives",
    "",
  ];
  addList(lines, asArray(state.directives).filter((item) => item.status === "active")
    .map((item) => `${item.id}: "${item.quote}" [scope: ${item.scope}]`));

  lines.push("", "## Active Invariants", "");
  addList(lines, asArray(state.invariants).filter((item) => item.status === "active")
    .map((item) => `${item.id}: ${item.text} [authority: ${item.authority}]`));

  lines.push("", "## Architecture", "");
  const architecture = managerView
    ? asArray(state.architecture)
    : asArray(state.architecture).filter((item) => item.owner_session === session.id || !item.owner_session);
  addList(lines, architecture.map((item) => `${item.id}: ${item.area} - ${item.rule} [owner: ${item.owner_session || "unassigned"}; interfaces: ${asArray(item.interfaces).join(", ") || "none"}]`));

  if (managerView) {
    lines.push("", "## Session Roster", "", "| Session | Role | Generation | Scope | Status | Health | Next |", "| --- | --- | ---: | --- | --- | --- | --- |");
    for (const item of asArray(state.sessions)) {
      lines.push(`| ${cleanCell(item.id)} | ${cleanCell(item.role)} | ${item.generation} | ${cleanCell(item.scope)} | ${cleanCell(item.status)} | ${cleanCell(item.context?.health)} | ${cleanCell(item.context?.next_action)} |`);
    }
  }

  lines.push("", "## Workstreams", "", "| Work | Owner | State | Dependencies | Scope | Outputs | Evidence | Decision needed |", "| --- | --- | --- | --- | --- | --- | --- | --- |");
  if (!work.length) lines.push("| none | - | - | - | - | - | - | - |");
  for (const item of work) {
    lines.push(`| ${cleanCell(`${item.id}: ${item.title}`)} | ${cleanCell(item.owner_session || "unassigned")} | ${cleanCell(item.state)} | ${cleanCell(asArray(item.depends_on).join(", ") || "none")} | ${cleanCell(asArray(item.scope).join(", ") || "none")} | ${cleanCell(asArray(item.outputs).join(", ") || "pending")} | ${cleanCell(asArray(item.evidence).join(", ") || "pending")} | ${cleanCell(item.decision_needed || "none")} |`);
  }

  lines.push("", "## Active Decisions", "");
  addList(lines, relevantDecisions(state, workIds, managerView)
    .map((item) => `${item.id}: ${item.text} [authority: ${item.authority}; evidence: ${item.evidence}]`));

  lines.push("", "## Recent Observations", "");
  const observations = asArray(state.observations).slice(-12);
  addList(lines, observations.map((item) => `${String(item.kind).toUpperCase()} ${item.id}: ${item.claim} [source: ${item.source}]`));

  if (managerView && asArray(state.reviews).length) {
    const review = asArray(state.reviews).at(-1);
    lines.push("", "## Latest Project Review", "", `- ${review.id} (${review.period}): accepted=${review.accepted_workstreams ?? "unknown"}, architecture violations=${review.architecture_violations ?? "unknown"}, regressions=${review.regressions ?? "unknown"}, rework=${review.rework_events ?? "unknown"}, integration loss=${review.integration_losses ?? "unknown"}, cost=${review.cost_usd ?? "unknown"}`);
  }

  lines.push("", "## Next Management Actions", "");
  if (managerView) addList(lines, validation.actions);
  else addList(lines, [session.context?.next_action || "Ask the manager for a current assignment."]);

  lines.push("", "This brief is durable project context, not approval to exceed the recorded scope.");
  return `${lines.join("\n")}\n`;
}

function nextHandoffId(handoffs) {
  const max = asArray(handoffs).reduce((value, item) => {
    const match = String(item?.id ?? "").match(/^H(\d+)$/i);
    return match ? Math.max(value, Number(match[1])) : value;
  }, 0);
  return `H${max + 1}`;
}

export function prepareHandoff(state, fromId, toId, packetPath, now = isoNow()) {
  const next = clone(state);
  const from = asArray(next.sessions).find((item) => item.id === fromId);
  const to = asArray(next.sessions).find((item) => item.id === toId);
  if (!from) throw new Error(`unknown source session ${fromId}`);
  if (!to) throw new Error(`unknown target session ${toId}; register the successor first`);
  if (from.id === to.id) throw new Error("handoff source and target must differ");
  if (from.role !== to.role) throw new Error(`handoff roles differ: ${from.role} -> ${to.role}`);
  if (from.status !== "active") throw new Error(`source session ${from.id} must remain active until acceptance`);
  if (!["starting", "replacing"].includes(to.status)) throw new Error(`target session ${to.id} must be starting or replacing`);
  if (asArray(next.handoffs).some((item) => item.status === "prepared" && (item.from === fromId || item.to === toId))) {
    throw new Error("a prepared handoff already involves one of these sessions");
  }
  const id = nextHandoffId(next.handoffs);
  const record = {
    id,
    from: fromId,
    to: toId,
    role: from.role,
    status: "prepared",
    packet: packetPath,
    packet_sha256: null,
    prepared_at: now,
    accepted_at: null,
    acknowledgement: null,
  };
  next.handoffs.push(record);
  to.status = "replacing";
  next.updated_at = now;
  return { state: next, handoff: record };
}

export function renderHandoff(state, handoff) {
  const from = asArray(state.sessions).find((item) => item.id === handoff.from);
  const to = asArray(state.sessions).find((item) => item.id === handoff.to);
  if (!from || !to) throw new Error("handoff references missing sessions");
  const lines = [
    `# APM Handoff: ${handoff.id}`,
    "",
    `FROM: ${from.id} generation ${from.generation}`,
    `TO: ${to.id} generation ${to.generation}`,
    `ROLE: ${handoff.role}`,
    `STATUS: ${handoff.status}`,
    `PREPARED AT: ${handoff.prepared_at}`,
    "",
    renderBrief(state, to.id).trimEnd(),
    "",
    "## Successor Acknowledgement",
    "",
    "Write a separate acknowledgement file that restates:",
    "",
    "1. the mission;",
    "2. the active invariants;",
    "3. the current phase;",
    "4. the largest unresolved risk;",
    "5. the next three actions and owners;",
    "6. any discrepancy with this packet.",
    "",
    "Authority transfers only after the acknowledgement is checked and accepted.",
  ];
  return `${lines.join("\n")}\n`;
}

export function acceptHandoff(state, handoffId, acknowledgement, now = isoNow()) {
  const next = clone(state);
  const handoff = asArray(next.handoffs).find((item) => item.id === handoffId);
  if (!handoff) throw new Error(`unknown handoff ${handoffId}`);
  if (handoff.status !== "prepared") throw new Error(`handoff ${handoffId} is ${handoff.status}`);
  if (!acknowledgement || !nonEmpty(acknowledgement.path) || !nonEmpty(acknowledgement.sha256)) {
    throw new Error("successor acknowledgement path and sha256 are required");
  }
  const from = asArray(next.sessions).find((item) => item.id === handoff.from);
  const to = asArray(next.sessions).find((item) => item.id === handoff.to);
  if (!from || !to) throw new Error("handoff references missing sessions");
  if (from.status !== "active") throw new Error(`source ${from.id} is no longer active`);
  if (!['starting', 'replacing'].includes(to.status)) throw new Error(`target ${to.id} is not awaiting succession`);

  handoff.status = "accepted";
  handoff.accepted_at = now;
  handoff.acknowledgement = acknowledgement;
  from.status = "retired";
  to.status = "active";
  to.context.last_refresh = now;

  if (handoff.role === "manager") next.project.manager_session = to.id;
  else {
    for (const workstream of asArray(next.workstreams)) {
      if (workstream.owner_session === from.id && !["accepted", "superseded", "abandoned"].includes(workstream.state)) {
        workstream.owner_session = to.id;
        workstream.updated_at = now;
      }
    }
    for (const entry of asArray(next.architecture)) {
      if (entry.owner_session === from.id) entry.owner_session = to.id;
    }
  }
  next.updated_at = now;
  return { state: next, handoff };
}

export function recordCheckpoint(state, sessionId, checkpointPath, checkpointSha256, health, compacted, now = isoNow()) {
  if (!CONTEXT_HEALTH.has(health)) throw new Error(`invalid context health ${health}`);
  const next = clone(state);
  const session = asArray(next.sessions).find((item) => item.id === sessionId);
  if (!session) throw new Error(`unknown session ${sessionId}`);
  if (["retired", "lost"].includes(session.status)) throw new Error(`cannot checkpoint ${session.status} session ${sessionId}`);
  session.context.last_checkpoint = checkpointPath;
  session.context.checkpoint_sha256 = checkpointSha256;
  session.context.last_refresh = now;
  session.context.health = health;
  if (compacted) session.context.compactions += 1;
  if (health === "red") session.status = "handoff-due";
  else if (health === "amber") session.status = "compact-due";
  else if (["compact-due", "handoff-due"].includes(session.status)) session.status = "active";
  next.updated_at = now;
  return next;
}
