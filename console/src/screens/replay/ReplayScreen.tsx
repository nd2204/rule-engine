import { Check, Copy, ExternalLink, FileJson, PencilLine, RotateCcw, TriangleAlert } from 'lucide-react';
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { ApiError, api } from '../../api/client';
import { Lamp, type LampState } from '../../components/Lamp';
import { PageHead } from '../../components/PageHead';
import { Workspace } from '../../components/Workspace';
import { formatScalar } from '../../domain/cell';
import { checkReplay, missingFields, parseRecord, type CheckKey, type CheckRow, type ParseOutcome, type ReplayCheck, type ReplayRecord } from '../../domain/replay';
import type { DecisionSummary, EvalResult, EvaluationTrace, OutputRow, RuleSet, TraceRule } from '../../domain/types';
import { href } from '../../router';
import { outputText } from '../simulation/Outcome';
import { TraceRuleView } from '../simulation/TraceInspector';

type Traced = EvalResult & { trace: EvaluationTrace };
type Sample = Awaited<ReturnType<typeof api.replaySamples>>[number];

type Run =
  | { status: 'idle' }
  | { status: 'running'; record: ReplayRecord }
  | { status: 'failed'; record: ReplayRecord; title: string; message: string }
  | { status: 'done'; record: ReplayRecord; decision: DecisionSummary; ruleSet: RuleSet; publishedAt: string; replay: Traced; check: ReplayCheck };

// The record pasted last, kept while the console is open (like the mock API, it is gone on reload).
let lastText = '';

/** Hands a Caller's record to Replay (from Theo dõi): it opens with the record in place, ready to run. */
export function stageReplay(record: unknown) {
  lastText = JSON.stringify(record, null, 2);
}

const timeFormat = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'medium' });
const dateFormat = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short' });
const ms = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 });

const ROW_LABEL: Record<CheckKey, string> = {
  version: 'Decision Version',
  matched: 'Rule khớp',
  winners: 'Rule thắng',
  result: 'Decision Result',
};

const RECORD_SHAPE = `{
  "requestId": "…",          // tuỳ chọn
  "recordedAt": "2026-09-14T10:22:31+07:00",  // tuỳ chọn
  "facts": { … },
  "result": {
    "decisionId": "calculate-pos-discounts",
    "version": 6,
    "outputs": [ … ],
    "traceSummary": {
      "decisionVersion": 6,
      "matchedRules": [ … ],
      "winningRules": [ … ],
      "executionTimeMs": 0.041
    }
  }
}`;

function formatTime(iso: string | undefined): string | null {
  if (!iso) return null;
  const t = new Date(iso);
  return Number.isNaN(t.getTime()) ? iso : timeFormat.format(t);
}

