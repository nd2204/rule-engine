import { ArrowLeft, FlaskConical, ListPlus, ListX, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Lamp, type LampState } from '../../components/Lamp';
import { formatScalar, parseNumber } from '../../domain/cell';
import type { EvalResult, HitPolicy, InputField, OutputField, OutputRow, Rule, RuleSet, Scalar, TestCase, TestCaseResult } from '../../domain/types';
import { DIFF, TestCaseForm, factValue, type Diff, type TestCaseBody } from './TestCaseStrip';

interface Props {
  testCases: TestCase[] | null;
  results: TestCaseResult[] | null;
  running: boolean;
  simError: string | null;
  ruleSet: RuleSet;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** A Draft on a wide screen: cells edit in place, rows can be added and deleted. */
  canEdit: boolean;
  onAdd?: (tc: TestCaseBody) => Promise<string | void>;
  onUpdate?: (id: string, tc: TestCaseBody) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  evaluate?: (facts: Record<string, unknown>) => Promise<EvalResult>;
  /** Why the table is read-only (a Published version, a narrow screen). */
  readOnlyNote?: string;
  /** What answers the Test Cases: "Draft", or a Published version such as "v3". */
  subjectLabel?: string;
}

const STATUS: Record<TestCaseResult['status'], { lamp: LampState; label: string }> = {
  pass: { lamp: 'clear', label: 'Pass' },
  fail: { lamp: 'stop', label: 'Fail' },
  error: { lamp: 'stop', label: 'Lỗi' },
};

type Parsed = { ok: true; value: Scalar | null } | { ok: false; error: string };

/** A typed cell back to a value; blank is "no value" (left out of the Facts, or an empty output). */
function parseValue(raw: string, type: InputField['type'] | OutputField['type'], required: boolean): Parsed {
  const s = raw.trim();
  if (s === '') return required ? { ok: false, error: 'Trường bắt buộc, cần một giá trị' } : { ok: true, value: null };
  if (type === 'number') {
    const n = parseNumber(s);
    return n === null ? { ok: false, error: `“${s}” không phải số` } : { ok: true, value: n };
  }
  if (type === 'boolean') {
    if (s === 'true' || s === 'đúng') return { ok: true, value: true };
    if (s === 'false' || s === 'sai') return { ok: true, value: false };
    return { ok: false, error: 'Chỉ nhận true hoặc false' };
  }
  return { ok: true, value: s };
}

const editText = (v: unknown) => (v === null || v === undefined ? '' : String(v));

/** One value cell: reads as text, edits in place on click or Enter, commits on Enter or leaving, Escape puts it back. */
function EditCell(props: {
  value: string;
  display: string;
  label: string;
  numeric?: boolean;
  editable: boolean;
  onCommit?: (text: string) => Promise<string | null>;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(props.value);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  if (!props.editable || !props.onCommit) {
    return <span className={`tct__value${props.display ? '' : ' is-empty'}`}>{props.display || '–'}</span>;
  }

  const close = (refocus: boolean) => {
    setEditing(false);
    setError(null);
    if (refocus) requestAnimationFrame(() => btnRef.current?.focus());
  };

  const commit = async (refocus: boolean) => {
    if (busy) return;
    if (text === props.value) return close(refocus);
    setBusy(true);
    const err = await props.onCommit!(text);
    setBusy(false);
    if (err) {
      setError(err);
      inputRef.current?.focus();
      return;
    }
    close(refocus);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void commit(true);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setText(props.value);
      close(true);
    }
  };

  if (editing) {
    return (
      <span className="tct__edit">
        <input
          ref={inputRef}
          className={`tct__input${props.numeric ? ' is-num' : ''}`}
          size={Math.max(4, Math.min(text.length + 1, 24))}
          value={text}
          aria-label={props.label}
          aria-invalid={error ? true : undefined}
          disabled={busy}
          onChange={(e) => {
            setText(e.target.value);
            setError(null);
          }}
          onKeyDown={onKey}
          onBlur={() => void commit(false)}
        />
        {error && (
          <span className="tct__error" role="alert">
            {error}
          </span>
        )}
      </span>
    );
  }
  return (
    <button
      ref={btnRef}
      type="button"
      className={`tct__value tct__value--edit${props.display ? '' : ' is-empty'}`}
      aria-label={`${props.label}: ${props.display || 'trống'}. Bấm để sửa`}
      onClick={() => {
        setText(props.value);
        setEditing(true);
      }}
    >
      {props.display || '–'}
    </button>
  );
}

