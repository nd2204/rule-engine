# Context

Glossary of core domain terms and their precise definitions for the Business Rule Engine.

## Core Concepts

### Fact
An immutable piece of data or input context supplied by a caller at evaluation time (e.g., cart items, customer tier, inventory levels, store channel). The engine does not mutate Facts during evaluation.

### Condition
A predicate (boolean expression) evaluated against Facts. It specifies the criteria under which a Rule is satisfied.

### Action / Output
The resulting consequence or payload produced when a Rule matches (e.g., apply a discount amount, trigger approval, reject transaction).

### Rule
The atomic unit of decision logic, encapsulating:
- Identity & metadata (ID, description, priority, validity timeframe)
- **Condition**
- **Action / Output**

### Decision
The central abstraction representing a specific business question that needs an answer (e.g., `calculate-order-discount`, `determine-inventory-fulfillment-store`). A Decision takes Facts as input, evaluates one or more Rules according to a defined **Hit Policy**, and yields a **Decision Result**.

### Hit Policy
The resolution strategy governing how multiple matching Rules within a Decision are aggregated:
- `FIRST`: Returns the output of the first matching Rule.
- `UNIQUE`: At most one Rule may match; if several match, raises an evaluation error.
- `PRIORITY`: Selects the matching Rule with the highest assigned priority weight.
- `COLLECT`: Returns the outputs of all matching Rules as a list in Rule order, without aggregating them (e.g., the list of all applicable discounts; summing them is the Caller's job).

Under every Hit Policy, a Decision with no matching Rule yields a Decision Result with no output; this is not an error. `PRIORITY` ranks Rules by their own weight, unlike DMN's Priority, which ranks by the order of output values.

### Evaluation Trace
A comprehensive audit trail recording the full lifecycle of a single Decision evaluation. It captures:
- Exact snapshot of input Facts
- Evaluated Rules and their condition evaluation outcomes (boolean breakdown)
- Matched Rules and reasons for selection/rejection under the Hit Policy
- Produced Decision Result
- Execution timestamps and engine version / rule set version

Produced on request by a Caller and always during Simulation. Any evaluation can be replayed into a full Evaluation Trace from its Facts and its Trace Summary.

### Trace Summary
The minimal record returned with every Decision Result: the Decision Version, the matched Rules, the winning Rule(s) and the execution time.
_Avoid_: Short trace, lite trace

### Rule Set
A collection of Rules associated with a specific Decision; each Decision Version holds exactly one.

### Decision Table
A tabular authoring form of a Rule Set in which each column is a Fact field and each cell is a simple condition, with one Rule per row. Conditions that do not fit a cell, such as those over collections, are written directly as condition trees.
_Avoid_: Rule sheet, rule grid

### Decision Registry
The thread-safe in-memory catalogue that indexes Published Decision Versions by `(decisionId, version)` and resolves each Decision's Latest Pointer.

### Decision Definition Artifact
A portable, self-contained JSON/YAML document encapsulating a Decision's metadata, input schema contract, Hit Policy, and Rule definitions.

### Input Schema Validation
Pre-evaluation boundary check enforcing that mandatory Fact fields exist and match expected primitive types before executing any Rules.

### Decision Result
The composite outcome returned to the caller, containing the resolved output payload (derived from matching Rules according to Hit Policy) and an optional Evaluation Trace.

## Lifecycle

### Decision Version
One identified revision `(decisionId, version)` of a Decision's Rule Set, numbered by an increasing integer assigned at Publish. It is immutable; a correction is a new Decision Version.
_Avoid_: Revision, release

### Latest Pointer
The per-Decision reference to the Published Decision Version that callers receive when they ask for `latest`. It moves on Publish and on Rollback, independent of version numbering.
_Avoid_: Highest version, current version

### Rollback
Moving the Latest Pointer back to an earlier Published Decision Version. The newer version stays Published and remains evaluable by exact version.
_Avoid_: Revert, unpublish

### Draft
An editable, unnumbered working copy of a Decision's Rule Set, stored for editing and Simulation, that records the Published Decision Version it was based on. A Decision may have several Drafts at once. Callers never receive a Draft.
_Avoid_: Unpublished rule, pending config

### Published
The status of a Decision Version that callers are allowed to evaluate, by exact version or via the Latest Pointer. A Published Decision Version never changes. A Draft can be Published only when it has at least one Test Case and all its Test Cases pass.

### Stale Draft
A Draft whose base version is no longer the one the Latest Pointer references. Publishing it requires the Rule Author to acknowledge the newer version; nothing is merged automatically.

### Breaking Change
A Draft's change to the input schema contract that would make Facts accepted by the Latest Pointer's version fail Input Schema Validation, such as a new mandatory field or a changed field type. Publishing it requires explicit confirmation.
_Avoid_: Incompatible version, schema conflict
_Avoid_: Active rule, production rule

### Simulation
An evaluation of a Draft against sample Facts or the Decision's Test Cases, yielding Decision Results and Evaluation Traces, that leaves every Published version unchanged. It also reports which Facts produce a different Decision Result under the Draft than under the Latest Pointer.
_Avoid_: Dry-run, sandbox, shadow mode

### Test Case
A pair of sample Facts and the Decision Result the Rule Author expects for them, owned by a Decision and used by Simulation.
_Avoid_: Fixture, example, scenario

## Roles

### Rule Author
A person who drafts, simulates, and publishes Decisions. A primary user of the platform, on equal footing with the Integrator.
_Avoid_: Business analyst, operator, admin

### Integrator
A person who connects a calling application to the engine. A primary user of the platform, on equal footing with the Rule Author.
_Avoid_: Developer, software engineer

### Caller
The application that requests evaluation of a Published Decision.
_Avoid_: Client, consumer service