function valueText(v: unknown): string {
  if (Array.isArray(v)) return `[${v.length} phần tử]`;
  if (v === null) return 'null';
  if (typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean') return formatScalar(v);
  return JSON.stringify(v);
}

/** Replay: a past evaluation, read back from the record its Caller kept and evaluated again on the same Decision Version. */
export function ReplayScreen() {
  const [text, setText] = useState(lastText);
  const [run, setRun] = useState<Run>({ status: 'idle' });
  const [editing, setEditing] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [samples, setSamples] = useState<Sample[] | null>(null);
  const [samplesError, setSamplesError] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const runRef = useRef<HTMLButtonElement>(null);
  const verdictRef = useRef<HTMLHeadingElement>(null);
  const ticket = useRef(0);

  const parsed = useMemo(() => parseRecord(text), [text]);

  useEffect(() => {
    lastText = text;
  }, [text]);

  useEffect(() => {
    let live = true;
    api.replaySamples().then(
      (s) => live && setSamples(s),
      () => live && setSamplesError(true),
    );
    return () => {
      live = false;
    };
  }, []);

  const replay = useCallback(async () => {
    if (!parsed.ok) return;
    const record = parsed.record;
    const n = ++ticket.current;
    setRun({ status: 'running', record });
    setEditing(false);
    setDrawerOpen(false);
    try {
      const [decision, version, result] = await Promise.all([
        api.getDecision(record.decisionId),
        api.getVersion(record.decisionId, record.version),
        api.evaluateVersion(record.decisionId, record.version, record.facts),
      ]);
      if (n !== ticket.current) return;
      setRun({
        status: 'done',
        record,
        decision,
        ruleSet: version.ruleSet,
        publishedAt: version.publishedAt,
        replay: result,
        check: checkReplay(record, result),
      });
    } catch (e) {
      if (n !== ticket.current) return;
      const err = e as ApiError;
      const title =
        err.status === 404
          ? err.code === 'VERSION_NOT_FOUND'
            ? `Không có v${record.version} của ${record.decisionId}`
            : `Không có Decision ${record.decisionId}`
          : 'Không replay được';
      const message =
        err.status === 404
          ? `${err.message}. Kiểm tra lại decisionId và Decision Version trong bản ghi: Decision Version không bao giờ bị xoá, kể cả sau Rollback, nên một bản ghi thật luôn tìm được version của nó.`
          : `${err.message}. Bản ghi vẫn còn nguyên, thử lại khi lớp quản trị phản hồi.`;
      setRun({ status: 'failed', record, title, message });
    }
  }, [parsed]);

  // After a replay lands, the verdict is the next thing to read.
  useEffect(() => {
    if (run.status === 'done') verdictRef.current?.focus({ preventScroll: false });
  }, [run]);

  const edit = () => {
    ticket.current++;
    setEditing(true);
    setRun({ status: 'idle' });
    requestAnimationFrame(() => textRef.current?.focus());
  };

  const loadSample = (s: Sample) => {
    ticket.current++;
    setText(JSON.stringify(s.record, null, 2));
    setRun({ status: 'idle' });
    setEditing(true);
    setDrawerOpen(false);
    requestAnimationFrame(() => runRef.current?.focus());
  };

  const done = run.status === 'done' ? run : null;
  const record = run.status === 'idle' ? null : run.record;

  const head = done ? (
    <ReplayHead run={done} />
  ) : (
    <PageHead title="Replay">
      Dán bản ghi Caller đã lưu, console evaluate lại trên đúng Decision Version đã ghi và đối chiếu với kết quả gốc.
    </PageHead>
  );

  const primary = (
    <div className="replay">
      {editing ? (
        <RecordInput
          text={text}
          onText={setText}
          parsed={parsed}
          textRef={textRef}
          runRef={runRef}
          onRun={() => void replay()}
          hasSamples={!!samples?.length}
          onShowSamples={() => setDrawerOpen(true)}
        />
      ) : (
        record && <RecordLine record={record} onEdit={edit} />
      )}

      {run.status === 'running' && (
        <section className="replay-verdict is-pending" aria-busy="true" aria-label="Đang replay">
          <Lamp state="pending" />
          <p className="replay-verdict__title">
            Đang evaluate lại trên <code>{run.record.decisionId}</code> v{run.record.version}
          </p>
        </section>
      )}

      {run.status === 'failed' && (
        <section className="replay-failed" role="alert">
          <TriangleAlert size={20} aria-hidden="true" />
          <div>
            <h2 className="replay-failed__title">{run.title}</h2>
            <p>{run.message}</p>
            <div className="replay-failed__actions">
              <button type="button" className="btn btn--secondary" onClick={edit}>
                <PencilLine size={15} aria-hidden="true" /> Sửa bản ghi
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => void replay()}>
                <RotateCcw size={15} aria-hidden="true" /> Thử lại
              </button>
            </div>
          </div>
        </section>
      )}

      {done && <ReplayResult run={done} verdictRef={verdictRef} />}
    </div>
  );

  const inspector = done ? (
    <FactsInspector record={done.record} ruleSet={done.ruleSet} missing={missingFields(done.replay.warnings)} />
  ) : (
    <SamplesInspector samples={samples} failed={samplesError} onLoad={loadSample} parsed={parsed} />
  );

  const summary = done ? (
    <>
      <Lamp state={done.check.verdict === 'match' ? 'clear' : 'stop'} size="sm" />
      {done.check.verdict === 'match' ? 'Khớp' : `Lệch ${done.check.mismatched}/${done.check.checked}`} · Facts
    </>
  ) : (
    <>
      <FileJson size={14} aria-hidden="true" /> Bản ghi mẫu
    </>
  );

  return (
    <Workspace
      className="screen--replay"
      head={head}
      primary={primary}
      inspector={inspector}
      inspectorLabel={done ? 'Facts đã ghi' : 'Bản ghi mẫu'}
      inspectorSummary={summary}
      drawerOpen={drawerOpen}
      onDrawerOpenChange={setDrawerOpen}
    />
  );
}

