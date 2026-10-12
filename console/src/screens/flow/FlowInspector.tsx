import { useEffect, useRef } from 'react';
import { Lamp } from '../../components/Lamp';
import type { Flow } from './useFlow';

interface Props {
  flow: Flow;
  subjectLabel: string;
  baseLabel: string | null;
}

/** Sơ đồ tab, inspector: the replay as an ordered list of steps, the keyboard and screen-reader path through the diagram. */
export function FlowInspector({ flow, subjectLabel, baseLabel }: Props) {
  const { result } = flow;
  return (
    <section className="inspect flow-steps" aria-labelledby="flow-steps-title">
      <header className="inspect__head">
        <h2 id="flow-steps-title" className="inspect__title">
          Luồng evaluation
        </h2>
        <p className="inspect__sub">{result ? <code>{result.key}</code> : 'Chưa chọn Fact'}</p>
      </header>

      {flow.canBaseline && baseLabel && (
        <div className="mode flow-steps__side" role="group" aria-label="Rule Set trên sơ đồ">
          <button type="button" className="mode__btn" aria-pressed={flow.side === 'subject'} onClick={() => flow.setSide('subject')}>
            {subjectLabel}
          </button>
          <button type="button" className="mode__btn" aria-pressed={flow.side === 'baseline'} onClick={() => flow.setSide('baseline')}>
            {baseLabel}
          </button>
        </div>
      )}

      <FlowSteps flow={flow} />
    </section>
  );
}

/** The steps of the replay. Steps not yet reached keep their verdict back, so the list never runs ahead of the drawing. */
export function FlowSteps({ flow }: { flow: Flow }) {
  const { steps, current } = flow;
  // The step on show is never scrolled out of the list: a replay or a resting step at the foot of a long Rule Set brings it up.
  const listRef = useRef<HTMLOListElement>(null);
  // Only the list's own scroll box moves, never the page: on a phone the list is the page.
  useEffect(() => {
    const item = listRef.current?.querySelector('[aria-current="step"]')?.closest('li');
    let box = listRef.current?.parentElement ?? null;
    while (box && box !== document.body && !/(auto|scroll)/.test(getComputedStyle(box).overflowY)) box = box.parentElement;
    if (!item || !box || box === document.body) return;
    const i = item.getBoundingClientRect();
    const b = box.getBoundingClientRect();
    if (i.top < b.top) box.scrollTop -= b.top - i.top;
    else if (i.bottom > b.bottom) box.scrollTop += Math.min(i.bottom - b.bottom, i.top - b.top);
  }, [current, steps]);
  if (steps.length === 0) {
    return (
      <p className="inspect__note">
        Mỗi Rule là một tuyến ray, mỗi ô điều kiện là một tín hiệu trên tuyến. Chọn một Fact để phát lại Evaluation Trace của nó từng bước, từ Input Schema
        qua các Rule tới Hit Policy và Decision Result.
      </p>
    );
  }
  return (
    <>
      <ol ref={listRef} className="flow-steps__list" onKeyDown={(e) => flow.onKey(e)}>
        {steps.map((s, i) => {
          const ahead = i > current;
          const open = !ahead && (i === current || !!s.diverges) && !!s.conditions?.length;
          return (
            <li key={s.id}>
              <button
                type="button"
                className={`flow-steps__step is-${s.kind}${ahead ? ' is-ahead' : ''}${s.diverges && !ahead ? ' is-diverging' : ''}`}
                aria-current={i === current ? 'step' : undefined}
                onClick={() => flow.go(i)}
              >
                <Lamp state={ahead ? 'idle' : s.lamp} size="sm" />
                <span className="flow-steps__title">
                  {s.ruleId && <code>{s.ruleId}</code>}
                  {s.ruleId ? (ahead ? ' chưa xét' : ` ${s.title}`) : s.title}
                </span>
                {!ahead && s.detail && <span className="flow-steps__detail">{s.detail}</span>}
              </button>
              {open && (
                <ul className="flow-steps__conds" aria-label={`Điều kiện của ${s.ruleId}`}>
                  {s.conditions!.map((c) => (
                    <li key={c.field} className={`is-${c.lamp}`}>
                      <Lamp state={c.lamp} size="sm" />
                      <code className="flow-steps__cond">
                        {c.field} <span>{c.text}</span>
                      </code>
                      <span className="flow-steps__value">{c.value}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
      <p className="flow-steps__keys">
        <kbd>←</kbd> <kbd>→</kbd> đi từng bước, <kbd>Home</kbd> <kbd>End</kbd> về đầu hoặc cuối, <kbd>PgUp</kbd> <kbd>PgDn</kbd> sang Fact trước hoặc sau.
        Bấm vào một node để nhảy tới bước của nó.
      </p>
    </>
  );
}
