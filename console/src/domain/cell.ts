import type { AstNode, Cell, CompareOp, InputField, Scalar } from './types';

// Cell grammar (provisional, see the surface brief's open decisions):
//   -  or empty          any value
//   >= 1000000           comparison: == != > < >= <=, also = ≠ ≥ ≤ as typed   (a bare value means ==;
//                        the cell editor keeps the cell's previous operator instead, see splitCell)
//   in [GOLD, SILVER]    membership, also not_in
//   [5000000..20000000)  interval, brackets choose inclusive / exclusive bounds

export type ParseResult = { ok: true; ast: AstNode | null } | { ok: false; error: string };

const COMPARE_OPS = ['>=', '<=', '!=', '==', '>', '<'] as const;

// What an author may type for each operator; the display symbols (≥ ≤ ≠) read back as typed input too.
const OP_ALIASES: [string, CompareOp][] = [
  ['>=', '>='],
  ['≥', '>='],
  ['<=', '<='],
  ['≤', '<='],
  ['!=', '!='],
  ['≠', '!='],
  ['==', '=='],
  ['=', '=='],
  ['>', '>'],
  ['<', '<'],
];

export function parseNumber(raw: string): number | null {
  let s = raw.replace(/[\s_]/g, '');
  // Grouped thousands either way round (1.000.000 or 1,000,000) are whole numbers;
  // otherwise a single comma is the Vietnamese decimal mark (2,5).
  if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  else if (/^-?\d{1,3}(,\d{3})+$/.test(s)) s = s.replace(/,/g, '');
  else s = s.replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  return Number(s);
}

function parseScalar(raw: string, field: InputField): Scalar | { error: string } {
  const s = raw.trim();
  if (!s) return { error: 'Thiếu giá trị sau toán tử' };
  if (field.type === 'number') {
    const n = parseNumber(s);
    return n === null ? { error: `“${s}” không phải số` } : n;
  }
  if (field.type === 'boolean') {
    if (s === 'true' || s === 'đúng') return true;
    if (s === 'false' || s === 'sai') return false;
    return { error: 'Trường boolean chỉ nhận true hoặc false' };
  }
  const quoted = /^"(.*)"$/.exec(s);
  if (quoted) return quoted[1];
  if (!/^[\p{L}\p{N}_-]+$/u.test(s)) return { error: 'Chuỗi có khoảng trắng hoặc ký tự đặc biệt cần đặt trong ngoặc kép' };
  return s;
}

