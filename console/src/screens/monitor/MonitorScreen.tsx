import { ArrowLeft, ChevronDown, ExternalLink, History, Pause, Play, RotateCw } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { ApiError, api } from '../../api/client';
import { Lamp, type LampState } from '../../components/Lamp';
import { Workspace } from '../../components/Workspace';
import { formatScalar } from '../../domain/cell';
import {
  binEvents,
  callerRecord,
  eventState,
  POINTER_LABEL,
  versionShares,
  type CallerInfo,
  type EventState,
  type MonitorDecision,
  type MonitorEvent,
  type PointerMove,
} from '../../domain/monitor';
import type { EvalResult, EvaluationTrace, RuleSet, Scalar } from '../../domain/types';
import { href, navigate } from '../../router';
import { useNarrow } from '../../state';
import { outputText } from '../simulation/Outcome';
import { TraceRuleView } from '../simulation/TraceInspector';
import { stageReplay } from '../replay/ReplayScreen';
import { useMonitor, type Connection } from './useMonitor';

const WINDOWS = [5, 15, 30] as const;
type WindowMin = (typeof WINDOWS)[number];
const BINS = 30;
const LEDGER_ROWS = 150;
/** On a phone every row wraps to several lines: keep the ledger short. */
const LEDGER_ROWS_PHONE = 40;
/** A Caller that has not called for this long reads as quiet. */
const QUIET_MS = 30_000;

const clock = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
const hm = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
const ms = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 });
const pct = new Intl.NumberFormat('vi-VN', { style: 'percent', maximumFractionDigits: 0 });

const LAMP: Record<EventState, LampState> = { clear: 'clear', idle: 'idle', caution: 'caution', stop: 'stop' };

interface Filter {
  decisionId: string | null;
  callerId: string | null;
  problemsOnly: boolean;
}

// Kept while the console is open, like the rest of the page state.
let lastWindow: WindowMin = 15;

/** Theo dõi: the Callers' calls to Published Decisions, live, read per Decision by the version that answered. */
export function MonitorScreen() {
  const m = useMonitor();
  const [windowMin, setWindowMin] = useState<WindowMin>(lastWindow);
  const [filter, setFilter] = useState<Filter>({ decisionId: null, callerId: null, problemsOnly: false });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    lastWindow = windowMin;
  }, [windowMin]);

  const windowMs = windowMin * 60_000;
  const inWindow = useMemo(() => {
    const cut = m.now - windowMs;
    return m.events.filter((e) => Date.parse(e.at) >= cut);
  }, [m.events, m.now, windowMs]);

  const selected = selectedId ? m.events.find((e) => e.id === selectedId) ?? null : null;
  const callerById = useMemo(() => new Map(m.callers.map((c) => [c.id, c])), [m.callers]);
  const latestOf = useMemo(() => new Map(m.decisions.map((d) => [d.id, d.latest])), [m.decisions]);

  const select = (id: string | null) => {
    setSelectedId(id);
    setDrawerOpen(id !== null);
  };

  if (m.connection === 'failed') {
    return (
      <Workspace
        className="screen--monitor"
        head={<MonitorHead m={m} inWindow={[]} windowMin={windowMin} onWindow={setWindowMin} />}
        primary={
          <div className="monitor-empty">
            <Lamp state="stop" />
            <div>
              <h2 className="monitor-empty__title">Không tải được các lượt gọi</h2>
              <p>Lớp quản trị không trả lời. Kiểm tra service rồi thử lại; các lượt gọi trong lúc mất kết nối không lấy lại được.</p>
              <button type="button" className="btn btn--secondary" onClick={m.retry}>
                <RotateCw size={15} aria-hidden="true" /> Thử lại
              </button>
            </div>
          </div>
        }
      />
    );
  }

  const inspector = selected ? (
    <EventInspector
      key={selected.id}
      event={selected}
      caller={callerById.get(selected.callerId)}
      latestNow={latestOf.get(selected.decisionId)}
      onBack={() => select(null)}
    />
  ) : (
    <CallerRoster
      callers={m.callers}
      events={m.events}
      now={m.now}
      latestOf={latestOf}
      loading={m.connection === 'loading'}
      current={filter.callerId}
      onPick={(id) => setFilter((f) => ({ ...f, callerId: f.callerId === id ? null : id }))}
    />
  );

  const summary = selected ? (
    <>
      <Lamp state={LAMP[eventState(selected)]} size="sm" /> {selected.requestId}
    </>
  ) : (
    <>Caller · {m.callers.length}</>
  );

  return (
    <Workspace
      className="screen--monitor"
      head={<MonitorHead m={m} inWindow={inWindow} windowMin={windowMin} onWindow={setWindowMin} />}
      primary={
        <div className="monitor">
          <Lanes
            decisions={m.decisions}
            events={inWindow}
            moves={m.moves}
            now={m.now}
            windowMs={windowMs}
            loading={m.connection === 'loading'}
            current={filter.decisionId}
            onPick={(id) => setFilter((f) => ({ ...f, decisionId: f.decisionId === id ? null : id }))}
          />
          <Ledger
            events={inWindow}
            fresh={m.fresh}
            decisions={m.decisions}
            callers={m.callers}
            filter={filter}
            onFilter={setFilter}
            selectedId={selectedId}
            onSelect={(id) => select(selectedId === id ? null : id)}
            loading={m.connection === 'loading'}
            windowMin={windowMin}
          />
        </div>
      }
      inspector={inspector}
      inspectorLabel={selected ? 'Lượt gọi' : 'Caller'}
      inspectorSummary={summary}
      drawerOpen={drawerOpen}
      onDrawerOpenChange={setDrawerOpen}
    />
  );
}