// ---------- head ----------

function ReplayHead({ run }: { run: Extract<Run, { status: 'done' }> }) {
  const { record, decision } = run;
  const onLatest = decision.latest === record.version;
  const facts: { label: string; value: ReactNode; note?: string }[] = [
    { label: 'Latest Pointer', value: `v${decision.latest}`, note: onLatest ? 'bản ghi trên chính Latest' : 'Replay không dùng Latest' },
    { label: 'Publish', value: dateFormat.format(new Date(run.publishedAt)), note: 'bất biến' },
    { label: 'Ghi lúc', value: formatTime(record.recordedAt) ?? 'không ghi' },
    { label: 'Request', value: record.requestId ? <code>{record.requestId}</code> : 'không ghi' },
    { label: 'Hit Policy', value: run.ruleSet.hitPolicy },
  ];
  return (
    <header className="slip">
      <div className="slip__ident">
        <p className="slip__eyebrow">Replay</p>
        <h1 className="slip__id">
          {decision.id}
          <span className="slip__version">v{record.version}</span>
        </h1>
        <p className="slip__sub">
          {decision.title} <span aria-hidden="true">·</span> evaluate lại Facts đã ghi trên v{record.version}
        </p>
      </div>
      <div className="slip__actions">
        <a className="btn btn--secondary" href={href.version(decision.id, record.version)}>
          <ExternalLink size={15} aria-hidden="true" /> Mở v{record.version}
        </a>
      </div>
      <dl className="slip__facts">
        {facts.map((f) => (
          <div key={f.label} className="slip__fact">
            <dt>{f.label}</dt>
            <dd>
              {f.value}
              {f.note && <span className="slip__note">{f.note}</span>}
            </dd>
          </div>
        ))}
      </dl>
    </header>
  );
}

// ---------- the record ----------

function RecordInput(props: {
  text: string;
  onText: (t: string) => void;
  parsed: ParseOutcome;
  textRef: RefObject<HTMLTextAreaElement | null>;
  runRef: RefObject<HTMLButtonElement | null>;
  onRun: () => void;
  hasSamples: boolean;
  onShowSamples: () => void;
}) {
  const { parsed } = props;
  const id = useId();
  const statusId = `${id}-status`;
  const ready = parsed.ok;
  return (
    <section className="record" aria-labelledby={`${id}-label`}>
      <div className="record__head">
        <label id={`${id}-label`} htmlFor={`${id}-text`} className="section-title is-lead">
          Bản ghi
        </label>
        <span className="record__hint">Facts snapshot và Decision Result kèm Trace Summary, đúng như Caller đã lưu</span>
      </div>
      <textarea
        id={`${id}-text`}
        ref={props.textRef}
        className="record__text"
        value={props.text}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        placeholder={'{\n  "facts": { … },\n  "result": { "decisionId": …, "version": …, "outputs": […], "traceSummary": { … } }\n}'}
        aria-describedby={statusId}
        aria-invalid={parsed.ok || parsed.kind === 'empty' ? undefined : true}
        onChange={(e) => props.onText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            if (ready) props.onRun();
          }
        }}
      />
      <div className="record__bar">
        <div id={statusId} className="record__status" aria-live="polite">
          <ParseStatus parsed={parsed} />
        </div>
        <button ref={props.runRef} type="button" className="btn btn--primary record__run" disabled={!ready} onClick={props.onRun}>
          Replay
          <kbd className="record__kbd" aria-hidden="true">
            {/Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘' : 'Ctrl'}↵
          </kbd>
        </button>
      </div>
      {parsed.ok === false && parsed.kind === 'empty' && props.hasSamples && (
        <button type="button" className="btn btn--ghost record__samples" onClick={props.onShowSamples}>
          <FileJson size={15} aria-hidden="true" /> Chưa có bản ghi thật? Dùng một bản ghi mẫu
        </button>
      )}
      <details className="record__shape">
        <summary>Dạng bản ghi</summary>
        <p>
          Đúng Decision Result mà Caller nhận, đặt cạnh <code>facts</code>. Cũng đọc được dạng phẳng, khi <code>decisionId</code>, <code>version</code>,{' '}
          <code>outputs</code> và <code>traceSummary</code> nằm ngay cấp ngoài. Bản ghi lỗi mang <code>error</code> thay cho <code>outputs</code>.
        </p>
        <pre className="inspect__code">{RECORD_SHAPE}</pre>
      </details>
    </section>
  );
}

