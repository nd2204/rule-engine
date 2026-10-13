import { useEffect, useState, type ReactNode } from 'react';
import { Lamp, type LampState } from '../../components/Lamp';
import { useFresh } from '../../components/useFresh';

export interface TitleCell {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  lamp?: LampState;
  wide?: boolean;
}

/** Keys a cell is known by, so a change in what it says (not a re-render) is what animates. */
function valueKey(c: TitleCell): string {
  return `${c.label}:${typeof c.value === 'string' ? c.value : ''}`;
}

function cellKey(c: TitleCell): string {
  return `${valueKey(c)}|${typeof c.note === 'string' ? c.note : ''}`;
}

/** True for the half second after the block mounts: the stops report in, left to right. */
function useArriving(): boolean {
  const [arriving, setArriving] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setArriving(false), 600);
    return () => clearTimeout(t);
  }, []);
  return arriving;
}

/** A cell's tooltip: the value too, since the value is clipped when the cell is narrow. */
function cellTitle(c: TitleCell): string | undefined {
  const value = typeof c.value === 'string' ? c.value : '';
  const note = typeof c.note === 'string' ? c.note : '';
  return [value, note].filter(Boolean).join(' · ') || undefined;
}

/** The drawing's title block: identity first, then the facts that frame every edit. */
export function TitleBlock(props: {
  identifier: string;
  /** The scope after `@`: plain text, or the ScopePicker. */
  qualifier: ReactNode;
  title: string;
  domain: string;
  cells: TitleCell[];
  actions?: ReactNode;
}) {
  const fresh = useFresh([...props.cells.map(valueKey), ...props.cells.map(cellKey)]);
  const arriving = useArriving();
  return (
    <header className="titleblock">
      <div className="titleblock__ident">
        <h1 className="titleblock__id" tabIndex={-1}>
          {props.identifier}
          {typeof props.qualifier === 'string' ? (
            <span className="titleblock__qualifier">@{props.qualifier}</span>
          ) : (
            props.qualifier
          )}
        </h1>
        <p className="titleblock__sub">
          {props.title} <span aria-hidden="true">·</span> {props.domain}
        </p>
      </div>
      {props.actions && <div className="titleblock__actions">{props.actions}</div>}
      <dl className={`titleblock__grid${arriving ? ' is-arriving' : ''}`}>
        {props.cells.map((c) => (
          <div
            key={cellKey(c)}
            className={`titleblock__cell${c.wide ? ' is-wide' : ''}${fresh.has(cellKey(c)) ? ' is-fresh' : ''}`}
            title={cellTitle(c)}
          >
            <dt>{c.label}</dt>
            {/* The cells are stations on one track; a cell's lamp sits on the line in place of its stop. */}
            <dd className="titleblock__stop" aria-hidden={c.lamp ? undefined : true}>
              {c.lamp ? <Lamp state={c.lamp} size="sm" /> : <span className="titleblock__dot" />}
            </dd>
            <dd className="titleblock__val">
              <span key={valueKey(c)} className={`titleblock__value${fresh.has(valueKey(c)) ? ' is-fresh' : ''}`}>
                {c.value}
              </span>
            </dd>
            {c.note && <dd className="titleblock__note">{c.note}</dd>}
          </div>
        ))}
      </dl>
    </header>
  );
}