const KEY = (row: OutputRow, outputs: OutputField[]) => JSON.stringify(outputs.map((f) => row[f.name] ?? null));

/** One line of a COLLECT Test Case: an expected row, a returned row, or both when they match. */
interface Line {
  row: OutputRow;
  /** Absent until Simulation has answered. */
  diff?: Diff;
  /** Index in the expected rows, when the line is expected. */
  exp?: number;
  /** The Rule that returned the line, when the subject returned it. */
  ruleId?: string;
}

/** Expected and returned rows paired by value, expected order first, then what came back unasked. */
function pairLines(expected: OutputRow[], result: EvalResult | null, outputs: OutputField[]): Line[] {
  if (!result) return expected.map((row, i) => ({ row, exp: i }));
  const pool: (string | null)[] = result.outputs.map((row) => KEY(row, outputs));
  const lines: Line[] = expected.map((row, i) => {
    const j = pool.indexOf(KEY(row, outputs));
    if (j === -1) return { row, exp: i, diff: 'missing' };
    pool[j] = null;
    return { row, exp: i, diff: 'same', ruleId: result.winnerRuleIds[j] };
  });
  result.outputs.forEach((row, j) => {
    if (pool[j] !== null) lines.push({ row, diff: 'extra', ruleId: result.winnerRuleIds[j] });
  });
  return lines;
}

const fmtOut = (v: Scalar | null | undefined, f: OutputField) =>
  v === null || v === undefined ? '' : `${formatScalar(v)}${f.unit ? ` ${f.unit}` : ''}`;

/** How each Hit Policy reads in the head: what makes a Rule count, and what one Test Case expects. */
const POLICY: Record<HitPolicy, { rule: string; meta: string; read: string }> = {
  FIRST: {
    rule: 'Rule thắng',
    meta: 'match đầu tiên',
    read: 'Rule match đầu tiên theo thứ tự thắng, các Rule match sau bị che. Mỗi Test Case kỳ vọng một dòng output.',
  },
  UNIQUE: {
    rule: 'Rule match',
    meta: 'tối đa một',
    read: 'Tối đa một Rule được match; từ hai Rule trở lên là lỗi UNIQUE. Kỳ vọng là một dòng output, hoặc chính lỗi đó.',
  },
  PRIORITY: {
    rule: 'Rule thắng',
    meta: 'weight cao nhất',
    read: 'Trong các Rule match, Rule có weight cao nhất thắng. Mỗi Test Case kỳ vọng một dòng output.',
  },
  COLLECT: {
    rule: 'Rule góp dòng',
    meta: 'khớp · thiếu · thừa',
    read: 'Mọi Rule match đều góp một dòng output. Kỳ vọng là cả danh sách dòng; từng dòng được đánh dấu khớp, thiếu hoặc thừa.',
  },
};

const LINE_MARK: Record<Diff, string> = { same: 'khớp', missing: 'thiếu', extra: 'thừa' };

/**
 * A Rule plate in two cells: what the Hit Policy made of the Rule, written out (THẮNG, CHE, BỊ VƯỢT, XUNG ĐỘT, GÓP),
 * then the Rule's id. The role is words, not only a colour or a dashed frame, so a screenshot reads on its own.
 */
function RuleId({ id, rule, role, tone }: { id: string; rule?: Rule; role: string; tone: 'won' | 'lost' | 'stop' }) {
  return (
    <span className={`tct-rid is-${tone}`} title={rule?.description}>
      <span className="tct-rid__role">{role}</span>
      <span className="tct-rid__id">{id}</span>
    </span>
  );
}

/**
 * The Hit Policy's own account of one Test Case, in the column beside the expectation:
 * FIRST names the winner and the Rules it shadowed, UNIQUE counts the matches against its limit of one,
 * PRIORITY ranks the matched Rules by weight.
 */