export function parseCell(text: string, field: InputField): ParseResult {
  const t = text.trim();
  if (t === '' || t === '-') return { ok: true, ast: null };
  if (field.type === 'list') return { ok: false, error: 'Trường danh sách cần điều kiện some / all / none dạng JSON AST' };

  const interval = /^([[(])\s*(.+?)\s*\.\.\s*(.+?)\s*([\])])$/.exec(t);
  if (interval) {
    if (field.type !== 'number') return { ok: false, error: 'Khoảng chỉ dùng cho trường số' };
    const lo = parseNumber(interval[2]);
    const hi = parseNumber(interval[3]);
    if (lo === null || hi === null) return { ok: false, error: 'Cận của khoảng phải là số' };
    if (lo >= hi) return { ok: false, error: 'Cận dưới phải nhỏ hơn cận trên' };
    return {
      ok: true,
      ast: {
        op: 'and',
        args: [
          { op: interval[1] === '[' ? '>=' : '>', path: field.name, value: lo },
          { op: interval[4] === ']' ? '<=' : '<', path: field.name, value: hi },
        ],
      },
    };
  }

  if (/^[[(]/.test(t)) return { ok: false, error: 'Khoảng viết dạng [cận dưới..cận trên), ví dụ [100..500)' };

  const member = /^(not_in|in)\s*\[(.*)\]$/.exec(t);
  if (member) {
    const parts = member[2].split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length === 0) return { ok: false, error: 'Danh sách rỗng' };
    const values: Scalar[] = [];
    for (const p of parts) {
      const v = parseScalar(p, field);
      if (typeof v === 'object') return { ok: false, error: v.error };
      values.push(v);
    }
    return { ok: true, ast: { op: member[1] as CompareOp, path: field.name, value: values } };
  }

  let op: CompareOp = '==';
  let rest = t;
  for (const [typed, canonical] of OP_ALIASES) {
    if (t.startsWith(typed)) {
      op = canonical;
      rest = t.slice(typed.length);
      break;
    }
  }
  if ((op === '>' || op === '<' || op === '>=' || op === '<=') && field.type !== 'number') {
    return { ok: false, error: `Toán tử ${op} chỉ dùng cho trường số` };
  }
  const v = parseScalar(rest, field);
  if (typeof v === 'object') return { ok: false, error: v.error };
  return { ok: true, ast: { op, path: field.name, value: v } };
}

// ---------- editor: operator picker ----------

/** The operators the cell editor offers, per field type. `range` is the interval form, `any` the "-" cell. */
export type OpChoice = 'any' | (typeof COMPARE_OPS)[number] | 'in' | 'not_in' | 'range';

export const OP_LABEL: Record<OpChoice, string> = {
  any: 'bất kỳ',
  '==': '=',
  '!=': '≠',
  '>': '>',
  '>=': '≥',
  '<': '<',
  '<=': '≤',
  in: 'in',
  not_in: 'not in',
  range: 'khoảng',
};

export function opChoices(field: InputField): OpChoice[] {
  if (field.type === 'number') return ['==', '>=', '>', '<=', '<', '!=', 'range', 'in', 'not_in', 'any'];
  if (field.type === 'boolean') return ['==', '!=', 'any'];
  return ['==', '!=', 'in', 'not_in', 'any'];
}

/** Splits typed cell text into its operator and value. `op` is null when the author typed a bare value. */
export function splitCell(text: string): { op: OpChoice | null; value: string } {
  const t = text.trim();
  if (t === '' || t === '-') return { op: 'any', value: '' };
  if (/^[[(]/.test(t)) return { op: 'range', value: t };
  const member = /^(not_in|not in|in)\s*\[(.*)\]?$/.exec(t);
  if (member) return { op: member[1] === 'in' ? 'in' : 'not_in', value: member[2].replace(/\]$/, '').trim() };
  for (const [typed, canonical] of OP_ALIASES) {
    if (t.startsWith(typed)) return { op: canonical as OpChoice, value: t.slice(typed.length).trim() };
  }
  return { op: null, value: t };
}

/** Rebuilds cell text from an operator and a value, in the grammar parseCell reads. */
export function joinCell(op: OpChoice, value: string): string {
  const v = value.trim();
  switch (op) {
    case 'any':
      return '-';
    case 'range':
      return /^[[(]/.test(v) ? v : `[${v}..)`;
    case 'in':
    case 'not_in':
      return `${op} [${v}]`;
    case '==':
      return v;
    default:
      return `${op} ${v}`;
  }
}

function editScalar(v: Scalar): string {
  if (typeof v === 'number') return formatScalar(v);
  if (typeof v === 'string' && !/^[\p{L}\p{N}_-]+$/u.test(v)) return `"${v}"`;
  return String(v);
}

/** The text the cell editor opens with: the table's own reading (≥ 1.000.000), in a form parseCell reads back. */
export function editText(cell: Cell | undefined, field: InputField): string {
  if (isAnyCell(cell)) return '-';
  if (cell!.kind === 'ast') return '';
  const parsed = parseCell(cell!.text, field);
  if (!parsed.ok || !parsed.ast) return cell!.text;
  const ast = parsed.ast;
  if (ast.op === 'and' && ast.args.length === 2) {
    const [a, b] = ast.args;
    if ('value' in a && 'value' in b && typeof a.value === 'number' && typeof b.value === 'number') {
      return `${a.op === '>=' ? '[' : '('}${formatScalar(a.value)}..${formatScalar(b.value)}${b.op === '<=' ? ']' : ')'}`;
    }
  }
  if (!('value' in ast)) return cell!.text;
  if (Array.isArray(ast.value)) return `${ast.op} [${ast.value.map(editScalar).join(', ')}]`;
  const v = editScalar(ast.value);
  return ast.op === '==' ? v : `${OP_SYMBOL[ast.op]} ${v}`;
}

/** Two cell texts that parse to the same condition are the same edit. */
export function sameCondition(a: string, b: string, field: InputField): boolean {
  const pa = parseCell(a, field);
  const pb = parseCell(b, field);
  return pa.ok && pb.ok ? JSON.stringify(pa.ast) === JSON.stringify(pb.ast) : a.trim() === b.trim();
}

/** "field op value" for one cell, as a sentence fragment; null when the cell means "any". */
export function conditionReading(cell: Cell | undefined, field: InputField): string | null {
  const t = describeCell(cell, field);
  if (!t) return null;
  if (cell?.kind === 'ast') return t;
  return `${field.name} ${/^[=≠<>≥≤[(]|^in |^not in /.test(t) ? t : `= ${t}`}`;
}

/** Typing hint under the cell editor: what this field type accepts. */
export function cellHint(field: InputField): string {
  if (field.type === 'number') return 'Gõ 800000, ≥ 800000, [100..500) hoặc in [1, 2]. Dấu - là bất kỳ.';
  if (field.type === 'boolean') return 'Gõ true hoặc false. Dấu - là bất kỳ.';
  return 'Gõ GOLD, ≠ GOLD hoặc in [GOLD, SILVER]; chuỗi có khoảng trắng đặt trong ngoặc kép. Dấu - là bất kỳ.';
}

export function cellAst(cell: Cell | undefined, field: InputField): AstNode | null {
  if (!cell) return null;
  if (cell.kind === 'ast') return cell.ast;
  const parsed = parseCell(cell.text, field);
  return parsed.ok ? parsed.ast : null;
}

export function isAnyCell(cell: Cell | undefined): boolean {
  return !cell || (cell.kind === 'expr' && (cell.text.trim() === '' || cell.text.trim() === '-'));
}

// ---------- display ----------

const numberFormat = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 });

export function formatScalar(v: Scalar | null | undefined): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'number') return numberFormat.format(v);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return v;
}

