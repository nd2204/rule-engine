import { Workflow } from 'lucide-react';
import { describeCell, formatScalar, isAnyCell } from '../../domain/cell';
import { COMPOUND, conditionFields, whenOf } from '../../domain/compound';
import type { RuleSet } from '../../domain/types';

/** Phone-width reading of a Rule Set: each Rule's conditions and outputs stacked under its name. */
export function RuleList({ ruleSet, circuitHref }: { ruleSet: RuleSet; circuitHref?: (ruleId: string) => string }) {
  const ordered = ruleSet.hitPolicy === 'FIRST' || ruleSet.hitPolicy === 'COLLECT';
  return (
    <ol className="rule-list" aria-label="Rule">
      {ruleSet.rules.map((rule, i) => {
        const conditions = conditionFields(ruleSet).filter((f) => !isAnyCell(whenOf(rule, f.name)));
        return (
          <li key={rule.id} className="rule-list__item">
            <div className="rule-list__head">
              <span className="rule__index">{ordered ? i + 1 : '–'}</span>
              <span className="rule__id">{rule.id}</span>
              {ruleSet.hitPolicy === 'PRIORITY' && <span className="tag">weight {rule.weight ?? 0}</span>}
              {circuitHref && (
                <a className="icon-btn rule-list__circuit" href={circuitHref(rule.id)} aria-label={`Mở trình sửa node của ${rule.id}`}>
                  <Workflow size={15} aria-hidden="true" />
                </a>
              )}
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
                    <dt>{f.name === COMPOUND ? 'Compound' : f.name}</dt>
                    <dd className="rule-list__expr">{describeCell(whenOf(rule, f.name), f)}</dd>
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
