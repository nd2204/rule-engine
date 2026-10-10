import type { EvalResult, Rule, RuleSet, SimFactResult } from '../../domain/types';
import { diffRuleSets, type RowDiff } from '../decision-table/diff';

/** Outcomes that are not a Rule: they get their own rows under the Rules. */
export const PSEUDO = {
  '@none': 'Không Rule nào khớp',
  '@unique': 'Lỗi UNIQUE',
  '@schema': 'Bị Input Schema Validation từ chối',
} as const;
export type PseudoId = keyof typeof PSEUDO;

/** What decided a Fact's result: its winning Rules, or one pseudo outcome. */
export function outcomeIds(r: EvalResult): string[] {
  if (r.error?.code === 'SCHEMA') return ['@schema'];
  if (r.error?.code === 'UNIQUE_VIOLATION') return ['@unique'];
  return r.winnerRuleIds.length ? r.winnerRuleIds : ['@none'];
}

export interface ImpactRow {
  id: string;
  kind: RowDiff['kind'] | 'pseudo';
  rule?: Rule;
  /** Route number: the Rule's place in the subject, or in the baseline for a removed Rule. */
  index?: number;
  /** Fields (and description / weight) the subject changed against the baseline. */
  changed: Set<string>;
  before: number;
  after: number;
  /** Matched, for policies where matching is not winning (FIRST, PRIORITY, UNIQUE). */
  beforeMatched: number;
  afterMatched: number;
  gained: string[];
  lost: string[];
  /** Won on both sides, but the Rule's own output changed. */
  reshaped: string[];
  /** Facts this row decides under the subject. */
  wins: string[];
}

export interface Impact {
  rows: ImpactRow[];
  changed: string[];
  /** Facts both sides reject: not part of the comparison. */
  rejectedBoth: number;
  maxDelta: number;
}

const sameRow = (a: Rule['then'] | undefined, b: Rule['then'] | undefined) =>
  JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

export function computeImpact(results: SimFactResult[], subject: RuleSet, baseline: RuleSet | null): Impact {
  const diff = baseline ? diffRuleSets(subject, baseline) : subject.rules.map((rule): RowDiff => ({ kind: 'same', rule, changed: new Set() }));
  const rows = new Map<string, ImpactRow>();
  const blank = (id: string): Omit<ImpactRow, 'kind' | 'changed'> => ({
    id,
    before: 0,
    after: 0,
    beforeMatched: 0,
    afterMatched: 0,
    gained: [],
    lost: [],
    reshaped: [],
    wins: [],
  });
  for (const d of diff) {
    const index = d.kind === 'removed' ? d.prevIndex : subject.rules.indexOf(d.rule);
    rows.set(d.rule.id, { ...blank(d.rule.id), kind: d.kind, rule: d.rule, index, changed: d.changed });
  }
  for (const id of Object.keys(PSEUDO)) rows.set(id, { ...blank(id), kind: 'pseudo', changed: new Set() });

  const thenBefore = new Map(baseline?.rules.map((r) => [r.id, r.then]));
  const thenAfter = new Map(subject.rules.map((r) => [r.id, r.then]));
  let rejectedBoth = 0;

  for (const r of results) {
    const after = outcomeIds(r.subject);
    const before = r.baseline ? outcomeIds(r.baseline) : [];
    if (after[0] === '@schema' && before[0] === '@schema') rejectedBoth++;
    for (const id of after) {
      const row = rows.get(id);
      if (!row) continue;
      row.after++;
      row.wins.push(r.key);
      if (r.baseline && !before.includes(id)) row.gained.push(r.key);
      else if (r.changed && !id.startsWith('@') && !sameRow(thenBefore.get(id), thenAfter.get(id))) row.reshaped.push(r.key);
    }
    for (const id of before) {
      const row = rows.get(id);
      if (!row) continue;
      row.before++;
      if (!after.includes(id)) row.lost.push(r.key);
    }
    for (const id of r.subject.matchedRuleIds) {
      const row = rows.get(id);
      if (row) row.afterMatched++;
    }
    for (const id of r.baseline?.matchedRuleIds ?? []) {
      const row = rows.get(id);
      if (row) row.beforeMatched++;
    }
  }

  // Pseudo outcomes nobody reached stay out of the table.
  const list = [...rows.values()].filter((row) => row.kind !== 'pseudo' || row.before + row.after > 0);
  return {
    rows: list,
    changed: results.filter((r) => r.changed).map((r) => r.key),
    rejectedBoth,
    maxDelta: Math.max(1, ...list.map((row) => Math.max(row.gained.length, row.lost.length))),
  };
}
