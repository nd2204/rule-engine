// Stand-in evaluator for the mock API only. It mirrors the spec's semantics
// (safe navigation, four Hit Policies, Input Schema Validation) so the console
// can be built before the Go engine exists. The UI never imports this file:
// once the real HTTP API is up, it is deleted with the rest of src/mocks.

import { cellAst, describeAst } from '../domain/cell';
import type {
  AstNode,
  BreakingChange,
  Disposition,
  EvalResult,
  EvaluationTrace,
  Expected,
  OutputRow,
  RuleSet,
  Scalar,
  SimFact,
  SimFactResult,
  TestCaseResult,
  TestCase,
  TraceNode,
  TraceRule,
} from '../domain/types';

function lookup(scope: unknown, path: string): { found: boolean; value: unknown } {
  let cur: unknown = scope;
  for (const key of path.split('.')) {
    if (cur === null || typeof cur !== 'object' || !(key in (cur as object))) return { found: false, value: undefined };
    cur = (cur as Record<string, unknown>)[key];
  }
  return { found: cur !== null && cur !== undefined, value: cur };
}

function evalNode(node: AstNode, scope: unknown, warnings: Set<string>): boolean {
  switch (node.op) {
    case 'and':
      return node.args.every((a) => evalNode(a, scope, warnings));
    case 'or':
      return node.args.some((a) => evalNode(a, scope, warnings));
    case 'not':
      return !evalNode(node.arg, scope, warnings);
    case 'some':
    case 'all':
    case 'none': {
      const { found, value } = lookup(scope, node.path);
      if (!found || !Array.isArray(value)) {
        warnings.add(`Thiếu trường ${node.path}: điều kiện tính là false`);
        return false;
      }
      const test = (item: unknown) => evalNode(node.where, item, warnings);
      if (node.op === 'some') return value.some(test);
      if (node.op === 'all') return value.every(test);
      return !value.some(test);
    }
    default: {
      const { found, value } = lookup(scope, node.path);
      if (!found) {
        warnings.add(`Thiếu trường ${node.path}: điều kiện tính là false`);
        return false;
      }
      const v = value as Scalar;
      const target = node.value;
      switch (node.op) {
        case '==':
          return v === target;
        case '!=':
          return v !== target;
        case '>':
          return (v as number) > (target as number);
        case '<':
          return (v as number) < (target as number);
        case '>=':
          return (v as number) >= (target as number);
        case '<=':
          return (v as number) <= (target as number);
        case 'in':
          return (target as Scalar[]).includes(v);
        case 'not_in':
          return !(target as Scalar[]).includes(v);
      }
    }
  }
}

function typeOf(v: unknown): string {
  if (Array.isArray(v)) return 'list';
  return typeof v;
}

export function evaluate(ruleSet: RuleSet, facts: Record<string, unknown>): EvalResult {
  const empty: EvalResult = { outputs: [], matchedRuleIds: [], winnerRuleIds: [], cellOutcomes: {}, warnings: [] };

  for (const field of ruleSet.inputs) {
    const { found, value } = lookup(facts, field.name);
    if (!found) {
      if (field.required) {
        return { ...empty, error: { code: 'SCHEMA', message: `Thiếu trường bắt buộc ${field.name}` } };
      }
      continue;
    }
    if (typeOf(value) !== field.type) {
      return {
        ...empty,
        error: { code: 'SCHEMA', message: `${field.name} phải là ${field.type}, nhận được ${typeOf(value)}` },
      };
    }
  }

  const warnings = new Set<string>();
  const cellOutcomes: EvalResult['cellOutcomes'] = {};
  const matched = ruleSet.rules.filter((rule) => {
    const outcomes: Record<string, boolean | null> = {};
    let all = true;
    for (const field of ruleSet.inputs) {
      const ast = cellAst(rule.when[field.name], field);
      if (!ast) {
        outcomes[field.name] = null;
        continue;
      }
      const ok = evalNode(ast, facts, warnings);
      outcomes[field.name] = ok;
      if (!ok) all = false;
    }
    cellOutcomes[rule.id] = outcomes;
    return all;
  });

  const base = { matchedRuleIds: matched.map((r) => r.id), cellOutcomes, warnings: [...warnings] };
  let winners = matched;
  switch (ruleSet.hitPolicy) {
    case 'FIRST':
      winners = matched.slice(0, 1);
      break;
    case 'UNIQUE':
      if (matched.length > 1) {
        return {
          ...base,
          outputs: [],
          winnerRuleIds: [],
          error: {
            code: 'UNIQUE_VIOLATION',
            message: `UNIQUE nhưng ${matched.length} Rule cùng match`,
            ruleIds: matched.map((r) => r.id),
          },
        };
      }
      break;
    case 'PRIORITY':
      winners = matched.length
        ? [matched.reduce((best, r) => ((r.weight ?? 0) > (best.weight ?? 0) ? r : best))]
        : [];
      break;
    case 'COLLECT':
      break;
  }
  return { ...base, outputs: winners.map((r) => r.then), winnerRuleIds: winners.map((r) => r.id) };
}

