import { describeCell, formatScalar, isAnyCell } from '../../domain/cell';
import type { RuleSet } from '../../domain/types';

/** Phone-width reading of a Rule Set: each Rule's conditions and outputs stacked under its name. */
export function RuleList({ ruleSet }: { ruleSet: RuleSet }) {
  const ordered = ruleSet.hitPolicy === 'FIRST' || ruleSet.hitPolicy === 'COLLECT';
  return (
    <ol className="rule-list" aria-label="Rule">
      {ruleSet.rules.map((rule, i) => {
        const conditions = ruleSet.inputs.filter((f) => !isAnyCell(rule.when[f.name]));
        return (
          <li key={rule.id} className="rule-list__item">
            <div className="rule-list__head">
              <span className="rule__index">{ordered ? i + 1 : '–'}</span>
              <span className="rule__id">{rule.id}</span>
              {ruleSet.hitPolicy === 'PRIORITY' && <span className="tag">weight {rule.weight ?? 0}</span>}
            </div>
            {rule.description && <p className="rule-list__desc">{rule.description}</p>}
            <dl className="rule-list__grid">
              {conditions.length === 0 ? (
                <div>
                  <dt>Điều kiện</dt>
                  <dd>luôn match</dd>
                </div>
              ) : (
                conditions.map((f) => (
                  <div key={f.name}>
                    <dt>{f.name}</dt>
                    <dd className="rule-list__expr">{describeCell(rule.when[f.name], f)}</dd>
                  </div>
                ))
              )}
              {ruleSet.outputs.map((f, k) => (
                <div key={f.name} className={k === 0 ? 'is-first-out' : undefined}>
                  <dt>→ {f.name}</dt>
                  <dd className="rule-list__out">
                    {formatScalar(rule.then[f.name] ?? null)}
                    {f.unit && rule.then[f.name] != null ? ` ${f.unit}` : ''}
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        );
      })}
    </ol>
  );
}
