import type { Cell, Rule, RuleSet } from '../../domain/types';

export type RowDiff =
  | { kind: 'same' | 'added' | 'changed'; rule: Rule; prev?: Rule; prevIndex?: number; changed: Set<string> }
  | { kind: 'removed'; rule: Rule; prevIndex: number; changed: Set<string> };

function cellKey(cell: Cell | undefined): string {
  if (!cell) return '-';
  if (cell.kind === 'expr') return cell.text.trim() === '' ? '-' : cell.text.trim().replace(/\s+/g, ' ');
  return JSON.stringify(cell.ast);
}

/** Field-level changes of a Rule against its Latest counterpart; keys are field names or 'description' / 'weight'. */
function changedFields(rule: Rule, prev: Rule, ruleSet: RuleSet): Set<string> {
  const changed = new Set<string>();
  for (const f of ruleSet.inputs) if (cellKey(rule.when[f.name]) !== cellKey(prev.when[f.name])) changed.add(f.name);
  for (const f of ruleSet.outputs) if ((rule.then[f.name] ?? null) !== (prev.then[f.name] ?? null)) changed.add(f.name);
  if (rule.description !== prev.description) changed.add('description');
  if ((rule.weight ?? 0) !== (prev.weight ?? 0)) changed.add('weight');
  return changed;
}

/**
 * Registers the Draft against Latest row by row (matched on Rule id), keeping the
 * Draft's order and placing removed Rules where they sat in Latest.
 */
export function diffRuleSets(draft: RuleSet, latest: RuleSet): RowDiff[] {
  const prevIndex = new Map(latest.rules.map((r, i) => [r.id, i]));
  const draftIds = new Set(draft.rules.map((r) => r.id));

  const rows: RowDiff[] = draft.rules.map((rule) => {
    const i = prevIndex.get(rule.id);
    if (i === undefined) return { kind: 'added', rule, changed: new Set() };
    const prev = latest.rules[i];
    const changed = changedFields(rule, prev, draft);
    return { kind: changed.size ? 'changed' : 'same', rule, prev, prevIndex: i, changed };
  });

  latest.rules.forEach((rule, i) => {
    if (draftIds.has(rule.id)) return;
    // Insert after the closest earlier Latest Rule that survives in the Draft.
    let anchor = -1;
    for (let j = i - 1; j >= 0; j--) {
      const k = rows.findIndex((r) => r.kind !== 'removed' && r.rule.id === latest.rules[j].id);
      if (k !== -1) {
        anchor = k;
        break;
      }
    }
    rows.splice(anchor + 1, 0, { kind: 'removed', rule, prevIndex: i, changed: new Set() });
  });

  return rows;
}

export function diffCounts(rows: RowDiff[]) {
  return {
    added: rows.filter((r) => r.kind === 'added').length,
    changed: rows.filter((r) => r.kind === 'changed').length,
    removed: rows.filter((r) => r.kind === 'removed').length,
  };
}
