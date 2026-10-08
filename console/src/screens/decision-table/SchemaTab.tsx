import type { InputField, RuleSet, TestCase } from '../../domain/types';

const TYPE_LABEL: Record<string, string> = { number: 'number', string: 'string', boolean: 'boolean', list: 'list' };

function InputRows({ fields, depth = 0 }: { fields: InputField[]; depth?: number }) {
  return (
    <>
      {fields.map((f) => (
        <FieldRow key={`${depth}-${f.name}`} field={f} depth={depth} />
      ))}
    </>
  );
}

function FieldRow({ field, depth }: { field: InputField; depth: number }) {
  return (
    <>
      <tr>
        <td>
          <code className="ledger__field" style={depth ? { paddingLeft: `${depth * 16}px` } : undefined}>
            {depth > 0 && <span aria-hidden="true">└ </span>}
            {field.name}
          </code>
        </td>
        <td>{TYPE_LABEL[field.type]}</td>
        <td>{field.required ? <span className="ledger__req">bắt buộc</span> : <span className="ledger__muted">tuỳ chọn</span>}</td>
        <td>
          {field.label}
          {field.unit && <span className="ledger__muted"> · {field.unit}</span>}
        </td>
      </tr>
      {field.itemFields && <InputRows fields={field.itemFields} depth={depth + 1} />}
    </>
  );
}

/** Schema tab, primary: the input schema contract and the outputs a caller reads back. */
export function SchemaTab({ ruleSet }: { ruleSet: RuleSet }) {
  return (
    <div className="ledger-stack">
      <section aria-labelledby="schema-in">
        <h2 id="schema-in" className="section-title">
          Input · Fact <span className="section-title__count">{ruleSet.inputs.length}</span>
        </h2>
        <div className="ledger-frame">
          <table className="ledger">
            <thead>
              <tr>
                <th scope="col">Trường</th>
                <th scope="col">Kiểu</th>
                <th scope="col">Bắt buộc</th>
                <th scope="col">Ý nghĩa</th>
              </tr>
            </thead>
            <tbody>
              <InputRows fields={ruleSet.inputs} />
            </tbody>
          </table>
        </div>
        <p className="ledger__hint">Thiếu một trường trong Fact thì điều kiện trên trường đó là false, kèm cảnh báo trong Evaluation Trace.</p>
      </section>

      <section aria-labelledby="schema-out">
        <h2 id="schema-out" className="section-title">
          Output · Decision Result <span className="section-title__count">{ruleSet.outputs.length}</span>
        </h2>
        <div className="ledger-frame">
          <table className="ledger">
            <thead>
              <tr>
                <th scope="col">Trường</th>
                <th scope="col">Kiểu</th>
                <th scope="col">Ý nghĩa</th>
              </tr>
            </thead>
            <tbody>
              {ruleSet.outputs.map((f) => (
                <tr key={f.name}>
                  <td>
                    <code className="ledger__field">{f.name}</code>
                  </td>
                  <td>{f.type}</td>
                  <td>
                    {f.label}
                    {f.unit && <span className="ledger__muted"> · {f.unit}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/** Schema tab, inspector: a real Fact from a Test Case, as a caller would send it. */
export function SchemaInspector({ testCases }: { testCases: TestCase[] | null }) {
  const sample = testCases?.[0];
  return (
    <section className="inspect" aria-labelledby="inspect-facts">
      <header className="inspect__head">
        <h2 id="inspect-facts" className="inspect__title">
          Fact mẫu
        </h2>
        <p className="inspect__sub">{sample ? `${sample.id} · ${sample.name}` : 'Chưa có Test Case'}</p>
      </header>
      {sample ? (
        <pre className="inspect__code" tabIndex={0} aria-label={`Fact của ${sample.id}`}>
          {JSON.stringify(sample.facts, null, 2)}
        </pre>
      ) : (
        <p className="inspect__note">{testCases ? 'Thêm một Test Case ở tab Rules để có Fact mẫu.' : 'Đang tải Test Case…'}</p>
      )}
    </section>
  );
}
