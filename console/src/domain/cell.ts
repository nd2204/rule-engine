import type { AstNode, Cell, CompareOp, InputField, Scalar } from './types';

// Cell grammar (provisional, see the surface brief's open decisions):
//   -  or empty          any value
//   >= 1000000           comparison: == != > < >= <=   (a bare value means ==)
//   in [GOLD, SILVER]    membership, also not_in
//   [5000000..20000000)  interval, brackets choose inclusive / exclusive bounds

export type ParseResult = { ok: true; ast: AstNode | null } | { ok: false; error: string };

const COMPARE_OPS = ['>=', '<=', '!=', '==', '>', '<'] as const;

function parseNumber(raw: string): number | null {
  let s = raw.replace(/[\s_]/g, '');
  if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
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
  for (const candidate of COMPARE_OPS) {
    if (t.startsWith(candidate)) {
      op = candidate;
      rest = t.slice(candidate.length);
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
