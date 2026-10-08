import type { ReactNode } from 'react';
import { Lamp, type LampState } from '../../components/Lamp';

export interface TitleCell {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  lamp?: LampState;
  wide?: boolean;
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
  return (
    <header className="titleblock">
      <div className="titleblock__ident">
        <h1 className="titleblock__id">
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
      <dl className="titleblock__grid">
        {props.cells.map((c) => (
          <div key={c.label} className={`titleblock__cell${c.wide ? ' is-wide' : ''}`}>
            <dt>{c.label}</dt>
            {/* The cells are stations on one track; a cell's lamp sits on the line in place of its stop. */}
            <dd className="titleblock__stop" aria-hidden={c.lamp ? undefined : true}>
              {c.lamp ? <Lamp state={c.lamp} size="sm" /> : <span className="titleblock__dot" />}
            </dd>
            <dd>
              <span className="titleblock__value">{c.value}</span>
            </dd>
            {c.note && <dd className="titleblock__note">{c.note}</dd>}
          </div>
        ))}
      </dl>
    </header>
  );
}
