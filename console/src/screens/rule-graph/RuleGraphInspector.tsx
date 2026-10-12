import { Copy, Repeat2, Trash2 } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
import { Lamp } from '../../components/Lamp';
import { describeAst, formatScalar } from '../../domain/cell';
import { COMPOUND, contactCount, homes } from '../../domain/compound';
import type { Rule, RuleSet, Scalar } from '../../domain/types';
import { parseValue } from '../decision-table/RuleTable';
import { ContactForm, QuantPicker, factText } from './forms';
import { RULE, scopeOf, type Quant } from './graph';
import { SaveState } from './RuleGraphView';
import type { GraphUpdate, RuleGraph } from './useRuleGraph';

interface Props {
  graph: RuleGraph;
  rule: Rule;
  ruleSet: RuleSet;
  /** Present when the Rule can be edited: writes the Rule node's description, outputs and weight to the Draft. */
  onUpdateRule?: GraphUpdate;
}

const LOGIC_TEXT = {
  and: 'Đúng khi tất cả đầu vào đều đúng. Nối bao nhiêu dây vào cũng được; thứ tự từ trên xuống không ảnh hưởng kết quả.',
  or: 'Đúng khi ít nhất một đầu vào đúng. Nối bao nhiêu dây vào cũng được.',
  not: 'Đảo ngược đầu vào duy nhất của nó: đúng khi đầu vào sai.',
} as const;

