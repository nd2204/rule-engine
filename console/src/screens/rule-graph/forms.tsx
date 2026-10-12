import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode, type RefObject } from 'react';
import { OP_LABEL, describeAst, formatScalar, joinCell, opChoices, parseCell, type OpChoice } from '../../domain/cell';
import { scalarText } from '../../domain/compound';
import type { AstNode, InputField, Scalar } from '../../domain/types';
import type { CompareNode, Quant } from './graph';

// The forms of the node inspector: one comparison (field, operator, value, in the cell grammar), and a list
// quantifier for Mỗi phần tử.

export const QUANTS: { op: Quant; word: string; gloss: string }[] = [
  { op: 'some', word: 'Có ít nhất một', gloss: 'some: có ít nhất một phần tử khớp' },
  { op: 'all', word: 'Tất cả', gloss: 'all: mọi phần tử đều khớp' },
  { op: 'none', word: 'Không có', gloss: 'none: không phần tử nào khớp' },
];

export function factText(v: unknown): string {
  if (Array.isArray(v)) return `${v.length} phần tử`;
  if (typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean') return formatScalar(v as Scalar);
  return JSON.stringify(v);
}



function valueOf(leaf: CompareNode): string {
  return Array.isArray(leaf.value) ? leaf.value.map(scalarText).join(', ') : scalarText(leaf.value as Scalar);
}

function useFocusOn(signal: number, ref: RefObject<HTMLElement | null>) {
  const first = useRef(signal);
  useEffect(() => {
    if (signal !== first.current) ref.current?.focus();
  }, [signal, ref]);
}

export function ContactForm(props: {
  fields: InputField[];
  initial?: CompareNode;
  focus: number;
  submitLabel: string;
  onSubmit: (node: AstNode) => void;
  onCancel?: () => void;
  /** Rendered above the field, inside the form (a new frame's quantifier and list). */
  prefix?: ReactNode;
}) {
  const { fields, initial } = props;
  const uid = useId();
  const [name, setName] = useState(() => (initial && fields.some((f) => f.name === initial.path) ? initial.path : (fields[0]?.name ?? '')));
  const field = fields.find((f) => f.name === name) ?? fields[0];
  // A range is two comparisons: in the graph it is two Điều kiện nodes under a VÀ.
  const choices = field ? opChoices(field).filter((o) => o !== 'any' && o !== 'range') : [];
  const [op, setOp] = useState<OpChoice>(() => (initial ? (initial.op as OpChoice) : '=='));
  const [value, setValue] = useState(() => (initial ? valueOf(initial) : ''));
  const [error, setError] = useState<string | null>(null);
  const fieldRef = useRef<HTMLSelectElement>(null);
  const valueRef = useRef<HTMLInputElement>(null);
  useFocusOn(props.focus, initial ? valueRef : fieldRef);
  // A fresh form (a new contact) opens on its first field.
  useEffect(() => {
    if (!initial) fieldRef.current?.focus();
  }, [initial]);

  if (!field) return <p className="inspect__note">Không có trường nào để so sánh ở đây.</p>;
  const shownOp: OpChoice = (choices as OpChoice[]).includes(op) ? op : '==';
  const text = joinCell(shownOp, value);
  const parsed = value.trim() ? parseCell(text, field) : null;
  const preview = parsed?.ok && parsed.ast ? describeAst(parsed.ast) : null;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!value.trim()) {
      setError('Thiếu giá trị để so sánh');
      valueRef.current?.focus();
      return;
    }
    if (!parsed?.ok || !parsed.ast) {
      setError(parsed && !parsed.ok ? parsed.error : 'Thiếu giá trị');
      valueRef.current?.focus();
      return;
    }
    setError(null);
    props.onSubmit(parsed.ast);
  }

  const unchanged = !!initial && !!parsed?.ok && !!parsed.ast && describeAst(parsed.ast) === describeAst(initial);

  return (
    <form
      className="cform__form"
      onSubmit={submit}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && props.onCancel) {
          e.preventDefault();
          e.stopPropagation();
          props.onCancel();
        }
      }}
    >
      {props.prefix}
      <label className="detail__label" htmlFor={`${uid}-field`}>
        Trường
      </label>
      <select
        ref={fieldRef}
        id={`${uid}-field`}
        className="cform__select"
        value={field.name}
        onChange={(e) => {
          setName(e.target.value);
          setError(null);
        }}
      >
        {fields.map((f) => (
          <option key={f.name} value={f.name}>
            {f.name} · {f.label}
            {f.unit ? ` (${f.unit})` : ''}
          </option>
        ))}
      </select>
      <div className="cform__pair">
        <div>
          <label className="detail__label" htmlFor={`${uid}-op`}>
            Toán tử
          </label>
          <select id={`${uid}-op`} className="cform__select" value={shownOp} onChange={(e) => setOp(e.target.value as OpChoice)}>
            {choices.map((o) => (
              <option key={o} value={o}>
                {OP_LABEL[o]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="detail__label" htmlFor={`${uid}-value`}>
            Giá trị
          </label>
          <input
            ref={valueRef}
            id={`${uid}-value`}
            className="detail__input cform__value"
            value={value}
            spellCheck={false}
            autoComplete="off"
            placeholder={shownOp === 'in' || shownOp === 'not_in' ? 'GOLD, SILVER' : field.type === 'number' ? '300000' : 'GOLD'}
            aria-invalid={error ? true : undefined}
            aria-describedby={`${uid}-tip`}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
            }}
          />
        </div>
      </div>
      <p id={`${uid}-tip`} className="cform__tip" role={error ? 'alert' : undefined}>
        {error ? (
          <span className="detail__error">{error}</span>
        ) : parsed && !parsed.ok ? (
          <span className="detail__error">{parsed.error}</span>
        ) : preview ? (
          <>
            Tiếp điểm đọc là <code>{preview}</code>
          </>
        ) : (
          <>{field.type === 'number' ? 'Số viết 300000 hoặc 300.000.' : 'Chuỗi có khoảng trắng đặt trong ngoặc kép.'} Nhiều giá trị cách nhau bằng dấu phẩy.</>
        )}
      </p>
      <div className="detail__row">
        <button type="submit" className="btn btn--primary" disabled={unchanged}>
          {props.submitLabel}
        </button>
        {props.onCancel && (
          <button type="button" className="btn btn--secondary" onClick={props.onCancel}>
            Huỷ
          </button>
        )}
      </div>
    </form>
  );
}

export function QuantPicker({ op, list, lists, onOp, onList, focusRef }: {
  op: Quant;
  list: string;
  lists: InputField[];
  onOp: (op: Quant) => void;
  onList: (list: string) => void;
  focusRef?: RefObject<HTMLSelectElement | null>;
}) {
  const uid = useId();
  return (
    <>
      <label className="detail__label" htmlFor={`${uid}-list`}>
        Danh sách
      </label>
      <select ref={focusRef} id={`${uid}-list`} className="cform__select" value={list} onChange={(e) => onList(e.target.value)}>
        {lists.map((f) => (
          <option key={f.name} value={f.name}>
            {f.name} · {f.label}
          </option>
        ))}
      </select>
      <fieldset className="cform__quants">
        <legend className="detail__label">Khung thông khi</legend>
        {QUANTS.map((q) => (
          <label key={q.op} className="cform__quant">
            <input type="radio" name={`${uid}-q`} value={q.op} checked={op === q.op} onChange={() => onOp(q.op)} />
            <span>{q.gloss}</span>
          </label>
        ))}
      </fieldset>
    </>
  );
}

