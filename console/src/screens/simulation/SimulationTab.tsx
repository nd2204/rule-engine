import { ChevronDown, CircleSlash, FileUp, Play, RefreshCw, ShieldX, TriangleAlert, Upload, X } from 'lucide-react';
import { useId, useMemo, useRef, useState, type DragEvent } from 'react';
import { api } from '../../api/client';
import { Lamp, type LampState } from '../../components/Lamp';
import { formatScalar, isAnyCell } from '../../domain/cell';
import type { RuleSet, SimFactResult, TestCase } from '../../domain/types';
import { AUTO_RUN_MAX, BATCH_MAX, batchKey, readBatch } from './batch';
import { computeImpact, PSEUDO, type Impact, type ImpactRow, type PseudoId } from './impact';
import { Outcome } from './Outcome';
import type { LedgerScope, Simulation, SourceFilter } from './useSimulation';

const n = (v: number) => v.toLocaleString('vi-VN');
const timeFormat = new Intl.DateTimeFormat('vi-VN', { timeStyle: 'medium' });

const PSEUDO_ICON: Record<PseudoId, typeof CircleSlash> = { '@none': CircleSlash, '@unique': TriangleAlert, '@schema': ShieldX };

const SIDE_LABEL: Record<Exclude<LedgerScope, { kind: 'changed' } | { kind: 'all' }>['side'], string> = {
  gained: 'Được thêm',
  lost: 'Mất',
  reshaped: 'Đổi output',
  wins: 'Thắng',
};

const STATUS_LAMP: Record<string, LampState> = { pass: 'clear', fail: 'stop', error: 'stop' };

interface Props {
  sim: Simulation;
  decisionId: string;
  /** The Draft as edited, or the Published version's Rules. */
  subject: RuleSet;
  subjectLabel: string;
  versions: number[];
  latestNo: number;
  testCases: TestCase[] | null;
  /** Wide screens only: the phone runs Test Cases alone. */
  canImport: boolean;
}

/** Results the source filter keeps. */
export function visibleResults(sim: Simulation): SimFactResult[] {
  const all = sim.run?.results ?? [];
  return sim.source === 'all' ? all : all.filter((r) => r.source === sim.source);
}

/** Simulation tab, primary: the source bar, the readout, the Rule impact table and the Fact ledger. */
export function SimulationTab(props: Props) {
  const { sim, subject, subjectLabel } = props;
  const [importing, setImporting] = useState(false);
  const results = visibleResults(sim);
  const baselineRules = sim.run?.baselineVersion === null ? null : sim.baselineRuleSet;
  const impact = useMemo(() => computeImpact(results, subject, baselineRules), [results, subject, baselineRules]);
  const baseLabel = sim.run?.baselineVersion ? `v${sim.run.baselineVersion}` : null;

  return (
    <div className="sim">
      <SourceBar {...props} onImport={() => setImporting(true)} importing={importing} />
      {importing && props.canImport && (
        <BatchImport
          decisionId={props.decisionId}
          ruleSet={subject}
          onCancel={() => setImporting(false)}
          onLoad={(b) => {
            sim.loadBatch(b);
            setImporting(false);
          }}
        />
      )}
      {sim.stale && sim.manualOnly && !sim.running && (
        <p className="banner sim__stale" role="status">
          <TriangleAlert size={16} aria-hidden="true" />
          <span>
            Kết quả cũ: Draft đã đổi sau lần chạy lúc {timeFormat.format(new Date(sim.run!.ranAt))}. Batch trên {n(AUTO_RUN_MAX)} Facts chỉ chạy khi bạn bấm.
          </span>
          <button type="button" className="btn btn--secondary" onClick={sim.runNow}>
            <Play size={15} aria-hidden="true" /> Chạy Simulation
          </button>
        </p>
      )}
      {sim.error && (
        <p className="banner banner--stop" role="alert">
          <X size={16} aria-hidden="true" />
          <span>Simulation lỗi: {sim.error}. Kết quả bên dưới là của lần chạy trước.</span>
          <button type="button" className="btn btn--secondary" onClick={sim.runNow}>
            Chạy lại
          </button>
        </p>
      )}
      {!sim.run ? (
        <div className="sim__loading" aria-busy="true">
          <Lamp state="pending" size="sm" /> Simulation đang chạy lần đầu…
        </div>
      ) : (
        <div className={`sim__body${sim.stale ? ' is-stale' : ''}`}>
          <Readout sim={sim} impact={impact} results={results} subject={subject} baselineRules={baselineRules} baseLabel={baseLabel} subjectLabel={subjectLabel} />
          <ImpactTable sim={sim} impact={impact} subject={subject} baseLabel={baseLabel} subjectLabel={subjectLabel} />
          <FactLedger key={JSON.stringify(sim.ledger) + sim.source} sim={sim} impact={impact} results={results} subject={subject} baselineRules={baselineRules} baseLabel={baseLabel} subjectLabel={subjectLabel} testCases={props.testCases} />
        </div>
      )}
    </div>
  );
}