function ParseStatus({ parsed }: { parsed: ParseOutcome }) {
  if (parsed.ok) {
    const n = Object.keys(parsed.record.facts).length;
    return (
      <p className="record__ok">
        <Lamp state="clear" size="sm" />
        <span>
          Đọc được: <code>{parsed.record.decisionId}</code> v{parsed.record.version}, {n} trường Facts
          {parsed.record.traceSummary ? ', có Trace Summary' : ''}
        </span>
      </p>
    );
  }
  if (parsed.kind === 'empty') return <p className="record__idle">Dán bản ghi vào ô trên.</p>;
  if (parsed.kind === 'syntax') {
    return (
      <p className="record__bad">
        <Lamp state="stop" size="sm" />
        <span>
          JSON không hợp lệ{parsed.line ? ` ở dòng ${parsed.line}, cột ${parsed.column}` : ''}. Thường gặp: thiếu dấu phẩy, dư dấu phẩy cuối, hoặc khoá không có ngoặc kép.
        </span>
      </p>
    );
  }
  return (
    <div className="record__bad">
      <Lamp state="stop" size="sm" />
      <ul>
        {parsed.problems.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </div>
  );
}

function RecordLine({ record, onEdit }: { record: ReplayRecord; onEdit: () => void }) {
  const at = formatTime(record.recordedAt);
  return (
    <div className="record-line">
      <FileJson size={16} aria-hidden="true" />
      <p>
        Bản ghi {record.requestId ? <code>{record.requestId}</code> : 'không có requestId'}
        {at && <> · ghi {at}</>} · {Object.keys(record.facts).length} trường Facts
      </p>
      <button type="button" className="btn btn--ghost" onClick={onEdit}>
        <PencilLine size={15} aria-hidden="true" /> Sửa bản ghi
      </button>
    </div>
  );
}

// ---------- the result ----------

function ReplayResult({ run, verdictRef }: { run: Extract<Run, { status: 'done' }>; verdictRef: RefObject<HTMLHeadingElement | null> }) {
  const { record, replay, check, ruleSet } = run;
  const match = check.verdict === 'match';
  const missing = missingFields(replay.warnings);
  const ts = record.traceSummary;

  const lede = match
    ? `Evaluate lại trên v${record.version} cho đúng ${check.checked === 1 ? 'mục' : `${check.checked} mục`} đã ghi. Decision Version bất biến, nên quyết định này tái tạo được bất cứ lúc nào.`
    : `Evaluate lại trên v${record.version} không cho lại điều đã ghi. Decision Version không đổi từ khi Publish, nên phần lệch nằm ở bản ghi: Facts đã ghi khác Facts engine nhận lúc gọi, hoặc bản ghi lấy nhầm version.`;

  const recMatched = new Set(ts?.matchedRules);
  const recWinners = new Set(ts?.winningRules);
  const note = (tr: TraceRule): string | null => {
    if (!ts) return null;
    if (recMatched.has(tr.ruleId) !== tr.matched) return recMatched.has(tr.ruleId) ? 'bản ghi: khớp' : 'bản ghi: trượt';
    const won = replay.winnerRuleIds.includes(tr.ruleId);
    if (recWinners.has(tr.ruleId) !== won) return recWinners.has(tr.ruleId) ? 'bản ghi: thắng' : 'bản ghi: không thắng';
    return null;
  };

  return (
    <>
      <section className={`replay-verdict is-${check.verdict}`} aria-labelledby="replay-verdict">
        <Lamp state={match ? 'clear' : 'stop'} />
        <div className="replay-verdict__body">
          <h2 id="replay-verdict" ref={verdictRef} tabIndex={-1} className="replay-verdict__title">
            {match ? 'Khớp' : `Lệch ở ${check.mismatched}/${check.checked} mục`}
          </h2>
          <p className="replay-verdict__lede">{lede}</p>
          {!match && missing.length > 0 && (
            <p className="replay-verdict__cause">
              <Lamp state="caution" size="sm" />
              <span>
                Facts đã ghi thiếu {missing.map((f, i) => (
                  <span key={f}>
                    {i > 0 && ', '}
                    <code>{f}</code>
                  </span>
                ))}
                . Replay tính các điều kiện trên {missing.length > 1 ? 'các trường này' : 'trường này'} là false; nếu lúc gọi thật Fact có {missing.length > 1 ? 'chúng' : 'trường này'}, bản ghi đã bị cắt bớt trên đường vào log.
              </span>
            </p>
          )}
        </div>
      </section>

      <div className="ledger-frame replay-check-frame">
        <table className="ledger replay-check">
          <caption className="visually-hidden">Đối chiếu bản ghi với replay trên v{record.version}</caption>
          <thead>
            <tr>
              <th scope="col">Mục</th>
              <th scope="col">Đã ghi</th>
              <th scope="col">Replay v{record.version}</th>
              <th scope="col">Đối chiếu</th>
            </tr>
          </thead>
          <tbody>
            {check.rows.map((row, i) => (
              <tr key={row.key} className={row.match === false ? 'is-off' : undefined}>
                <th scope="row">{ROW_LABEL[row.key]}</th>
                <td>
                  <Recorded row={row} record={record} ruleSet={ruleSet} />
                </td>
                <td>
                  <Replayed row={row} record={record} replay={replay} ruleSet={ruleSet} />
                </td>
                <td>
                  <Verdict state={row.match === null ? 'idle' : row.match ? 'clear' : 'stop'} delay={i * 90}>
                    {row.key === 'version' ? 'Đúng version' : row.match === null ? 'Không ghi' : row.match ? 'Khớp' : 'Lệch'}
                  </Verdict>
                </td>
              </tr>
            ))}
            <tr className="replay-check__time">
              <th scope="row">Execution time</th>
              <td>{ts?.executionTimeMs !== undefined ? `${ms.format(ts.executionTimeMs)} ms` : <span className="ledger__muted">không ghi</span>}</td>
              <td>
                {replay.trace.durationMs < 0.1 ? '< 0,1' : ms.format(replay.trace.durationMs)} ms
                <span className="replay-check__sub">trên trình giả lập</span>
              </td>
              <td>
                <Verdict state="idle" delay={check.rows.length * 90}>
                  Không đối chiếu
                </Verdict>
                <span className="replay-check__sub">thời gian chạy không tất định</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <section className="replay-trace sect-band" aria-labelledby="replay-trace-title">
        <h2 id="replay-trace-title" className="section-title">
          Evaluation Trace <span className="section-title__count">v{record.version} · {ruleSet.hitPolicy}</span>
        </h2>
        <p className="replay-trace__note">
          Từng Rule của v{record.version}, theo thứ tự engine xét. Rule mà bản ghi nói khác đi mang nhãn <span className="tag">bản ghi: …</span>
        </p>
        {replay.error?.code === 'SCHEMA' ? (
          <p className="trace__rejected">
            <Lamp state="stop" size="sm" /> Input Schema Validation từ chối Facts đã ghi: {replay.error.message}. Không Rule nào được xét.
          </p>
        ) : (
          <ol className="trace-rules replay-trace__rules">
            {replay.trace.rules.map((tr, i) => (
              <TraceRuleView key={tr.ruleId} tr={tr} index={i} ruleSet={ruleSet} note={note(tr)} />
            ))}
          </ol>
        )}
        {replay.error?.code === 'UNIQUE_VIOLATION' && (
          <p className="trace__rejected">
            <Lamp state="stop" size="sm" /> {replay.error.message}: {replay.error.ruleIds?.join(', ')}. UNIQUE không cho phép nhiều Rule cùng khớp.
          </p>
        )}
        {replay.warnings.map((w) => (
          <p key={w} className="tc__warning">
            <Lamp state="caution" size="sm" /> {w}
          </p>
        ))}
      </section>

      <p className="visually-hidden" role="status">
        Replay xong: {match ? 'khớp với bản ghi' : `lệch ở ${check.mismatched} trên ${check.checked} mục`}.
      </p>
    </>
  );
}

function Verdict({ state, delay, children }: { state: LampState; delay: number; children: ReactNode }) {
  return (
    <span className={`replay-check__verdict is-${state}`} style={{ animationDelay: `${delay}ms` }}>
      <Lamp state={state} size="sm" />
      {children}
    </span>
  );
}

function IdList({ ids, mark, markClass }: { ids: string[]; mark?: string[]; markClass?: string }) {
  if (!ids.length) return <span className="ledger__muted">không Rule nào</span>;
  const marked = new Set(mark);
  return (
    <span className="outcome__ids">
      {ids.map((id) => (
        <code key={id} className={marked.has(id) ? markClass : undefined}>
          {id}
          {marked.has(id) && <span className="visually-hidden">{markClass === 'is-lost' ? ' (replay không có)' : ' (bản ghi không có)'}</span>}
        </code>
      ))}
    </span>
  );
}

function OutputRows({ rows, ruleSet }: { rows: OutputRow[]; ruleSet: RuleSet }) {
  if (!rows.length) return <span className="ledger__muted">Không Rule nào khớp, output rỗng</span>;
  return (
    <ul className="replay-check__rows">
      {rows.map((r, i) => (
        <li key={i}>{outputText(r, ruleSet.outputs) || '—'}</li>
      ))}
    </ul>
  );
}

function Recorded({ row, record, ruleSet }: { row: CheckRow; record: ReplayRecord; ruleSet: RuleSet }) {
  const ts = record.traceSummary;
  switch (row.key) {
    case 'version':
      return <>v{record.version}</>;
    case 'matched':
      return ts ? <IdList ids={ts.matchedRules} mark={row.onlyRecorded} markClass="is-lost" /> : <span className="ledger__muted">không ghi</span>;
    case 'winners':
      return ts ? <IdList ids={ts.winningRules} mark={row.onlyRecorded} markClass="is-lost" /> : <span className="ledger__muted">không ghi</span>;
    case 'result':
      if (record.error) return <span className="replay-check__error">Lỗi {record.error.code}{record.error.message ? `: ${record.error.message}` : ''}</span>;
      return record.outputs ? <OutputRows rows={record.outputs} ruleSet={ruleSet} /> : <span className="ledger__muted">không ghi output</span>;
  }
}

function Replayed({ row, record, replay, ruleSet }: { row: CheckRow; record: ReplayRecord; replay: Traced; ruleSet: RuleSet }) {
  switch (row.key) {
    case 'version':
      return <>v{record.version}</>;
    case 'matched':
      return <IdList ids={replay.matchedRuleIds} mark={row.onlyReplayed} markClass="is-gained" />;
    case 'winners':
      return <IdList ids={replay.winnerRuleIds} mark={row.onlyReplayed} markClass="is-gained" />;
    case 'result':
      if (replay.error) return <span className="replay-check__error">Lỗi {replay.error.code}: {replay.error.message}</span>;
      return <OutputRows rows={replay.outputs} ruleSet={ruleSet} />;
  }
}

// ---------- inspector ----------

function FactsInspector({ record, ruleSet, missing }: { record: ReplayRecord; ruleSet: RuleSet; missing: string[] }) {
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(record.facts, null, 2);
  const known = new Set(ruleSet.inputs.map((f) => f.name));
  const extra = Object.keys(record.facts).filter((k) => !known.has(k));
  const touched = new Set(missing);
  return (
    <section className="inspect replay-facts" aria-labelledby="replay-facts-title">
      <header className="inspect__head">
        <h2 id="replay-facts-title" className="inspect__title">
          Facts đã ghi
        </h2>
        <p className="inspect__sub">Đối chiếu với input schema của v{record.version}</p>
      </header>
      <table className="replay-facts__table">
        <thead>
          <tr>
            <th scope="col">Trường</th>
            <th scope="col">Giá trị</th>
          </tr>
        </thead>
        <tbody>
          {ruleSet.inputs.map((f) => {
            const has = Object.prototype.hasOwnProperty.call(record.facts, f.name);
            return (
              <tr key={f.name} className={has ? undefined : touched.has(f.name) || f.required ? 'is-missing' : 'is-absent'}>
                <th scope="row">
                  <code>{f.name}</code>
                </th>
                <td>
                  {has ? (
                    <code className="replay-facts__value">{valueText(record.facts[f.name])}</code>
                  ) : (
                    <span className="replay-facts__gap">
                      {(touched.has(f.name) || f.required) && <TriangleAlert size={12} aria-hidden="true" />}
                      {f.required ? 'thiếu, bắt buộc' : touched.has(f.name) ? 'thiếu, Rule có đọc' : 'không có, tuỳ chọn'}
                    </span>
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
                <code className="replay-facts__value">{valueText(record.facts[k])}</code>
                <span className="replay-facts__gap">ngoài schema, engine bỏ qua</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="replay-facts__json">
        <div className="caller__head">
          <h3 className="tc__label">JSON</h3>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              void navigator.clipboard?.writeText(json).then(() => {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1600);
              });
            }}
          >
            {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />} {copied ? 'Đã chép' : 'Chép Facts'}
          </button>
        </div>
        <pre className="inspect__code" tabIndex={0} aria-label="Facts đã ghi, dạng JSON">
          {json}
        </pre>
      </div>
    </section>
  );
}

function SamplesInspector(props: { samples: Sample[] | null; failed: boolean; onLoad: (s: Sample) => void; parsed: ParseOutcome }) {
  const facts = props.parsed.ok ? props.parsed.record.facts : null;
  return (
    <section className="inspect replay-samples" aria-labelledby="replay-samples-title">
      <header className="inspect__head">
        <h2 id="replay-samples-title" className="inspect__title">
          Bản ghi mẫu
        </h2>
        <p className="inspect__sub">Minh họa, dựng từ Fact Batch mẫu của mock API</p>
      </header>
      {props.failed ? (
        <p className="inspect__note">Không tải được bản ghi mẫu. Vẫn dán được bản ghi thật vào ô bên trái.</p>
      ) : !props.samples ? (
        <ul className="replay-samples__list" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <span className="sk sk--row" />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="replay-samples__list">
          {props.samples.map((s) => (
            <li key={s.id}>
              <button type="button" className="replay-samples__item" onClick={() => props.onLoad(s)}>
                <code>{s.label}</code>
                <span>{s.note}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="inspect__note replay-samples__foot">
        Service không giữ Decision Log. Caller tự lưu Facts và Trace Summary của mỗi lần gọi; console chỉ replay những gì được dán vào và không lưu lại.
      </p>
      {facts && (
        <details className="trace__more">
          <summary>Facts trong bản ghi đang dán</summary>
          <pre className="inspect__code" tabIndex={0}>
            {JSON.stringify(facts, null, 2)}
          </pre>
        </details>
      )}
    </section>
  );
}