/** Node graph, inspector: the form of the selected node, or how the graph reads and where it stands with the Draft. */
export function RuleGraphInspector({ graph: g, rule, ruleSet, onUpdateRule }: Props) {
  const node = g.selected ? g.graph.nodes.find((n) => n.id === g.selected) : null;
  const tr = node ? g.traced[node.id] : undefined;
  const editable = g.editable;

  let body;
  if (node && node.data.kind === 'cond') {
    const d = node.data;
    const scope = scopeOf(g.graph, node.id, ruleSet.inputs);
    body = (
      <section className="cform" aria-labelledby="gform-title">
        <h3 id="gform-title" className="cform__title">
          Điều kiện
        </h3>
        <p className="cform__where">
          {scope.list ? `Nối vào Mỗi phần tử ${scope.list}: so sánh một trường của từng phần tử.` : 'So sánh một trường của Fact.'}
          {g.reading.loose.has(node.id) ? ' Node chưa nối tới Rule nên chưa được lưu.' : ''}
        </p>
        {tr && (
          <p className={`cform__trace is-${tr.missing ? 'caution' : tr.ok ? 'clear' : 'stop'}`}>
            <Lamp state={tr.missing ? 'caution' : tr.ok ? 'clear' : 'stop'} size="sm" />
            <span>
              {tr.missing ? 'Fact thiếu trường này: điều kiện tính là sai' : `Fact: ${factText(tr.value)}`} → {tr.ok ? 'đúng' : 'sai'}
            </span>
          </p>
        )}
        {editable ? (
          <ContactForm
            key={`${node.id}:${d.leaf ? describeAst(d.leaf) : ''}:${scope.list ?? ''}`}
            fields={scope.fields}
            initial={d.leaf ?? undefined}
            focus={g.editRequest}
            submitLabel={d.leaf ? 'Áp dụng' : 'Đặt điều kiện'}
            onSubmit={(leaf) => {
              if ('value' in leaf) g.ops.setData(node.id, { kind: 'cond', leaf }, `Sửa ${describeAst(leaf)} trong ${rule.id}`);
            }}
          />
        ) : (
          d.leaf && (
            <p className="cform__reading">
              <code>{describeAst(d.leaf)}</code>
            </p>
          )
        )}
        <NodeActions graph={g} id={node.id} />
      </section>
    );
  } else if (node && (node.data.kind === 'and' || node.data.kind === 'or' || node.data.kind === 'not')) {
    const kind = node.data.kind;
    const word = { and: 'VÀ', or: 'HOẶC', not: 'KHÔNG' }[kind];
    body = (
      <section className="cform" aria-labelledby="gform-title">
        <h3 id="gform-title" className="cform__title">
          Node {word}
        </h3>
        <p className="cform__where">{LOGIC_TEXT[kind]}</p>
        {tr && (
          <p className={`cform__trace is-${tr.ok ? 'clear' : 'stop'}`}>
            <Lamp state={tr.ok ? 'clear' : 'stop'} size="sm" />
            <span>Với Test Case đang chạy: {tr.ok ? 'đúng' : 'sai'}.</span>
          </p>
        )}
        {editable && kind !== 'not' && (
          <div className="detail__row">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => g.ops.setData(node.id, { kind: kind === 'and' ? 'or' : 'and' }, `Đổi ${word} thành ${kind === 'and' ? 'HOẶC' : 'VÀ'} trong ${rule.id}`)}
            >
              <Repeat2 size={15} aria-hidden="true" /> Đổi thành {kind === 'and' ? 'HOẶC' : 'VÀ'}
            </button>
          </div>
        )}
        <NodeActions graph={g} id={node.id} />
      </section>
    );
  } else if (node && node.id === RULE) {
    body = <RuleForm key={`${rule.id}:${JSON.stringify(rule.then)}:${rule.description}:${rule.weight ?? ''}`} graph={g} rule={rule} ruleSet={ruleSet} onUpdateRule={onUpdateRule} />;
  } else if (node && node.data.kind === 'each') {
    body = <EachForm key={`${node.id}:${node.data.op}:${node.data.path}`} graph={g} rule={rule} ruleSet={ruleSet} id={node.id} op={node.data.op} path={node.data.path} />;
  } else {
    body = <Overview graph={g} rule={rule} ruleSet={ruleSet} />;
  }

  return (
    <section className="inspect rgraph-inspect" aria-labelledby="rgraph-inspect-title">
      <header className="inspect__head">
        <h2 id="rgraph-inspect-title" className="inspect__title">
          Điều kiện của Rule
        </h2>
        <p className="inspect__sub">
          <code>{rule.id}</code> · {g.graph.nodes.length - 1} node
        </p>
      </header>
      <div className="rgraph-inspect__save">
        <SaveState graph={g} />
        {g.reading.problems.length > 0 && (
          <ul className="rgraph-inspect__problems">
            {g.reading.problems.map((p) => (
              <li key={p.nodeId}>
                <button type="button" className="btn btn--ghost" onClick={() => g.setSelected(p.nodeId)}>
                  {g.describe(p.nodeId)}
                </button>
                <span>{p.message}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {body}
    </section>
  );
}

function EachForm({ graph: g, rule, ruleSet, id, op: op0, path }: Props & { id: string; op: Quant; path: string }) {
  const [op, setOp] = useState(op0);
  const [list, setList] = useState(path);
  const ref = useRef<HTMLSelectElement>(null);
  const tr = g.traced[id];
  const changed = op !== op0 || list !== path;
  return (
    <section className="cform" aria-labelledby="gform-title">
      <h3 id="gform-title" className="cform__title">
        Mỗi phần tử
      </h3>
      <p className="cform__where">Xét điều kiện nối vào cho từng phần tử của danh sách. Các node Điều kiện phía trước nó so sánh trường của phần tử.</p>
      {tr?.items && (
        <p className={`cform__trace is-${tr.ok ? 'clear' : 'stop'}`}>
          <Lamp state={tr.ok ? 'clear' : 'stop'} size="sm" />
          <span>
            {tr.items.matched}/{tr.items.count} phần tử khớp{tr.items.total > tr.items.count ? ` (trace giữ ${tr.items.count}/${tr.items.total} phần tử đầu)` : ''}: {tr.ok ? 'đúng' : 'sai'}.
          </span>
        </p>
      )}
      {g.editable ? (
        <form
          className="cform__form"
          onSubmit={(e) => {
            e.preventDefault();
            if (changed) g.ops.setData(id, { kind: 'each', op, path: list }, `Đổi Mỗi phần tử ${list} thành ${op} trong ${rule.id}`);
          }}
        >
          <QuantPicker op={op} list={list} lists={ruleSet.inputs.filter((f) => f.type === 'list')} onOp={setOp} onList={setList} focusRef={ref} />
          <div className="detail__row">
            <button type="submit" className="btn btn--primary" disabled={!changed}>
              Áp dụng
            </button>
          </div>
        </form>
      ) : (
        <p className="cform__reading">
          <code>
            {op0} {path}
          </code>
        </p>
      )}
      <NodeActions graph={g} id={id} />
    </section>
  );
}

function NodeActions({ graph: g, id }: { graph: RuleGraph; id: string }) {
  if (!g.editable || id === RULE) return null;
  const node = g.graph.nodes.find((n) => n.id === id)!;
  return (
    <div className="cform__actions" role="group" aria-label="Thao tác trên node">
      <button type="button" className="btn btn--secondary" onClick={() => g.ops.add(node.data, { x: node.position.x + 28, y: node.position.y + 120 })}>
        <Copy size={15} aria-hidden="true" /> Nhân bản
      </button>
      <button type="button" className="btn btn--ghost btn--ghost-danger" onClick={() => g.ops.remove([id])} aria-keyshortcuts="Delete">
        <Trash2 size={15} aria-hidden="true" /> Xoá <kbd>Del</kbd>
      </button>
    </div>
  );
}

/** The Rule node: what the Rule is called and what it returns when its condition holds. */
function RuleForm({ graph: g, rule, ruleSet, onUpdateRule }: Props) {
  const weighted = ruleSet.hitPolicy === 'PRIORITY';
  const text = (v: Scalar | null | undefined) => (v === null || v === undefined ? '' : String(v));
  const [desc, setDesc] = useState(rule.description);
  const [outs, setOuts] = useState<Record<string, string>>(() => Object.fromEntries(ruleSet.outputs.map((f) => [f.name, text(rule.then[f.name])])));
  const [weight, setWeight] = useState(text(rule.weight ?? 0));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const tr = g.trace;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!onUpdateRule) return;
    const then: Record<string, Scalar | null> = {};
    const errs: Record<string, string> = {};
    for (const f of ruleSet.outputs) {
      const v = parseValue(outs[f.name] ?? '', f.type === 'number');
      if (v !== null && typeof v === 'object') errs[f.name] = v.error;
      else then[f.name] = v;
    }
    const w = weighted ? parseValue(weight, true) : null;
    if (w !== null && typeof w === 'object') errs.weight = w.error;
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const changed = [
      ...(desc.trim() !== rule.description ? ['mô tả'] : []),
      ...ruleSet.outputs.filter((f) => then[f.name] !== (rule.then[f.name] ?? null)).map((f) => `${f.name} = ${formatScalar(then[f.name] ?? null)}`),
      ...(weighted && (w ?? 0) !== (rule.weight ?? 0) ? [`weight = ${w ?? 0}`] : []),
    ];
    if (!changed.length) return;
    onUpdateRule(
      (r) => ({ ...r, description: desc.trim(), then: { ...r.then, ...then }, ...(weighted ? { weight: typeof w === 'number' ? w : 0 } : {}) }),
      `Sửa ${rule.id}: ${changed.join(', ')}`,
    );
  }

  return (
    <section className="cform" aria-labelledby="gform-title">
      <h3 id="gform-title" className="cform__title">
        Mô tả và output
      </h3>
      <p className="cform__where">Khi dây cuối cùng vào Rule mang giá trị đúng, Rule match và trả về các output dưới đây.</p>
      {tr && (
        <p className={`cform__trace is-${tr.matched ? 'clear' : 'stop'}`}>
          <Lamp state={tr.matched ? 'clear' : 'stop'} size="sm" />
          <span>Với Test Case đang chạy: {tr.matched ? 'match' : 'không match'}.</span>
        </p>
      )}
      {onUpdateRule ? (
        <form className="cform__form rform" onSubmit={submit} noValidate>
          <label className="detail__label" htmlFor="rform-desc">
            Mô tả
          </label>
          <input
            id="rform-desc"
            className="cform__select"
            value={desc}
            placeholder="Rule này làm gì, viết cho người đọc chính sách"
            onChange={(e) => setDesc(e.target.value)}
          />
          <p className="detail__label rform__group">Kết quả · output</p>
          {ruleSet.outputs.map((f) => (
            <div key={f.name} className="rform__field">
              <label htmlFor={`rform-${f.name}`} className="rform__name">
                <code>{f.name}</code>
                <span>
                  {f.label}
                  {f.unit ? ` · ${f.unit}` : ''}
                </span>
              </label>
              <input
                id={`rform-${f.name}`}
                className={`cform__select cform__value${f.type === 'number' ? ' rform__num' : ''}`}
                value={outs[f.name] ?? ''}
                inputMode={f.type === 'number' ? 'decimal' : undefined}
                placeholder="— (để trống)"
                aria-invalid={errors[f.name] ? true : undefined}
                aria-describedby={errors[f.name] ? `rform-${f.name}-err` : undefined}
                onChange={(e) => setOuts((o) => ({ ...o, [f.name]: e.target.value }))}
              />
              {errors[f.name] && (
                <span id={`rform-${f.name}-err`} role="alert" className="rform__error">
                  {errors[f.name]}
                </span>
              )}
            </div>
          ))}
          {weighted && (
            <div className="rform__field">
              <label htmlFor="rform-weight" className="rform__name">
                <code>weight</code>
                <span>PRIORITY: weight cao hơn thắng</span>
              </label>
              <input
                id="rform-weight"
                className="cform__select cform__value rform__num"
                value={weight}
                inputMode="decimal"
                aria-invalid={errors.weight ? true : undefined}
                onChange={(e) => setWeight(e.target.value)}
              />
              {errors.weight && (
                <span role="alert" className="rform__error">
                  {errors.weight}
                </span>
              )}
            </div>
          )}
          <div className="cform__actions">
            <button type="submit" className="btn btn--primary">
              Áp dụng
            </button>
          </div>
        </form>
      ) : (
        <dl className="rform__read">
          {ruleSet.outputs.map((f) => (
            <div key={f.name}>
              <dt>
                <code>{f.name}</code>
              </dt>
              <dd>{formatScalar(rule.then[f.name] ?? null)}</dd>
            </div>
          ))}
          {weighted && (
            <div>
              <dt>
                <code>weight</code>
              </dt>
              <dd>{rule.weight ?? 0}</dd>
            </div>
          )}
        </dl>
      )}
    </section>
  );
}

function Overview({ graph: g, rule, ruleSet }: Props) {
  const tree = g.tree;
  const count = contactCount(tree);
  const parts = tree ? (tree.op === 'and' ? tree.args : [tree]) : [];
  const where = homes(tree, ruleSet.inputs);
  const inCells = parts.filter((_, i) => where[i] !== COMPOUND).reduce((n, p) => n + contactCount(p), 0);
  return (
    <section className="cform cform--overview">
      <p className="detail__label">Đọc thành câu</p>
      <p className="cform__sentence">
        {tree ? <>Khi {describeAst(tree)}</> : 'Luôn match: Rule không có điều kiện'}
        {' → '}
        {ruleSet.outputs.map((f) => `${f.name} = ${formatScalar(rule.then[f.name] ?? null)}`).join(', ')}
      </p>
      {count > 0 && (
        <dl className="inspect__counts cform__counts">
          <div>
            <dt>Điều kiện</dt>
            <dd>{count}</dd>
          </div>
          <div>
            <dt>Trong ô</dt>
            <dd>{inCells}</dd>
          </div>
          <div>
            <dt>Compound</dt>
            <dd>{count - inCells}</dd>
          </div>
        </dl>
      )}
      <p className="inspect__note">
        Dữ liệu đi từ trái sang phải: các node Điều kiện so sánh Fact, các node VÀ, HOẶC, KHÔNG gộp kết quả, và Rule match khi dây cuối cùng vào nó mang giá trị
        đúng.
      </p>
      {g.editable && (
        <ul className="rgraph-inspect__how">
          <li>Kéo một node từ thanh Thêm node ở đáy canvas, hoặc bấm để thêm.</li>
          <li>Kéo dây từ chấm bên phải của một node sang chấm bên trái của node khác.</li>
          <li>Thả dây ra chỗ trống để chọn node mới nối ngay vào đó.</li>
          <li>Chọn node rồi nhấn Delete để xoá; Enter để sửa.</li>
          <li>Bấm node Rule để sửa mô tả và output.</li>
        </ul>
      )}
      <p className="inspect__note">
        Điều kiện nằm trọn trong một cột vẫn là ô của Rules Table. Phần nối nhiều trường, hoặc dùng HOẶC, KHÔNG, là Compound Condition của Rule.
      </p>
    </section>
  );
}
