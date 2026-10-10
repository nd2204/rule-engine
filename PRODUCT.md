# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Delegated: React + Vite + TypeScript single-page app, standalone from the Go service and talking only to the management layer's HTTP API. Chosen because the BRD (`docs/brd/14-out-of-scope.md`) already frames the Phase 2 UI as an independent web app over the normalized JSON AST schema, and editing Decision Tables and inspecting nested Evaluation Traces needs rich client-side interaction. The Go service (core + management layer, ADR-0005/0006) is the backend and is not part of the UI stack.

## Users

Two primary users on equal footing (see `CONTEXT.md`, Roles):

- **Rule Author**: owns a policy (POS discounts, customer tiers, irrigation actions, alert levels). Drafts and edits a Decision's Rule Set as a Decision Table, writes Test Cases, runs Simulation, then Publishes or Rolls back. Today this job is done through a thin CLI (`bre draft`, `bre simulate`, `bre publish`, `bre rollback`). Not assumed to be a programmer.
- **Integrator**: connects a calling application (POS backend, IoT backend) to the engine. Needs to see a Decision's input schema contract, which versions are Published and where the Latest Pointer is, and how to read a Decision Result, Trace Summary, and full Evaluation Trace.

System Administrators / DevOps appear in the BRD stakeholders but are not a target of the console.

## Product Purpose

A domain-agnostic Business Rule Engine that moves business decisions out of application code, so a policy can change without editing code, rebuilding, or redeploying. The engine evaluates Facts against a Published Decision Version in memory, deterministically and in under 1 ms, and explains every result.

The surface for impeccable work is the **Rule Author console** (Phase 2): the web front end of the Decision lifecycle, Draft → Simulation (Test Cases, diff against Latest) → Publish → Rollback, with Evaluation Traces as the main explanation tool.

Success means a policy change goes from edit to Published safely, with fewer steps and less time than the code → build → deploy flow. The thesis's usability evaluation measures this with a scripted policy-change scenario.

## Positioning

- Decisions are pure, deterministic functions of Facts and an immutable Decision Version. Any past decision can be replayed into a full Evaluation Trace from its Facts and Trace Summary.
- Rules are data (Decision Table cells parsed into a JSON AST), never executable code. No `eval`.
- Publish is gated: at least one Test Case, all passing, plus explicit acknowledgement of Stale Drafts and Breaking Changes. Rollback moves an explicit Latest Pointer and never deletes a version.
- Single-pass Decision Table evaluation with four Hit Policies (`FIRST`, `UNIQUE`, `PRIORITY`, `COLLECT`), not Rete/forward chaining, so every result can be explained.

## Operating Context

- Proven on two deliberately contrasting pilot domains, Retail ERP/POS and Smart IoT Irrigation, with four Decisions covering all four Hit Policies: `calculate-pos-discounts` (COLLECT), `classify-customer-tier` (UNIQUE), `determine-irrigation-action` (FIRST), `determine-alert-level` (PRIORITY).
- Decisions travel as self-contained JSON/YAML Decision Definition Artifacts (import/export, Git-friendly).
- One service process: pure in-memory core plus a management layer persisting Drafts, Test Cases, Decision Versions, and Latest Pointers in SQLite. Callers evaluate over HTTP.
- This is a graduation thesis project (EPU). The console will be demonstrated to and judged by the thesis committee, and its screens may appear as figures in the Vietnamese thesis (`docs/thesis/`).

## Capabilities and Constraints

- Console capabilities follow the management HTTP API: list Decisions and Decision Versions; create several Drafts per Decision from Latest; edit Rules as a Decision Table (one Rule per row, one simple condition per cell), with raw JSON AST for conditions that do not fit a cell (collection iterators `some`/`all`/`none`); manage Test Cases; run Simulation showing Decision Results, Evaluation Traces, and Facts whose result differs from Latest; Publish with the Stale Draft and Breaking Change warnings; Rollback; import/export artifacts.
- Condition operators: `==`, `!=`, `>`, `<`, `>=`, `<=`, `in`, `not_in`, `and`, `or`, `not`, `some`, `all`, `none`. No arithmetic expressions in conditions.
- A missing Fact field resolves to `false` with a warning in the trace. No match is an empty result, not an error. `UNIQUE` with several matches is an evaluation error.
- No authentication or authorization (out of scope; provided by the surrounding ecosystem).
- No server-side decision log; the console cannot browse past production evaluations, only replay what is supplied.
- Drag-and-drop visual rule building is named in the BRD as the Phase 2 aspiration. Its exact scope versus a table editor is **undecided**.
- Phase 2 is "if time allows" in the spec: the console is secondary to the core engine's correctness.
- Terminology is fixed by `CONTEXT.md` and must be used verbatim in the UI, including its "Avoid" lists (e.g. "Simulation" not "dry-run", "Rollback" not "revert", "Test Case" not "scenario", "Latest Pointer" not "current version").

## Brand Commitments

- UI copy is **Vietnamese prose with domain terms kept in English** (Decision, Rule, Hit Policy, Draft, Published, Simulation, Test Case, Evaluation Trace, Rollback…), matching the thesis convention.
- No product name, logo, or visual identity exists yet beyond the CLI binary name `bre`.

## Evidence on Hand

- Domain glossary: `CONTEXT.md`. Requirements: `docs/brd/`, `docs/spec/0001-core-business-rule-engine.md`. Decisions: `docs/adr/0001–0007`.
- The four pilot Decisions are specified by name and Hit Policy. Their real artifacts and Test Cases do not exist in the repo yet (`bre/` is empty), so sample data in UI work must be marked as illustrative and kept consistent with the spec.
- No users, testimonials, benchmarks, or measured latency figures exist yet. Do not fabricate them. The < 1 ms latency is an acceptance target, not a measured result.

## Product Principles

1. **Explainability first.** Every result shown should be traceable to the Rules and conditions that produced it; the Evaluation Trace is a primary view, not a debug drawer.
2. **Safe change over fast change.** Publishing is deliberate: Test Cases, diffs against Latest, and Stale/Breaking warnings come before the Publish action, and Rollback is always one clear step away.
3. **Two audiences, one truth.** Rule Authors and Integrators see the same Decision Versions, schema contract, and terminology; neither is a second-class view.
4. **Rules are data.** The UI edits structured tables and AST, never free-form code.
5. **Domain-agnostic.** No screen should assume retail or IoT; the pilots are examples, not the product.
