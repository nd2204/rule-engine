import { cellAst, parseCell } from './cell';
import type { AstNode, Cell, CompareOp, InputField, Rule, RuleSet, Scalar } from './types';

// A Rule's condition is one tree: its Decision Table cells ANDed with its Compound Condition, the part
// that fits no single cell (several fields, or, not). The node graph edits that whole tree; on the way back it is
// split again, deterministically: every top-level conjunct that one cell can hold goes to that cell's column,
// everything else stays in the Compound Condition. So the table and the graph never disagree.

/** The Compound Condition's pseudo column, where views that list conditions per field show it. */
export const COMPOUND = '@compound';
export const COMPOUND_FIELD: InputField = { name: COMPOUND, type: 'boolean', required: false, label: 'Compound Condition' };

/** Condition columns of a Rule Set: its inputs, plus the Compound Condition's when any Rule has one. */
export function conditionFields(ruleSet: RuleSet): InputField[] {
  return ruleSet.rules.some((r) => r.condition) ? [...ruleSet.inputs, COMPOUND_FIELD] : ruleSet.inputs;
}

/** A Rule's condition for one column; the Compound Condition reads as a tree cell. */
export function whenOf(rule: Rule, field: string): Cell | undefined {
  if (field === COMPOUND) return rule.condition ? { kind: 'ast', ast: rule.condition } : undefined;
  return rule.when[field];
}

// ---------- the whole tree ----------

export function conj(parts: AstNode[]): AstNode | null {
  return parts.length === 0 ? null : parts.length === 1 ? parts[0] : { op: 'and', args: parts };
}

/** Flattens and-in-and and or-in-or, drops single-branch groups and double negation. */
export function normalize(node: AstNode): AstNode {
  switch (node.op) {
    case 'and':
    case 'or': {
      const args = node.args.map(normalize).flatMap((a) => (a.op === node.op ? (a as { args: AstNode[] }).args : [a]));
      return args.length === 1 ? args[0] : { op: node.op, args };
    }
    case 'not': {
      const inner = normalize(node.arg);
      return inner.op === 'not' ? inner.arg : { op: 'not', arg: inner };
    }
    case 'some':
    case 'all':
    case 'none':
      return { ...node, where: normalize(node.where) };
    default:
      return node;
  }
}

/** A Rule's whole condition: its cells in column order, then its Compound Condition. null: the Rule matches every Fact. */
export function ruleTree(rule: Rule, inputs: InputField[]): AstNode | null {
  const parts: AstNode[] = [];
  for (const f of inputs) {
    const ast = cellAst(rule.when[f.name], f);
    if (ast) parts.push(ast);
  }
  if (rule.condition) parts.push(rule.condition);
  const tree = conj(parts);
  return tree && normalize(tree);
}

export function sameAst(a: AstNode | null | undefined, b: AstNode | null | undefined): boolean {
  if (!a || !b) return a === b || (!a && !b);
  if (a.op !== b.op) return false;
  switch (a.op) {
    case 'and':
    case 'or': {
      const bb = b as typeof a;
      return a.args.length === bb.args.length && a.args.every((x, i) => sameAst(x, bb.args[i]));
    }
    case 'not':
      return sameAst(a.arg, (b as typeof a).arg);
    case 'some':
    case 'all':
    case 'none': {
      const bb = b as typeof a;
      return a.path === bb.path && sameAst(a.where, bb.where);
    }
    default: {
      const bb = b as typeof a;
      return a.path === bb.path && JSON.stringify(a.value) === JSON.stringify(bb.value);
    }
  }
}

// ---------- splitting back into cells ----------

export function scalarText(v: Scalar): string {
  if (typeof v !== 'string') return String(v);
  return /^[\p{L}\p{N}_-]+$/u.test(v) ? v : `"${v}"`;
}

/** The cell text for one comparison, in the grammar parseCell reads. */
export function leafText(node: Extract<AstNode, { value: unknown }>): string {
  if (Array.isArray(node.value)) return `${node.op} [${node.value.map(scalarText).join(', ')}]`;
  return node.op === '==' ? scalarText(node.value) : `${node.op} ${scalarText(node.value)}`;
}

const LOWER: CompareOp[] = ['>=', '>'];
const UPPER: CompareOp[] = ['<=', '<'];