// ---------------- source bar ----------------

function SourceBar(props: Props & { onImport: () => void; importing: boolean }) {
  const { sim, versions, latestNo, canImport } = props;
  const uid = useId();
  const tcCount = props.testCases?.length ?? 0;
  const batchCount = sim.batch?.facts.length ?? 0;
  const sources: { id: SourceFilter; label: string; count: number }[] = [
    { id: 'all', label: 'Tất cả', count: tcCount + batchCount },
    { id: 'test-case', label: 'Test Case', count: tcCount },
    ...(sim.batch ? [{ id: 'batch' as const, label: 'Fact Batch', count: batchCount }] : []),
  ];
  return (
    <section className="sim-source" aria-label="Nguồn Facts của Simulation">
      <div className="sim-source__cell sim-source__cell--filter">
        <span className="sim-source__label" id={`${uid}-src`}>
          Nguồn
        </span>
        {sim.batch ? (
          <div className="mode" role="group" aria-labelledby={`${uid}-src`}>
            {sources.map((s) => (
              <button key={s.id} type="button" className="mode__btn" aria-pressed={sim.source === s.id} onClick={() => sim.setSource(s.id)}>
                {s.label} <span className="mode__count">{n(s.count)}</span>
              </button>
            ))}
          </div>
        ) : (
          <span className="sim-source__static">
            Test Case <span className="mode__count">{n(tcCount)}</span>
          </span>
        )}
      </div>

      <div className={`sim-source__cell sim-source__cell--batch${sim.batch ? ' has-batch' : ''}`}>
        <span className="sim-source__label">Fact Batch</span>
        {sim.batch ? (
          <div className="sim-source__batch">
            <span className="sim-source__file" title={sim.batch.name}>
              <code>{sim.batch.name}</code>
            </span>
            <span className="sim-source__meta">
              <span className="visually-hidden">{n(batchCount)} Facts</span>
              {sim.batch.skipped.length > 0 && (
                <details className="sim-source__skipped">
                  <summary>bỏ {n(sim.batch.skipped.length)} dòng</summary>
                  <ul>
                    {sim.batch.skipped.slice(0, 20).map((s) => (
                      <li key={s.row}>
                        <code>{batchKey(s.row)}</code> {s.message}
                      </li>
                    ))}
                    {sim.batch.skipped.length > 20 && <li>… và {n(sim.batch.skipped.length - 20)} dòng nữa</li>}
                  </ul>
                </details>
              )}
            </span>
            {canImport && (
              <span className="sim-source__actions">
                <button type="button" className="icon-btn" onClick={props.onImport} disabled={props.importing} aria-label="Đổi Fact Batch" title="Đổi Fact Batch">
                  <RefreshCw size={15} aria-hidden="true" />
                </button>
                <button type="button" className="icon-btn icon-btn--danger" onClick={() => sim.loadBatch(null)} aria-label="Bỏ Fact Batch" title="Bỏ Fact Batch">
                  <X size={15} aria-hidden="true" />
                </button>
              </span>
            )}
          </div>
        ) : canImport ? (
          <div className="sim-source__batch">
            <span className="sim-source__empty">Test Case là vài tình huống chọn tay. Nạp Facts thật để đo tác động trên số đông.</span>
            {!props.importing && (
              <button type="button" className="btn btn--secondary" onClick={props.onImport}>
                <Upload size={15} aria-hidden="true" /> Nạp Fact Batch
              </button>
            )}
          </div>
        ) : (
          <span className="sim-source__empty">Nạp Fact Batch trên màn hình rộng hơn.</span>
        )}
      </div>

      <div className="sim-source__cell sim-source__cell--base">
        <label className="sim-source__label" htmlFor={`${uid}-base`}>
          So với
        </label>
        {versions.length === 0 ? (
          <span className="sim-source__empty">Chưa có version nào khác</span>
        ) : (
          <span className="sim-source__select-wrap">
          <select
            id={`${uid}-base`}
            className="sim-source__select"
            value={sim.baseline ?? ''}
            onChange={(e) => sim.setBaseline(e.target.value === '' ? null : Number(e.target.value))}
          >
            {[...versions].reverse().map((v) => (
              <option key={v} value={v}>
                v{v}
                {v === latestNo ? ' · Latest' : ''}
              </option>
            ))}
            <option value="">Không so sánh</option>
          </select>
          <ChevronDown size={14} aria-hidden="true" className="sim-source__chevron" />
          </span>
        )}
      </div>

      <p className="sim-source__cell sim-source__run" aria-live="polite" title={sim.manualOnly ? 'Batch lớn: chạy khi bấm' : 'Chạy lại sau mỗi lần sửa'}>
        <Lamp state={sim.running ? 'pending' : sim.error ? 'stop' : sim.stale ? 'caution' : sim.run ? 'clear' : 'idle'} size="sm" />
        <span>
          {sim.running
            ? 'Simulation đang chạy…'
            : sim.error
              ? 'Lần chạy cuối bị lỗi'
              : sim.stale
                ? 'Kết quả cũ'
                : sim.run
                  ? (
                    <>
                      <span className="visually-hidden">Chạy lúc </span>
                      {timeFormat.format(new Date(sim.run.ranAt))}
                    </>
                  )
                  : 'Chưa chạy'}
          <span className="sim-source__run-note">{sim.manualOnly ? 'Batch lớn: chạy khi bấm' : 'Chạy lại sau mỗi lần sửa'}</span>
        </span>
        {sim.manualOnly && !sim.running && (
          <button type="button" className="btn btn--secondary" onClick={sim.runNow}>
            <Play size={15} aria-hidden="true" /> Chạy
          </button>
        )}
      </p>
    </section>
  );
}