const OP_SYMBOL: Record<CompareOp, string> = {
  '==': '=',
  '!=': '≠',
  '>': '>',
  '<': '<',
  '>=': '≥',
  '<=': '≤',
  in: 'in',
  not_in: 'not in',
};

/** Human reading of a condition. `column` omits the path when it is the cell's own field. */
export function describeAst(node: AstNode, column?: string): string {
  switch (node.op) {
    case 'and':
    case 'or': {
      const join = node.op === 'and' ? ' và ' : ' hoặc ';
      return node.args.map((a) => describeAst(a, column)).join(join);
    }
    case 'not':
      return `không (${describeAst(node.arg, column)})`;
    case 'some':
    case 'all':
    case 'none':
      return `${node.op} ${node.path}: ${describeAst(node.where)}`;
    default: {
      const value = Array.isArray(node.value) ? node.value.map(formatScalar).join(', ') : formatScalar(node.value);
      const subject = node.path === column ? '' : `${node.path} `;
      if (node.op === '==' && subject === '') return value;
      return `${subject}${OP_SYMBOL[node.op]} ${value}`;
    }
  }
}

/** Display text for a cell, or null when the cell means "any". */
export function describeCell(cell: Cell | undefined, field: InputField): string | null {
  if (isAnyCell(cell)) return null;
  if (cell!.kind === 'ast') return describeAst(cell!.ast, field.name);
  const parsed = parseCell(cell!.text, field);
  if (!parsed.ok || !parsed.ast) return cell!.text;
  const interval = intervalReading(parsed.ast);
  return interval ?? describeAst(parsed.ast, field.name);
}

function intervalReading(ast: AstNode): string | null {
  if (ast.op !== 'and' || ast.args.length !== 2) return null;
  const [a, b] = ast.args;
  if (!('value' in a) || !('value' in b) || typeof a.value !== 'number' || typeof b.value !== 'number') return null;
  if (!(a.op === '>=' || a.op === '>') || !(b.op === '<' || b.op === '<=')) return null;
  return `${a.op === '>=' ? '[' : '('}${formatScalar(a.value)} … ${formatScalar(b.value)}${b.op === '<=' ? ']' : ')'}`;
}