/** One cell's text for the conjuncts that sit on one plain field, or null when no single cell can hold them. */
function cellTextOf(own: AstNode[], field: InputField): string | null {
  let text: string | null = null;
  let expect: AstNode | null = null;
  if (own.length === 1 && 'value' in own[0]) {
    text = leafText(own[0]);
    expect = own[0];
  } else if (own.length === 2 && 'value' in own[0] && 'value' in own[1]) {
    const lo = own.find((n) => LOWER.includes(n.op as CompareOp)) as Extract<AstNode, { value: unknown }> | undefined;
    const hi = own.find((n) => UPPER.includes(n.op as CompareOp)) as Extract<AstNode, { value: unknown }> | undefined;
    if (lo && hi && typeof lo.value === 'number' && typeof hi.value === 'number') {
      text = `${lo.op === '>=' ? '[' : '('}${lo.value}..${hi.value}${hi.op === '<=' ? ']' : ')'}`;
      expect = { op: 'and', args: [lo, hi] };
    }
  }
  if (text === null) return null;
  const back = parseCell(text, field);
  return back.ok && sameAst(back.ast, expect) ? text : null;
}

/** The field a top-level conjunct sits on, when one cell of that column could hold it. */
function ownerOf(node: AstNode, inputs: InputField[]): InputField | null {
  if ('value' in node) {
    const f = inputs.find((x) => x.name === node.path);
    return f && f.type !== 'list' ? f : null;
  }
  if (node.op === 'some' || node.op === 'all' || node.op === 'none') {
    const f = inputs.find((x) => x.name === node.path);
    return f && f.type === 'list' ? f : null;
  }
  return null;
}

export function conjuncts(tree: AstNode | null): AstNode[] {
  return !tree ? [] : tree.op === 'and' ? tree.args : [tree];
}

/** Where each top-level conjunct of a tree lives once split: a column's cell, or the Compound Condition. */
export function homes(tree: AstNode | null, inputs: InputField[]): (string | typeof COMPOUND)[] {
  const parts = conjuncts(tree);
  const owners = parts.map((p) => ownerOf(p, inputs));
  const out: string[] = parts.map(() => COMPOUND);
  for (const f of inputs) {
    const idx = owners.flatMap((o, i) => (o === f ? [i] : []));
    if (!idx.length) continue;
    const fits = f.type === 'list' || cellTextOf(idx.map((i) => parts[i]), f) !== null;
    if (fits) idx.forEach((i) => (out[i] = f.name));
  }
  return out;
}

/**
 * Splits a whole tree back into cells and a Compound Condition. Cells that read the same as before keep the
 * author's own text, so an edit in the graph never shows up as a change to an untouched column.
 */
export function splitTree(tree: AstNode | null, inputs: InputField[], prev: Rule): Pick<Rule, 'when' | 'condition'> {
  const parts = conjuncts(tree);
  const home = homes(tree, inputs);
  const when: Record<string, Cell> = {};
  for (const f of inputs) {
    const own = parts.filter((_, i) => home[i] === f.name);
    const before = prev.when[f.name];
    // A cell the table could not parse never reached the tree: it stays as typed until the table fixes it.
    if (before?.kind === 'expr' && !parseCell(before.text, f).ok) {
      when[f.name] = before;
      continue;
    }
    if (!own.length) {
      when[f.name] = before && cellAst(before, f) === null ? before : { kind: 'expr', text: '-' };
      continue;
    }
    if (f.type === 'list') {
      const ast = conj(own)!;
      when[f.name] = before?.kind === 'ast' && sameAst(before.ast, ast) ? before : { kind: 'ast', ast };
      continue;
    }
    const text = cellTextOf(own, f)!;
    const parsed = parseCell(text, f);
    when[f.name] = before && parsed.ok && sameAst(cellAst(before, f), parsed.ast) ? before : { kind: 'expr', text };
  }
  const rest = conj(parts.filter((_, i) => home[i] === COMPOUND));
  return { when, condition: rest ?? undefined };
}

// ---------- reading ----------

function childrenOf(node: AstNode): AstNode[] {
  switch (node.op) {
    case 'and':
    case 'or':
      return node.args;
    case 'not':
      return [node.arg];
    case 'some':
    case 'all':
    case 'none':
      return [node.where];
    default:
      return [];
  }
}

/** Counts the comparisons of a tree, the Điều kiện nodes of its graph. */
export function contactCount(node: AstNode | null | undefined): number {
  if (!node) return 0;
  return 'value' in node ? 1 : childrenOf(node).reduce((n, c) => n + contactCount(c), 0);
}