// ---------------- batch import ----------------

function BatchImport(props: { decisionId: string; ruleSet: RuleSet; onCancel: () => void; onLoad: (b: NonNullable<Simulation['batch']>) => void }) {
  const uid = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');
  const [name, setName] = useState('dán-tay.json');
  const [error, setError] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);

  function read(content: string, from: string) {
    const r = readBatch(content, from, props.ruleSet.inputs);
    if ('error' in r) setError(r.error);
    else props.onLoad(r.batch);
  }

  async function readFile(file: File) {
    if (file.size > 8 * 1024 * 1024) {
      setError(`Tệp ${file.name} lớn hơn 8 MB. Chia nhỏ batch, tối đa ${n(BATCH_MAX)} Facts.`);
      return;
    }
    const content = await file.text();
    setText(content.length > 200000 ? `${content.slice(0, 200000)}\n…` : content);
    setName(file.name);
    read(content, file.name);
  }

  async function useSample() {
    setBusy(true);
    try {
      const s = await api.sampleBatch(props.decisionId);
      read(JSON.stringify(s.facts), `${s.name} (minh hoạ)`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    const file = e.dataTransfer.files[0];
    if (file) void readFile(file);
  };

  const example = JSON.stringify(
    Object.fromEntries(props.ruleSet.inputs.slice(0, 3).map((f) => [f.name, f.type === 'number' ? 0 : f.type === 'boolean' ? true : f.type === 'list' ? [] : '…'])),
  );

  return (
    <section
      className={`sim-import${over ? ' is-over' : ''}`}
      aria-labelledby={`${uid}-title`}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
    >
      <header className="sim-import__head">
        <h2 id={`${uid}-title`} className="sim-import__title">
          Nạp Fact Batch
        </h2>
        <p className="sim-import__note">
          Dán JSON (một mảng Facts, hoặc mỗi dòng một Fact) hay CSV có dòng tiêu đề là tên trường, hoặc thả tệp .json / .csv vào đây. Tối đa {n(BATCH_MAX)} Facts.
          Batch chỉ nằm trong trang này, không lưu lên lớp quản trị.
        </p>
      </header>
      <label className="visually-hidden" htmlFor={`${uid}-text`}>
        Nội dung Fact Batch
      </label>
      <textarea
        id={`${uid}-text`}
        className="detail__json sim-import__text"
        rows={7}
        spellCheck={false}
        value={text}
        placeholder={`[${example},\n …]`}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${uid}-err` : undefined}
        onChange={(e) => {
          setText(e.target.value);
          setName('dán-tay.json');
          setError(null);
        }}
      />
      {error && (
        <p id={`${uid}-err`} className="detail__error" role="alert">
          {error}
        </p>
      )}
      <div className="sim-import__actions">
        <button type="button" className="btn btn--primary" onClick={() => read(text, name)}>
          Đọc batch
        </button>
        <button type="button" className="btn btn--secondary" onClick={() => fileRef.current?.click()}>
          <FileUp size={15} aria-hidden="true" /> Chọn tệp…
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,.csv,.ndjson,application/json,text/csv"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void readFile(file);
            e.target.value = '';
          }}
        />
        <button type="button" className="btn btn--ghost" onClick={() => void useSample()} disabled={busy}>
          {busy ? 'Đang tạo…' : 'Dùng batch mẫu (minh hoạ)'}
        </button>
        <button type="button" className="btn btn--ghost sim-import__cancel" onClick={props.onCancel}>
          Huỷ
        </button>
      </div>
    </section>
  );
}

// ---------------- readout ----------------

function Readout(props: {
  sim: Simulation;
  impact: Impact;
  results: SimFactResult[];
  subject: RuleSet;
  baselineRules: RuleSet | null;
  baseLabel: string | null;
  subjectLabel: string;
}) {
  const { impact, results, baseLabel, sim } = props;
  const tcs = results.filter((r) => r.source === 'test-case');
  const passed = tcs.filter((r) => r.status === 'pass').length;
  const touched = props.baselineRules ? impact.rows.filter((r) => r.kind === 'added' || r.kind === 'changed' || r.kind === 'removed').map((r) => r.id) : [];
  const compared = results.length - impact.rejectedBoth;
  const none = impact.changed.length === 0;
  return (
    <div className="sim-readout">
      <p className="sim-readout__main" aria-live="polite">
        {baseLabel ? (
          <>
            <strong className={`sim-readout__fig${none ? ' is-zero' : ''}`}>{n(impact.changed.length)}</strong>
            <span className="sim-readout__of">/{n(compared)}</span>
            <span className="sim-readout__text">
              Facts đổi kết quả so với {baseLabel}
              {sim.batch?.name.endsWith('(minh hoạ)') && sim.source !== 'test-case' && <span className="tag">batch minh hoạ</span>}
            </span>
          </>
        ) : (
          <>
            <strong className="sim-readout__fig">{n(results.length)}</strong>
            <span className="sim-readout__text">Facts đã chạy; không so sánh với version nào</span>
          </>
        )}
      </p>
      <dl className="sim-readout__side">
        {tcs.length > 0 && (
          <div>
            <dt>Test Case</dt>
            <dd>
              <Lamp state={passed === tcs.length ? 'clear' : 'stop'} size="sm" /> {passed}/{tcs.length} pass
            </dd>
          </div>
        )}
        {impact.rejectedBoth > 0 && (
          <div>
            <dt>Ngoài so sánh</dt>
            <dd>{n(impact.rejectedBoth)} Facts cả hai từ chối</dd>
          </div>
        )}
      </dl>
      {baseLabel && none && touched.length > 0 && (
        <p className="banner sim-readout__thin">
          <TriangleAlert size={16} aria-hidden="true" />
          <span>
            {props.subjectLabel} khác {baseLabel} ở {touched.join(', ')} nhưng không Fact nào chạm tới thay đổi: {sim.batch ? 'batch' : 'Test Case'} có thể chưa phủ chỗ đã sửa.
          </span>
        </p>
      )}
    </div>
  );
}

// ---------------- impact table ----------------

function ImpactTable(props: { sim: Simulation; impact: Impact; subject: RuleSet; baseLabel: string | null; subjectLabel: string }) {
  const { sim, impact, subject, baseLabel, subjectLabel } = props;
  const policy = subject.hitPolicy;
  const showMatched = policy !== 'COLLECT';
  const current = sim.ledger.kind === 'row' ? sim.ledger.id : null;
  // Rules nobody moved fold into one ruled row, so the Facts that did change reach the first viewport.
  const [unfold, setUnfold] = useState(false);
  const still = baseLabel
    ? impact.rows.filter((r) => r.kind === 'same' && !r.gained.length && !r.lost.length && !r.reshaped.length && r.id !== current)
    : [];
  const fold = still.length >= 2 && !unfold;
  const visible = fold ? impact.rows.filter((r) => !still.includes(r)) : impact.rows;
  const firstPseudo = visible.findIndex((r) => r.kind === 'pseudo');
  const columns = baseLabel ? 6 : 3;

  function select(row: ImpactRow) {
    if (current === row.id) {
      sim.setLedger({ kind: 'changed' });
      return;
    }
    const side = row.gained.length ? 'gained' : row.lost.length ? 'lost' : row.reshaped.length ? 'reshaped' : 'wins';
    sim.setLedger({ kind: 'row', id: row.id, side });
  }

  const foldRow = fold && (
    <tr key="@fold" className="impact__fold">
      <td className="impact__order" aria-hidden="true" />
      <td colSpan={columns - 1}>
        <button type="button" className="impact__fold-btn" aria-expanded={false} onClick={() => setUnfold(true)}>
          {still.length} Rule không đổi: <code>{still.map((r) => r.id).join(', ')}</code> <span className="impact__fold-act">Hiện</span>
        </button>
      </td>
    </tr>
  );

  return (
    <section aria-labelledby="impact-title" className="impact-wrap">
      <h2 id="impact-title" className="visually-hidden">
        Tác động theo Rule
      </h2>
      <div className="impact-frame">
        <table className="impact">
          <caption className="visually-hidden">
            Mỗi Rule: số Fact nó quyết định {baseLabel ? `dưới ${baseLabel} và ` : ''}dưới {subjectLabel}
            {baseLabel ? ', số Fact được thêm, mất và đổi output' : ''}. Chọn một Rule để xem các Fact đó.
          </caption>
          <thead>
            <tr className="impact__fields">
              <th scope="col" className="impact__th-order">
                #
              </th>
              <th scope="col">
                Tác động theo Rule
                <span className="impact__meta">
                  {policy}
                  {unfold && still.length >= 2 && (
                    <>
                      {' · '}
                      <button type="button" className="impact__refold" onClick={() => setUnfold(false)}>
                        gộp Rule không đổi
                      </button>
                    </>
                  )}
                </span>
              </th>
              {baseLabel && (
                <th scope="col" className="impact__num is-band is-seam">
                  <span className="impact__field">{baseLabel}</span>
                  <span className="impact__meta">Fact thắng</span>
                </th>
              )}
              <th scope="col" className={`impact__num is-band${baseLabel ? '' : ' is-seam'}`}>
                <span className="impact__field">{subjectLabel}</span>
                <span className="impact__meta">{showMatched ? 'khớp · thắng' : 'vào output'}</span>
              </th>
              {baseLabel && (
                <>
                  <th scope="col" className="impact__delta-head is-band is-seam">
                    <span className="impact__field impact__field--word">Δ</span>
                    <span className="impact__meta">mất · được thêm</span>
                  </th>
                  <th scope="col" className="impact__num is-band impact__reshaped">
                    <span className="impact__field impact__field--word">Đổi output</span>
                    <span className="impact__meta">vẫn thắng</span>
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, i) => [
              i === firstPseudo && foldRow,
              <ImpactRowView
                key={row.id}
                row={row}
                impact={impact}
                showMatched={showMatched}
                compare={!!baseLabel}
                current={current === row.id}
                seam={i === firstPseudo}
                baseLabel={baseLabel}
                subjectLabel={subjectLabel}
                onSelect={() => select(row)}
              />,
            ])}
            {firstPseudo === -1 && foldRow}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ImpactRowView(props: {
  row: ImpactRow;
  impact: Impact;
  showMatched: boolean;
  compare: boolean;
  current: boolean;
  seam: boolean;
  baseLabel: string | null;
  subjectLabel: string;
  onSelect: () => void;
}) {
  const { row, impact, showMatched, compare, current } = props;
  const pseudo = row.kind === 'pseudo';
  const Icon = pseudo ? PSEUDO_ICON[row.id as PseudoId] : null;
  const untouched = !pseudo && row.kind !== 'removed' && row.after === 0 && row.before === 0 && row.afterMatched === 0;
  const net = row.gained.length - row.lost.length;
  const cls = [
    'impact__row',
    `is-${row.kind}`,
    current ? 'is-current' : '',
    props.seam ? 'is-seam' : '',
    compare && (row.gained.length || row.lost.length || row.reshaped.length) ? 'is-moved' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <tr className={cls}>
      <td className="impact__order">
        {pseudo && Icon ? <Icon size={16} aria-hidden="true" className="impact__pseudo-icon" /> : <span className="rule__index">{(row.index ?? 0) + 1}</span>}
      </td>
      <td className="impact__ident">
        <div className="impact__line">
        <button type="button" className="impact__pick" aria-pressed={current} onClick={props.onSelect}>
          {pseudo ? <span className="impact__pseudo">{PSEUDO[row.id as PseudoId]}</span> : <code>{row.id}</code>}
        </button>
        {row.rule && (
          <span className="impact__desc" title={row.rule.description}>
            {row.rule.description}
          </span>
        )}
        <span className="impact__tags">
          {row.kind === 'added' && <span className="tag tag--clear">mới ở {props.subjectLabel}</span>}
          {row.kind === 'removed' && <span className="tag tag--stop">chỉ có ở {props.baseLabel}</span>}
          {row.kind === 'changed' && (
            <span className="tag tag--caution" title={changedNames(row.changed).join(', ')}>
              sửa {changedNames(row.changed).slice(0, 2).join(', ')}
              {row.changed.size > 2 ? ` +${row.changed.size - 2}` : ''}
            </span>
          )}
          {untouched && <span className="tag tag--caution">chưa Fact nào chạm</span>}
        </span>
        </div>
      </td>
      {compare && (
        <td className="impact__num is-band is-seam">
          {row.kind === 'added' ? <span className="impact__nil">–</span> : <Count won={row.before} matched={row.beforeMatched} showMatched={showMatched && !pseudo} />}
        </td>
      )}
      <td className={`impact__num is-band${compare ? '' : ' is-seam'}`}>
        {row.kind === 'removed' ? <span className="impact__nil">–</span> : <Count won={row.after} matched={row.afterMatched} showMatched={showMatched && !pseudo} />}
      </td>
      {compare && (
        <>
          <td className="impact__delta is-band is-seam">
            <span className="impact__delta-nums">
              <span className={row.lost.length ? 'is-lost' : 'is-nil'}>{row.lost.length ? `−${n(row.lost.length)}` : '0'}</span>
              <span className={row.gained.length ? 'is-gained' : 'is-nil'}>{row.gained.length ? `+${n(row.gained.length)}` : '0'}</span>
            </span>
            <span className="impact__bar" aria-hidden="true">
              <span className="impact__bar-lost" style={{ transform: `scaleX(${barScale(row.lost.length, impact.maxDelta)})` }} />
              <span className="impact__bar-gained" style={{ transform: `scaleX(${barScale(row.gained.length, impact.maxDelta)})` }} />
            </span>
            <span className={`impact__net${net > 0 ? ' is-gained' : net < 0 ? ' is-lost' : ''}`} aria-hidden="true">
              {net > 0 ? `+${n(net)}` : net < 0 ? `−${n(-net)}` : '0'}
            </span>
            <span className="visually-hidden">
              {net === 0 && !row.lost.length ? 'không đổi' : `mất ${row.lost.length}, được thêm ${row.gained.length}`}
            </span>
          </td>
          <td className="impact__num is-band impact__reshaped">{row.reshaped.length ? <span className="impact__fig">{n(row.reshaped.length)}</span> : <span className="impact__nil">–</span>}</td>
        </>
      )}
    </tr>
  );
}

/** Bars are on one scale for the table; anything that moved stays visible, nothing that did not is drawn. */
function barScale(count: number, max: number): number {
  return count === 0 ? 0 : Math.max(0.06, count / max);
}

function Count({ won, matched, showMatched }: { won: number; matched: number; showMatched: boolean }) {
  return (
    <>
      {showMatched && matched !== won && <span className="impact__matched">khớp {n(matched)} ·</span>}
      <span className={`impact__fig${won === 0 ? ' is-zero' : ''}`}>{n(won)}</span>
    </>
  );
}

// ---------------- Fact ledger ----------------

const PAGE = 100;

function factValue(v: unknown): string {
  if (v === undefined || v === null) return '—';
  if (Array.isArray(v)) return `${v.length} phần tử`;
  if (typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean') return formatScalar(v);
  return JSON.stringify(v);
}

function FactLedger(props: {
  sim: Simulation;
  impact: Impact;
  results: SimFactResult[];
  subject: RuleSet;
  baselineRules: RuleSet | null;
  baseLabel: string | null;
  subjectLabel: string;
  testCases: TestCase[] | null;
}) {
  const { sim, impact, results, subject, baselineRules, baseLabel, subjectLabel } = props;
  const [shown, setShown] = useState(PAGE);
  const scope = sim.ledger;
  const row = scope.kind === 'row' ? impact.rows.find((r) => r.id === scope.id) : undefined;

  const keys = useMemo(() => {
    if (scope.kind === 'all') return null;
    if (scope.kind === 'changed') return new Set(impact.changed);
    return new Set(row ? row[scope.side] : []);
  }, [scope, impact, row]);
  const list = keys ? results.filter((r) => keys.has(r.key)) : results;
  const tcName = new Map(props.testCases?.map((t) => [t.id, t.name]));

  // The Facts worth showing beside each key: the fields the selected Rule reads, or the first few of the schema.
  const fields = useMemo(() => {
    const rules = row?.rule ? [row.rule, baselineRules?.rules.find((r) => r.id === row.id)].filter(Boolean) : [];
    const used = subject.inputs.filter((f) => rules.some((r) => !isAnyCell(r!.when[f.name])));
    return (used.length ? used : subject.inputs).slice(0, 3);
  }, [row, baselineRules, subject]);

  const title =
    scope.kind === 'row' && row
      ? `${row.kind === 'pseudo' ? PSEUDO[row.id as PseudoId] : row.id} · ${SIDE_LABEL[scope.side]}`
      : scope.kind === 'all'
        ? 'Mọi Fact'
        : 'Facts đổi kết quả';

  const sides = row
    ? (['gained', 'lost', 'reshaped', 'wins'] as const).filter((s) => (s === 'wins' ? row.wins.length > 0 : baseLabel && row[s].length > 0))
    : [];

  return (
    <section className="facts" aria-labelledby="facts-title">
      <header className="facts__head">
        <h2 id="facts-title" className="section-title">
          {row && row.index !== undefined && row.kind !== 'pseudo' && <span className="rule__index facts__plate">{row.index + 1}</span>}
          {title} <span className="section-title__count">{n(list.length)}</span>
        </h2>
        <div className="facts__scope">
          {row ? (
            <>
              <div className="mode" role="group" aria-label={`Facts của ${row.id}`}>
                {sides.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="mode__btn"
                    aria-pressed={scope.kind === 'row' && scope.side === s}
                    onClick={() => {
                      sim.setLedger({ kind: 'row', id: row.id, side: s });
                      setShown(PAGE);
                    }}
                  >
                    {SIDE_LABEL[s]} <span className="mode__count">{n(row[s].length)}</span>
                  </button>
                ))}
              </div>
              <button type="button" className="btn btn--ghost" onClick={() => sim.setLedger({ kind: 'changed' })}>
                <X size={14} aria-hidden="true" /> Bỏ chọn {row.kind === 'pseudo' ? 'dòng' : row.id}
              </button>
            </>
          ) : (
            baseLabel && (
              <div className="mode" role="group" aria-label="Facts hiển thị">
                <button type="button" className="mode__btn" aria-pressed={scope.kind === 'changed'} onClick={() => sim.setLedger({ kind: 'changed' })}>
                  Đổi kết quả <span className="mode__count">{n(impact.changed.length)}</span>
                </button>
                <button type="button" className="mode__btn" aria-pressed={scope.kind === 'all'} onClick={() => sim.setLedger({ kind: 'all' })}>
                  Tất cả <span className="mode__count">{n(results.length)}</span>
                </button>
              </div>
            )
          )}
        </div>
      </header>

      {list.length === 0 ? (
        <p className="facts__empty">
          {scope.kind === 'changed'
            ? `Không Fact nào đổi kết quả so với ${baseLabel}. ${sim.batch ? '' : 'Nạp một Fact Batch để kiểm trên nhiều Facts hơn Test Case.'}`
            : 'Không có Fact nào ở đây.'}
        </p>
      ) : (
        <div className="ledger-frame">
          <table className={`ledger facts__table${scope.kind === 'all' || (scope.kind === 'row' && scope.side === 'wins') ? ' marks-changed' : ''}`}>
            <thead>
              <tr>
                <th scope="col">Fact</th>
                <th scope="col">{fields.map((f) => f.name).join(' · ')}</th>
                {baseLabel && <th scope="col">{baseLabel}</th>}
                <th scope="col">{subjectLabel}</th>
              </tr>
            </thead>
            <tbody>
              {list.slice(0, shown).map((r) => {
                const current = sim.selectedKey === r.key;
                return (
                  <tr key={r.key} className={`${current ? 'is-current' : ''}${r.changed ? ' is-changed' : ''}`}>
                    <th scope="row">
                      <button type="button" className="facts__key" aria-pressed={current} onClick={() => sim.setSelectedKey(current ? null : r.key)}>
                        {r.status && <Lamp state={STATUS_LAMP[r.status]} size="sm" />}
                        <code>{r.key}</code>
                      </button>
                      {r.source === 'test-case' && <span className="facts__name">{tcName.get(r.key)}</span>}
                    </th>
                    <td className="facts__values">
                      {fields.map((f) => (
                        <span key={f.name}>{factValue(r.facts[f.name])}</span>
                      ))}
                    </td>
                    {baseLabel && (
                      <td>
                        {r.baseline && (
                          <Outcome result={r.baseline} against={r.subject} side="before" outputs={baselineRules?.outputs ?? subject.outputs} hitPolicy={subject.hitPolicy} />
                        )}
                      </td>
                    )}
                    <td>
                      <Outcome result={r.subject} against={r.baseline} side="after" outputs={subject.outputs} hitPolicy={subject.hitPolicy} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {list.length > shown && (
        <button type="button" className="btn btn--ghost facts__more" onClick={() => setShown((s) => s + PAGE)}>
          Hiện thêm {n(Math.min(PAGE, list.length - shown))} trong {n(list.length - shown)} Facts còn lại
        </button>
      )}
    </section>
  );
}

/** Changed parts of a Rule as the tag names them: the Compound Condition by its domain name. */
function changedNames(changed: Set<string>): string[] {
  return [...changed].map((k) => (k === 'condition' ? 'Compound' : k));
}