function sameOutputs(a: OutputRow[], b: OutputRow[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((row, i) => {
    const other = b[i];
    const keys = new Set([...Object.keys(row), ...Object.keys(other)]);
    return [...keys].every((k) => (row[k] ?? null) === (other[k] ?? null));
  });
}

function matchesExpected(actual: EvalResult, expected: Expected): boolean {
  if ('error' in expected) return actual.error?.code === expected.error;
  return !actual.error && sameOutputs(actual.outputs, expected.outputs);
}

function sameResult(a: EvalResult, b: EvalResult): boolean {
  if (a.error || b.error) return a.error?.code === b.error?.code;
  return sameOutputs(a.outputs, b.outputs);
}

export function simulate(draft: RuleSet, latest: RuleSet, testCases: TestCase[]): TestCaseResult[] {
  return testCases.map((tc) => {
    const actual = evaluate(draft, tc.facts);
    const status = matchesExpected(actual, tc.expected) ? 'pass' : actual.error && !('error' in tc.expected) ? 'error' : 'fail';
    return {
      testCaseId: tc.id,
      status,
      actual,
      differsFromLatest: !sameResult(actual, evaluate(latest, tc.facts)),
    };
  });
}

export function breakingChanges(draft: RuleSet, latest: RuleSet): BreakingChange[] {
  const changes: BreakingChange[] = [];
  for (const field of draft.inputs) {
    const before = latest.inputs.find((f) => f.name === field.name);
    if (!before) {
      if (field.required) {
        changes.push({ field: field.name, kind: 'new-required', message: `Thêm trường bắt buộc ${field.name}` });
      }
    } else if (before.type !== field.type) {
      changes.push({ field: field.name, kind: 'type-changed', message: `${field.name} đổi kiểu ${before.type} → ${field.type}` });
    } else if (!before.required && field.required) {
      changes.push({ field: field.name, kind: 'now-required', message: `${field.name} chuyển thành bắt buộc` });
    }
  }
  return changes;
}

// ---------- Evaluation Trace ----------

const ITEM_CAP = 8;

/** Re-evaluates a condition tree node by node, so the trace can show which branch decided. */
function traceNode(node: AstNode, scope: unknown): TraceNode {
  const sink = new Set<string>();
  const ok = evalNode(node, scope, sink);
  switch (node.op) {
    case 'and':
    case 'or':
      return { text: node.op === 'and' ? 'tất cả' : 'một trong', ok, children: node.args.map((a) => traceNode(a, scope)) };
    case 'not':
      return { text: 'không', ok, children: [traceNode(node.arg, scope)] };
    case 'some':
    case 'all':
    case 'none': {
      const { value } = lookup(scope, node.path);
      const items = Array.isArray(value) ? value : [];
      const children: TraceNode[] = items.slice(0, ITEM_CAP).map((item, i) => {
        const inner = traceNode(node.where, item);
        return { ...inner, text: `${node.path}[${i}]: ${describeAst(node.where)}` };
      });
      if (items.length > ITEM_CAP) children.push({ text: `… và ${items.length - ITEM_CAP} phần tử nữa`, ok: null });
      return {
        text: Array.isArray(value) ? `${node.op} ${node.path} (${items.length} phần tử): ${describeAst(node.where)}` : `${node.op} ${node.path}: thiếu trường`,
        ok,
        children,
      };
    }
    default:
      return { text: describeAst(node), ok };
  }
}

function dispositionOf(ruleSet: RuleSet, result: EvalResult, ruleId: string): { disposition: Disposition; by?: string } {
  const matched = result.matchedRuleIds.includes(ruleId);
  if (!matched) return { disposition: 'missed' };
  if (result.error?.code === 'UNIQUE_VIOLATION') return { disposition: 'conflict' };
  if (ruleSet.hitPolicy === 'COLLECT') return { disposition: 'collected' };
  if (result.winnerRuleIds.includes(ruleId)) return { disposition: 'won' };
  const by = result.winnerRuleIds[0];
  return { disposition: ruleSet.hitPolicy === 'PRIORITY' ? 'outweighed' : 'shadowed', by };
}

export function traceOf(ruleSet: RuleSet, facts: Record<string, unknown>, result: EvalResult, label: string, durationMs: number): EvaluationTrace {
  const rules: TraceRule[] =
    result.error?.code === 'SCHEMA'
      ? []
      : ruleSet.rules.map((rule) => {
          const { disposition, by } = dispositionOf(ruleSet, result, rule.id);
          return {
            ruleId: rule.id,
            matched: result.matchedRuleIds.includes(rule.id),
            disposition,
            ...(by ? { by } : {}),
            conditions: ruleSet.inputs.map((field) => {
              const ast = cellAst(rule.when[field.name], field);
              const { found, value } = lookup(facts, field.name);
              if (!ast) return { field: field.name, ok: null, ...(found ? { value } : {}) };
              const ok = result.cellOutcomes[rule.id]?.[field.name] ?? false;
              const tree = rule.when[field.name]?.kind === 'ast' ? traceNode(ast, facts) : undefined;
              return { field: field.name, ok, ...(found ? { value } : {}), ...(tree ? { tree } : {}) };
            }),
          };
        });
  return {
    ruleSetVersion: label,
    hitPolicy: ruleSet.hitPolicy,
    engine: 'mock-evaluator',
    evaluatedAt: new Date().toISOString(),
    durationMs,
    rules,
  };
}

function traced(ruleSet: RuleSet, facts: Record<string, unknown>, label: string) {
  const t0 = performance.now();
  const result = evaluate(ruleSet, facts);
  const durationMs = performance.now() - t0;
  return { ...result, trace: traceOf(ruleSet, facts, result, label, durationMs) };
}

/** Simulation over Test Cases and a Fact Batch, each Fact evaluated by the subject and, when there is one, the baseline. */
export function simulateRun(
  subject: { ruleSet: RuleSet; label: string },
  baseline: { ruleSet: RuleSet; label: string } | null,
  testCases: TestCase[],
  batch: SimFact[],
): SimFactResult[] {
  const all: (SimFact & { expected?: Expected })[] = [
    ...testCases.map((tc) => ({ key: tc.id, source: 'test-case' as const, facts: tc.facts, expected: tc.expected })),
    ...batch,
  ];
  return all.map((f) => {
    const s = traced(subject.ruleSet, f.facts, subject.label);
    const b = baseline ? traced(baseline.ruleSet, f.facts, baseline.label) : undefined;
    const status = f.expected
      ? matchesExpected(s, f.expected)
        ? 'pass'
        : s.error && !('error' in f.expected)
          ? 'error'
          : 'fail'
      : undefined;
    return {
      key: f.key,
      source: f.source,
      facts: f.facts,
      subject: s,
      ...(b ? { baseline: b } : {}),
      changed: b ? !sameResult(s, b) : false,
      ...(status ? { status } : {}),
    };
  });
}