// ---------- head ----------

const CONNECTION: Record<Connection, { lamp: LampState; label: string; note: string }> = {
  loading: { lamp: 'pending', label: 'Đang nối', note: 'Đang tải các lượt gọi đã giữ' },
  live: { lamp: 'clear', label: 'Đang nhận', note: 'Lượt gọi mới hiện ngay khi Caller gọi' },
  lost: { lamp: 'caution', label: 'Mất kết nối', note: 'Đang nối lại; lượt gọi trong lúc mất không lấy lại được' },
  failed: { lamp: 'stop', label: 'Không tải được', note: 'Lớp quản trị không trả lời' },
};

function MonitorHead(props: {
  m: ReturnType<typeof useMonitor>;
  inWindow: MonitorEvent[];
  windowMin: WindowMin;
  onWindow: (w: WindowMin) => void;
}) {
  const { m, inWindow, windowMin } = props;
  const conn = m.paused && m.connection === 'live' ? { lamp: 'idle' as LampState, label: 'Tạm dừng', note: 'Màn hình đứng yên; lượt gọi mới vẫn được nhận' } : CONNECTION[m.connection];
  const lastMinute = inWindow.filter((e) => Date.parse(e.at) > m.now - 60_000).length;
  const errors = inWindow.filter((e) => e.error).length;
  const activeCallers = new Set(inWindow.filter((e) => Date.parse(e.at) > m.now - QUIET_MS).map((e) => e.callerId)).size;
  const ready = m.connection !== 'loading' && m.connection !== 'failed';

  const figures: { label: string; value: ReactNode; unit?: string; note: string; lamp?: LampState; stop?: boolean }[] = [
    { label: 'Luồng', value: conn.label, note: conn.note, lamp: conn.lamp },
    { label: 'Caller đang gọi', value: ready ? activeCallers : '—', unit: ready ? `/${m.callers.length}` : undefined, note: `Gọi trong ${QUIET_MS / 1000} giây qua` },
    { label: 'Lượt gọi', value: ready ? lastMinute : '—', unit: ready ? '/phút' : undefined, note: 'Trong 60 giây qua, mọi Decision' },
    {
      label: 'Lỗi',
      value: ready ? errors : '—',
      unit: ready && errors ? 'lượt' : undefined,
      note: `Trong ${windowMin} phút: Input Schema Validation từ chối, hoặc UNIQUE nhiều Rule khớp`,
      stop: ready && errors > 0,
    },
  ];

  return (
    <header className="readout">
      <div className="readout__ident">
        <h1 className="readout__title">Theo dõi</h1>
        <p className="readout__sub">
          Mỗi lượt Caller gọi engine: Decision Version nào trả lời, Facts nào chảy vào, kết quả ra sao
        </p>
      </div>
      <div className="readout__actions monitor-actions">
        <div className="mode mode--view" role="group" aria-label="Khoảng thời gian">
          {WINDOWS.map((w) => (
            <button key={w} type="button" className="mode__btn" aria-pressed={windowMin === w} onClick={() => props.onWindow(w)}>
              {w} phút
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btn btn--secondary monitor-actions__pause"
          aria-pressed={m.paused}
          disabled={!ready}
          onClick={() => m.setPaused(!m.paused)}
        >
          {m.paused ? <Play size={15} aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />}
          {m.paused ? (m.held ? `Tiếp tục · ${m.held} mới` : 'Tiếp tục') : 'Tạm dừng'}
        </button>
      </div>
      <dl className="readout__figures">
        {figures.map((f) => (
          <div key={f.label} className={`readout__fig${f.stop ? ' is-stop' : ''}`} title={f.note}>
            <dt>{f.label}</dt>
            <dd className={f.lamp ? 'readout__state' : undefined}>
              {f.lamp && <Lamp state={f.lamp} size="sm" />}
              <span className="readout__value">{f.value}</span>
              {f.unit && <span className="readout__unit">{f.unit}</span>}
            </dd>
          </div>
        ))}
      </dl>
      <p className="readout__meta">
        Giữ {m.keepMs / 60_000} phút trong bộ nhớ, service không có Decision Log <span aria-hidden="true">·</span> Nguồn: Caller giả lập (Mock API)
      </p>
    </header>
  );
}

// ---------- lanes ----------

function Lanes(props: {
  decisions: MonitorDecision[];
  events: MonitorEvent[];
  moves: PointerMove[];
  now: number;
  windowMs: number;
  loading: boolean;
  current: string | null;
  onPick: (id: string) => void;
}) {
  const { decisions, events, now, windowMs } = props;
  const byDecision = useMemo(() => {
    const map = new Map<string, MonitorEvent[]>();
    for (const e of events) {
      const list = map.get(e.decisionId) ?? [];
      list.push(e);
      map.set(e.decisionId, list);
    }
    return map;
  }, [events]);
  const bins = useMemo(
    () => new Map(decisions.map((d) => [d.id, binEvents(byDecision.get(d.id) ?? [], now, windowMs, BINS)])),
    [decisions, byDecision, now, windowMs],
  );
  // One scale for every lane, so lanes compare.
  const peak = Math.max(1, ...[...bins.values()].flatMap((bs) => bs.map((b) => b.onLatest + b.other)));
  const start = now - windowMs;
  const minutes = windowMs / 60_000;
  const ticks = [minutes, (minutes * 2) / 3, minutes / 3, 0];

  return (
    <section className="lanes" aria-labelledby="lanes-title">
      <div className="lanes__head">
        <h2 id="lanes-title" className="section-title">
          Lưu lượng theo Decision <span className="section-title__count">{minutes} phút gần nhất</span>
        </h2>
        <ul className="lanes__legend" aria-label="Chú giải">
          <li>
            <span className="lanes__swatch" aria-hidden="true" /> Version đang là Latest lúc gọi
          </li>
          <li>
            <span className="lanes__swatch is-other" aria-hidden="true" /> Version khác, Caller pin
          </li>
          <li>
            <span className="lanes__swatch is-error" aria-hidden="true" /> Có lỗi
          </li>
          <li>
            <span className="lanes__swatch is-move" aria-hidden="true" /> Latest Pointer đổi
          </li>
        </ul>
      </div>

      <div className="lanes__frame">
        {props.loading
          ? [0, 1, 2, 3].map((i) => (
              <div key={i} className="lane is-loading" aria-hidden="true">
                <span className="sk sk--row" />
                <span className="sk lane__sk-chart" />
                <span className="sk sk--row" />
              </div>
            ))
          : decisions.map((d) => {
              const list = byDecision.get(d.id) ?? [];
              const shares = versionShares(list);
              const errors = list.filter((e) => e.error).length;
              const moves = props.moves.filter((mv) => mv.decisionId === d.id && Date.parse(mv.at) >= start);
              const current = props.current === d.id;
              return (
                <div key={d.id} className={`lane${current ? ' is-current' : ''}`}>
                  <div className="lane__ident">
                    <button type="button" className="lane__pick" aria-pressed={current} onClick={() => props.onPick(d.id)}>
                      <code className="lane__id">{d.id}</code>
                      <span className="lane__title">{d.title}</span>
                      <span className="visually-hidden">{current ? ', đang lọc sổ theo Decision này' : ', lọc sổ theo Decision này'}</span>
                    </button>
                    <span className="lane__meta">
                      <span className="tag lane__latest">Latest v{d.latest}</span>
                      <span className="lane__policy">{d.hitPolicy}</span>
                      <a className="lane__open" href={href.version(d.id, d.latest)} title={`Mở ${d.id} v${d.latest}`} aria-label={`Mở ${d.id} v${d.latest}`}>
                        <ExternalLink size={13} aria-hidden="true" />
                      </a>
                    </span>
                  </div>

                  <div className="lane__chart" role="img" aria-label={laneLabel(d, list, shares, errors, minutes)}>
                    <div className="lane__bars">
                      {bins.get(d.id)!.map((b, i) => {
                        const total = b.onLatest + b.other;
                        return (
                          <span key={i} className={`lane__bin${i === BINS - 1 ? ' is-now' : ''}`}>
                            {/* The newest bin re-mounts on each call, so its arrival pulse plays again. */}
                            <span key={i === BINS - 1 ? total : 0} className="lane__stack" style={{ height: `${(total / peak) * 100}%` }}>
                              {b.other > 0 && <span className="lane__seg is-other" style={{ flexGrow: b.other }} />}
                              {b.onLatest > 0 && <span className="lane__seg" style={{ flexGrow: b.onLatest }} />}
                            </span>
                            {b.errors > 0 && <span className="lane__err" />}
                          </span>
                        );
                      })}
                    </div>
                    {moves.map((mv) => {
                      const x = ((Date.parse(mv.at) - start) / windowMs) * 100;
                      return (
                        <span key={mv.id} className={`lane__move${x > 62 ? ' is-end' : ''}`} style={{ left: `calc(12px + (100% - 24px) * ${x / 100})` }}>
                          <span className="lane__move-label">
                            v{mv.from} → v{mv.to} · {POINTER_LABEL[mv.kind]} {hm.format(new Date(mv.at))}
                          </span>
                        </span>
                      );
                    })}
                  </div>

                  <div className="lane__split">
                    {shares.length === 0 ? (
                      <span className="ledger__muted">Chưa có lượt gọi</span>
                    ) : (
                      <ul className="lane__shares">
                        {shares.slice(0, 3).map((s) => (
                          <li key={s.version}>
                            <span className={`lanes__swatch${s.version === d.latest ? '' : ' is-other'}`} aria-hidden="true" />
                            <span className="lane__v">v{s.version}</span>
                            <span className="lane__pct">{pct.format(s.calls / list.length)}</span>
                            {s.pinnedBy.length > 0 && <span className="lane__pin">pin · {s.pinnedBy.join(', ')}</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="lane__counts">
                      {list.length} lượt
                      {errors > 0 && (
                        <span className="lane__errors">
                          <Lamp state="stop" size="sm" /> {errors} lỗi
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              );
            })}

        <div className="lanes__axis" aria-hidden="true">
          <span />
          <span className="lanes__ticks">
            {ticks.map((t) => (
              <span key={t}>{t === 0 ? 'bây giờ' : `−${Math.round(t)} phút`}</span>
            ))}
          </span>
          <span />
        </div>
      </div>
    </section>
  );
}

function laneLabel(d: MonitorDecision, list: MonitorEvent[], shares: ReturnType<typeof versionShares>, errors: number, minutes: number) {
  if (!list.length) return `${d.id}: chưa có lượt gọi trong ${minutes} phút`;
  const split = shares.map((s) => `v${s.version} ${pct.format(s.calls / list.length)}${s.pinnedBy.length ? ` (pin bởi ${s.pinnedBy.join(', ')})` : ''}`).join(', ');
  return `${d.id}: ${list.length} lượt trong ${minutes} phút, ${split}, ${errors} lỗi`;
}

// ---------- ledger ----------

function factsLine(facts: Record<string, unknown>): string {
  return Object.entries(facts)
    .filter(([, v]) => v !== null && typeof v !== 'object')
    .slice(0, 3)
    .map(([k, v]) => `${k} ${formatScalar(v as Scalar)}`)
    .join(' · ');
}

function resultLine(e: MonitorEvent): string {
  if (e.error) return e.error.code === 'SCHEMA' ? `Bị từ chối: ${e.error.message}` : `UNIQUE: ${e.error.ruleIds?.join(', ') ?? 'nhiều Rule'} cùng khớp`;
  if (!e.matchedRuleIds.length) return 'Không Rule nào khớp';
  const ids = e.winnerRuleIds.join(', ');
  if (e.outputs.length === 1) {
    const values = Object.values(e.outputs[0])
      .filter((v) => v !== null)
      .map((v) => formatScalar(v))
      .join(' · ');
    return values ? `${ids} → ${values}` : ids;
  }
  return `${ids} → ${e.outputs.length} dòng output`;
}

function Ledger(props: {
  events: MonitorEvent[];
  fresh: Set<string>;
  decisions: MonitorDecision[];
  callers: CallerInfo[];
  filter: Filter;
  onFilter: (f: Filter) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
  windowMin: number;
}) {
  const { filter } = props;
  const uid = useId();
  const rows = useNarrow('(max-width: 599px)') ? LEDGER_ROWS_PHONE : LEDGER_ROWS;
  const shown = useMemo(() => {
    const out: MonitorEvent[] = [];
    for (let i = props.events.length - 1; i >= 0; i--) {
      const e = props.events[i];
      if (filter.decisionId && e.decisionId !== filter.decisionId) continue;
      if (filter.callerId && e.callerId !== filter.callerId) continue;
      if (filter.problemsOnly && !e.error && !e.warnings.length) continue;
      out.push(e);
    }
    return out;
  }, [props.events, filter]);
  const filtered = filter.decisionId || filter.callerId || filter.problemsOnly;

  return (
    <section className="monitor-ledger" aria-labelledby={`${uid}-title`}>
      <div className="monitor-ledger__head">
        <h2 id={`${uid}-title`} className="section-title">
          Sổ lượt gọi{' '}
          <span className="section-title__count">
            {shown.length > rows ? `${rows} mới nhất trên ${shown.length}` : `${shown.length} lượt`}
          </span>
        </h2>
        <div className="monitor-ledger__filters">
          <label className="visually-hidden" htmlFor={`${uid}-d`}>
            Decision
          </label>
          <span className="sim-source__select-wrap">
            <select
              id={`${uid}-d`}
              className="sim-source__select"
              value={filter.decisionId ?? ''}
              onChange={(e) => props.onFilter({ ...filter, decisionId: e.target.value || null })}
            >
              <option value="">Mọi Decision</option>
              {props.decisions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.id}
                </option>
              ))}
            </select>
            <ChevronDown size={14} aria-hidden="true" className="sim-source__chevron" />
          </span>
          <label className="visually-hidden" htmlFor={`${uid}-c`}>
            Caller
          </label>
          <span className="sim-source__select-wrap">
            <select
              id={`${uid}-c`}
              className="sim-source__select"
              value={filter.callerId ?? ''}
              onChange={(e) => props.onFilter({ ...filter, callerId: e.target.value || null })}
            >
              <option value="">Mọi Caller</option>
              {props.callers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id}
                </option>
              ))}
            </select>
            <ChevronDown size={14} aria-hidden="true" className="sim-source__chevron" />
          </span>
          <div className="mode mode--view" role="group" aria-label="Lượt gọi hiển thị">
            <button type="button" className="mode__btn" aria-pressed={!filter.problemsOnly} onClick={() => props.onFilter({ ...filter, problemsOnly: false })}>
              Tất cả
            </button>
            <button type="button" className="mode__btn" aria-pressed={filter.problemsOnly} onClick={() => props.onFilter({ ...filter, problemsOnly: true })}>
              Lỗi và cảnh báo
            </button>
          </div>
        </div>
      </div>

      <div className="ledger-frame monitor-ledger__frame">
        <table className="ledger monitor-ledger__table">
          <thead>
            <tr>
              <th scope="col">Giờ</th>
              <th scope="col" className="monitor-ledger__caller">Caller</th>
              <th scope="col">Decision</th>
              <th scope="col">Version</th>
              <th scope="col" className="monitor-ledger__facts">
                Facts
              </th>
              <th scope="col">Kết quả</th>
            </tr>
          </thead>
          <tbody>
            {props.loading ? (
              [0, 1, 2, 3, 4].map((i) => (
                <tr key={i} className="ledger__skeleton" aria-hidden="true">
                  <td colSpan={6}>
                    <span className="sk sk--row" />
                  </td>
                </tr>
              ))
            ) : shown.length === 0 ? (
              <tr>
                <td colSpan={6} className="ledger__empty">
                  {filtered ? (
                    <>
                      Không có lượt gọi nào khớp bộ lọc trong {props.windowMin} phút.{' '}
                      <button type="button" className="btn btn--ghost" onClick={() => props.onFilter({ decisionId: null, callerId: null, problemsOnly: false })}>
                        Bỏ lọc
                      </button>
                    </>
                  ) : (
                    `Chưa có Caller nào gọi trong ${props.windowMin} phút.`
                  )}
                </td>
              </tr>
            ) : (
              shown.slice(0, rows).map((e) => {
                const state = eventState(e);
                const current = e.id === props.selectedId;
                return (
                  <tr
                    key={e.id}
                    className={`monitor-row is-${state}${current ? ' is-current' : ''}${props.fresh.has(e.id) ? ' is-fresh' : ''}`}
                    aria-selected={current}
                    onClick={() => props.onSelect(e.id)}
                  >
                    <td className="monitor-row__time">
                      <button type="button" className="monitor-row__open" onClick={(ev) => (ev.stopPropagation(), props.onSelect(e.id))}>
                        {clock.format(new Date(e.at))}
                        <span className="visually-hidden">, mở lượt gọi {e.requestId}</span>
                      </button>
                    </td>
                    <td className="monitor-ledger__caller">
                      <code className="monitor-row__caller">{e.callerId}</code>
                    </td>
                    <td>
                      <code className="monitor-row__decision">{e.decisionId}</code>
                    </td>
                    <td className="monitor-row__version">
                      v{e.version}
                      {e.requested !== 'latest' && <span className="tag">pin</span>}
                    </td>
                    <td className="monitor-ledger__facts">
                      <span className="monitor-row__facts">{factsLine(e.facts)}</span>
                    </td>
                    <td className="monitor-row__result">
                      <Lamp state={LAMP[state]} size="sm" />
                      <span>{resultLine(e)}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ---------- inspector: the Callers ----------

function CallerRoster(props: {
  callers: CallerInfo[];
  events: MonitorEvent[];
  now: number;
  latestOf: Map<string, number>;
  loading: boolean;
  current: string | null;
  onPick: (id: string) => void;
}) {
  const stats = useMemo(() => {
    const map = new Map<string, { last: number; minute: number }>();
    for (const e of props.events) {
      const t = Date.parse(e.at);
      const s = map.get(e.callerId) ?? { last: 0, minute: 0 };
      s.last = Math.max(s.last, t);
      if (t > props.now - 60_000) s.minute++;
      map.set(e.callerId, s);
    }
    return map;
  }, [props.events, props.now]);

  return (
    <section className="inspect callers" aria-labelledby="callers-title">
      <header className="inspect__head">
        <h2 id="callers-title" className="inspect__title">
          Caller
        </h2>
        <p className="inspect__sub">Hệ thống đang gọi engine, và version mỗi hệ thống yêu cầu. Chọn một lượt gọi trong sổ để xem chi tiết.</p>
      </header>
      {props.loading ? (
        <ul className="callers__list" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <li key={i}>
              <span className="sk sk--row" />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="callers__list">
          {props.callers.map((c) => {
            const s = stats.get(c.id);
            const active = !!s && props.now - s.last < QUIET_MS;
            const current = props.current === c.id;
            return (
              <li key={c.id} className={`caller-card${current ? ' is-current' : ''}`}>
                <button type="button" className="caller-card__pick" aria-pressed={current} onClick={() => props.onPick(c.id)}>
                  <Lamp state={active ? 'clear' : 'idle'} size="sm" />
                  <span className="caller-card__name">
                    <code>{c.id}</code>
                    <span>{c.label}</span>
                  </span>
                  <span className="caller-card__rate">
                    {active ? `${s!.minute}/phút` : 'im lặng'}
                    <span className="visually-hidden">{current ? ', đang lọc sổ theo Caller này' : ', lọc sổ theo Caller này'}</span>
                  </span>
                </button>
                <ul className="caller-card__targets">
                  {c.targets.map((t) => {
                    const latest = props.latestOf.get(t.decisionId);
                    const behind = t.requested !== 'latest' && latest !== undefined ? latest - t.requested : 0;
                    return (
                      <li key={`${t.decisionId}-${t.requested}`}>
                        <code>{t.decisionId}</code>
                        {t.requested === 'latest' ? (
                          <span className="caller-card__req">latest{latest !== undefined && ` → v${latest}`}</span>
                        ) : (
                          <span className="caller-card__req">
                            pin v{t.requested}
                            {behind > 0 && <span className="tag tag--caution">sau Latest {behind} version</span>}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
      <p className="inspect__note callers__foot">
        Bốn Caller này là giả lập của mock API, gọi các version Published thật của mock; Publish hay Rollback trong console sẽ đổi lưu lượng của chúng. Service không có
        Decision Log: màn hình chỉ thấy các lượt gọi giữ trong bộ nhớ.
      </p>
    </section>
  );
}

// ---------- inspector: one call ----------

type Traced = EvalResult & { trace: EvaluationTrace };

function EventInspector(props: { event: MonitorEvent; caller?: CallerInfo; latestNow?: number; onBack: () => void }) {
  const e = props.event;
  const [ruleSet, setRuleSet] = useState<RuleSet | null>(null);
  const [trace, setTrace] = useState<{ status: 'idle' } | { status: 'loading' } | { status: 'done'; result: Traced } | { status: 'failed'; message: string }>({
    status: 'idle',
  });
  const traceRef = useRef<HTMLDivElement>(null);
  const state = eventState(e);

  useEffect(() => {
    let live = true;
    api.getVersion(e.decisionId, e.version).then(
      (v) => live && setRuleSet(v.ruleSet),
      () => undefined,
    );
    return () => {
      live = false;
    };
  }, [e.decisionId, e.version]);

  const loadTrace = async () => {
    setTrace({ status: 'loading' });
    try {
      const result = await api.evaluateVersion(e.decisionId, e.version, e.facts);
      setTrace({ status: 'done', result });
      requestAnimationFrame(() => traceRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
    } catch (err) {
      setTrace({ status: 'failed', message: (err as ApiError).message });
    }
  };

  const onLatestThen = e.version === e.latest;
  return (
    <section className="inspect call" aria-labelledby="call-title">
      <button type="button" className="btn btn--ghost call__back" onClick={props.onBack}>
        <ArrowLeft size={15} aria-hidden="true" /> Tất cả Caller
      </button>
      <header className="inspect__head">
        <h2 id="call-title" className="inspect__title">
          Lượt gọi <code className="call__req">{e.requestId}</code>
        </h2>
        <p className="inspect__sub">
          {props.caller?.label ?? e.callerId} · {clock.format(new Date(e.at))}
        </p>
      </header>

      <dl className="call__facts">
        <div>
          <dt>Decision</dt>
          <dd>
            <code>{e.decisionId}</code>
          </dd>
        </div>
        <div>
          <dt>Caller yêu cầu</dt>
          <dd>{e.requested === 'latest' ? 'latest' : `pin v${e.requested}`}</dd>
        </div>
        <div>
          <dt>Version trả lời</dt>
          <dd>
            v{e.version}
            <span className="call__aside">{onLatestThen ? 'là Latest lúc gọi' : `Latest lúc gọi là v${e.latest}`}</span>
          </dd>
        </div>
        <div>
          <dt>Execution time</dt>
          <dd>
            {e.executionTimeMs < 0.001 ? '< 0,001' : ms.format(e.executionTimeMs)} ms<span className="call__aside">trên trình giả lập</span>
          </dd>
        </div>
      </dl>

      <div className={`call__result is-${state}`}>
        <Lamp state={LAMP[state]} />
        <div>
          <h3 className="tc__label">Decision Result</h3>
          {e.error ? (
            <p>
              {e.error.code === 'SCHEMA' ? 'Input Schema Validation từ chối Facts' : 'UNIQUE: nhiều Rule cùng khớp'}: {e.error.message}
              {e.error.ruleIds && <> ({e.error.ruleIds.join(', ')})</>}
            </p>
          ) : e.outputs.length === 0 ? (
            <p>Không Rule nào khớp, output rỗng. Không phải lỗi.</p>
          ) : (
            <ul className="call__outputs">
              {e.outputs.map((row, i) => (
                <li key={i}>{ruleSet ? outputText(row, ruleSet.outputs) || '—' : Object.values(row).map((v) => formatScalar(v)).join(' · ')}</li>
              ))}
            </ul>
          )}
          {!e.error && (
            <p className="call__ids">
              Khớp: {e.matchedRuleIds.length ? e.matchedRuleIds.map((id) => <code key={id}>{id}</code>) : <span className="ledger__muted">không Rule nào</span>}
              {e.winnerRuleIds.length > 0 && (
                <>
                  {' '}
                  · Thắng: {e.winnerRuleIds.map((id) => <code key={id}>{id}</code>)}
                </>
              )}
            </p>
          )}
        </div>
      </div>
      {e.warnings.map((w) => (
        <p key={w} className="tc__warning">
          <Lamp state="caution" size="sm" /> {w}
        </p>
      ))}

      <h3 className="tc__label call__section">Facts gửi vào</h3>
      <FactsTable facts={e.facts} ruleSet={ruleSet} warnings={e.warnings} />

      <div className="call__actions">
        <button type="button" className="btn btn--secondary" onClick={() => void loadTrace()} disabled={trace.status === 'loading'} aria-busy={trace.status === 'loading'}>
          {trace.status === 'loading' ? <Lamp state="pending" size="sm" /> : null}
          {trace.status === 'done' ? 'Chạy lại Evaluation Trace' : 'Xem Evaluation Trace đầy đủ'}
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => {
            stageReplay(callerRecord(e));
            navigate(href.replay());
          }}
        >
          <History size={15} aria-hidden="true" /> Mở trong Replay
        </button>
      </div>
      <p className="inspect__note">Trace đầy đủ được replay từ Facts này trên v{e.version}: Decision Version bất biến nên kết quả trùng với lúc gọi.</p>

      <div ref={traceRef} className="call__trace" aria-live="polite">
        {trace.status === 'failed' && (
          <p className="trace__rejected">
            <Lamp state="stop" size="sm" /> Không chạy được Evaluation Trace: {trace.message}
          </p>
        )}
        {trace.status === 'done' && ruleSet && (
          <>
            <h3 className="tc__label call__section">
              Evaluation Trace · v{e.version} · {ruleSet.hitPolicy}
            </h3>
            {trace.result.error?.code === 'SCHEMA' ? (
              <p className="trace__rejected">
                <Lamp state="stop" size="sm" /> Input Schema Validation từ chối Facts: {trace.result.error.message}. Không Rule nào được xét.
              </p>
            ) : (
              <ol className="trace-rules">
                {trace.result.trace.rules.map((tr, i) => (
                  <TraceRuleView key={tr.ruleId} tr={tr} index={i} ruleSet={ruleSet} note={null} />
                ))}
              </ol>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function valueText(v: unknown): string {
  if (Array.isArray(v)) return `[${v.length} phần tử]`;
  if (v === null) return 'null';
  if (typeof v === 'string') return `"${v}"`;
  if (typeof v === 'number' || typeof v === 'boolean') return formatScalar(v);
  return JSON.stringify(v);
}

function typeOf(v: unknown): string {
  return Array.isArray(v) ? 'list' : typeof v;
}

/** The Facts against the answering version's input schema: missing, mistyped and unknown fields stand out. */
function FactsTable({ facts, ruleSet, warnings }: { facts: Record<string, unknown>; ruleSet: RuleSet | null; warnings: string[] }) {
  if (!ruleSet) {
    return (
      <pre className="inspect__code" tabIndex={0}>
        {JSON.stringify(facts, null, 2)}
      </pre>
    );
  }
  const known = new Set(ruleSet.inputs.map((f) => f.name));
  const extra = Object.keys(facts).filter((k) => !known.has(k));
  const warned = warnings.join(' ');
  return (
    <table className="replay-facts__table call__table">
      <thead>
        <tr>
          <th scope="col">Trường</th>
          <th scope="col">Giá trị</th>
        </tr>
      </thead>
      <tbody>
        {ruleSet.inputs.map((f) => {
          const has = Object.prototype.hasOwnProperty.call(facts, f.name);
          const v = facts[f.name];
          const wrong = has && v !== null && typeOf(v) !== f.type;
          const read = warned.includes(f.name);
          return (
            <tr key={f.name} className={wrong ? 'is-missing' : has ? undefined : f.required || read ? 'is-missing' : 'is-absent'}>
              <th scope="row">
                <code>{f.name}</code>
              </th>
              <td>
                {has ? (
                  <>
                    <code className="replay-facts__value">{valueText(v)}</code>
                    {wrong && <span className="replay-facts__gap">phải là {f.type}, nhận {typeOf(v)}</span>}
                  </>
                ) : (
                  <span className="replay-facts__gap">{f.required ? 'thiếu, bắt buộc' : read ? 'thiếu, Rule có đọc' : 'không gửi, tuỳ chọn'}</span>
                )}
              </td>
            </tr>
          );
        })}
        {extra.map((k) => (
          <tr key={k} className="is-extra">
            <th scope="row">
              <code>{k}</code>
            </th>
            <td>
              <code className="replay-facts__value">{valueText(facts[k])}</code>
              <span className="replay-facts__gap">ngoài schema, engine bỏ qua</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
