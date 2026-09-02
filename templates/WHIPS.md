# WHIPS Project Brief

This portable Markdown brief is for runtimes that cannot use `.apm/project.json`. The JSON state remains preferred because references and lifecycle invariants can be checked deterministically.

## Mission

PROJECT: <name>
MISSION: <outcome that must survive every session>
PHASE: <current phase>
HUMAN AUTHORITY: <user identity or role>
ACTIVE MANAGER: <session id and generation>

## Exact Directives

- U1: "<exact user sentence>"
  SCOPE: <bounded authority>
  SOURCE: <message id, transcript location, or direct manager observation>
  STATUS: active

## Invariants

- I1: <rule that may not drift>

## Architecture

- A1: <area, boundary, interface, and owning session>

## Session Roster

| Session | Role | Generation | Stable scope | Status | Context health | Checkpoint | Next action |
| --- | --- | ---: | --- | --- | --- | --- | --- |
| manager-1 | manager | 1 | project-wide | active | green | none | assign W1 |
| worker-1 | worker | 1 | <domain> | active | green | <path> | execute W1 |

## Workstreams

| Workstream | Owner | State | Dependencies | Scope | Output | Evidence | Decision needed |
| --- | --- | --- | --- | --- | --- | --- | --- |
| W1 | worker-1 | active | none | <boundary> | pending | pending | none |

## Decisions

- D1: <decision>
  AUTHORITY: <user or manager>
  AFFECTS: <ids>
  EVIDENCE: <exact directive or measured basis>

## Observations

- MEASURED: <claim and source>
- REPORTED: <claim and reporting session>
- PLANNED: <future action and owner>
- UNKNOWN: <fact still requiring measurement>

## Context And Succession

- AMBER/RED SESSIONS: <ids, signals, and required action>
- PREPARED HANDOFFS: <ids or none>
- NEXT THREE MANAGEMENT ACTIONS:
  1. <action>
  2. <action>
  3. <action>