function PolicyPath({ ruleSet, result, running }: { ruleSet: RuleSet; result?: TestCaseResult; running: boolean }) {
  if (!result) return <span className="tct-path__none">{running ? 'Đang chạy' : '–'}</span>;
  const byId = new Map(ruleSet.rules.map((r) => [r.id, r]));
  const { actual } = result;
  const matched = actual.matchedRuleIds;

  if (actual.error?.code === 'UNIQUE_VIOLATION') {
    const ids = actual.error.ruleIds ?? matched;
    return (
      <div className="tct-path">
        <span className="tct-path__ids">
          {ids.map((id) => (
            <RuleId key={id} id={id} rule={byId.get(id)} role="xung đột" tone="stop" />
          ))}
        </span>
        <span className="tct-path__note is-stop">{ids.length} Rule cùng match, vượt giới hạn một</span>
      </div>
    );
  }
  if (actual.error) return <span className="tct-path__none is-stop">Không đánh giá được</span>;
  if (matched.length === 0) return <span className="tct-path__none">Không Rule nào match</span>;

  if (ruleSet.hitPolicy === 'PRIORITY') {
    const ranked = matched.map((id) => byId.get(id)).filter((r): r is Rule => !!r).sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0));
    const top = Math.max(1, ...ruleSet.rules.map((r) => r.weight ?? 0));
    const shown = ranked.slice(0, 4);
    return (
      <ol className="tct-ladder" aria-label="Rule match, xếp theo weight">
        {shown.map((r) => {
          const won = actual.winnerRuleIds.includes(r.id);
          return (
            <li key={r.id} className={won ? 'is-won' : undefined}>
              <RuleId id={r.id} rule={r} role={won ? 'thắng' : 'bị vượt'} tone={won ? 'won' : 'lost'} />
              <span className="tct-ladder__bar" aria-hidden="true">
                <span style={{ width: `${Math.max(4, ((r.weight ?? 0) / top) * 100)}%` }} />
              </span>
              <span className="tct-ladder__w">{r.weight ?? 0}</span>
            </li>
          );
        })}
        {ranked.length > shown.length && <li className="tct-ladder__more">và {ranked.length - shown.length} Rule nữa</li>}
      </ol>
    );
  }

  const winner = actual.winnerRuleIds[0];
  const rest = matched.filter((id) => id !== winner);
  const order = ruleSet.rules.findIndex((r) => r.id === winner);
  return (
    <div className="tct-path">
      <span className="tct-path__ids">
        {winner && <RuleId id={winner} rule={byId.get(winner)} role={ruleSet.hitPolicy === 'UNIQUE' ? 'match' : 'thắng'} tone="won" />}
        {ruleSet.hitPolicy === 'FIRST' && order >= 0 && <span className="tct-path__pos">hàng {order + 1}</span>}
        {ruleSet.hitPolicy === 'UNIQUE' && <span className="tct-path__pos">1 / tối đa 1</span>}
      </span>
      {rest.length > 0 && (
        <span className="tct-path__shadow">
          {rest.map((id) => (
            <RuleId key={id} id={id} rule={byId.get(id)} role="che" tone="lost" />
          ))}
        </span>
      )}
    </div>
  );
}

/**
 * The Test Case tab: every Test Case of the Decision against its Facts, its expectation and the subject's verdict.
 * The answer band takes the Hit Policy's shape: one row per Test Case with the winning Rule beside it
 * (FIRST, UNIQUE, PRIORITY), or a set of output lines, each marked matched, missing or extra, with the Rule that
 * returned it (COLLECT).
 */
