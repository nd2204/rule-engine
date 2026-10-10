import { parseNumber } from '../../domain/cell';
import type { InputField, SimFact } from '../../domain/types';

/** A Fact Batch as read from pasted text or a file. It lives in the open page only. */
export interface FactBatch {
  name: string;
  facts: SimFact[];
  /** Rows left out while reading, by their row number in the source. */
  skipped: { row: number; message: string }[];
}

export const BATCH_MAX = 10000;
/** Above this many Facts a run is started by hand, and older results say they are stale. */
export const AUTO_RUN_MAX = 2000;

export const batchKey = (row: number) => `#${String(row).padStart(4, '0')}`;

type Read = { batch: FactBatch } | { error: string };

/** Reads JSON (an array of Facts, or one Fact per line) or CSV with a header row of field names. */
export function readBatch(text: string, name: string, inputs: InputField[]): Read {
  const trimmed = text.trim();
  if (!trimmed) return { error: 'Chưa có nội dung. Dán Facts hoặc chọn một tệp .json / .csv.' };
  const rows = trimmed.startsWith('[') || trimmed.startsWith('{') ? readJson(trimmed) : readCsv(trimmed, inputs);
  if ('error' in rows) return rows;
  if (rows.facts.length + rows.skipped.length > BATCH_MAX) {
    return { error: `Fact Batch tối đa ${BATCH_MAX.toLocaleString('vi-VN')} Facts; nội dung này có ${(rows.facts.length + rows.skipped.length).toLocaleString('vi-VN')} dòng.` };
  }
  if (rows.facts.length === 0) {
    return { error: rows.skipped.length ? `Không đọc được dòng nào. Dòng ${rows.skipped[0].row}: ${rows.skipped[0].message}` : 'Không có Fact nào.' };
  }
  return { batch: { name, ...rows } };
}

function isFact(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function readJson(text: string): Omit<FactBatch, 'name'> | { error: string } {
  let values: unknown[];
  if (text.startsWith('[')) {
    try {
      const parsed: unknown = JSON.parse(text);
      if (!Array.isArray(parsed)) return { error: 'JSON cần là một mảng Facts.' };
      values = parsed;
    } catch (e) {
      return { error: `JSON không hợp lệ: ${(e as Error).message}` };
    }
  } else {
    // One Fact per line (NDJSON), or a single Fact object.
    const lines = text.split(/\r?\n/);
    values = [];
    try {
      const single: unknown = JSON.parse(text);
      values = [single];
    } catch {
      for (const [i, line] of lines.entries()) {
        if (!line.trim()) {
          values.push(undefined);
          continue;
        }
        try {
          values.push(JSON.parse(line));
        } catch {
          values.push(new SyntaxError(`dòng ${i + 1} không phải JSON`));
        }
      }
    }
  }
  const facts: SimFact[] = [];
  const skipped: FactBatch['skipped'] = [];
  values.forEach((v, i) => {
    const row = i + 1;
    if (v === undefined) return;
    if (v instanceof SyntaxError) skipped.push({ row, message: 'không phải JSON' });
    else if (!isFact(v)) skipped.push({ row, message: 'không phải một object Fact' });
    else facts.push({ key: batchKey(row), source: 'batch', facts: v });
  });
  return { facts, skipped };
}

/** RFC 4180 fields; the delimiter is a comma or, as spreadsheets in vi-VN export, a semicolon. */
function splitCsv(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === delimiter) {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += c;
  }
  row.push(field);
  rows.push(row);
  return rows;
}

function readCsv(text: string, inputs: InputField[]): Omit<FactBatch, 'name'> | { error: string } {
  const firstLine = text.split(/\r?\n/, 1)[0];
  const delimiter = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ';' : ',';
  const [header, ...body] = splitCsv(text, delimiter);
  const names = header.map((h) => h.trim());
  const byName = new Map(inputs.map((f) => [f.name, f]));
  if (!names.some((n) => byName.has(n))) {
    return { error: `Dòng tiêu đề CSV cần tên trường của input schema, ví dụ ${inputs.slice(0, 3).map((f) => f.name).join(delimiter)}.` };
  }
  const facts: SimFact[] = [];
  const skipped: FactBatch['skipped'] = [];
  body.forEach((cells, i) => {
    const row = i + 1;
    if (cells.every((c) => c.trim() === '')) return;
    const fact: Record<string, unknown> = {};
    for (const [j, name] of names.entries()) {
      const raw = (cells[j] ?? '').trim();
      // A blank cell means the Fact lacks the field, as in the Test Case form.
      if (raw === '' || !name) continue;
      const field = byName.get(name);
      if (!field || field.type === 'string') fact[name] = raw;
      else if (field.type === 'number') {
        const n = parseNumber(raw);
        if (n === null) {
          skipped.push({ row, message: `${name} “${raw}” không phải số` });
          return;
        }
        fact[name] = n;
      } else if (field.type === 'boolean') {
        if (raw !== 'true' && raw !== 'false') {
          skipped.push({ row, message: `${name} cần true hoặc false` });
          return;
        }
        fact[name] = raw === 'true';
      } else {
        try {
          const v: unknown = JSON.parse(raw);
          if (!Array.isArray(v)) throw new Error();
          fact[name] = v;
        } catch {
          skipped.push({ row, message: `${name} cần một danh sách JSON` });
          return;
        }
      }
    }
    facts.push({ key: batchKey(row), source: 'batch', facts: fact });
  });
  return { facts, skipped };
}
