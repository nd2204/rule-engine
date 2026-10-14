import { PolicyPlate } from '../../components/HitPolicy';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, ChevronLeft, ChevronRight, Copy, GripVertical, Plus, RotateCcw, Trash2, Workflow, X } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import {
  OP_LABEL,
  cellHint,
  conditionReading,
  describeAst,
  describeCell,
  editText,
  formatScalar,
  isAnyCell,
  joinCell,
  opChoices,
  parseCell,
  parseNumber,
  sameCondition,
  splitCell,
  type OpChoice,
} from '../../domain/cell';
import type { AstNode, Cell, InputField, OutputField, Rule, RuleSet, Scalar, TestCaseResult } from '../../domain/types';
import type { RowDiff } from './diff';
import { Glide } from './Glide';

interface Props {
  ruleSet: RuleSet;
  editable: boolean;
  onChange: (next: RuleSet, summary: string) => void;
  results: TestCaseResult[] | null;
  selected: TestCaseResult | null;
  diff: RowDiff[] | null;
  newFields: Set<string>;
  expandedId: string | null;
  onExpand: (id: string | null) => void;
  /** Compare mode: bring a Rule that Latest has and the Draft lacks back into the Draft. */
  onRestore?: (rule: Rule) => void;
  /** Version the comparison is against, for the restore label. */
  latestNo?: number;
  /** Where a Rule's condition opens as a node graph. */
  circuitHref?: (ruleId: string) => string;
}

interface Edges {
  left: string[];
  right: string[];
  /** Distance of the pinned edges from the frame's left and right sides. */
  leftX: number;
  rightX: number;
}

const NO_EDGES: Edges = { left: [], right: [], leftX: 0, rightX: 0 };

const POLICY_ORDER_NOTE: Record<RuleSet['hitPolicy'], string> = {
  FIRST: 'Thứ tự quyết định: Rule match đầu tiên thắng',
  COLLECT: 'Thứ tự quyết định thứ tự danh sách output',
  PRIORITY: 'Weight quyết định, thứ tự hàng không ảnh hưởng',
  UNIQUE: 'Thứ tự không ảnh hưởng: tối đa một Rule được match',
};

