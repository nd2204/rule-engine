import { Lock, LockOpen, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Lamp, type LampState } from '../../components/Lamp';
import { useFresh } from '../../components/useFresh';

export interface Interlock {
  id: string;
  label: string;
  state: LampState;
  detail: string;
  /** Ways out of the lock, most likely first. */
  actions?: { label: string; run: () => void }[];
}

/** What Publish will do, read back to the author between the first and the second pull. */
export interface PublishSummary {
  nextVersion: number;
  latestNo: number;
  added: string[];
  changed: string[];
  removed: string[];
  passed: number;
  total: number;
  /** Acknowledged consequences, in the words the locks used. */
  acknowledged: string[];
  /** Thinner evidence than the pass count admits: deleted Test Cases, Rules no Test Case reaches. */
  cautions: string[];
  /** The Draft is identical to Latest: nothing to publish, and the lever says so. */
  unchanged: boolean;
}

interface Props {
  locks: Interlock[];
  summary: PublishSummary;
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
export function InterlockRow({ locks, summary, nextVersion, publishing, blockedByViewport, onPublish }: Props) {
  const allClear = locks.every((l) => l.state === 'clear');
  const free = allClear && !blockedByViewport && !summary.unchanged;
  // Two-stage pull: the first press reads back what Publish will do, the second commits.
  // Any change to what would be published (an edit, a lock) lets the lever fall back.
  const [armedFor, setArmedFor] = useState<string | null>(null);
  const summaryKey = JSON.stringify(summary);
  const armed = free && armedFor === summaryKey;
  const leverRef = useRef<HTMLButtonElement>(null);
  // What blocks Publish is read on demand (hover, focus or a press on the locked lever), not printed under it.
  const [reasonOpen, setReasonOpen] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      setArmedFor(null);
      leverRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [armed]);
  const was = useRef(free);
  const [releasing, setReleasing] = useState(false);
  const [relocking, setRelocking] = useState(false);

  useEffect(() => {
    if (free && !was.current) {
      setReleasing(true);
      const t = window.setTimeout(() => setReleasing(false), 900);
      was.current = free;
      return () => window.clearTimeout(t);
    }
    if (!free && was.current) {
      setRelocking(true);
      const t = window.setTimeout(() => setRelocking(false), 500);
      was.current = free;
      return () => window.clearTimeout(t);
    }
    was.current = free;
  }, [free]);

  const blocking = locks.filter((l) => l.state !== 'clear');
  const cleared = locks.length - blocking.length;
  const fresh = useFresh([`cleared:${cleared}`, ...locks.map((l) => `${l.id}:${l.state}`)]);
  const reason = blockedByViewport
    ? 'Publish trên màn hình rộng hơn'
    : summary.unchanged
      ? `Không có thay đổi so với v${summary.latestNo}`
      : blocking.length
      ? `Còn ${blocking.length} khoá chưa giải`
      : armed
        ? 'Nhấn lần nữa để Publish · Esc để huỷ'
        : `Sẵn sàng Publish v${nextVersion}`;

  const ruleChanges = [
    summary.added.length ? `thêm ${summary.added.join(', ')}` : null,
    summary.changed.length ? `sửa ${summary.changed.join(', ')}` : null,
    summary.removed.length ? `bỏ ${summary.removed.join(', ')}` : null,
  ].filter(Boolean);

  return (
    <section
      className={`interlock${releasing ? ' is-releasing' : ''}${free ? ' is-free' : ''}${armed ? ' is-armed' : ''}${relocking ? ' is-relocking' : ''}`}
      aria-labelledby="interlock-title"
    >
      {armed && (
        <div id="release-bay" className="release" role="group" aria-label={`Publish v${summary.nextVersion} sẽ`}>
          <p className="release__title">Publish v{summary.nextVersion} sẽ</p>
          <dl className="release__facts">
            <div>
              <dt>Rule</dt>
              <dd>{ruleChanges.length ? ruleChanges.join(' · ') : `giữ nguyên Rule của v${summary.latestNo}`}</dd>
            </div>
            <div>
              <dt>Latest Pointer</dt>
              <dd>
                v{summary.latestNo} → v{summary.nextVersion}. Caller gọi latest nhận v{summary.nextVersion} ngay; v{summary.latestNo} vẫn
                evaluate được và Rollback một bước.
              </dd>
            </div>
            <div>
              <dt>Test Case</dt>
              <dd>
                {summary.passed}/{summary.total} pass
              </dd>
            </div>
            {summary.cautions.length > 0 && (
              <div className="release__caution">
                <dt>Cần để ý</dt>
                <dd>{summary.cautions.join('; ')}</dd>
              </div>
            )}
            {summary.acknowledged.length > 0 && (
              <div>
                <dt>Đã chấp nhận</dt>
                <dd>{summary.acknowledged.join('; ')}</dd>
              </div>
            )}
          </dl>
          <button
            type="button"
            className="icon-btn release__close"
            aria-label="Huỷ, chưa Publish"
            title="Huỷ (Esc)"
            onClick={() => {
              setArmedFor(null);
              leverRef.current?.focus();
            }}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}
      <h2 id="interlock-title" className="interlock__readout">
        <span className={`interlock__figure${fresh.has(`cleared:${cleared}`) ? ' is-fresh' : ''}`}>
          {locks.length - blocking.length}
          <span>/{locks.length}</span>
        </span>{' '}
        <span className="interlock__figure-label">Khoá đã giải</span>
      </h2>
      <ol className="interlock__locks">
        {locks.map((lock, i) => (
          <li
            key={lock.id}
            className={`lock lock--${lock.state}${!releasing && fresh.has(`${lock.id}:${lock.state}`) ? ' is-fresh' : ''}`}
            tabIndex={0} aria-label={`${lock.label}: ${lock.detail}`}>
            <Lamp state={lock.state} delay={releasing ? i * 90 : undefined} />
            <div className="lock__text">
              <span className="lock__label">{lock.label}</span>
            </div>
            <div className="lock__pop">
              <span className="lock__detail">{lock.detail}</span>
              {lock.actions && lock.actions.length > 0 && (
                <span className="lock__actions">
                  {lock.actions.map((a) => (
                    <button key={a.label} type="button" className="btn btn--secondary lock__btn" onClick={a.run}>
                      {a.label}
                    </button>
                  ))}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
      <div className={`lever${reasonOpen ? ' is-reason-open' : ''}`}>
        <button
          ref={leverRef}
          type="button"
          className="lever__btn"
          aria-disabled={!free || publishing}
          aria-describedby={armed ? 'release-bay lever-reason' : 'lever-reason'}
          onClick={() => {
            if (!free || publishing) {
              setReasonOpen((o) => !o);
              return;
            }
            if (armed) onPublish();
            else setArmedFor(summaryKey);
          }}
        >
          <span className="lever__icon" aria-hidden="true">
            {free ? <LockOpen size={20} /> : <Lock size={20} />}
          </span>
          <span className="lever__text">
            {publishing ? 'Đang Publish…' : armed ? `Xác nhận Publish v${nextVersion}` : `Publish thành v${nextVersion}`}
          </span>
          {!free && !publishing && blocking.length > 0 && (
            <span className="lever__count" aria-hidden="true">
              {blocking.length}
            </span>
          )}
        </button>
        <span id="lever-reason" className="lever__reason" role="status">
          {reason}
        </span>
      </div>
    </section>
  );
}
