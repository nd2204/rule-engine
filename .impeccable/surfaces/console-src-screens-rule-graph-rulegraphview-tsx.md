---
version: 1
slug: "console-src-screens-rule-graph-rulegraphview-tsx"
primary_target: "console/src/screens/rule-graph/RuleGraphView.tsx"
related_targets: ["console/src/screens/rule-graph/RuleGraphInspector.tsx", "console/src/screens/rule-graph/graph.ts", "console/src/screens/rule-graph/nodes.tsx", "console/src/screens/rule-graph/useRuleGraph.ts", "console/src/domain/compound.ts"]
---

# Surface: Rule Node Graph (BRE Console)

Mode: Operate. Desktop-first; narrow screens and Published versions are read-only.

## Scope
- Rule Author composes conditions that do not fit a cell (some / all / none, or, not, several fields) by placing and wiring nodes, without JSON AST, and runs a Test Case through one Rule to see which node is false.
- Also the thesis figure of the Phase 2 visual rule builder (Bản vẽ light theme for print).
- The Rules tab's Node view (switch Bảng | Node in the title block; route `…/rule/:ruleId`): full-bleed canvas with the Rule Set as a floating list on the left, Chạy thử and the verdict floating top, the node palette floating at the foot; inspector = node forms in a drawer opened by clicking a node; commit bar unchanged.
- Model: `Rule.condition` (Compound Condition, CONTEXT.md) ANDed with the cells; deterministic split back into cells on save; only a valid graph is saved.
- Out: storing positions in the Draft, computed or side-effect nodes, wiring Rules to Rules (single-pass engine, no chaining).

## Direction contract

THESIS: n8n-style node graph, data left to right into the Rule. Logic is named nodes (VÀ / HOẶC / KHÔNG / Mỗi phần tử), wiring is free, and anything that is not a valid condition tree is flagged on the node and kept off the Draft. Chosen by the user on 2026-10-12 after rejecting a relay-circuit design as hard to read (symbols, implicit AND/OR, no free wiring, small lettering).

OWN-WORLD: Inherits the Interlocking Control Table (DESIGN.md): ruled sheet, lamps with glyph and word, three hands of lettering, signal colours reserved for state; nodes are flat sheets with a 1px rule.

STORY: The author opens BEV2 and picks TC-05 (one can of cola, POS, 400.000 ₫) under Chạy thử. HOẶC and KHÔNG are true; Mỗi phần tử is false (0/2 khớp: the cola has qty 1), so BEV2 does not match and TC-05 passes (it expects no discount). The author selects the qty ≥ 2 node, sets it to qty ≥ 1 in the inspector and applies: Mỗi phần tử turns 1/2 khớp, the wire into the Rule goes green, the Rule reads "match, vào output", TC-05 turns fail, and the Test Case pass lock in the commit bar lists TC-05. The change is caught before Publish; Undo from the toast restores it. (Revised 2026-10-13: the earlier TC-04 / customerTier = SILVER story could not flip the Rule, since HOẶC was already true and KHÔNG and items blocked it.)

SIGNATURE: Under a Test Case, true wires run green with moving dashes into the Rule; false ones go muted red.