export function TestCaseTab(props: Props) {
  const { testCases, results, running, simError, ruleSet, selectedId, onSelect, canEdit } = props;
  const subject = props.subjectLabel ?? 'Draft';
  const [formFor, setFormFor] = useState<string | 'new' | null>(null);
  const byId = new Map(results?.map((r) => [r.testCaseId, r]));
  const passed = results?.filter((r) => r.status === 'pass').length ?? 0;
  const total = testCases?.length ?? 0;
  const policy = ruleSet.hitPolicy;
  const collect = policy === 'COLLECT';
  const ruleById = new Map(ruleSet.rules.map((r) => [r.id, r]));

  // Keyboard focus follows the Test Case an action just touched.
  const focusRow = (id: string | null) =>
    requestAnimationFrame(() => {
      const el = id
        ? document.querySelector<HTMLElement>(`.tct [data-tc="${window.CSS.escape(id)}"] .tct__pick`)
        : document.querySelector<HTMLElement>('.tct-add, .tct .tct__pick');
      el?.focus();
    });

  const save = (tc: TestCase, patch: Partial<TestCaseBody>) =>
    props.onUpdate!(tc.id, { name: tc.name, facts: tc.facts, expected: tc.expected, ...patch });

  const attempt = async (work: Promise<void>) => {
    try {
      await work;
      return null;
    } catch (e) {
      return (e as Error).message;
    }
  };

  const commitFact = (tc: TestCase, f: InputField) => async (text: string) => {
    const p = parseValue(text, f.type, f.required);
    if (!p.ok) return p.error;
    const facts = { ...tc.facts };
    if (p.value === null) delete facts[f.name];
    else facts[f.name] = p.value;
    return attempt(save(tc, { facts }));
  };

  const expectedRows = (tc: TestCase): OutputRow[] => ('outputs' in tc.expected ? tc.expected.outputs : []);
  const full = (row: OutputRow): OutputRow => Object.fromEntries(ruleSet.outputs.map((o) => [o.name, row[o.name] ?? null]));

  /** One expected value of one expected line; a line left with no value at all drops out of the expectation. */
  const commitOut = (tc: TestCase, line: number, f: OutputField) => async (text: string) => {
    const p = parseValue(text, f.type, false);
    if (!p.ok) return p.error;
    const rows = expectedRows(tc).map(full);
    const row = full(rows[line] ?? {});
    row[f.name] = p.value as OutputRow[string];
    if (ruleSet.outputs.every((o) => row[o.name] === null)) rows.splice(line, 1);
    else rows[line] = row;
    return attempt(save(tc, { expected: { outputs: rows } }));
  };

  const adoptLine = (tc: TestCase, row: OutputRow) => save(tc, { expected: { outputs: [...expectedRows(tc).map(full), full(row)] } });
  const dropLine = (tc: TestCase, line: number) =>
    save(tc, { expected: { outputs: expectedRows(tc).filter((_, i) => i !== line) } });

  const commitName = (tc: TestCase) => async (text: string) => {
    if (!text.trim()) return 'Test Case cần một tên';
    return attempt(save(tc, { name: text.trim() }));
  };

  const head = (
    <header className="tct-head">
      <h2 className="tct-head__title">Test Case</h2>
      {results && total > 0 && (
        <p className={`tct-head__count${passed === total ? ' is-clear' : ' is-stop'}`} aria-live="polite">
          <strong>
            {passed}/{total}
          </strong>{' '}
          pass
        </p>
      )}
      <p className="tct-policy">
        <span className="rules-note__policy">{policy}</span>
        {POLICY[policy].read}
      </p>
      <p className="tct-head__note">
        {props.readOnlyNote ??
          (simError
            ? `Simulation lỗi: ${simError}`
            : running
              ? 'Simulation đang chạy…'
              : 'Bấm vào một ô để sửa. Simulation chạy lại sau mỗi lần sửa; Publish cần mọi Test Case pass.')}
      </p>
    </header>
  );

  if (!testCases) {
    return (
      <section className="tct-wrap" aria-busy="true">
        {head}
        <div className="sk-table">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="sk sk--row" />
          ))}
        </div>
      </section>
    );
  }

  const form = (tc?: TestCase) => (
    <TestCaseForm
      key={tc?.id ?? 'new'}
      layout="wide"
      ruleSet={ruleSet}
      testCase={tc}
      template={tc ? undefined : (testCases.find((t) => t.id === selectedId)?.facts ?? testCases[0]?.facts)}
      evaluate={props.evaluate}
      onCancel={() => {
        setFormFor(null);
        focusRow(tc?.id ?? null);
      }}
      onSubmit={async (body) => {
        if (tc) {
          await props.onUpdate!(tc.id, body);
          setFormFor(null);
          focusRow(tc.id);
        } else {
          const id = await props.onAdd!(body);
          setFormFor(null);
          if (id) {
            onSelect(id);
            focusRow(id);
          }
        }
      }}
    />
  );

  // Editing takes the table's place: a narrow list to move between Test Cases, and the form at full width beside it.
  const editing = formFor && formFor !== 'new' ? (testCases.find((t) => t.id === formFor) ?? null) : null;
  if (canEdit && (formFor === 'new' || editing)) {
    const r = editing ? byId.get(editing.id) : undefined;
    const open = (id: string) => {
      setFormFor(id);
      onSelect(id);
    };
    return (
      <section className="tct-wrap tct-wrap--editing" aria-labelledby="tce-title">
        {head}
        <div className="tce">
          <nav className="tce__list" aria-label="Chọn Test Case để sửa">
            <button
              type="button"
              className="tce__back"
              onClick={() => {
                setFormFor(null);
                focusRow(editing?.id ?? null);
              }}
            >
              <ArrowLeft size={15} aria-hidden="true" /> Bảng Test Case
            </button>
            <ul className="tce__items">
              {testCases.map((tc) => {
                const rr = byId.get(tc.id);
                const on = tc.id === formFor;
                return (
                  <li key={tc.id}>
                    <button type="button" className="tce__item" aria-current={on ? 'true' : undefined} onClick={() => open(tc.id)}>
                      <Lamp state={rr ? STATUS[rr.status].lamp : running ? 'pending' : 'idle'} size="sm" />
                      <span className="tce__id">{tc.id}</span>
                      <span className="tce__name">{tc.name}</span>
                    </button>
                  </li>
                );
              })}
              {formFor === 'new' && (
                <li>
                  <span className="tce__item is-new" aria-current="true">
                    <Plus size={14} aria-hidden="true" />
                    <span className="tce__name">Test Case mới</span>
                  </span>
                </li>
              )}
            </ul>
            {props.onAdd && formFor !== 'new' && (
              <button type="button" className="btn btn--ghost tce__add" onClick={() => setFormFor('new')}>
                <Plus size={16} aria-hidden="true" /> Thêm Test Case
              </button>
            )}
          </nav>
          <section className="tce__editor" aria-labelledby="tce-title">
            <header className="tce__head">
              <h3 id="tce-title" className="tce__title">
                {editing ? (
                  <>
                    Sửa <code>{editing.id}</code>
                  </>
                ) : (
                  'Test Case mới'
                )}
              </h3>
              {r && (
                <p className={`tce__verdict is-${r.status}`}>
                  <Lamp state={STATUS[r.status].lamp} size="sm" />
                  <span>
                    Hiện {STATUS[r.status].label.toLowerCase()} với {subject}
                    {r.differsFromLatest ? ' · khác Latest' : ''}
                  </span>
                </p>
              )}
              {editing && props.onDelete && (
                <button
                  type="button"
                  className="btn btn--secondary btn--secondary-danger tce__delete"
                  aria-label={`Xoá ${editing.id}`}
                  onClick={async () => {
                    const i = testCases.findIndex((t) => t.id === editing.id);
                    const next = testCases[i + 1]?.id ?? testCases[i - 1]?.id ?? null;
                    await props.onDelete!(editing.id);
                    if (next) open(next);
                    else setFormFor(null);
                  }}
                >
                  <Trash2 size={14} aria-hidden="true" /> Xoá
                </button>
              )}
            </header>
            {form(editing ?? undefined)}
          </section>
        </div>
      </section>
    );
  }

  const editable = canEdit && !!props.onUpdate;
  const openForm = (tc: TestCase) => {
    setFormFor(tc.id);
    onSelect(tc.id);
  };
  const outCls = (f: OutputField, i: number) => `tct__cell is-out${i === 0 ? ' is-first-out' : ''}${f.type === 'number' ? ' is-num' : ''}`;

  /** The expectation as a note across every output column: an expected error, or no output at all. */
  const noteCell = (tc: TestCase, text: string, rowSpan?: number) => (
    <td colSpan={ruleSet.outputs.length} rowSpan={rowSpan} className="tct__cell is-out is-first-out tct__cell--whole">
      {editable ? (
        <button type="button" className="tct__value tct__value--edit is-note" onClick={() => openForm(tc)}>
          {text}
        </button>
      ) : (
        <span className="tct__value is-note">{text}</span>
      )}
    </td>
  );

  const identCell = (tc: TestCase, status: (typeof STATUS)[TestCaseResult['status']] | null, active: boolean, rowSpan?: number) => (
    <th scope="row" rowSpan={rowSpan} className="tct__pin-l tct__ident">
      <button type="button" className="tct__pick" aria-pressed={active} onClick={() => onSelect(active ? null : tc.id)}>
        <Lamp state={status ? status.lamp : running ? 'pending' : 'idle'} size="sm" />
        <span className="tct__id">{tc.id}</span>
        <span className="visually-hidden">{active ? ', đang xem Evaluation Trace' : ', xem Evaluation Trace'}</span>
      </button>
      <EditCell value={tc.name} display={tc.name} label={`Tên ${tc.id}`} editable={editable} onCommit={editable ? commitName(tc) : undefined} />
      {collect && 'outputs' in tc.expected && (
        <span className="tct__setsize">
          kỳ vọng {tc.expected.outputs.length === 0 ? 'tập rỗng' : `${tc.expected.outputs.length} dòng`}
        </span>
      )}
    </th>
  );

  const factCells = (tc: TestCase, rowSpan?: number) =>
    ruleSet.inputs.map((f) => {
      const v = tc.facts[f.name];
      const missing = v === undefined && f.required;
      return (
        <td key={f.name} rowSpan={rowSpan} className={`tct__cell${f.type === 'number' ? ' is-num' : ''}${missing ? ' is-missing' : ''}`}>
          {f.type !== 'list' ? (
            <EditCell
              value={editText(v)}
              display={v === undefined ? '' : factValue(v)}
              label={`${f.name} của ${tc.id}`}
              numeric={f.type === 'number'}
              editable={editable}
              onCommit={editable ? commitFact(tc, f) : undefined}
            />
          ) : editable ? (
            <button type="button" className="tct__value tct__value--edit" onClick={() => openForm(tc)}>
              {v === undefined ? '–' : factValue(v)}
            </button>
          ) : (
            <span className="tct__value">{v === undefined ? '–' : factValue(v)}</span>
          )}
          {missing && <span className="tct__flag-missing">thiếu</span>}
        </td>
      );
    });

  const verdictCell = (tc: TestCase, r: TestCaseResult | undefined, extra: ReactNode, rowSpan?: number) => {
    const status = r ? STATUS[r.status] : null;
    return (
      <td rowSpan={rowSpan} className={`tct__pin-r is-out tct__verdict${r ? ` is-${r.status}` : ''}`}>
        <div className="tct__verdict-line">
          <span className="tct__status">{status ? status.label : running ? 'Đang chạy' : '–'}</span>
          {extra}
          {editable && (
            <span className="tct__actions">
              <button type="button" className="icon-btn" aria-label={`Mở ${tc.id} trong trình sửa`} title="Mở trong trình sửa" onClick={() => openForm(tc)}>
                <Pencil size={14} aria-hidden="true" />
              </button>
              {props.onDelete && (
                <button
                  type="button"
                  className="icon-btn icon-btn--danger"
                  aria-label={`Xoá ${tc.id}`}
                  title="Xoá"
                  onClick={async () => {
                    const i = testCases.findIndex((t) => t.id === tc.id);
                    const next = testCases[i + 1]?.id ?? testCases[i - 1]?.id ?? null;
                    await props.onDelete!(tc.id);
                    focusRow(next);
                  }}
                >
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              )}
            </span>
          )}
        </div>
        {r?.actual.error && r.actual.error.code !== 'UNIQUE_VIOLATION' && <p className="tct__why is-stop">{r.actual.error.message}</p>}
        {r?.differsFromLatest && <span className="tag tag--caution">khác Latest</span>}
      </td>
    );
  };

  /** FIRST, UNIQUE, PRIORITY: one row, the expected line in the output band, the subject's value under any cell it disagrees with. */
  const singleBody = (tc: TestCase, r: TestCaseResult | undefined, cls: string, active: boolean) => {
    const rows = expectedRows(tc);
    const want = rows[0];
    const got = r && !r.actual.error ? r.actual.outputs[0] : undefined;
    const answered = !!r && !r.actual.error;
    let expectation: ReactNode;
    if ('error' in tc.expected) expectation = noteCell(tc, `lỗi ${tc.expected.error}`);
    else if (rows.length === 0) expectation = noteCell(tc, 'không có output');
    else
      expectation = ruleSet.outputs.map((f, i) => {
        const w = want[f.name] ?? null;
        const g = got ? (got[f.name] ?? null) : null;
        const disagrees = answered && (got ? g !== w : true);
        return (
          <td key={f.name} className={`${outCls(f, i)}${disagrees ? ' is-off' : ''}`}>
            <EditCell
              value={editText(w)}
              display={fmtOut(w, f)}
              label={`Kỳ vọng ${f.name} của ${tc.id}`}
              numeric={f.type === 'number'}
              editable={editable && rows.length === 1}
              onCommit={editable && rows.length === 1 ? commitOut(tc, 0, f) : undefined}
            />
            {disagrees && (
              <span className="tct__got">
                {subject} <b>{got ? fmtOut(g, f) || '–' : '–'}</b>
              </span>
            )}
          </td>
        );
      });
    // An expectation of no output or an error, answered with a row: say what came back.
    const unasked = answered && got && ('error' in tc.expected || rows.length === 0);
    return (
      <tbody key={tc.id} data-tc={tc.id} className={cls}>
        <tr>
          {identCell(tc, r ? STATUS[r.status] : null, active)}
          {factCells(tc)}
          {expectation}
          <td className="tct__cell is-out tct__path">
            <PolicyPath ruleSet={ruleSet} result={r} running={running} />
          </td>
          {verdictCell(
            tc,
            r,
            unasked ? (
              <span className="tct__match is-stop">
                {subject} trả về{' '}
                {ruleSet.outputs
                  .map((f) => got![f.name])
                  .filter((v) => v !== null && v !== undefined)
                  .map((v) => formatScalar(v!))
                  .join(' · ')}
              </span>
            ) : null,
          )}
        </tr>
      </tbody>
    );
  };

  /** COLLECT: one row per output line, expected and returned paired by value, Facts and verdict spanning the set. */
  const collectBody = (tc: TestCase, r: TestCaseResult | undefined, cls: string, active: boolean) => {
    const comparable = !!r && !r.actual.error && 'outputs' in tc.expected;
    const lines = 'outputs' in tc.expected ? pairLines(tc.expected.outputs, comparable ? r!.actual : null, ruleSet.outputs) : [];
    const span = Math.max(1, lines.length);
    const matched = lines.filter((l) => l.diff === 'same').length;
    const lead = (
      <>
        {identCell(tc, r ? STATUS[r.status] : null, active, span)}
        {factCells(tc, span)}
      </>
    );
    const verdict = verdictCell(
      tc,
      r,
      comparable && lines.length > 0 ? (
        <span className="tct__match">
          {matched}/{lines.length} khớp
        </span>
      ) : null,
      span,
    );

    if ('error' in tc.expected || lines.length === 0) {
      const text = 'error' in tc.expected ? `lỗi ${tc.expected.error}` : 'tập rỗng';
      return (
        <tbody key={tc.id} data-tc={tc.id} className={cls}>
          <tr>
            {lead}
            {noteCell(tc, text)}
            <td className="tct__cell is-out tct__path">
              <PolicyPath ruleSet={ruleSet} result={r} running={running} />
            </td>
            {verdict}
          </tr>
        </tbody>
      );
    }

    return (
      <tbody key={tc.id} data-tc={tc.id} className={`${cls} tct__tc--set`}>
        {lines.map((line, k) => {
          const rule = line.ruleId ? ruleById.get(line.ruleId) : undefined;
          const own = editable && line.exp !== undefined;
          return (
            <tr key={k} className="tct__line" data-diff={line.diff}>
              {k === 0 && lead}
              {ruleSet.outputs.map((f, i) => (
                <td key={f.name} className={outCls(f, i)}>
                  <EditCell
                    value={editText(line.row[f.name])}
                    display={fmtOut(line.row[f.name], f)}
                    label={`Kỳ vọng ${f.name}, dòng ${(line.exp ?? 0) + 1} của ${tc.id}`}
                    numeric={f.type === 'number'}
                    editable={own}
                    onCommit={own ? commitOut(tc, line.exp!, f) : undefined}
                  />
                </td>
              ))}
              <td className="tct__cell is-out tct__path">
                <div className="tct-mark">
                  {line.diff ? <Lamp state={DIFF[line.diff].lamp} size="sm" /> : <span className="tct-mark__dot" aria-hidden="true" />}
                  <span className="tct-mark__label">{line.diff ? LINE_MARK[line.diff] : running ? 'chờ' : 'kỳ vọng'}</span>
                  {line.ruleId && <RuleId id={line.ruleId} rule={rule} role="góp" tone={line.diff === 'extra' ? 'lost' : 'won'} />}
                  {(line.diff === 'missing' || line.diff === 'extra') && (
                    <span className="tct-mark__why">
                      {ruleSet.outputs
                        .map((f) => fmtOut(line.row[f.name], f))
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  )}
                  {editable && line.diff === 'extra' && (
                    <button
                      type="button"
                      className="icon-btn tct-mark__act"
                      aria-label={`Nhận dòng ${line.ruleId ?? ''} vào Kỳ vọng của ${tc.id}`}
                      title="Nhận vào Kỳ vọng"
                      onClick={() => void adoptLine(tc, line.row)}
                    >
                      <ListPlus size={14} aria-hidden="true" />
                    </button>
                  )}
                  {editable && line.diff === 'missing' && (
                    <button
                      type="button"
                      className="icon-btn icon-btn--danger tct-mark__act"
                      aria-label={`Bỏ dòng ${k + 1} khỏi Kỳ vọng của ${tc.id}`}
                      title="Bỏ khỏi Kỳ vọng"
                      onClick={() => void dropLine(tc, line.exp!)}
                    >
                      <ListX size={14} aria-hidden="true" />
                    </button>
                  )}
                </div>
              </td>
              {k === 0 && verdict}
            </tr>
          );
        })}
      </tbody>
    );
  };

  const tableFrame = (
    <div className="tct-scroll">
      <table className={`tct tct--${policy.toLowerCase()}`} aria-labelledby="tct-title">
        <caption id="tct-title" className="visually-hidden">
          Test Case của Decision, kỳ vọng và kết quả của {subject} theo Hit Policy {policy}
        </caption>
        <thead>
          <tr className="tct__groups">
            <th scope="colgroup" className="tct__pin-l">
              Test Case
            </th>
            {ruleSet.inputs.length > 0 && (
              <th scope="colgroup" colSpan={ruleSet.inputs.length}>
                Facts · input
              </th>
            )}
            <th scope="colgroup" colSpan={ruleSet.outputs.length} className="is-out is-first-out">
              {collect ? 'Kỳ vọng · nhiều dòng' : 'Kỳ vọng · một dòng'}
            </th>
            <th scope="colgroup" className="is-out tct__path tct__path-head">
              Hit Policy <span className="rules-note__policy">{policy}</span>
            </th>
            <th scope="colgroup" className="tct__pin-r is-out">
              {subject} trả về
            </th>
          </tr>
          <tr className="tct__fields">
            <th scope="col" className="tct__pin-l">
              <span className="tct__field-name">Mã · tên</span>
            </th>
            {ruleSet.inputs.map((f) => (
              <th key={f.name} scope="col" className={f.type === 'number' ? 'is-num' : undefined}>
                <span className="tct__field-name">
                  {f.name}
                  {f.required && (
                    <abbr className="tct__req" title="bắt buộc">
                      *
                    </abbr>
                  )}
                </span>
                <span className="tct__field-meta">
                  {f.type}
                  {f.unit ? ` · ${f.unit}` : ''}
                </span>
              </th>
            ))}
            {ruleSet.outputs.map((f, i) => (
              <th key={f.name} scope="col" className={`is-out${i === 0 ? ' is-first-out' : ''}${f.type === 'number' ? ' is-num' : ''}`}>
                <span className="tct__field-name">{f.name}</span>
                <span className="tct__field-meta">
                  {f.type}
                  {f.unit ? ` · ${f.unit}` : ''}
                </span>
              </th>
            ))}
            <th scope="col" className="is-out tct__path">
              <span className="tct__field-name">{POLICY[policy].rule}</span>
              <span className="tct__field-meta">{POLICY[policy].meta}</span>
            </th>
            <th scope="col" className="tct__pin-r is-out">
              <span className="tct__field-name">Verdict</span>
              <span className="tct__field-meta">so với Kỳ vọng</span>
            </th>
          </tr>
        </thead>
        {testCases.map((tc) => {
          const r = byId.get(tc.id);
          const active = selectedId === tc.id;
          const cls = `tct__tc${active ? ' is-active' : ''}${r && r.status !== 'pass' ? ' is-failing' : ''}`;
          return collect ? collectBody(tc, r, cls, active) : singleBody(tc, r, cls, active);
        })}
      </table>
    </div>
  );

  return (
    <section className="tct-wrap" aria-labelledby="tct-title">
      {head}
      {testCases.length === 0 ? (
        <div className="tct-empty">
          <FlaskConical size={22} aria-hidden="true" />
          <div>
            <p className="tct-empty__title" id="tct-title">
              Decision này chưa có Test Case
            </p>
            <p>
              Mỗi Test Case là một bộ Facts mẫu và Decision Result bạn mong đợi. Publish cần ít nhất một Test Case và tất cả phải
              pass.
            </p>
            {canEdit && props.onAdd && (
              <button type="button" className="btn btn--primary tct-add" onClick={() => setFormFor('new')}>
                <Plus size={16} aria-hidden="true" /> Thêm Test Case đầu tiên
              </button>
            )}
          </div>
        </div>
      ) : (
        tableFrame
      )}
      {canEdit && props.onAdd && testCases.length > 0 && (
        <button type="button" className="btn btn--secondary tct-add" onClick={() => setFormFor('new')}>
          <Plus size={16} aria-hidden="true" /> Thêm Test Case
        </button>
      )}
    </section>
  );
}
