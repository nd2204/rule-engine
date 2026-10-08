import { Lock, LockOpen } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Lamp, type LampState } from '../../components/Lamp';

export interface Interlock {
  id: string;
  label: string;
  state: LampState;
  detail: string;
  action?: { label: string; run: () => void };
}

interface Props {
  locks: Interlock[];
  nextVersion: number;
  publishing: boolean;
  blockedByViewport: boolean;
  onPublish: () => void;
}

/**
 * The signature move: Publish is a lever at the end of a row of interlocks.
 * It only releases when every lamp shows clear; when the last one clears,
 * the lamps settle to green in sequence and the lever releases.
 */
export function InterlockRow({ locks, nextVersion, publishing, blockedByViewport, onPublish }: Props) {
  const allClear = locks.every((l) => l.state === 'clear');
  const free = allClear && !blockedByViewport;
  const was = useRef(free);
  const [releasing, setReleasing] = useState(false);

  useEffect(() => {
    if (free && !was.current) {
      setReleasing(true);
      const t = window.setTimeout(() => setReleasing(false), 900);
      was.current = free;
      return () => window.clearTimeout(t);
    }
    was.current = free;
  }, [free]);

  const blocking = locks.filter((l) => l.state !== 'clear');
  const reason = blockedByViewport
    ? 'Publish trên màn hình rộng hơn'
    : blocking.length
      ? `Còn ${blocking.length} khoá chưa giải`
      : `Sẵn sàng Publish v${nextVersion}`;

  return (
    <section className={`interlock${releasing ? ' is-releasing' : ''}${free ? ' is-free' : ''}`} aria-labelledby="interlock-title">
      <h2 id="interlock-title" className="interlock__readout">
        <span className="interlock__figure">
          {locks.length - blocking.length}
          <span>/{locks.length}</span>
        </span>
        <span className="interlock__figure-label">Khoá đã giải</span>
      </h2>
      <ol className="interlock__locks">
        {locks.map((lock, i) => (
          <li key={lock.id} className={`lock lock--${lock.state}`}>
            <Lamp state={lock.state} delay={releasing ? i * 90 : undefined} />
            <div className="lock__text">
              <span className="lock__label">{lock.label}</span>
              <span className="lock__detail">{lock.detail}</span>
            </div>
            {lock.action && (
              <button type="button" className="lock__action" onClick={lock.action.run}>
                {lock.action.label}
              </button>
            )}
          </li>
        ))}
      </ol>
      <div className="lever">
        <button
          type="button"
          className="lever__btn"
          aria-disabled={!free || publishing}
          aria-describedby="lever-reason"
          onClick={() => {
            if (free && !publishing) onPublish();
          }}
        >
          <span className="lever__icon" aria-hidden="true">
            {free ? <LockOpen size={20} /> : <Lock size={20} />}
          </span>
          <span className="lever__text">{publishing ? 'Đang Publish…' : `Publish thành v${nextVersion}`}</span>
        </button>
        <span id="lever-reason" className="lever__reason" aria-live="polite">
          {reason}
        </span>
      </div>
    </section>
  );
}