export function RuleTable(props: Props) {
  const skipGlide = useRef(false);
  const { ruleSet, editable, onChange, results, selected, diff, newFields, expandedId, onExpand, onRestore, latestNo, circuitHref } = props;
  const reorderable = editable && !diff && (ruleSet.hitPolicy === 'FIRST' || ruleSet.hitPolicy === 'COLLECT');
  const showWeight = ruleSet.hitPolicy === 'PRIORITY';
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Outputs and the Match count are always pinned to the right edge while wide tables scroll, in every Decision.
  // The route number is always pinned on the left; the identity plate joins it only when conditions keep 320px,
  // about three cells: the conditions are what the author edits, so they get the width first.
  // End index 0 is the rightmost column (hit count), 1.. are outputs from the right.
  const tableRef = useRef<HTMLTableElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [endOffsets, setEndOffsets] = useState<number[]>([]);
  const [overflowing, setOverflowing] = useState(false);
  const [pinIdent, setPinIdent] = useState(true);
  const measure = useRef(() => {});
  measure.current = () => {
    const table = tableRef.current;
    const scroll = scrollRef.current;
    if (!table || !scroll) return;
    // `has-overflow` compacts outputs and descriptions, which narrows the table. Measured while compact, a table
    // that only overflows at full width would read as fitting, drop the class, overflow again and loop forever.
    // So overflow is judged at full width, and the rest is measured in the state that judgement leads to.
    const shown = scroll.className;
    scroll.classList.remove('has-overflow');
    const overflows = scroll.scrollWidth > scroll.clientWidth + 1;
    scroll.classList.toggle('has-overflow', overflows);
    const ths = Array.from(table.querySelectorAll<HTMLElement>('tr.rules__fields th[data-end]')).sort(
      (a, b) => Number(a.dataset.end) - Number(b.dataset.end),
    );
    let acc = 0;
    const offs = ths.map((th) => {
      const at = acc;
      acc += th.getBoundingClientRect().width;
      return Math.round(at);
    });
    setEndOffsets((prev) => (prev.length === offs.length && prev.every((v, i) => v === offs[i]) ? prev : offs));
    setOverflowing(overflows);
    // Keep the identity plate pinned only while enough room is left to read the conditions between the pinned edges.
    const fields = table.querySelectorAll<HTMLElement>('tr.rules__fields th');
    const leftW = (fields[0]?.getBoundingClientRect().width ?? 0) + (fields[1]?.getBoundingClientRect().width ?? 0);
    setPinIdent(scroll.clientWidth - leftW - acc >= 320);
    measureEdges.current();
    // React owns the class list; hand it back as rendered, the state above brings the change.
    scroll.className = shown;
  };
  // Condition columns squeezed out between the pinned edges, so the frame can say what it is hiding.
  const [edges, setEdges] = useState<Edges>(NO_EDGES);
  const measureEdges = useRef(() => {});
  measureEdges.current = () => {
    const table = tableRef.current;
    const scroll = scrollRef.current;
    if (!table || !scroll) return;
    const frame = scroll.getBoundingClientRect();
    const fieldRow = table.querySelectorAll<HTMLElement>('tr.rules__fields th');
    const pinnedLeft = [fieldRow[0], fieldRow[1]].filter((th) => th && getComputedStyle(th).position === 'sticky');
    const leftEdge = Math.max(frame.left, ...pinnedLeft.map((th) => th.getBoundingClientRect().right));
    const ends = Array.from(table.querySelectorAll<HTMLElement>('tr.rules__fields th[data-end]'));
    const rightEdge = Math.min(frame.right - (scroll.offsetWidth - scroll.clientWidth), ...ends.map((th) => th.getBoundingClientRect().left));
    const left: string[] = [];
    const right: string[] = [];
    table.querySelectorAll<HTMLElement>('tr.rules__fields th[data-field]').forEach((th) => {
      const b = th.getBoundingClientRect();
      const seen = Math.max(0, Math.min(b.right, rightEdge) - Math.max(b.left, leftEdge));
      if (seen >= b.width * 0.6) return;
      (b.left + b.width / 2 < (leftEdge + rightEdge) / 2 ? left : right).push(th.dataset.field!);
    });
    const next: Edges = { left, right, leftX: Math.round(leftEdge - frame.left), rightX: Math.round(frame.right - rightEdge) };
    setEdges((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
  };
  useLayoutEffect(() => measure.current());
  useEffect(() => {
    const ro = new ResizeObserver(() => measure.current());
    if (tableRef.current) ro.observe(tableRef.current);
    if (scrollRef.current) ro.observe(scrollRef.current);
    return () => ro.disconnect();
  }, []);

  // A focused cell never sits under the pinned columns (WCAG 2.4.11): it scrolls clear of both pinned edges.
  function keepFocusClear(e: React.FocusEvent<HTMLDivElement>) {
    const scroll = scrollRef.current;
    const td = (e.target as HTMLElement).closest('td, th');
    if (!scroll || !td || getComputedStyle(td).position === 'sticky') return;
    const frame = scroll.getBoundingClientRect();
    const b = td.getBoundingClientRect();
    const leftEdge = frame.left + edges.leftX;
    const rightEdge = frame.right - edges.rightX;
    const delta = b.left < leftEdge ? b.left - leftEdge - 8 : b.right > rightEdge ? Math.min(b.right - rightEdge + 8, b.left - leftEdge - 8) : 0;
    if (delta) scroll.scrollLeft += delta;
  }

  function reveal(field: string) {
    const scroll = scrollRef.current;
    const th = scroll?.querySelector<HTMLElement>(`tr.rules__fields th[data-field="${window.CSS.escape(field)}"]`);
    if (!scroll || !th) return;
    const frame = scroll.getBoundingClientRect();
    const b = th.getBoundingClientRect();
    const leftEdge = frame.left + edges.leftX;
    const rightEdge = frame.right - edges.rightX;
    const delta = b.left < leftEdge ? b.left - leftEdge - 12 : b.right > rightEdge ? b.right - rightEdge + 12 : 0;
    scroll.scrollBy({ left: delta, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
  // The opened Rule's row stays in view while its panel is open (vertical only; sideways position is the author's).
  useEffect(() => {
    const scroll = scrollRef.current;
    const row = expandedId ? scroll?.querySelector<HTMLElement>(`tr[data-rule="${window.CSS.escape(expandedId)}"]`) : null;
    if (!scroll || !row) return;
    const head = scroll.querySelector('thead')?.getBoundingClientRect().height ?? 0;
    const top = row.offsetTop;
    const bottom = top + row.offsetHeight;
    if (top - head < scroll.scrollTop) scroll.scrollTop = top - head;
    else if (bottom > scroll.scrollTop + scroll.clientHeight) scroll.scrollTop = bottom - scroll.clientHeight;
  }, [expandedId]);
  const endStyle = (i: number): CSSProperties | undefined =>
    endOffsets[i] === undefined ? undefined : { position: 'sticky', right: endOffsets[i] };
  const outEnd = (outputIndex: number) => 1 + (ruleSet.outputs.length - 1 - outputIndex);

  const hitCount = (ruleId: string) => results?.filter((r) => r.actual.matchedRuleIds.includes(ruleId)).length ?? null;
  const colCount = 2 + ruleSet.inputs.length + ruleSet.outputs.length + (showWeight ? 1 : 0) + 1;

  function updateRule(id: string, patch: (r: Rule) => Rule, summary: string) {
    onChange({ ...ruleSet, rules: ruleSet.rules.map((r) => (r.id === id ? patch(r) : r)) }, summary);
  }

  function onDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    // The dragged rows already sit where they land: this commit must not glide.
    skipGlide.current = true;
    setTimeout(() => {
      skipGlide.current = false;
    }, 50);
    const from = ruleSet.rules.findIndex((r) => r.id === e.active.id);
    const to = ruleSet.rules.findIndex((r) => r.id === e.over!.id);
    onChange({ ...ruleSet, rules: arrayMove(ruleSet.rules, from, to) }, `Chuyển ${String(e.active.id)} tới vị trí ${to + 1}`);
  }

  function addRule() {
    const rule = blankRule(ruleSet);
    onChange({ ...ruleSet, rules: [...ruleSet.rules, rule] }, `Thêm ${rule.id}`);
    onExpand(rule.id);
  }

  function duplicate(rule: Rule) {
    const used = new Set(ruleSet.rules.map((r) => r.id));
    let id = `${rule.id}-2`;
    for (let k = 3; used.has(id); k++) id = `${rule.id}-${k}`;
    const i = ruleSet.rules.findIndex((r) => r.id === rule.id);
    const rules = [...ruleSet.rules];
    rules.splice(i + 1, 0, { ...structuredClone(rule), id });
    onChange({ ...ruleSet, rules }, `Nhân bản ${rule.id} thành ${id}`);
  }

  function remove(rule: Rule) {
    onChange({ ...ruleSet, rules: ruleSet.rules.filter((r) => r.id !== rule.id) }, `Xoá ${rule.id}`);
    if (expandedId === rule.id) onExpand(null);
  }

  // Rules the selected Test Case missed only on columns that are out of view: the reason sits off-screen.
  const hiddenSet = new Set([...edges.left, ...edges.right]);
  const hiddenReasons: { ruleId: string; field: string }[] = [];
  if (selected && hiddenSet.size) {
    for (const rule of ruleSet.rules) {
      if (selected.actual.matchedRuleIds.includes(rule.id)) continue;
      const misses = Object.entries(selected.actual.cellOutcomes[rule.id] ?? {})
        .filter(([, v]) => v === false)
        .map(([k]) => k);
      if (misses.length && misses.every((f) => hiddenSet.has(f))) hiddenReasons.push({ ruleId: rule.id, field: misses[0] });
    }
  }

  const expandedRule = ruleSet.rules.find((r) => r.id === expandedId) ?? null;
  const expandedIndex = expandedRule ? ruleSet.rules.indexOf(expandedRule) : -1;
  const rows: RowDiff[] = diff ?? ruleSet.rules.map((rule) => ({ kind: 'same' as const, rule, changed: new Set<string>() }));
  let position = 0;

  const table = (
    <table ref={tableRef} className="rules" aria-describedby="rules-order-note">
      <colgroup>
        <col className="rules__col-order" />
        <col className="rules__col-rule" />
        {ruleSet.inputs.map((f) => (
          <col key={f.name} className={f.type === 'list' ? 'rules__col-wide' : undefined} />
        ))}
        {showWeight && <col className="rules__col-weight" />}
        {ruleSet.outputs.map((f) => (
          <col key={f.name} />
        ))}
        <col className="rules__col-hits" />
      </colgroup>
      <thead>
        <tr className="rules__groups">
          <th colSpan={2} scope="colgroup" className="rules__group rules__group--rule">
            Rule
          </th>
          <th colSpan={ruleSet.inputs.length} scope="colgroup" className="rules__group">
            Điều kiện · input
          </th>
          {showWeight && <th className="rules__group rules__group--weight" aria-hidden="true" />}
          <th colSpan={ruleSet.outputs.length} scope="colgroup" className="rules__group rules__group--out is-end" style={endStyle(1)}>
            Kết quả · output
          </th>
          <th scope="col" className="rules__group rules__group--tail is-end" style={endStyle(0)}>
            Test Case
          </th>
        </tr>
        <tr className="rules__fields">
          <th scope="col" className="rules__th-order">
            <span className="visually-hidden">Thứ tự</span>#
          </th>
          <th scope="col">Mã · mô tả</th>
          {ruleSet.inputs.map((f) => (
            <FieldHeader key={f.name} field={f} isNew={newFields.has(f.name)} input />
          ))}
          {showWeight && (
            <th scope="col" className="rules__num">
              Weight
            </th>
          )}
          {ruleSet.outputs.map((f, i) => (
            <FieldHeader key={f.name} field={f} out first={i === 0} end={outEnd(i)} style={endStyle(outEnd(i))} />
          ))}
          <th scope="col" className="rules__field rules__num rules__hits-head is-end" data-end={0} style={endStyle(0)}>
            <span className="rules__field-name">Match</span>
            <span className="rules__field-meta">số TC khớp</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && (
          <tr>
            <td colSpan={colCount} className="rules__empty">
              <p className="rules__empty-title">Draft này chưa có Rule nào.</p>
              <p>
                Mỗi hàng là một Rule: điền điều kiện vào các cột input, kết quả vào các cột output. Ô <code>-</code> nghĩa
                là chấp nhận mọi giá trị.
              </p>
              {editable && (
                <button type="button" className="btn btn--primary" onClick={addRule}>
                  <Plus size={16} aria-hidden="true" /> Thêm Rule đầu tiên
                </button>
              )}
            </td>
          </tr>
        )}
        {rows.map((row) => {
          const removed = row.kind === 'removed';
          const index = removed ? null : position++;
          return (
            <RuleRow
              key={`${row.kind}-${row.rule.id}`}
              row={row}
              index={index}
              ruleSet={ruleSet}
              editable={editable && !diff}
              reorderable={reorderable}
              showWeight={showWeight}
              hits={removed ? null : hitCount(row.rule.id)}
              endStyle={endStyle}
              outEnd={outEnd}
              selected={selected}
              expanded={expandedId === row.rule.id}
              onToggle={() => onExpand(expandedId === row.rule.id ? null : row.rule.id)}
              onUpdate={(patch, summary) => updateRule(row.rule.id, patch, summary)}
              onDuplicate={() => duplicate(row.rule)}
              onRemove={() => remove(row.rule)}
              hidden={hiddenSet}
              onRestore={onRestore && row.kind === 'removed' ? () => onRestore(row.rule) : undefined}
              latestNo={latestNo}
              circuitHref={row.kind === 'removed' ? undefined : circuitHref?.(row.rule.id)}
            />
          );
        })}
      </tbody>
    </table>
  );

  return (
    <Glide skip={skipGlide}>
      <div className="rules-wrap">
        <p id="rules-order-note" className="rules-note">
          <PolicyPlate policy={ruleSet.hitPolicy} />
          {POLICY_ORDER_NOTE[ruleSet.hitPolicy]}
          {reorderable && <span className="rules-note__hint">Kéo tay nắm, hoặc focus tay nắm rồi dùng Space và phím mũi tên.</span>}
        </p>
        <div className="rules-frame">
          {(['left', 'right'] as const).map((side) => {
            const fields = edges[side];
            if (!fields.length) return null;
            const reasons = hiddenReasons.filter((r) => fields.includes(r.field));
            const target = reasons[0]?.field ?? (side === 'right' ? fields[0] : fields[fields.length - 1]);
            const label = reasons.length
              ? `${reasons.map((r) => r.ruleId).join(', ')} trượt ở ${[...new Set(reasons.map((r) => r.field))].join(', ')}`
              : `${fields.length} cột ẩn: ${fields.join(', ')}`;
            return (
              <button
                key={side}
                type="button"
                className={`rules-edge rules-edge--${side}${reasons.length ? ' is-reason' : ''}`}
                style={side === 'left' ? { left: edges.leftX } : { right: edges.rightX }}
                onClick={() => reveal(target)}
                title={`Cuộn tới ${target}`}
              >
                {side === 'left' && <ChevronLeft size={14} aria-hidden="true" />}
                {reasons.length > 0 && <X size={12} strokeWidth={3} aria-hidden="true" className="rules-edge__miss" />}
                <span>{label}</span>
                {side === 'right' && <ChevronRight size={14} aria-hidden="true" />}
              </button>
            );
          })}
          <div
            ref={scrollRef}
            className={`rules-scroll${overflowing ? ' has-overflow' : ''}${pinIdent ? ' pins-ident' : ''}`}
            onScroll={() => measureEdges.current()}
            onFocus={keepFocusClear}
          >
            {reorderable ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={onDragEnd}
                accessibility={{
                  screenReaderInstructions: {
                    draggable: 'Nhấn Space để nhấc Rule, dùng phím mũi tên để di chuyển, Space để thả, Escape để huỷ.',
                  },
                  announcements: {
                    onDragStart: ({ active }) => `Đã nhấc ${String(active.id)}.`,
                    onDragOver: ({ active, over }) =>
                      over ? `${String(active.id)} đang ở vị trí của ${String(over.id)}.` : `${String(active.id)} ở ngoài bảng.`,
                    onDragEnd: ({ active, over }) =>
                      over ? `Đã thả ${String(active.id)} vào vị trí của ${String(over.id)}.` : `Đã thả ${String(active.id)}.`,
                    onDragCancel: ({ active }) => `Huỷ di chuyển ${String(active.id)}.`,
                  },
                }}
              >
                <SortableContext items={ruleSet.rules.map((r) => r.id)} strategy={verticalListSortingStrategy}>
                  {table}
                </SortableContext>
              </DndContext>
            ) : (
              table
            )}
          </div>
        </div>
        {expandedRule && (
          <RulePanel
            rule={expandedRule}
            index={expandedIndex}
            count={ruleSet.rules.length}
            ruleSet={ruleSet}
            editable={editable && !diff}
            onUpdate={(patch, summary) => updateRule(expandedRule.id, patch, summary)}
            onStep={(d) => onExpand(ruleSet.rules[expandedIndex + d]?.id ?? expandedRule.id)}
            circuitHref={circuitHref?.(expandedRule.id)}
            onClose={() => {
              document.querySelector<HTMLElement>(`[aria-controls="${PANEL_ID}"]`)?.focus();
              onExpand(null);
            }}
          />
        )}
        {editable && !diff && rows.length > 0 && (
          <button type="button" className="btn btn--ghost rules-add" onClick={addRule}>
            <Plus size={16} aria-hidden="true" /> Thêm Rule
          </button>
        )}
      </div>
    </Glide>
  );
}

function FieldHeader(props: {
  field: InputField | OutputField;
  isNew?: boolean;
  input?: boolean;
  out?: boolean;
  first?: boolean;
  end?: number;
  style?: CSSProperties;
}) {
  const { field, isNew, input, out, first, end, style } = props;
  const required = 'required' in field && field.required;
  return (
    <th
      scope="col"
      className={`rules__field${out ? ' is-out is-end' : ''}${first ? ' is-first-out' : ''}`}
      data-end={end}
      data-field={input ? field.name : undefined}
      style={style}
    >
      <span className="rules__field-name">{field.name}</span>
      <span className="rules__field-meta">
        {field.label}
        {field.unit ? ` · ${field.unit}` : ''}
        {required && (
          <abbr className="rules__req" title="Bắt buộc">
            *
          </abbr>
        )}
        {isNew && <span className="tag tag--caution">mới</span>}
      </span>
    </th>
  );
}

// ---------------- row ----------------

interface RowProps {
  row: RowDiff;
  index: number | null;
  ruleSet: RuleSet;
  editable: boolean;
  reorderable: boolean;
  showWeight: boolean;
  hits: number | null;
  endStyle: (i: number) => CSSProperties | undefined;
  outEnd: (outputIndex: number) => number;
  selected: TestCaseResult | null;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (patch: (r: Rule) => Rule, summary: string) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  /** Condition columns out of view: their conditions are read out in the identity cell. */
  hidden: Set<string>;
  onRestore?: () => void;
  latestNo?: number;
  circuitHref?: string;
}

function RuleRow(p: RowProps) {
  const { row, index, ruleSet, editable, reorderable, showWeight, hits, selected, expanded } = p;
  const rule = row.rule;
  const sortable = useSortable({ id: rule.id, disabled: !reorderable || row.kind === 'removed' });
  const style = sortable.transform
    ? { transform: CSS.Translate.toString({ ...sortable.transform, x: 0 }), transition: sortable.transition }
    : { transition: sortable.transition };

  const matched = selected?.actual.matchedRuleIds.includes(rule.id) ?? false;
  const winner = selected?.actual.winnerRuleIds.includes(rule.id) ?? false;
  const conflict = selected?.actual.error?.ruleIds?.includes(rule.id) ?? false;
  const outcomes = selected?.actual.cellOutcomes[rule.id];

  const classes = ['rule'];
  if (row.kind !== 'same') classes.push(`rule--${row.kind}`);
  if (selected && row.kind !== 'removed') {
    if (conflict) classes.push('rule--conflict');
    else if (winner) classes.push('rule--winner');
    else if (matched) classes.push('rule--lit');
    else classes.push('rule--context');
  }
  if (sortable.isDragging) classes.push('is-dragging');
  if (expanded) classes.push('is-expanded');

  const moved = row.kind !== 'removed' && row.kind !== 'added' && row.prevIndex !== undefined && index !== null && row.prevIndex !== index;

  let verdict: { label: string; tone: string } | null = null;
  if (selected && row.kind !== 'removed') {
    if (conflict) verdict = { label: 'xung đột', tone: 'stop' };
    else if (winner) verdict = { label: ruleSet.hitPolicy === 'COLLECT' ? 'vào output' : 'thắng', tone: 'clear' };
    else if (matched) verdict = { label: 'match, không thắng', tone: 'neutral' };
  }

  return (
    <tr ref={sortable.setNodeRef} style={style} className={classes.join(' ')} data-rule={rule.id}>
      <td className="rule__order">
        {reorderable ? (
          <button
            type="button"
            className="rule__handle"
            aria-label={`Kéo để đổi thứ tự ${rule.id}`}
            {...sortable.attributes}
            {...sortable.listeners}
          >
            <GripVertical size={14} aria-hidden="true" />
          </button>
        ) : (
          <span className="rule__handle-spacer" aria-hidden="true" />
        )}
        <span className="rule__index">{index === null ? '–' : index + 1}</span>
      </td>
      <td className="rule__ident">
        <span className="rule__line">
          <button type="button" className="rule__toggle" aria-expanded={expanded} aria-controls={expanded ? PANEL_ID : undefined} onClick={p.onToggle} title="Mở trong bảng bên">
            <span className="rule__id">{rule.id}</span>
          </button>
          <span className="rule__actions">
            {p.circuitHref && (
              <a className="icon-btn rule__circuit" href={p.circuitHref} aria-label={`Mở trình sửa node của ${rule.id}`} title="Mở trình sửa node">
                <Workflow size={14} aria-hidden="true" />
              </a>
            )}
            {editable && (
              <>
                {p.circuitHref && <span className="rule__sep" aria-hidden="true" />}
                <button type="button" className="icon-btn" aria-label={`Nhân bản ${rule.id}`} title="Nhân bản" onClick={p.onDuplicate}>
                  <Copy size={14} aria-hidden="true" />
                </button>
                <button type="button" className="icon-btn icon-btn--danger" aria-label={`Xoá ${rule.id}`} title="Xoá" onClick={p.onRemove}>
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </>
            )}
          </span>
        </span>
        <span className="rule__desc" title={rule.description || undefined}>
          {rule.description || <em>Chưa có mô tả</em>}
        </span>
        {rule.condition && (
          <CompoundLine
            rule={rule}
            href={p.circuitHref}
            outcome={selected?.actual.conditionOutcomes?.[rule.id]}
            changed={row.kind === 'changed' && row.changed.has('condition')}
          />
        )}
        {(() => {
          const off = ruleSet.inputs
            .filter((f) => p.hidden.has(f.name))
            .map((f) => ({ f, text: conditionReading(rule.when[f.name], f), miss: outcomes?.[f.name] === false }))
            .filter((c) => c.text);
          if (!off.length) return null;
          return (
            <span className="rule__off" title="Điều kiện ở các cột đang khuất">
              <span className="rule__off-count">+{off.length}</span>
              {off.map((c, i) => (
                <span key={c.f.name} className={c.miss ? 'is-miss' : undefined}>
                  {c.miss && <X size={10} strokeWidth={3} aria-label="sai" />}
                  {c.text}
                  {i < off.length - 1 ? ', ' : ''}
                </span>
              ))}
            </span>
          );
        })()}
        {p.onRestore && (
          <button type="button" className="btn btn--secondary rule__restore" onClick={p.onRestore}>
            <RotateCcw size={14} aria-hidden="true" /> Khôi phục vào Draft
          </button>
        )}
        <span className="rule__tags">
          {row.kind === 'added' && <span className="tag tag--clear">mới</span>}
          {row.kind === 'removed' && <span className="tag tag--stop">đã xoá</span>}
          {row.kind === 'changed' && <span className="tag tag--caution">đã sửa</span>}
          {moved && <span className="tag">từ #{row.prevIndex! + 1}</span>}
          {verdict && <span className={`tag tag--${verdict.tone}`}>{verdict.label}</span>}
        </span>
      </td>
      {ruleSet.inputs.map((f) => (
        <ConditionCell
          key={f.name}
          field={f}
          cell={rule.when[f.name]}
          prev={row.kind === 'changed' && row.changed.has(f.name) ? (row.prev?.when[f.name] ?? { kind: 'expr', text: '-' }) : undefined}
          outcome={outcomes ? outcomes[f.name] : undefined}
          editable={editable && f.type !== 'list'}
          onOpenTree={p.onToggle}
          onCommit={(text) =>
            p.onUpdate((r) => ({ ...r, when: { ...r.when, [f.name]: { kind: 'expr', text } } }), `${rule.id}.${f.name} = ${text || '-'}`)
          }
        />
      ))}
      {showWeight && (
        <ValueCell
          field={{ name: 'weight', type: 'number', label: 'Weight' }}
          value={rule.weight ?? 0}
          prev={row.kind === 'changed' && row.changed.has('weight') ? (row.prev?.weight ?? 0) : undefined}
          editable={editable}
          numeric
          onCommit={(v) => p.onUpdate((r) => ({ ...r, weight: typeof v === 'number' ? v : 0 }), `${rule.id}.weight = ${v}`)}
        />
      )}
      {ruleSet.outputs.map((f, i) => (
        <ValueCell
          key={f.name}
          field={f}
          first={i === 0}
          style={p.endStyle(p.outEnd(i))}
          value={rule.then[f.name] ?? null}
          prev={row.kind === 'changed' && row.changed.has(f.name) ? (row.prev?.then[f.name] ?? null) : undefined}
          editable={editable}
          numeric={f.type === 'number'}
          onCommit={(v) => p.onUpdate((r) => ({ ...r, then: { ...r.then, [f.name]: v } }), `${rule.id}.${f.name} = ${formatScalar(v)}`)}
        />
      ))}
      <td className={`rules__num rule__hits is-end${hits === 0 ? ' is-zero' : ''}`} style={p.endStyle(0)}>
        <span className="cell__static">
          <span className="cell__value">{hits === null ? '' : hits}</span>
        </span>
      </td>
    </tr>
  );
}

/** The Compound Condition under a Rule's description: the part of its condition no column holds. */
function CompoundLine({ rule, href, outcome, changed }: { rule: Rule; href?: string; outcome: boolean | undefined; changed: boolean }) {
  const text = describeAst(rule.condition!);
  const body = (
    <>
      <span className="rule__compound-tag">Compound</span>
      {outcome === false && <X size={10} strokeWidth={3} aria-label="sai" />}
      {outcome === true && <Check size={10} strokeWidth={3} aria-label="đúng" />}
      <span className="rule__compound-text">{text}</span>
    </>
  );
  const cls = `rule__compound${outcome === false ? ' is-miss' : outcome === true ? ' is-hit' : ''}${changed ? ' is-changed' : ''}`;
  return href ? (
    <a className={cls} href={href} title={`Compound Condition: ${text}. Mở trình sửa node để sửa.`}>
      {body}
    </a>
  ) : (
    <span className={cls} title={`Compound Condition: ${text}`}>
      {body}
    </span>
  );
}

// ---------------- cells ----------------

function Outcome({ value }: { value: boolean | null | undefined }) {
  if (value === undefined || value === null) return null;
  return value ? (
    <Check size={12} strokeWidth={3} className="cell__outcome cell__outcome--hit" aria-label="đúng" />
  ) : (
    <X size={12} strokeWidth={3} className="cell__outcome cell__outcome--miss" aria-label="sai" />
  );
}

function ConditionCell(props: {
  field: InputField;
  cell: Cell | undefined;
  prev?: Cell;
  outcome: boolean | null | undefined;
  editable: boolean;
  onCommit: (text: string) => void;
  onOpenTree: () => void;
}) {
  const { field, cell, prev, outcome, editable } = props;
  const [editing, setEditing] = useState(false);
  const stored = cell?.kind === 'expr' ? cell.text : '-';
  // The editor opens on the table's own reading (≥ 1.000.000), not the stored text (>= 1000000).
  const initial = editText(cell, field);
  const [draft, setDraft] = useState(initial);
  const btnRef = useRef<HTMLButtonElement>(null);
  const refocus = useRef(false);
  useEffect(() => {
    if (!editing && refocus.current) {
      refocus.current = false;
      btnRef.current?.focus();
    }
  }, [editing]);
  // The operator a bare typed value inherits: the cell's own, until the author picks or types another.
  const [stickyOp, setStickyOp] = useState<OpChoice>('==');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const uid = useRef(Math.random().toString(36).slice(2)).current;
  const errorId = `err-${field.name}-${uid}`;
  const tipId = `tip-${field.name}-${uid}`;

  useEffect(() => {
    if (!editing) return;
    inputRef.current?.select();
    tipRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [editing]);

  const any = isAnyCell(cell);
  const text = describeCell(cell, field);
  const outcomeClass = outcome === false ? ' is-miss' : outcome === true ? ' is-hit' : '';

  const split = splitCell(draft);
  const keepsOp = split.op === null && stickyOp !== '==' && stickyOp !== 'any' && stickyOp !== 'range';
  const effective = keepsOp ? joinCell(stickyOp, split.value) : draft.trim() === '' ? '-' : draft.trim();
  const shownOp: OpChoice = split.op ?? stickyOp;
  const parsed = parseCell(effective, field);
  const preview = parsed.ok ? (describeCell({ kind: 'expr', text: effective }, field) ?? 'bất kỳ') : null;

  function open() {
    setDraft(initial);
    setStickyOp(splitCell(initial).op ?? '==');
    setError(null);
    setEditing(true);
  }

  function commit() {
    if (!parsed.ok) {
      setError(parsed.error);
      return false;
    }
    setError(null);
    setEditing(false);
    if (!sameCondition(effective, stored, field)) props.onCommit(effective);
    return true;
  }

  function pickOp(op: OpChoice) {
    setError(null);
    setStickyOp(op);
    // An operator typed into the text gives way to the picked one; a bare value simply inherits it.
    if (split.op !== null || op === 'any' || op === 'range') setDraft(joinCell(op, split.value));
    requestAnimationFrame(() => {
      const input = inputRef.current;
      if (!input) return;
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    });
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      refocus.current = true;
      if (!commit()) refocus.current = false;
    } else if (e.key === 'Escape') {
      refocus.current = true;
      setDraft(initial);
      setError(null);
      setEditing(false);
    }
  }

  if (editing) {
    return (
      <td
        className={`cell cell--editing${error ? ' has-error' : ''}`}
        onBlur={(e) => {
          // Moving between the operator picker and the text stays inside the editor.
          if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
          commit();
        }}
      >
        <div className="cell-editor">
          <select
            className="cell-editor__op"
            aria-label={`Toán tử cho ${field.name}`}
            value={shownOp}
            onChange={(e) => pickOp(e.target.value as OpChoice)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                refocus.current = true;
                setDraft(initial);
                setEditing(false);
              }
            }}
          >
            {opChoices(field).map((op) => (
              <option key={op} value={op}>
                {OP_LABEL[op]}
              </option>
            ))}
          </select>
          <input
            ref={inputRef}
            className="cell__input"
            value={draft}
            aria-label={`Điều kiện ${field.name}`}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${errorId} ${tipId}` : tipId}
            spellCheck={false}
            onChange={(e) => {
              setDraft(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={onKey}
          />
        </div>
        <div ref={tipRef} className="cell-editor__tip" id={tipId}>
          {error ? (
            <span id={errorId} role="alert" className="cell__error">
              {error}
            </span>
          ) : preview !== null ? (
            <span className="cell-editor__preview">
              {keepsOp ? `Giữ toán tử ${OP_LABEL[stickyOp]}, lưu thành ` : 'Lưu thành '}
              <code>{preview}</code>
            </span>
          ) : null}
          <span className="cell-editor__hint">{cellHint(field)}</span>
        </div>
      </td>
    );
  }

  const content =
    cell?.kind === 'ast' ? (
      <span className="cell__tree">{describeAst(cell.ast, field.name)}</span>
    ) : any ? (
      <span className="cell__any">-</span>
    ) : (
      <span className="cell__expr">{text}</span>
    );

  return (
    <td className={`cell${any ? ' is-any' : ''}${outcomeClass}${prev ? ' is-changed' : ''}`}>
      {editable ? (
        <button
          ref={btnRef}
          type="button"
          className="cell__btn"
          aria-label={`Sửa điều kiện ${field.name}: ${any ? 'bất kỳ' : text}`}
          onClick={open}
        >
          {content}
          <Outcome value={outcome} />
        </button>
      ) : cell?.kind === 'ast' ? (
        <button type="button" className="cell__btn" onClick={props.onOpenTree} aria-label={`Xem cây điều kiện ${field.name}`}>
          {content}
          <Outcome value={outcome} />
        </button>
      ) : (
        <span className="cell__static">
          {content}
          <Outcome value={outcome} />
        </span>
      )}
      {prev && <span className="cell__prev">{describeCell(prev, field) ?? '-'}</span>}
    </td>
  );
}

export function parseValue(raw: string, numeric: boolean): Scalar | null | { error: string } {
  const s = raw.trim();
  if (s === '' || s === '—' || s === '-') return null;
  if (!numeric) return s;
  const n = parseNumber(s);
  return n === null ? { error: `“${s}” không phải số` } : n;
}

function ValueCell(props: {
  field: OutputField;
  value: Scalar | null;
  prev?: Scalar | null;
  editable: boolean;
  numeric: boolean;
  first?: boolean;
  style?: CSSProperties;
  onCommit: (v: Scalar | null) => void;
}) {
  const { field, value, prev, editable, numeric, first, style } = props;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const refocus = useRef(false);

  useEffect(() => {
    if (editing) inputRef.current?.select();
    else if (refocus.current) {
      refocus.current = false;
      btnRef.current?.focus();
    }
  }, [editing]);

  function commit() {
    const v = parseValue(draft, numeric);
    if (v !== null && typeof v === 'object') {
      setError(v.error);
      return;
    }
    setError(null);
    setEditing(false);
    if (v !== value) props.onCommit(v);
  }

  const cls = `cell cell--out${numeric ? ' rules__num' : ''}${first ? ' is-first-out' : ''}${style ? ' is-end' : ''}${prev !== undefined ? ' is-changed' : ''}`;

  if (editing) {
    return (
      <td className={`${cls} cell--editing${error ? ' has-error' : ''}`} style={style}>
        <input
          ref={inputRef}
          className="cell__input"
          value={draft}
          inputMode={numeric ? 'decimal' : undefined}
          aria-label={`Giá trị ${field.name}`}
          aria-invalid={error ? true : undefined}
          onChange={(e) => {
            setDraft(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              refocus.current = true;
              commit();
            } else if (e.key === 'Escape') {
              refocus.current = true;
              setError(null);
              setEditing(false);
            }
          }}
          onBlur={commit}
        />
        {error && (
          <span role="alert" className="cell__error">
            {error}
          </span>
        )}
      </td>
    );
  }

  const shown =
    value === null ? (
      <span className="cell__any">—</span>
    ) : (
      <span className="cell__value" title={typeof value === 'string' ? value : undefined}>
        {formatScalar(value)}
      </span>
    );
  return (
    <td className={cls} style={style}>
      {editable ? (
        <button
          ref={btnRef}
          type="button"
          className="cell__btn"
          aria-label={`Sửa ${field.name}: ${value === null ? 'trống' : formatScalar(value)}`}
          onClick={() => {
            setDraft(value === null ? '' : String(value));
            setEditing(true);
          }}
        >
          {shown}
        </button>
      ) : (
        <span className="cell__static">{shown}</span>
      )}
      {prev !== undefined && <span className="cell__prev">{formatScalar(prev)}</span>}
    </td>
  );
}

// ---------------- expanded rule ----------------

function TreeView({ node }: { node: AstNode }) {
  switch (node.op) {
    case 'and':
    case 'or':
      return (
        <div className="tree__group">
          <span className="tree__op">{node.op}</span>
          <ul>
            {node.args.map((a, i) => (
              <li key={i}>
                <TreeView node={a} />
              </li>
            ))}
          </ul>
        </div>
      );
    case 'not':
      return (
        <div className="tree__group">
          <span className="tree__op">not</span>
          <ul>
            <li>
              <TreeView node={node.arg} />
            </li>
          </ul>
        </div>
      );
    case 'some':
    case 'all':
    case 'none':
      return (
        <div className="tree__group">
          <span className="tree__op">
            {node.op} <code>{node.path}</code>
          </span>
          <ul>
            <li>
              <TreeView node={node.where} />
            </li>
          </ul>
        </div>
      );
    default:
      return <code className="tree__leaf">{describeAst(node)}</code>;
  }
}

function AstEditor({ field, cell, editable, onCommit }: { field: InputField; cell: Cell | undefined; editable: boolean; onCommit: (c: Cell) => void }) {
  const initial = cell?.kind === 'ast' ? JSON.stringify(cell.ast, null, 2) : '';
  const [text, setText] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setText(initial), [initial]);

  function apply() {
    if (text.trim() === '') {
      onCommit({ kind: 'expr', text: '-' });
      return;
    }
    try {
      const ast = JSON.parse(text) as AstNode;
      if (!ast || typeof ast !== 'object' || !('op' in ast)) throw new Error('JSON AST cần trường "op"');
      setError(null);
      onCommit({ kind: 'ast', ast });
    } catch (e) {
      setError(e instanceof SyntaxError ? 'JSON không hợp lệ' : (e as Error).message);
    }
  }

  return (
    <div className="detail__ast">
      <div className="detail__ast-head">
        <span className="detail__field">{field.name}</span>
        <span className="detail__field-meta">
          {field.label} · danh sách
          {field.itemFields && <> · trường của mỗi phần tử: {field.itemFields.map((f) => f.name).join(', ')}</>}
        </span>
      </div>
      {cell?.kind === 'ast' ? (
        <div className="tree">
          <TreeView node={cell.ast} />
        </div>
      ) : (
        <p className="detail__muted">Bất kỳ: chưa có điều kiện trên danh sách.</p>
      )}
      {editable && (
        <>
          <label className="detail__label" htmlFor={`ast-${field.name}`}>
            JSON AST (some / all / none)
          </label>
          <textarea
            id={`ast-${field.name}`}
            className="detail__json"
            rows={Math.min(14, Math.max(5, text.split('\n').length))}
            value={text}
            spellCheck={false}
            aria-invalid={error ? true : undefined}
            onChange={(e) => setText(e.target.value)}
          />
          {error && (
            <p role="alert" className="detail__error">
              {error}
            </p>
          )}
          <div className="detail__row">
            <button type="button" className="btn btn--secondary" onClick={apply} disabled={text === initial}>
              Áp dụng JSON
            </button>
            <span className="detail__muted">Hoặc soạn bằng kéo thả trong trình sửa node.</span>
          </div>
        </>
      )}
    </div>
  );
}

const PANEL_ID = 'rule-panel';

// The opened Rule floats over the Test Case strip, so the table never shrinks and stays live beside it.
function RulePanel(props: {
  rule: Rule;
  index: number;
  count: number;
  ruleSet: RuleSet;
  editable: boolean;
  onUpdate: (patch: (r: Rule) => Rule, summary: string) => void;
  onStep: (delta: -1 | 1) => void;
  onClose: () => void;
  circuitHref?: string;
}) {
  const { rule, index, count, ruleSet, editable } = props;
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [desc, setDesc] = useState(rule.description);
  useEffect(() => setDesc(rule.description), [rule.id, rule.description]);
  // Focus lands in the panel once, when it opens; stepping between Rules keeps focus where it is.
  useEffect(() => titleRef.current?.focus(), []);
  const listFields = ruleSet.inputs.filter((f) => f.type === 'list');
  const reading = ruleSet.inputs
    .map((f) => {
      const t = describeCell(rule.when[f.name], f);
      if (!t) return null;
      return rule.when[f.name]?.kind === 'ast' ? t : `${f.name} ${/^[=≠<>≥≤[(]|^in |^not in /.test(t) ? t : `= ${t}`}`;
    })
    .filter(Boolean)
    .concat(rule.condition ? [describeAst(rule.condition)] : []);

  return (
    <section
      id={PANEL_ID}
      className="rule-panel"
      role="dialog"
      aria-modal="false"
      aria-labelledby="rule-panel-title"
      onKeyDown={(e) => {
        if (e.key !== 'Escape') return;
        // Esc in a text area only leaves the editor; unapplied JSON stays put. A second Esc closes the panel.
        if (e.target instanceof HTMLTextAreaElement) {
          e.preventDefault();
          titleRef.current?.focus();
          return;
        }
        props.onClose();
      }}
    >
      <header className="rule-panel__head">
        <span className="rule__index">{index + 1}</span>
        <h2 id="rule-panel-title" ref={titleRef} tabIndex={-1} className="rule-panel__title">
          {rule.id}
        </h2>
        <span className="rule-panel__nav">
          <button type="button" className="icon-btn" aria-label="Rule trước" title="Rule trước" disabled={index <= 0} onClick={() => props.onStep(-1)}>
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <button type="button" className="icon-btn" aria-label="Rule sau" title="Rule sau" disabled={index >= count - 1} onClick={() => props.onStep(1)}>
            <ChevronRight size={16} aria-hidden="true" />
          </button>
          <button type="button" className="icon-btn" aria-label={`Đóng chi tiết ${rule.id}`} title="Đóng (Esc)" onClick={props.onClose}>
            <X size={16} aria-hidden="true" />
          </button>
        </span>
      </header>
      <div className="detail">
        <div className="detail__main">
          <p className="detail__label">Đọc thành câu</p>
          <p className="detail__sentence">
            {reading.length ? <>Khi {reading.join(' và ')}</> : 'Luôn match (mọi ô đều là bất kỳ)'}
            {' → '}
            {ruleSet.outputs.map((f) => `${f.name} = ${formatScalar(rule.then[f.name] ?? null)}`).join(', ')}
          </p>
          {props.circuitHref && (
            <a className="btn btn--secondary rule-panel__circuit" href={props.circuitHref}>
              <Workflow size={15} aria-hidden="true" /> Mở trình sửa node
            </a>
          )}
          {editable ? (
            <>
              <label className="detail__label" htmlFor={`desc-${rule.id}`}>
                Mô tả
              </label>
              <input
                id={`desc-${rule.id}`}
                className="detail__input"
                value={desc}
                placeholder="Rule này làm gì, viết cho người đọc chính sách"
                onChange={(e) => setDesc(e.target.value)}
                onBlur={() => desc !== rule.description && props.onUpdate((r) => ({ ...r, description: desc }), `Sửa mô tả ${rule.id}`)}
              />
            </>
          ) : (
            <>
              <p className="detail__label">Mô tả</p>
              <p className="detail__desc">{rule.description}</p>
            </>
          )}
        </div>
        {listFields.map((f) => (
          <AstEditor
            key={`${rule.id}-${f.name}`}
            field={f}
            cell={rule.when[f.name]}
            editable={editable}
            onCommit={(c) => props.onUpdate((r) => ({ ...r, when: { ...r.when, [f.name]: c } }), `Sửa cây điều kiện ${rule.id}.${f.name}`)}
          />
        ))}
      </div>
    </section>
  );
}

/** A new Rule at the end of the Rule Set: every condition "-" (any value), every output empty. */
export function blankRule(ruleSet: RuleSet): Rule {
  const used = new Set(ruleSet.rules.map((r) => r.id));
  let n = ruleSet.rules.length + 1;
  while (used.has(`R${n}`)) n++;
  return {
    id: `R${n}`,
    description: '',
    when: Object.fromEntries(ruleSet.inputs.map((f) => [f.name, { kind: 'expr', text: '-' } as Cell])),
    then: Object.fromEntries(ruleSet.outputs.map((f) => [f.name, null])),
    ...(ruleSet.hitPolicy === 'PRIORITY' ? { weight: 0 } : {}),
  };
}
