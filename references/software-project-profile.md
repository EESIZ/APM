# Software Project Profile

This profile generalizes EESIZ's `dev-director` skill and the live FiveGround workflow in which one director session coordinates several persistent worker sessions that share a repository. It is a domain profile for APM, not a universal requirement for research, writing, or other projects.

## Stable Session Organization

- The human creates and removes sessions.
- The director coordinates; it does not become the routine implementer.
- Assign related follow-up work to the session that already holds the relevant healthy context.
- A recorder may maintain the roster and project board from measured repository state.
- Direct human communication with any session remains valid. Consequential instructions are propagated to affected owners and project state.

## Exact Approval

For commits, deployment, destructive actions, and architecture changes, store the user's exact approval sentence and its scope. A peer's summary that approval exists is not sufficient. Approval does not automatically transfer across workstreams, actions, or manager generations.

Before assigning work, inspect current commit ancestry and files to avoid reallocating work that already landed.

## Shared-Tree Ownership

- Give coupled files and non-mergeable resources one active owner.
- Record ownership transfers and remove stale ownership from the current board.
- A path-limited commit cannot prevent two sessions from editing the same file; coordination must happen before editing.
- Do not consume another session's staged or uncommitted changes implicitly.
- Serialize shared binary assets and announce both lock and unlock.

## Candidate And Commit Train

For repositories where several sessions share one working tree:

1. A worker submits a candidate artifact with an exact file list, exclusions, and evidence.
2. The director or verifier tests the candidate in an isolated worktree based on the intended commit.
3. The accepted commit uses explicit paths or an independently checked index so unrelated staged work cannot be swept in.
4. After commit, compare the committed artifact with the verified candidate.

Use the repository's native contribution and version-control rules when they are stricter. Do not copy destructive cleanup commands into a shared candidate area.

## Verification

- State exactly what was tested and how many targets were in scope.
- Clear or isolate shared caches when stale or concurrently mutated state could falsify the result.
- For a gate claiming absence, plant a known violation and confirm the gate turns red, then restore it.
- Pair negative results with a positive control when the measuring path itself can fail.
- Search behavior through construction and consumption, not only literal names.
- Close work from current code and ancestry, not from an old board or memory.

These controls are expensive enough to apply proportionally. Use full isolation for integration, release, disputed, or high-impact candidates; do not force a release train around a harmless local edit.

## Deployment With A User Editing Channel

When users can modify a live or separate working copy, verify three linked states before deployment:

1. live-only changes are reconciled with the repository;
2. approved user changes are included in the deployed commit;
3. the editing channel advances to the deployed base afterward.

Otherwise a later edit can silently restore an old base even when the deployment itself succeeded.

## Context Lifecycle

- Workers checkpoint their local working set before `compact`.
- The director periodically hands project authority to a new manager generation.
- The successor receives the durable project state and bounded handoff, not the full predecessor transcript.
- A session that repeatedly contradicts measured state, silently narrows work, or claims unread inspection is reported to the human for replacement.

This is the operating pattern the previous one-shot APM benchmark failed to model.
