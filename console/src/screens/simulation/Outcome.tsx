import { formatScalar } from '../../domain/cell';
import type { EvalResult, HitPolicy, OutputField, OutputRow } from '../../domain/types';
import { outcomeIds, PSEUDO, type PseudoId } from './impact';

export function outputText(row: OutputRow, outputs: OutputField[]): string {
  return outputs
    .filter((f) => row[f.name] !== null && row[f.name] !== undefined)
    .map((f) => `${formatScalar(row[f.name])}${f.unit ? ` ${f.unit}` : ''}`)
    .join(' · ');
}

/** A short label for what decided a result, for counts and screen-reader text. */
export function outcomeLabel(r: EvalResult): string {
  return outcomeIds(r)
    .map((id) => (id.startsWith('@') ? PSEUDO[id as PseudoId] : id))
    .join(', ');
}

/** What decided a result: the winning Rule ids (mono), or a pseudo outcome in words, then the outputs when one row. */
export function Outcome(props: {
  result: EvalResult;
  outputs: OutputField[];
  hitPolicy: HitPolicy;
  compact?: boolean;
  /** The other side's result: Rule ids only one side has are marked, gained (after) or lost (before). */
  against?: EvalResult;
  side?: 'before' | 'after';
}) {
  const { result, outputs, hitPolicy, compact, against, side } = props;
  const ids = outcomeIds(result);
  const other = against ? new Set(outcomeIds(against)) : null;
  const mark = (id: string) => (other && !other.has(id) ? (side === 'after' ? 'is-gained' : 'is-lost') : undefined);
  const pseudo = ids[0].startsWith('@');
  return (
    <span className={`outcome${pseudo ? ` outcome--${ids[0].slice(1)}` : ''}`}>
      {pseudo ? (
        <span className="outcome__pseudo">{PSEUDO[ids[0] as PseudoId]}</span>
      ) : (
        <span className="outcome__ids">
          {ids.map((id) => (
            <code key={id} className={mark(id)}>
              {id}
              {mark(id) && <span className="visually-hidden">{side === 'after' ? ' (mới thắng)' : ' (không còn thắng)'}</span>}
            </code>
          ))}
        </span>
      )}
      {!compact && result.error && <span className="outcome__out">{result.error.message}</span>}
      {!compact && !pseudo && hitPolicy !== 'COLLECT' && result.outputs[0] && (
        <span className="outcome__out">{outputText(result.outputs[0], outputs)}</span>
      )}
      {!compact && !pseudo && hitPolicy === 'COLLECT' && result.outputs.length > 1 && (
        <span className="outcome__out">{result.outputs.length} dòng output</span>
      )}
      {!compact && !pseudo && hitPolicy === 'COLLECT' && result.outputs.length === 1 && (
        <span className="outcome__out">{outputText(result.outputs[0], outputs)}</span>
      )}
    </span>
  );
}
